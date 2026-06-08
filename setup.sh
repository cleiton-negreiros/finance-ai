#!/bin/bash
# Setup rapido do Finance AI (Linux/Mac/Termux)

echo "=== Setup Finance AI ==="

# Verificar Node
if ! command -v node &> /dev/null; then
    echo "Instalando Node.js..."
    if command -v pkg &> /dev/null; then
        pkg install nodejs -y
    elif command -v apt &> /dev/null; then
        sudo apt install nodejs npm -y
    elif command -v brew &> /dev/null; then
        brew install node
    else
        echo "Instale o Node.js manualmente: https://nodejs.org"
        exit 1
    fi
fi

# Instalar dependencias
echo "Instalando dependencias..."
npm install

# Verificar git
if ! command -v git &> /dev/null; then
    echo "Instale o git para sincronizacao:"
    echo "  pkg install git (Termux)"
    echo "  sudo apt install git (Linux)"
fi

echo ""
echo "=== Pronto! ==="
echo "Para rodar: node backend/server.js"
echo "Acessar: http://localhost:3000"
echo ""
echo "Para sincronizar: ./sync.sh 'mensagem'"
