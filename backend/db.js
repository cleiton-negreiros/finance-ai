import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'database', 'finance.db');
const SCHEMA_PATH = join(__dirname, '..', 'database', 'schema.sql');

let db;

export function initDB() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schema = readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);

  return db;
}

export function getDB() {
  if (!db) {
    return initDB();
  }
  return db;
}

export function closeDB() {
  if (db) {
    db.close();
    db = null;
  }
}
