# 📘 Tutorial: Cómo Cargar y Gestionar Datos en el Sistema

Esta guía te enseñará cómo cargar nuevos casos, gestionar la información existente y mantener el sistema actualizado.

---

## 📋 Tabla de Contenidos

1. [Cargar Casos Manualmente](#1-cargar-casos-manualmente)
2. [Carga Masiva desde Excel](#2-carga-masiva-desde-excel)
3. [Editar Casos Existentes](#3-editar-casos-existentes)
4. [Eliminar Casos](#4-eliminar-casos)
5. [Gestionar Usuarios](#5-gestionar-usuarios)
6. [Generar Reportes](#6-generar-reportes)
7. [Exportar Datos](#7-exportar-datos)
8. [Mejores Prácticas](#8-mejores-prácticas)

---

## 1. Cargar Casos Manualmente

### Requisitos
- Rol: **Administrador** o **Supervisor**
- Información del caso a cargar

### Paso a Paso

1. **Iniciar Sesión**
   - Accede al sistema con tus credenciales
   - Debes tener rol de Admin o Supervisor

2. **Ir a la Sección de Casos**
   - Click en el botón **"Casos"** en la navegación superior

3. **Abrir el Formulario de Nuevo Caso**
   - Click en el botón **"➕ Nuevo Caso"** (esquina superior derecha)

4. **Llenar el Formulario**

   **Campos Obligatorios** (marcados con *):
   
   - **NIT**: Número de identificación tributaria
     - Ejemplo: `900123456`
     - Sin puntos, comas ni guiones
   
   - **Nombre Contribuyente**: Razón social o nombre completo
     - Ejemplo: `EMPRESA EJEMPLO S.A.S`
   
   - **Programa**: Selecciona de la lista
     - BF: Beneficios Fiscales
     - DI: Declaración Inconsistente
     - DT: Declaración Tardía
     - I1: Investigación Nivel 1
     - N1: No Declarante
     - OE: Omisión de Ingresos
     - OY: Otros
   
   - **Tipo Impuesto**: Selecciona de la lista
     - Renta
     - RteFte (Retención en la Fuente)
     - Facturación
   
   - **Año Apertura**: Año en que se abrió el caso
     - Ejemplo: `2025`
   
   - **Año Gravable**: Año fiscal investigado
     - Ejemplo: `2023`
   
   - **Período**: Período fiscal (opcional)
     - Ejemplo: `1`, `2`, `3`, etc.
   
   - **Auditor**: Selecciona el auditor asignado
     - Elige de la lista desplegable
   
   - **Estado**: Estado actual del caso
     - Activo
     - En Curso
     - En Notificación
     - Cerrado
     - Evacuado

   **Campos Opcionales**:
   
   - **Gestión Perceptiva**: Marca si aplica
   - **Notas**: Observaciones adicionales

5. **Guardar el Caso**
   - Click en el botón **"Guardar"**
   - El sistema generará automáticamente el ID del caso
   - Formato: `NIT-PROGRAMA-IMPUESTO-AÑO_APERTURA-AÑO_GRAVABLE-PERIODO`

6. **Verificar**
   - El caso aparecerá en la tabla de casos
   - Verifica que todos los datos sean correctos

---

## 2. Carga Masiva desde Excel

### Opción A: Usando la API (Recomendado)

Si tienes muchos casos en Excel, puedes cargarlos masivamente usando la API.

#### Preparar los Datos

1. **Organiza tu Excel** con estas columnas:
   - NIT
   - Razón Social
   - Código Programa
   - Tipo Impuesto
   - Año Apertura
   - Año Gravable
   - Período
   - Auditor (nombre o ID)
   - Gestión Perceptiva (Sí/No)
   - Estado
   - Notas

2. **Exporta a CSV** o **JSON**

#### Script de Carga Masiva

Crea un archivo `cargar-casos.js`:

```javascript
const fs = require('fs');

// Leer tu archivo CSV o JSON
const casos = [
  {
    nit: '900123456',
    taxpayer_name: 'EMPRESA EJEMPLO S.A.S',
    program_code: 'I1',
    tax_type: 'Renta',
    opening_year: 2025,
    taxable_year: 2024,
    period: '1',
    auditor_id: 3,
    gestion_perceptiva: true,
    status: 'Activo',
    notes: 'Caso de ejemplo'
  },
  // ... más casos
];

// Generar case_id para cada caso
const casosConId = casos.map(c => ({
  ...c,
  case_id: `${c.nit}-${c.program_code}-${c.tax_type}-${c.opening_year}-${c.taxable_year}-${c.period || '1'}`
}));

// Hacer la petición a la API
fetch('http://localhost:3000/api/cases/bulk', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer TU_TOKEN_JWT'
  },
  body: JSON.stringify({ cases: casosConId })
})
.then(res => res.json())
.then(data => console.log('✅', data))
.catch(err => console.error('❌', err));
```

#### Ejecutar la Carga

```bash
node cargar-casos.js
```

### Opción B: Modificar init-database.js

Si prefieres que los casos se carguen automáticamente al inicializar:

1. Abre `database/init-database.js`
2. Agrega tus casos al array `realCases`
3. Ejecuta `npm run init-db`

---

## 3. Editar Casos Existentes

### Paso a Paso

1. **Ir a Casos**
   - Click en "Casos" en la navegación

2. **Buscar el Caso**
   - Usa la barra de búsqueda
   - O usa los filtros

3. **Abrir el Caso**
   - Click en el botón **"Editar"** del caso

4. **Modificar los Datos**
   - Cambia los campos que necesites
   - Todos los campos son editables excepto el NIT

5. **Guardar Cambios**
   - Click en **"Guardar"**
   - Los cambios se reflejan inmediatamente

### Permisos

- **Admin**: Puede editar cualquier caso
- **Supervisor**: Puede editar cualquier caso
- **Auditor**: Solo puede editar sus casos asignados

---

## 4. Eliminar Casos

### ⚠️ Advertencia

Eliminar un caso es **permanente** y no se puede deshacer.

### Paso a Paso

1. **Ir a Casos**
   - Click en "Casos"

2. **Buscar el Caso a Eliminar**
   - Usa búsqueda o filtros

3. **Eliminar**
   - Click en el botón **"Eliminar"** (rojo)
   - Confirma la eliminación

4. **Verificar**
   - El caso desaparece de la lista

### Permisos

- **Solo Administradores** pueden eliminar casos
- Supervisores y Auditores NO pueden eliminar

---

## 5. Gestionar Usuarios

### Crear Nuevo Usuario

**Requisito**: Rol de Administrador

1. **Ir a Usuarios**
   - Click en "Usuarios" en la navegación

2. **Abrir Formulario**
   - Click en **"➕ Nuevo Usuario"**

3. **Llenar Datos**
   - **Usuario**: Nombre de usuario único (sin espacios)
   - **Contraseña**: Contraseña segura (mínimo 8 caracteres)
   - **Nombre Completo**: Nombre real del usuario
   - **Rol**: Selecciona el rol apropiado
     - **Auditor**: Para funcionarios que gestionan casos
     - **Supervisor**: Para jefes de grupo
     - **Administrador**: Para administradores del sistema

4. **Crear Usuario**
   - Click en **"Crear Usuario"**
   - El usuario puede iniciar sesión inmediatamente

### Roles y Sus Permisos

#### Administrador
- ✅ Crear, editar y eliminar casos
- ✅ Ver todos los casos
- ✅ Crear y gestionar usuarios
- ✅ Ver todos los reportes
- ✅ Acceso completo al sistema

#### Supervisor
- ✅ Crear y editar casos
- ✅ Ver todos los casos
- ✅ Ver todos los reportes
- ❌ No puede eliminar casos
- ❌ No puede gestionar usuarios

#### Auditor
- ✅ Ver sus casos asignados
- ✅ Editar sus casos
- ✅ Ver reportes generales
- ❌ No puede ver casos de otros auditores
- ❌ No puede crear o eliminar casos
- ❌ No puede gestionar usuarios

---

## 6. Generar Reportes

### Reporte de Inventario por Programa

**Qué muestra**: Resumen de casos por código de programa

1. **Ir a Reportes**
   - Click en "Reportes"

2. **Seleccionar Tab**
   - El tab "Inventario por Programa" está activo por defecto

3. **Ver Datos**
   - Total de casos por programa
   - Gestión perceptiva
   - Casos activos y cerrados

### Reporte Detallado por Programa

**Qué muestra**: Lista completa de casos de un programa específico

1. **Ir a Reportes**
   - Click en "Reportes"

2. **Seleccionar Tab**
   - Click en "Detalle por Programa"

3. **Seleccionar Programa**
   - Elige un programa de la lista desplegable

4. **Cargar Reporte**
   - Click en "Cargar Reporte"

5. **Ver Datos**
   - Lista de todos los casos del programa
   - Auditor asignado
   - Estado actual
   - Monto total

### Reporte de Desempeño de Auditores

**Qué muestra**: Métricas de productividad por auditor

1. **Ir a Reportes**
   - Click en "Reportes"

2. **Seleccionar Tab**
   - Click en "Desempeño de Auditores"

3. **Ver Datos**
   - Total de casos por auditor
   - Gestión perceptiva
   - Casos activos y cerrados
   - Monto total gestionado

---

## 7. Exportar Datos

### Opción 1: Desde la Interfaz (Futuro)

Funcionalidad de exportación en desarrollo.

### Opción 2: Acceso Directo a la Base de Datos

Si necesitas exportar todos los datos:

1. **Descargar la Base de Datos**
   - Accede al servidor (Render o local)
   - Descarga el archivo `database/database.db`

2. **Usar DB Browser for SQLite**
   - Descarga: [https://sqlitebrowser.org/](https://sqlitebrowser.org/)
   - Abre el archivo `database.db`
   - Exporta a CSV, Excel o JSON

3. **Consultas SQL Directas**
   ```sql
   -- Exportar todos los casos
   SELECT * FROM cases;
   
   -- Exportar casos de un auditor
   SELECT * FROM cases WHERE auditor_id = 3;
   
   -- Exportar casos por programa
   SELECT * FROM cases WHERE program_code = 'I1';
   ```

---

## 8. Mejores Prácticas

### Para Cargar Datos

1. **Verifica los Datos Antes de Cargar**
   - Revisa que los NITs sean correctos
   - Verifica nombres de contribuyentes
   - Asegúrate de que los programas existan

2. **Usa Nombres Consistentes**
   - Mantén el mismo formato para nombres
   - Usa mayúsculas para razones sociales

3. **Asigna Auditores Correctamente**
   - Verifica que el auditor exista en el sistema
   - Distribuye la carga equitativamente

### Para Gestionar Casos

1. **Actualiza Regularmente**
   - Mantén los estados actualizados
   - Registra las últimas acciones

2. **Usa las Notas**
   - Documenta información importante
   - Registra fechas clave
   - Anota observaciones relevantes

3. **Marca Gestión Perceptiva**
   - Identifica correctamente los casos
   - Esto afecta los reportes

### Para Mantener el Sistema

1. **Backups Regulares**
   - Descarga la base de datos semanalmente
   - Guárdala en un lugar seguro
   - Nombra los archivos con fecha: `database-2025-10-21.db`

2. **Limpieza de Datos**
   - Revisa casos duplicados
   - Corrige errores de captura
   - Elimina casos obsoletos

3. **Monitoreo**
   - Revisa los reportes regularmente
   - Verifica que los datos sean consistentes
   - Reporta cualquier anomalía

---

## 🔧 Solución de Problemas

### No Puedo Crear un Caso

**Problema**: Error al guardar caso

**Causas Comunes**:
1. **NIT duplicado**: Ya existe un caso con ese NIT, programa e impuesto
2. **Campos vacíos**: Faltan campos obligatorios
3. **Auditor inválido**: El auditor seleccionado no existe

**Soluciones**:
1. Verifica que el caso no exista ya
2. Completa todos los campos marcados con *
3. Selecciona un auditor válido de la lista

### Los Filtros No Funcionan

**Problema**: Los filtros no muestran resultados

**Soluciones**:
1. Limpia todos los filtros y vuelve a intentar
2. Verifica que haya casos que cumplan los criterios
3. Refresca la página (F5)

### No Veo Mis Casos

**Problema**: La tabla está vacía

**Causas**:
1. **Eres auditor**: Solo ves tus casos asignados
2. **Filtros activos**: Hay filtros aplicados
3. **No hay casos**: La base de datos está vacía

**Soluciones**:
1. Verifica tu rol en la esquina superior derecha
2. Limpia todos los filtros
3. Contacta al administrador

---

## 📊 Formato de Datos

### Formato de ID de Caso

El sistema genera automáticamente el ID con este formato:

```
NIT-PROGRAMA-IMPUESTO-AÑO_APERTURA-AÑO_GRAVABLE-PERIODO
```

**Ejemplo**:
```
900123456-I1-Renta-2025-2024-1
```

### Códigos de Programa

| Código | Descripción |
|--------|-------------|
| BF | Beneficios Fiscales |
| DI | Declaración Inconsistente |
| DT | Declaración Tardía |
| DU | Declaración Única |
| FT | Facturación |
| HP | Hallazgos Previos |
| I1 | Investigación Nivel 1 |
| IH | Investigación Hallazgos |
| N1 | No Declarante |
| OE | Omisión de Ingresos |
| OF | Oficioso |
| OY | Otros |

### Estados de Casos

| Estado | Descripción |
|--------|-------------|
| Activo | Caso activo en proceso |
| En Curso | En desarrollo |
| En Notificación | Pendiente de notificación |
| Cerrado | Caso finalizado |
| Evacuado | Caso evacuado |
| Suspendido | Temporalmente suspendido |

---

## 📝 Plantilla para Carga Masiva

Si vas a preparar un archivo para carga masiva, usa esta estructura:

### Formato JSON

```json
{
  "cases": [
    {
      "nit": "900123456",
      "taxpayer_name": "EMPRESA EJEMPLO S.A.S",
      "program_code": "I1",
      "tax_type": "Renta",
      "opening_year": 2025,
      "taxable_year": 2024,
      "period": "1",
      "auditor_id": 3,
      "gestion_perceptiva": true,
      "status": "Activo",
      "last_action": "Auto de Apertura",
      "last_action_date": "2025-01-15",
      "notes": "Caso de ejemplo"
    }
  ]
}
```

### Formato CSV

```csv
nit,taxpayer_name,program_code,tax_type,opening_year,taxable_year,period,auditor_id,gestion_perceptiva,status,notes
900123456,EMPRESA EJEMPLO S.A.S,I1,Renta,2025,2024,1,3,true,Activo,Caso de ejemplo
```

---

## 🎯 Consejos y Trucos

### Búsqueda Eficiente

- **Por NIT**: Escribe el NIT completo o parcial
- **Por Nombre**: Escribe parte del nombre del contribuyente
- **Por ID**: Escribe el ID del caso

### Filtros Combinados

Puedes usar múltiples filtros simultáneamente:
- Programa + Estado
- Auditor + Tipo de Impuesto
- Búsqueda + Filtros

### Atajos de Teclado

- **Ctrl + F**: Buscar en la página
- **F5**: Refrescar datos
- **Esc**: Cerrar modales

---

## 📞 Ayuda Adicional

### ¿Necesitas Ayuda?

1. **Revisa la documentación**
   - README.md
   - GUIA_DESPLIEGUE_GITHUB_RENDER.md

2. **Verifica los logs**
   - En Render: Sección "Logs"
   - Localmente: Consola del servidor

3. **Contacta al Administrador**
   - Si eres usuario final
   - Para problemas técnicos

---

## ✅ Checklist de Carga de Datos

Antes de cargar datos masivos:

- [ ] Verificar formato de NITs (sin puntos ni comas)
- [ ] Validar nombres de contribuyentes
- [ ] Confirmar que los programas existen
- [ ] Verificar que los auditores existan
- [ ] Revisar años (apertura y gravable)
- [ ] Preparar notas u observaciones
- [ ] Hacer backup de la BD actual
- [ ] Probar con 5-10 casos primero
- [ ] Luego cargar el resto

---

**¡Listo para cargar tus datos!** 📊

Si tienes dudas, consulta las otras guías o contacta al equipo de soporte.

---

**Desarrollado para DIAN - Dirección Seccional de Leticia**