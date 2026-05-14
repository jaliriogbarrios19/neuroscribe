CREATE TABLE IF NOT EXISTS speaker_labels (
  speaker_id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  is_user_defined INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
