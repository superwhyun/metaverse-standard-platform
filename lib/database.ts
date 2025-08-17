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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

// Create organizations table
const createOrganizationsTable = `
  CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )
`;

// Create categories table
const createCategoriesTable = `
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
  )
`;

// Create tech_analysis_reports table
const createTechAnalysisReportsTable = `
  CREATE TABLE IF NOT EXISTS tech_analysis_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

// Create indexes for better performance
const createIndexes = [
  'CREATE INDEX IF NOT EXISTS idx_conferences_start_date ON conferences(start_date)',
  'CREATE INDEX IF NOT EXISTS idx_conferences_end_date ON conferences(end_date)',
  'CREATE INDEX IF NOT EXISTS idx_conferences_organization ON conferences(organization)',
  'CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category)',
  'CREATE INDEX IF NOT EXISTS idx_reports_organization ON reports(organization)',
  'CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name)',
  'CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)',
];

// Initialize tables and indexes
db.exec(createConferencesTable);
db.exec(createReportsTable);
db.exec(createOrganizationsTable);
db.exec(createCategoriesTable);
db.exec(createTechAnalysisReportsTable);
createIndexes.forEach(index => db.exec(index));

// --- MIGRATIONS ---

// Migration: Remove unnecessary columns from conferences table
try {
  const conferenceTableInfo = db.prepare("PRAGMA table_info(conferences)").all();
  const hasReportColumn = conferenceTableInfo.some((col: any) => col.name === 'has_report');
  const reportIdColumn = conferenceTableInfo.some((col: any) => col.name === 'report_id');
  
  if (hasReportColumn || reportIdColumn) {
    console.log('Migrating conferences table to remove has_report and report_id columns...');
    db.exec('PRAGMA foreign_keys = OFF');
    db.exec('BEGIN TRANSACTION');
    db.exec(`
      CREATE TABLE conferences_new (
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
      )
    `);
    db.exec(`
      INSERT INTO conferences_new (id, title, organization, location, description, start_date, end_date, is_multi_day, start_time, end_time, created_at, updated_at)
      SELECT id, title, organization, location, description, start_date, end_date, is_multi_day, start_time, end_time, created_at, updated_at
      FROM conferences
    `);
    db.exec('DROP TABLE conferences');
    db.exec('ALTER TABLE conferences_new RENAME TO conferences');
    db.exec('COMMIT');
    db.exec('PRAGMA foreign_keys = ON');
    console.log('Migration completed: has_report and report_id columns removed');
  }
} catch (error) {
  console.log('Conference migration skipped or failed:', error);
}

// Migration: Add missing columns to reports table
try {
  const reportTableInfo = db.prepare("PRAGMA table_info(reports)").all();
  const hasDate = reportTableInfo.some((col: any) => col.name === 'date');
  const hasConferenceId = reportTableInfo.some((col: any) => col.name === 'conference_id');
  
  if (!hasDate) {
    db.exec('ALTER TABLE reports ADD COLUMN date TEXT');
  }
  if (!hasConferenceId) {
    db.exec('ALTER TABLE reports ADD COLUMN conference_id INTEGER REFERENCES conferences(id)');
  }
} catch (error) {
  console.log('Report migration skipped or failed:', error);
}

// Migration: Add missing columns to tech_analysis_reports table
try {
  const techTableInfo = db.prepare("PRAGMA table_info(tech_analysis_reports)").all();
  const hasTitle = techTableInfo.some((col: any) => col.name === 'title');
  const hasImageUrl = techTableInfo.some((col: any) => col.name === 'image_url');

  if (!hasTitle) {
    db.exec("ALTER TABLE tech_analysis_reports ADD COLUMN title TEXT NOT NULL DEFAULT ''");
  }
  if (!hasImageUrl) {
    db.exec("ALTER TABLE tech_analysis_reports ADD COLUMN image_url TEXT");
  }
} catch (error) {
    console.log('Tech analysis report migration skipped or failed:', error);
}

// Migration: Add description column to categories table
try {
    const categoryTableInfo = db.prepare("PRAGMA table_info(categories)").all();
    const hasDescription = categoryTableInfo.some((col: any) => col.name === 'description');
    if (!hasDescription) {
        db.exec("ALTER TABLE categories ADD COLUMN description TEXT");
    }
} catch (error) {
    console.log('Category migration skipped or failed:', error);
}

// Migration: Add category_id column to tech_analysis_reports table
try {
    const techTableInfo = db.prepare("PRAGMA table_info(tech_analysis_reports)").all();
    const hasCategoryId = techTableInfo.some((col: any) => col.name === 'category_id');
    
    if (!hasCategoryId) {
        db.exec("ALTER TABLE tech_analysis_reports ADD COLUMN category_id INTEGER REFERENCES categories(id)");
        console.log('Added category_id column to tech_analysis_reports table');
    }
} catch (error) {
    console.log('Tech analysis reports category migration skipped or failed:', error);
}


// --- DATABASE OPERATIONS ---

// Category operations
export const categoryOperations = {
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM categories ORDER BY name ASC');
    return stmt.all();
  },
  create: (category: { name: string; description?: string }) => {
    const stmt = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
    const result = stmt.run(category.name, category.description);
    return { id: result.lastInsertRowid, ...category };
  },
  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

// Tech Analysis Report operations
export const techAnalysisReportOperations = {
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM tech_analysis_reports ORDER BY created_at DESC');
    return stmt.all();
  },
  getPaginated: (limit: number, offset: number, search?: string, categoryId?: string) => {
    let query = 'SELECT t.*, c.name as category_name FROM tech_analysis_reports t LEFT JOIN categories c ON t.category_id = c.id';
    let params: any[] = [];
    let conditions: string[] = [];
    
    if (search && search.trim()) {
      conditions.push('(t.title LIKE ? OR t.summary LIKE ?)');
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern);
    }
    
    if (categoryId && categoryId !== 'all') {
      conditions.push('t.category_id = ?');
      params.push(parseInt(categoryId));
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  },
  getById: (id: number) => {
    const stmt = db.prepare('SELECT * FROM tech_analysis_reports WHERE id = ?');
    return stmt.get(id);
  },
  create: (report: { url: string; title: string; summary?: string; image_url?: string; category_id?: number }) => {
    const stmt = db.prepare('INSERT INTO tech_analysis_reports (url, title, summary, image_url, category_id) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(report.url, report.title, report.summary, report.image_url, report.category_id);
    return { id: result.lastInsertRowid, ...report };
  },
  update: (id: number, report: { title: string; summary: string; url?: string; image_url?: string; category_id?: number }) => {
    const stmt = db.prepare('UPDATE tech_analysis_reports SET title = ?, summary = ?, url = ?, image_url = ?, category_id = ? WHERE id = ?');
    const result = stmt.run(report.title, report.summary, report.url, report.image_url, report.category_id, id);
    if (result.changes === 0) {
      throw new Error('Report not found or no changes made');
    }
    return { id, ...report };
  },
  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM tech_analysis_reports WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },
};

// Organization operations
export const organizationOperations = {
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM organizations ORDER BY name ASC');
    return stmt.all();
  },
  create: (organization: { name: string }) => {
    const stmt = db.prepare('INSERT INTO organizations (name) VALUES (?)');
    const result = stmt.run(organization.name);
    return { id: result.lastInsertRowid, ...organization };
  },
  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM organizations WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

// Conference operations
export const conferenceOperations = {
  getAll: () => {
    const stmt = db.prepare(`
      SELECT * FROM conferences 
      ORDER BY start_date DESC
    `);
    const conferences = stmt.all();
    const reportStmt = db.prepare(`
      SELECT id, title FROM reports WHERE conference_id = ?
    `);
    return conferences.map(conference => {
      const reports = reportStmt.all(conference.id);
      return {
        ...conference,
        startDate: conference.start_date,
        endDate: conference.end_date,
        isMultiDay: Boolean(conference.is_multi_day),
        hasReport: reports.length > 0,
        startTime: conference.start_time,
        endTime: conference.end_time,
        reports: reports
      };
    });
  },
  getByDateRange: (startDate: string, endDate: string) => {
    const stmt = db.prepare(`
      SELECT * FROM conferences 
      WHERE (start_date <= ? AND end_date >= ?) 
         OR (start_date >= ? AND start_date <= ?)
      ORDER BY start_date ASC
    `);
    const conferences = stmt.all(endDate, startDate, startDate, endDate);
    const reportStmt = db.prepare(`
      SELECT id, title FROM reports WHERE conference_id = ?
    `);
    return conferences.map(conference => {
      const reports = reportStmt.all(conference.id);
      return {
        ...conference,
        startDate: conference.start_date,
        endDate: conference.end_date,
        isMultiDay: Boolean(conference.is_multi_day),
        hasReport: reports.length > 0,
        startTime: conference.start_time,
        endTime: conference.end_time,
        reports: reports
      };
    });
  },
  getByMonth: (year: number, month: number) => {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-31`;
    const stmt = db.prepare(`
      SELECT * FROM conferences 
      WHERE (start_date <= ? AND end_date >= ?) 
         OR (start_date >= ? AND start_date <= ?)
      ORDER BY start_date ASC
    `);
    const conferences = stmt.all(monthEnd, monthStart, monthStart, monthEnd);
    const reportStmt = db.prepare(`
      SELECT id, title FROM reports WHERE conference_id = ?
    `);
    return conferences.map(conference => {
      const reports = reportStmt.all(conference.id);
      return {
        ...conference,
        startDate: conference.start_date,
        endDate: conference.end_date,
        isMultiDay: Boolean(conference.is_multi_day),
        hasReport: reports.length > 0,
        startTime: conference.start_time,
        endTime: conference.end_time,
        reports: reports
      };
    });
  },
  getById: (id: number) => {
    const stmt = db.prepare(`
      SELECT * FROM conferences WHERE id = ?
    `);
    const conference = stmt.get(id);
    if (conference) {
      const reportStmt = db.prepare(`
        SELECT id, title FROM reports WHERE conference_id = ?
      `);
      const reports = reportStmt.all(conference.id);
      return {
        ...conference,
        startDate: conference.start_date,
        endDate: conference.end_date,
        isMultiDay: Boolean(conference.is_multi_day),
        hasReport: reports.length > 0,
        startTime: conference.start_time,
        endTime: conference.end_time,
        reports: reports
      };
    }
    return conference;
  },
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
  }) => {
    const stmt = db.prepare(`
      INSERT INTO conferences (
        title, organization, location, description, 
        start_date, end_date, is_multi_day, start_time, end_time,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
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
      conference.end_time || null
    );
    return { id: result.lastInsertRowid, ...conference };
  },
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
  }>) => {
    const fields = Object.keys(conference).filter(key => conference[key as keyof typeof conference] !== undefined);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => {
      const value = conference[field as keyof typeof conference];
      if (field === 'is_multi_day') {
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
  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM conferences WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

// Report operations
export const reportOperations = {
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM reports ORDER BY created_at DESC');
    return stmt.all();
  },
  getById: (id: number) => {
    const stmt = db.prepare('SELECT * FROM reports WHERE id = ?');
    return stmt.get(id);
  },
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
  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM reports WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
};

export default db;
