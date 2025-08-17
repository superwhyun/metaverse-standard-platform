import { SQLiteAdapter, DatabaseAdapter } from './database-adapter';
import Database from 'better-sqlite3';
import path from 'path';

// This function is only ever called in a Node.js environment.
export function getNodeAdapter(): DatabaseAdapter {
  console.log('Using SQLite database');
  const DB_PATH = path.join(process.cwd(), 'data', 'database.sqlite');
  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = OFF');
  return new SQLiteAdapter(db);
}
