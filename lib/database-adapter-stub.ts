// Stub file for environments where Node.js adapter is not available
import { DatabaseAdapter } from './database-adapter';

export function getNodeAdapter(): DatabaseAdapter {
  throw new Error('Node.js database adapter not available in this environment. Use Cloudflare D1 instead.');
}