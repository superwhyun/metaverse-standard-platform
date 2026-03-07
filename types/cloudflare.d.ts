/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    MSP: D1Database;
    STANDARD_SEARCH_CACHE: KVNamespace;
    STANDARD_SEARCH_QUEUE: { send(message: any): Promise<void> };
    OPENAI_API_KEY: string;
  }
}

export {};
