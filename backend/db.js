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

  seedContas();

  return db;
}

export function getDB() {
  if (!db) {
    return initDB();
  }
  return db;
}

function seedContas() {
  const defaultContas = [
    { nome: 'C6 Bank', tipo: 'banco' },
    { nome: '99Pay', tipo: 'carteira' },
    { nome: 'Mercado Pago', tipo: 'carteira' },
    { nome: 'Rico', tipo: 'corretora' },
    { nome: 'Binance', tipo: 'corretora' },
    { nome: 'Nomad', tipo: 'carteira' },
    { nome: 'Nubank', tipo: 'banco' },
    { nome: 'Caixa', tipo: 'banco' },
    { nome: 'Itau', tipo: 'banco' },
    { nome: 'Inter', tipo: 'banco' },
    { nome: 'Santander', tipo: 'banco' },
    { nome: 'Sicoob Guid', tipo: 'banco' },
  ];

  const insert = db.prepare('INSERT OR IGNORE INTO contas (nome, tipo) VALUES (@nome, @tipo)');
  for (const c of defaultContas) {
    insert.run(c);
  }
}

export function closeDB() {
  if (db) {
    db.close();
    db = null;
  }
}
