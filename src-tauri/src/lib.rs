use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use tauri::{AppHandle, Manager, Runtime, Emitter};
use uuid::Uuid;
use sysinfo::{System, SystemExt};
use std::path::PathBuf;
use tauri::process::{Command, CommandEvent};
use std::fs;
use std::io::{BufRead, BufReader};
use regex::Regex;

// --- Structs de Datos ---

#[derive(Serialize, Deserialize, sqlx::FromRow)]
pub struct Profile {
    pub id: String,
    pub email: Option<String>,
    pub full_name: Option<String>,
    pub minutes_balance: i32,
    pub cc_balance: i32,
    pub created_at: String,
    pub license_key: Option<String>,
    pub trial_start_date: String,
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

#[derive(Serialize, Deserialize)]
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
    let cpu = sys.global_cpu_info().brand().to_string();
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

async fn check_license_internal(state: tauri::State<'_, SqlitePool>) -> Result<(), String> {
    let profile = sqlx::query_as::<_, Profile>("SELECT * FROM profiles LIMIT 1")
        .fetch_one(&*state)
        .await
        .map_err(|e| e.to_string())?;

    if profile.is_activated { return Ok(()); }

    let start_date = chrono::DateTime::parse_from_rfc3339(&profile.trial_start_date)
        .or_else(|_| chrono::DateTime::parse_from_str(&format!("{}+00:00", profile.trial_start_date.replace(" ", "T")), "%Y-%m-%dT%H:%M:%S%z"))
        .map_err(|e| format!("Error parseando fecha: {}", e))?;
    
    if chrono::Utc::now().signed_duration_since(start_date.with_timezone(&chrono::Utc)).num_days() > 30 {
        return Err("Trial expirado.".to_string());
    }
    Ok(())
}

// --- Comandos de Investigación ---

#[tauri::command]
async fn verify_doi_local(doi: String) -> Result<bool, String> {
    let client = reqwest::Client::new();
    let url = format!("https://api.crossref.org/works/{}?mailto=hola@neuroscribe.app", doi);
    let res = client.get(url).send().await.map_err(|e| e.to_string())?;
    Ok(res.status().is_success())
}

#[tauri::command]
async fn get_academic_data_local(query: String, high_precision: bool) -> Result<Vec<AcademicWork>, String> {
    let client = reqwest::Client::new();
    let mesh_query = if high_precision { format!("{}[MeSH Terms]", query) } else { query.clone() };

    let (pubmed_res, openalex_res) = tokio::join!(
        fetch_pubmed(&client, &mesh_query),
        fetch_openalex(&client, &query)
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

async fn fetch_pubmed(client: &reqwest::Client, query: &str) -> Result<Vec<AcademicWork>, String> {
    let search_url = format!("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term={}&retmode=json&retmax=10", query);
    let res = client.get(search_url).send().await.map_err(|e| e.to_string())?;
    let search_data: PubMedESearchResponse = res.json().await.map_err(|e| e.to_string())?;
    let ids = search_data.esearchresult.idlist;
    if ids.is_empty() { return Ok(vec![]); }

    let summary_url = format!("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id={}&retmode=json", ids.join(","));
    let res_sum = client.get(summary_url).send().await.map_err(|e| e.to_string())?;
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

async fn fetch_openalex(client: &reqwest::Client, query: &str) -> Result<Vec<AcademicWork>, String> {
    let url = format!("https://api.openalex.org/works?search={}&mailto=hola@neuroscribe.app", query);
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
    sqlx::query_as::<_, Profile>("SELECT * FROM profiles LIMIT 1").fetch_one(&*state).await.map_err(|e| e.to_string())
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
    let out = Command::new_sidecar("llama-cli").map_err(|e| e.to_string())?.args(["-m", &model_path.to_string_lossy(), "-p", &prompt, "-n", "1024", "-t", &hw.cpu_cores.to_string(), "--quiet"]).output().map_err(|e| e.to_string())?;
    Ok(String::from_utf8_lossy(&out.stdout).to_string())
}

#[tauri::command]
async fn generate_research_paper_local(articles: Vec<ResearchArticle>, domain: String, state: tauri::State<'_, SqlitePool>, handle: AppHandle) -> Result<String, String> {
    check_license_internal(state).await?;
    let hw = get_hardware_info();
    let model_path = handle.path().app_data_dir().map_err(|e| e.to_string())?.join("models").join("llama-3-8b-instruct.gguf");
    let prompt = format!("### System:\nGenera paper APA 7 para {}.\n### User:\nE: {:?}\n### Assistant:\nPaper:", domain, articles);
    let out = Command::new_sidecar("llama-cli").map_err(|e| e.to_string())?.args(["-m", &model_path.to_string_lossy(), "-p", &prompt, "-n", "2048", "-t", &hw.cpu_cores.to_string(), "--quiet"]).output().map_err(|e| e.to_string())?;
    Ok(String::from_utf8_lossy(&out.stdout).to_string())
}

#[tauri::command]
async fn process_text_local(text: String, task: String, state: tauri::State<'_, SqlitePool>, handle: AppHandle) -> Result<String, String> {
    check_license_internal(state).await?;
    let hw = get_hardware_info();
    let model_path = handle.path().app_data_dir().map_err(|e| e.to_string())?.join("models").join(if task == "summary" { "biomedlm-2.7b.gguf" } else { "llama-3-8b-instruct.gguf" });
    let prompt = format!("### System:\nTask: {}\n### User:\n{}\n### Assistant:\n", task, text);
    let out = Command::new_sidecar("llama-cli").map_err(|e| e.to_string())?.args(["-m", &model_path.to_string_lossy(), "-p", &prompt, "-n", "1024", "-t", &hw.cpu_cores.to_string(), "--quiet"]).output().map_err(|e| e.to_string())?;
    Ok(String::from_utf8_lossy(&out.stdout).to_string())
}

#[tauri::command]
async fn transcribe_audio_local(audio_path: String, state: tauri::State<'_, SqlitePool>, handle: AppHandle) -> Result<String, String> {
    check_license_internal(state).await?;
    let model_path = handle.path().app_data_dir().map_err(|e| e.to_string())?.join("models").join("ggml-large-v3-turbo.bin");
    let (mut rx, _) = Command::new_sidecar("whisper-cli").map_err(|e| e.to_string())?.args(["-m", &model_path.to_string_lossy(), "-f", &audio_path, "-oj", "-of", &format!("{}_out", audio_path), "-l", "auto"]).spawn().map_err(|e| e.to_string())?;
    while let Some(event) = rx.recv().await { if let CommandEvent::Terminated(_) = event { break; } }
    let json_path = format!("{}_out.json", audio_path);
    let data: WhisperOutput = serde_json::from_str(&fs::read_to_string(&json_path).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
    let _ = fs::remove_file(&json_path);
    Ok(data.text)
}

#[tauri::command]
async fn download_model(model_name: &str, _handle: AppHandle) -> Result<String, String> { Ok(format!("Mock download: {}", model_name)) }

#[tauri::command]
fn greet(name: &str) -> String { format!("Hola, {}!", name) }

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_sql::Builder::default().build())
    .setup(|app| {
      let app_dir = app.path().app_data_dir().expect("dir");
      let _ = fs::create_dir_all(app_dir.join("models"));
      let db_url = format!("sqlite:{}", app_dir.join("neuroscribe.db").display());
      tauri::async_runtime::block_on(async {
          let pool = SqlitePool::connect(&db_url).await.expect("db");
          let _ = sqlx::query(include_str!("../migrations/01_initial_schema.sql")).execute(&pool).await;
          let _ = sqlx::query(include_str!("../migrations/02_licensing.sql")).execute(&pool).await;
          app.manage(pool);
      });
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![greet, db_get_profile, db_get_folders, db_create_folder, db_get_documents, db_save_document, get_hardware_info, get_hardware_id, check_models, download_model, transcribe_audio_local, process_text_local, generate_research_paper_local, generate_quick_answer_local, activate_license, get_academic_data_local, verify_doi_local])
    .run(tauri::generate_context!()).expect("run");
}
