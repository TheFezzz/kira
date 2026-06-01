# Публикация сайта на GitHub Pages (ветка main)
$ErrorActionPreference = "Stop"
$git = "C:\Program Files\Git\bin\git.exe"
if (-not (Test-Path $git)) { $git = "git" }

Set-Location $PSScriptRoot

# Обнови ?v= в index.html на текущую дату (ГГГГММДДЧЧММ), если менял styles.css / app.js
& $git add -A
$status = & $git status --porcelain
if (-not $status) {
  Write-Host "Нет изменений для отправки." -ForegroundColor Yellow
  exit 0
}

& $git commit -m "Обновление сайта $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
& $git push origin main
Write-Host "Готово. Через 1–2 минуты открой: https://thefezzz.github.io/kira/?nocache=1" -ForegroundColor Green
