import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import { initDB, getDB } from './db.js';
import { categorizar } from './categorizer.js';

function parseCSV(text) {
  const lines = [];
  let current = '';
  let inQuotes = false;
  let row = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === '\n' && !inQuotes) {
      row.push(current.trim());
      if (row.length > 1 || row[0] !== '') {
        lines.push(row);
      }
      current = '';
      row = [];
    } else if (ch === '\r') {
      // skip
    } else if (ch === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }

  if (current.trim() || row.length > 0) {
    row.push(current.trim());
    if (row.length > 1 || row[0] !== '') {
      lines.push(row);
    }
  }

  return lines;
}

function parseBrNumber(str) {
  if (!str || str.trim() === '') return null;
  let s = str.trim();
  const negative = s.startsWith('-');
  if (negative) s = s.slice(1);
  s = s.replace(/\./g, '').replace(',', '.');
  const val = parseFloat(s);
  if (isNaN(val)) return null;
  return negative ? -val : val;
}

const MESES = {
  'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6,
  'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12,
};

function parseDate(str) {
  if (!str) return null;
  const m = str.trim().match(/^(\d{1,2})[.-](\w+)/);
  if (!m) return null;
  const dia = parseInt(m[1]);
  const mesNome = m[2].toLowerCase().slice(0, 3);
  const mes = MESES[mesNome];
  if (!mes || !dia) return null;

  let ano = 2026;
  // Para meses antes de junho (jan-mai), usa 2026 (pagamentos parcelados do ano)
  // Para meses depois de junho (jul-dez), provavelmente 2025 (parcelas de compras antigas)
  if (mes > 6) ano = 2025;

  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function gerarHash(transacao) {
  const raw = `${transacao.data}-${transacao.valor}-${transacao.descricao}-${transacao.fonte}-${transacao.tipo}-${transacao.conta}`;
  return createHash('md5').update(raw).digest('hex');
}

const TIPO_MAP = {
  'custo de vida': 'gasto',
  'despesa extra': 'gasto',
  'investimento': 'investimento',
  'receita fixa': 'entrada',
  'receita extra': 'entrada',
};

function mapTipo(macroType, subtype) {
  const key = (macroType || '').toLowerCase().trim();

  if (key === 'fluxo de caixa') return null;
  if (key === '-') {
    const sub = (subtype || '').toLowerCase().trim();
    if (sub === 'outros') return 'gasto';
    if (sub === 'resgate') return 'entrada';
    if (sub === 'emprestimo') return null; // Dívida Economato - pular
    if (sub === 'fluxo de caixa') return null;
    if (sub) return 'gasto';
    return null;
  }

  return TIPO_MAP[key] || null;
}

const CAT_SUBTIPO = {
  'shalom': 'shalom',
  'doações': 'doacoes',
  'rendimentos': 'rendimentos',
  'cb': 'cb',
  'resgate': 'resgate',
  'investimento': 'investimento',
  'salário': 'salario',
  'moradia': 'moradia',
  'casa': 'casa',
  'carro': 'carro',
  'combustível': 'combustivel',
  'mercado': 'mercado',
  'saúde': 'saude',
  'saude': 'saude',
  'vestuário': 'vestuario',
  'vestuario': 'vestuario',
  'alimentação': 'alimentacao',
  'alimentacao': 'alimentacao',
  'transporte': 'transporte',
  'telefone': 'telefone',
  'lazer': 'lazer',
  'diversos': 'diversos',
  'viagem': 'viagem',
  'educação': 'educacao',
  'estudos': 'estudos',
  'presente': 'presente',
  'teclado': 'teclado',
  'saque ref': 'saque',
  'emprestimo': 'emprestimo',
};

function mapCategoria(subtype) {
  if (!subtype) return null;
  const key = subtype.toLowerCase().trim();
  return CAT_SUBTIPO[key] || categorizar(subtype) || 'outros';
}

function isTransactionRow(row) {
  const dateStr = (row[0] || '').trim();
  return /^\d{1,2}[.-]/.test(dateStr);
}

function isRendimentos(row) {
  return (row[1] || '').toLowerCase().trim() === 'rendimentos';
}

function isFluxoCaixa(row) {
  return (row[2] || '').toLowerCase().trim() === 'fluxo de caixa';
}

function shouldSkip(row) {
  const desc = (row[1] || '').toLowerCase().trim();
  const macro = (row[2] || '').toLowerCase().trim();
  const sub = (row[3] || '').toLowerCase().trim();

  if (desc === 'c6' && macro === '' && sub === '') return true;
  if (desc === '' && macro === '' && sub === '') return true;
  if (macro === 'fluxo de caixa') return true;
  if (macro === '-' && sub === 'emprestimo') return true;

  return false;
}

function extractValue(row) {
  // Col 19 is the UNIVERSAL tracking value - always present, across all accounts
  let val = parseBrNumber(row[19]);
  if (val !== null && val !== 0) return val;

  // Fallback: try col 4 (C6 transaction amount)
  val = parseBrNumber(row[4]);
  if (val !== null && val !== 0) return val;

  // Last resort: scan tracking area
  for (let i = 18; i < row.length && i < 23; i++) {
    val = parseBrNumber(row[i]);
    if (val !== null && val !== 0) return val;
  }

  return 0;
}

async function importPlanilha(filePath) {
  const db = getDB();
  const text = readFileSync(filePath, 'utf-8');
  const rows = parseCSV(text);

  console.log(`Total linhas no CSV: ${rows.length}`);

  const transactions = [];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!isTransactionRow(row)) continue;
    if (shouldSkip(row)) continue;

    const dateStr = row[0];
    const descricao = (row[1] || '').trim();
    const macroType = (row[2] || '').trim();
    const subtype = (row[3] || '').trim();

    const tipo = mapTipo(macroType, subtype);
    if (tipo === null) continue;

    const data = parseDate(dateStr);
    if (!data) {
      console.log(`  [pular] data invalida: "${dateStr}"`);
      continue;
    }

    const valor = extractValue(row);

    if (valor === 0) {
      console.log(`  [pular] valor zero: ${data} ${descricao} (${macroType}/${subtype})`);
      continue;
    }

    // SIGN RULE:
    //   valor > 0 (positive) = money IN  → entrada
    //   valor < 0 (negative) = money OUT → gasto or investimento (mapped tipo)
    const mappedTipo = tipo;
    const tipoFinal = valor > 0 ? 'entrada' : mappedTipo;

    const absValor = Math.abs(valor);
    const categoria = mapCategoria(subtype) || 'outros';

    const t = {
      data,
      tipo: tipoFinal,
      valor: absValor,
      moeda: 'BRL',
      conta: 'C6 Bank',
      descricao: descricao || '(sem descricao)',
      categoria,
      fonte: 'planilha',
    };

    t.hash = gerarHash(t);
    transactions.push(t);
  }

  console.log(`Transacoes extraidas: ${transactions.length}`);

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO transacoes (fonte, conta, tipo, valor, moeda, descricao, categoria, data, hash)
    VALUES (@fonte, @conta, @tipo, @valor, @moeda, @descricao, @categoria, @data, @hash)
  `);

  let inserted = 0;
  let duplicates = 0;

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      const result = insertStmt.run(item);
      if (result.changes > 0) {
        inserted++;
      } else {
        duplicates++;
      }
    }
  });

  insertMany(transactions);

  console.log(`\nImportacao concluida:`);
  console.log(`  Total processadas: ${transactions.length}`);
  console.log(`  Inseridas: ${inserted}`);
  console.log(`  Duplicatas: ${duplicates}`);

  return { total: transactions.length, inserted, duplicates };
}

// Run
const filePath = process.argv[2];
if (!filePath) {
  console.error('Uso: node import-planilha.js <caminho-do-csv>');
  process.exit(1);
}

initDB();
importPlanilha(filePath).then((r) => {
  console.log(`\nOK: ${r.inserted} transacoes importadas`);
  process.exit(0);
}).catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
