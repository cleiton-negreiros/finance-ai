export function normalize(row, fonte) {
  const valor = parseFloat(row.valor) || 0;
  const tipo = valor < 0 ? 'gasto' : 'entrada';

  return {
    fonte,
    conta: row.conta || 'C6 Bank',
    tipo,
    valor: Math.abs(valor),
    moeda: 'BRL',
    descricao: row.descricao || row.descricao || '',
    categoria: row.categoria || '',
    data: formatDate(row.data || row.date || ''),
  };
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr;
}
