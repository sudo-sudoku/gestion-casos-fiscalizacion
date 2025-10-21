# Sistema de Gestión de Casos de Fiscalización - DIAN Leticia

Sistema completo para la gestión de casos de fiscalización para la Dirección de Impuestos y Aduanas Nacionales (DIAN) - Dirección Seccional de Leticia.

## 📋 Descripción

Sistema web completo para la gestión de casos de fiscalización tributaria, incluyendo:

- **262 casos reales** cargados desde Excel
- **Gestión completa de casos** (CRUD)
- **Sistema de autenticación** con roles (Admin, Supervisor, Auditor)
- **Reportes ejecutivos** (Inventario, Por Programa, Desempeño)
- **Dashboard** con estadísticas en tiempo real
- **Interfaz responsive** adaptable a dispositivos móviles

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 18 o superior
- npm (incluido con Node.js)

### Instalación Local

```bash
# 1. Instalar dependencias
npm install

# 2. Inicializar base de datos
npm run init-db

# 3. Iniciar servidor
npm start

# 4. Abrir navegador
# http://localhost:3000
```

### Credenciales por Defecto

- **Admin**: admin / admin123
- **Supervisor**: supervisor / supervisor123
- **Auditor**: maria.murillo / auditor123

⚠️ **IMPORTANTE**: Cambiar estas contraseñas en producción

## 📦 Despliegue en Render

### Paso 1: Subir a GitHub

```bash
# Inicializar repositorio Git
git init

# Agregar archivos
git add .

# Hacer commit
git commit -m "Sistema DIAN Leticia v3.6 - Completo"

# Conectar con GitHub (reemplaza con tu URL)
git remote add origin https://github.com/tu-usuario/tu-repo.git

# Subir a GitHub
git push -u origin main
```

### Paso 2: Configurar en Render

1. **Ir a [Render.com](https://render.com)**
2. **Crear cuenta** o iniciar sesión
3. **Conectar GitHub** (autorizar acceso a tu repositorio)
4. **Crear Web Service**:
   - Click en "New +" → "Web Service"
   - Selecciona tu repositorio
   - Configuración:
     - **Name**: dian-leticia-fiscalizacion
     - **Environment**: Node
     - **Build Command**: `npm install && npm run init-db`
     - **Start Command**: `npm start`
     - **Plan**: Free (o el que prefieras)

5. **Variables de Entorno** (en la sección Environment):
   ```
   NODE_ENV=production
   JWT_SECRET=tu-clave-super-secreta-cambiar-ahora
   DATABASE_PATH=./database/database.db
   PORT=3000
   ```

6. **Desplegar** (Click en "Create Web Service")

### Paso 3: Verificar Despliegue

Una vez completado el despliegue (2-5 minutos):
- Render te dará una URL pública (ej: `https://tu-app.onrender.com`)
- Accede a esa URL
- Inicia sesión con las credenciales por defecto
- ¡Listo! El sistema está funcionando

## 🔧 Estructura del Proyecto

```
version_36/
├── package.json          # Dependencias y scripts
├── .gitignore           # Archivos ignorados por Git
├── .env.example         # Plantilla de variables de entorno
├── server.js            # Servidor Express principal
├── database/
│   ├── init-database.js # Script de inicialización de BD
│   └── database.db      # Base de datos SQLite (generada)
└── public/              # Frontend
    ├── index.html       # Interfaz HTML
    ├── styles.css       # Estilos CSS
    └── app.js           # Lógica JavaScript
```

## 🔐 Seguridad

### Cambiar JWT_SECRET

En producción, DEBES cambiar el JWT_SECRET:

1. **Para desarrollo local**: Edita el archivo `.env`
2. **Para Render**: Cambia la variable de entorno en el dashboard de Render

### Cambiar Contraseñas

Las contraseñas por defecto son:
- admin / admin123
- supervisor / supervisor123
- maria.murillo / auditor123

**DEBES cambiarlas** en producción.

## 📊 Características del Sistema

### 1. Dashboard

- **Total de Casos**: Contador de todos los casos
- **Casos Activos**: Casos en proceso
- **Casos Cerrados**: Casos finalizados
- **Gestión Perceptiva**: Casos con gestión perceptiva
- **Total Auditores**: Número de auditores
- **Monto Total**: Suma de todos los actos administrativos

### 2. Gestión de Casos

- **Crear** nuevos casos (Admin/Supervisor)
- **Editar** casos existentes
- **Eliminar** casos (solo Admin)
- **Buscar** por ID, NIT o Nombre
- **Filtrar** por Programa, Impuesto, Auditor, Estado
- **Ver detalles** de cada caso

### 3. Reportes

#### Inventario por Programa
- Total de casos por programa
- Gestión perceptiva por programa
- Casos activos y cerrados

#### Detalle por Programa
- Lista completa de casos de un programa
- Auditor asignado
- Estado actual
- Monto total de actos administrativos

#### Desempeño de Auditores
- Total de casos por auditor
- Casos activos y cerrados
- Gestión perceptiva
- Monto total gestionado

### 4. Usuarios (Solo Admin)

- Crear nuevos usuarios
- Asignar roles (Admin, Supervisor, Auditor)
- Ver lista de usuarios

## 🎯 Roles y Permisos

### Administrador
- ✅ Acceso completo al sistema
- ✅ Crear, editar y eliminar casos
- ✅ Gestionar usuarios
- ✅ Ver todos los reportes
- ✅ Acceso a todas las funciones

### Supervisor
- ✅ Crear y editar casos
- ✅ Ver todos los casos
- ✅ Ver todos los reportes
- ❌ No puede eliminar casos
- ❌ No puede gestionar usuarios

### Auditor
- ✅ Ver y editar solo sus casos asignados
- ✅ Ver reportes generales
- ❌ No puede crear casos
- ❌ No puede eliminar casos
- ❌ No puede ver casos de otros auditores

## 📊 Datos Cargados

### Casos Reales (262 casos del Excel)

El sistema incluye **262 casos reales** importados del archivo Excel "NUEVAS CARGAS DE SERVICIO INTEGRA", incluyendo:

- **NIT** de contribuyentes
- **Nombres** de contribuyentes
- **Programas** de fiscalización (BF, DI, DT, I1, HP, N1, OE, OF, OY, FT)
- **Tipos de impuesto** (Renta, RteFte, Facturación)
- **Años** de apertura y gravables
- **Auditores** asignados
- **Estados** de los casos
- **Última acción** realizada

### Programas de Fiscalización

- **BF**: Beneficios Fiscales
- **DI**: Declaración Inconsistente
- **DT**: Declaración Tardía
- **DU**: Declaración Única
- **FT**: Facturación
- **HP**: Hallazgos Previos
- **I1**: Investigación Nivel 1
- **IH**: Investigación Hallazgos
- **N1**: No Declarante
- **OE**: Omisión de Ingresos
- **OF**: Oficioso
- **OY**: Otros

### Tipos de Impuesto

- **Renta**: Impuesto sobre la Renta
- **RteFte**: Retención en la Fuente
- **Facturación**: Facturación Electrónica

## 🔧 Configuración Avanzada

### Variables de Entorno (.env)

```env
# Puerto del servidor
PORT=3000

# Modo de ejecución
NODE_ENV=production

# Clave secreta JWT (¡CAMBIAR EN PRODUCCIÓN!)
JWT_SECRET=clave-super-secreta-cambiar-ahora

# Ruta de la base de datos
DATABASE_PATH=./database/database.db
```

### Scripts Disponibles

```bash
# Iniciar servidor de producción
npm start

# Iniciar servidor de desarrollo
npm run dev

# Inicializar/reiniciar base de datos
npm run init-db
```

## 🐛 Solución de Problemas

### El servidor no inicia

**Problema**: Error al iniciar el servidor

**Solución**:
```bash
# 1. Verificar Node.js instalado
node --version  # Debe ser 18 o superior

# 2. Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# 3. Verificar puerto disponible
# Cambiar PORT en .env si 3000 está ocupado
```

### Error de base de datos

**Problema**: "Database not found" o errores de SQLite

**Solución**:
```bash
# Eliminar base de datos existente y reinicializar
rm -rf database/database.db
npm run init-db
```

### No puedo iniciar sesión

**Problema**: Credenciales no funcionan

**Solución**:
- Verificar que la base de datos esté inicializada
- Usar credenciales por defecto: admin / admin123
- Verificar que no haya errores en la consola del navegador
- Revisar que el servidor esté corriendo

### Errores en Render

**Problema**: El despliegue falla en Render

**Soluciones**:
1. **Verificar el Build Command**: Debe ser `npm install && npm run init-db`
2. **Verificar el Start Command**: Debe ser `npm start`
3. **Verificar variables de entorno**: Deben estar configuradas
4. **Revisar logs**: En el dashboard de Render, revisar los logs para ver el error específico

### Problemas de Rendimiento

**Problema**: El sistema es lento o no responde

**Solución**:
- En el plan gratuito de Render, el servicio se "duerme" después de 15 minutos de inactividad
- La primera petición después de dormir toma ~30 segundos
- Para mejor rendimiento, considera un plan de pago

## 📊 Escalabilidad y Rendimiento

### Capacidad del Sistema

- **SQLite**: Adecuado para hasta ~100,000 registros
- **Render Free**: Adecuado para uso de desarrollo/pruebas
- **Concurrencia**: Soporta múltiples usuarios simultáneos

### Para Producción a Gran Escala

Si necesitas manejar más de 100,000 casos o tener alta concurrencia:

1. **Base de Datos**: Migrar a PostgreSQL
2. **Hosting**: Usar plan de pago en Render o AWS/Azure
3. **Caché**: Implementar Redis para sesiones
4. **CDN**: Usar CDN para archivos estáticos

## 📞 Soporte

### Recursos Disponibles

- **Documentación**: Este README
- **Código fuente**: Comentado y documentado
- **Ejemplos**: Datos de prueba incluidos

### Problemas Comunes

1. **¿Cómo agrego más casos?**
   - Usa el botón "Nuevo Caso" (Admin/Supervisor)
   - O carga masiva mediante API

2. **¿Cómo cambio mi contraseña?**
   - Actualmente se hace directamente en la base de datos
   - Funcionalidad de cambio de contraseña en desarrollo

3. **¿Puedo exportar los datos?**
   - Los datos están en SQLite (database.db)
   - Puedes usar herramientas como DB Browser for SQLite

4. **¿Cómo agrego más auditores?**
   - Usa la sección "Usuarios" (solo Admin)
   - Crea nuevo usuario con rol "auditor"

## 📄 Licencia

Este sistema es de uso interno de la DIAN - Dirección Seccional de Letia.

## 🎯 Próximos Pasos

Después de instalar el sistema:

1. ✅ **Cambiar contraseñas** de usuarios por defecto
2. ✅ **Configurar JWT_SECRET** único
3. ✅ **Crear usuarios reales** para tu equipo
4. ✅ **Verificar datos** cargados del Excel
5. ✅ **Capacitar usuarios** en el uso del sistema
6. ✅ **Configurar backups** de la base de datos

## 🎉 ¡Listo para Usar!

El sistema está completamente funcional y listo para usar. Incluye:

- ✅ 262 casos reales del Excel
- ✅ 8 usuarios de prueba
- ✅ Sistema de autenticación completo
- ✅ Reportes ejecutivos
- ✅ Interfaz responsive
- ✅ Listo para GitHub y Render

---

**Desarrollado para DIAN - Dirección Seccional de Leticia**

**Versión 3.6 - Octubre 2025**