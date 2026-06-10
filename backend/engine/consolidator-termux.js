import { getDB } from '../db-termux.js';

export function consolidar() {
  const db = getDB();

  const saldoPorContaResult = db.exec(`
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
  `);

  const saldoPorConta = saldoPorContaResult[0]?.values.map(row => ({
    nome: row[0],
    tipo: row[1],
    saldo_calculado: row[2],
    qtd_transacoes: row[3],
  })) || [];

  const totaisResult = db.exec(`
    SELECT
      COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0) as total_entrada,
      COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN valor ELSE 0 END), 0) as total_saida,
      COALESCE(SUM(CASE WHEN tipo = 'investimento' THEN valor ELSE 0 END), 0) as total_investido
    FROM transacoes
  `);

  const totais = totaisResult[0]?.values[0] || [0, 0, 0];
  const totalEntrada = totais[0];
  const totalSaida = totais[1];
  const totalInvestido = totais[2];

  const saldoTotal = totalEntrada - totalSaida;

  return {
    saldo_total: saldoTotal,
    total_entrada: totalEntrada,
    total_saida: totalSaida,
    total_investido: totalInvestido,
    saldo_por_conta: saldoPorConta,
  };
}
