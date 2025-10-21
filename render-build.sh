#!/bin/bash

# Script de build específico para Render
set -e

echo "🚀 Iniciando build para DIAN Leticia v36..."

# Variables de entorno para Render
export NODE_ENV=production
export NODE_OPTIONS=--max-old-space-size=2048

# Limpiar caché de npm
echo "🧹 Limpiando caché..."
npm cache clean --force

# Instalar dependencias
echo "📦 Instalando dependencias con build-from-source..."
npm install --build-from-source

# Crear directorio database si no existe
mkdir -p database

# Inicializar base de datos
echo "🗄️ Inicializando base de datos..."
npm run init-db

echo "✅ Build completado exitosamente"