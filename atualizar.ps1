# Atualiza TUDO depois de mudar o site:
#   1. gera de novo o PowerPoint (lendo os textos do index.html)
#   2. envia para o GitHub (GitHub Pages)
#   3. publica no Firebase (idioma-visual.web.app)
# Uso:  powershell -ExecutionPolicy Bypass -File .\atualizar.ps1 "o que mudou"
param([string]$mensagem = "Atualiza o site e os slides")
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$slides = Join-Path $PSScriptRoot 'slides'
$pptx = Join-Path $PSScriptRoot 'Feira de Ciências - Apresentação.pptx'

Write-Host "== Slides ==" -ForegroundColor Cyan
Push-Location $slides
if (-not (Test-Path 'node_modules')) { npm install --no-audit --no-fund | Out-Null }
if (-not (Test-Path 'assets\bg_capa.jpg')) { node gen_assets.js }
node build.js
if ($LASTEXITCODE -ne 0) { throw "Falhou ao montar os slides" }
& .\falas.ps1
if (Test-Path 'final.pptx') { Remove-Item 'final.pptx' }
& .\animar.ps1 -Saida (Join-Path $slides 'final.pptx')
python ajusta.py final.pptx
Copy-Item final.pptx $pptx -Force
Pop-Location

Write-Host "== GitHub ==" -ForegroundColor Cyan
git add -A
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) { git commit -q -m $mensagem -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" }
git push -q
if ($LASTEXITCODE -ne 0) { throw "Falhou ao enviar para o GitHub" }

Write-Host "== Firebase ==" -ForegroundColor Cyan
firebase deploy --only hosting --non-interactive
if ($LASTEXITCODE -ne 0) { throw "Falhou ao publicar no Firebase" }

Write-Host ""
Write-Host "Pronto! Tudo atualizado:" -ForegroundColor Green
Write-Host "  Site:   https://idioma-visual.web.app"
Write-Host "  Site:   https://adrielscarvalho-pixel.github.io/feira-de-ciencias/"
Write-Host "  Slides: $pptx"
