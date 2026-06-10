import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import readline from 'readline';
import crypto from 'crypto';
import { getDB } from './db.js';
import { categorizar } from './categorizer.js';
import { normalize as normalizeC6 } from './normalizers/c6.js';
import { normalize as normalizeMercadopago } from './normalizers/mercadopago.js';
import { normalize as normalizeBinance } from './normalizers/binance.js';
import { normalize as normalizeRico } from './normalizers/rico.js';
import { normalize as normalizeNomad } from './normalizers/nomad.js';
import { normalize as normalize99Pay } from './normalizers/99pay.js';

const NORMALIZADORES = {
  c6: normalizeC6,
  mercadopago: normalizeMercadopago,
  binance: normalizeBinance,
  rico: normalizeRico,
  nomad: normalizeNomad,
  '99pay': normalize99Pay,
};

function gerarHash(transacao) {
  const raw = `${transacao.data}-${transacao.valor}-${transacao.descricao}-${transacao.fonte}`;
  return crypto.createHash('md5').update(raw).digest('hex');
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function importCSV(filePath, fonte) {
  const db = getDB();
  const normalizer = NORMALIZADORES[fonte];

  if (!normalizer) {
    throw new Error(`Normalizador nao encontrado para fonte: ${fonte}`);
  }

  const linhas = [];
  let headers = [];

  const rl = readline.createInterface({
    input: createReadStream(filePath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });

  let isFirstLine = true;

  for await (const line of rl) {
    if (isFirstLine) {
      headers = parseCSVLine(line).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
      isFirstLine = false;
      continue;
    }

    if (!line.trim()) continue;

    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || '';
    });

    linhas.push(row);
  }

  const processed = [];
  const ignored = [];

  for (const row of linhas) {
    try {
      const normalized = normalizer(row, fonte);

      if (!normalized.categoria) {
        normalized.categoria = categorizar(normalized.descricao);
      }

      normalized.hash = gerarHash(normalized);

      processed.push(normalized);
    } catch (err) {
      ignored.push({ row, error: err.message });
    }
  }

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO transacoes (fonte, conta, tipo, valor, moeda, descricao, categoria, data, hash)
    VALUES (@fonte, @conta, @tipo, @valor, @moeda, @descricao, @categoria, @data, @hash)
  `);

  let insertedCount = 0;

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      const result = insertStmt.run(row);
      if (result.changes > 0) {
        insertedCount++;
      }
    }
  });

  insertMany(processed);

  return {
    total: linhas.length,
    inseridas: insertedCount,
    ignoradas: ignored.length,
    duplicatas: processed.length - insertedCount,
  };
}
