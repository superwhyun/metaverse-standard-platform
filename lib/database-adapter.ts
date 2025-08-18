// Database adapter for D1 (Cloudflare's SQLite database)
import { getRequestContext } from '@cloudflare/next-on-pages';

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



// Factory function to create D1 adapter
export async function createDatabaseAdapter(): Promise<DatabaseAdapter> {
  try {
    // Use @cloudflare/next-on-pages getRequestContext to access D1 binding
    const { env } = getRequestContext();
    if (env?.MSP) {
      console.log('Using D1 database (next-on-pages)');
      return new D1Adapter(env.MSP);
    }
  } catch (error) {
    // getRequestContext() may fail in some environments, fall back to other methods
    console.log('getRequestContext() failed, trying alternative methods:', error);
  }

  // Fallback: Check if we're in a Cloudflare Pages environment with D1 binding
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

  // Try to access through Next.js runtime context (for @cloudflare/next-on-pages)
  if (typeof globalThis !== 'undefined') {
    const runtime = (globalThis as any).__CF_RUNTIME__;
    if (runtime?.env?.MSP) {
      console.log('Using D1 database (Next.js Cloudflare Runtime)');
      return new D1Adapter(runtime.env.MSP);
    }
  }
  
  // For development, we need to use wrangler to provide D1 binding
  console.warn('D1 database binding (MSP) not found. Please use "npm run dev:cloudflare" to run with D1 support.');
  throw new Error('D1 database binding (MSP) not found. Please configure D1 database in wrangler.toml and use "npm run dev:cloudflare" for development.');
}