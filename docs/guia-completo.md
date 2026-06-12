# Finance AI — Guia Completo

> Assistente financeiro pessoal com educação em investimentos.
> Frontend: https://cash-pied-ten.vercel.app | Backend: localhost:3000

---

## Sumário

1. [Arquitetura](#1-arquitetura)
2. [Instalação](#2-instalação)
3. [Uso](#3-uso)
4. [Fluxo de Dados](#4-fluxo-de-dados)
5. [API Endpoints](#5-api-endpoints)
6. [Frontend Pages](#6-frontend-pages)
7. [Banco de Dados](#7-banco-de-dados)
8. [Deploy](#8-deploy)
9. [Portabilidade](#9-portabilidade)
10. [Solução de Problemas](#10-solução-de-problemas)

---

## 1. Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Vercel)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ Upload   │ │Dashboard │ │Categorias│ │Consultor│ │
│  │ index.html│ │dash.html │ │cat.html  │ │cons.html│ │
│  └──────────┘ └──────────┘ └──────────┘ └─────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │Investim. │ │ style.css│ │ app.js + charts.js   │ │
│  │inv.html  │ │          │ │ invest-charts.js     │ │
│  └──────────┘ └──────────┘ │ cat-charts.js        │ │
│                             │ consultor.js         │ │
│                             └──────────────────────┘ │
└───────────────────┬─────────────────────────────────┘
                    │ fetch() calls
                    ▼
┌─────────────────────────────────────────────────────┐
│              BACKEND (Node.js/Express)                │
│                                                      │
│  server.js (port 3000)                               │
│  ├── GET  /transacoes     ─→ Lista transações       │
│  ├── POST /transacoes     ─→ Cria transação         │
│  ├── PUT  /transacoes/:id  ─→ Edita transação       │
│  ├── DELETE /transacoes/:id ─→ Exclui transação     │
│  ├── POST /upload         ─→ Importa CSV            │
│  ├── GET  /dashboard      ─→ KPIs + categorias      │
│  ├── GET  /investimentos  ─→ Investimentos          │
│  ├── GET  /categorias     ─→ Gastos/receitas        │
│  ├── GET  /resumo         ─→ Totais simples          │
│  ├── GET  /contas          ─→ Lista contas           │
│  ├── GET  /consultor       ─→ Conhecimento           │
│  ├── GET  /analise-carteira ─→ Análise da carteira   │
│  └── GET  /categorias-list ─→ Lista de categorias   │
│                                                      │
│  Engine:                                            │
│  ├── consolidator.js  ─→ Saldos por conta/moeda     │
│  ├── metrics.js       ─→ Metas, fluxo, categorias,  │
│  │                       investimentos, patrimônio  │
│  ├── conhecimento.js  ─→ Base de conhecimento ed.   │
│  ├── categorizer.js   ─→ Regras keyword→categoria   │
│  └── importer.js      ─→ CSV import + normalizadores│
│                                                      │
│  Database: SQLite (better-sqlite3 / sql.js)          │
│  └── database/finance.db                            │
└─────────────────────────────────────────────────────┘
```

### Stack Completa

| Camada | Tecnologia | Observação |
|--------|-----------|-----------|
| Backend desktop | Node.js (ESM), Express, better-sqlite3 | `npm start` |
| Backend Termux | Node.js (ESM), Express, sql.js | WASM SQLite |
| Frontend | Vanilla JS, Chart.js 4, CSS custom properties | Estático |
| Mobile | Kotlin, Jetpack Compose, ML Kit OCR | Android APK |
| Deploy frontend | Vercel | Automático no push |
| CI Android | GitHub Actions | Build APK |

---

## 2. Instalação

### Desktop (Windows/Linux/Mac)

```bash
# Clone ou copie a pasta
cd finance-ai

# Instale as dependências
npm install

# Inicie o servidor
npm start

# Acesse http://localhost:3000
```

### Termux (Android)

```bash
# Copie a pasta para o celular (git clone ou USB/transferência)

# Execute o setup
pkg install nodejs
./setup-termux.sh

# Inicie
node backend/server-termux.js

# Acesse http://localhost:3000 no navegador
```

---

## 3. Uso

### Importar CSV

1. Acesse a página **Upload** (`/`)
2. Selecione a **Fonte** (banco/corretora)
3. Escolha o arquivo CSV
4. Clique **Importar**
5. Verifique o resultado na tabela e resumo

### Gerenciar Transações Manualmente

- **Adicionar**: Clique **"+ Nova"** preencha data, tipo, valor, conta, categoria, descrição livre
- **Editar**: Clique no lápis (✏️) na linha da transação
- **Excluir**: Clique no × na linha da transação

### Navegar pelo Dashboard

- **Dashboard** (`/dashboard.html`): Visão geral com saldos, KPIs, gastos por categoria, fluxo mensal, metas financeiras
- **Investimentos** (`/investimentos.html`): Breakdown por tipo/conta, evolução mensal do patrimônio
- **Categorias** (`/categorias.html`): Gastos e receitas detalhados por categoria
- **Consultor** (`/consultor.html`): Educação financeira, perfis de investidor, análise da carteira

### Filtro por Período

Todas as páginas têm um seletor de mês/ano. Altere para ver dados de um período específico.

---

## 4. Fluxo de Dados

```
Android App                  CSV Upload               Frontend
┌──────────┐               ┌──────────┐           ┌──────────┐
│ Screenshot│ → OCR →     │ /upload  │ → DB →    │ Dashboard│
│ Capture   │ → Parser →   │ importCSV│  SQLite   │ Charts   │
│ (by bank) │ → CSV export │          │  finance  │ Categorias│
└──────────┘               └──────────┘  .db      │ Consultor│
                                                   └──────────┘
                                                       ↑
                                              ┌──────────┐
                                              │ CRUD Modal│
                                              │ (app.js) │
                                              └──────────┘
```

### Hash de Dedup (evita duplicatas)

`MD5( data + "-" + valor + "-" + descricao + "-" + fonte + "-" + tipo + "-" + conta )`

- Gerado pelo `importer.js` e no CRUD
- `INSERT OR IGNORE` no SQL — duplicatas são ignoradas silenciosamente
- Editar uma transação recalcula o hash

### Categorização

1. Se o normalizador do banco já define categoria, ela é mantida
2. Senão, o `categorizer.js` aplica regras de keyword → categoria
3. Categorias base: alimentação, moradia, transporte, saúde, compras, streaming, lazer, salário, transferência, investimento, financeiro, educação, delivery

---

## 5. API Endpoints

### Transações

| Método | Rota | Descrição | Parâmetros |
|--------|------|-----------|-----------|
| GET | `/transacoes` | Listar | `?limit=&inicio=&fim=` |
| POST | `/transacoes` | Criar | Body: `{ data, tipo, valor, moeda, conta, descricao, categoria, fonte }` |
| PUT | `/transacoes/:id` | Editar | Body parcial, mesmo schema |
| DELETE | `/transacoes/:id` | Excluir | — |

### Relatórios

| Rota | Parâmetros | Retorno |
|------|-----------|---------|
| `/dashboard` | `?inicio&fim&moeda` | saldo_total, total_entrada/saida, por_moeda[], saldo_por_conta[], custo_vida, despesas_extras, investido, percentual_por_categoria[], fluxo_mensal[] |
| `/investimentos` | `?inicio&fim&moeda` | total, por_tipo[], por_conta[], evolucao[{ mes, saldo, investido, patrimonio }] |
| `/categorias` | `?inicio&fim&moeda` | gastos[{ categoria, total, percentual }], receitas[], total_gastos, total_receitas |
| `/resumo` | `?inicio&fim` | total_gastos, total_entradas, saldo, total_investimentos |
| `/analise-carteira` | `?inicio&fim&moeda` | total_investido, receita_total, despesa_total, percentual_investido, recomendacoes[] |
| `/consultor` | `?tipo=&perfil=&termo=` | Base completa de conhecimento financeiro |

### Utilitários

| Rota | Descrição |
|------|-----------|
| `/contas` | Lista de contas cadastradas |
| `/categorias-list` | Lista distinct de categorias |
| `/upload` | POST multipart (file + fonte) |

---

## 6. Frontend Pages

### Upload (`/`)
- Formulário de upload CSV com seleção de banco
- Resumo rápido (entradas, gastos, saldo, investido)
- Tabela de últimas transações com ações (editar/excluir)
- Modal CRUD completo

### Dashboard (`/dashboard.html`)
- Hero com saldo total e margem percentual
- KPIs: entradas, saídas, investido
- Cards de contas com saldo individual
- Gastos por categoria (tabela + donut chart)
- Receitas por categoria (tabela)
- Fluxo mensal (gráfico de barras)
- Metas financeiras (custo de vida, extras, investido)

### Investimentos (`/investimentos.html`)
- Hero com total investido
- KPIs: patrimônio líquido, saldo disponível, evolução mensal
- Alocação por tipo e por conta (tabelas)
- Gráfico de linha: evolução do patrimônio
- Tabela detalhada mês a mês

### Categorias (`/categorias.html`)
- KPIs: total gastos, total receitas
- Gastos por categoria (tabela + bar chart horizontal)
- Receitas por categoria (tabela + bar chart horizontal)

### Consultor (`/consultor.html`)
- Busca textual em toda base de conhecimento
- Perfis de investidor (Conservador, Moderado, Agressivo)
- Análise da carteira com recomendações personalizadas
- Tabs: Renda Fixa, Renda Variável, Comparativos, Educação, Glossário

---

## 7. Banco de Dados

### Schema

```sql
-- Tabela contas
CREATE TABLE contas (
  nome TEXT PRIMARY KEY,
  tipo TEXT NOT NULL DEFAULT 'banco',   -- banco | carteira | corretora
  saldo_atual REAL NOT NULL DEFAULT 0
);

-- Tabela transacoes
CREATE TABLE transacoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fonte TEXT NOT NULL,                  -- 99pay | c6 | mercadopago | rico | binance | nomad | manual
  conta TEXT NOT NULL,                  -- Nome da conta (FK lógica para contas.nome)
  tipo TEXT NOT NULL,                   -- entrada | gasto | investimento
  valor REAL NOT NULL,
  moeda TEXT NOT NULL DEFAULT 'BRL',    -- BRL | USD | BTC
  descricao TEXT,
  categoria TEXT,                       -- alimentacao, moradia, etc.
  data DATE NOT NULL,
  hash TEXT UNIQUE,                     -- MD5 dedup
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Índices

- `idx_transacoes_data` — Ordered by data DESC (default listing)
- `idx_transacoes_conta` — JOIN com contas
- `idx_transacoes_hash` — UNIQUE constraint + dedup lookup

### Contas Padrão (seed automática)

C6 Bank (banco), 99Pay (carteira), Mercado Pago (carteira), Rico (corretora), Binance (corretora), Nomad (carteira), Nubank (banco), Caixa (banco), Itaú (banco), Inter (banco)

---

## 8. Deploy

### Frontend (Vercel)

Push no `main` → Vercel deploy automático em https://cash-pied-ten.vercel.app

**Importante**: O frontend no Vercel é estático. O backend precisa estar rodando em `localhost:3000` para que as chamadas de API funcionem. Quando hospedado no Vercel, `API_BASE` aponta para `http://localhost:3000`.

### Android APK (GitHub Actions)

Push em `99pay-extractor/**` no `main` → build automático do APK. Download em: GitHub → Actions → workflow build → artifact.

---

## 9. Portabilidade

| Origem → Destino | Procedimento |
|---|---|
| PC → PC | Copiar pasta, `npm install`, `npm start` |
| PC → Termux | Copiar, `./setup-termux.sh`, `node backend/server-termux.js` |
| PC → Docker | `npm run docker:build && npm run docker:run` |
| Dados | Copiar `database/finance.db` — SQLite puro |
| Android → PC | Exportar CSV, importar pelo Upload |

### Requisitos Mínimos

- **Node.js** 18+ (qualquer SO)
- **SQLite** (embutido no better-sqlite3 ou sql.js WASM)
- **Navegador** moderno (Chrome, Firefox, Edge, Safari)
- **Android**: Termux 0.118+ (para backend mobile)

### Sem Dependências Externas

- ✅ Sem contas em serviços cloud
- ✅ Sem variáveis de ambiente obrigatórias
- ✅ Sem paths absolutos (tudo relativo)
- ✅ Sem hardcoded IPs ou credenciais
- ✅ Banco SQLite é um arquivo — portável

---

## 10. Solução de Problemas

### "better-sqlite3 não compila" (Termux)

Use `server-termux.js` que usa `sql.js` (WASM). Rode `./setup-termux.sh` para configurar automaticamente.

### "Erro: Normalizador não encontrado"

O campo `fonte` no upload deve ser um dos: `c6`, `mercadopago`, `binance`, `rico`, `nomad`, `99pay`. Verifique se o CSV foi exportado com a fonte correta.

### "Transação duplicada"

O hash gerado por `data-valor-descricao-fonte-tipo-conta` já existe. Use Editar para modificar a existente ou ajuste um campo para gerar hash diferente.

### "CSV não é importado"

- O CSV precisa ter cabeçalho e usar ponto (`.`) como separador decimal
- A data deve estar no formato `YYYY-MM-DD` ou reconhecível pelo normalizador
- Verifique se o normalizador para aquela fonte existe em `backend/normalizers/`

### "Frontend não carrega dados (Vercel)"

O frontend no Vercel precisa do backend rodando local. Inicie `node backend/server.js` e recarregue a página.

### "Gráficos não aparecem"

Verifique se o Chart.js carregou (CDN). Pode ser bloqueio de script/ trackers no navegador.

---

## Histórico de Versões

| Data | Versão | Mudanças |
|------|--------|---------|
| 2025-03 | 1.0 | Backend CRUD, upload CSV, categorias, dashboard |
| 2025-04 | 1.1 | Modal CRUD, investimentos, categorias page |
| 2025-05 | 1.2 | Android multi-bank extractor, AGENTS.md, Vercel |
| 2025-06 | 1.3 | Consultor de investimentos, analise carteira, Termux setup |
