# YaVoy Mobile App - Start Script (PowerShell)

Write-Host "🚀 Iniciando YaVoy Mobile App..." -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
  Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
  npm install
  Write-Host ""
}

Write-Host "✅ Listo! Selecciona una opción:" -ForegroundColor Green
Write-Host ""
Write-Host "1️⃣  Abrir Expo DevTools (escanea QR con Expo Go)" -ForegroundColor Cyan
Write-Host "2️⃣  Ejecutar en Android" -ForegroundColor Cyan
Write-Host "3️⃣  Ejecutar en iOS (solo macOS)" -ForegroundColor Cyan
Write-Host ""

$option = Read-Host "Opción (1/2/3)"

switch ($option) {
  "1" {
    Write-Host "📱 Abriendo Expo DevTools..." -ForegroundColor Yellow
    npx expo start
  }
  "2" {
    Write-Host "🤖 Ejecutando en Android..." -ForegroundColor Yellow
    npx expo start --android
  }
  "3" {
    Write-Host "🍎 Ejecutando en iOS..." -ForegroundColor Yellow
    npx expo start --ios
  }
  default {
    Write-Host "Opción inválida. Ejecutando DevTools..." -ForegroundColor Red
    npx expo start
  }
}
