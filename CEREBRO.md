# CEREBRO - Finance AI

## Arquitetura do Projeto

```
/cash
├── backend/
│   ├── server.js          # Servidor Express (porta 3000)
│   ├── db.js              # Conexão SQLite + init
│   ├── importer.js        # Importador de CSV
│   ├── filters.js         # Categorização automática por regex
│   ├── normalizers/       # Normalizadores por fonte
│   │   ├── c6.js
│   │   ├── mercadopago.js
│   │   ├── binance.js
│   │   ├── rico.js
│   │   └── nomad.js
│   └── uploads/           # Pasta temporária de uploads
├── frontend/
│   ├── index.html         # Interface web
│   ├── app.js             # Lógica do frontend (fetch API)
│   └── style.css          # Tema dark
├── database/
│   ├── schema.sql         # Schema SQLite
│   └── finance.db         # Banco de dados (gerado automaticamente)
├── CEREBRO.md             # Este arquivo - inteligência completa
├── README.md              # Documentação do usuário
├── package.json
├── .gitignore
├── netlify.toml
├── setup.sh               # Setup rápido Linux/Mac/Termux
├── setup.ps1              # Setup rápido Windows
├── sync.sh                # Sincronização mobile
└── sync.ps1               # Sincronização Windows
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

## Fluxo de Importação

1. Usuário seleciona fonte e arquivo CSV no frontend
2. Frontend envia via fetch POST /upload
3. Server salva arquivo temporário em /uploads/
4. Server chama importer.js com o caminho do arquivo
5. importer.js lê CSV linha a linha com stream (readline)
6. Para cada linha, chama o normalizador correspondente à fonte
7. Normalizador mapeia colunas, converte tipos, padroniza data
8. filters.js categoriza automaticamente por regex na descrição
9. Gera hash MD5 único (data+valor+descricao+fonte) para evitar duplicatas
10. Insere em batch com transação SQLite (INSERT OR IGNORE)
11. Remove arquivo temporário

## Estrutura do Banco (SQLite)

```sql
transacoes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  fonte       TEXT NOT NULL,
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

## Normalizadores (mapeamento de colunas)

### C6 Bank
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

## Categorização Automática (filters.js)

Regras baseadas em regex na descrição:
- transporte: uber, 99, taxi, gasolina, posto
- alimentacao: ifood, mercado, supermercado
- compras: amazon, shopee, magalu
- streaming: netflix, spotify, hbo, disney, primevideo
- moradia: aluguel
- contas: energia, agua, vivo, tim, claro
- saude: farmacia, droga
- salario: salario
- transferencia: transferencia, pix
- recebimento: payment
- default: outros

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
