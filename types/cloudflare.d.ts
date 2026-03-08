/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    MSP: D1Database;
    STANDARD_SEARCH_CACHE: KVNamespace;
    STANDARD_SEARCH_QUEUE: { send(message: any): Promise<void> };
    MSP_TREND_INSIGHTS: R2Bucket;
    OPENAI_API_KEY: string;
    JWT_SECRET: string;
  }

}

export { };
