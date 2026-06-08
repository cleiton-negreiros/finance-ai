Write-Host "=== Setup Finance AI ===" -ForegroundColor Cyan

# Verificar Node
try {
    $nodeVersion = node --version
    Write-Host "Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js nao encontrado!" -ForegroundColor Red
    Write-Host "Baixe e instale em: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Instalar dependencias
Write-Host "Instalando dependencias..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "=== Pronto! ===" -ForegroundColor Green
Write-Host "Para rodar: npm start" -ForegroundColor Cyan
Write-Host "Acessar: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para sincronizar: .\sync.ps1 'mensagem'" -ForegroundColor Cyan
