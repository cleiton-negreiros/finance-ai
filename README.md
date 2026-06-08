# Finance AI

Sistema de consolidação financeira local com upload de CSV e interface web.

## Funcionalidades

- Upload de CSV de bancos, carteiras e corretoras
- Normalização automática dos dados
- Categorização inteligente por regex
- Armazenamento local em SQLite
- Interface web dark mode
- Resumo financeiro (entradas, gastos, saldo)
- Prevenção de duplicatas
- 100% local sem APIs externas

## Fontes Suportadas

| Fonte | Tipo |
|-------|------|
| C6 Bank | Conta corrente |
| Mercado Pago | Carteira digital |
| Binance | Exchange cripto |
| Rico | Corretora investimentos |
| Nomad | Câmbio internacional |

## Quick Start

```bash
# Instalar
npm install

# Rodar
npm start

# Acessar
http://localhost:3000
```

## Estrutura

```
backend/     Servidor Express + lógica
frontend/    Interface web
database/    Schema + SQLite DB
```

## Mobile (Termux)

```bash
pkg install nodejs
npm install
node backend/server.js
```

## Sincronizar PC e Celular

```bash
# sync.sh (Linux/Termux) ou sync.ps1 (Windows)
./sync.sh "mensagem"
```

## API

- `POST /upload` - Upload CSV
- `GET /transacoes` - Listar transações
- `GET /resumo` - Resumo financeiro

Feito com Node.js, Express, SQLite ❤️
