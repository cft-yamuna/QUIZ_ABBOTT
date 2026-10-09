param([string]$Url = 'http://localhost:5173')

$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

if (-not $chrome) {
  throw 'Google Chrome was not found.'
}

$profile = Join-Path $env:LOCALAPPDATA 'QuizAbbottKiosk'
& $chrome "--user-data-dir=$profile" --kiosk --no-first-run --disable-pinch --overscroll-history-navigation=0 $Url
