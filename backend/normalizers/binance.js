export function normalize(row, fonte) {
  const valor = parseFloat(row.valor) || parseFloat(row.quantidade) || parseFloat(row.amount) || 0;
  const tipoRaw = (row.tipo || row.operacao || row.type || '').toLowerCase();
  let tipo = 'entrada';

  if (valor < 0 || tipoRaw.includes('saque') || tipoRaw.includes('gasto') || tipoRaw.includes('compra') || tipoRaw.includes('sell') || tipoRaw.includes('taxa') || tipoRaw.includes('fee')) {
    tipo = 'gasto';
  } else if (tipoRaw.includes('investimento')) {
    tipo = 'investimento';
  }

  const moeda = extrairMoeda(row);

  return {
    fonte,
    conta: row.conta || 'Binance',
    tipo,
    valor: Math.abs(valor),
    moeda,
    descricao: row.descricao || row.par || row.pair || row.descricao || '',
    categoria: row.categoria || 'cripto',
    data: formatDate(row.data || row.date || row['data do trade'] || ''),
  };
}

function extrairMoeda(row) {
  const moeda = (row.moeda || row.currency || row.par || row.pair || row.par_negociado || '').toUpperCase();
  if (moeda.includes('BTC')) return 'BTC';
  if (moeda.includes('ETH')) return 'ETH';
  if (moeda.includes('USDT') || moeda.includes('BRL')) return 'BRL';
  return 'BRL';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return dateStr;
}
