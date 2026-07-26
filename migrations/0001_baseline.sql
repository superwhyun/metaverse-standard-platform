-- Baseline schema for the metaverse standards platform D1 database.
--
-- This file replaces the previous set of incremental migration files.
-- It reproduces the schema currently running in production (read directly
-- from sqlite_master on the live D1 instance) as a single, idempotent
-- script: every statement uses IF NOT EXISTS / OR IGNORE, so it is safe to
-- run both against a brand-new empty database and against the existing
-- production database without erroring or duplicating data.
--
-- Operational data (categories, wordcloud stopwords, reports, conferences,
-- etc.) is intentionally NOT seeded here: it's managed through the admin UI
-- and changes independently of the schema, so baking a snapshot into this
-- file would just go stale again. A fresh environment starts with empty
-- tables for that data; only the schema and a default admin login are
-- provided so the app is usable immediately after setup.

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS conferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  location TEXT,
  description TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  is_multi_day INTEGER DEFAULT 0,
  start_time TEXT,
  end_time TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  category TEXT,
  organization TEXT,
  tags TEXT,
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  download_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  date TEXT,
  conference_id INTEGER
);

CREATE TABLE IF NOT EXISTS tech_analysis_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  summary TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  title TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  category_id INTEGER,
  category_name TEXT,
  status TEXT DEFAULT 'completed'
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wordcloud_stopwords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language TEXT NOT NULL CHECK (language IN ('korean', 'english')),
  words TEXT NOT NULL DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wordcloud_stopwords_language ON wordcloud_stopwords(language);

CREATE TABLE IF NOT EXISTS trend_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  summary TEXT,
  pdf_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS standard_recommend_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  vector_store_id TEXT,
  last_synced_at DATETIME,
  last_sync_status TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_api_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  openai_api_key TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default admin login (username: admin / password: admin123) so a fresh
-- environment can be accessed immediately. Change this password after
-- first login. Hash is SHA-256(password + SALT) per lib/crypto-utils.ts,
-- NOT bcrypt (the old migration this baseline replaces stored a stale
-- bcrypt hash left over from an abandoned better-auth integration, which
-- does not match this app's actual verifyPassword() implementation).
INSERT OR IGNORE INTO users (username, name, email, password_hash, role) VALUES
('admin', 'Admin', 'admin@example.com', '630e465d031ac6b68a8d0a2a0e4d99f1574bc52d368fd0396d01f239570d5911', 'admin');
