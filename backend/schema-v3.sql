-- GESTIÓN WEB CASOS FISCALIZACIÓN - VERSION 3.0 DATABASE SCHEMA
-- Enhanced schema with Gestión Perceptiva, Program Codes, and Administrative Acts tracking

-- Users table (unchanged)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Administrador', 'Supervisor', 'Auditor')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Program Codes table (NEW)
CREATE TABLE IF NOT EXISTS program_codes (
    code TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tax Types table (NEW)
CREATE TABLE IF NOT EXISTS tax_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Administrative Act Types table (NEW)
CREATE TABLE IF NOT EXISTS administrative_act_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    contributes_to_goal INTEGER DEFAULT 0,
    goal_type TEXT CHECK(goal_type IN ('liquidacion_revision', 'liquidacion_sancion_cierre', 'other', NULL)),
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Cases table (ENHANCED)
CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id TEXT UNIQUE NOT NULL,
    nit TEXT NOT NULL,
    business_name TEXT NOT NULL,
    program_code TEXT NOT NULL,
    tax_type TEXT NOT NULL,
    opening_year INTEGER NOT NULL,
    tax_year INTEGER NOT NULL,
    period INTEGER NOT NULL,
    calculation_type TEXT NOT NULL CHECK(calculation_type IN ('Determinación', 'Sanción', 'Mixto')),
    status TEXT NOT NULL DEFAULT 'Abierto' CHECK(status IN ('Abierto', 'En Curso', 'Cerrado', 'Archivado')),
    auditor_id INTEGER NOT NULL,
    opening_date DATE NOT NULL,
    closing_date DATE,
    gestion_perceptiva INTEGER DEFAULT 0, -- NEW: 0 = No, 1 = Yes
    gestion_perceptiva_date DATE, -- NEW
    gestion_perceptiva_notes TEXT, -- NEW
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auditor_id) REFERENCES users(id),
    FOREIGN KEY (program_code) REFERENCES program_codes(code),
    FOREIGN KEY (tax_type) REFERENCES tax_types(name)
);

-- Administrative Acts table (NEW)
CREATE TABLE IF NOT EXISTS administrative_acts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL,
    act_type_id INTEGER NOT NULL,
    act_date DATE NOT NULL,
    notification_date DATE,
    description TEXT,
    amount REAL DEFAULT 0,
    auto_tracked INTEGER DEFAULT 0, -- 1 if automatically tracked for goals
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (act_type_id) REFERENCES administrative_act_types(id)
);

-- Monetary Actions table (ENHANCED)
CREATE TABLE IF NOT EXISTS monetary_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL,
    action_type TEXT NOT NULL CHECK(action_type IN ('Determinación', 'Sanción')),
    base_amount REAL NOT NULL,
    sanction_percentage REAL,
    final_amount REAL NOT NULL,
    action_date DATE NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- Administrative Acts table (unchanged)
CREATE TABLE IF NOT EXISTS administrative_acts_old (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL,
    act_type TEXT NOT NULL,
    act_date DATE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- Payments table (unchanged)
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL,
    payment_date DATE NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- Goals table (unchanged)
CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    auditor_id INTEGER NOT NULL,
    goal_type TEXT NOT NULL CHECK(goal_type IN ('determinacion', 'sancion')),
    target_amount REAL NOT NULL,
    achieved_amount REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auditor_id) REFERENCES users(id),
    UNIQUE(year, month, auditor_id, goal_type)
);

-- Case Inventory table (NEW) - For executive reports
CREATE TABLE IF NOT EXISTS case_inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    auditor_id INTEGER NOT NULL,
    program_code TEXT NOT NULL,
    initial_inventory INTEGER DEFAULT 0,
    assigned INTEGER DEFAULT 0,
    reassigned_in INTEGER DEFAULT 0,
    evacuated INTEGER DEFAULT 0,
    reassigned_out INTEGER DEFAULT 0,
    final_inventory INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auditor_id) REFERENCES users(id),
    FOREIGN KEY (program_code) REFERENCES program_codes(code),
    UNIQUE(year, month, auditor_id, program_code)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cases_auditor ON cases(auditor_id);
CREATE INDEX IF NOT EXISTS idx_cases_program_code ON cases(program_code);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_tax_year ON cases(tax_year);
CREATE INDEX IF NOT EXISTS idx_administrative_acts_case ON administrative_acts(case_id);
CREATE INDEX IF NOT EXISTS idx_administrative_acts_date ON administrative_acts(act_date);
CREATE INDEX IF NOT EXISTS idx_monetary_actions_case ON monetary_actions(case_id);
CREATE INDEX IF NOT EXISTS idx_goals_auditor ON goals(auditor_id);
CREATE INDEX IF NOT EXISTS idx_goals_year_month ON goals(year, month);
CREATE INDEX IF NOT EXISTS idx_case_inventory_auditor ON case_inventory(auditor_id);
CREATE INDEX IF NOT EXISTS idx_case_inventory_year_month ON case_inventory(year, month);

-- Insert default program codes
INSERT OR IGNORE INTO program_codes (code, description) VALUES
('BF', 'Programa BF'),
('DI', 'Devolución - Programa DI'),
('DT', 'Denuncia - Programa DT'),
('DU', 'Programa DU'),
('FT', 'Facturación - Programa FT'),
('HP', 'Programa HP'),
('I1', 'Investigación Nivel 1'),
('N1', 'Programa N1'),
('OE', 'Omiso Especial'),
('OF', 'Omiso Formal'),
('OY', 'Omiso Y - Programa Principal');

-- Insert default tax types
INSERT OR IGNORE INTO tax_types (name, description) VALUES
('Renta', 'Impuesto sobre la Renta'),
('RteFte', 'Retención en la Fuente'),
('Facturación', 'Facturación Electrónica');

-- Insert administrative act types with goal tracking
INSERT OR IGNORE INTO administrative_act_types (name, description, contributes_to_goal, goal_type) VALUES
('Auto de Apertura', 'Auto que da inicio a la investigación', 0, NULL),
('Requerimiento Especial', 'Requerimiento especial al contribuyente', 0, NULL),
('Liquidación Oficial de Revisión', 'Liquidación oficial de revisión - CONTRIBUYE A META', 1, 'liquidacion_revision'),
('Liquidación de Sanción', 'Liquidación de sanción general', 0, NULL),
('Liquidación de Sanción de Cierre de Establecimiento', 'Liquidación de sanción por cierre - CONTRIBUYE A META', 1, 'liquidacion_sancion_cierre'),
('Pliego de Cargos', 'Pliego de cargos al contribuyente', 0, NULL),
('Resolución Sanción', 'Resolución de sanción', 0, NULL),
('Auto de Archivo', 'Auto que archiva el expediente', 0, NULL),
('Emplazamiento para Corregir', 'Emplazamiento para corregir declaración', 0, NULL),
('Liquidación Provisional', 'Liquidación provisional', 0, NULL),
('Auto Inspección Tributaria', 'Auto de inspección tributaria', 0, NULL),
('Requerimiento Ordinario', 'Requerimiento ordinario de información', 0, NULL);