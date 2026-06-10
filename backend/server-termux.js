import express from 'express';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initDB, getDB, saveDB } from './db-termux.js';
import { importCSV } from './importer-termux.js';
import { consolidar } from './engine/consolidator-termux.js';
import { calcularMetricas } from './engine/metrics-termux.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

await initDB();
console.log('Banco de dados inicializado');

const storage = multer.diskStorage({
  destination: join(__dirname, 'uploads'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + '-' + file.originalname);
  },
});

const upload = multer({ storage });

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.static(join(__dirname, '..', 'frontend')));
app.use(express.json());

function dbAll(sql, params = []) {
  const db = getDB();
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function dbGet(sql, params = []) {
  const db = getDB();
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

function dbRun(sql, params = []) {
  const db = getDB();
  db.run(sql, params);
  saveDB();
}

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const fonte = req.body.fonte;
    if (!fonte) {
      return res.status(400).json({ error: 'Campo "fonte" obrigatorio' });
    }

    const result = await importCSV(req.file.path, fonte);

    res.json({
      message: 'Importacao concluida',
      ...result,
    });
  } catch (err) {
    console.error('Erro no upload:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/transacoes', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const rows = dbAll('SELECT * FROM transacoes ORDER BY data DESC, id DESC LIMIT ?', [limit]);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar transacoes:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/contas', (req, res) => {
  try {
    const rows = dbAll('SELECT * FROM contas ORDER BY nome');
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar contas:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/resumo', (req, res) => {
  try {
    const gastos = dbGet("SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE tipo = 'gasto'");
    const entradas = dbGet("SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE tipo = 'entrada'");
    const investimentos = dbGet("SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE tipo = 'investimento'");

    res.json({
      total_gastos: gastos.total,
      total_entradas: entradas.total,
      saldo: entradas.total - gastos.total,
      total_investimentos: investimentos.total,
    });
  } catch (err) {
    console.error('Erro ao gerar resumo:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/dashboard', (req, res) => {
  try {
    const consolidado = consolidar();
    const metricas = calcularMetricas();

    res.json({
      ...consolidado,
      ...metricas,
    });
  } catch (err) {
    console.error('Erro ao gerar dashboard:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Finance AI rodando em http://localhost:${PORT}`);
});
