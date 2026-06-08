export function normalize(row, fonte) {
  const valor = parseFloat(row.valor) || parseFloat(row['valor total']) || 0;
  const tipo = valor < 0 ? 'gasto' : 'entrada';

  return {
    fonte,
    conta: row.conta || 'Mercado Pago',
    tipo,
    valor: Math.abs(valor),
    moeda: 'BRL',
    descricao: row.descricao || row.titulo || row.conceito || '',
    categoria: row.categoria || '',
    data: formatDate(row.data || row.date || row['data de criacao'] || ''),
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
