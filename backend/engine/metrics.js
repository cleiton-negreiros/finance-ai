import { getDB } from '../db.js';

const CATEGORIAS_ESSENCIAIS = ['alimentacao', 'moradia', 'contas', 'transporte', 'saude'];
const CATEGORIAS_EXTRAS = ['lazer', 'compras', 'streaming', 'assinaturas'];

export function calcularMetricas() {
  const db = getDB();

  const gastosPorCategoria = db.prepare(`
    SELECT
      CASE WHEN categoria IS NULL OR categoria = '' THEN 'outros' ELSE categoria END as cat,
      SUM(valor) as total
    FROM transacoes
    WHERE tipo = 'gasto'
    GROUP BY cat
    ORDER BY total DESC
  `).all();

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

  const investido = db.prepare(`
    SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE tipo = 'investimento'
  `).get().total;

  const fluxoMensal = db.prepare(`
    SELECT
      strftime('%Y-%m', data) as mes,
      SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as entradas,
      SUM(CASE WHEN tipo = 'gasto' THEN valor ELSE 0 END) as gastos
    FROM transacoes
    GROUP BY mes
    ORDER BY mes DESC
    LIMIT 12
  `).all();

  return {
    custo_vida: custoVida,
    despesas_extras: despesasExtras,
    investido: investido,
    percentual_por_categoria: percentualPorCategoria,
    fluxo_mensal: fluxoMensal,
  };
}
