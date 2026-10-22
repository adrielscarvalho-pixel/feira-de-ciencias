# Publica o site no GitHub (GitHub Pages) e no Firebase Hosting de uma vez.
# Uso:  .\publicar.ps1 "o que mudou"
param([string]$mensagem = "Atualiza o site")

Set-Location $PSScriptRoot

git add -A
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) { git commit -m $mensagem }
git push
if ($LASTEXITCODE -ne 0) { Write-Error "Falhou ao enviar para o GitHub"; exit 1 }

firebase deploy --only hosting --non-interactive
if ($LASTEXITCODE -ne 0) { Write-Error "Falhou ao publicar no Firebase"; exit 1 }

Write-Host ""
Write-Host "Pronto! Site atualizado em:"
Write-Host "  https://idioma-visual.web.app"
Write-Host "  https://adrielscarvalho-pixel.github.io/feira-de-ciencias/"
