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
struct PubMedESearchResult {
    idlist: Vec<String>,
}

#[derive(Deserialize)]
struct PubMedESearchResponse {
    esearchresult: PubMedESearchResult,
}

#[derive(Deserialize)]
struct PubMedESummaryResult {
    #[serde(rename = "uids")]
    idlist: Vec<String>,
    #[serde(flatten)]
    items: std::collections::HashMap<String, PubMedArticle>,
}

#[derive(Deserialize)]
struct PubMedESummaryResponse {
    result: PubMedESummaryResult,
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
    display_name: Option<String>,
    title: Option<String>,
    publication_year: i32,
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

#[tauri::command]
fn get_hardware_id() -> String {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    let cpu = sys.global_cpu_info().brand().to_string();
    let total_memory = sys.total_memory().to_string();
    let os = std::env::consts::OS.to_string();
    
    // Fingerprint simple: CPU + RAM + OS
    format!("{}-{}-{}", cpu, total_memory, os).replace(" ", "_")
}

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
    
    // 1. Descubrimiento MeSH (opcional pero recomendado en high_precision)
    let mesh_query = if high_precision {
        format!("{}[MeSH Terms]", query)
    } else {
        query.clone()
    };

    // 2. Orquestación paralela: PubMed + OpenAlex
    let (pubmed_res, openalex_res) = tokio::join!(
        fetch_pubmed(&client, &mesh_query),
        fetch_openalex(&client, &query)
    );

    let mut combined = Vec::new();
    if let Ok(mut p) = pubmed_res { combined.append(&mut p); }
    if let Ok(mut o) = openalex_res { combined.append(&mut o); }

    // 3. De-duplicación por DOI
    let mut unique_works: std::collections::HashMap<String, AcademicWork> = std::collections::HashMap::new();
    for work in combined {
        if !work.doi.is_empty() {
            let clean_doi = work.doi.replace("https://doi.org/", "").to_lowercase();
            unique_works.entry(clean_doi).or_insert(work);
        } else {
            // Si no tiene DOI, lo añadimos por título (simplificado)
            unique_works.insert(work.title.to_lowercase(), work);
        }
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
                abstract_text: "".to_string(), // ESummary no da abstract, requiere EFetch (futuro)
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
    sqlx::query_as::<_, Profile>("SELECT * FROM profiles LIMIT 1")
        .fetch_one(&*state)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn db_get_folders(state: tauri::State<'_, SqlitePool>) -> Result<Vec<Folder>, String> {
    sqlx::query_as::<_, Folder>(
        "SELECT f.*, COUNT(d.id) as count FROM folders f LEFT JOIN documents d ON f.id = d.folder_id GROUP BY f.id ORDER BY f.created_at DESC"
    )
    .fetch_all(&*state)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
async fn db_create_folder(name: &str, state: tauri::State<'_, SqlitePool>) -> Result<Folder, String> {
    let id = Uuid::new_v4().to_string();
    sqlx::query("INSERT INTO folders (id, name) VALUES (?, ?)")
        .bind(&id)
        .bind(name)
        .execute(&*state)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query_as::<_, Folder>("SELECT *, 0 as count FROM folders WHERE id = ?")
        .bind(&id)
        .fetch_one(&*state)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn db_get_documents(folder_id: Option<String>, state: tauri::State<'_, SqlitePool>) -> Result<Vec<Document>, String> {
    let query = if let Some(fid) = folder_id {
        sqlx::query_as::<_, Document>("SELECT id, folder_id, title, content, type as document_type, tokens_used, created_at FROM documents WHERE folder_id = ? ORDER BY created_at DESC")
            .bind(fid)
    } else {
        sqlx::query_as::<_, Document>("SELECT id, folder_id, title, content, type as document_type, tokens_used, created_at FROM documents ORDER BY created_at DESC")
    };

    query.fetch_all(&*state)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn db_save_document(
    id: Option<String>,
    folder_id: Option<String>,
    title: &str,
    content: &str,
    doc_type: &str,
    tokens: i32,
    state: tauri::State<'_, SqlitePool>
) -> Result<Document, String> {
    let final_id = id.unwrap_or_else(|| Uuid::new_v4().to_string());
    
    sqlx::query(
        "INSERT INTO documents (id, folder_id, title, content, type, tokens_used) VALUES (?, ?, ?, ?, ?, ?) 
         ON CONFLICT(id) DO UPDATE SET folder_id=excluded.folder_id, title=excluded.title, content=excluded.content, type=excluded.type, tokens_used=excluded.tokens_used"
    )
    .bind(&final_id)
    .bind(folder_id)
    .bind(title)
    .bind(content)
    .bind(doc_type)
    .bind(tokens)
    .execute(&*state)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query_as::<_, Document>("SELECT id, folder_id, title, content, type as document_type, tokens_used, created_at FROM documents WHERE id = ?")
        .bind(&final_id)
        .fetch_one(&*state)
        .await
        .map_err(|e| e.to_string())
}

// --- Comandos de IA y Hardware ---

#[tauri::command]
fn get_hardware_info() -> HardwareInfo {
    let mut sys = System::new_all();
    sys.refresh_all();

    let total_ram = sys.total_memory() / 1024 / 1024 / 1024; // GB
    let available_ram = sys.available_memory() / 1024 / 1024 / 1024; // GB
    let cores = sys.cpus().len();

    // Priorizamos Llama-3-8B si hay suficiente RAM (12GB+), de lo contrario la versión ligera q4.
    // Se descarta definitivamente Phi-3.5-mini por calidad inferior en terminología médica.
    let recommended = if total_ram >= 11 {
        "llama-3-8b".to_string()
    } else {
        "llama-3-8b-q4".to_string() 
    };

    HardwareInfo {
        total_ram_gb: total_ram,
        available_ram_gb: available_ram,
        cpu_cores: cores,
        recommended_model: recommended,
    }
}

#[tauri::command]
fn check_models(handle: AppHandle) -> Result<serde_json::Value, String> {
    let app_dir = handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let models_dir = app_dir.join("models");
    
    let whisper_path = models_dir.join("ggml-large-v3-turbo.bin");
    let llama_path = models_dir.join("llama-3-8b-instruct.gguf");
    let biomed_path = models_dir.join("biomedlm-2.7b.gguf");

    Ok(serde_json::json!({
        "whisper_ready": whisper_path.exists(),
        "llama_ready": llama_path.exists(),
        "biomed_ready": biomed_path.exists(),
        "models_path": models_dir.display().to_string()
    }))
}

async fn check_license_internal(state: tauri::State<'_, SqlitePool>) -> Result<(), String> {
    let profile = sqlx::query_as::<_, Profile>("SELECT * FROM profiles LIMIT 1")
        .fetch_one(&*state)
        .await
        .map_err(|e| e.to_string())?;

    if profile.is_activated {
        return Ok(());
    }

    // Calcular trial
    let start_date = chrono::DateTime::parse_from_rfc3339(&profile.trial_start_date)
        .or_else(|_| chrono::DateTime::parse_from_str(&format!("{}+00:00", profile.trial_start_date.replace(" ", "T")), "%Y-%m-%dT%H:%M:%S%z"))
        .map_err(|e| format!("Error parseando fecha de trial: {}", e))?;
    
    let now = chrono::Utc::now();
    let duration = now.signed_duration_since(start_date.with_timezone(&chrono::Utc));

    if duration.num_days() > 30 {
        return Err("Tu periodo de prueba de 30 días ha expirado. Por favor, adquiere una licencia en Ajustes para continuar usando las funciones de IA.".to_string());
    }

    Ok(())
}

#[tauri::command]
async fn generate_quick_answer_local(
    query: String,
    articles: Vec<ResearchArticle>,
    domain: String,
    state: tauri::State<'_, SqlitePool>,
    handle: AppHandle
) -> Result<String, String> {
    check_license_internal(state).await?;
    
    let hw = get_hardware_info();
    let app_dir = handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let models_dir = app_dir.join("models");

    let model_filename = if domain == "medicine" || domain == "psychiatry" || domain == "neuropsychology" {
        "biomedlm-2.7b.gguf".to_string()
    } else {
        "llama-3-8b-instruct.gguf".to_string()
    };
    
    let model_path = models_dir.join(&model_filename);
    if !model_path.exists() {
        return Err(format!("El modelo {} no está disponible localmente.", model_filename));
    }

    let _ = handle.emit("research-progress", serde_json::json!({
        "step": "synthesizing",
        "current": 1,
        "total": 1,
        "message": "Generando respuesta rápida validada..."
    }));

    // Tomar solo los top 5 abstracts recomendados
    let top_articles = articles.iter().take(5).collect::<Vec<_>>();
    let mut evidence_context = String::new();
    
    for (i, article) in top_articles.iter().enumerate() {
        evidence_context.push_str(&format!("\nFuente {}: {} ({})\nAbstract: {}\n", i + 1, article.title, article.year, article.abstract_text));
    }

    let system_prompt = format!(
        "### System:\nEres el Agente 'Sintetizador Express'. Responde a la pregunta del usuario utilizando ÚNICAMENTE la evidencia proporcionada.
        Tu respuesta DEBE:
        1. Ser concisa (máximo 500 palabras).
        2. Usar terminología técnica adecuada para {}.
        3. Incluir citas en el texto utilizando el formato (Autor, Año). Si no se proporciona el autor exacto, usa (Fuente X, Año).
        4. No inventar información que no esté en la evidencia.\n\n### User:\nPREGUNTA: {}\n\nEVIDENCIA DISPONIBLE:\n{}\n\n### Assistant:\nRespuesta Basada en Evidencia:",
        if domain == "psychology" {"Psicología"} else {"Medicina"},
        query,
        evidence_context
    );

    let output = Command::new_sidecar("llama-cli")
        .map_err(|e| e.to_string())?
        .args([
            "-m", &model_path.to_string_lossy(),
            "-p", &system_prompt,
            "-n", "1024",
            "-c", "4096", 
            "-t", &hw.cpu_cores.to_string(),
            "--quiet"
        ])
        .output()
        .map_err(|e| e.to_string())?;

    let answer = String::from_utf8_lossy(&output.stdout).to_string();
    
    // Add reference list
    let mut final_response = answer.trim().to_string();
    final_response.push_str("\n\n**Referencias Consultadas:**\n");
    for (i, article) in top_articles.iter().enumerate() {
        final_response.push_str(&format!("{}. {} ({})\n", i + 1, article.title, article.year));
    }

    Ok(final_response)
}

#[tauri::command]
async fn generate_research_paper_local(
    articles: Vec<ResearchArticle>,
    domain: String,
    state: tauri::State<'_, SqlitePool>,
    handle: AppHandle
) -> Result<String, String> {
    check_license_internal(state).await?;
    
    let hw = get_hardware_info();
    let app_dir = handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let models_dir = app_dir.join("models");

    // 1. Determinar modelos por dominio
    let (summarizer_model, synthesizer_model) = if domain == "medicine" || domain == "psychiatry" || domain == "neuropsychology" {
        ("biomedlm-2.7b.gguf".to_string(), "llama-3-8b-instruct.gguf".to_string())
    } else {
        ("llama-3-8b-instruct.gguf".to_string(), "llama-3-8b-instruct.gguf".to_string())
    };

    let summarizer_path = models_dir.join(&summarizer_model);
    let synthesizer_path = models_dir.join(&synthesizer_model);

    if !summarizer_path.exists() || !synthesizer_path.exists() {
        return Err("Faltan modelos requeridos para la investigación.".to_string());
    }

    // 2. FASE AGENTE "ONE": Resumidor Individual
    let mut academic_context = String::new();
    let total_articles = articles.len();

    for (i, article) in articles.iter().enumerate() {
        let _ = handle.emit("research-progress", serde_json::json!({
            "step": "summarizing",
            "current": i + 1,
            "total": total_articles,
            "article": article.title
        }));

        let content_to_read = article.full_content.clone().unwrap_or_else(|| article.abstract_text.clone());
        
        let prompt = format!(
            "### System:\nEres el Agente 'One'. Tu tarea es resumir este artículo académico enfocándote únicamente en la METODOLOGÍA y los RESULTADOS principales. Sé técnico y preciso.\n\n### User:\nArtículo: {}\nContenido: {}\n\n### Assistant:\nResumen:",
            article.title, content_to_read
        );

        let output = Command::new_sidecar("llama-cli")
            .map_err(|e| e.to_string())?
            .args([
                "-m", &summarizer_path.to_string_lossy(),
                "-p", &prompt,
                "-n", "512",
                "-c", "4096", // Limitar contexto para evitar swap en RAM baja
                "-t", &hw.cpu_cores.to_string(),
                "--quiet"
            ])
            .output()
            .map_err(|e| e.to_string())?;

        let summary = String::from_utf8_lossy(&output.stdout).to_string();
        academic_context.push_str(&format!("\n--- ARTÍCULO {}: {} ---\n{}\n", i + 1, article.title, summary.trim()));
    }

    // 3. FASE AGENTE "TWO": Sintetizador de Paper
    let _ = handle.emit("research-progress", serde_json::json!({
        "step": "synthesizing",
        "current": 1,
        "total": 1,
        "message": "Generando paper final con normas APA 7..."
    }));

    let synthesis_prompt = format!(
        "### System:\nEres el Agente 'Two'. Genera un PAPER CIENTÍFICO completo basado en los resúmenes proporcionados. 
        Sigue estrictamente esta estructura: Título (ESP/ENG), Resumen (ESP/ENG) con 5 keywords, Introducción, Metodología, Resultados, Discusión, Conclusión y Referencias (APA 7).
        IMPORTANTE: Cada afirmación debe citar al autor correspondiente (ej. Smith, 2023).\n\n### User:\nCONTEXTO ACADÉMICO:\n{}\n\n### Assistant:\nPaper Final:",
        academic_context
    );

    let final_output = Command::new_sidecar("llama-cli")
        .map_err(|e| e.to_string())?
        .args([
            "-m", &synthesizer_path.to_string_lossy(),
            "-p", &synthesis_prompt,
            "-n", "2048",
            "-c", "8192", 
            "-t", &hw.cpu_cores.to_string(),
            "--quiet"
        ])
        .output()
        .map_err(|e| e.to_string())?;

    let paper = String::from_utf8_lossy(&final_output.stdout).to_string();
    Ok(paper.trim().to_string())
}

#[tauri::command]
async fn process_text_local(text: String, task: String, state: tauri::State<'_, SqlitePool>, handle: AppHandle) -> Result<String, String> {
    check_license_internal(state).await?;
    
    let hw = get_hardware_info();
    let app_dir = handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let models_dir = app_dir.join("models");
    
    // ESTRATEGIA HÍBRIDA: 
    // - Para "Resumen Clínico": Usamos BioMedLM por su superioridad en vocabulario médico.
    // - Para "Refinamiento/Paper": Usamos Llama-3 por su coherencia académica.
    let (model_filename, system_prompt) = match task.as_str() {
        "summary" => (
            "biomedlm-2.7b.gguf".to_string(),
            "Eres un asistente médico experto. Resume la siguiente transcripción clínica de forma concisa, destacando síntomas, diagnósticos sugeridos y plan de tratamiento. Usa formato Markdown con negritas."
        ),
        "paper" => (
            "llama-3-8b-instruct.gguf".to_string(),
            "Actúa como un investigador científico. Convierte la siguiente transcripción en un borrador de caso clínico académico siguiendo la estructura: Introducción, Presentación del Caso, Discusión y Conclusiones."
        ),
        _ => (
            "llama-3-8b-instruct.gguf".to_string(),
            "Eres un asistente inteligente. Procesa el siguiente texto según las instrucciones del usuario."
        )
    };
    
    let model_path = models_dir.join(&model_filename);
    
    if !model_path.exists() {
        return Err(format!("El modelo {} no está disponible localmente. Por favor descárgalo en el panel de estado.", model_filename));
    }

    let full_prompt = format!("### System:\n{}\n\n### User:\n{}\n\n### Assistant:\n", system_prompt, text);

    let output = Command::new_sidecar("llama-cli")
        .map_err(|e| e.to_string())?
        .args([
            "-m", &model_path.to_string_lossy(),
            "-p", &full_prompt,
            "-n", "1024",
            "-c", "4096",
            "-t", &hw.cpu_cores.to_string(),
            "--quiet" 
        ])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err("Error en la inferencia del modelo LLM local.".to_string());
    }

    let raw_response = String::from_utf8_lossy(&output.stdout).to_string();
    Ok(raw_response.trim().to_string())
}

#[tauri::command]
async fn transcribe_audio_local(audio_path: String, state: tauri::State<'_, SqlitePool>, handle: AppHandle) -> Result<String, String> {
    check_license_internal(state).await?;
    
    let app_dir = handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let model_path = app_dir.join("models").join("ggml-large-v3-turbo.bin");
    let hw = get_hardware_info();
    
    if !model_path.exists() {
        return Err("El modelo de transcripción no está descargado.".to_string());
    }

    let output_prefix = format!("{}_out", audio_path);
    let output_json = format!("{}.json", output_prefix);

    // Configurar sidecar con streaming de eventos
    let (mut rx, _child) = Command::new_sidecar("whisper-cli")
        .map_err(|e| e.to_string())?
        .args([
            "-m", &model_path.to_string_lossy(),
            "-f", &audio_path,
            "-oj",
            "-of", &output_prefix,
            "-l", "auto",
            "-t", &hw.cpu_cores.to_string(),
            "-pp"
        ])
        .spawn()
        .map_err(|e| e.to_string())?;

    let re_progress = Regex::new(r"(\d+)%").unwrap();

    while let Some(event) = rx.recv().await {
        match event {
            CommandEvent::Stderr(line) => {
                if let Some(cap) = re_progress.captures(&line) {
                    if let Ok(p) = cap[1].parse::<i32>() {
                        let _ = handle.emit("transcription-progress", ProgressPayload { progress: p });
                    }
                }
            },
            CommandEvent::Terminated(payload) => {
                if payload.code != Some(0) {
                    return Err("El motor de Whisper terminó con error.".to_string());
                }
                break;
            },
            _ => {}
        }
    }

    if !PathBuf::from(&output_json).exists() {
        return Err("No se encontró el archivo de salida del motor.".to_string());
    }

    let json_content = fs::read_to_string(&output_json).map_err(|e| e.to_string())?;
    let whisper_data: WhisperOutput = serde_json::from_str(&json_content).map_err(|e| e.to_string())?;

    let _ = fs::remove_file(&output_json);

    Ok(whisper_data.text)
}


#[tauri::command]
async fn download_model(model_name: &str, handle: AppHandle) -> Result<String, String> {
    println!("Solicitud de descarga para: {}", model_name);
    Ok(format!("Iniciando descarga de {}...", model_name))
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("¡Hola, {}! NeuroScribe ahora corre en Tauri.", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_sql::Builder::default().build())
    .setup(|app| {
      let app_data_dir = app.path().app_data_dir().expect("no se pudo encontrar app_data_dir");
      std::fs::create_dir_all(&app_data_dir).expect("no se pudo crear app_data_dir");
      
      let models_dir = app_data_dir.join("models");
      std::fs::create_dir_all(&models_dir).expect("no se pudo crear carpeta de modelos");

      let db_path = app_data_dir.join("neuroscribe.db");
      let db_url = format!("sqlite:{}", db_path.display());

      tauri::async_runtime::block_on(async {
          let pool = SqlitePool::connect(&db_url).await.expect("no se pudo conectar a la base de datos");
          
          // Migración 01
          let schema_01 = include_str!("../migrations/01_initial_schema.sql");
          sqlx::query(schema_01).execute(&pool).await.expect("falló la migración inicial (01)");
          
          // Migración 02 (Licensing)
          let schema_02 = include_str!("../migrations/02_licensing.sql");
          sqlx::query(schema_02).execute(&pool).await.expect("falló la migración de licenciamiento (02)");

          app.manage(pool);
      });

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
        greet, 
        db_get_profile, 
        db_get_folders, 
        db_create_folder, 
        db_get_documents, 
        db_save_document,
        get_hardware_info,
        get_hardware_id,
        check_models,
        download_model,
        transcribe_audio_local,
        process_text_local,
        generate_research_paper_local,
        generate_quick_answer_local,
        activate_license,
        get_academic_data_local,
        verify_doi_local
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
