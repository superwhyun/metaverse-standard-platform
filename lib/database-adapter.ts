// Database adapter for D1 (Cloudflare's SQLite database)
import { getRequestContext } from '@cloudflare/next-on-pages';

export type SqlValue = string | number | boolean | null | undefined;

// Minimal surface of Cloudflare's D1Database binding that this adapter uses.
// Row shapes vary per query, so `first`/`all` intentionally return `any` here
// rather than forcing every one of the ~60 call sites in database-operations.ts
// to declare a per-query row type.
interface D1PreparedStatement {
  bind(...values: SqlValue[]): D1PreparedStatement;
  first(): Promise<any>;
  all(): Promise<{ results: any[] }>;
  run(): Promise<{ meta: { last_row_id?: number; changes?: number } }>;
}

interface D1Database {
  prepare(sql: string): D1PreparedStatement;
}

interface CloudflareGlobalRuntime {
  MSP?: D1Database;
  env?: { MSP?: D1Database };
  __CF_RUNTIME__?: { env?: { MSP?: D1Database } };
}

export interface DatabaseStatement {
  get(params?: SqlValue[] | SqlValue): Promise<any>;
  all(params?: SqlValue[] | SqlValue): Promise<any[]>;
  run(params?: SqlValue[] | SqlValue): Promise<{ lastInsertRowid?: number; changes?: number }>;
}

export interface DatabaseAdapter {
  prepare(sql: string): DatabaseStatement;
  exec(sql: string): void | Promise<{ meta: { last_row_id?: number; changes?: number } }>;
  pragma(pragma: string): void;
}

// This class is safe for both environments
export class D1Adapter implements DatabaseAdapter {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  prepare(sql: string): DatabaseStatement {
    return {
      get: async (params?: SqlValue[] | SqlValue) => {
        let stmt = this.db.prepare(sql);
        if (params !== undefined) {
          stmt = Array.isArray(params) ? stmt.bind(...params) : stmt.bind(params);
        }
        return await stmt.first();
      },
      all: async (params?: SqlValue[] | SqlValue) => {
        let stmt = this.db.prepare(sql);
        if (params !== undefined) {
          stmt = Array.isArray(params) ? stmt.bind(...params) : stmt.bind(params);
        }
        const result = await stmt.all();
        return result.results || [];
      },
      run: async (params?: SqlValue[] | SqlValue) => {
        let stmt = this.db.prepare(sql);
        if (params !== undefined) {
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
      return new D1Adapter(env.MSP as D1Database);
    }
  } catch (error) {
    // getRequestContext() may fail in some environments, fall back to other methods
    console.log('getRequestContext() failed, trying alternative methods:', error);
  }

  const globalRuntime = globalThis as unknown as CloudflareGlobalRuntime;

  // Fallback: Check if we're in a Cloudflare Pages environment with D1 binding
  // In Cloudflare Pages Functions, D1 is available through globalThis
  if (globalRuntime.MSP) {
    console.log('Using D1 database (Cloudflare - global)');
    return new D1Adapter(globalRuntime.MSP);
  }

  // In wrangler dev, the binding might be available differently
  if (globalRuntime.env?.MSP) {
    console.log('Using D1 database (Cloudflare - env)');
    return new D1Adapter(globalRuntime.env.MSP);
  }

  // Try to access through Next.js runtime context (for @cloudflare/next-on-pages)
  if (globalRuntime.__CF_RUNTIME__?.env?.MSP) {
    console.log('Using D1 database (Next.js Cloudflare Runtime)');
    return new D1Adapter(globalRuntime.__CF_RUNTIME__.env.MSP);
  }

  // Fallback: Check process.env (for nodejs_compat_populate_process_env)
  const processEnvMSP = typeof process !== 'undefined'
    ? (process.env as unknown as { MSP?: D1Database }).MSP
    : undefined;
  if (processEnvMSP) {
    console.log('Using D1 database (process.env)');
    return new D1Adapter(processEnvMSP);
  }

  // For development, we need to use wrangler to provide D1 binding
  console.warn('D1 database binding (MSP) not found. Please use "npm run dev:cloudflare" to run with D1 support.');
  throw new Error('D1 database binding (MSP) not found. Please configure D1 database in wrangler.toml and use "npm run dev:cloudflare" for development.');
}
