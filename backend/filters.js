const REGRAS = [
  { pattern: /\buber\b/i, categoria: 'transporte' },
  { pattern: /\b99\b/i, categoria: 'transporte' },
  { pattern: /\btaxi\b/i, categoria: 'transporte' },
  { pattern: /\bifood\b/i, categoria: 'alimentacao' },
  { pattern: /\bmercado\b/i, categoria: 'alimentacao' },
  { pattern: /\bsupermercado\b/i, categoria: 'alimentacao' },
  { pattern: /\bamazon\b/i, categoria: 'compras' },
  { pattern: /\bshopee\b/i, categoria: 'compras' },
  { pattern: /\bmagalu\b/i, categoria: 'compras' },
  { pattern: /\bnetflix\b/i, categoria: 'streaming' },
  { pattern: /\bspotify\b/i, categoria: 'streaming' },
  { pattern: /\bhbo\b/i, categoria: 'streaming' },
  { pattern: /\bdisney\b/i, categoria: 'streaming' },
  { pattern: /\bprimevideo\b/i, categoria: 'streaming' },
  { pattern: /\baluge[lt]\b/i, categoria: 'moradia' },
  { pattern: /\benergia\b/i, categoria: 'contas' },
  { pattern: /\bagua\b/i, categoria: 'contas' },
  { pattern: /\bvivo\b/i, categoria: 'contas' },
  { pattern: /\btim\b/i, categoria: 'contas' },
  { pattern: /\bclaro\b/i, categoria: 'contas' },
  { pattern: /\bgasolina\b/i, categoria: 'transporte' },
  { pattern: /\bposto\b/i, categoria: 'transporte' },
  { pattern: /\bfarmacia\b/i, categoria: 'saude' },
  { pattern: /\bdroga\b/i, categoria: 'saude' },
  { pattern: /\bsalario\b/i, categoria: 'salario' },
  { pattern: /\btransferencia\b/i, categoria: 'transferencia' },
  { pattern: /\bpix\b/i, categoria: 'transferencia' },
  { pattern: /\bpayment\b/i, categoria: 'recebimento' },
];

export function categorizar(descricao) {
  if (!descricao) return 'outros';
  for (const { pattern, categoria } of REGRAS) {
    if (pattern.test(descricao)) {
      return categoria;
    }
  }
  return 'outros';
}
