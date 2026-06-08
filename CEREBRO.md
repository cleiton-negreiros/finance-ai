# CEREBRO - Finance AI

## Arquitetura do Projeto

```
/cash
├── backend/
│   ├── server.js          # Servidor Express (porta 3000)
│   ├── db.js              # Conexão SQLite + init + seedContas()
│   ├── importer.js        # Importador de CSV
│   ├── categorizer.js     # Categorização automática (~100 regex)
│   ├── engine/
│   │   ├── consolidator.js # Motor de consolidação financeira
│   │   └── metrics.js      # Métricas e percentuais
│   ├── normalizers/       # Normalizadores por fonte
│   │   ├── c6.js          # conta: C6 Bank
│   │   ├── mercadopago.js # conta: Mercado Pago
│   │   ├── binance.js     # conta: Binance
│   │   ├── rico.js        # conta: Rico
│   │   └── nomad.js       # conta: Nomad
│   └── uploads/           # Pasta temporária de uploads
├── frontend/
│   ├── index.html         # Upload CSV + navegação
│   ├── dashboard.html     # Dashboard completo com Chart.js
│   ├── app.js             # Lógica upload + dashboard
│   ├── charts.js          # Gráficos (Chart.js)
│   └── style.css          # Tema dark + dashboard responsivo
├── database/
│   ├── schema.sql         # Schema SQLite (contas + transacoes)
│   └── finance.db         # Banco de dados (gerado automaticamente)
├── samples/               # CSVs de exemplo
├── CEREBRO.md
├── AI_README.md
├── README.md
├── INSTALL.md
├── package.json
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── netlify.toml
├── setup.sh / setup.ps1
├── sync.sh / sync.ps1
```

## Stack Tecnológica

- **Runtime:** Node.js (ES Modules)
- **Web Server:** Express
- **Banco:** SQLite (better-sqlite3)
- **Upload:** Multer
- **Frontend:** HTML + CSS + JS puro (sem frameworks)
- **Mobile:** Termux (Android)

## Endpoints da API

### POST /upload
Upload de CSV com transações.
- Multipart form-data: `file` (CSV), `fonte` (string)
- Retorna: `{ message, total, inseridas, ignoradas, duplicatas }`

### GET /transacoes
Lista transações.
- Query: `?limit=100`
- Retorna: `[{ id, fonte, tipo, valor, moeda, descricao, categoria, data, created_at }]`

### GET /resumo
Resumo financeiro.
- Retorna: `{ total_gastos, total_entradas, saldo, total_investimentos }`

### GET /contas
Lista todas as contas cadastradas.
- Retorna: `[{ nome, tipo, saldo_atual }]`

### GET /dashboard
Dashboard completo com consolidação e métricas.
- Retorna consolidação + métricas em um único JSON

## Fluxo de Importação

1. Usuário seleciona fonte e arquivo CSV no frontend
2. Frontend envia via fetch POST /upload
3. Server salva arquivo temporário em /uploads/
4. Server chama importer.js com o caminho do arquivo
5. importer.js lê CSV linha a linha com stream (readline)
6. Para cada linha, chama o normalizador correspondente à fonte
7. Normalizador mapeia colunas, converte tipos, padroniza data
8. categorizer.js categoriza automaticamente por regex na descrição
9. Adiciona campo conta (baseado no normalizador ou coluna do CSV)
10. Gera hash MD5 único (data+valor+descricao+fonte) para evitar duplicatas
10. Insere em batch com transação SQLite (INSERT OR IGNORE)
11. Remove arquivo temporário

## Estrutura do Banco (SQLite)

```sql
contas (
  nome         TEXT PRIMARY KEY,
  tipo         TEXT NOT NULL,        -- banco | carteira | corretora
  saldo_atual  REAL DEFAULT 0
)

transacoes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  fonte       TEXT NOT NULL,
  conta       TEXT NOT NULL,
  tipo        TEXT NOT NULL,        -- gasto | entrada | investimento
  valor       REAL NOT NULL,
  moeda       TEXT NOT NULL,        -- BRL | USD | BTC | ETH
  descricao   TEXT,
  categoria   TEXT,
  data        DATE NOT NULL,        -- YYYY-MM-DD
  hash        TEXT UNIQUE,          -- MD5 para dedup
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## Motor de Consolidação (engine/consolidator.js)

Agrupa transações por conta e calcula:
- `saldo_total`: entradas - gastos
- `total_entrada`: soma de todas as entradas
- `total_saida`: soma de todos os gastos
- `total_investido`: soma de investimentos
- `saldo_por_conta[]`: array com nome, tipo, saldo_calculado, qtd_transacoes

## Motor de Métricas (engine/metrics.js)

Categoriza e calcula indicadores:
- `custo_vida`: gastos em alimentacao + moradia + contas + transporte + saude
- `despesas_extras`: gastos em lazer + compras + streaming + assinaturas
- `investido`: total de investimentos
- `percentual_por_categoria[]`: cada categoria com valor e % do total
- `fluxo_mensal[]`: últimos 12 meses com entradas e gastos

## Categorizador (categorizer.js)

13 grupos de regex (~100 padrões):
- alimentacao: ifood, supermercado, padaria, acougue, feira, etc
- moradia: aluguel, condominio, agua, luz, internet, gas
- transporte: uber, 99, taxi, gasolina, onibus, metro, pedagio
- saude: farmacia, medico, dentista, plano saude, exames
- compras: amazon, shopee, magalu, roupas, eletronicos
- streaming: netflix, spotify, hbo, disney, primevideo
- lazer: cinema, viagem, restaurante, bar, academia, show
- salario: salario, holerite, decimo, bonus, freela, PJ
- transferencia: pix, ted, doc, boleto
- investimento: acao, fii, cdb, tesouro, Bitcoin, ETH
- financeiro: cartao, anuidade, juros, multa
- educacao: escola, faculdade, curso, mensalidade
- delivery: ifood, uber eats, rappi
- default: outros

## Normalizadores (mapeamento de colunas)

Cada normalizador agora inclui o campo `conta` (padrão da instituição).
Pode ser sobrescrito com a coluna `conta` no CSV.

### C6 Bank
- `conta`: 'C6 Bank'
- `valor` → number, negativo=gasto, positivo=entrada
- `descricao` → texto
- `data` → DD/MM/YYYY → YYYY-MM-DD
- Moeda: BRL

### Mercado Pago
- `valor` | `valor total` → number
- `descricao` | `titulo` | `conceito` → texto
- `data` | `data de criacao` → vários formatos
- Moeda: BRL

### Binance
- `valor` | `quantidade` | `amount` → number
- `tipo` | `operacao` | `type` → detecta gasto/investimento
- `descricao` | `par` | `pair` → texto
- Moeda: detecta BTC, ETH, USDT, BRL

### Rico (investimentos)
- `valor` | `valor liquido` | `valor bruto` → number
- `tipo` | `operacao` | `natureza` → detecta D/C, compra
- `descricao` | `produto` → texto
- Moeda: BRL

### Nomad (câmbio)
- `valor` | `amount` | `valor (usd)` → number
- `descricao` | `description` | `detalhes` → texto
- Moeda: detecta USD/BRL

(A categorização foi movida para a seção do Categorizador acima)

## Como Rodar

```bash
# Instalar dependencias
npm install

# Iniciar servidor
npm start
# ou: node backend/server.js

# Acessar
http://localhost:3000
```

## Mobile (Termux)

```bash
pkg install nodejs git
git clone <repo>
cd cash
npm install
node backend/server.js
# Acessar http://localhost:3000 no browser do celular
```

## Sincronização entre Dispositivos

### PC -> GitHub -> Celular
```bash
# No PC (após alterações)
git add .
git commit -m "atualizacao"
git push

# No celular (Termux)
cd cash
git pull
node backend/server.js
```

### Celular -> GitHub -> PC
```bash
# No celular após alteracoes
cd cash
git add .
git commit -m "atualizacao"
git push

# No PC
git pull
```

## Deploy (Netlify)

Frontend: https://finance-ai-799.netlify.app

### Deploy Automático (GitHub Actions)
- Push na branch `main` faz deploy automático no Netlify
- Workflow em `.github/workflows/deploy-netlify.yml`
- Secrets necessários no GitHub:
  - `NETLIFY_AUTH_TOKEN`: Token de acesso pessoal
  - `NETLIFY_SITE_ID`: ID do site no Netlify

### Deploy Manual
```bash
npx netlify-cli deploy --dir=frontend --prod
```

### Como funciona
- Frontend é estático (HTML/CSS/JS) servido pelo Netlify
- Quando acessado do Netlify, o frontend tenta conectar em `localhost:3000`
- Backend precisa estar rodando localmente para funcionalidade completa
- Ideal: frontend no Netlify + backend em Railway/Render

### GitHub
Repositório: https://github.com/cleiton-negreiros/finance-ai

### Docker
```bash
docker-compose up -d
docker build -t finance-ai .
docker run -p 3000:3000 finance-ai
```

## Extensões Futuras

- Dashboard com gráficos (Chart.js)
- Exportação PDF/Excel
- Múltiplos usuários
- Tags personalizadas
- Regras de categoria customizáveis
- Integração Grafana
- API REST completa
- App mobile nativo
