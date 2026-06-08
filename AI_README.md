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
                          Serve frontend/ como estático
                          Multer salva em backend/uploads/
                          
  db.js                 - initDB(), getDB(), closeDB()
                          Cria banco em database/finance.db
                          Lê schema de database/schema.sql
                          Usa WAL mode + foreign_keys ON
                          
  importer.js           - importCSV(filePath, fonte)
                          Lê CSV com readline stream
                          Parseia colunas (suporta aspas)
                          Chama normalizador específico
                          Aplica categorização (filters.js)
                          Gera hash MD5 (data+valor+descricao+fonte)
                          INSERT OR IGNORE em batch transaction
                          
  filters.js            - categorizar(descricao) -> string
                          30+ regras regex mapeando descricao para categoria
                          Fallback: "outros"
                          
  normalizers/
    c6.js               - Colunas: valor, descricao, data
    mercadopago.js      - Colunas: valor/valor total, descricao/titulo/conceito, data/data de criacao
    binance.js          - Colunas: valor/quantidade/amount, tipo/operacao/type, par/pair, moeda/currency
    rico.js             - Colunas: valor/valor liquido/valor bruto, tipo/operacao/natureza, produto
    nomad.js            - Colunas: valor/amount/valor (usd), descricao/description/detalhes, moeda/currency

frontend/
  index.html            - Título "Finance AI", select fonte, input file, botão upload, tabela transações, cards resumo
  app.js                - upload(), loadTransacoes(), loadResumo(), showStatus()
                          Fetch API sem frameworks
  style.css             - Tema dark, cards, tabela responsiva, mobile-friendly

database/
  schema.sql            - CREATE TABLE transacoes com hash UNIQUE para dedup
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
- Frontend: Netlify (estático, pasta frontend/)
- Backend: Railway, Render, Fly.io (Node)
- Local: Docker (ver docker-compose.yml)
