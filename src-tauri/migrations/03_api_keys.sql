CREATE TABLE IF NOT EXISTS api_keys (
  provider TEXT PRIMARY KEY,
  iv BLOB NOT NULL,
  ciphertext BLOB NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
