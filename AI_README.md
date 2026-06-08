# AI README - Para outros modelos de IA

Este documento contém tudo que uma IA precisa saber para entender, modificar ou recriar este projeto.

## Resumo para a IA

Projeto: **Finance AI** - Sistema de consolidação financeira local
Linguagem: JavaScript (Node.js ES Modules)
Banco: SQLite (better-sqlite3)
Web: Express + HTML/CSS/JS puro
Upload: Multer

## Arquivos do Projeto (mapeamento completo)

```
CEREBRO.md              - Inteligência completa do projeto (leia primeiro)
AI_README.md            - Este arquivo (portabilidade entre IAs)
README.md               - Documentação do usuário
INSTALL.md              - Manual de instalação detalhado
package.json            - Dependências e scripts
  dependencias: express, better-sqlite3, multer
  script start: node backend/server.js

backend/
  server.js             - Servidor Express (porta 3000)
                          Rotas: POST /upload, GET /transacoes, GET /resumo
                          GET /contas, GET /dashboard
                          Serve frontend/ como estático
                          Multer salva em backend/uploads/
                          
  db.js                 - initDB(), getDB(), closeDB()
                          Cria banco em database/finance.db
                          Lê schema de database/schema.sql
                          seedContas() - cria 10 contas padrão
                          Usa WAL mode + foreign_keys ON
                          
  importer.js           - importCSV(filePath, fonte)
                          Lê CSV com readline stream
                          Parseia colunas (suporta aspas)
                          Chama normalizador específico
                          Aplica categorização (categorizer.js)
                          Gera hash MD5 (data+valor+descricao+fonte)
                          INSERT OR IGNORE em batch transaction
                          
  categorizer.js        - categorizar(descricao) -> string
                          13 grupos de regex (~100 padrões)
                          Categorias: alimentacao, moradia, transporte, saude,
                          compras, streaming, lazer, salario, transferencia,
                          investimento, financeiro, educacao, delivery, outros
                          
  engine/
    consolidator.js     - consolidar()
                          Agrupa por conta, calcula saldo, entradas, saidas
                          Retorna: { saldo_total, total_entrada, total_saida,
                          total_investido, saldo_por_conta[] }
                          
    metrics.js          - calcularMetricas()
                          Categoriza gastos em essenciais/extras
                          Calcula percentuais, fluxo mensal
                          Retorna: { custo_vida, despesas_extras, investido,
                          percentual_por_categoria[], fluxo_mensal[] }
                          
  normalizers/
    c6.js               - conta: 'C6 Bank', colunas: valor, descricao, data
    mercadopago.js      - conta: 'Mercado Pago', colunas: valor/valor total, descricao/titulo/conceito, data
    binance.js          - conta: 'Binance', colunas: valor/quantidade/amount, tipo/operacao/type, par/pair
    rico.js             - conta: 'Rico', colunas: valor/valor liquido, tipo/operacao/natureza, produto
    nomad.js            - conta: 'Nomad', colunas: valor/amount, descricao/description, moeda/currency

frontend/
  index.html            - Upload CSV + navegação
  dashboard.html        - Dashboard completo com Chart.js
  app.js                - initUpload() + initDashboard()
                          upload(), loadTransacoes(), loadResumo()
                          loadDashboard(), renderResumo(), renderContas()
                          renderCategorias()
  charts.js             - renderCharts() via Chart.js
                          Pizza categorias, barra fluxo mensal, metas
  style.css             - Tema dark, nav-bar, dashboard grid, metas, responsivo

database/
  schema.sql            - CREATE TABLE contas (nome PK, tipo, saldo_atual)
                          CREATE TABLE transacoes (conta, hash UNIQUE para dedup)
  finance.db            - Gerado automaticamente na primeira execução

samples/                - CSVs de exemplo para teste
  c6.csv
  mercadopago.csv
  binance.csv

setup.sh                - Setup automático Linux/Mac/Termux
setup.ps1               - Setup automático Windows
sync.sh                 - Sincronizar via git (Linux/Termux)
sync.ps1                - Sincronizar via git (Windows)
netlify.toml            - Config deploy Netlify
```

## Fluxo de Dados (para IA entender)

```
Usuario -> Select Fonte + CSV -> Frontend fetch POST /upload ->
  server.js recebe multipart ->
    Multer salva arquivo em backend/uploads/ ->
      importer.importCSV(path, fonte) ->
        Stream CSV linha a linha (readline) ->
          normalizers/[fonte].js(normaliza linha) ->
            filters.js(categoriza) ->
              Gera hash MD5 ->
                INSERT OR IGNORE batch SQLite ->
                  Remove arquivo temporário ->
                    Resposta JSON
```

## Como este projeto foi criado (para recriação)

```bash
mkdir cash && cd cash
npm init -y
# package.json "type": "module"
npm install express better-sqlite3 multer
# Criar estrutura de pastas
# Criar database/schema.sql
# Criar backend/db.js
# Criar backend/normalizers/*.js
# Criar backend/filters.js
# Criar backend/importer.js
# Criar backend/server.js
# Criar frontend/index.html, app.js, style.css
# Criar samples/
```

## Padrões de Código

- ES Modules (import/export)
- Async/await para async
- SQLite síncrono (better-sqlite3)
- Transações batch para performance
- Hash MD5 para deduplicação
- Normalizadores seguem mesma assinatura: (row, fonte) -> { fonte, tipo, valor, moeda, descricao, categoria, data }
- Sem dependências externas (exceto express, better-sqlite3, multer)
- Sem API keys ou serviços pagos

## Extensíveis (para IA saber)

- Adicionar nova fonte: criar normalizers/novo.js, importar em importer.js, adicionar no select do frontend
- Adicionar regra de categoria: adicionar em filters.js { pattern: /texto/i, categoria: 'nome' }
- Adicionar tipo: modificar lógica nos normalizadores
- Mudar banco: só trocar db.js

## Portabilidade

Para usar em outro PC/IA:
1. Copiar a pasta inteira
2. `npm install`
3. `node backend/server.js`
4. Acessar http://localhost:3000

Para deploy:
- Frontend: Netlify (https://finance-ai-799.netlify.app)
- CI/CD: GitHub Actions (push na main deploya automaticamente)
- Backend: Railway, Render, Fly.io (Node) ou local
- Docker: `docker-compose up -d`
- Git: https://github.com/cleiton-negreiros/finance-ai
