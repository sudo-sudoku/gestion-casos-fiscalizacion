# DIAN Leticia v36 - Guía de Despliegue en Render

## 🚀 Configuración para Render

Esta versión está optimizada específicamente para funcionar en Render.com con Node.js 18.

### ⚙️ Configuración del Servicio

1. **Runtime**: Node.js 18.x
2. **Build Command**: `./render-build.sh`
3. **Start Command**: `npm start`
4. **Health Check Path**: `/api/health`

### 🔧 Variables de Entorno

Las siguientes variables de entorno se configuran automáticamente:

```
NODE_VERSION=18
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=2048
```

### 📦 Scripts de Despliegue

- `render-build.sh`: Script de build específico para Render
- `install.sh`: Script de instalación alternativo
- `render.yaml`: Configuración de servicio para Render

### 🛠️ Solución de Problemas

Si encuentras errores de compilación con `better-sqlite3`:

1. Asegúrate que Node.js 18 esté seleccionado
2. El build script incluye `--build-from-source` para compilar desde código fuente
3. Se maneja automáticamente la compatibilidad con Node.js 18

### 🏥 Health Check

El sistema incluye un endpoint de health check en `/api/health` que responde:
```json
{
  "status": "OK",
  "timestamp": "2025-10-21T19:55:00.000Z",
  "version": "1.0.0"
}
```

### 📁 Estructura de Archivos

```
version_36/
├── server.js              # Servidor principal
├── package.json           # Dependencias con Node.js 18
├── render.yaml           # Configuración Render
├── render-build.sh       # Script de build
├── install.sh            # Script de instalación
├── .nvmrc               # Versión Node.js 18
├── database/            # Scripts de base de datos
└── public/              # Frontend
```

### 🔄 Flujo de Despliegue

1. Render clona el repositorio
2. Ejecuta `render-build.sh`
3. Instala dependencias con Node.js 18
4. Inicializa la base de datos
5. Inicia el servidor con `npm start`

### ✅ Verificación

Una vez desplegado, verifica:
- [ ] El servicio responde en la URL de Render
- [ ] El endpoint `/api/health` devuelve 200 OK
- [ ] El dashboard es accesible
- [ ] Los usuarios pueden iniciar sesión

## 🆘 Soporte

Si tienes problemas durante el despliegue:
1. Revisa los logs de build en Render
2. Verifica que Node.js 18 esté seleccionado
3. Confirma que todas las variables de entorno están configuradas