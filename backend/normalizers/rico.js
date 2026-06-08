export function normalize(row, fonte) {
  const valor = parseFloat(row.valor) || parseFloat(row['valor liquido']) || parseFloat(row['valor bruto']) || 0;
  const tipoRaw = (row.tipo || row.operacao || row.natureza || '').toLowerCase();
  let tipo = 'entrada';

  if (valor < 0 || tipoRaw.includes('d') || tipoRaw.includes('debito') || tipoRaw.includes('compra')) {
    tipo = 'gasto';
  }
  if (tipoRaw.includes('investimento') || tipoRaw.includes('aplicacao') || tipoRaw.includes('rendimento')) {
    tipo = 'investimento';
  }

  return {
    fonte,
    tipo,
    valor: Math.abs(valor),
    moeda: 'BRL',
    descricao: row.descricao || row.produto || row.titulo || '',
    categoria: 'investimento',
    data: formatDate(row.data || row.date || row['data de liquidacao'] || ''),
  };
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return dateStr;
}
