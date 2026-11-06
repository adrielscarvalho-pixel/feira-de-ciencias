# Grava as falas do mascote (lidas de falas.json, gerado pelo build.js) com a voz Maria, offline
Add-Type -AssemblyName System.Speech
$dir = Join-Path $PSScriptRoot 'assets'
$falas = Get-Content (Join-Path $PSScriptRoot 'falas.json') -Raw -Encoding UTF8 | ConvertFrom-Json

foreach ($f in @($falas)) {
  $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
  try { $s.SelectVoice('Microsoft Maria Desktop') } catch { }
  $p = New-Object System.Speech.Synthesis.PromptBuilder
  $p.AppendBreak([TimeSpan]::FromMilliseconds(300))
  $frases = @($f.frases)
  for ($k = 0; $k -lt $frases.Count; $k++) {
    $p.AppendText($frases[$k])
    if ($k -lt $frases.Count - 1) { $p.AppendBreak([TimeSpan]::FromMilliseconds($(if ($frases[$k] -match '(\.\.\.|…)$') { 1100 } else { 600 }))) }
  }
  $s.SetOutputToWaveFile((Join-Path $dir $f.arquivo))
  $s.Speak($p)
  $s.Dispose()
  "gravado: $($f.arquivo)"
}
