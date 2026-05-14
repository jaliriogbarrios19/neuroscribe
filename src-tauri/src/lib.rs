use serde::{Deserialize, Serialize};
use sqlx::{SqlitePool, sqlite::SqliteConnectOptions};
use tauri::{AppHandle, Manager, Emitter};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;
use uuid::Uuid;
use sysinfo::System;
use std::fs;
use std::str::FromStr;
use futures_util::StreamExt;
use tokio::io::AsyncWriteExt;

mod crypto;

// --- Structs de Datos ---

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct ApiKeyEntry {
    pub provider: String,
    pub masked_key: String,
    pub created_at: String,
}

#[derive(Serialize, Deserialize)]
pub struct TranscriptionResult {
    pub full_text: String,
    pub segments: Vec<TranscriptionSegment>,
    pub speakers: Vec<SpeakerInfo>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct TranscriptionSegment {
    pub speaker_id: String,
    pub speaker_label: String,
    pub text: String,
    pub start_ms: i64,
    pub end_ms: i64,
    pub confidence: f64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct SpeakerInfo {
    pub id: String,
    pub label: String,
    pub color: String,
}

#[derive(Serialize, Deserialize)]
pub struct LlmGenerateRequest {
    pub provider: String,
    pub prompt: String,
    pub model: Option<String>,
}

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct Profile {
    pub id: String,
    pub email: Option<String>,
    pub full_name: Option<String>,
    pub minutes_balance: i32,
    pub cc_balance: i32,
    pub created_at: String,
    pub license_key: Option<String>,
    #[sqlx(default)]
    pub trial_start_date: Option<String>,
    #[sqlx(default)]
    pub is_activated: bool,
    pub activation_token: Option<String>,
}

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct Folder {
    pub id: String,
    pub name: String,
    pub created_at: String,
    #[sqlx(default)]
    pub count: i32,
}

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct Document {
    pub id: String,
    pub folder_id: Option<String>,
    pub title: String,
    pub content: Option<String>,
    pub document_type: String,
    pub tokens_used: i32,
    pub created_at: String,
}

#[derive(Serialize, Deserialize)]
pub struct HardwareInfo {
    pub total_ram_gb: u64,
    pub available_ram_gb: u64,
    pub cpu_cores: usize,
    pub recommended_model: String,
}

#[derive(Serialize, Deserialize)]
pub struct WhisperOutput {
    pub text: String,
    pub segments: Vec<WhisperSegment>,
}

#[derive(Serialize, Deserialize)]
pub struct WhisperSegment {
    pub text: String,
    pub start: f64,
    pub end: f64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Author {
    pub name: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct AcademicWork {
    pub doi: String,
    pub title: String,
    pub authors: Vec<Author>,
    pub year: i32,
    pub journal: String,
    pub abstract_text: String,
    pub relevance_score: f32,
    pub url: String,
    pub mesh_terms: Vec<String>,
}

#[derive(Deserialize)]
struct PubMedESearchResponse {
    esearchresult: PubMedESearchResult,
}

#[derive(Deserialize)]
struct PubMedESearchResult {
    idlist: Vec<String>,
}

#[derive(Deserialize)]
struct PubMedESummaryResponse {
    result: PubMedESummaryResult,
}

#[derive(Deserialize)]
struct PubMedESummaryResult {
    #[serde(flatten)]
    items: std::collections::HashMap<String, PubMedArticle>,
}

#[derive(Deserialize)]
struct PubMedArticle {
    title: String,
    pubdate: String,
    fulljournalname: String,
    authors: Vec<PubMedAuthor>,
    articleids: Vec<PubMedArticleId>,
}

#[derive(Deserialize)]
struct PubMedAuthor {
    name: String,
}

#[derive(Deserialize)]
struct PubMedArticleId {
    idtype: String,
    value: String,
}

#[derive(Deserialize)]
struct OpenAlexResponse {
    results: Vec<OpenAlexWork>,
}

#[derive(Deserialize)]
struct OpenAlexWork {
    doi: Option<String>,
    title: Option<String>,
    display_name: Option<String>,
    publication_year: Option<i32>,
    host_venue: Option<OpenAlexVenue>,
    authorships: Option<Vec<OpenAlexAuthorship>>,
    relevance_score: Option<f32>,
}

#[derive(Deserialize)]
struct OpenAlexVenue {
    display_name: Option<String>,
}

#[derive(Deserialize)]
struct OpenAlexAuthorship {
    author: OpenAlexAuthor,
}

#[derive(Deserialize)]
struct OpenAlexAuthor {
    display_name: String,
}

#[derive(Clone, Serialize)]
pub struct ProgressPayload {
    pub progress: i32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ResearchArticle {
    pub title: String,
    pub authors: Vec<String>,
    pub year: i32,
    pub abstract_text: String,
    pub full_content: Option<String>,
    pub doi: String,
}

// --- Comandos de Licencia ---

#[tauri::command]
fn get_hardware_id() -> String {
    let mut sys = System::new_all();
    sys.refresh_all();
    let cpu = sys.cpus().first().map(|c| c.brand()).unwrap_or("Unknown").to_string();
    let total_memory = sys.total_memory().to_string();
    let os = std::env::consts::OS.to_string();
    format!("{}-{}-{}", cpu, total_memory, os).replace(" ", "_")
}

#[tauri::command]
async fn activate_license(key: String, state: tauri::State<'_, SqlitePool>) -> Result<bool, String> {
    if !key.starts_with("NS-") || key.len() < 10 {
        return Err("Formato de License Key inválido.".to_string());
    }
    let hw_id = get_hardware_id();
    let activation_token = format!("token_{}_{}", key, hw_id);
    sqlx::query("UPDATE profiles SET license_key = ?, is_activated = 1, activation_token = ? WHERE id = 'local-user'")
        .bind(&key)
        .bind(&activation_token)
        .execute(&*state)
        .await
        .map_err(|e| e.to_string())?;
    Ok(true)
}

// --- Comandos de API Keys ---

#[tauri::command]
async fn save_api_key(provider: String, key: String, state: tauri::State<'_, SqlitePool>) -> Result<ApiKeyEntry, String> {
    if key.trim().is_empty() {
        return Err("API key no puede estar vacia.".to_string());
    }
    let hw_id = get_hardware_id();
    let (iv_b64, ct_b64) = crypto::encrypt(&key, &hw_id)?;

    sqlx::query("INSERT INTO api_keys (provider, iv, ciphertext, updated_at) VALUES (?, ?, ?, datetime('now')) ON CONFLICT(provider) DO UPDATE SET iv = excluded.iv, ciphertext = excluded.ciphertext, updated_at = excluded.updated_at")
        .bind(&provider)
        .bind(&iv_b64)
        .bind(&ct_b64)
        .execute(&*state)
        .await
        .map_err(|e| e.to_string())?;

    Ok(ApiKeyEntry {
        provider: provider.clone(),
        masked_key: crypto::mask_key(&key),
        created_at: chrono::Utc::now().to_rfc3339(),
    })
}

#[tauri::command]
async fn get_api_keys(state: tauri::State<'_, SqlitePool>) -> Result<Vec<ApiKeyEntry>, String> {
    let rows = sqlx::query_as::<_, (String, String, String, String)>(
        "SELECT provider, iv, ciphertext, created_at FROM api_keys ORDER BY provider"
    )
    .fetch_all(&*state)
    .await
    .map_err(|e| e.to_string())?;

    let hw_id = get_hardware_id();
    let mut entries = Vec::new();

    for (provider, iv_b64, ct_b64, created_at) in rows {
        match crypto::decrypt(&iv_b64, &ct_b64, &hw_id) {
            Ok(decrypted) => {
                entries.push(ApiKeyEntry {
                    provider,
                    masked_key: crypto::mask_key(&decrypted),
                    created_at,
                });
            }
            Err(_) => {
                entries.push(ApiKeyEntry {
                    provider,
                    masked_key: "[error al descifrar]".to_string(),
                    created_at,
                });
            }
        }
    }

    Ok(entries)
}

#[tauri::command]
async fn delete_api_key(provider: String, state: tauri::State<'_, SqlitePool>) -> Result<bool, String> {
    let rows = sqlx::query("DELETE FROM api_keys WHERE provider = ?")
        .bind(&provider)
        .execute(&*state)
        .await
        .map_err(|e| e.to_string())?;

    Ok(rows.rows_affected() > 0)
}

// --- Comandos de Investigación ---

#[tauri::command]
async fn verify_doi_local(doi: String, state: tauri::State<'_, SqlitePool>) -> Result<bool, String> {
    let client = reqwest::Client::new();
    let email = get_decrypted_api_key("crossref", &state).await.unwrap_or_else(|_| "hola@neuroscribe.app".to_string());
    let url = format!("https://api.crossref.org/works/{}?mailto={}", doi, email);
    let res = client.get(url).send().await.map_err(|e| e.to_string())?;
    Ok(res.status().is_success())
}

#[tauri::command]
async fn get_academic_data_local(query: String, high_precision: bool, state: tauri::State<'_, SqlitePool>) -> Result<Vec<AcademicWork>, String> {
    let client = reqwest::Client::new();
    let mesh_query = if high_precision { format!("{}[MeSH Terms]", query) } else { query.clone() };
    let email = get_decrypted_api_key("crossref", &state).await.unwrap_or_else(|_| "hola@neuroscribe.app".to_string());
    let pubmed_key = get_decrypted_api_key("pubmed", &state).await.ok();

    let (pubmed_res, openalex_res) = tokio::join!(
        fetch_pubmed(&client, &mesh_query, pubmed_key.as_deref()),
        fetch_openalex(&client, &query, &email)
    );

    let mut combined = Vec::new();
    if let Ok(mut p) = pubmed_res { combined.append(&mut p); }
    if let Ok(mut o) = openalex_res { combined.append(&mut o); }

    let mut unique_works: std::collections::HashMap<String, AcademicWork> = std::collections::HashMap::new();
    for work in combined {
        let key = if !work.doi.is_empty() { work.doi.replace("https://doi.org/", "").to_lowercase() } else { work.title.to_lowercase() };
        unique_works.entry(key).or_insert(work);
    }

    let mut result: Vec<AcademicWork> = unique_works.into_values().collect();
    result.sort_by(|a, b| b.relevance_score.partial_cmp(&a.relevance_score).unwrap_or(std::cmp::Ordering::Equal));
    Ok(result.into_iter().take(15).collect())
}

async fn fetch_pubmed(client: &reqwest::Client, query: &str, api_key: Option<&str>) -> Result<Vec<AcademicWork>, String> {
    let mut url = format!("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term={}&retmode=json&retmax=10", query);
    if let Some(key) = api_key { url.push_str(&format!("&api_key={}", key)); }
    let res = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let search_data: PubMedESearchResponse = res.json().await.map_err(|e| e.to_string())?;
    let ids = search_data.esearchresult.idlist;
    if ids.is_empty() { return Ok(vec![]); }

    let mut summary_url = format!("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id={}&retmode=json", ids.join(","));
    if let Some(key) = api_key { summary_url.push_str(&format!("&api_key={}", key)); }
    if let Some(key) = api_key { summary_url.push_str(&format!("&api_key={}", key)); }
    let res_sum = client.get(&summary_url).send().await.map_err(|e| e.to_string())?;
    let summary_data: PubMedESummaryResponse = res_sum.json().await.map_err(|e| e.to_string())?;

    let mut works = Vec::new();
    for id in ids {
        if let Some(article) = summary_data.result.items.get(&id) {
            let doi = article.articleids.iter().find(|aid| aid.idtype == "doi").map(|aid| aid.value.clone()).unwrap_or_default();
            works.push(AcademicWork {
                doi: if doi.is_empty() { "".to_string() } else { format!("https://doi.org/{}", doi) },
                title: article.title.clone(),
                authors: article.authors.iter().map(|a| Author { name: a.name.clone() }).collect(),
                year: article.pubdate.split(' ').next().unwrap_or("0").parse().unwrap_or(0),
                journal: article.fulljournalname.clone(),
                abstract_text: "".to_string(),
                relevance_score: 0.9,
                url: if doi.is_empty() { format!("https://pubmed.ncbi.nlm.nih.gov/{}/", id) } else { format!("https://doi.org/{}", doi) },
                mesh_terms: vec![],
            });
        }
    }
    Ok(works)
}

async fn fetch_openalex(client: &reqwest::Client, query: &str, email: &str) -> Result<Vec<AcademicWork>, String> {
    let url = format!("https://api.openalex.org/works?search={}&mailto={}", query, email);
    let res = client.get(url).send().await.map_err(|e| e.to_string())?;
    let data: OpenAlexResponse = res.json().await.map_err(|e| e.to_string())?;
    let mut works = Vec::new();
    for work in data.results {
        works.push(AcademicWork {
            doi: work.doi.clone().unwrap_or_default(),
            title: work.title.or(work.display_name).unwrap_or_default(),
            authors: work.authorships.unwrap_or_default().iter().map(|a| Author { name: a.author.display_name.clone() }).collect(),
            year: work.publication_year.unwrap_or(0),
            journal: work.host_venue.and_then(|v| v.display_name).unwrap_or_default(),
            abstract_text: "".to_string(),
            relevance_score: work.relevance_score.unwrap_or(0.5),
            url: work.doi.unwrap_or_default(),
            mesh_terms: vec![],
        });
    }
    Ok(works)
}

// --- Comandos de Base de Datos ---

#[tauri::command]
async fn db_get_profile(state: tauri::State<'_, SqlitePool>) -> Result<Profile, String> {
    let mut profile = sqlx::query_as::<_, Profile>("SELECT * FROM profiles LIMIT 1").fetch_one(&*state).await.map_err(|e| e.to_string())?;
    if profile.trial_start_date.is_none() {
        profile.trial_start_date = Some(profile.created_at.clone());
    }
    Ok(profile)
}

#[tauri::command]
async fn db_get_folders(state: tauri::State<'_, SqlitePool>) -> Result<Vec<Folder>, String> {
    sqlx::query_as::<_, Folder>("SELECT f.*, COUNT(d.id) as count FROM folders f LEFT JOIN documents d ON f.id = d.folder_id GROUP BY f.id ORDER BY f.created_at DESC")
    .fetch_all(&*state).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn db_create_folder(name: &str, state: tauri::State<'_, SqlitePool>) -> Result<Folder, String> {
    let id = Uuid::new_v4().to_string();
    sqlx::query("INSERT INTO folders (id, name) VALUES (?, ?)").bind(&id).bind(name).execute(&*state).await.map_err(|e| e.to_string())?;
    sqlx::query_as::<_, Folder>("SELECT *, 0 as count FROM folders WHERE id = ?").bind(&id).fetch_one(&*state).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn db_get_documents(folder_id: Option<String>, state: tauri::State<'_, SqlitePool>) -> Result<Vec<Document>, String> {
    let q = if let Some(fid) = folder_id { 
        sqlx::query_as::<_, Document>("SELECT id, folder_id, title, content, type as document_type, tokens_used, created_at FROM documents WHERE folder_id = ? ORDER BY created_at DESC").bind(fid)
    } else { 
        sqlx::query_as::<_, Document>("SELECT id, folder_id, title, content, type as document_type, tokens_used, created_at FROM documents ORDER BY created_at DESC")
    };
    q.fetch_all(&*state).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn db_save_document(id: Option<String>, folder_id: Option<String>, title: &str, content: &str, doc_type: &str, tokens: i32, state: tauri::State<'_, SqlitePool>) -> Result<Document, String> {
    let final_id = id.unwrap_or_else(|| Uuid::new_v4().to_string());
    sqlx::query("INSERT INTO documents (id, folder_id, title, content, type, tokens_used) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET folder_id=excluded.folder_id, title=excluded.title, content=excluded.content, type=excluded.type, tokens_used=excluded.tokens_used")
    .bind(&final_id).bind(folder_id).bind(title).bind(content).bind(doc_type).bind(tokens).execute(&*state).await.map_err(|e| e.to_string())?;
    sqlx::query_as::<_, Document>("SELECT id, folder_id, title, content, type as document_type, tokens_used, created_at FROM documents WHERE id = ?").bind(&final_id).fetch_one(&*state).await.map_err(|e| e.to_string())
}

// --- Comandos de IA y Hardware ---

#[tauri::command]
fn get_hardware_info() -> HardwareInfo {
    let mut sys = System::new_all();
    sys.refresh_all();
    let total_ram = sys.total_memory() / 1024 / 1024 / 1024;
    let recommended = if total_ram >= 11 { "llama-3-8b".to_string() } else { "llama-3-8b-q4".to_string() };
    HardwareInfo { total_ram_gb: total_ram, available_ram_gb: sys.available_memory() / 1024 / 1024 / 1024, cpu_cores: sys.cpus().len(), recommended_model: recommended }
}

#[tauri::command]
fn check_models(handle: AppHandle) -> Result<serde_json::Value, String> {
    let app_dir = handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let models_dir = app_dir.join("models");
    Ok(serde_json::json!({
        "whisper_ready": models_dir.join("ggml-large-v3-turbo.bin").exists(),
        "llama_ready": models_dir.join("llama-3-8b-instruct.gguf").exists(),
        "biomed_ready": models_dir.join("biomedlm-2.7b.gguf").exists(),
        "models_path": models_dir.display().to_string()
    }))
}

#[tauri::command]
async fn generate_quick_answer_local(query: String, articles: Vec<ResearchArticle>, domain: String, state: tauri::State<'_, SqlitePool>, handle: AppHandle) -> Result<String, String> {
    check_license_internal(state).await?;
    let hw = get_hardware_info();
    let model_path = handle.path().app_data_dir().map_err(|e| e.to_string())?.join("models").join(if domain == "psychology" { "llama-3-8b-instruct.gguf" } else { "biomedlm-2.7b.gguf" });
    if !model_path.exists() { return Err("Modelo faltante.".to_string()); }
    let mut ev = String::new();
    for (i, a) in articles.iter().take(5).enumerate() { ev.push_str(&format!("\nFuente {}: {} ({})\nAbstract: {}\n", i+1, a.title, a.year, a.abstract_text)); }
    let prompt = format!("### System:\nSintetiza evidencia para {}.\n### User:\nQ: {}\nE:\n{}\n### Assistant:\nResp:", domain, query, ev);
    let out = handle.shell().sidecar("llama-cli").map_err(|e| e.to_string())?.args(["-m", &model_path.to_string_lossy(), "-p", &prompt, "-n", "1024", "-t", &hw.cpu_cores.to_string(), "--quiet"]).output().await.map_err(|e| e.to_string())?;
    Ok(String::from_utf8_lossy(&out.stdout).to_string())
}

#[tauri::command]
async fn generate_research_paper_local(articles: Vec<ResearchArticle>, domain: String, state: tauri::State<'_, SqlitePool>, handle: AppHandle) -> Result<String, String> {
    check_license_internal(state).await?;
    let hw = get_hardware_info();
    let model_path = handle.path().app_data_dir().map_err(|e| e.to_string())?.join("models").join("llama-3-8b-instruct.gguf");
    let prompt = format!("### System:\nGenera paper APA 7 para {}.\n### User:\nE: {:?}\n### Assistant:\nPaper:", domain, articles);
    let out = handle.shell().sidecar("llama-cli").map_err(|e| e.to_string())?.args(["-m", &model_path.to_string_lossy(), "-p", &prompt, "-n", "2048", "-t", &hw.cpu_cores.to_string(), "--quiet"]).output().await.map_err(|e| e.to_string())?;
    Ok(String::from_utf8_lossy(&out.stdout).to_string())
}

#[tauri::command]
async fn process_text_local(text: String, task: String, state: tauri::State<'_, SqlitePool>, handle: AppHandle) -> Result<String, String> {
    check_license_internal(state).await?;
    let hw = get_hardware_info();
    let model_path = handle.path().app_data_dir().map_err(|e| e.to_string())?.join("models").join(if task == "summary" { "biomedlm-2.7b.gguf" } else { "llama-3-8b-instruct.gguf" });
    let prompt = format!("### System:\nTask: {}\n### User:\n{}\n### Assistant:\n", task, text);
    let out = handle.shell().sidecar("llama-cli").map_err(|e| e.to_string())?.args(["-m", &model_path.to_string_lossy(), "-p", &prompt, "-n", "1024", "-t", &hw.cpu_cores.to_string(), "--quiet"]).output().await.map_err(|e| e.to_string())?;
    Ok(String::from_utf8_lossy(&out.stdout).to_string())
}

#[tauri::command(rename_all = "snake_case")]
async fn transcribe_audio_local(audio_path: String, state: tauri::State<'_, SqlitePool>, handle: AppHandle) -> Result<String, String> {
    println!("--- Iniciando TranscripciÃ³n Offline ---");
    
    // Timeout para la licencia para evitar bloqueos de DB
    println!("Verificando licencia...");
    tokio::time::timeout(std::time::Duration::from_secs(5), check_license_internal(state))
        .await
        .map_err(|_| "Timeout verificando licencia (la base de datos podrÃ­a estar bloqueada)".to_string())??;
    
    let app_dir = handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let model_path = app_dir.join("models").join("ggml-large-v3-turbo.bin");
    
    println!("Audio: {}", audio_path);
    println!("Modelo: {}", model_path.display());

    if !model_path.exists() {
        return Err("Error: El archivo del modelo Whisper no existe en la carpeta de modelos.".to_string());
    }

    let hw = get_hardware_info();
    let thread_count = (hw.cpu_cores as i32 - 1).max(1); // Usar casi todos los hilos disponibles para mÃ¡xima velocidad
    println!("Usando {} hilos para la transcripciÃ³n...", thread_count);

    let shell = handle.shell();
    let sidecar = shell.sidecar("whisper-cli").map_err(|e| format!("No se pudo encontrar el sidecar: {}", e))?;
    
    let (mut rx, _child) = sidecar
        .args([
            "-m", &model_path.to_string_lossy(),
            "-f", &audio_path,
            "-oj", 
            "-of", &format!("{}_out", audio_path),
            "-l", "auto",
            "--threads", &thread_count.to_string(),
            "--no-prints",
            "--print-progress" // Bandera para que reporte progreso en stderr
        ])
        .spawn()
        .map_err(|e| format!("Error al iniciar el proceso Whisper: {}", e))?;

    println!("Proceso Whisper lanzado con {} hilos. Esperando respuesta...", thread_count);
    let mut stderr_log = String::new();

    while let Some(event) = rx.recv().await {
        match event {
            CommandEvent::Stderr(line) => {
                let err_line = String::from_utf8_lossy(&line);
                // Si Whisper reporta progreso (ej. [00:01.000 -> 00:05.000]), enviarlo al frontend
                if err_line.contains(" -> ") {
                    let _ = handle.emit("transcription-progress", err_line.clone());
                }
                stderr_log.push_str(&err_line);
            }
            CommandEvent::Terminated(payload) => {
                println!("Whisper terminado con cÃ³digo: {:?}", payload.code);
                break;
            }
            _ => {}
        }
    }

    let json_path = format!("{}_out.json", audio_path);
    println!("Buscando resultado en: {}", json_path);

    if let Ok(json_content) = fs::read_to_string(&json_path) {
        let data: WhisperOutput = serde_json::from_str(&json_content)
            .map_err(|e| format!("Error en JSON de Whisper: {}. Stderr: {}", e, stderr_log))?;
        let _ = fs::remove_file(&json_path);
        println!("Â¡TranscripciÃ³n completada con Ã©xito!");
        Ok(data.text)
    } else {
        Err(format!("Whisper no generÃ³ el archivo JSON. Stderr: {}", stderr_log))
    }
}

#[tauri::command]
async fn check_mirror_health() -> bool {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(3))
        .build()
        .unwrap_or_default();
    
    // Ping al subdominio con una petición HEAD rápida
    match client.head("https://models.neuroscribe.app/health").send().await {
        Ok(res) => res.status().is_success() || res.status() == 404, // 404 es aceptable si el bucket existe pero el archivo health no
        Err(_) => false
    }
}

#[tauri::command]
async fn db_delete_model(model_name: &str, handle: AppHandle) -> Result<String, String> {
    let app_dir = handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let filename = match model_name {
        "whisper" => "ggml-large-v3-turbo.bin",
        "llama-3-8b" => "llama-3-8b-instruct.gguf",
        "biomed-2.7b" | "biomedlm-2.7b.gguf" => "biomedlm-2.7b.gguf",
        _ => return Err("Modelo desconocido".to_string()),
    };
    
    let path = app_dir.join("models").join(filename);
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
        Ok(format!("Modelo {} eliminado correctamente.", filename))
    } else {
        Err("El modelo no existe en disco.".to_string())
    }
}

#[tauri::command]
async fn download_model(model_name: &str, handle: AppHandle) -> Result<String, String> { 
    println!("--- Iniciando Descarga de Modelo: {} ---", model_name);
    
    let app_dir = handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let models_dir = app_dir.join("models");
    fs::create_dir_all(&models_dir).map_err(|e| e.to_string())?;

    let (filename, hf_url) = match model_name {
        "whisper" => (
            "ggml-large-v3-turbo.bin",
            "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin?download=true"
        ),
        "llama-3-8b" => (
            "llama-3-8b-instruct.gguf",
            "https://huggingface.co/bartowski/Meta-Llama-3-8B-Instruct-GGUF/resolve/main/Meta-Llama-3-8B-Instruct-Q4_K_M.gguf?download=true"
        ),
        "biomed-2.7b" | "biomedlm-2.7b.gguf" => (
            "biomedlm-2.7b.gguf",
            "https://huggingface.co/unsloth/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf?download=true"
        ),
        _ => return Err(format!("Modelo desconocido: {}", model_name)),
    };

    let dest_path = models_dir.join(filename);
    
    // Validación de integridad inicial
    if dest_path.exists() && fs::metadata(&dest_path).map(|m| m.len()).unwrap_or(0) > 1000000 {
        return Ok(format!("El modelo {} ya está listo.", filename));
    }

    let client = reqwest::Client::builder()
        .user_agent("NeuroScribe/1.0 (Desktop; Windows)")
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|e| e.to_string())?;

    // --- Estrategia Multisource ---
    let mirror_url = format!("https://models.neuroscribe.app/{}", filename);
    
    println!("Intentando descarga desde Espejo: {}", mirror_url);
    let mut response = match client.get(&mirror_url).send().await {
        Ok(res) if res.status().is_success() => {
            println!("Espejo disponible. Iniciando descarga rápida...");
            res
        },
        _ => {
            println!("Espejo no disponible o archivo no encontrado. Usando HuggingFace como fallback...");
            client.get(hf_url).send().await.map_err(|e| format!("Fallo total de conexión: {}", e))?
        }
    };

    if !response.status().is_success() {
        return Err(format!("Error del servidor ({}): {}", response.status(), filename));
    }

    let total_size = response.content_length().unwrap_or(0);
    let mut file = tokio::fs::File::create(&dest_path).await.map_err(|e| format!("No se pudo crear el archivo: {}", e))?;
    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();

    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|e| format!("Error en el flujo de datos: {}", e))?;
        file.write_all(&chunk).await.map_err(|e| format!("Error al escribir en disco: {}", e))?;
        downloaded += chunk.len() as u64;

        if total_size > 0 {
            let progress = (downloaded as f64 / total_size as f64 * 100.0) as i32;
            let _ = handle.emit("download-progress", progress);
        }
    }

    file.flush().await.map_err(|e| e.to_string())?;
    println!("¡Descarga de {} completada!", filename);
    Ok(format!("Descarga exitosa: {}", filename))
}

// --- Helper para API Keys ---

async fn get_decrypted_api_key(provider: &str, pool: &SqlitePool) -> Result<String, String> {
    let row = sqlx::query_as::<_, (String, String)>(
        "SELECT iv, ciphertext FROM api_keys WHERE provider = ?"
    )
    .bind(provider)
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?;

    match row {
        Some((iv_b64, ct_b64)) => {
            let hw_id = get_hardware_id();
            crypto::decrypt(&iv_b64, &ct_b64, &hw_id)
        }
        None => Err(format!("API key no configurada para {}. Ve a Configuracion > APIs.", provider)),
    }
}

// --- Comandos de Transcripcion Cloud ---

// Estructuras para parsear respuestas de APIs
#[derive(Deserialize)]
struct GladiaResponse {
    result: GladiaResult,
}

#[derive(Deserialize)]
struct GladiaResult {
    transcription: GladiaTranscription,
}

#[derive(Deserialize)]
struct GladiaTranscription {
    utterances: Vec<GladiaUtterance>,
}

#[derive(Deserialize)]
struct GladiaUtterance {
    speaker: Option<i64>,
    start: f64,
    end: f64,
    text: String,
    confidence: Option<f64>,
}

#[derive(Deserialize)]
struct DeepGramResponse {
    results: DeepGramResults,
}

#[derive(Deserialize)]
struct DeepGramResults {
    channels: Vec<DeepGramChannel>,
}

#[derive(Deserialize)]
struct DeepGramChannel {
    alternatives: Vec<DeepGramAlternative>,
}

#[derive(Deserialize)]
struct DeepGramAlternative {
    words: Vec<DeepGramWord>,
}

#[derive(Deserialize)]
struct DeepGramWord {
    word: String,
    start: f64,
    end: f64,
    speaker: Option<i64>,
    confidence: f64,
}

#[derive(Deserialize)]
struct AssemblyAIUploadResponse {
    upload_url: String,
}

#[derive(Deserialize)]
struct AssemblyAISubmitResponse {
    id: String,
    status: String,
}

#[derive(Deserialize)]
struct AssemblyAIResultResponse {
    status: String,
    text: Option<String>,
    utterances: Option<Vec<AssemblyAIUtterance>>,
}

#[derive(Deserialize)]
struct AssemblyAIUtterance {
    speaker: String,
    start: i64,
    end: i64,
    text: String,
    confidence: f64,
}

fn speaker_color(index: usize) -> String {
    const COLORS: &[&str] = &[
        "#6366f1", "#ec4899", "#10b981", "#f59e0b", "#8b5cf6",
        "#06b6d4", "#f43f5e", "#84cc16", "#e11d48", "#0ea5e9",
    ];
    COLORS[index % COLORS.len()].to_string()
}

fn build_transcription_result(
    utterances: &[(String, f64, f64, String, f64)],
) -> TranscriptionResult {
    let mut speaker_ids = std::collections::HashMap::new();
    let mut speakers = Vec::new();
    let mut segments = Vec::new();

    for (label, start, end, text, confidence) in utterances {
        let sid = speaker_ids.entry(label.clone()).or_insert_with(|| {
            let id = format!("speaker-{}", speakers.len());
            speakers.push(SpeakerInfo {
                id: id.clone(),
                label: label.clone(),
                color: speaker_color(speakers.len()),
            });
            id
        });

        segments.push(TranscriptionSegment {
            speaker_id: sid.clone(),
            speaker_label: label.clone(),
            text: text.clone(),
            start_ms: (*start * 1000.0) as i64,
            end_ms: (*end * 1000.0) as i64,
            confidence: *confidence,
        });
    }

    let full_text = segments.iter().map(|s| format!("[{}] {}", s.speaker_label, s.text)).collect::<Vec<_>>().join("\n");

    TranscriptionResult { full_text, segments, speakers }
}

#[tauri::command]
async fn transcribe_gladia(audio_path: String, state: tauri::State<'_, SqlitePool>) -> Result<TranscriptionResult, String> {
    let api_key = get_decrypted_api_key("gladia", &state).await?;
    let client = reqwest::Client::new();

    let audio_data = fs::read(&audio_path).map_err(|e| format!("Error leyendo audio: {}", e))?;
    let part = reqwest::multipart::Part::bytes(audio_data)
        .file_name("audio.wav")
        .mime_str("audio/wav")
        .map_err(|e| e.to_string())?;

    let form = reqwest::multipart::Form::new()
        .part("audio", part)
        .text("diarization", "true");

    let res = client
        .post("https://api.gladia.io/v2/transcription")
        .header("x-gladia-key", &api_key)
        .multipart(form)
        .send()
        .await
        .map_err(|e| format!("Gladia request error: {}", e))?;

    if !res.status().is_success() {
        let status = res.status();
        let body = res.text().await.unwrap_or_default();
        return Err(format!("Gladia error {}: {}", status, body));
    }

    let data: GladiaResponse = res.json().await.map_err(|e| format!("Gladia parse error: {}", e))?;
    let utterances: Vec<_> = data.result.transcription.utterances.iter().map(|u| {
        let label = match u.speaker {
            Some(s) => format!("Speaker {}", s + 1),
            None => "Speaker 1".to_string(),
        };
        (label, u.start, u.end, u.text.clone(), u.confidence.unwrap_or(0.9))
    }).collect();

    Ok(build_transcription_result(&utterances))
}

#[tauri::command]
async fn transcribe_deepgram(audio_path: String, state: tauri::State<'_, SqlitePool>) -> Result<TranscriptionResult, String> {
    let api_key = get_decrypted_api_key("deepgram", &state).await?;
    let client = reqwest::Client::new();

    let audio_data = fs::read(&audio_path).map_err(|e| format!("Error leyendo audio: {}", e))?;

    let res = client
        .post("https://api.deepgram.com/v1/listen?diarize=true&smart_format=true")
        .header("Authorization", format!("Token {}", api_key))
        .header("Content-Type", "audio/wav")
        .body(audio_data)
        .send()
        .await
        .map_err(|e| format!("DeepGram request error: {}", e))?;

    if !res.status().is_success() {
        let status = res.status();
        let body = res.text().await.unwrap_or_default();
        return Err(format!("DeepGram error {}: {}", status, body));
    }

    let data: DeepGramResponse = res.json().await.map_err(|e| format!("DeepGram parse error: {}", e))?;
    let mut utterances = Vec::new();
    let mut current_speaker: Option<String> = None;
    let mut current_text = String::new();
    let mut current_start = 0.0;
    let mut current_end = 0.0;
    let mut current_conf = 0.0;
    let mut conf_count = 0;

    for channel in &data.results.channels {
        for alt in &channel.alternatives {
            for word in &alt.words {
                let speaker_label = match word.speaker {
                    Some(s) => format!("Speaker {}", s + 1),
                    None => "Speaker 1".to_string(),
                };

                if current_speaker.as_deref() == Some(&speaker_label) {
                    current_text.push(' ');
                    current_text.push_str(&word.word);
                    current_end = word.end;
                    current_conf += word.confidence;
                    conf_count += 1;
                } else {
                    if !current_text.is_empty() {
                        utterances.push((
                            current_speaker.unwrap_or("Speaker 1".to_string()),
                            current_start,
                            current_end,
                            current_text.clone(),
                            if conf_count > 0 { current_conf / conf_count as f64 } else { 0.9 },
                        ));
                    }
                    current_speaker = Some(speaker_label);
                    current_text = word.word.clone();
                    current_start = word.start;
                    current_end = word.end;
                    current_conf = word.confidence;
                    conf_count = 1;
                }
            }
        }
    }
    if !current_text.is_empty() {
        utterances.push((
            current_speaker.unwrap_or("Speaker 1".to_string()),
            current_start,
            current_end,
            current_text,
            if conf_count > 0 { current_conf / conf_count as f64 } else { 0.9 },
        ));
    }

    Ok(build_transcription_result(&utterances))
}

#[tauri::command]
async fn transcribe_assemblyai(audio_path: String, state: tauri::State<'_, SqlitePool>) -> Result<TranscriptionResult, String> {
    let api_key = get_decrypted_api_key("assemblyai", &state).await?;
    let client = reqwest::Client::new();

    let audio_data = fs::read(&audio_path).map_err(|e| format!("Error leyendo audio: {}", e))?;

    let upload_res: AssemblyAIUploadResponse = client
        .post("https://api.assemblyai.com/v2/upload")
        .header("Authorization", &api_key)
        .body(audio_data)
        .send()
        .await
        .map_err(|e| format!("AssemblyAI upload error: {}", e))?
        .json()
        .await
        .map_err(|e| format!("AssemblyAI upload parse error: {}", e))?;

    let submit_res: AssemblyAISubmitResponse = client
        .post("https://api.assemblyai.com/v2/transcript")
        .header("Authorization", &api_key)
        .json(&serde_json::json!({
            "audio_url": upload_res.upload_url,
            "speaker_labels": true
        }))
        .send()
        .await
        .map_err(|e| format!("AssemblyAI submit error: {}", e))?
        .json()
        .await
        .map_err(|e| format!("AssemblyAI submit parse error: {}", e))?;

    let transcript_id = submit_res.id;

    for _ in 0..60 {
        tokio::time::sleep(std::time::Duration::from_secs(2)).await;
        let poll_res: AssemblyAIResultResponse = client
            .get(format!("https://api.assemblyai.com/v2/transcript/{}", transcript_id))
            .header("Authorization", &api_key)
            .send()
            .await
            .map_err(|e| format!("AssemblyAI poll error: {}", e))?
            .json()
            .await
            .map_err(|e| format!("AssemblyAI poll parse error: {}", e))?;

        match poll_res.status.as_str() {
            "completed" => {
                if let Some(utts) = poll_res.utterances {
                    let utterances: Vec<_> = utts.iter().map(|u| {
                        (format!("Speaker {}", u.speaker), u.start as f64 / 1000.0, u.end as f64 / 1000.0, u.text.clone(), u.confidence)
                    }).collect();
                    return Ok(build_transcription_result(&utterances));
                }
                let text = poll_res.text.unwrap_or_default();
                return Ok(TranscriptionResult {
                    full_text: text,
                    segments: vec![],
                    speakers: vec![],
                });
            }
            "error" => return Err("AssemblyAI processing error".to_string()),
            _ => continue,
        }
    }

    Err("AssemblyAI polling timeout (2 minutos)".to_string())
}

#[tauri::command]
async fn transcribe_with_provider(audio_path: String, provider: String, state: tauri::State<'_, SqlitePool>) -> Result<TranscriptionResult, String> {
    match provider.as_str() {
        "gladia" => transcribe_gladia(audio_path, state).await,
        "deepgram" => transcribe_deepgram(audio_path, state).await,
        "assemblyai" => transcribe_assemblyai(audio_path, state).await,
        _ => Err(format!("Provider desconocido: {}. Usa 'gladia', 'deepgram', o 'assemblyai'.", provider)),
    }
}

// Para uso con offline
#[tauri::command]
async fn transcribe_with_provider_offline(audio_path: String, provider: String, state: tauri::State<'_, SqlitePool>, handle: AppHandle) -> Result<TranscriptionResult, String> {
    match provider.as_str() {
        "gladia" => transcribe_gladia(audio_path, state).await,
        "deepgram" => transcribe_deepgram(audio_path, state).await,
        "assemblyai" => transcribe_assemblyai(audio_path, state).await,
        "offline" => {
            let text = transcribe_audio_local(audio_path.clone(), state, handle).await?;
            Ok(TranscriptionResult { full_text: text, segments: vec![], speakers: vec![] })
        }
        _ => Err(format!("Provider desconocido: {}", provider)),
    }
}

#[tauri::command]
async fn update_speaker_label(speaker_id: String, new_label: String, state: tauri::State<'_, SqlitePool>) -> Result<bool, String> {
    sqlx::query("INSERT OR REPLACE INTO speaker_labels (speaker_id, label, is_user_defined) VALUES (?, ?, 1)")
        .bind(&speaker_id)
        .bind(&new_label)
        .execute(&*state)
        .await
        .map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
async fn llm_generate(provider: String, prompt: String, model: Option<String>, state: tauri::State<'_, SqlitePool>) -> Result<String, String> {
    let api_key = get_decrypted_api_key(&provider, &state).await?;
    let client = reqwest::Client::new();

    match provider.as_str() {
        "anthropic" => {
            let model = model.unwrap_or_else(|| "claude-sonnet-4-20250514".to_string());
            let res = client
                .post("https://api.anthropic.com/v1/messages")
                .header("x-api-key", &api_key)
                .header("anthropic-version", "2023-06-01")
                .json(&serde_json::json!({
                    "model": model,
                    "max_tokens": 4096,
                    "messages": [{"role": "user", "content": prompt}]
                }))
                .send().await.map_err(|e| format!("Anthropic error: {}", e))?;

            let data: serde_json::Value = res.json().await.map_err(|e| format!("Anthropic parse: {}", e))?;
            data["content"][0]["text"].as_str()
                .map(|s| s.to_string())
                .ok_or("Anthropic response parse error".to_string())
        }
        "gemini" => {
            let model = model.unwrap_or_else(|| "gemini-2.5-pro".to_string());
            let url = format!("https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}", model, api_key);
            let res = client
                .post(&url)
                .json(&serde_json::json!({
                    "contents": [{"parts": [{"text": prompt}]}]
                }))
                .send().await.map_err(|e| format!("Gemini error: {}", e))?;

            let data: serde_json::Value = res.json().await.map_err(|e| format!("Gemini parse: {}", e))?;
            data["candidates"][0]["content"]["parts"][0]["text"].as_str()
                .map(|s| s.to_string())
                .ok_or("Gemini response parse error".to_string())
        }
        _ => {
            // OpenAI-compatible: openai, openrouter, deepseek, xai, zai
            let base_url = match provider.as_str() {
                "openai" => "https://api.openai.com",
                "openrouter" => "https://openrouter.ai/api",
                "deepseek" => "https://api.deepseek.com",
                "xai" => "https://api.x.ai",
                "zai" => "https://api.z.ai",
                _ => return Err(format!("Provider LLM desconocido: {}", provider)),
            };
            let model = model.unwrap_or_else(|| match provider.as_str() {
                "openai" => "gpt-4o".to_string(),
                "openrouter" => "openai/gpt-4o".to_string(),
                "deepseek" => "deepseek-chat".to_string(),
                "xai" => "grok-2".to_string(),
                "zai" => "glm-4".to_string(),
                _ => "gpt-4o".to_string(),
            });

            let res = client
                .post(format!("{}/v1/chat/completions", base_url))
                .header("Authorization", format!("Bearer {}", api_key))
                .json(&serde_json::json!({
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}]
                }))
                .send().await.map_err(|e| format!("{} error: {}", provider, e))?;

            let data: serde_json::Value = res.json().await.map_err(|e| format!("{} parse: {}", provider, e))?;
            data["choices"][0]["message"]["content"].as_str()
                .map(|s| s.to_string())
                .ok_or(format!("{} response parse error", provider))
        }
    }
}

#[tauri::command]
fn greet(name: &str) -> String { format!("Hola, {}!", name) }

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::default().build())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_os::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_sql::Builder::default().build())
    .setup(|app| {
      let app_dir = app.path().app_data_dir().map_err(|_| "Error obteniendo app_dir").unwrap();
      let _ = fs::create_dir_all(app_dir.join("models"));
      
      // Crear URL de conexión robusta para Windows
      let db_path = app_dir.join("neuroscribe.db");
      let db_url = format!("sqlite://{}", db_path.to_string_lossy().replace("\\", "/"));
      
      // Asegurarnos de que el archivo existe ANTES de conectar para evitar el pánico de sqlx
      if !db_path.exists() {
          let _ = fs::File::create(&db_path);
      }

      tauri::async_runtime::block_on(async {
          let opts = SqliteConnectOptions::from_str(&db_url)
              .unwrap()
              .create_if_missing(true);
              
          let pool = SqlitePool::connect_with(opts).await.unwrap();
          
          // Ejecutar migraciones una por una ignorando errores de 'ya existe'
          println!("Ejecutando migracion 01...");
          let _ = sqlx::query(include_str!("../migrations/01_initial_schema.sql")).execute(&pool).await;
          
          println!("Reparando/Verificando columnas de licencia (Migracion 02)...");
          // Ejecutamos cada alter table por separado para evitar que uno falle y detenga a los demas
          let _ = sqlx::query("ALTER TABLE profiles ADD COLUMN license_key TEXT").execute(&pool).await;
          let _ = sqlx::query("ALTER TABLE profiles ADD COLUMN trial_start_date DATETIME DEFAULT CURRENT_TIMESTAMP").execute(&pool).await;
          let _ = sqlx::query("ALTER TABLE profiles ADD COLUMN is_activated BOOLEAN DEFAULT 0").execute(&pool).await;
          let _ = sqlx::query("ALTER TABLE profiles ADD COLUMN activation_token TEXT").execute(&pool).await;
          
          // Asegurarnos de que el usuario local tenga una fecha de trial si la columna acaba de ser creada
          let _ = sqlx::query("UPDATE profiles SET trial_start_date = CURRENT_TIMESTAMP WHERE trial_start_date IS NULL").execute(&pool).await;
          
          println!("Ejecutando migracion 03 (api_keys)...");
          let _ = sqlx::query(include_str!("../migrations/03_api_keys.sql")).execute(&pool).await;

          println!("Ejecutando migracion 04 (speaker_labels)...");
          let _ = sqlx::query(include_str!("../migrations/04_speaker_labels.sql")).execute(&pool).await;
          
          println!("Base de datos verificada y lista.");
          app.manage(pool);
      });
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![greet, db_get_profile, db_get_folders, db_create_folder, db_get_documents, db_save_document, get_hardware_info, get_hardware_id, check_models, download_model, transcribe_audio_local, process_text_local, generate_research_paper_local, generate_quick_answer_local, activate_license, get_academic_data_local, verify_doi_local, check_mirror_health, db_delete_model, save_api_key, get_api_keys, delete_api_key, transcribe_gladia, transcribe_deepgram, transcribe_assemblyai, transcribe_with_provider, transcribe_with_provider_offline, update_speaker_label, llm_generate])
    .run(tauri::generate_context!()).expect("run");
}
