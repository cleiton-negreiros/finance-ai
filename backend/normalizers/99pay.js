export function normalize(row, fonte) {
  const valor = parseFloat(row.valor) || 0;
  const tipo = row.tipo === 'saida' ? 'gasto' : 'entrada';

  return {
    fonte,
    conta: row.conta || '99Pay',
    tipo,
    valor: Math.abs(valor),
    moeda: 'BRL',
    descricao: row.descricao || '',
    categoria: row.categoria || '',
    data: formatDate(row.data || row.date || ''),
  };
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const clean = dateStr.split(' ')[0];
  const parts = clean.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return clean;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return clean;
}
