export function normalize(row, fonte) {
  const valor = parseFloat(row.valor) || parseFloat(row.amount) || parseFloat(row['valor (usd)']) || 0;
  const tipo = valor < 0 ? 'gasto' : 'entrada';

  const moeda = (row.moeda || row.currency || '').toUpperCase() === 'USD' ? 'USD' : 'BRL';

  return {
    fonte,
    tipo,
    valor: Math.abs(valor),
    moeda,
    descricao: row.descricao || row.description || row.detalhes || '',
    categoria: row.categoria || 'cambio',
    data: formatDate(row.data || row.date || row['data da transacao'] || ''),
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
