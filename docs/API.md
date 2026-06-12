# Finance AI — API Reference

> Todas as rotas em `http://localhost:3000`
> Formato: JSON (exceto `/upload` que é multipart)
> CORS: habilitado para todos origins

---

## Sumário

- [Transações CRUD](#transações-crud)
- [Dashboard & Relatórios](#dashboard--relatórios)
- [Upload CSV](#upload-csv)
- [Consultor de Investimentos](#consultor-de-investimentos)
- [Utilitários](#utilitários)

---

## Transações CRUD

### `GET /transacoes`

Lista transações ordenadas por data DESC.

**Query Params:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `limit` | int | não | Máximo de linhas (default: 100) |
| `inicio` | string | não | Data início (YYYY-MM-DD) |
| `fim` | string | não | Data fim (YYYY-MM-DD) |

**Response 200:**
```json
[
  {
    "id": 1,
    "fonte": "99pay",
    "conta": "99Pay",
    "tipo": "entrada",
    "valor": 1500.00,
    "moeda": "BRL",
    "descricao": "Lucro",
    "categoria": "salario",
    "data": "2026-06-01",
    "hash": "abc123...",
    "created_at": "2026-06-01T12:00:00.000Z"
  }
]
```

### `POST /transacoes`

Cria uma nova transação.

**Request Body:**
```json
{
  "data": "2026-06-11",
  "tipo": "entrada",
  "valor": 5000.00,
  "moeda": "BRL",
  "conta": "Nubank",
  "descricao": "Salário Junho",
  "categoria": "salario",
  "fonte": "manual"
}
```

**Campos obrigatórios:** `data`, `tipo`, `valor`
**Defaults:** `moeda: "BRL"`, `conta: "Manual"`, `categoria: "outros"`, `fonte: "manual"`
**Response:** 201 — transação criada (incluindo id e hash gerado)
**Response 409:** Transação duplicada (hash já existe)

### `PUT /transacoes/:id`

Edita uma transação existente. Envio parcial (só os campos que mudam).

**Request Body:** (mesmo schema, campos opcionais)
**Response:** 200 — transação atualizada
**Response 404:** Transação não encontrada

### `DELETE /transacoes/:id`

Exclui uma transação.

**Response:** 200 — `{ message: "Transacao excluida", id: N }`
**Response 404:** Transação não encontrada

---

## Dashboard & Relatórios

### `GET /dashboard`

Consolidado financeiro completo.

**Query Params:** `?inicio=&fim=&moeda=`

**Response:**
```json
{
  "saldo_total": 12345.67,
  "total_entrada": 20000.00,
  "total_saida": 7654.33,
  "total_investido": 3000.00,
  "por_moeda": [
    { "moeda": "BRL", "total_entrada": 20000, "total_saida": 7654.33, "total_investido": 3000, "saldo": 12345.67 }
  ],
  "saldo_por_conta": [
    { "nome": "Nubank", "tipo": "banco", "saldo_calculado": 5000, "qtd_transacoes": 10 }
  ],
  "custo_vida": 4000,
  "despesas_extras": 1200,
  "investido": 3000,
  "percentual_por_categoria": [
    { "categoria": "alimentacao", "valor": 1500, "percentual": 25 }
  ],
  "fluxo_mensal": [
    { "mes": "2026-05", "entradas": 10000, "gastos": 4000 }
  ]
}
```

### `GET /investimentos`

Investimentos e evolução patrimonial.

**Query Params:** `?inicio=&fim=&moeda=`

**Response:**
```json
{
  "total": 30000,
  "por_tipo": [
    { "tipo": "fii", "total": 15000 },
    { "tipo": "acao", "total": 10000 }
  ],
  "por_conta": [
    { "conta": "Rico", "total": 25000 }
  ],
  "evolucao": [
    { "mes": "2026-01", "saldo": 5000, "investido": 1000, "patrimonio": 6000 },
    { "mes": "2026-02", "saldo": 7000, "investido": 3000, "patrimonio": 10000 }
  ]
}
```

### `GET /categorias`

Gastos e receitas agrupados por categoria com percentuais.

**Query Params:** `?inicio=&fim=&moeda=`

**Response:**
```json
{
  "gastos": [
    { "categoria": "alimentacao", "total": 1500, "percentual": 30 },
    { "categoria": "moradia", "total": 2000, "percentual": 40 }
  ],
  "receitas": [
    { "categoria": "salario", "total": 10000, "percentual": 80 }
  ],
  "total_gastos": 5000,
  "total_receitas": 12500
}
```

### `GET /resumo`

Totais simples.

**Query Params:** `?inicio=&fim=`

**Response:**
```json
{
  "total_gastos": 5000,
  "total_entradas": 15000,
  "saldo": 10000,
  "total_investimentos": 3000
}
```

---

## Upload CSV

### `POST /upload`

Importa arquivo CSV de um banco específico.

**Formato:** multipart/form-data

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `file` | file | sim | Arquivo CSV |
| `fonte` | string | sim | Identificador do banco |

**Fontes suportadas:** `c6`, `mercadopago`, `binance`, `rico`, `nomad`, `99pay`

**Formato CSV esperado:**
```
data,descricao,valor,tipo
2026-06-01,Lucro,1.20,entrada
```

- Decimal separador: ponto (`.`)
- Datas: `YYYY-MM-DD`
- Coluna `tipo`: `entrada`, `saida` (convertido para `gasto` automaticamente)

**Response 200:**
```json
{
  "message": "Importacao concluida",
  "total": 100,
  "inseridas": 95,
  "ignoradas": 2,
  "duplicatas": 3
}
```

---

## Consultor de Investimentos

### `GET /consultor`

Base de conhecimento de investimentos.

**Query Params:** (todos opcionais)
| Parâmetro | Descrição |
|-----------|-----------|
| `tipo` | `renda_fixa` ou `renda_variavel` (se omitido, retorna ambos) |
| `perfil` | `conservador`, `moderado`, `agressivo` |
| `termo` | Busca textual em produtos, glossário e artigos |

**Exemplo de busca:** `/consultor?termo=CDI` retorna glossário + produtos que mencionam CDI.

**Response principal (sem filtros):**
```json
{
  "renda_fixa": [
    {
      "nome": "Tesouro Selic",
      "tipo": "Tesouro Direto",
      "risco": "Baixíssimo",
      "liquidez": "D+1",
      "rentabilidade": "100% do CDI",
      "prazo": "Livre",
      "descricao": "Título público pós-fixado...",
      "vantagens": ["Liquidez diária", "Garantido pelo governo"],
      "desvantagens": ["Rentabilidade menor"],
      "ir": "Regressivo: 22,5% a 15%",
      "come_investir": "Pelo app do Tesouro Direto...",
      "educacao": "O Tesouro Selic é o investimento mais seguro..."
    }
  ],
  "renda_variavel": [ /* ... */ ],
  "perfis": [ /* Conservador, Moderado, Agressivo */ ],
  "comparativos": { /* CDB vs LCI, Tesouro por objetivo, Ações vs FIIs */ },
  "educacao": [ /* 6 artigos */ ],
  "glosario": { /* 10 termos */ }
}
```

### `GET /analise-carteira`

Análise personalizada baseada nos dados reais do usuário.

**Query Params:** `?inicio=&fim=&moeda=`

**Response:**
```json
{
  "total_investido": 30000,
  "receita_total": 100000,
  "despesa_total": 50000,
  "percentual_investido": 30,
  "percentual_gastos": 50,
  "recomendacoes": [
    {
      "tipo": "positivo",
      "mensagem": "Parabens! Voce investe 30% da sua receita..."
    },
    {
      "tipo": "melhoria",
      "mensagem": "Gastos de 50% da receita..."
    }
  ]
}
```

**Tipos de recomendação:** `positivo` (verde), `melhoria` (amarelo), `alerta` (vermelho), `dica` (roxo)

---

## Utilitários

### `GET /contas`

Lista todas as contas cadastradas.

**Response:**
```json
[
  { "nome": "Nubank", "tipo": "banco", "saldo_atual": 0 },
  { "nome": "99Pay", "tipo": "carteira", "saldo_atual": 0 }
]
```

### `GET /categorias-list`

Lista distinct de categorias existentes nas transações.

**Response:**
```json
["alimentacao", "compras", "lazer", "moradia", "salario", "saude", "transporte"]
```

---

## Códigos de Erro

| Código | Significado | Causa Comum |
|--------|-------------|-------------|
| 400 | Bad Request | Campo obrigatório faltando |
| 404 | Not Found | Transação não encontrada (PUT/DELETE) |
| 409 | Conflict | Hash duplicado (transação já existe) |
| 500 | Internal Server | Erro no servidor, verifique console |
