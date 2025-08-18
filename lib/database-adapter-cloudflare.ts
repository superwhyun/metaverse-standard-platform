// Cloudflare-specific database adapter (D1 only)
import { DatabaseAdapter, D1Adapter } from './database-adapter';

export function getCloudflareAdapter(env: any): DatabaseAdapter {
  if (!env?.MSP) {
    throw new Error('D1 database not found in Cloudflare environment');
  }
  console.log('Using D1 database (Cloudflare)');
  return new D1Adapter(env.MSP);
}