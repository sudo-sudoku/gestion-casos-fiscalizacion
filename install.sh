#!/bin/bash

# Script de instalación para Render
# Este script asegura la compatibilidad con Node.js 18

set -e

echo "🔧 Configurando entorno para DIAN Leticia v36..."

# Verificar Node.js
echo "📋 Versión de Node.js:"
node --version

# Establecer variables de entorno
export NODE_OPTIONS=--max-old-space-size=2048

# Instalar dependencias con opciones específicas
echo "📦 Instalando dependencias..."
npm install --build-from-source=false --prefer-offline --no-audit

# Verificar instalación
echo "✅ Verificando better-sqlite3..."
node -e "console.log('better-sqlite3 versión:', require('better-sqlite3').VERSION)"

echo "🎉 Instalación completada exitosamente"