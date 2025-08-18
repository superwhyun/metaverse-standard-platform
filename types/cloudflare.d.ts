/// <reference types="@cloudflare/workers-types" />

declare global {
  interface CloudflareEnv {
    MSP: D1Database;
  }
}

export {};