/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    MSP: D1Database;
    MSP_TREND_INSIGHTS: R2Bucket;
    OPENAI_API_KEY: string;
    JWT_SECRET: string;
  }

}

export { };
