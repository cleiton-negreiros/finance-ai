import { getDB } from '../db.js';

export function consolidar() {
  const db = getDB();

  const saldoPorConta = db.prepare(`
    SELECT
      c.nome,
      c.tipo,
      COALESCE(SUM(CASE WHEN t.tipo = 'entrada' THEN t.valor ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN t.tipo = 'gasto' THEN t.valor ELSE 0 END), 0) as saldo_calculado,
      COUNT(t.id) as qtd_transacoes
    FROM contas c
    LEFT JOIN transacoes t ON t.conta = c.nome
    GROUP BY c.nome
    ORDER BY saldo_calculado DESC
  `).all();

  const totais = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0) as total_entrada,
      COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN valor ELSE 0 END), 0) as total_saida,
      COALESCE(SUM(CASE WHEN tipo = 'investimento' THEN valor ELSE 0 END), 0) as total_investido
    FROM transacoes
  `).get();

  const saldoTotal = totais.total_entrada - totais.total_saida;

  return {
    saldo_total: saldoTotal,
    total_entrada: totais.total_entrada,
    total_saida: totais.total_saida,
    total_investido: totais.total_investido,
    saldo_por_conta: saldoPorConta,
  };
}
