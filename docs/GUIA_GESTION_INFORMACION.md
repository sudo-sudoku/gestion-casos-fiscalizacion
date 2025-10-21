# 📊 Guía de Gestión de Información - Sistema DIAN Leticia

## Tabla de Contenidos
1. [Introducción](#introducción)
2. [Estructura de Datos](#estructura-de-datos)
3. [Gestión de Casos](#gestión-de-casos)
4. [Actualización de Información](#actualización-de-información)
5. [Consultas y Reportes](#consultas-y-reportes)
6. [Mantenimiento de Datos](#mantenimiento-de-datos)
7. [Mejores Prácticas](#mejores-prácticas)

---

## Introducción

Esta guía proporciona información detallada sobre cómo gestionar la información en el Sistema de Inspección Fiscal DIAN Leticia. El sistema está diseñado para manejar casos de inspección fiscal de manera eficiente y organizada.

### Objetivos de la Guía
- Comprender la estructura de datos del sistema
- Aprender a gestionar casos de inspección
- Dominar las operaciones de actualización
- Generar reportes efectivos
- Mantener la integridad de los datos

---

## Estructura de Datos

### 1. Tabla de Casos (cases)

La tabla principal del sistema contiene toda la información de los casos de inspección:

```sql
CREATE TABLE cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    numero_caso TEXT UNIQUE NOT NULL,
    nit TEXT NOT NULL,
    razon_social TEXT NOT NULL,
    tipo_contribuyente TEXT,
    direccion TEXT,
    municipio TEXT,
    telefono TEXT,
    email TEXT,
    tipo_inspeccion TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'Pendiente',
    prioridad TEXT DEFAULT 'Media',
    fecha_asignacion TEXT NOT NULL,
    fecha_limite TEXT,
    fecha_completado TEXT,
    inspector_asignado TEXT,
    observaciones TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)
```

#### Campos Principales

**Identificación del Caso:**
- `id`: Identificador único interno
- `numero_caso`: Número de caso único (formato: CASO-YYYY-NNNN)
- `nit`: Número de Identificación Tributaria

**Información del Contribuyente:**
- `razon_social`: Nombre o razón social del contribuyente
- `tipo_contribuyente`: Clasificación (Persona Natural, Jurídica, etc.)
- `direccion`: Dirección física
- `municipio`: Municipio de ubicación
- `telefono`: Número de contacto
- `email`: Correo electrónico

**Detalles de la Inspección:**
- `tipo_inspeccion`: Tipo de inspección a realizar
- `estado`: Estado actual del caso (Pendiente, En Proceso, Completado, Cancelado)
- `prioridad`: Nivel de prioridad (Alta, Media, Baja)
- `inspector_asignado`: Inspector responsable del caso

**Fechas:**
- `fecha_asignacion`: Fecha de asignación del caso
- `fecha_limite`: Fecha límite para completar
- `fecha_completado`: Fecha de finalización
- `created_at`: Fecha de creación del registro
- `updated_at`: Fecha de última actualización

**Información Adicional:**
- `observaciones`: Notas y comentarios sobre el caso

### 2. Tabla de Usuarios (users)

Gestiona los usuarios del sistema:

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nombre_completo TEXT NOT NULL,
    rol TEXT NOT NULL,
    email TEXT,
    activo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
)
```

---

## Gestión de Casos

### 1. Crear Nuevo Caso

**Desde la Interfaz Web:**

1. Acceder al sistema con credenciales válidas
2. Hacer clic en "Nuevo Caso" en el dashboard
3. Completar el formulario con la información requerida:
   - Número de caso (se genera automáticamente)
   - NIT del contribuyente
   - Razón social
   - Tipo de contribuyente
   - Información de contacto
   - Tipo de inspección
   - Prioridad
   - Inspector asignado
   - Fechas relevantes

4. Hacer clic en "Guardar Caso"

**Desde la API:**

```javascript
// POST /api/cases
const nuevoCase = {
    numero_caso: "CASO-2025-0001",
    nit: "900123456",
    razon_social: "Empresa Ejemplo S.A.S",
    tipo_contribuyente: "Persona Jurídica",
    direccion: "Calle 123 #45-67",
    municipio: "Leticia",
    telefono: "3001234567",
    email: "contacto@ejemplo.com",
    tipo_inspeccion: "Inspección Tributaria",
    estado: "Pendiente",
    prioridad: "Alta",
    fecha_asignacion: "2025-01-15",
    fecha_limite: "2025-02-15",
    inspector_asignado: "Juan Pérez"
};

fetch('/api/cases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nuevoCase)
});
```

### 2. Consultar Casos

**Obtener Todos los Casos:**

```javascript
// GET /api/cases
fetch('/api/cases')
    .then(response => response.json())
    .then(cases => console.log(cases));
```

**Buscar Casos Específicos:**

```javascript
// GET /api/cases/search?q=termino
fetch('/api/cases/search?q=900123456')
    .then(response => response.json())
    .then(results => console.log(results));
```

**Obtener un Caso por ID:**

```javascript
// GET /api/cases/:id
fetch('/api/cases/1')
    .then(response => response.json())
    .then(caso => console.log(caso));
```

### 3. Actualizar Casos

**Actualización Completa:**

```javascript
// PUT /api/cases/:id
const datosActualizados = {
    estado: "En Proceso",
    observaciones: "Se realizó visita inicial",
    updated_at: new Date().toISOString()
};

fetch('/api/cases/1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datosActualizados)
});
```

**Cambiar Estado:**

```javascript
// PATCH /api/cases/:id/estado
fetch('/api/cases/1/estado', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado: "Completado" })
});
```

### 4. Eliminar Casos

```javascript
// DELETE /api/cases/:id
fetch('/api/cases/1', {
    method: 'DELETE'
});
```

---

## Actualización de Información

### 1. Actualización Manual

**Pasos para actualizar un caso existente:**

1. Buscar el caso por número, NIT o razón social
2. Hacer clic en "Editar" en la fila del caso
3. Modificar los campos necesarios
4. Guardar los cambios

**Campos que se pueden actualizar:**
- Estado del caso
- Prioridad
- Inspector asignado
- Fechas (límite, completado)
- Información de contacto
- Observaciones

### 2. Actualización Masiva desde Excel

Para actualizar múltiples casos desde un archivo Excel:

1. Preparar el archivo Excel con las columnas correctas
2. Ejecutar el script de carga:

```bash
npm run load-data
```

3. El script:
   - Lee el archivo Excel
   - Valida los datos
   - Actualiza o crea casos según corresponda
   - Genera un reporte de la operación

### 3. Actualización Automática de Fechas

El sistema actualiza automáticamente:
- `updated_at`: Cada vez que se modifica un caso
- `fecha_completado`: Cuando el estado cambia a "Completado"

---

## Consultas y Reportes

### 1. Estadísticas del Dashboard

El dashboard muestra automáticamente:
- Total de casos
- Casos por estado (Pendiente, En Proceso, Completado)
- Casos por prioridad
- Distribución por tipo de inspección
- Casos próximos a vencer

### 2. Filtros Disponibles

**Por Estado:**
```javascript
// GET /api/cases?estado=Pendiente
fetch('/api/cases?estado=Pendiente')
```

**Por Prioridad:**
```javascript
// GET /api/cases?prioridad=Alta
fetch('/api/cases?prioridad=Alta')
```

**Por Inspector:**
```javascript
// GET /api/cases?inspector=Juan%20Pérez
fetch('/api/cases?inspector=Juan%20Pérez')
```

**Por Rango de Fechas:**
```javascript
// GET /api/cases?fecha_desde=2025-01-01&fecha_hasta=2025-12-31
fetch('/api/cases?fecha_desde=2025-01-01&fecha_hasta=2025-12-31')
```

### 3. Reportes Personalizados

**Reporte de Casos Vencidos:**

```sql
SELECT * FROM cases 
WHERE estado != 'Completado' 
AND fecha_limite < date('now')
ORDER BY fecha_limite ASC;
```

**Reporte de Productividad por Inspector:**

```sql
SELECT 
    inspector_asignado,
    COUNT(*) as total_casos,
    SUM(CASE WHEN estado = 'Completado' THEN 1 ELSE 0 END) as completados,
    SUM(CASE WHEN estado = 'En Proceso' THEN 1 ELSE 0 END) as en_proceso,
    SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) as pendientes
FROM cases
GROUP BY inspector_asignado;
```

**Reporte Mensual:**

```sql
SELECT 
    strftime('%Y-%m', fecha_asignacion) as mes,
    COUNT(*) as casos_asignados,
    SUM(CASE WHEN estado = 'Completado' THEN 1 ELSE 0 END) as casos_completados
FROM cases
GROUP BY mes
ORDER BY mes DESC;
```

### 4. Exportación de Datos

**Exportar a CSV:**

```javascript
// GET /api/cases/export/csv
fetch('/api/cases/export/csv')
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'casos_dian.csv';
        a.click();
    });
```

**Exportar a JSON:**

```javascript
// GET /api/cases/export/json
fetch('/api/cases/export/json')
    .then(response => response.json())
    .then(data => {
        const blob = new Blob([JSON.stringify(data, null, 2)], 
                              { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'casos_dian.json';
        a.click();
    });
```

---

## Mantenimiento de Datos

### 1. Respaldo de la Base de Datos

**Respaldo Manual:**

```bash
# Copiar el archivo de base de datos
cp database/dian_leticia.db database/backup_$(date +%Y%m%d).db
```

**Respaldo Automático (Cron Job):**

```bash
# Agregar al crontab para respaldo diario a las 2 AM
0 2 * * * cd /ruta/al/proyecto && cp database/dian_leticia.db database/backup_$(date +\%Y\%m\%d).db
```

### 2. Limpieza de Datos

**Eliminar Casos Antiguos Completados:**

```sql
-- Eliminar casos completados hace más de 2 años
DELETE FROM cases 
WHERE estado = 'Completado' 
AND fecha_completado < date('now', '-2 years');
```

**Archivar Casos Antiguos:**

```sql
-- Crear tabla de archivo
CREATE TABLE cases_archivo AS 
SELECT * FROM cases 
WHERE fecha_completado < date('now', '-1 year');

-- Eliminar de la tabla principal
DELETE FROM cases 
WHERE fecha_completado < date('now', '-1 year');
```

### 3. Optimización de la Base de Datos

```bash
# Ejecutar VACUUM para optimizar el espacio
sqlite3 database/dian_leticia.db "VACUUM;"

# Analizar y optimizar índices
sqlite3 database/dian_leticia.db "ANALYZE;"
```

### 4. Verificación de Integridad

```bash
# Verificar integridad de la base de datos
sqlite3 database/dian_leticia.db "PRAGMA integrity_check;"
```

---

## Mejores Prácticas

### 1. Gestión de Casos

✅ **Hacer:**
- Asignar números de caso únicos y secuenciales
- Completar toda la información requerida
- Actualizar el estado regularmente
- Agregar observaciones detalladas
- Establecer fechas límite realistas
- Asignar inspectores específicos

❌ **Evitar:**
- Dejar campos obligatorios vacíos
- Usar números de caso duplicados
- Olvidar actualizar el estado
- No documentar observaciones importantes
- Establecer fechas límite irreales

### 2. Actualización de Información

✅ **Hacer:**
- Actualizar inmediatamente después de cambios
- Documentar todas las modificaciones en observaciones
- Verificar datos antes de guardar
- Mantener consistencia en formatos
- Usar el campo updated_at para rastrear cambios

❌ **Evitar:**
- Actualizar sin verificar
- Modificar datos históricos sin justificación
- Dejar actualizaciones pendientes
- Usar formatos inconsistentes

### 3. Consultas y Reportes

✅ **Hacer:**
- Usar filtros para consultas específicas
- Exportar datos regularmente
- Generar reportes periódicos
- Analizar tendencias y patrones
- Compartir información relevante con el equipo

❌ **Evitar:**
- Consultas sin filtros en bases grandes
- Ignorar reportes de casos vencidos
- No analizar estadísticas
- Mantener información aislada

### 4. Seguridad de Datos

✅ **Hacer:**
- Realizar respaldos regulares
- Controlar acceso con usuarios y roles
- Mantener logs de actividad
- Verificar integridad periódicamente
- Usar contraseñas seguras

❌ **Evitar:**
- Compartir credenciales
- Olvidar respaldos
- Ignorar alertas de seguridad
- Permitir acceso sin autenticación

### 5. Rendimiento

✅ **Hacer:**
- Usar índices en campos de búsqueda frecuente
- Optimizar consultas complejas
- Limpiar datos antiguos regularmente
- Monitorear el tamaño de la base de datos
- Ejecutar VACUUM periódicamente

❌ **Evitar:**
- Consultas sin índices
- Acumular datos innecesarios
- Ignorar problemas de rendimiento
- No optimizar la base de datos

---

## Solución de Problemas Comunes

### Problema: No se pueden crear nuevos casos

**Posibles causas:**
- Número de caso duplicado
- Campos obligatorios vacíos
- Problemas de permisos en la base de datos

**Solución:**
1. Verificar que el número de caso sea único
2. Completar todos los campos obligatorios
3. Verificar permisos del archivo de base de datos

### Problema: Las búsquedas son lentas

**Posibles causas:**
- Base de datos muy grande
- Falta de índices
- Consultas no optimizadas

**Solución:**
1. Crear índices en campos de búsqueda frecuente
2. Archivar casos antiguos
3. Optimizar consultas SQL
4. Ejecutar VACUUM

### Problema: Datos inconsistentes

**Posibles causas:**
- Actualizaciones manuales incorrectas
- Errores en importación de Excel
- Falta de validación

**Solución:**
1. Implementar validaciones estrictas
2. Revisar script de importación
3. Corregir datos manualmente
4. Establecer procedimientos de validación

---

## Contacto y Soporte

Para preguntas o problemas adicionales:
- Revisar la documentación completa en `/docs`
- Consultar el README.md del proyecto
- Contactar al administrador del sistema

---

**Última actualización:** Octubre 2025  
**Versión del documento:** 1.0  
**Sistema:** DIAN Leticia - Inspección Fiscal v36