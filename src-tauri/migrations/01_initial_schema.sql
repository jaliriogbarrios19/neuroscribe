-- Initial Migration: Schema para NeuroScribe Local

-- 1. Tabla de Perfiles
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  minutes_balance INTEGER DEFAULT 800,
  cc_balance INTEGER DEFAULT 50,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Carpetas
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Documentos
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT, -- HTML de TipTap
  type TEXT CHECK (type IN ('transcript', 'summary', 'paper')) NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Inserción de perfil por defecto para el primer arranque
INSERT OR IGNORE INTO profiles (id, email, full_name) 
VALUES ('local-user', 'usuario@local.app', 'Usuario Local');
