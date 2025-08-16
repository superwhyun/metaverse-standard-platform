import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'database.sqlite');

// Initialize database
let db: Database.Database;

try {
  db = new Database(DB_PATH);
  console.log('Database connection established');
} catch (error) {
  console.error('Database connection failed:', error);
  throw error;
}

// Create conferences table
const createConferencesTable = `
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
    has_report INTEGER DEFAULT 0,
    report_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports (id)
  )
`;

// Create reports table
const createReportsTable = `
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT,
    summary TEXT,
    content TEXT,
    category TEXT,
    organization TEXT,
    tags TEXT, -- JSON string array
    download_url TEXT,
    conference_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conference_id) REFERENCES conferences (id)
  )
`;

// Create indexes for better performance
const createIndexes = [
  'CREATE INDEX IF NOT EXISTS idx_conferences_start_date ON conferences(start_date)',
  'CREATE INDEX IF NOT EXISTS idx_conferences_end_date ON conferences(end_date)',
  'CREATE INDEX IF NOT EXISTS idx_conferences_organization ON conferences(organization)',
  'CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category)',
  'CREATE INDEX IF NOT EXISTS idx_reports_organization ON reports(organization)',
];

// Initialize tables and indexes
db.exec(createConferencesTable);
db.exec(createReportsTable);
createIndexes.forEach(index => db.exec(index));

// Migrate existing reports table to add missing columns
try {
  // Check if date column exists
  const tableInfo = db.prepare("PRAGMA table_info(reports)").all();
  const hasDate = tableInfo.some((col: any) => col.name === 'date');
  const hasConferenceId = tableInfo.some((col: any) => col.name === 'conference_id');
  
  if (!hasDate) {
    db.exec('ALTER TABLE reports ADD COLUMN date TEXT');
    console.log('Added date column to reports table');
  }
  
  if (!hasConferenceId) {
    db.exec('ALTER TABLE reports ADD COLUMN conference_id INTEGER REFERENCES conferences(id)');
    console.log('Added conference_id column to reports table');
  }
} catch (error) {
  console.log('Migration check completed or table already up to date');
}

// Conference operations
export const conferenceOperations = {
  // Get all conferences
  getAll: () => {
    const stmt = db.prepare(`
      SELECT c.*, r.title as report_title 
      FROM conferences c 
      LEFT JOIN reports r ON c.report_id = r.id 
      ORDER BY c.start_date DESC
    `);
    return stmt.all();
  },

  // Get conferences by date range (for calendar)
  getByDateRange: (startDate: string, endDate: string) => {
    const stmt = db.prepare(`
      SELECT c.*, r.title as report_title 
      FROM conferences c 
      LEFT JOIN reports r ON c.report_id = r.id 
      WHERE (c.start_date <= ? AND c.end_date >= ?) 
         OR (c.start_date >= ? AND c.start_date <= ?)
      ORDER BY c.start_date ASC
    `);
    return stmt.all(endDate, startDate, startDate, endDate);
  },

  // Get conferences by month (for calendar display)
  getByMonth: (year: number, month: number) => {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-31`;
    
    const stmt = db.prepare(`
      SELECT c.*, r.title as report_title 
      FROM conferences c 
      LEFT JOIN reports r ON c.report_id = r.id 
      WHERE (c.start_date <= ? AND c.end_date >= ?) 
         OR (c.start_date >= ? AND c.start_date <= ?)
      ORDER BY c.start_date ASC
    `);
    return stmt.all(monthEnd, monthStart, monthStart, monthEnd);
  },

  // Get single conference
  getById: (id: number) => {
    const stmt = db.prepare(`
      SELECT c.*, r.title as report_title 
      FROM conferences c 
      LEFT JOIN reports r ON c.report_id = r.id 
      WHERE c.id = ?
    `);
    return stmt.get(id);
  },

  // Create new conference
  create: (conference: {
    title: string;
    organization: string;
    location?: string;
    description?: string;
    start_date: string;
    end_date: string;
    is_multi_day: boolean;
    start_time?: string;
    end_time?: string;
    has_report: boolean;
    report_id?: number;
  }) => {
    const stmt = db.prepare(`
      INSERT INTO conferences (
        title, organization, location, description, 
        start_date, end_date, is_multi_day, start_time, end_time,
        has_report, report_id, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    const result = stmt.run(
      conference.title,
      conference.organization,
      conference.location || null,
      conference.description || null,
      conference.start_date,
      conference.end_date,
      conference.is_multi_day ? 1 : 0,
      conference.start_time || null,
      conference.end_time || null,
      conference.has_report ? 1 : 0,
      conference.report_id || null
    );
    
    return { id: result.lastInsertRowid, ...conference };
  },

  // Update conference
  update: (id: number, conference: Partial<{
    title: string;
    organization: string;
    location: string;
    description: string;
    start_date: string;
    end_date: string;
    is_multi_day: boolean;
    start_time: string;
    end_time: string;
    has_report: boolean;
    report_id: number;
  }>) => {
    const fields = Object.keys(conference).filter(key => conference[key as keyof typeof conference] !== undefined);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => {
      const value = conference[field as keyof typeof conference];
      if (field === 'is_multi_day' || field === 'has_report') {
        return value ? 1 : 0;
      }
      return value;
    });
    
    const stmt = db.prepare(`
      UPDATE conferences 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    const result = stmt.run(...values, id);
    return result.changes > 0;
  },

  // Delete conference
  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM conferences WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

// Report operations
export const reportOperations = {
  // Get all reports
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM reports ORDER BY created_at DESC');
    return stmt.all();
  },

  // Get single report
  getById: (id: number) => {
    const stmt = db.prepare('SELECT * FROM reports WHERE id = ?');
    return stmt.get(id);
  },

  // Create new report
  create: (report: {
    title: string;
    date?: string;
    summary?: string;
    content?: string;
    category?: string;
    organization?: string;
    tags?: string;
    download_url?: string;
    conference_id?: number;
  }) => {
    const stmt = db.prepare(`
      INSERT INTO reports (
        title, date, summary, content, category, organization, tags,
        download_url, conference_id, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    const result = stmt.run(
      report.title,
      report.date || null,
      report.summary || null,
      report.content || null,
      report.category || null,
      report.organization || null,
      report.tags || null,
      report.download_url || null,
      report.conference_id || null
    );
    
    return { id: result.lastInsertRowid, ...report };
  },

  // Update report
  update: (id: number, report: Partial<{
    title: string;
    date: string;
    summary: string;
    content: string;
    category: string;
    organization: string;
    tags: string;
    download_url: string;
    conference_id: number;
  }>) => {
    const fields = Object.keys(report).filter(key => report[key as keyof typeof report] !== undefined);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => report[field as keyof typeof report]);
    
    const stmt = db.prepare(`
      UPDATE reports 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    const result = stmt.run(...values, id);
    if (result.changes > 0) {
      return reportOperations.getById(id);
    }
    return null;
  },

  // Delete report
  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM reports WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

export default db;