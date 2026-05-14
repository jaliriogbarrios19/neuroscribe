export interface ApiKeyEntry {
  provider: string;
  masked_key: string;
  created_at: string;
}

export type TranscriptionProvider = "gladia" | "deepgram" | "assemblyai" | "offline";

export const LLM_PROVIDERS = [
  { key: "openai", label: "OpenAI", baseUrl: "https://api.openai.com", defaultModel: "gpt-4o" },
  { key: "openrouter", label: "OpenRouter", baseUrl: "https://openrouter.ai/api", defaultModel: "openai/gpt-4o" },
  { key: "deepseek", label: "DeepSeek", baseUrl: "https://api.deepseek.com", defaultModel: "deepseek-chat" },
  { key: "anthropic", label: "Anthropic", baseUrl: "https://api.anthropic.com", defaultModel: "claude-sonnet-4-20250514" },
  { key: "gemini", label: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com", defaultModel: "gemini-2.5-pro" },
  { key: "xai", label: "X.AI (Grok)", baseUrl: "https://api.x.ai", defaultModel: "grok-2" },
  { key: "zai", label: "Z.ai (GLM)", baseUrl: "https://api.z.ai", defaultModel: "glm-4" },
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
