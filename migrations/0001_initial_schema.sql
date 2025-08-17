-- Initial schema for metaverse standards platform

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  website TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Conferences table
CREATE TABLE IF NOT EXISTS conferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  organization TEXT,
  date TEXT,
  location TEXT,
  url TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  image_url TEXT,
  category_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT OR IGNORE INTO categories (name, description) VALUES 
('AI/ML', 'AI, Machine Learning, 딥러닝 관련 표준'),
('VR/AR', 'Virtual Reality, Augmented Reality, Mixed Reality 표준'),
('Blockchain', '블록체인, 암호화폐, Web3 관련 표준'),
('IoT', 'Internet of Things, 스마트 디바이스 표준'),
('5G/6G', '차세대 통신 표준 및 네트워크 기술'),
('Cloud', '클라우드 컴퓨팅, 서버리스, 마이크로서비스 표준'),
('Security', '사이버보안, 암호화, 프라이버시 표준'),
('Data', '데이터 포맷, 프로토콜, 저장 표준'),
('Web', '웹 표준, API, 브라우저 기술'),
('Mobile', '모바일 앱, 플랫폼, OS 표준');