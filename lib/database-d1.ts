// D1 database operations for Cloudflare Pages environment

export interface D1Database {
  prepare(sql: string): {
    bind(...params: any[]): {
      first(): Promise<any>;
      all(): Promise<{ results: any[] }>;
      run(): Promise<{ meta: { last_row_id?: number; changes?: number } }>;
    };
  };
}

// Get D1 database from Cloudflare environment
export function getD1Database(env: any): D1Database | null {
  return env?.MSP || null;
}

// D1 Category operations
export const d1CategoryOperations = {
  getAll: async (db: D1Database) => {
    const result = await db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
    return result.results || [];
  },
  getById: async (db: D1Database, id: number) => {
    return await db.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first();
  },
  create: async (db: D1Database, category: { name: string; description?: string }) => {
    const result = await db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)').bind(category.name, category.description).run();
    return { id: result.meta?.last_row_id, ...category };
  },
  update: async (db: D1Database, id: number, category: { name: string; description?: string }) => {
    const result = await db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?').bind(category.name, category.description, id).run();
    if (result.meta?.changes === 0) {
      throw new Error('Category not found or no changes made');
    }
    return { id, ...category };
  },
  delete: async (db: D1Database, id: number) => {
    const result = await db.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
    return (result.meta?.changes || 0) > 0;
  }
};

// D1 Tech Analysis Report operations
export const d1TechAnalysisReportOperations = {
  getAll: async (db: D1Database) => {
    const result = await db.prepare('SELECT * FROM tech_analysis_reports ORDER BY created_at DESC').all();
    return result.results || [];
  },
  getPaginated: async (db: D1Database, limit: number, offset: number, search?: string, categoryName?: string) => {
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
    let boundStmt = stmt;
    for (const param of params) {
      boundStmt = boundStmt.bind(param);
    }
    
    const result = await boundStmt.all();
    return result.results || [];
  },
  getById: async (db: D1Database, id: number) => {
    return await db.prepare('SELECT * FROM tech_analysis_reports WHERE id = ?').bind(id).first();
  },
  create: async (db: D1Database, report: { url: string; title: string; summary?: string; image_url?: string; category_name?: string }) => {
    const result = await db.prepare('INSERT INTO tech_analysis_reports (url, title, summary, image_url, category_name) VALUES (?, ?, ?, ?, ?)').bind(report.url, report.title, report.summary, report.image_url, report.category_name).run();
    return { id: result.meta?.last_row_id, ...report };
  },
  update: async (db: D1Database, id: number, report: { title: string; summary: string; url?: string; image_url?: string; category_name?: string }) => {
    const result = await db.prepare('UPDATE tech_analysis_reports SET title = ?, summary = ?, url = ?, image_url = ?, category_name = ? WHERE id = ?').bind(report.title, report.summary, report.url, report.image_url, report.category_name, id).run();
    if (result.meta?.changes === 0) {
      throw new Error('Report not found or no changes made');
    }
    return { id, ...report };
  },
  delete: async (db: D1Database, id: number) => {
    const result = await db.prepare('DELETE FROM tech_analysis_reports WHERE id = ?').bind(id).run();
    return (result.meta?.changes || 0) > 0;
  },
};