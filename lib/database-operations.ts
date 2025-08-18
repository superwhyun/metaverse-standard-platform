// Database operations using the adapter pattern

import { DatabaseAdapter } from './database-adapter';

// Category operations
export const createCategoryOperations = (db: DatabaseAdapter) => ({
  getAll: async () => {
    const stmt = db.prepare('SELECT * FROM categories ORDER BY name ASC');
    return await stmt.all();
  },
  getById: async (id: number) => {
    const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
    return await stmt.get([id]);
  },
  create: async (category: { name: string; description?: string }) => {
    const stmt = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
    const result = await stmt.run([category.name, category.description]);
    return { id: result.lastInsertRowid, ...category };
  },
  update: async (id: number, category: { name: string; description?: string }) => {
    const stmt = db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?');
    const result = await stmt.run([category.name, category.description, id]);
    if ((result.changes || 0) === 0) {
      throw new Error('Category not found or no changes made');
    }
    return { id, ...category };
  },
  delete: async (id: number) => {
    const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
    const result = await stmt.run([id]);
    return (result.changes || 0) > 0;
  }
});

// Tech Analysis Report operations
export const createTechAnalysisReportOperations = (db: DatabaseAdapter) => ({
  getAll: async () => {
    const stmt = db.prepare('SELECT * FROM tech_analysis_reports ORDER BY created_at DESC');
    return await stmt.all();
  },
  getPaginated: async (limit: number, offset: number, search?: string, categoryName?: string) => {
    let query = 'SELECT * FROM tech_analysis_reports';
    let params: any[] = [];
    let conditions: string[] = [];
    
    if (search && search.trim()) {
      conditions.push('(title LIKE ? OR summary LIKE ?)');
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern);
    }
    
    if (categoryName && categoryName !== 'all') {
      conditions.push('category_name = ?');
      params.push(categoryName);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const stmt = db.prepare(query);
    return await stmt.all(params);
  },
  getById: async (id: number) => {
    const stmt = db.prepare('SELECT * FROM tech_analysis_reports WHERE id = ?');
    return await stmt.get([id]);
  },
  create: async (report: { url: string; title: string; summary?: string | null; image_url?: string | null; category_name?: string | null }) => {
    console.log('DATABASE CREATE - Raw input:', report);
    
    // Explicitly handle undefined values
    const params = [
      report.url, 
      report.title, 
      report.summary === undefined ? null : report.summary, 
      report.image_url === undefined ? null : report.image_url, 
      report.category_name === undefined ? null : report.category_name
    ];
    
    console.log('DATABASE CREATE - Final params:', params);
    console.log('DATABASE CREATE - Param types:', params.map(p => typeof p));
    
    const stmt = db.prepare('INSERT INTO tech_analysis_reports (url, title, summary, image_url, category_name) VALUES (?, ?, ?, ?, ?)');
    const result = await stmt.run(params);
    return { id: result.lastInsertRowid, ...report };
  },
  update: async (id: number, report: { title: string; summary: string; url?: string; image_url?: string; category_name?: string }) => {
    const stmt = db.prepare('UPDATE tech_analysis_reports SET title = ?, summary = ?, url = ?, image_url = ?, category_name = ? WHERE id = ?');
    const result = await stmt.run([
      report.title, 
      report.summary, 
      report.url || null, 
      report.image_url || null, 
      report.category_name || null, 
      id
    ]);
    if ((result.changes || 0) === 0) {
      throw new Error('Report not found or no changes made');
    }
    return { id, ...report };
  },
  delete: async (id: number) => {
    const stmt = db.prepare('DELETE FROM tech_analysis_reports WHERE id = ?');
    const result = await stmt.run([id]);
    return (result.changes || 0) > 0;
  },
});

// Organization operations
export const createOrganizationOperations = (db: DatabaseAdapter) => ({
  getAll: async () => {
    const stmt = db.prepare('SELECT * FROM organizations ORDER BY name ASC');
    return await stmt.all();
  },
  create: async (organization: { name: string }) => {
    const stmt = db.prepare('INSERT INTO organizations (name) VALUES (?)');
    const result = await stmt.run([organization.name]);
    return { id: result.lastInsertRowid, ...organization };
  },
  delete: async (id: number) => {
    const stmt = db.prepare('DELETE FROM organizations WHERE id = ?');
    const result = await stmt.run([id]);
    return (result.changes || 0) > 0;
  }
});

// Conference operations
export const createConferenceOperations = (db: DatabaseAdapter) => ({
  getAll: async () => {
    const stmt = db.prepare(`
      SELECT * FROM conferences 
      ORDER BY start_date DESC
    `);
    const conferences = await stmt.all();
    const reportStmt = db.prepare(`
      SELECT id, title FROM reports WHERE conference_id = ?
    `);
    return Promise.all(conferences.map(async (conference: any) => {
      const reports = await reportStmt.all([conference.id]);
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
    }));
  },
  getByDateRange: async (startDate: string, endDate: string) => {
    const stmt = db.prepare(`
      SELECT * FROM conferences 
      WHERE (start_date <= ? AND end_date >= ?) 
         OR (start_date >= ? AND start_date <= ?)
      ORDER BY start_date ASC
    `);
    const conferences = await stmt.all([endDate, startDate, startDate, endDate]);
    const reportStmt = db.prepare(`
      SELECT id, title FROM reports WHERE conference_id = ?
    `);
    return Promise.all(conferences.map(async (conference: any) => {
      const reports = await reportStmt.all([conference.id]);
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
    }));
  },
  getByMonth: async (year: number, month: number) => {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-31`;
    const stmt = db.prepare(`
      SELECT * FROM conferences 
      WHERE (start_date <= ? AND end_date >= ?) 
         OR (start_date >= ? AND start_date <= ?)
      ORDER BY start_date ASC
    `);
    const conferences = await stmt.all([monthEnd, monthStart, monthStart, monthEnd]);
    const reportStmt = db.prepare(`
      SELECT id, title FROM reports WHERE conference_id = ?
    `);
    return Promise.all(conferences.map(async (conference: any) => {
      const reports = await reportStmt.all([conference.id]);
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
    }));
  },
  getById: async (id: number) => {
    const stmt = db.prepare(`
      SELECT * FROM conferences WHERE id = ?
    `);
    const conference = await stmt.get([id]);
    if (conference) {
      const reportStmt = db.prepare(`
        SELECT id, title FROM reports WHERE conference_id = ?
      `);
      const reports = await reportStmt.all([conference.id]);
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
  create: async (conference: {
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
    const result = await stmt.run([
      conference.title,
      conference.organization,
      conference.location || null,
      conference.description || null,
      conference.start_date,
      conference.end_date,
      conference.is_multi_day ? 1 : 0,
      conference.start_time || null,
      conference.end_time || null
    ]);
    return { id: result.lastInsertRowid, ...conference };
  },
  update: async (id: number, conference: Partial<{
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
    const result = await stmt.run([...values, id]);
    return (result.changes || 0) > 0;
  },
  delete: async (id: number) => {
    const stmt = db.prepare('DELETE FROM conferences WHERE id = ?');
    const result = await stmt.run([id]);
    return (result.changes || 0) > 0;
  }
});

// Report operations
export const createReportOperations = (db: DatabaseAdapter) => ({
  getAll: async () => {
    const stmt = db.prepare('SELECT * FROM reports ORDER BY created_at DESC');
    return await stmt.all();
  },
  getById: async (id: number) => {
    const stmt = db.prepare('SELECT * FROM reports WHERE id = ?');
    return await stmt.get([id]);
  },
  create: async (report: {
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
    const result = await stmt.run([
      report.title,
      report.date || null,
      report.summary || null,
      report.content || null,
      report.category || null,
      report.organization || null,
      report.tags || null,
      report.download_url || null,
      report.conference_id || null
    ]);
    return { id: result.lastInsertRowid, ...report };
  },
  update: async (id: number, report: Partial<{
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
    const result = await stmt.run([...values, id]);
    if ((result.changes || 0) > 0) {
      const selectStmt = db.prepare('SELECT * FROM reports WHERE id = ?');
      return await selectStmt.get([id]);
    }
    return null;
  },
  delete: async (id: number) => {
    const stmt = db.prepare('DELETE FROM reports WHERE id = ?');
    const result = await stmt.run([id]);
    return (result.changes || 0) > 0;
  }
});