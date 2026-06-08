import express from 'express';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initDB, getDB } from './db.js';
import { importCSV } from './importer.js';
import { consolidar } from './engine/consolidator.js';
import { calcularMetricas } from './engine/metrics.js';

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
    const rows = db.prepare('SELECT * FROM transacoes ORDER BY data DESC, id DESC LIMIT ?').all(limit);
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
    const gastos = db.prepare("SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE tipo = 'gasto'").get();
    const entradas = db.prepare("SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE tipo = 'entrada'").get();
    const investimentos = db.prepare("SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE tipo = 'investimento'").get();

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
