/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    MSP: D1Database;
    STANDARD_SEARCH_CACHE: KVNamespace;
    OPENAI_API_KEY: string;
  }
}

export {};