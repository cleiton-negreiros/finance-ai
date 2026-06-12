const CONHECIMENTO = {
  perfis: [
    {
      id: 'conservador',
      nome: 'Conservador',
      cor: '#22c55e',
      descricao: 'Prioriza segurança e liquidez. Aceita baixa rentabilidade para preservar o capital.',
      indicado_para: 'Reserva de emergência, objetivos de curto prazo (até 2 anos), investidores que não toleram perdas.',
      alocacao_sugerida: { renda_fixa: 85, renda_variavel: 5, fundos_multimercado: 10 },
      produtos: ['Tesouro Selic', 'CDB com liquidez diária', 'LCI/LCA', 'Fundos DI', 'Poupança'],
    },
    {
      id: 'moderado',
      nome: 'Moderado',
      cor: '#eab308',
      descricao: 'Busca equilíbrio entre segurança e rentabilidade. Aceita oscilações moderadas.',
      indicado_para: 'Objetivos de médio prazo (2 a 5 anos), investidores com alguma tolerância a risco.',
      alocacao_sugerida: { renda_fixa: 50, renda_variavel: 30, fundos_multimercado: 20 },
      produtos: ['Tesouro IPCA+', 'CDB de médio prazo', 'Fundos Multimercado', 'ETF de índice', 'Ações de blue chips', 'FIIs'],
    },
    {
      id: 'agressivo',
      nome: 'Agressivo',
      cor: '#ef4444',
      descricao: 'Busca máxima rentabilidade no longo prazo. Aceita grandes oscilações e risco de perda.',
      indicado_para: 'Objetivos de longo prazo (5+ anos), investidores que entendem ciclos de mercado.',
      alocacao_sugerida: { renda_fixa: 20, renda_variavel: 60, fundos_multimercado: 20 },
      produtos: ['Ações small caps', 'ETF de setores específicos', 'Fundos de Ações', 'BDRs', 'Criptomoedas', 'Opções (estruturadas)'],
    },
  ],

  renda_fixa: [
    {
      nome: 'Tesouro Selic',
      tipo: 'Tesouro Direto',
      risco: 'Baixíssimo',
      liquidez: 'D+1',
      rentabilidade: '100% do CDI',
      prazo: 'Livre (vencimento padrão)',
      descricao: 'Título público pós-fixado atrelado à taxa Selic. Ideal para reserva de emergência e curto prazo.',
      vantagens: ['Liquidez diária', 'Garantido pelo governo federal', 'Isento de IR para pessoa física (até certo limite)', 'Aplicação a partir de R$ 30'],
      desvantagens: ['Rentabilidade menor que outros títulos', 'Sujeito a marcação a mercado se vendido antes do vencimento'],
      ir: 'Regressivo: 22,5% (até 180 dias) a 15% (acima de 720 dias)',
      como_investir: 'Pelo app do Tesouro Direto ou corretora (Rico, XP, etc.). Busque por "Tesouro Selic 2027" ou similar.',
      educacao: 'O Tesouro Selic é o investimento mais seguro do Brasil, pois é garantido pelo Tesouro Nacional. A rentabilidade acompanha a taxa Selic, então quando o BC sobe os juros, seu investimento rende mais.',
    },
    {
      nome: 'Tesouro IPCA+',
      tipo: 'Tesouro Direto',
      risco: 'Baixo',
      liquidez: 'D+1',
      rentabilidade: 'IPCA + taxa prefixada',
      prazo: 'Médio a longo (2029 a 2055)',
      descricao: 'Título público híbrido que paga a inflação (IPCA) mais um juro prefixado. Protege o poder de compra.',
      vantagens: ['Proteção contra inflação', 'Rentabilidade real garantida', 'Garantido pelo governo'],
      desvantagens: ['Marcação a mercado pode gerar perda contábil no curto prazo', 'IR regressivo'],
      ir: 'Regressivo: 22,5% a 15% conforme prazo',
      como_investir: 'Disponível no Tesouro Direto. Escolha o prazo conforme seus objetivos. Ex: Tesouro IPCA+ 2029 para médio prazo, 2045 para aposentadoria.',
      educacao: 'O IPCA+ é o título mais recomendado para longo prazo porque garante que seu dinheiro vai crescer ACIMA da inflação. Se o IPCA está em 4% e o título paga IPCA+6%, sua rentabilidade real é de 6% ao ano.',
    },
    {
      nome: 'Tesouro Prefixado',
      tipo: 'Tesouro Direto',
      risco: 'Médio',
      liquidez: 'D+1',
      rentabilidade: 'Taxa fixa (ex: 13% ao ano)',
      prazo: 'Médio a longo (2027 a 2033)',
      descricao: 'Título público com taxa fixa definida no momento da compra. Ideal para cenários de queda de juros.',
      vantagens: ['Saber exatamente o rendimento', 'Taxa travada na compra', 'Garantido pelo governo'],
      desvantagens: ['Se os juros subirem, o título desvaloriza (marcação a mercado)', 'Perde para inflação se for menor que o IPCA'],
      ir: 'Regressivo: 22,5% a 15%',
      como_investir: 'Disponível no Tesouro Direto. Invista se acredita que os juros vão cair.',
      educacao: 'Tesouro Prefixado é uma aposta na queda dos juros. Se você compra a 13% e a Selic cai para 10%, seu título se valoriza. Se sobe para 15%, ele desvaloriza.',
    },
    {
      nome: 'CDB (Certificado de Depósito Bancário)',
      tipo: 'Renda Fixa Bancária',
      risco: 'Baixo a Médio',
      liquidez: 'Depende (DI a D+730)',
      rentabilidade: '80% a 120% do CDI ou prefixado',
      prazo: 'Curto a longo (definido na emissão)',
      descricao: 'Título emitido por bancos para captar recursos. Coberto pelo FGC até R$ 250 mil por CPF.',
      vantagens: ['Rentabilidade maior que poupança', 'Coberto pelo FGC', 'Diversos prazos e rentabilidades'],
      desvantagens: ['Risco de crédito do banco emissor', 'Alguns têm liquidez só no vencimento', 'IR regressivo'],
      ir: 'Regressivo: 22,5% a 15%',
      como_investir: 'Disponível em corretoras e bancos. Prefira CDBs de bancos médios com boa classificação de risco (rating).',
      educacao: 'O CDB é um empréstimo que você faz ao banco. Quanto maior o risco do banco, maior o juro pago. CDB de bancão (Itaú, Bradesco) paga ~90% do CDI; bancos médios pagam ~110%+ do CDI.',
    },
    {
      nome: 'LCI / LCA',
      tipo: 'Renda Fixa Bancária',
      risco: 'Baixo a Médio',
      liquidez: 'Depende (carência mínima 90 dias)',
      rentabilidade: '85% a 100% do CDI',
      prazo: 'Médio a longo (90 dias a 5+ anos)',
      descricao: 'Letras de Crédito Imobiliário (LCI) e do Agronegócio (LCA). Isentas de IR para pessoa física.',
      vantagens: ['Isento de Imposto de Renda', 'Coberto pelo FGC', 'Rentabilidade competitiva'],
      desvantagens: ['Liquidez menor (carência mínima 90 dias)', 'Menor oferta que CDBs', 'Risco de crédito do emissor'],
      ir: 'Isento (pessoa física)',
      como_investir: 'Disponível em corretoras. Compare a taxa com CDBs considerando o benefício fiscal.',
      educacao: 'LCI/LCA são os queridinhos da renda fixa brasileira por serem isentos de IR. Um LCA a 90% do CDI equivale a um CDB a ~110% do CDI por causa do imposto.',
    },
    {
      nome: 'Debêntures',
      tipo: 'Renda Fixa Privada',
      risco: 'Médio a Alto',
      liquidez: 'Baixa (vencimento ou mercado secundário)',
      rentabilidade: 'CDI + 1% a 5% ao ano',
      prazo: 'Médio a longo (3 a 15 anos)',
      descricao: 'Títulos de dívida emitidos por empresas não financeiras. Podem ser incentivadas (isenta de IR) ou comuns.',
      vantagens: ['Rentabilidade superior a CDBs', 'Debêntures incentivadas são isentas de IR', 'Diversificação'],
      desvantagens: ['Risco de crédito da empresa emissora', 'Baixa liquidez', 'Valor mínimo alto'],
      ir: 'Incentivada: isenta / Comum: regressivo 22,5% a 15%',
      como_investir: 'Disponível em corretoras para investidores qualificados (R$ 1M+) ou via fundos.',
      educacao: 'Debêntures são para quem busca rendimento extra e entende risco de crédito. Empresas boas pagam CDI+2%, empresas arriscadas pagam CDI+5%.',
    },
  ],

  renda_variavel: [
    {
      nome: 'Ações',
      tipo: 'Bolsa de Valores (B3)',
      risco: 'Alto',
      liquidez: 'D+2',
      rentabilidade: 'Variável (dividendos + valorização)',
      prazo: 'Longo prazo (5+ anos)',
      descricao: 'Frações do capital social de uma empresa negociadas na B3. O investidor vira sócio.',
      vantagens: ['Potencial de valorização ilimitado', 'Dividendos (geralmente isentos de IR)', 'Diversificação setorial'],
      desvantagens: ['Alta volatilidade', 'Risco de perda permanente de capital', 'Exige estudo e acompanhamento'],
      ir: '15% sobre lucro (alienação > R$ 20k/mês). Dividendos são isentos.',
      como_investir: 'Abra conta em corretora (Rico, XP, Clear, etc.), transfira recursos e compre pelo home broker.',
      educacao: 'Comprar ações é virar sócio de uma empresa. Antes de comprar, estude: o que a empresa faz? Ela dá lucro? Qual a dívida? O preço está justo? Nunca invista em empresa que você não entende.',
    },
    {
      nome: 'Fundos Imobiliários (FIIs)',
      tipo: 'Bolsa de Valores (B3)',
      risco: 'Médio',
      liquidez: 'D+2 (depende do fundo)',
      rentabilidade: 'Rendimento mensal (0,5% a 1% do valor da cota) + valorização',
      prazo: 'Médio a longo prazo (3+ anos)',
      descricao: 'Fundos que investem em imóveis físicos (tijolo) ou papéis imobiliários (CRI, LCI). Distribuem renda mensal isenta.',
      vantagens: ['Rendimento mensal isento de IR', 'Acesso ao mercado imobiliário com pouco capital', 'Liquidez maior que imóvel físico'],
      desvantagens: ['Volatilidade (cotas oscilam)', 'Risco de vacância (imóveis físicos)', 'Taxa de administração'],
      ir: 'Rendimentos isentos. Ganho de capital na venda: 15% (20% em algumas operações)',
      como_investir: 'Disponível no home broker da corretora. Pesquise no site Funds Explorer ou Clube FII.',
      educacao: 'FIIs pagam renda todo mês, como se fosse um aluguel. Para começar, prefira fundos de "tijolo" (imóveis físicos) com boa liquidez e histórico de pagamentos. Ex: KNRI11, XPLG11, HGLG11.',
    },
    {
      nome: 'ETFs (Exchange Traded Funds)',
      tipo: 'Bolsa de Valores (B3)',
      risco: 'Médio',
      liquidez: 'D+2',
      rentabilidade: 'Segue índice de referência (ex: IBOV, S&P500)',
      prazo: 'Médio a longo prazo (3+ anos)',
      descricao: 'Fundos que replicam um índice de mercado. Diversificação instantânea com uma só compra.',
      vantagens: ['Diversificação automática', 'Taxas baixas (0,20% a 0,50% ao ano)', 'Simplicidade (não precisa escolher ações)'],
      desvantagens: ['Não supera o índice (segue ele)', 'Exposição a quedas do mercado todo', 'Alguns têm baixa liquidez'],
      ir: '15% sobre o lucro na venda. Não há "day trade" se mantido > 30 dias.',
      como_investir: 'Negociado em bolsa como ações. BOVX11 (IBOV), IVVB11 (S&P500), HASH11 (criptomoedas).',
      educacao: 'ETFs são perfeitos para quem quer investir mas não quer virar analista. Compre um ETF de índice amplo (como BOVX11 para Brasil ou IVVB11 para EUA) todo mês e mantenha por anos.',
    },
    {
      nome: 'BDRs (Brazilian Depositary Receipts)',
      tipo: 'Bolsa de Valores (B3)',
      risco: 'Alto',
      liquidez: 'D+2',
      rentabilidade: 'Segue ação da empresa externa (Apple, Google, etc.)',
      prazo: 'Longo prazo (5+ anos)',
      descricao: 'Certificados que representam ações de empresas estrangeiras negociadas na B3 em Reais.',
      vantagens: ['Acesso a empresas globais em Reais', 'Negociado no home broker', 'Diversificação internacional'],
      desvantagens: ['Risco cambial (dólar/real)', 'Taxas de administração do BDR', 'Menor liquidez que a ação original'],
      ir: '15% sobre o lucro na venda',
      como_investir: 'BDRs nível 1 (acesso amplo) como AAPL34 (Apple), GOOG34 (Google), NVDC34 (NVIDIA).',
      educacao: 'BDRs são uma forma prática de investir em empresas globais sem precisar abrir conta no exterior. Mas lembre: o rendimento em R$ depende do que a ação faz em dólar E da cotação do dólar.',
    },
  ],

  comparativos: {
    cdb_vs_lci: {
      titulo: 'CDB vs LCI/LCA',
      comparacao: [
        { aspecto: 'Imposto de Renda', cdb: '22,5% a 15%', lci: 'Isento' },
        { aspecto: 'Cobertura FGC', cdb: 'Sim (até R$ 250k)', lci: 'Sim (até R$ 250k)' },
        { aspecto: 'Liquidez', cdb: 'Depende (DI + D+1)', lci: 'Carência mínima 90 dias' },
        { aspecto: 'Rentabilidade típica', cdb: '100% a 120% CDI', lci: '85% a 100% CDI' },
        { aspecto: 'Indicado para', cdb: 'Qualquer prazo', lci: 'Acima de 90 dias' },
      ],
      resumo: 'Para prazos acima de 90 dias, LCI/LCA geralmente compensam mais por serem isentas de IR. Exemplo: LCI a 90% do CDI equivale a CDB a ~110% do CDI após IR.',
    },
    tesouro_direto: {
      titulo: 'Qual Tesouro Escolher?',
      comparacao: [
        { aspecto: 'Reserva de emergência', indicado: 'Tesouro Selic', motivo: 'Liquidez D+1 e sem volatilidade' },
        { aspecto: 'Aposentadoria (longo prazo)', indicado: 'Tesouro IPCA+', motivo: 'Proteção contra inflação + juro real' },
        { aspecto: 'Aposta na queda de juros', indicado: 'Tesouro Prefixado', motivo: 'Trava taxa alta e se valoriza se juros caem' },
        { aspecto: 'Objetivo de médio prazo', indicado: 'Tesouro IPCA+ curto', motivo: 'Equilíbrio entre proteção e liquidez' },
      ],
    },
    acoes_vs_fiis: {
      titulo: 'Ações vs FIIs',
      comparacao: [
        { aspecto: 'Renda recorrente', acoes: 'Dividendos variáveis', fiis: 'Rendimentos mensais (~0,5-1% a.m.)' },
        { aspecto: 'Potencial de valorização', acoes: 'Ilimitado (empresa cresce)', fiis: 'Limitado (lastro imobiliário)' },
        { aspecto: 'Risco', acoes: 'Maior', fiis: 'Médio' },
        { aspecto: 'IR sobre proventos', acoes: 'Isento', fiis: 'Isento' },
        { aspecto: 'Liquidez', acoes: 'Maior', fiis: 'Média (depende do fundo)' },
      ],
      resumo: 'FIIs são melhores para quem busca renda mensal previsível. Ações são melhores para quem busca crescimento patrimonial no longo prazo. Uma carteira equilibrada tem ambos.',
    },
  },

  educacao: [
    {
      titulo: 'Reserva de Emergência',
      conteudo: 'Antes de INVESTIR, você precisa ter uma reserva de emergência. São de 6 a 12 meses dos seus gastos mensais em investimento seguro e com liquidez imediata. Tesouro Selic é a melhor opção. Isso não é investimento — é seguro.',
    },
    {
      titulo: 'CDI: O que é e por que importa',
      conteudo: 'CDI (Certificado de Depósito Interbancário) é a taxa que os bancos usam para emprestar dinheiro entre si. Ela fica muito próxima da Selic e é a referência da renda fixa brasileira. Quando você vê "100% do CDI", significa que o investimento paga a taxa CDI integral.',
    },
    {
      titulo: 'Marcação a Mercado',
      conteudo: 'Quando você compra um título de renda fixa antes do vencimento, o preço dele oscila diariamente conforme as taxas de juros mudam. Se os juros sobem, seu título desvaloriza (e vice-versa). Isso só vira prejuízo REAL se você vender antes do vencimento. Segurando até o fim, você recebe o combinado.',
    },
    {
      titulo: 'Diversificação',
      conteudo: 'Não coloque todos os ovos na mesma cesta. Distribua entre: renda fixa e variável, setores diferentes, países diferentes, emissores diferentes. Uma boa diversificação reduz o risco sem necessariamente reduzir o retorno esperado.',
    },
    {
      titulo: 'Custo da Corretagem',
      conteudo: 'No Brasil, a maioria das corretoras não cobra corretagem para compra de ações. Mas fique atento a: taxa de custódia (algumas cobram), emolumentos B3 (~0,03%), IRRF na venda. Esses custos pequenos fazem diferença no longo prazo.',
    },
    {
      titulo: 'Juros Compostos',
      conteudo: 'O dinheiro que você investe hoje gera juros. No próximo mês, você ganha juros sobre o valor inicial E sobre os juros anteriores. É uma bola de neve. Com 1% ao mês, R$ 1.000 viram R$ 1.348 em 3 anos. Com aportes mensais, o resultado é muito maior.',
    },
  ],

  glosario: {
    'CDI': 'Taxa de referência da renda fixa brasileira. Próxima à Selic.',
    'FGC': 'Fundo Garantidor de Créditos. Protege até R$ 250 mil por CPF por instituição.',
    'IR': 'Imposto de Renda. Incide sobre o lucro dos investimentos.',
    'IPCA': 'Índice oficial de inflação do Brasil (IBGE).',
    'Selic': 'Taxa básica de juros da economia brasileira, definida pelo Banco Central.',
    'Rating': 'Nota de risco de crédito de um emissor (AAA = baixíssimo risco, D = default).',
    'Spread': 'Diferença entre a taxa de captação e a taxa de aplicação. Lucro do banco.',
    'Dividendo': 'Parte do lucro da empresa distribuída aos acionistas.',
    'Tag Along': 'Direito do acionista minoritário de vender ações por no mínimo 80% do valor pago ao controlador.',
    'Volatilidade': 'Medida de oscilação do preço de um ativo no tempo. Quanto maior, mais arriscado.',
  },
};

export function consultar({ tipo, perfil, termo } = {}) {
  const resultado = {};

  if (tipo === 'renda_fixa' || !tipo) {
    resultado.renda_fixa = CONHECIMENTO.renda_fixa;
  }

  if (tipo === 'renda_variavel' || !tipo) {
    resultado.renda_variavel = CONHECIMENTO.renda_variavel;
  }

  if (perfil) {
    resultado.perfil = CONHECIMENTO.perfis.find(p => p.id === perfil) || CONHECIMENTO.perfis;
  } else {
    resultado.perfis = CONHECIMENTO.perfis;
  }

  if (termo) {
    const t = termo.toLowerCase();
    resultado.busca = [];

    const buscar = (items, fonte) => {
      for (const item of items) {
        if (item.nome?.toLowerCase().includes(t) || item.descricao?.toLowerCase().includes(t) || item.tipo?.toLowerCase().includes(t)) {
          resultado.busca.push({ ...item, fonte });
        }
      }
    };

    buscar(CONHECIMENTO.renda_fixa, 'renda_fixa');
    buscar(CONHECIMENTO.renda_variavel, 'renda_variavel');

    for (const [key, value] of Object.entries(CONHECIMENTO.glosario)) {
      if (key.toLowerCase().includes(t) || value.toLowerCase().includes(t)) {
        resultado.busca.push({ nome: key, descricao: value, fonte: 'glossario' });
      }
    }

    for (const item of CONHECIMENTO.educacao) {
      if (item.titulo.toLowerCase().includes(t) || item.conteudo.toLowerCase().includes(t)) {
        resultado.busca.push({ ...item, fonte: 'educacao' });
      }
    }
  }

  resultado.comparativos = CONHECIMENTO.comparativos;
  resultado.educacao = CONHECIMENTO.educacao;
  resultado.glosario = CONHECIMENTO.glosario;

  return resultado;
}
