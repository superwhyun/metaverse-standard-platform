CREATE TABLE IF NOT EXISTS admin_api_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  openai_api_key TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
