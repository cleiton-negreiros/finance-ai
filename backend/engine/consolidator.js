import { getDB } from '../db.js';

function whereClause(inicio, fim, moeda, prefix = '') {
  const clauses = [];
  const params = [];
  const p = prefix ? prefix + '.' : '';
  if (inicio) { clauses.push(`${p}data >= ?`); params.push(inicio); }
  if (fim) { clauses.push(`${p}data <= ?`); params.push(fim); }
  if (moeda) { clauses.push(`${p}moeda = ?`); params.push(moeda); }
  return { sql: clauses.length ? 'WHERE ' + clauses.join(' AND ') : '', params };
}

export function consolidar({ inicio, fim, moeda } = {}) {
  const db = getDB();
  const wt = whereClause(inicio, fim, moeda, 't');
  const w = whereClause(inicio, fim, moeda);

  const saldoPorConta = db.prepare(`
    SELECT
      c.nome,
      c.tipo,
      COALESCE(SUM(CASE WHEN t.tipo = 'entrada' THEN t.valor ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN t.tipo = 'gasto' THEN t.valor ELSE 0 END), 0) as saldo_calculado,
      COUNT(t.id) as qtd_transacoes
    FROM contas c
    LEFT JOIN transacoes t ON t.conta = c.nome ${wt.sql}
    GROUP BY c.nome
    ORDER BY saldo_calculado DESC
  `).all(...wt.params);

  const totais = db.prepare(`
    SELECT
      moeda,
      COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0) as total_entrada,
      COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN valor ELSE 0 END), 0) as total_saida,
      COALESCE(SUM(CASE WHEN tipo = 'investimento' THEN valor ELSE 0 END), 0) as total_investido
    FROM transacoes
    ${w.sql}
    GROUP BY moeda
  `).all(...w.params);

  const porMoeda = totais.map(t => ({
    moeda: t.moeda,
    total_entrada: t.total_entrada,
    total_saida: t.total_saida,
    total_investido: t.total_investido,
    saldo: t.total_entrada - t.total_saida,
  }));

  const saldoTotal = porMoeda.reduce((s, m) => s + (m.saldo || 0), 0);
  const totalEntrada = porMoeda.reduce((s, m) => s + (m.total_entrada || 0), 0);
  const totalSaida = porMoeda.reduce((s, m) => s + (m.total_saida || 0), 0);
  const totalInvestido = porMoeda.reduce((s, m) => s + (m.total_investido || 0), 0);

  return {
    saldo_total: saldoTotal,
    total_entrada: totalEntrada,
    total_saida: totalSaida,
    total_investido: totalInvestido,
    por_moeda: porMoeda,
    saldo_por_conta: saldoPorConta,
  };
}
