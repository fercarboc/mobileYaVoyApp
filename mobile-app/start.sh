#!/bin/bash

# YaVoy Mobile App - Start Script

echo "🚀 Iniciando YaVoy Mobile App..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependencias..."
  npm install
  echo ""
fi

echo "✅ Listo! Selecciona una opción:"
echo ""
echo "1️⃣  Abrir Expo DevTools (escanea QR con Expo Go)"
echo "2️⃣  Ejecutar en Android"
echo "3️⃣  Ejecutar en iOS (solo macOS)"
echo ""
read -p "Opción (1/2/3): " option

case $option in
  1)
    echo "📱 Abriendo Expo DevTools..."
    npx expo start
    ;;
  2)
    echo "🤖 Ejecutando en Android..."
    npx expo start --android
    ;;
  3)
    echo "🍎 Ejecutando en iOS..."
    npx expo start --ios
    ;;
  *)
    echo "Opción inválida. Ejecutando DevTools..."
    npx expo start
    ;;
esac
