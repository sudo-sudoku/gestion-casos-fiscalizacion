# 📘 Guía Completa de Despliegue en GitHub y Render

Esta guía te llevará paso a paso para desplegar el Sistema de Gestión de Casos de Fiscalización DIAN Leticia en GitHub y Render.

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener:

- ✅ Una cuenta en [GitHub](https://github.com) (gratuita)
- ✅ Una cuenta en [Render](https://render.com) (gratuita)
- ✅ Git instalado en tu computadora
- ✅ Los archivos del sistema (carpeta `version_36`)

---

## 🔷 PARTE 1: Subir el Código a GitHub

### Paso 1.1: Crear un Repositorio en GitHub

1. **Ir a GitHub**
   - Abre tu navegador y ve a [https://github.com](https://github.com)
   - Inicia sesión con tu cuenta

2. **Crear Nuevo Repositorio**
   - Click en el botón **"+"** en la esquina superior derecha
   - Selecciona **"New repository"**

3. **Configurar el Repositorio**
   - **Repository name**: `dian-leticia-fiscalizacion`
   - **Description**: `Sistema de Gestión de Casos de Fiscalización - DIAN Leticia`
   - **Visibility**: Selecciona **Private** (recomendado para datos sensibles)
   - **NO marques** "Initialize this repository with a README"
   - Click en **"Create repository"**

4. **Copiar la URL del Repositorio**
   - GitHub te mostrará una URL como: `https://github.com/tu-usuario/dian-leticia-fiscalizacion.git`
   - Copia esta URL, la necesitarás en el siguiente paso

### Paso 1.2: Subir el Código desde tu Computadora

Abre una terminal o línea de comandos en la carpeta `version_36` y ejecuta estos comandos:

```bash
# 1. Inicializar repositorio Git
git init

# 2. Agregar todos los archivos
git add .

# 3. Hacer el primer commit
git commit -m "Sistema DIAN Leticia v3.6 - Versión inicial completa"

# 4. Conectar con GitHub (reemplaza con TU URL)
git remote add origin https://github.com/TU-USUARIO/dian-leticia-fiscalizacion.git

# 5. Cambiar a rama main
git branch -M main

# 6. Subir el código a GitHub
git push -u origin main
```

**Nota**: Reemplaza `TU-USUARIO` con tu nombre de usuario de GitHub.

Si te pide usuario y contraseña:
- **Usuario**: Tu nombre de usuario de GitHub
- **Contraseña**: Usa un Personal Access Token (no tu contraseña normal)
  - Para crear un token: GitHub → Settings → Developer settings → Personal access tokens

### Paso 1.3: Verificar que se Subió Correctamente

1. Regresa a tu repositorio en GitHub
2. Refresca la página
3. Deberías ver todos los archivos del proyecto
4. Verifica que estén:
   - `package.json`
   - `server.js`
   - Carpeta `public/`
   - Carpeta `database/`
   - `README.md`

---

## 🔷 PARTE 2: Desplegar en Render

### Paso 2.1: Crear Cuenta en Render

1. **Ir a Render**
   - Abre [https://render.com](https://render.com)
   - Click en **"Get Started"** o **"Sign Up"**

2. **Registrarse**
   - **Opción recomendada**: "Sign up with GitHub"
   - Esto conectará automáticamente tu cuenta de GitHub
   - Autoriza el acceso cuando te lo pida

3. **Verificar Email**
   - Revisa tu correo electrónico
   - Click en el enlace de verificación

### Paso 2.2: Conectar tu Repositorio

1. **En el Dashboard de Render**
   - Click en **"New +"** (botón azul en la esquina superior derecha)
   - Selecciona **"Web Service"**

2. **Conectar Repositorio**
   - Render mostrará tus repositorios de GitHub
   - Busca `dian-leticia-fiscalizacion`
   - Click en **"Connect"**

### Paso 2.3: Configurar el Servicio

Completa el formulario con estos valores exactos:

#### Configuración Básica

**Name** (Nombre del servicio):
```
dian-leticia-fiscalizacion
```

**Region** (Región):
```
Oregon (US West) - Recomendado
```
O selecciona la región más cercana a Colombia.

**Branch** (Rama):
```
main
```

**Root Directory** (Directorio raíz):
```
(Dejar vacío)
```

**Runtime** (Entorno):
```
Node
```

#### Comandos de Build y Start

**Build Command** (Comando de construcción):
```
npm install && npm run init-db
```

**Start Command** (Comando de inicio):
```
npm start
```

#### Plan de Servicio

**Instance Type**:
```
Free (Gratuito)
```

O selecciona un plan de pago si necesitas mejor rendimiento.

### Paso 2.4: Configurar Variables de Entorno

**MUY IMPORTANTE**: Antes de hacer click en "Create Web Service", configura las variables de entorno.

Desplázate hacia abajo hasta la sección **"Environment Variables"**:

1. Click en **"Add Environment Variable"**

2. Agrega estas variables **UNA POR UNA**:

**Variable 1:**
- **Key**: `NODE_ENV`
- **Value**: `production`

**Variable 2:**
- **Key**: `JWT_SECRET`
- **Value**: `tu-clave-super-secreta-unica-cambiar-ahora-2025`

⚠️ **IMPORTANTE**: Cambia este valor por una clave única y segura. Puedes generar una en [https://randomkeygen.com/](https://randomkeygen.com/)

**Variable 3:**
- **Key**: `PORT`
- **Value**: `3000`

**Variable 4:**
- **Key**: `DATABASE_PATH`
- **Value**: `./database/database.db`

### Paso 2.5: Crear el Servicio

1. **Revisar Configuración**
   - Verifica que todos los campos estén correctos
   - Especialmente el Build Command y Start Command

2. **Crear Servicio**
   - Click en el botón **"Create Web Service"** (al final de la página)

3. **Esperar el Despliegue**
   - Render comenzará a construir tu aplicación
   - Verás los logs en tiempo real
   - Este proceso toma aproximadamente **3-5 minutos**

### Paso 2.6: Proceso de Despliegue

Durante el despliegue, Render hará lo siguiente:

1. ✅ Clonar tu repositorio de GitHub
2. ✅ Instalar Node.js
3. ✅ Ejecutar `npm install` (instalar dependencias)
4. ✅ Ejecutar `npm run init-db` (crear base de datos)
5. ✅ Ejecutar `npm start` (iniciar servidor)

**Logs que verás**:
```
==> Cloning from GitHub...
==> Installing dependencies...
==> Running build command...
🔧 Inicializando base de datos...
✅ Tablas creadas
✅ Códigos de programa insertados
✅ Usuarios por defecto creados
✅ Casos reales insertados
==> Starting service...
🚀 Servidor corriendo en puerto 3000
==> Your service is live 🎉
```

### Paso 2.7: Obtener la URL de tu Aplicación

1. **Una vez completado el despliegue**
   - Verás un mensaje: **"Your service is live"** con un ícono verde
   - En la parte superior verás tu URL pública

2. **La URL será algo como**:
   ```
   https://dian-leticia-fiscalizacion.onrender.com
   ```

3. **Copiar la URL**
   - Click en la URL para copiarla
   - O simplemente haz click para abrir tu aplicación

---

## 🔷 PARTE 3: Verificar que Todo Funciona

### Paso 3.1: Acceder a tu Aplicación

1. **Abrir la URL**
   - Abre la URL que te dio Render en tu navegador
   - Ejemplo: `https://dian-leticia-fiscalizacion.onrender.com`

2. **Primera Carga**
   - ⚠️ La primera vez puede tardar 30-60 segundos
   - Esto es normal en el plan gratuito de Render
   - Ten paciencia

3. **Pantalla de Login**
   - Deberías ver la pantalla de inicio de sesión
   - Con el logo y el formulario

### Paso 3.2: Probar el Login

**Credenciales de Prueba**:
- **Usuario**: `admin`
- **Contraseña**: `admin123`

1. Ingresa las credenciales
2. Click en "Iniciar Sesión"
3. Deberías entrar al dashboard

### Paso 3.3: Verificar Funcionalidades

Una vez dentro del sistema:

1. **Dashboard** ✅
   - Verifica que muestre las estadísticas
   - Deberías ver el total de casos cargados

2. **Casos** ✅
   - Ve a la sección "Casos"
   - Deberías ver los casos del Excel
   - Prueba los filtros

3. **Reportes** ✅
   - Ve a "Reportes"
   - Prueba cada tipo de reporte
   - Verifica que se generen correctamente

4. **Usuarios** ✅ (Solo si eres admin)
   - Ve a "Usuarios"
   - Verifica la lista de usuarios

---

## 🔷 PARTE 4: Seguridad Post-Despliegue

### ⚠️ CRÍTICO: Cambiar Contraseñas

Las contraseñas por defecto son **públicas** y deben cambiarse inmediatamente.

**Contraseñas por defecto**:
- admin / admin123
- supervisor / supervisor123
- maria.murillo / auditor123

**Cómo cambiarlas**:

**Opción 1: Crear nuevos usuarios** (Recomendado)
1. Inicia sesión como admin
2. Ve a "Usuarios"
3. Crea nuevos usuarios con contraseñas seguras
4. Asigna los casos a los nuevos usuarios
5. Elimina los usuarios por defecto (requiere acceso a BD)

**Opción 2: Modificar directamente la base de datos**
- Esto requiere conocimientos técnicos avanzados
- No recomendado para usuarios no técnicos

### 🔐 Verificar JWT_SECRET

1. En Render, ve a tu servicio
2. Click en **"Environment"** en el menú lateral
3. Verifica que `JWT_SECRET` sea único y diferente al ejemplo
4. Si usaste el valor por defecto, **cámbialo ahora**:
   - Click en el ícono de editar
   - Ingresa una nueva clave segura
   - Click en "Save Changes"
   - Render redesplegará automáticamente

---

## 🔷 PARTE 5: Actualizaciones Futuras

### Cómo Actualizar el Sistema

Cuando necesites hacer cambios al código:

```bash
# 1. Hacer cambios en tu código local
# (edita los archivos que necesites)

# 2. Guardar cambios en Git
git add .
git commit -m "Descripción de los cambios realizados"

# 3. Subir a GitHub
git push origin main
```

**Despliegue Automático**:
- Render detectará automáticamente los cambios
- Comenzará a redesplegar tu aplicación
- Esto toma 2-5 minutos
- Puedes ver el progreso en la sección "Events" de Render

---

## 🔷 PARTE 6: Monitoreo y Mantenimiento

### Ver Logs en Tiempo Real

1. En Render, ve a tu servicio
2. Click en **"Logs"** en el menú lateral
3. Verás todos los logs del servidor
4. Útil para detectar errores

### Métricas del Servicio

Render proporciona métricas básicas:
- **CPU Usage**: Uso del procesador
- **Memory Usage**: Uso de memoria
- **Request Count**: Número de peticiones
- **Response Times**: Tiempos de respuesta

Accede a estas en la pestaña **"Metrics"**.

### Reiniciar el Servicio

Si necesitas reiniciar el servicio:
1. En Render, ve a tu servicio
2. Click en **"Manual Deploy"** → **"Clear build cache & deploy"**
3. O simplemente haz un nuevo push a GitHub

---

## 🔷 PARTE 7: Limitaciones del Plan Gratuito

### Plan Free de Render

**Ventajas**:
- ✅ Completamente gratuito
- ✅ HTTPS automático
- ✅ Despliegues ilimitados
- ✅ Perfecto para desarrollo y pruebas

**Limitaciones**:
- ⏰ El servicio se "duerme" después de 15 minutos de inactividad
- ⏰ La primera petición después de dormir toma ~30 segundos
- 💾 750 horas de uso por mes
- 💾 Almacenamiento efímero (la BD se reinicia con cada despliegue)

### ¿Es Suficiente para Producción?

**Para uso ligero** (5-10 usuarios, consultas ocasionales):
- ✅ **SÍ**, el plan gratuito es suficiente
- La "dormida" del servicio es manejable
- Los usuarios pueden esperar 30 segundos en la primera carga

**Para uso intensivo** (20+ usuarios, uso constante):
- ❌ **NO**, considera un plan de pago
- Plan Starter ($7/mes): Sin dormida, mejor rendimiento
- Plan Pro ($25/mes): Más recursos, mejor para producción

---

## 🔷 PARTE 8: Persistencia de Datos

### ⚠️ Problema: Datos Efímeros

En el plan gratuito de Render:
- La base de datos se **reinicia** con cada despliegue
- Los datos nuevos se **pierden** al redesplegar
- Solo se mantienen los datos del `init-database.js`

### ✅ Solución 1: Render Disks (Recomendado)

**Render Disks** permite persistencia de datos:

1. En Render, ve a tu servicio
2. Click en **"Disks"** en el menú lateral
3. Click en **"Add Disk"**
4. Configuración:
   - **Name**: `database-disk`
   - **Mount Path**: `/opt/render/project/src/database`
   - **Size**: 1 GB (suficiente)
5. Click en **"Create Disk"**
6. Actualiza la variable `DATABASE_PATH` a `/opt/render/project/src/database/database.db`

**Costo**: $1/mes por GB

### ✅ Solución 2: Base de Datos Externa

Para producción seria, usa PostgreSQL:

1. En Render, crea un **PostgreSQL Database**
2. Modifica el código para usar PostgreSQL en lugar de SQLite
3. Conecta tu aplicación a la base de datos externa

**Costo**: Desde $7/mes

### ✅ Solución 3: Backups Manuales

Si usas el plan gratuito:
1. Descarga la base de datos periódicamente
2. Guárdala en un lugar seguro
3. Restaura cuando sea necesario

---

## 🔷 PARTE 9: Solución de Problemas Comunes

### Problema 1: El Despliegue Falla

**Síntomas**:
- Render muestra "Build failed"
- Logs muestran errores

**Soluciones**:

1. **Verificar Build Command**
   ```
   npm install && npm run init-db
   ```
   Debe estar exactamente así.

2. **Verificar Start Command**
   ```
   npm start
   ```

3. **Revisar Logs**
   - Lee los logs completos
   - Busca el error específico
   - Googlea el error si no lo entiendes

4. **Verificar package.json**
   - Asegúrate de que esté en la raíz del repositorio
   - Verifica que tenga el script `init-db`

### Problema 2: No Puedo Iniciar Sesión

**Síntomas**:
- Las credenciales no funcionan
- Error "Usuario o contraseña incorrectos"

**Soluciones**:

1. **Verificar Credenciales**
   - Usuario: `admin`
   - Contraseña: `admin123`
   - Asegúrate de no tener espacios extra

2. **Verificar que la BD se Inicializó**
   - Revisa los logs del build
   - Busca: "✅ Base de datos inicializada"

3. **Limpiar Caché del Navegador**
   - Presiona Ctrl+Shift+Delete
   - Limpia cookies y caché
   - Intenta de nuevo

### Problema 3: La Aplicación es Muy Lenta

**Síntomas**:
- Tarda mucho en cargar
- Respuestas lentas

**Causas y Soluciones**:

1. **Servicio Dormido** (Plan Free)
   - **Causa**: Inactividad de 15+ minutos
   - **Solución**: Espera 30 segundos en la primera carga
   - **Prevención**: Actualiza a plan de pago

2. **Muchos Datos**
   - **Causa**: 262 casos pueden ser pesados
   - **Solución**: Implementa paginación
   - **Prevención**: Optimiza consultas

3. **Región Lejana**
   - **Causa**: Servidor en Oregon, usuarios en Colombia
   - **Solución**: No hay mucho que hacer en plan Free
   - **Prevención**: Plan de pago permite elegir región

### Problema 4: Error de Base de Datos

**Síntomas**:
- "Database not found"
- "Database locked"

**Soluciones**:

1. **Redesplegar**
   - En Render: Manual Deploy → Clear build cache & deploy

2. **Verificar DATABASE_PATH**
   - Debe ser: `./database/database.db`

3. **Verificar que existe la carpeta database**
   - En tu repositorio de GitHub
   - Debe existir la carpeta `database/`

---

## 🔷 PARTE 10: Mejores Prácticas

### Para Desarrollo

1. **Trabaja Localmente Primero**
   ```bash
   npm install
   npm run init-db
   npm start
   ```

2. **Prueba Todo Localmente**
   - Verifica que funcione en tu computadora
   - Prueba todas las funcionalidades

3. **Luego Sube a GitHub**
   ```bash
   git add .
   git commit -m "Descripción clara"
   git push
   ```

### Para Producción

1. **Usa Variables de Entorno Seguras**
   - JWT_SECRET único y complejo
   - No uses valores por defecto

2. **Cambia Todas las Contraseñas**
   - Crea usuarios reales
   - Elimina usuarios de prueba

3. **Configura Backups**
   - Descarga la BD regularmente
   - O usa Render Disks

4. **Monitorea el Sistema**
   - Revisa logs regularmente
   - Verifica métricas de uso

---

## 🔷 PARTE 11: Comandos Útiles

### Comandos Git

```bash
# Ver estado de cambios
git status

# Ver historial de commits
git log --oneline

# Deshacer cambios no guardados
git checkout -- archivo.js

# Crear una nueva rama
git checkout -b nueva-funcionalidad

# Cambiar de rama
git checkout main

# Ver ramas
git branch
```

### Comandos npm

```bash
# Instalar dependencias
npm install

# Inicializar base de datos
npm run init-db

# Iniciar servidor
npm start

# Ver versión de Node
node --version

# Ver versión de npm
npm --version
```

---

## 🔷 PARTE 12: Recursos Adicionales

### Documentación Oficial

- **Render**: [https://render.com/docs](https://render.com/docs)
- **Node.js**: [https://nodejs.org/docs](https://nodejs.org/docs)
- **Express**: [https://expressjs.com](https://expressjs.com)
- **Git**: [https://git-scm.com/doc](https://git-scm.com/doc)

### Tutoriales en Video

- **Git y GitHub**: Busca "Git tutorial español" en YouTube
- **Render Deploy**: Busca "Render deploy Node.js" en YouTube

### Comunidad

- **Stack Overflow**: Para preguntas técnicas
- **GitHub Issues**: Para reportar bugs del sistema

---

## 🎉 ¡Felicidades!

Has desplegado exitosamente el Sistema de Gestión de Casos de Fiscalización DIAN Leticia.

### ✅ Checklist Final

- [x] Código subido a GitHub
- [x] Servicio creado en Render
- [x] Variables de entorno configuradas
- [x] Aplicación desplegada y funcionando
- [x] Login probado exitosamente
- [ ] Contraseñas cambiadas (¡HAZLO AHORA!)
- [ ] JWT_SECRET cambiado (¡HAZLO AHORA!)

### 🎯 Próximos Pasos

1. **Inmediato**:
   - ✅ Cambiar contraseñas por defecto
   - ✅ Cambiar JWT_SECRET
   - ✅ Crear usuarios reales

2. **Esta Semana**:
   - ✅ Capacitar al equipo
   - ✅ Cargar casos adicionales si es necesario
   - ✅ Configurar backups

3. **Este Mes**:
   - ✅ Evaluar rendimiento
   - ✅ Considerar plan de pago si es necesario
   - ✅ Implementar mejoras según feedback

---

**¡Tu sistema está en línea y listo para usar!** 🚀

**URL de tu aplicación**: (La que te dio Render)

---

**Desarrollado para DIAN - Dirección Seccional de Leticia**