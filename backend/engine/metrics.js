import { getDB } from '../db.js';

const CATEGORIAS_ESSENCIAIS = ['alimentacao', 'moradia', 'transporte', 'saude'];
const CATEGORIAS_EXTRAS = ['lazer', 'compras', 'streaming', 'delivery'];

function tipoWhere(inicio, fim, moeda, tipo = 'gasto') {
  const clauses = ['tipo = ?'];
  const params = [tipo];
  if (inicio) { clauses.push('data >= ?'); params.push(inicio); }
  if (fim) { clauses.push('data <= ?'); params.push(fim); }
  if (moeda) { clauses.push('moeda = ?'); params.push(moeda); }
  return { sql: 'WHERE ' + clauses.join(' AND '), params };
}

function genericWhere(inicio, fim, moeda) {
  const clauses = [];
  const params = [];
  if (inicio) { clauses.push('data >= ?'); params.push(inicio); }
  if (fim) { clauses.push('data <= ?'); params.push(fim); }
  if (moeda) { clauses.push('moeda = ?'); params.push(moeda); }
  const sql = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
  const joinSql = clauses.length ? 'AND ' + clauses.join(' AND ') : '';
  return { sql, joinSql, params };
}

export function calcularMetricas({ inicio, fim, moeda } = {}) {
  const db = getDB();
  const w = tipoWhere(inicio, fim, moeda);

  const gastosPorCategoria = db.prepare(`
    SELECT
      CASE WHEN categoria IS NULL OR categoria = '' THEN 'outros' ELSE categoria END as cat,
      SUM(valor) as total
    FROM transacoes
    ${w.sql}
    GROUP BY cat
    ORDER BY total DESC
  `).all(...w.params);

  const totalGastos = gastosPorCategoria.reduce((acc, r) => acc + r.total, 0);

  const percentualPorCategoria = gastosPorCategoria.map(r => ({
    categoria: r.cat,
    valor: r.total,
    percentual: totalGastos > 0 ? Math.round((r.total / totalGastos) * 100) : 0,
  }));

  const custoVida = gastosPorCategoria
    .filter(r => CATEGORIAS_ESSENCIAIS.includes(r.cat))
    .reduce((acc, r) => acc + r.total, 0);

  const despesasExtras = gastosPorCategoria
    .filter(r => CATEGORIAS_EXTRAS.includes(r.cat))
    .reduce((acc, r) => acc + r.total, 0);

  const iw = genericWhere(inicio, fim, moeda);
  const investido = db.prepare(`
    SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE tipo = 'investimento' ${iw.joinSql}
  `).get(...iw.params).total;

  const fw = genericWhere(inicio, fim, moeda);
  const fluxoMensal = db.prepare(`
    SELECT
      strftime('%Y-%m', data) as mes,
      SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as entradas,
      SUM(CASE WHEN tipo = 'gasto' THEN valor ELSE 0 END) as gastos
    FROM transacoes
    ${fw.sql}
    GROUP BY mes
    ORDER BY mes DESC
    LIMIT 12
  `).all(...fw.params);

  const rw = genericWhere(inicio, fim, moeda);
  const entradas = db.prepare(`
    SELECT descricao, categoria, valor FROM transacoes WHERE tipo = 'entrada' ${rw.joinSql}
  `).all(...rw.params);

  const { renda_real, movimentacoes } = classificarEntradas(entradas);
  const totalEntrada = renda_real + movimentacoes;
  const taxaPoupanca = totalEntrada > 0 ? ((totalEntrada - totalGastos - investido) / totalEntrada) * 100 : 0;

  return {
    custo_vida: custoVida,
    despesas_extras: despesasExtras,
    investido: investido,
    percentual_por_categoria: percentualPorCategoria,
    fluxo_mensal: fluxoMensal,
    renda_real: renda_real,
    movimentacoes: movimentacoes,
    taxa_poupanca: Math.round(taxaPoupanca * 100) / 100,
  };
}

const PALAVRAS_RENDA = /\b(salari[oa]|rendimento|holerite|decimo|13[°o]|bonus|comissao|freela|pro.labore|pj|ferias|rescisao|venda|teclado|evento|aluguel.recebido|dividendo|juros.sobre)\b/i;
const PALAVRAS_MOVIMENTACAO = /\b(resgate|saque|reembolso|transferencia|pix\s.*recebido|cofrinho|conta.capital|aplicacao)\b/i;

function classificarEntradas(entradas) {
  let renda = 0, mov = 0;
  for (const e of entradas) {
    const d = (e.descricao || '') + ' ' + (e.categoria || '');
    if (PALAVRAS_MOVIMENTACAO.test(d) && !PALAVRAS_RENDA.test(d)) {
      mov += e.valor;
    } else if (PALAVRAS_RENDA.test(d) || e.categoria === 'salario' || e.categoria === 'rendimentos') {
      renda += e.valor;
    } else if (e.categoria === 'resgate' || e.categoria === 'saque' || e.categoria === 'transferencia') {
      mov += e.valor;
    } else {
      renda += e.valor;
    }
  }
  return { renda_real: renda, movimentacoes: mov };
}

export function calcularInvestimentos({ inicio, fim, moeda } = {}) {
  const db = getDB();
  const fw = genericWhere(inicio, fim, moeda);

  const total = db.prepare(`
    SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE tipo = 'investimento' ${fw.joinSql}
  `).get(...fw.params).total;

  const porTipo = db.prepare(`
    SELECT COALESCE(categoria, 'outros') as tipo, SUM(valor) as total
    FROM transacoes WHERE tipo = 'investimento' ${fw.joinSql}
    GROUP BY tipo ORDER BY total DESC
  `).all(...fw.params);

  const porConta = db.prepare(`
    SELECT conta, SUM(valor) as total
    FROM transacoes WHERE tipo = 'investimento' ${fw.joinSql}
    GROUP BY conta ORDER BY total DESC
  `).all(...fw.params);

  return { total, por_tipo: porTipo, por_conta: porConta };
}

export function patrimonioEvolucao({ inicio, fim, moeda } = {}) {
  const db = getDB();
  const fw = genericWhere(inicio, fim, moeda);

  const meses = db.prepare(`
    SELECT
      strftime('%Y-%m', data) as mes,
      SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as entradas,
      SUM(CASE WHEN tipo = 'gasto' THEN valor ELSE 0 END) as gastos,
      SUM(CASE WHEN tipo = 'investimento' THEN valor ELSE 0 END) as investido
    FROM transacoes
    ${fw.sql}
    GROUP BY mes
    ORDER BY mes
  `).all(...fw.params);

  let accSaldo = 0, accInvest = 0;
  const evolucao = meses.map(r => {
    accSaldo += (r.entradas || 0) - (r.gastos || 0);
    accInvest += (r.investido || 0);
    return {
      mes: r.mes,
      saldo: accSaldo,
      investido: accInvest,
      patrimonio: accSaldo + accInvest,
    };
  });

  return { evolucao };
}

function tipoWhereFilter(tipo, inicio, fim, moeda) {
  const clauses = ['tipo = ?'];
  const params = [tipo];
  if (inicio) { clauses.push('data >= ?'); params.push(inicio); }
  if (fim) { clauses.push('data <= ?'); params.push(fim); }
  if (moeda) { clauses.push('moeda = ?'); params.push(moeda); }
  return { sql: 'WHERE ' + clauses.join(' AND '), params };
}

export function categoriasPorTipo({ inicio, fim, moeda } = {}) {
  const db = getDB();
  const gw = tipoWhereFilter('gasto', inicio, fim, moeda);
  const rw = tipoWhereFilter('entrada', inicio, fim, moeda);

  const gastos = db.prepare(`
    SELECT COALESCE(categoria, 'outros') as categoria, SUM(valor) as total
    FROM transacoes ${gw.sql} GROUP BY categoria ORDER BY total DESC
  `).all(...gw.params);

  const receitas = db.prepare(`
    SELECT COALESCE(categoria, 'outros') as categoria, SUM(valor) as total
    FROM transacoes ${rw.sql} GROUP BY categoria ORDER BY total DESC
  `).all(...rw.params);

  const totalGastos = gastos.reduce((a, r) => a + r.total, 0);
  const totalReceitas = receitas.reduce((a, r) => a + r.total, 0);

  return {
    gastos: gastos.map(r => ({ ...r, percentual: totalGastos > 0 ? Math.round((r.total / totalGastos) * 100) : 0 })),
    receitas: receitas.map(r => ({ ...r, percentual: totalReceitas > 0 ? Math.round((r.total / totalReceitas) * 100) : 0 })),
    total_gastos: totalGastos,
    total_receitas: totalReceitas,
  };
}
