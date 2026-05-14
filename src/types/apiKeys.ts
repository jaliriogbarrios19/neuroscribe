export interface ApiKeyEntry {
  provider: string;
  masked_key: string;
  created_at: string;
  model?: string;
}

export type TranscriptionProvider = "gladia" | "deepgram" | "assemblyai" | "offline";

export const LLM_PROVIDERS = [
  { key: "openai", label: "OpenAI", baseUrl: "https://api.openai.com", defaultModel: "gpt-4o",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "o1", "o1-mini", "o3-mini", "gpt-4.1-mini", "gpt-4.1-nano"] },
  { key: "openrouter", label: "OpenRouter", baseUrl: "https://openrouter.ai/api", defaultModel: "openai/gpt-4o",
    models: ["openai/gpt-4o", "openai/gpt-4.1", "anthropic/claude-sonnet-4", "anthropic/claude-opus-4", "google/gemini-2.5-pro", "google/gemini-2.5-flash", "meta-llama/llama-4-maverick", "deepseek/deepseek-chat"] },
  { key: "deepseek", label: "DeepSeek", baseUrl: "https://api.deepseek.com", defaultModel: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner"] },
  { key: "anthropic", label: "Anthropic", baseUrl: "https://api.anthropic.com", defaultModel: "claude-sonnet-4-20250514",
    models: ["claude-sonnet-4-20250514", "claude-opus-4-20250514", "claude-haiku-3.5", "claude-3.5-sonnet"] },
  { key: "gemini", label: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com", defaultModel: "gemini-2.5-pro",
    models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"] },
  { key: "xai", label: "X.AI (Grok)", baseUrl: "https://api.x.ai", defaultModel: "grok-2",
    models: ["grok-2", "grok-2-vision", "grok-3-mini", "grok-3"] },
  { key: "zai", label: "Z.ai (GLM)", baseUrl: "https://api.z.ai", defaultModel: "glm-4",
    models: ["glm-4", "glm-4-flash", "glm-4-plus"] },
] as const;

export type LlmProviderKey = typeof LLM_PROVIDERS[number]["key"];

export const TRANSCRIPTION_PROVIDERS = [
  { key: "offline", label: "Offline (Whisper)", description: "Transcripcion local sin internet" },
  { key: "gladia", label: "Gladia", description: "API cloud con diarizacion nativa" },
  { key: "deepgram", label: "DeepGram", description: "API cloud con diarizacion y smart format" },
  { key: "assemblyai", label: "AssemblyAI", description: "API cloud con speaker labels" },
] as const;

export const RESEARCH_API_PROVIDERS = [
  { key: "pubmed", label: "PubMed / NCBI", description: "API key para mayor rate limit" },
  { key: "semantic_scholar", label: "Semantic Scholar", description: "API key para busquedas academicas" },
  { key: "crossref", label: "Crossref", description: "Email para verificacion de DOIs" },
] as const;
