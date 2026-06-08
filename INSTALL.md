# Manual de Instalação - Finance AI

## Requisitos Mínimos

- Node.js 18+ (recomendado 20+)
- NPM (vem com Node.js)
- Git (opcional, para sincronização)
- 50MB de espaço em disco
- Qualquer sistema operacional (Windows, Linux, Mac, Android/Termux)

---

## Instalação Rápida

### Windows (PowerShell)

```powershell
# 1. Clone ou baixe o projeto
git clone <seu-repositorio> cash
cd cash

# 2. Execute o setup
.\setup.ps1

# 3. Inicie o servidor
npm start

# 4. Abra no navegador
http://localhost:3000
```

### Linux / Mac / Termux

```bash
# 1. Clone ou baixe o projeto
git clone <seu-repositorio> cash
cd cash

# 2. Execute o setup
chmod +x setup.sh
./setup.sh

# 3. Inicie o servidor
npm start

# 4. Abra no navegador
http://localhost:3000
```

---

## Instalação Manual Passo a Passo

### 1. Instalar Node.js

**Windows:** https://nodejs.org (baixar LTS)
**Linux:** `sudo apt install nodejs npm`
**Mac:** `brew install node`
**Termux:** `pkg install nodejs`

Verificar instalação:
```bash
node --version   # Deve mostrar v18.x ou superior
npm --version    # Deve mostrar 9.x ou superior
```

### 2. Baixar o Projeto

```bash
# Via Git
git clone <url-do-repositorio> finance-ai
cd finance-ai

# Ou manual: baixar o ZIP e extrair
```

### 3. Instalar Dependências

```bash
npm install
```

Isso instala:
- express (servidor web)
- better-sqlite3 (banco de dados)
- multer (upload de arquivos)

### 4. Iniciar o Servidor

```bash
npm start
# ou
node backend/server.js
```

### 5. Acessar

Abra o navegador em: **http://localhost:3000**

---

## Instalação no Celular (Termux - Android)

### Passo 1: Instalar Termux

Baixe o Termux da F-Droid (recomendado) ou Google Play.

### Passo 2: Instalar pacotes

```bash
pkg update && pkg upgrade -y
pkg install nodejs git -y
```

### Passo 3: Baixar o projeto

```bash
git clone <url-do-repositorio> cash
cd cash
npm install
```

### Passo 4: Rodar

```bash
node backend/server.js
```

### Passo 5: Acessar

No navegador do celular: **http://localhost:3000**

Para acessar de outro dispositivo na mesma rede:
1. Descubra o IP do celular: `ifconfig` ou `ip addr`
2. Acesse: `http://<IP-DO-CELULAR>:3000`

---

## Sincronização entre Dispositivos

### Configurar GitHub (primeira vez)

```bash
git remote add origin <url-do-seu-repositorio>
```

### Sincronizar do PC para o Celular

No PC (após alterações):
```bash
.\sync.ps1 "atualizou normalizador"   # Windows
# ou
./sync.sh "atualizou normalizador"    # Linux
```

No celular (Termux):
```bash
cd cash
git pull
node backend/server.js
```

### Sincronizar do Celular para o PC

No celular:
```bash
cd cash
./sync.sh "ajustei dados"             # Termux
```

No PC:
```bash
git pull
npm start
```

---

## Uso Diário

### 1. Fazer Upload de CSV

1. Acesse http://localhost:3000
2. Selecione a fonte (C6, Mercado Pago, etc)
3. Escolha o arquivo CSV
4. Clique em "Upload"
5. Veja o resultado na tabela

### 2. Ver Resumo Financeiro

O resumo (entradas, gastos, saldo) aparece automaticamente na página inicial.

### 3. Atualizar Lista

Clique em "Atualizar" para recarregar as transações.

---

## Formato dos CSVs

### C6 Bank
```csv
data,descricao,valor,categoria
01/01/2026,Salario mensal,5000.00,
05/01/2026,Uber viagem,-25.50,
```

### Mercado Pago
```csv
data,descricao,valor,titulo
02/01/2026,Vendas online,150.00,Produto A
```

### Binance
```csv
data,par,tipo,quantidade,moeda
01/01/2026,BTCBRLL,compra,0.001,BTC
```

### Rico
```csv
data,produto,operacao,valor,valor liquido
01/01/2026,IMAB11,compra,1000.00,1000.00
```

### Nomad
```csv
data,descricao,amount,currency
01/01/2026,Transferencia,500.00,USD
```

---

## Solução de Problemas

### Erro: "Cannot find module 'better-sqlite3'"
```bash
npm install
```

### Erro: "EADDRINUSE :::3000"
Porta ocupada. Mude no server.js ou mate o processo:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### Banco corrompido
```bash
rm database/finance.db
# O schema será recriado automaticamente
```

### Upload não funciona
- Verifique se o CSV é válido
- Verifique se a fonte selecionada corresponde ao formato do CSV
- Veja o console do servidor para erros detalhados

---

## Deploy (Netlify + Backend)

### Frontend no Netlify
1. Faça fork do repositório no GitHub
2. Conecte o Netlify ao repositório
3. Configuração automática (netlify.toml já incluso)

### Backend (opções gratuitas)
- **Railway:** Conecte o GitHub, deploy automático
- **Render:** Serviço web Node.js
- **Fly.io:** `fly launch`

---

## Docker

```bash
docker-compose up -d
# Acessar http://localhost:3000
```

---

## Estrutura Completa

```
/cash
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── importer.js
│   ├── filters.js
│   ├── normalizers/
│   │   ├── c6.js
│   │   ├── mercadopago.js
│   │   ├── binance.js
│   │   ├── rico.js
│   │   └── nomad.js
│   └── uploads/
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── style.css
├── database/
│   ├── schema.sql
│   └── finance.db
├── samples/
├── CEREBRO.md
├── AI_README.md
├── README.md
├── INSTALL.md
├── package.json
├── .gitignore
├── netlify.toml
├── setup.sh / setup.ps1
├── sync.sh / sync.ps1
└── docker-compose.yml
```

---

## Comandos Úteis

```bash
npm start          # Iniciar servidor
npm run dev        # Iniciar com nodemon (se instalado)
.\sync.ps1 "msg"   # Sincronizar Windows
./sync.sh "msg"    # Sincronizar Linux/Termux
.\setup.ps1        # Setup Windows
./setup.sh         # Setup Linux/Termux
```

---

## Licença

MIT - Use, modifique e distribua livremente.
