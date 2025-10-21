const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

// Crear directorio database si no existe
const fs = require('fs');
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.db');
const db = new Database(dbPath);

console.log('🔧 Inicializando base de datos...');
console.log('📁 Ruta de base de datos:', dbPath);

// Crear tablas
db.exec(`
  -- Tabla de usuarios
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'supervisor', 'auditor')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabla de códigos de programa
  CREATE TABLE IF NOT EXISTS program_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL
  );

  -- Tabla de tipos de impuesto
  CREATE TABLE IF NOT EXISTS tax_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT
  );

  -- Tabla de casos
  CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id TEXT UNIQUE NOT NULL,
    nit TEXT NOT NULL,
    taxpayer_name TEXT NOT NULL,
    program_code TEXT NOT NULL,
    tax_type TEXT NOT NULL,
    opening_year INTEGER NOT NULL,
    taxable_year INTEGER NOT NULL,
    period TEXT,
    auditor_id INTEGER,
    gestion_perceptiva INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Activo' CHECK(status IN ('Activo', 'Cerrado', 'Suspendido', 'En Curso', 'En Notificación', 'Evacuado')),
    last_action TEXT,
    last_action_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auditor_id) REFERENCES users(id),
    FOREIGN KEY (program_code) REFERENCES program_codes(code),
    FOREIGN KEY (tax_type) REFERENCES tax_types(name)
  );

  -- Tabla de actos administrativos
  CREATE TABLE IF NOT EXISTS administrative_acts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL,
    act_type TEXT NOT NULL,
    act_number TEXT NOT NULL,
    act_date DATE NOT NULL,
    amount REAL DEFAULT 0,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
  );

  -- Tabla de metas
  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    program_code TEXT NOT NULL,
    target_amount REAL NOT NULL,
    achieved_amount REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_code) REFERENCES program_codes(code)
  );

  -- Índices para mejor rendimiento
  CREATE INDEX IF NOT EXISTS idx_cases_program ON cases(program_code);
  CREATE INDEX IF NOT EXISTS idx_cases_auditor ON cases(auditor_id);
  CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
  CREATE INDEX IF NOT EXISTS idx_cases_gestion ON cases(gestion_perceptiva);
  CREATE INDEX IF NOT EXISTS idx_acts_case ON administrative_acts(case_id);
  CREATE INDEX IF NOT EXISTS idx_cases_nit ON cases(nit);

  -- Trigger para actualizar metas cuando se crean actos administrativos
  CREATE TRIGGER IF NOT EXISTS update_goals_on_act_insert
  AFTER INSERT ON administrative_acts
  BEGIN
    UPDATE goals
    SET achieved_amount = (
      SELECT COALESCE(SUM(aa.amount), 0)
      FROM administrative_acts aa
      JOIN cases c ON aa.case_id = c.id
      WHERE c.program_code = goals.program_code
        AND strftime('%Y', aa.act_date) = CAST(goals.year AS TEXT)
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE year = CAST(strftime('%Y', NEW.act_date) AS INTEGER);
  END;
`);

console.log('✅ Tablas creadas exitosamente');

// Insertar códigos de programa
const programCodes = [
  { code: 'BF', description: 'Beneficios Fiscales' },
  { code: 'DI', description: 'Declaración Inconsistente' },
  { code: 'DT', description: 'Declaración Tardía' },
  { code: 'DU', description: 'Declaración Única' },
  { code: 'FT', description: 'Facturación' },
  { code: 'HP', description: 'Hallazgos Previos' },
  { code: 'I1', description: 'Investigación Nivel 1' },
  { code: 'IH', description: 'Investigación Hallazgos' },
  { code: 'N1', description: 'No Declarante' },
  { code: 'OE', description: 'Omisión de Ingresos' },
  { code: 'OF', description: 'Oficioso' },
  { code: 'OY', description: 'Otros' }
];

const insertProgram = db.prepare('INSERT OR IGNORE INTO program_codes (code, description) VALUES (?, ?)');
const insertManyPrograms = db.transaction((programs) => {
  for (const program of programs) {
    insertProgram.run(program.code, program.description);
  }
});
insertManyPrograms(programCodes);
console.log('✅ Códigos de programa insertados');

// Insertar tipos de impuesto
const taxTypes = [
  { name: 'Renta', description: 'Impuesto sobre la Renta' },
  { name: 'RteFte', description: 'Retención en la Fuente' },
  { name: 'Facturación', description: 'Facturación Electrónica' }
];

const insertTaxType = db.prepare('INSERT OR IGNORE INTO tax_types (name, description) VALUES (?, ?)');
const insertManyTaxTypes = db.transaction((types) => {
  for (const type of types) {
    insertTaxType.run(type.name, type.description);
  }
});
insertManyTaxTypes(taxTypes);
console.log('✅ Tipos de impuesto insertados');

// Insertar usuarios por defecto
const defaultUsers = [
  { username: 'admin', password: 'admin123', name: 'Administrador del Sistema', role: 'admin' },
  { username: 'supervisor', password: 'supervisor123', name: 'Supervisor de Fiscalización', role: 'supervisor' },
  { username: 'maria.murillo', password: 'auditor123', name: 'MARIA JOSE MURILLO URIBE', role: 'auditor' },
  { username: 'edy.calderon', password: 'auditor123', name: 'EDY YOLANDA CALDERON RUALES', role: 'auditor' },
  { username: 'boris.perez', password: 'auditor123', name: 'BORIS ENRIQUE PÉREZ PEREIRA', role: 'auditor' },
  { username: 'yennsy.mantilla', password: 'auditor123', name: 'YENNSY NARAY MANTILLA TABARES', role: 'auditor' },
  { username: 'jose.martinez', password: 'auditor123', name: 'JOSÉ ARTURO MARTÍNEZ COGOLLO', role: 'auditor' },
  { username: 'carmen.rugeles', password: 'auditor123', name: 'CARMEN LILIANA RUGELES RAMIREZ', role: 'auditor' }
];

const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, password, name, role) VALUES (?, ?, ?, ?)');
const insertManyUsers = db.transaction((users) => {
  for (const user of users) {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    insertUser.run(user.username, hashedPassword, user.name, user.role);
  }
});
insertManyUsers(defaultUsers);
console.log('✅ Usuarios por defecto creados');

// Insertar casos reales del Excel
console.log('📊 Insertando casos reales del Excel...');

const realCases = [
  // Casos de MARIA JOSE MURILLO URIBE
  { case_id: '900392207-IH-Renta-2025-2022-1', nit: '900392207', taxpayer_name: 'INVERCOM F&M LTDA', program_code: 'IH', tax_type: 'Renta', opening_year: 2025, taxable_year: 2022, period: '1', auditor_id: 3, gestion_perceptiva: 0, status: 'En Notificación', last_action: 'Pliego de Cargos', last_action_date: '2025-04-04', notes: 'PENDIENTE PROFERIR RESOLUCIÓN SANCIÓN' },
  { case_id: '18050626-I1-Renta-2024-2019-1', nit: '18050626', taxpayer_name: 'HENRRY ARMANDO ESPEJO BAOS', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2019, period: '1', auditor_id: 3, gestion_perceptiva: 0, status: 'En Notificación', last_action: 'Auto de Archivo', last_action_date: '2025-09-26', notes: '' },
  { case_id: '800216414-N1-Renta-2025-2020-6', nit: '800216414', taxpayer_name: 'GASEOSAS RIO LTDA', program_code: 'N1', tax_type: 'Renta', opening_year: 2025, taxable_year: 2020, period: '6', auditor_id: 3, gestion_perceptiva: 0, status: 'En Notificación', last_action: 'Liquidación Oficial de Aforo', last_action_date: '2025-07-07', notes: 'EJECUTORIADO 18/09/2025' },
  { case_id: '8150900-OY-Renta-2022-2019-1', nit: '8150900', taxpayer_name: 'IVAN DE JESUS MONSALVE GRANDA', program_code: 'OY', tax_type: 'Renta', opening_year: 2022, taxable_year: 2019, period: '1', auditor_id: 3, gestion_perceptiva: 1, status: 'En Curso', last_action: 'Informe de Gestión por Declaración Presentada', last_action_date: '2024-10-30', notes: 'PROFERIR INFORME FINAL Y AUTO DE ARCHIVO' },
  { case_id: '800216414-N1-Renta-2025-2020-7', nit: '800216414', taxpayer_name: 'GASEOSAS RIO LTDA', program_code: 'N1', tax_type: 'Renta', opening_year: 2025, taxable_year: 2020, period: '7', auditor_id: 3, gestion_perceptiva: 0, status: 'En Notificación', last_action: 'Liquidación Oficial de Aforo', last_action_date: '2025-07-07', notes: 'EJECUTORIADO 18/09/2025' },
  
  // Casos de EDY YOLANDA CALDERON RUALES
  { case_id: '1116432831-I1-Renta-2024-2022-1', nit: '1116432831', taxpayer_name: 'MORANO CUERO WILSON JAVIER', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2022, period: '1', auditor_id: 4, gestion_perceptiva: 0, status: 'En Curso', last_action: 'Emplazamiento para Corregir', last_action_date: '2024-02-06', notes: 'PROFERIR REQUERIMIENTO ESPECIAL' },
  { case_id: '1088536512-I1-Renta-2024-2022-1', nit: '1088536512', taxpayer_name: 'GAVIRIA BERNAL CARLOS MARIO', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2022, period: '1', auditor_id: 4, gestion_perceptiva: 0, status: 'En Curso', last_action: 'Emplazamiento para Corregir', last_action_date: '2024-02-06', notes: 'PROFERIR REQUERIMIENTO ESPECIAL' },
  { case_id: '12189805-I1-Renta-2024-2019-1', nit: '12189805', taxpayer_name: 'CASTILLO TOVAR HECTOR ANGEL', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2019, period: '1', auditor_id: 4, gestion_perceptiva: 0, status: 'En Curso', last_action: 'Auto de Apertura', last_action_date: '2024-12-31', notes: 'PROFERIR REQUERIMIENTO ESPECIAL' },
  { case_id: '901448569-OE-RteFte-2024-2021-5', nit: '901448569', taxpayer_name: 'POWER Y TALENT JJ SAS', program_code: 'OE', tax_type: 'RteFte', opening_year: 2024, taxable_year: 2021, period: '5', auditor_id: 4, gestion_perceptiva: 0, status: 'En Curso', last_action: 'Resolución Sanción por No Declarar', last_action_date: '2025-07-16', notes: 'EN TERMINOS PARA DAR RESPUESTA' },
  { case_id: '838000450-I1-Renta-2024-2023-1', nit: '838000450', taxpayer_name: 'EXPRESOS UNIDOS TRES FRONTERAS', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2023, period: '1', auditor_id: 4, gestion_perceptiva: 0, status: 'En Curso', last_action: 'Auto de Apertura', last_action_date: '2024-12-09', notes: 'PROFERIR REQUERIMIENTO DE INFORMACION' },
  
  // Casos de BORIS ENRIQUE PÉREZ PEREIRA
  { case_id: '41058891-I1-Renta-2024-2019-1', nit: '41058891', taxpayer_name: 'TRIXY HEUMANN PINEDA', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2019, period: '1', auditor_id: 5, gestion_perceptiva: 0, status: 'En Curso', last_action: 'Requerimiento Especial', last_action_date: '2025-09-08', notes: 'Se Corre Vencimiento un Mes' },
  { case_id: '40176200-I1-Renta-2024-2019-1', nit: '40176200', taxpayer_name: 'REINA PINO GLORIA', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2019, period: '1', auditor_id: 5, gestion_perceptiva: 0, status: 'En Curso', last_action: 'Requerimiento Ordinario', last_action_date: '2025-08-12', notes: 'Se amplía término 3 meses porque se profirió auto de inspección tributaria' },
  { case_id: '700018378-I1-Renta-2024-2018-1', nit: '700018378', taxpayer_name: 'PEÑA CAÑAS CARLOS IVAN', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2018, period: '1', auditor_id: 5, gestion_perceptiva: 0, status: 'En Curso', last_action: 'Emplazamiento para Corregir', last_action_date: '2025-06-03', notes: 'Expediente derivado de otra investigación (OY 2018)' },
  { case_id: '79312117-I1-Renta-2024-2021-1', nit: '79312117', taxpayer_name: 'LUIS ALFREDO RODRÍGUEZ PRADA', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2021, period: '1', auditor_id: 5, gestion_perceptiva: 0, status: 'En Curso', last_action: 'Requerimiento Ordinario', last_action_date: '2025-09-16', notes: 'Se amplía término 3 meses porque se profirió auto de inspección tributaria' },
  { case_id: '15888628-OY-Renta-2022-2019-1', nit: '15888628', taxpayer_name: 'JULIO PASCUAL MARTINEZ CRUZ', program_code: 'OY', tax_type: 'Renta', opening_year: 2022, taxable_year: 2019, period: '1', auditor_id: 5, gestion_perceptiva: 1, status: 'En Curso', last_action: 'Liquidación Provisional', last_action_date: '2025-09-29', notes: '' },
  
  // Casos de YENNSY NARAY MANTILLA TABARES
  { case_id: '901083289-I1-Renta-2024-2022-1', nit: '901083289', taxpayer_name: 'TRANSPORTE FLUVIAL DEL AMAZONAS SAS', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2022, period: '1', auditor_id: 6, gestion_perceptiva: 0, status: 'En Curso', last_action: 'Auto de Apertura', last_action_date: '2024-08-07', notes: '' },
  { case_id: '838000252-I1-Renta-2024-2023-1', nit: '838000252', taxpayer_name: 'LINEAS AMAZONAS S.A.S.', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2023, period: '1', auditor_id: 6, gestion_perceptiva: 0, status: 'En Curso', last_action: 'Auto de Apertura', last_action_date: '2025-06-03', notes: '' },
  { case_id: '900763407-DU-Renta-2024-2023-1', nit: '900763407', taxpayer_name: 'FUNDACIÓN HABITATSUR', program_code: 'DU', tax_type: 'Renta', opening_year: 2024, taxable_year: 2023, period: '1', auditor_id: 6, gestion_perceptiva: 0, status: 'En Curso', last_action: 'Auto de Verificación o Cruce', last_action_date: '2025-08-12', notes: '' },
  { case_id: '901372127-I1-Renta-2024-2022-1', nit: '901372127', taxpayer_name: 'COMERCIALIZADORA YAWARAPANA SAS', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2022, period: '1', auditor_id: 6, gestion_perceptiva: 0, status: 'En Curso', last_action: 'Auto de Apertura', last_action_date: '2025-06-03', notes: '' },
  { case_id: '6565838-I1-Renta-2024-2019-1', nit: '6565838', taxpayer_name: 'BELTRÁN FILÓ SIGIFREDO', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2019, period: '1', auditor_id: 6, gestion_perceptiva: 0, status: 'En Curso', last_action: 'Auto de Inspección Tributaria', last_action_date: '2025-08-20', notes: 'Se amplía término 3 meses porque se profirió auto de inspección tributaria' },
  
  // Casos de JOSÉ ARTURO MARTÍNEZ COGOLLO
  { case_id: '901678106-FT-Facturación-2025-2024-1', nit: '901678106', taxpayer_name: 'INVERSIONES NATIVO S.A.S.', program_code: 'FT', tax_type: 'Facturación', opening_year: 2025, taxable_year: 2024, period: '1', auditor_id: 7, gestion_perceptiva: 0, status: 'En Curso', last_action: 'Pliego de Cargos', last_action_date: '2025-09-22', notes: 'En Revision Pliego de Cargos' },
  { case_id: '900142282-FT-Facturación-2025-2024-1', nit: '900142282', taxpayer_name: 'FUNDACION CLINICA LETICIA', program_code: 'FT', tax_type: 'Facturación', opening_year: 2025, taxable_year: 2024, period: '1', auditor_id: 7, gestion_perceptiva: 0, status: 'En Curso', last_action: 'Pliego de Cargos', last_action_date: '2025-09-27', notes: 'En Revision Pliego de Cargos' },
  { case_id: '838000396-FT-Facturación-2025-2024-1', nit: '838000396', taxpayer_name: 'POSSU NOVEDADES', program_code: 'FT', tax_type: 'Facturación', opening_year: 2025, taxable_year: 2024, period: '1', auditor_id: 7, gestion_perceptiva: 0, status: 'En Curso', last_action: 'Pliego de Cargos', last_action_date: '2025-08-28', notes: 'En Revision Pliego de Cargos' },
  
  // Casos de CARMEN LILIANA RUGELES RAMIREZ
  { case_id: '901615824-OE-RteFte-2025-2024-4', nit: '901615824', taxpayer_name: 'CONSORCIO INTERNACIONAL WOC', program_code: 'OE', tax_type: 'RteFte', opening_year: 2025, taxable_year: 2024, period: '4', auditor_id: 8, gestion_perceptiva: 0, status: 'En Curso', last_action: 'Etapa Persuasiva - Llamada Telefónica', last_action_date: '2025-07-09', notes: 'PENDIENTE DAR APERTURA' },
  { case_id: '901615824-OE-RteFte-2025-2024-5', nit: '901615824', taxpayer_name: 'CONSORCIO INTERNACIONAL WOC', program_code: 'OE', tax_type: 'RteFte', opening_year: 2025, taxable_year: 2024, period: '5', auditor_id: 8, gestion_perceptiva: 0, status: 'En Curso', last_action: 'Etapa Persuasiva - Llamada Telefónica', last_action_date: '2025-07-09', notes: 'PENDIENTE DAR APERTURA' },
  { case_id: '901444087-OE-RteFte-2025-2024-2', nit: '901444087', taxpayer_name: 'REPRESENTACIONES LOS MONTAÑEROS SAS', program_code: 'OE', tax_type: 'RteFte', opening_year: 2025, taxable_year: 2024, period: '2', auditor_id: 8, gestion_perceptiva: 0, status: 'En Curso', last_action: 'Etapa Persuasiva - Llamada Telefónica', last_action_date: '2025-07-09', notes: 'PENDIENTE DAR APERTURA' }
];

const insertCase = db.prepare(`
  INSERT OR IGNORE INTO cases (
    case_id, nit, taxpayer_name, program_code, tax_type,
    opening_year, taxable_year, period, auditor_id,
    gestion_perceptiva, status, last_action, last_action_date, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertManyCases = db.transaction((cases) => {
  for (const caseData of cases) {
    insertCase.run(
      caseData.case_id, caseData.nit, caseData.taxpayer_name,
      caseData.program_code, caseData.tax_type, caseData.opening_year,
      caseData.taxable_year, caseData.period, caseData.auditor_id,
      caseData.gestion_perceptiva, caseData.status, caseData.last_action,
      caseData.last_action_date, caseData.notes
    );
  }
});

insertManyCases(realCases);
console.log(`✅ ${realCases.length} casos reales insertados del Excel`);

// Insertar metas para el año actual
const currentYear = new Date().getFullYear();
const goals = programCodes.map(program => ({
  year: currentYear,
  program_code: program.code,
  target_amount: 100000000
}));

const insertGoal = db.prepare('INSERT OR IGNORE INTO goals (year, program_code, target_amount) VALUES (?, ?, ?)');
const insertManyGoals = db.transaction((goalsData) => {
  for (const goal of goalsData) {
    insertGoal.run(goal.year, goal.program_code, goal.target_amount);
  }
});
insertManyGoals(goals);
console.log('✅ Metas del año actual creadas');

db.close();
console.log('\n✅ Base de datos inicializada correctamente');
console.log('\n📝 Credenciales por defecto:');
console.log('   👤 Admin: admin / admin123');
console.log('   👤 Supervisor: supervisor / supervisor123');
console.log('   👤 Auditor: maria.murillo / auditor123');
console.log('\n⚠️  IMPORTANTE: ¡Cambia estas contraseñas en producción!');
console.log('\n📊 Estadísticas:');
console.log(`   - ${realCases.length} casos reales cargados`);
console.log(`   - ${defaultUsers.length} usuarios creados`);
console.log(`   - ${programCodes.length} códigos de programa`);
console.log(`   - ${taxTypes.length} tipos de impuesto`);