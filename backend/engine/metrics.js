import { getDB } from '../db.js';

const CATEGORIAS_ESSENCIAIS = ['alimentacao', 'moradia', 'transporte', 'saude'];
const CATEGORIAS_EXTRAS = ['lazer', 'compras', 'streaming', 'delivery'];

function whereClause(inicio, fim, moeda) {
  const clauses = ['tipo = ?'];
  const params = ['gasto'];
  if (inicio) { clauses.push('data >= ?'); params.push(inicio); }
  if (fim) { clauses.push('data <= ?'); params.push(fim); }
  if (moeda) { clauses.push('moeda = ?'); params.push(moeda); }
  return { sql: 'WHERE ' + clauses.join(' AND '), params };
}

export function calcularMetricas({ inicio, fim, moeda } = {}) {
  const db = getDB();
  const w = whereClause(inicio, fim, moeda);

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

  let investWhere = moeda ? "AND moeda = ?" : "";
  const investParams = [];
  if (moeda) investParams.push(moeda);
  if (inicio) { investWhere += " AND data >= ?"; investParams.push(inicio); }
  if (fim) { investWhere += " AND data <= ?"; investParams.push(fim); }

  const investido = db.prepare(`
    SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE tipo = 'investimento' ${investWhere}
  `).get(...investParams).total;

  const fluxoMensal = db.prepare(`
    SELECT
      strftime('%Y-%m', data) as mes,
      SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as entradas,
      SUM(CASE WHEN tipo = 'gasto' THEN valor ELSE 0 END) as gastos
    FROM transacoes
    ${moeda ? "WHERE moeda = ?" : ""}
    GROUP BY mes
    ORDER BY mes DESC
    LIMIT 12
  `).all(...(moeda ? [moeda] : []));

  return {
    custo_vida: custoVida,
    despesas_extras: despesasExtras,
    investido: investido,
    percentual_por_categoria: percentualPorCategoria,
    fluxo_mensal: fluxoMensal,
  };
}
