import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear base de datos
const db = new Database(path.join(__dirname, 'fiscalizacion.db'));

console.log('📊 Inicializando base de datos...');

// Leer y ejecutar schema
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

console.log('✅ Tablas creadas exitosamente');

// Insertar usuarios de ejemplo
console.log('👥 Creando usuarios de ejemplo...');

const passwordHash = bcrypt.hashSync('admin123', 10);

const insertUser = db.prepare(`
    INSERT INTO usuarios (nombre, email, password_hash, rol, activo)
    VALUES (?, ?, ?, ?, 1)
`);

try {
    insertUser.run('Administrador Sistema', 'admin@dian.gov.co', passwordHash, 'Administrador');
    insertUser.run('Supervisor Principal', 'supervisor@dian.gov.co', passwordHash, 'Supervisor');
    insertUser.run('Auditor Fiscal 1', 'auditor1@dian.gov.co', passwordHash, 'Auditor');
    insertUser.run('Auditor Fiscal 2', 'auditor2@dian.gov.co', passwordHash, 'Auditor');
    console.log('✅ Usuarios creados exitosamente');
} catch (error) {
    console.log('ℹ️  Usuarios ya existen en la base de datos');
}

// Insertar datos de ejemplo para expedientes
console.log('📁 Creando expedientes de ejemplo...');

const insertExpediente = db.prepare(`
    INSERT INTO expedientes (
        expediente_id, nit, razon_social, codigo_investigacion, impuesto,
        ano_gravable, ano_calendario, periodo, auditor_asignado_id,
        supervisor_asignado_id, estado_expediente, fecha_inicio,
        fecha_vencimiento, prioridad
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

try {
    insertExpediente.run(
        '900123456-001-RENTA-2024-2023-01',
        '900123456',
        'EMPRESA EJEMPLO S.A.S.',
        '001',
        'RENTA',
        '2023',
        '2024',
        '01',
        3, // auditor1
        2, // supervisor
        'Abierto',
        '2024-01-15',
        '2024-12-31',
        'Alta'
    );

    insertExpediente.run(
        '800234567-002-IVA-2024-2024-03',
        '800234567',
        'COMERCIALIZADORA XYZ LTDA',
        '002',
        'IVA',
        '2024',
        '2024',
        '03',
        4, // auditor2
        2, // supervisor
        'En Proceso',
        '2024-03-01',
        '2024-09-30',
        'Media'
    );

    console.log('✅ Expedientes de ejemplo creados');
} catch (error) {
    console.log('ℹ️  Expedientes de ejemplo ya existen');
}

// Insertar metas de ejemplo
console.log('🎯 Creando metas de ejemplo...');

const insertMeta = db.prepare(`
    INSERT INTO metas_gestion (
        auditor_id, tipo_meta, periodo_tipo, fecha_inicio, fecha_fin, valor_meta
    ) VALUES (?, ?, ?, ?, ?, ?)
`);

try {
    // Metas para Auditor 1
    insertMeta.run(3, 'DECLARACIONES_CORRECCIONES', 'Mensual', '2024-01-01', '2024-01-31', 50000000);
    insertMeta.run(3, 'ACTOS_ADMINISTRATIVOS', 'Mensual', '2024-01-01', '2024-01-31', 30000000);
    insertMeta.run(3, 'RECAUDO', 'Mensual', '2024-01-01', '2024-01-31', 20000000);
    insertMeta.run(3, 'CIERRES', 'Mensual', '2024-01-01', '2024-01-31', 2);

    // Metas para Auditor 2
    insertMeta.run(4, 'DECLARACIONES_CORRECCIONES', 'Mensual', '2024-01-01', '2024-01-31', 50000000);
    insertMeta.run(4, 'ACTOS_ADMINISTRATIVOS', 'Mensual', '2024-01-01', '2024-01-31', 30000000);
    insertMeta.run(4, 'RECAUDO', 'Mensual', '2024-01-01', '2024-01-31', 20000000);
    insertMeta.run(4, 'CIERRES', 'Mensual', '2024-01-01', '2024-01-31', 2);

    console.log('✅ Metas de ejemplo creadas');
} catch (error) {
    console.log('ℹ️  Metas de ejemplo ya existen');
}

console.log('\n🎉 Base de datos inicializada correctamente!');
console.log('\n📝 Credenciales de acceso:');
console.log('   Administrador: admin@dian.gov.co / admin123');
console.log('   Supervisor: supervisor@dian.gov.co / admin123');
console.log('   Auditor 1: auditor1@dian.gov.co / admin123');
console.log('   Auditor 2: auditor2@dian.gov.co / admin123');

db.close();