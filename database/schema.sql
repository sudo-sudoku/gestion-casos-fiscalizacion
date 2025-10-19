-- SISTEMA DE GESTIÓN DE CASOS DE FISCALIZACIÓN - DIAN LETICIA
-- Base de datos SQLite con todas las tablas necesarias

-- Tabla 1: Usuarios (Gestión de roles y permisos)
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('Administrador', 'Supervisor', 'Auditor')),
    activo INTEGER DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla 2: Expedientes (Casos de fiscalización)
CREATE TABLE IF NOT EXISTS expedientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expediente_id TEXT UNIQUE NOT NULL, -- NIT-CODIGO_INVESTIGACION-IMPUESTO-AÑO_CALENDARIO-AÑO_GRAVABLE-PERIODO
    nit TEXT NOT NULL,
    razon_social TEXT NOT NULL,
    codigo_investigacion TEXT NOT NULL,
    impuesto TEXT NOT NULL,
    ano_gravable TEXT NOT NULL,
    ano_calendario TEXT NOT NULL,
    periodo TEXT NOT NULL,
    auditor_asignado_id INTEGER,
    supervisor_asignado_id INTEGER,
    estado_expediente TEXT DEFAULT 'Abierto',
    fecha_inicio DATE,
    fecha_vencimiento DATE,
    prioridad TEXT DEFAULT 'Media',
    observaciones TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auditor_asignado_id) REFERENCES usuarios(id),
    FOREIGN KEY (supervisor_asignado_id) REFERENCES usuarios(id)
);

-- Tabla 3: Gestiones (Acciones monetarias)
CREATE TABLE IF NOT EXISTS gestiones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expediente_id INTEGER NOT NULL,
    tipo_gestion TEXT NOT NULL,
    fecha_gestion DATE NOT NULL,
    
    -- Campos para declaración original
    impuesto_original REAL DEFAULT 0,
    saldo_pagar_original REAL DEFAULT 0,
    saldo_favor_original REAL DEFAULT 0,
    perdida_liquida_original REAL DEFAULT 0,
    renta_liquida_original REAL DEFAULT 0,
    
    -- Campos para declaración corregida
    impuesto_corregido REAL DEFAULT 0,
    saldo_pagar_corregido REAL DEFAULT 0,
    saldo_favor_corregido REAL DEFAULT 0,
    perdida_liquida_corregida REAL DEFAULT 0,
    renta_liquida_corregida REAL DEFAULT 0,
    
    -- Campos calculados automáticamente
    diferencia_impuesto REAL DEFAULT 0,
    diferencia_saldo_pagar REAL DEFAULT 0,
    diferencia_saldo_favor REAL DEFAULT 0,
    
    -- Otros campos
    monto_sancion REAL DEFAULT 0,
    intereses REAL DEFAULT 0,
    tasa_impuesto_renta REAL DEFAULT 0.35, -- 35% por defecto
    
    -- Valor que suma a la meta (calculado)
    valor_meta REAL NOT NULL,
    explicacion_calculo TEXT,
    
    observaciones TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expediente_id) REFERENCES expedientes(id)
);

-- Tabla 4: Actuaciones (Actos administrativos)
CREATE TABLE IF NOT EXISTS actuaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expediente_id INTEGER NOT NULL,
    tipo_actuacion TEXT NOT NULL,
    numero_acto TEXT,
    fecha_acto DATE NOT NULL,
    es_resolucion_sancion INTEGER DEFAULT 0,
    implica_cierre INTEGER DEFAULT 0,
    observaciones TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expediente_id) REFERENCES expedientes(id)
);

-- Tabla 5: Pagos490 (Recibos de pago)
CREATE TABLE IF NOT EXISTS pagos490 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gestion_id INTEGER NOT NULL,
    numero_recibo TEXT NOT NULL,
    fecha_pago DATE NOT NULL,
    monto_pago REAL NOT NULL,
    tipo_pago TEXT,
    observaciones TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gestion_id) REFERENCES gestiones(id)
);

-- Tabla 6: MetasGestion (Seguimiento de metas)
CREATE TABLE IF NOT EXISTS metas_gestion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auditor_id INTEGER NOT NULL,
    tipo_meta TEXT NOT NULL, -- 'DECLARACIONES_CORRECCIONES', 'ACTOS_ADMINISTRATIVOS', 'RECAUDO', 'CIERRES'
    periodo_tipo TEXT NOT NULL, -- 'Mensual', 'Trimestral', 'Semestral', 'Anual'
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    valor_meta REAL NOT NULL,
    valor_acumulado REAL DEFAULT 0,
    porcentaje_cumplimiento REAL DEFAULT 0,
    ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auditor_id) REFERENCES usuarios(id)
);

-- Tabla 7: Cierres de Establecimiento
CREATE TABLE IF NOT EXISTS cierres_establecimiento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expediente_id INTEGER NOT NULL,
    actuacion_id INTEGER NOT NULL,
    fecha_cierre DATE NOT NULL,
    direccion_establecimiento TEXT,
    observaciones TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expediente_id) REFERENCES expedientes(id),
    FOREIGN KEY (actuacion_id) REFERENCES actuaciones(id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_expedientes_auditor ON expedientes(auditor_asignado_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_supervisor ON expedientes(supervisor_asignado_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_estado ON expedientes(estado_expediente);
CREATE INDEX IF NOT EXISTS idx_gestiones_expediente ON gestiones(expediente_id);
CREATE INDEX IF NOT EXISTS idx_actuaciones_expediente ON actuaciones(expediente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_gestion ON pagos490(gestion_id);
CREATE INDEX IF NOT EXISTS idx_metas_auditor ON metas_gestion(auditor_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);