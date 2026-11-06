param([string]$Arquivo, [string]$Pasta)
New-Item -ItemType Directory -Force $Pasta | Out-Null
Get-ChildItem $Pasta -Filter *.png | Remove-Item
$jaAberto = [bool](Get-Process POWERPNT -ErrorAction SilentlyContinue)
$app = New-Object -ComObject PowerPoint.Application
$pres = $app.Presentations.Open($Arquivo, -1, 0, 0)
for ($i = 1; $i -le $pres.Slides.Count; $i++) { $pres.Slides.Item($i).Export((Join-Path $Pasta ('s{0:D2}.png' -f $i)), 'PNG', 1600, 900) }
"exportados: $($pres.Slides.Count)"
$pres.Close()
if (-not $jaAberto) { $app.Quit() }
