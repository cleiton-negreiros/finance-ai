import express from 'express';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initDB, getDB } from './db.js';
import { importCSV } from './importer.js';
import { consolidar } from './engine/consolidator.js';
import { calcularMetricas, calcularInvestimentos, patrimonioEvolucao, categoriasPorTipo } from './engine/metrics.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

initDB();

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
    const db = getDB();
    const limit = parseInt(req.query.limit) || 100;
    const inicio = req.query.inicio || '';
    const fim = req.query.fim || '';
    const where = [];
    const params = [];
    if (inicio) { where.push('data >= ?'); params.push(inicio); }
    if (fim) { where.push('data <= ?'); params.push(fim); }
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const rows = db.prepare(`SELECT * FROM transacoes ${whereSql} ORDER BY data DESC, id DESC LIMIT ?`).all(...params, limit);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar transacoes:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/contas', (req, res) => {
  try {
    const db = getDB();
    const rows = db.prepare('SELECT * FROM contas ORDER BY nome').all();
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar contas:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/resumo', (req, res) => {
  try {
    const db = getDB();
    const { inicio, fim } = req.query;
    const where = ["tipo = ?"];
    const paramsGasto = ['gasto'];
    const paramsEntrada = ['entrada'];
    const paramsInvest = ['investimento'];
    if (inicio) { where.push('data >= ?'); paramsGasto.push(inicio); paramsEntrada.push(inicio); paramsInvest.push(inicio); }
    if (fim) { where.push('data <= ?'); paramsGasto.push(fim); paramsEntrada.push(fim); paramsInvest.push(fim); }
    const whereSql = 'WHERE ' + where.join(' AND ');

    const gastos = db.prepare(`SELECT COALESCE(SUM(valor), 0) as total FROM transacoes ${whereSql}`).get(...paramsGasto);
    const entradas = db.prepare(`SELECT COALESCE(SUM(valor), 0) as total FROM transacoes ${whereSql}`).get(...paramsEntrada);
    const investimentos = db.prepare(`SELECT COALESCE(SUM(valor), 0) as total FROM transacoes ${whereSql}`).get(...paramsInvest);

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
    const { inicio, fim, moeda } = req.query;
    const filtros = {};
    if (inicio) filtros.inicio = inicio;
    if (fim) filtros.fim = fim;
    if (moeda) filtros.moeda = moeda;

    const consolidado = consolidar(filtros);
    const metricas = calcularMetricas(filtros);

    res.json({
      ...consolidado,
      ...metricas,
    });
  } catch (err) {
    console.error('Erro ao gerar dashboard:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/investimentos', (req, res) => {
  try {
    const { inicio, fim, moeda } = req.query;
    const filtros = {};
    if (inicio) filtros.inicio = inicio;
    if (fim) filtros.fim = fim;
    if (moeda) filtros.moeda = moeda;

    const invest = calcularInvestimentos(filtros);
    const patr = patrimonioEvolucao(filtros);

    res.json({ ...invest, ...patr });
  } catch (err) {
    console.error('Erro ao gerar investimentos:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/categorias', (req, res) => {
  try {
    const { inicio, fim, moeda } = req.query;
    const filtros = {};
    if (inicio) filtros.inicio = inicio;
    if (fim) filtros.fim = fim;
    if (moeda) filtros.moeda = moeda;

    const categorias = categoriasPorTipo(filtros);
    res.json(categorias);
  } catch (err) {
    console.error('Erro ao buscar categorias:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Finance AI rodando em http://localhost:${PORT}`);
});
