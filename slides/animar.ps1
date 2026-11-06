# Usa o próprio PowerPoint para colocar transições, animações e as falas (áudio automático)
param([string]$Saida)
$ErrorActionPreference = 'Stop'
$dir = $PSScriptRoot
$plano = Get-Content (Join-Path $dir 'plano.json') -Raw -Encoding UTF8 | ConvertFrom-Json

$EFEITO = @{ fade = 10; zoom = 23; rise = 34; bounce = 26; wipe = 22; float = 30; teeter = 80 }
$TRANS  = @{ fade = 3849; ripple = 3867; vortex = 3863; push = 3855; curtains = 3938; honeycomb = 3898 }
$GATILHO = @{ com = 2; depois = 3 }
$PCT = 0.30   # atraso entre palavras/letras (fica 30% no XML, ajustado depois)

$jaAberto = [bool](Get-Process POWERPNT -ErrorAction SilentlyContinue)
$app = New-Object -ComObject PowerPoint.Application
$pres = $app.Presentations.Open((Join-Path $dir 'base.pptx'), 0, 0, 0)

for ($i = 0; $i -lt $plano.Count; $i++) {
  $p = $plano[$i]
  $sl = $pres.Slides.Item($i + 1)
  $t = $sl.SlideShowTransition
  $t.EntryEffect = $TRANS[$p.transicao]
  $t.Duration = $(if ($p.transicao -eq 'fade') { 0.7 } elseif ($p.transicao -in 'vortex', 'honeycomb', 'curtains') { 1.8 } else { 1.0 })
  $seq = $sl.TimeLine.MainSequence

  # a fala entra primeiro e começa sozinha meio segundo depois do slide aparecer
  if ($p.audio) {
    $m = $sl.Shapes.AddMediaObject2((Join-Path $dir "assets\$($p.audio)"), 0, -1, -120, 20, 40, 40)
    $m.Name = 'voz'
    $m.Left = -200; $m.Top = 40   # fora da área do slide: toca, mas o ícone não aparece
    $em = $seq.AddEffect($m, 83, 0, 2)
    $em.Timing.TriggerDelayTime = 0.5
  }

  foreach ($e in $p.efeitos) {
    $sh = $sl.Shapes.Item($e.nome)
    $texto = ($e.porPalavra -or $e.porLetra)
    $ef = $seq.AddEffect($sh, $EFEITO[$e.efeito], 0, $GATILHO[$e.gatilho])
    if ($texto) {
      $unidades = $sh.TextFrame.TextRange.Text
      if ($e.porPalavra) { $ef = $seq.ConvertToTextUnitEffect($ef, 2); $n = ($unidades -split '\s+' | Where-Object { $_ }).Count }
      else { $ef = $seq.ConvertToTextUnitEffect($ef, 1); $n = ($unidades -replace '\s', '').Length }
      $total = $e.total
      if ($total -eq 'audio') {   # as palavras acompanham a duração da voz gravada
        $b = [IO.File]::ReadAllBytes((Join-Path $dir "assets\$($p.audio)"))
        $total = [Math]::Max(1.5, ($b.Length - 44) / [BitConverter]::ToInt32($b, 28) - 2.0)
      }
      $dur = if ($total) { [double]$total / (1 + $PCT * ($n - 1)) } else { [double]$e.dur }
      $ef.Timing.Duration = [Math]::Max(0.35, [Math]::Min(2.0, $dur))
    } else {
      $ef.Timing.Duration = [double]$e.dur
    }
    $ef.Timing.TriggerType = $GATILHO[$e.gatilho]
    if ($e.atraso) { $ef.Timing.TriggerDelayTime = [double]$e.atraso }
    if ($e.repetir) { $ef.Timing.RepeatCount = [int]$e.repetir }
  }

}

$pres.SaveAs($Saida, 24)
$pres.Close()
if (-not $jaAberto) { $app.Quit() }
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null
"salvo: $Saida"
