#!/bin/bash
# Sincronizar Finance AI (Linux/Termux)
# Uso: ./sync.sh "mensagem do commit"

MSG="${1:-atualizacao automatica}"

echo "=== Sincronizando Finance AI ==="

# Verificar alteracoes
if [ -z "$(git status --porcelain)" ]; then
    echo "Nenhuma alteracao para sincronizar."
    exit 0
fi

echo "Alteracoes detectadas:"
git status --short

# Commit e push
git add .
git commit -m "$MSG"
if [ $? -eq 0 ]; then
    git push
    echo "Sincronizado com sucesso!"
else
    echo "Erro ao commitar."
    exit 1
fi
