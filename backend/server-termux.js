import express from 'express';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initDB, getDB, saveDB } from './db-termux.js';
import { importCSV, gerarHash } from './importer-termux.js';
import { consolidar } from './engine/consolidator-termux.js';
import { calcularMetricas, calcularInvestimentos, patrimonioEvolucao, categoriasPorTipo } from './engine/metrics-termux.js';
import { consultar } from './engine/conhecimento.js';

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
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
    const inicio = req.query.inicio || '';
    const fim = req.query.fim || '';
    let sql = 'SELECT * FROM transacoes';
    const params = [];
    const where = [];
    if (inicio) { where.push('data >= ?'); params.push(inicio); }
    if (fim) { where.push('data <= ?'); params.push(fim); }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY data DESC, id DESC LIMIT ?';
    params.push(limit);
    const rows = dbAll(sql, params);
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
    const { inicio, fim } = req.query;
    const where = ["tipo = ?"];
    const paramsGasto = ['gasto'];
    const paramsEntrada = ['entrada'];
    const paramsInvest = ['investimento'];
    if (inicio) { where.push('data >= ?'); paramsGasto.push(inicio); paramsEntrada.push(inicio); paramsInvest.push(inicio); }
    if (fim) { where.push('data <= ?'); paramsGasto.push(fim); paramsEntrada.push(fim); paramsInvest.push(fim); }
    const whereSql = 'WHERE ' + where.join(' AND ');

    const gastos = dbGet(`SELECT COALESCE(SUM(valor), 0) as total FROM transacoes ${whereSql}`, paramsGasto);
    const entradas = dbGet(`SELECT COALESCE(SUM(valor), 0) as total FROM transacoes ${whereSql}`, paramsEntrada);
    const investimentos = dbGet(`SELECT COALESCE(SUM(valor), 0) as total FROM transacoes ${whereSql}`, paramsInvest);

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

app.get('/categorias-list', (req, res) => {
  try {
    const rows = dbAll("SELECT DISTINCT categoria FROM transacoes WHERE categoria IS NOT NULL AND categoria != '' ORDER BY categoria");
    res.json(rows.map(r => r.categoria));
  } catch (err) {
    console.error('Erro ao buscar lista de categorias:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/transacoes', (req, res) => {
  try {
    const { data, tipo, valor, moeda, conta, descricao, categoria, fonte } = req.body;

    if (!data || !tipo || valor === undefined || valor === null) {
      return res.status(400).json({ error: 'Campos obrigatorios: data, tipo, valor' });
    }

    const transacao = {
      data,
      tipo,
      valor: parseFloat(valor),
      moeda: (moeda || 'BRL').toUpperCase(),
      conta: conta || 'Manual',
      descricao: descricao || '',
      categoria: categoria || 'outros',
      fonte: fonte || 'manual',
    };

    transacao.hash = gerarHash(transacao);

    dbRun(`INSERT INTO transacoes (fonte, conta, tipo, valor, moeda, descricao, categoria, data, hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      transacao.fonte, transacao.conta, transacao.tipo, transacao.valor,
      transacao.moeda, transacao.descricao, transacao.categoria, transacao.data, transacao.hash,
    ]);

    const inserted = dbGet('SELECT * FROM transacoes WHERE hash = ?', [transacao.hash]);
    res.status(201).json(inserted);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Transacao duplicada (ja existe)' });
    }
    console.error('Erro ao criar transacao:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/transacoes/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const existing = dbGet('SELECT * FROM transacoes WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Transacao nao encontrada' });
    }

    const { data, tipo, valor, moeda, conta, descricao, categoria, fonte } = req.body;

    const atualizada = {
      data: data || existing.data,
      tipo: tipo || existing.tipo,
      valor: valor !== undefined ? parseFloat(valor) : existing.valor,
      moeda: moeda ? moeda.toUpperCase() : existing.moeda,
      conta: conta || existing.conta,
      descricao: descricao !== undefined ? descricao : existing.descricao,
      categoria: categoria || existing.categoria,
      fonte: fonte || existing.fonte,
    };

    atualizada.hash = gerarHash(atualizada);

    dbRun(`UPDATE transacoes SET fonte=?, conta=?, tipo=?, valor=?, moeda=?, descricao=?, categoria=?, data=?, hash=?
      WHERE id=?`, [
      atualizada.fonte, atualizada.conta, atualizada.tipo, atualizada.valor,
      atualizada.moeda, atualizada.descricao, atualizada.categoria, atualizada.data, atualizada.hash, id,
    ]);

    const updated = dbGet('SELECT * FROM transacoes WHERE id = ?', [id]);
    res.json(updated);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Transacao duplicada apos edicao' });
    }
    console.error('Erro ao atualizar transacao:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/transacoes/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = dbGet('SELECT * FROM transacoes WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Transacao nao encontrada' });
    }
    dbRun('DELETE FROM transacoes WHERE id = ?', [id]);
    res.json({ message: 'Transacao excluida', id });
  } catch (err) {
    console.error('Erro ao excluir transacao:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/consultor', (req, res) => {
  try {
    const { tipo, perfil, termo } = req.query;
    const resultado = consultar({ tipo, perfil, termo });
    res.json(resultado);
  } catch (err) {
    console.error('Erro no consultor:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/analise-carteira', (req, res) => {
  try {
    const { inicio, fim, moeda } = req.query;
    const filtros = {};
    if (inicio) filtros.inicio = inicio;
    if (fim) filtros.fim = fim;
    if (moeda) filtros.moeda = moeda;

    const invest = calcularInvestimentos(filtros);
    const totalInvestido = invest.total || 0;

    const receitas = dbGet(`SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE tipo = 'entrada'`);
    const despesas = dbGet(`SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE tipo = 'gasto'`);

    const pctInvestido = receitas.total > 0 ? Math.round((totalInvestido / receitas.total) * 100) : 0;
    const pctGastos = receitas.total > 0 ? Math.round((despesas.total / receitas.total) * 100) : 0;

    const recomendacoes = [];

    if (pctInvestido < 10) {
      recomendacoes.push({ tipo: 'alerta', mensagem: 'Voce investe menos de 10% da sua receita. A meta ideal e 20% ou mais. Considere aumentar gradualmente.' });
    } else if (pctInvestido < 20) {
      recomendacoes.push({ tipo: 'melhoria', mensagem: `Voce investe ${pctInvestido}% da sua receita. Bom caminho! Tente chegar a 20%+.` });
    } else {
      recomendacoes.push({ tipo: 'positivo', mensagem: `Parabens! Voce investe ${pctInvestido}% da sua receita — acima da meta de 20%. Continue assim!` });
    }

    if (pctGastos > 80) {
      recomendacoes.push({ tipo: 'alerta', mensagem: `Seus gastos representam ${pctGastos}% da receita. Isso dificulta investir. Reveja despesas essenciais vs extras.` });
    } else if (pctGastos > 60) {
      recomendacoes.push({ tipo: 'melhoria', mensagem: `Gastos de ${pctGastos}% da receita. Saudavel, mas reduzir para 50-60% libera mais para investir.` });
    } else {
      recomendacoes.push({ tipo: 'positivo', mensagem: `Otimo controle! Gastos de apenas ${pctGastos}% da receita.` });
    }

    if ((despesas.total - totalInvestido) > receitas.total) {
      recomendacoes.push({ tipo: 'alerta', mensagem: 'Suas despesas + investimentos superam a receita. Voce esta usando reserva ou se endividando.' });
    }

    const porTipo = invest.por_tipo || [];

    if (porTipo.length === 0) {
      recomendacoes.push({ tipo: 'dica', mensagem: 'Comece com Tesouro Selic para reserva de emergencia e depois diversifique para CDB, LCI e FIIs.' });
    } else {
      const temRendaVariavel = porTipo.some(t => ['acao', 'fii', 'etf', 'stock'].includes(t.tipo?.toLowerCase() || ''));
      if (!temRendaVariavel && totalInvestido > 5000) {
        recomendacoes.push({ tipo: 'dica', mensagem: 'Para valores acima de R$ 5.000, considere diversificar para renda variavel (FIIs ou ETFs).' });
      }
    }

    res.json({
      total_investido: totalInvestido,
      receita_total: receitas.total,
      despesa_total: despesas.total,
      percentual_investido: pctInvestido,
      percentual_gastos: pctGastos,
      recomendacoes,
    });
  } catch (err) {
    console.error('Erro na analise de carteira:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Finance AI rodando em http://localhost:${PORT}`);
});
