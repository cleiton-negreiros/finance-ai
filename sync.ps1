param(
    [string]$mensagem = "atualizacao automática"
)

Write-Host "=== Sincronizando Finance AI ===" -ForegroundColor Cyan

# Verificar se há alterações
$status = git status --porcelain
if (-not $status) {
    Write-Host "Nenhuma alteração para sincronizar." -ForegroundColor Yellow
    exit 0
}

# Mostrar o que será commitado
Write-Host "Alterações detectadas:" -ForegroundColor Yellow
git status --short

# Commit e push
git add .
git commit -m $mensagem
if ($?) {
    git push
    Write-Host "Sincronizado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Erro ao commitar." -ForegroundColor Red
}
