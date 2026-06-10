import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'database', 'finance.db');
const SCHEMA_PATH = join(__dirname, '..', 'database', 'schema.sql');

let db;

export async function initDB() {
  const SQL = await initSqlJs();
  
  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  const schema = readFileSync(SCHEMA_PATH, 'utf-8');
  db.run(schema);

  seedContas();

  return db;
}

export function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return db;
}

export function saveDB() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(DB_PATH, buffer);
  }
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
  ];

  const stmt = db.prepare('INSERT OR IGNORE INTO contas (nome, tipo) VALUES (?, ?)');
  for (const c of defaultContas) {
    stmt.run([c.nome, c.tipo]);
  }
  stmt.free();
}

export function closeDB() {
  if (db) {
    saveDB();
    db.close();
    db = null;
  }
}
