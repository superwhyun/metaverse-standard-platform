-- Migration for standard recommendation feature (Google Sheet + OpenAI File Search based)

CREATE TABLE IF NOT EXISTS standard_recommend_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  sheet_url TEXT,
  vector_store_id TEXT,
  last_synced_at DATETIME,
  last_sync_status TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS standard_recommend_sync_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vector_store_id TEXT NOT NULL,
  row_index INTEGER NOT NULL,
  openai_file_id TEXT NOT NULL,
  title TEXT,
  synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
