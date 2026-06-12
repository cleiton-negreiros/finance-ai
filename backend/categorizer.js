const REGRAS = [
  { pattern: /\b(ifood|restaurante|lanche|pizza|hamburguer|acai|sushi|dogao|quentinha|marmita|padaria|acougue|feira|hortifruti|supermercado|mercado(?!\s+(pago|pg))|carne|frango|pao|leite|ovo|arroz|feijao|bem\s*barato|chiquinho|doces|sorvete|almo[çc]o|caf[ée])/i, categoria: 'alimentacao' },
  { pattern: /\b(aluguel|condominio|iptu|agua|luz|energia|g[áa][sz]|internet|tv\s*a\s*cabo|condom[ií]nio)/i, categoria: 'moradia' },
  { pattern: /\b(uber|99|taxi|gasolina|estacionamento|pedagio|passagem|onibus|metr[ôo]|metro|combustivel|posto|manutencao\s*veiculo|seguro\s*auto|estacionamento|transporte|zk|rek\s*parking|carro)/i, categoria: 'transporte' },
  { pattern: /\b(farmacia|drogasil|drogaraia|drogaria|medico|dentista|plano\s*saude|hospital|exame|consulta|remedio|medicamento|euthyrox|vacina)/i, categoria: 'saude' },
  { pattern: /\b(amazon|shopee|magalu|mercadolivre|americanas|submarino|casas\s*bahia|roupa|calcado|eletronico|presente|livro|marisa|pernambucanas|carrefour|cal[cç]a|t[eê]nis|besni)/i, categoria: 'compras' },
  { pattern: /\b(netflix|spotify|hbo|disney|primevideo|apple\s*tv|paramount|deezer|youtube|twitch|samsung\s*tv|app\s*store|google\s*play|conecta|streaming)/i, categoria: 'streaming' },
  { pattern: /\b(academia|cinema|show|teatro|viagem|hotel|passagem\s*aerea|airbnb|parque|jogo|esporte|futebol|bar|balada|cerva|cerveja|whisky|vodka|halleluya|praia|nata[cç][aã]o)/i, categoria: 'lazer' },
  { pattern: /\b(salari[oa]|holerite|decimo|13[°o]|bonus|comissao|freela|pro\s*labore|pj|ferias|rescisao|rendimentos?)/i, categoria: 'salario' },
  { pattern: /\b(pix|ted|doc|transferencia|recarga|boleto)/i, categoria: 'transferencia' },
  { pattern: /\b(investimento|a[cç][aã]o|fiis|fii|cdb|lci|lca|tesouro|poupanca|fundo|renda\s*fixa|renda\s*variavel|bitcoin|btc|eth|cripto|corretagem|taxa\s*b3|boleto\s*b3|cofrinho|conta\s*capital|rico|bolsa)/i, categoria: 'investimento' },
  { pattern: /\b(cartao|credito|debito|anuidade|juros|multa|taxa|juros\s*rotativo|iof)/i, categoria: 'financeiro' },
  { pattern: /\b(escola|faculdade|curso|mensalidade|material\s*escolar|livro\s*didatico|kumon|idioma|english|curso\s*online|elton)/i, categoria: 'educacao' },
  { pattern: /\b(ifood|uber\s*eats|rappi|pedido|entrega|delivery)/i, categoria: 'delivery' },
  { pattern: /\b(cb|careca)/i, categoria: 'cb' },
  { pattern: /\b(ofert[áa]rio|missa|igreja|doa[cç][aã]o|shalom)/i, categoria: 'doacoes' },
  { pattern: /\b(reciclagem|redes\s*de\s*prote[cç][aã]o|foco|guid)/i, categoria: 'casa' },
  { pattern: /\b(seguro\s*carro|hb20|troca\s*de\s*velas)/i, categoria: 'carro' },
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
