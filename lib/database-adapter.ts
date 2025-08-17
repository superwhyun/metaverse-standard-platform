// Database adapter that supports both SQLite (local) and D1 (production)

export interface DatabaseStatement {
  get(params?: any): any;
  all(params?: any): any[];
  run(params?: any): { lastInsertRowid?: number; changes?: number };
}

export interface DatabaseAdapter {
  prepare(sql: string): DatabaseStatement;
  exec(sql: string): void;
  pragma(pragma: string): void;
}

// SQLite adapter for local development
export class SQLiteAdapter implements DatabaseAdapter {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  prepare(sql: string): DatabaseStatement {
    const stmt = this.db.prepare(sql);
    return {
      get: (params?: any) => {
        if (!params) {
          return stmt.get();
        }
        if (Array.isArray(params)) {
          return stmt.get(...params);
        }
        return stmt.get(params);
      },
      all: (params?: any) => {
        if (!params) {
          return stmt.all();
        }
        if (Array.isArray(params)) {
          return stmt.all(...params);
        }
        return stmt.all(params);
      },
      run: (params?: any) => {
        if (!params) {
          return stmt.run();
        }
        if (Array.isArray(params)) {
          return stmt.run(...params);
        }
        return stmt.run(params);
      }
    };
  }

  exec(sql: string) {
    this.db.exec(sql);
  }

  pragma(pragma: string) {
    this.db.pragma(pragma);
  }
}

// D1 adapter for Cloudflare production
export class D1Adapter implements DatabaseAdapter {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  prepare(sql: string): DatabaseStatement {
    return {
      get: async (params?: any) => {
        let stmt = this.db.prepare(sql);
        if (params) {
          if (Array.isArray(params)) {
            stmt = stmt.bind(...params);
          } else {
            stmt = stmt.bind(params);
          }
        }
        return await stmt.first();
      },
      all: async (params?: any) => {
        let stmt = this.db.prepare(sql);
        if (params) {
          if (Array.isArray(params)) {
            stmt = stmt.bind(...params);
          } else {
            stmt = stmt.bind(params);
          }
        }
        const result = await stmt.all();
        return result.results || [];
      },
      run: async (params?: any) => {
        let stmt = this.db.prepare(sql);
        if (params) {
          if (Array.isArray(params)) {
            stmt = stmt.bind(...params);
          } else {
            stmt = stmt.bind(params);
          }
        }
        const result = await stmt.run();
        return {
          lastInsertRowid: result.meta?.last_row_id,
          changes: result.meta?.changes || 0
        };
      }
    };
  }

  exec(sql: string) {
    // D1 doesn't have exec, use prepare + run
    return this.db.prepare(sql).run();
  }

  pragma(pragma: string) {
    // D1 doesn't support pragma, ignore
    console.log(`D1: Ignoring pragma: ${pragma}`);
  }
}

// Factory function to create the appropriate adapter
export function createDatabaseAdapter(env?: any): DatabaseAdapter {
  // Check for environment variable to force D1 usage in local development
  const forceD1 = process.env.FORCE_D1 === 'true';
  
  // Check if we're in Cloudflare environment and have D1 database
  if (env?.MSP) {
    console.log('Using D1 database (Cloudflare)');
    return new D1Adapter(env.MSP);
  }
  
  if (forceD1) {
    console.log('Using D1 database (Local via wrangler)');
    // Import LocalD1Adapter dynamically to avoid issues
    const { LocalD1Adapter } = require('./d1-local');
    const localD1 = new LocalD1Adapter('msp');
    return new D1Adapter(localD1);
  }
  
  // Fallback to SQLite for local development
  console.log('Using SQLite database');
  const Database = require('better-sqlite3');
  const path = require('path');
  
  const DB_PATH = path.join(process.cwd(), 'data', 'database.sqlite');
  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = OFF');
  
  return new SQLiteAdapter(db);
}

// Helper function to get database adapter from request context
export function getDatabaseAdapter(request?: Request, env?: any): DatabaseAdapter {
  return createDatabaseAdapter(env);
}