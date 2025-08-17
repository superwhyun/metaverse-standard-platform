-- Drop existing tables and recreate with correct schema

DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS conferences;
DROP TABLE IF EXISTS organizations;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS tech_analysis_reports;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- Conferences table (updated to match current SQLite schema)
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

-- Reports table (updated to match current SQLite schema)
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

-- Tech analysis reports table (using category_name for loose coupling)
CREATE TABLE IF NOT EXISTS tech_analysis_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  title TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  category_id INTEGER,
  category_name TEXT
);

-- Default categories will be inserted via data migration