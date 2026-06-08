const REGRAS = [
  { pattern: /\b(ifood|restaurante|lanche|pizza|hamburguer|acai|sushi|dogao|quentinha|marmita|padaria|acougue|feira|hortifruti|supermercado|mercado|carne|frango|pao|leite|ovo|arroz|feijao)\b/i, categoria: 'alimentacao' },
  { pattern: /\b(aluge[lut]|condominio|iptu|agua|luz|energia|gas|internet|tv a cabo)\b/i, categoria: 'moradia' },
  { pattern: /\b(uber|99|taxi|gasolina|estacionamento|pedagio|passagem|onibus|metrô|metro|combustivel|posto|manutencao veiculo|seguro auto)\b/i, categoria: 'transporte' },
  { pattern: /\b(farmacia|drogasil|drogaraia|medico|dentista|plano saude|hospital|exame|consulta|remedio|medicamento)\b/i, categoria: 'saude' },
  { pattern: /\b(amazon|shopee|magalu|mercadolivre|americanas|submarino|casas bahia|roupa|calcado|eletronico|presente|livro)\b/i, categoria: 'compras' },
  { pattern: /\b(netflix|spotify|hbo|disney|primevideo|apple tv|paramount|deezer|youtube premium|twitch|samsung tv|app store|google play)\b/i, categoria: 'streaming' },
  { pattern: /\b(academia|cinema|show|teatro|viagem|hotel|passagem aerea|airbnb|parque|jogo|esporte|futebol|bar|balada|cerva|cerveja|whisky|vodka)\b/i, categoria: 'lazer' },
  { pattern: /\b(salario|salário|holerite|decimo|13o|bonus|comissao|freela|pro labore|pj|ferias|rescisao)\b/i, categoria: 'salario' },
  { pattern: /\b(pix|ted|doc|transferencia|recarga|boleto)\b/i, categoria: 'transferencia' },
  { pattern: /\b(investimento|ação|acao|fiis|fii|cdb|lci|lca|tesouro|poupanca|fundo|renda fixa|renda variavel|bitcoin|btc|eth|cripto|corretagem|taxa b3|boleto b3)\b/i, categoria: 'investimento' },
  { pattern: /\b(cartao|credito|debito|anuidade|juros|multa|taxa|juros rotativo)\b/i, categoria: 'financeiro' },
  { pattern: /\b(escola|faculdade|curso|mensalidade|material escolar|livro didatico|kumon|idioma|english|curso online)\b/i, categoria: 'educacao' },
  { pattern: /\b(ifood|uber eats|rappi|pedido|entrega|delivery)\b/i, categoria: 'delivery' },
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
