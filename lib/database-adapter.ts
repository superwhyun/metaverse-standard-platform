// Database adapter that supports both SQLite (local) and D1 (production)

export interface DatabaseStatement {
  get(params?: any): Promise<any> | any;
  all(params?: any): Promise<any[]> | any[];
  run(params?: any): Promise<{ lastInsertRowid?: number; changes?: number }> | { lastInsertRowid?: number; changes?: number };
}

export interface DatabaseAdapter {
  prepare(sql: string): DatabaseStatement;
  exec(sql: string): void | Promise<void>;
  pragma(pragma: string): void;
}

// This class is safe for both environments
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
          stmt = Array.isArray(params) ? stmt.bind(...params) : stmt.bind(params);
        }
        return await stmt.first();
      },
      all: async (params?: any) => {
        let stmt = this.db.prepare(sql);
        if (params) {
          stmt = Array.isArray(params) ? stmt.bind(...params) : stmt.bind(params);
        }
        const result = await stmt.all();
        return result.results || [];
      },
      run: async (params?: any) => {
        let stmt = this.db.prepare(sql);
        if (params) {
          stmt = Array.isArray(params) ? stmt.bind(...params) : stmt.bind(params);
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
    return this.db.prepare(sql).run();
  }

  pragma(pragma: string) {
    console.log(`D1: Ignoring pragma: ${pragma}`);
  }
}

// This class is only used in the Node.js environment via database-adapter-node.ts
export class SQLiteAdapter implements DatabaseAdapter {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  prepare(sql: string): DatabaseStatement {
    const stmt = this.db.prepare(sql);
    return {
      get: (params?: any) => Array.isArray(params) ? stmt.get(...params) : stmt.get(params),
      all: (params?: any) => Array.isArray(params) ? stmt.all(...params) : stmt.all(params),
      run: (params?: any) => Array.isArray(params) ? stmt.run(...params) : stmt.run(params)
    };
  }

  exec(sql: string) {
    this.db.exec(sql);
  }

  pragma(pragma: string) {
    this.db.pragma(pragma);
  }
}


// Factory function to create the appropriate adapter
export async function createDatabaseAdapter(): Promise<DatabaseAdapter> {
  // Check for CF_PAGES environment variable (set when building for Cloudflare)
  if (process.env.CF_PAGES) {
    console.log('CF_PAGES environment detected');
    
    // Check if we're in a Cloudflare Pages environment with D1 binding
    // In Cloudflare Pages Functions, D1 is available through globalThis
    if (typeof globalThis !== 'undefined' && (globalThis as any).MSP) {
      console.log('Using D1 database (Cloudflare - global)');
      return new D1Adapter((globalThis as any).MSP);
    }
    
    // In wrangler dev, the binding might be available differently
    if (typeof globalThis !== 'undefined' && (globalThis as any).env?.MSP) {
      console.log('Using D1 database (Cloudflare - env)');
      return new D1Adapter((globalThis as any).env.MSP);
    }
    
    // For Cloudflare simulation without actual D1, create a mock
    console.warn('Cloudflare Pages environment detected but no D1 database binding found. Using mock adapter.');
    throw new Error('D1 database binding (MSP) not found. Please configure D1 database in wrangler.toml or Cloudflare Pages settings.');
  }

  // If not in Cloudflare, we must be in a local Node.js environment.
  // We dynamically import the node-specific file here.
  try {
    const { getNodeAdapter } = await import('./database-adapter-node');
    return getNodeAdapter();
  } catch (error) {
    console.error('Database adapter error:', error);
    throw new Error('Failed to load Node.js database adapter. Make sure you are running in a Node.js environment with better-sqlite3 installed.');
  }
}