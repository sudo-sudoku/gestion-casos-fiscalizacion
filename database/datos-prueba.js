import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Abrir base de datos existente
const db = new Database(path.join(__dirname, 'fiscalizacion.db'));

console.log('📊 Insertando datos de prueba completos...');

// Obtener IDs de usuarios
const admin = db.prepare('SELECT id FROM usuarios WHERE email = ?').get('admin@dian.gov.co');
const supervisor = db.prepare('SELECT id FROM usuarios WHERE email = ?').get('supervisor@dian.gov.co');
const auditor1 = db.prepare('SELECT id FROM usuarios WHERE email = ?').get('auditor1@dian.gov.co');
const auditor2 = db.prepare('SELECT id FROM usuarios WHERE email = ?').get('auditor2@dian.gov.co');

// Limpiar datos anteriores de prueba (excepto usuarios)
console.log('🧹 Limpiando datos anteriores...');
db.prepare('DELETE FROM pagos490').run();
db.prepare('DELETE FROM gestiones').run();
db.prepare('DELETE FROM actuaciones').run();
db.prepare('DELETE FROM cierres_establecimiento').run();
db.prepare('DELETE FROM expedientes').run();
db.prepare('DELETE FROM metas_gestion').run();

// ==================== EXPEDIENTES DE PRUEBA ====================
console.log('📁 Creando expedientes de prueba...');

const insertExpediente = db.prepare(`
    INSERT INTO expedientes (
        expediente_id, nit, razon_social, codigo_investigacion, impuesto,
        ano_gravable, ano_calendario, periodo, auditor_asignado_id,
        supervisor_asignado_id, estado_expediente, fecha_inicio,
        fecha_vencimiento, prioridad, observaciones
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Expedientes para Auditor 1
const exp1 = insertExpediente.run(
    '900123456-001-RENTA-2024-2023-01',
    '900123456',
    'DISTRIBUIDORA LA ESPERANZA S.A.S.',
    '001',
    'RENTA',
    '2023',
    '2024',
    '01',
    auditor1.id,
    supervisor.id,
    'En Proceso',
    '2024-01-15',
    '2024-12-31',
    'Alta',
    'Caso de corrección de declaración de renta con diferencias significativas'
);

const exp2 = insertExpediente.run(
    '800234567-002-IVA-2024-2024-03',
    '800234567',
    'COMERCIALIZADORA ANDINA LTDA',
    '002',
    'IVA',
    '2024',
    '2024',
    '03',
    auditor1.id,
    supervisor.id,
    'Abierto',
    '2024-03-01',
    '2024-09-30',
    'Media',
    'Presentación omiso de IVA tercer bimestre'
);

const exp3 = insertExpediente.run(
    '700345678-003-RENTA-2024-2022-01',
    '700345678',
    'INVERSIONES DEL SUR S.A.',
    '003',
    'RENTA',
    '2022',
    '2024',
    '01',
    auditor1.id,
    supervisor.id,
    'En Proceso',
    '2024-02-10',
    '2024-11-30',
    'Alta',
    'Liquidación oficial de revisión por inconsistencias en costos'
);

// Expedientes para Auditor 2
const exp4 = insertExpediente.run(
    '600456789-004-IVA-2024-2024-02',
    '600456789',
    'TEXTILES AMAZONAS S.A.S.',
    '004',
    'IVA',
    '2024',
    '2024',
    '02',
    auditor2.id,
    supervisor.id,
    'Abierto',
    '2024-02-20',
    '2024-10-15',
    'Media',
    'Corrección de IVA segundo bimestre'
);

const exp5 = insertExpediente.run(
    '500567890-005-RENTA-2024-2023-01',
    '500567890',
    'AGROINDUSTRIAS DEL PUTUMAYO LTDA',
    '005',
    'RENTA',
    '2023',
    '2024',
    '01',
    auditor2.id,
    supervisor.id,
    'En Proceso',
    '2024-01-25',
    '2024-12-20',
    'Alta',
    'Liquidación de aforo por no presentar declaración'
);

const exp6 = insertExpediente.run(
    '400678901-006-RETEFUENTE-2024-2024-04',
    '400678901',
    'SERVICIOS PROFESIONALES DEL AMAZONAS S.A.S.',
    '006',
    'RETEFUENTE',
    '2024',
    '2024',
    '04',
    auditor2.id,
    supervisor.id,
    'Abierto',
    '2024-04-05',
    '2024-08-30',
    'Baja',
    'Resolución sanción por no declarar retención en la fuente'
);

console.log(`✅ ${exp1.lastInsertRowid} expedientes creados`);

// ==================== GESTIONES DE PRUEBA ====================
console.log('💰 Creando gestiones de prueba...');

const insertGestion = db.prepare(`
    INSERT INTO gestiones (
        expediente_id, tipo_gestion, fecha_gestion,
        impuesto_original, saldo_pagar_original, saldo_favor_original,
        perdida_liquida_original, renta_liquida_original,
        impuesto_corregido, saldo_pagar_corregido, saldo_favor_corregido,
        perdida_liquida_corregida, renta_liquida_corregida,
        diferencia_impuesto, diferencia_saldo_pagar, diferencia_saldo_favor,
        monto_sancion, intereses, tasa_impuesto_renta,
        valor_meta, explicacion_calculo, observaciones
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// GESTIÓN 1: Corrección Declaración - Expediente 1 (Auditor 1)
// Caso: Aumento en saldo a pagar
const gest1 = insertGestion.run(
    exp1.lastInsertRowid,
    'Corrección Declaración',
    '2024-03-15',
    45000000, // impuesto_original
    8000000,  // saldo_pagar_original
    0,        // saldo_favor_original
    0,        // perdida_liquida_original
    120000000, // renta_liquida_original
    52000000, // impuesto_corregido
    15000000, // saldo_pagar_corregido
    0,        // saldo_favor_corregido
    0,        // perdida_liquida_corregida
    135000000, // renta_liquida_corregida
    7000000,  // diferencia_impuesto
    7000000,  // diferencia_saldo_pagar (15M - 8M)
    0,        // diferencia_saldo_favor
    0,        // monto_sancion
    0,        // intereses
    0.35,     // tasa_impuesto_renta
    7000000,  // valor_meta
    'Mayor valor entre: Diferencia Saldo a Pagar ($7.000.000) y Diferencia Saldo a Favor ($0) = $7.000.000',
    'Corrección por omisión de ingresos en declaración de renta'
);

// GESTIÓN 2: Presentación Omiso - Expediente 2 (Auditor 1)
// Caso: Con saldo a pagar
const gest2 = insertGestion.run(
    exp2.lastInsertRowid,
    'Presentación Omiso',
    '2024-04-10',
    0,        // impuesto_original
    0,        // saldo_pagar_original
    0,        // saldo_favor_original
    0,        // perdida_liquida_original
    0,        // renta_liquida_original
    12000000, // impuesto_corregido
    12000000, // saldo_pagar_corregido
    0,        // saldo_favor_corregido
    0,        // perdida_liquida_corregida
    0,        // renta_liquida_corregida
    0,        // diferencia_impuesto
    0,        // diferencia_saldo_pagar
    0,        // diferencia_saldo_favor
    0,        // monto_sancion
    1800000,  // intereses (15% del saldo)
    0.35,     // tasa_impuesto_renta
    13800000, // valor_meta (12M + 1.8M)
    'Saldo a Pagar ($12.000.000) + Intereses ($1.800.000) = $13.800.000',
    'Contribuyente presentó declaración después de ser declarado omiso'
);

// GESTIÓN 3: Liquidación Oficial de Revisión - Expediente 3 (Auditor 1)
// Caso: Disminución de pérdida líquida
const gest3 = insertGestion.run(
    exp3.lastInsertRowid,
    'Liquidación Oficial de Revisión',
    '2024-05-20',
    0,        // impuesto_original
    0,        // saldo_pagar_original
    0,        // saldo_favor_original
    50000000, // perdida_liquida_original
    0,        // renta_liquida_original
    0,        // impuesto_corregido
    0,        // saldo_pagar_corregido
    0,        // saldo_favor_corregido
    30000000, // perdida_liquida_corregida (disminuyó 20M)
    0,        // renta_liquida_corregida
    0,        // diferencia_impuesto
    0,        // diferencia_saldo_pagar
    0,        // diferencia_saldo_favor
    0,        // monto_sancion
    0,        // intereses
    0.35,     // tasa_impuesto_renta
    7000000,  // valor_meta (20M × 35%)
    'Disminución Pérdida Líquida ($20.000.000) × Tasa (35%) = $7.000.000',
    'DIAN determinó que algunos costos no eran deducibles'
);

// GESTIÓN 4: Corrección Declaración - Expediente 4 (Auditor 2)
// Caso: Disminución de saldo a favor
const gest4 = insertGestion.run(
    exp4.lastInsertRowid,
    'Corrección Declaración',
    '2024-04-25',
    8500000,  // impuesto_original
    0,        // saldo_pagar_original
    2000000,  // saldo_favor_original
    0,        // perdida_liquida_original
    0,        // renta_liquida_original
    8500000,  // impuesto_corregido
    0,        // saldo_pagar_corregido
    500000,   // saldo_favor_corregido (disminuyó 1.5M)
    0,        // perdida_liquida_corregida
    0,        // renta_liquida_corregida
    0,        // diferencia_impuesto
    0,        // diferencia_saldo_pagar
    1500000,  // diferencia_saldo_favor (2M - 0.5M)
    0,        // monto_sancion
    0,        // intereses
    0.35,     // tasa_impuesto_renta
    1500000,  // valor_meta
    'Mayor valor entre: Diferencia Saldo a Pagar ($0) y Diferencia Saldo a Favor ($1.500.000) = $1.500.000',
    'Corrección de IVA descontable no procedente'
);

// GESTIÓN 5: Liquidación de Aforo - Expediente 5 (Auditor 2)
// Caso: Con saldo a pagar
const gest5 = insertGestion.run(
    exp5.lastInsertRowid,
    'Liquidación de Aforo',
    '2024-06-05',
    0,        // impuesto_original
    0,        // saldo_pagar_original
    0,        // saldo_favor_original
    0,        // perdida_liquida_original
    0,        // renta_liquida_original
    25000000, // impuesto_corregido
    25000000, // saldo_pagar_corregido
    0,        // saldo_favor_corregido
    0,        // perdida_liquida_corregida
    0,        // renta_liquida_corregida
    0,        // diferencia_impuesto
    0,        // diferencia_saldo_pagar
    0,        // diferencia_saldo_favor
    0,        // monto_sancion
    3750000,  // intereses (15% del saldo)
    0.35,     // tasa_impuesto_renta
    28750000, // valor_meta (25M + 3.75M)
    'Saldo a Pagar ($25.000.000) + Intereses ($3.750.000) = $28.750.000',
    'DIAN liquidó oficialmente al contribuyente omiso'
);

// GESTIÓN 6: Resolución Sanción - Expediente 6 (Auditor 2)
const gest6 = insertGestion.run(
    exp6.lastInsertRowid,
    'Resolución Sanción',
    '2024-07-10',
    0,        // impuesto_original
    0,        // saldo_pagar_original
    0,        // saldo_favor_original
    0,        // perdida_liquida_original
    0,        // renta_liquida_original
    0,        // impuesto_corregido
    0,        // saldo_pagar_corregido
    0,        // saldo_favor_corregido
    0,        // perdida_liquida_corregida
    0,        // renta_liquida_corregida
    0,        // diferencia_impuesto
    0,        // diferencia_saldo_pagar
    0,        // diferencia_saldo_favor
    5000000,  // monto_sancion
    0,        // intereses
    0.35,     // tasa_impuesto_renta
    5000000,  // valor_meta
    'Monto de Sanción Impuesta: $5.000.000',
    'Sanción por no presentar declaración de retención en la fuente'
);

// GESTIÓN 7: Pagos 490 - Expediente 1 (Auditor 1)
const gest7 = insertGestion.run(
    exp1.lastInsertRowid,
    'Pagos 490',
    '2024-08-15',
    0,        // impuesto_original
    0,        // saldo_pagar_original
    0,        // saldo_favor_original
    0,        // perdida_liquida_original
    0,        // renta_liquida_original
    0,        // impuesto_corregido
    3500000,  // saldo_pagar_corregido (monto del pago)
    0,        // saldo_favor_corregido
    0,        // perdida_liquida_corregida
    0,        // renta_liquida_corregida
    0,        // diferencia_impuesto
    0,        // diferencia_saldo_pagar
    0,        // diferencia_saldo_favor
    0,        // monto_sancion
    0,        // intereses
    0.35,     // tasa_impuesto_renta
    3500000,  // valor_meta
    'Monto del Pago: $3.500.000',
    'Pago parcial de la corrección de declaración'
);

// GESTIÓN 8: Corrección Declaración - Expediente 3 (Auditor 1)
// Caso: Aumento de renta líquida
const gest8 = insertGestion.run(
    exp3.lastInsertRowid,
    'Corrección Declaración',
    '2024-09-01',
    35000000, // impuesto_original
    0,        // saldo_pagar_original
    0,        // saldo_favor_original
    0,        // perdida_liquida_original
    100000000, // renta_liquida_original
    42000000, // impuesto_corregido
    7000000,  // saldo_pagar_corregido
    0,        // saldo_favor_corregido
    0,        // perdida_liquida_corregida
    120000000, // renta_liquida_corregida (aumentó 20M)
    7000000,  // diferencia_impuesto
    7000000,  // diferencia_saldo_pagar
    0,        // diferencia_saldo_favor
    0,        // monto_sancion
    0,        // intereses
    0.35,     // tasa_impuesto_renta
    7000000,  // valor_meta (20M × 35%)
    'Aumento Renta Líquida ($20.000.000) × Tasa (35%) = $7.000.000',
    'Contribuyente corrigió después de la liquidación oficial'
);

console.log(`✅ ${gest8.lastInsertRowid} gestiones creadas`);

// ==================== ACTUALIZAR METAS ====================
console.log('🎯 Actualizando metas...');

// Función para actualizar metas
function actualizarMeta(auditorId, tipoMeta, valor) {
    const stmt = db.prepare(`
        UPDATE metas_gestion
        SET valor_acumulado = valor_acumulado + ?,
            porcentaje_cumplimiento = (valor_acumulado + ?) * 100.0 / valor_meta,
            ultima_actualizacion = CURRENT_TIMESTAMP
        WHERE auditor_id = ?
        AND tipo_meta = ?
        AND date('now') BETWEEN fecha_inicio AND fecha_fin
    `);
    stmt.run(valor, valor, auditorId, tipoMeta);
}

// Actualizar metas para Auditor 1
actualizarMeta(auditor1.id, 'DECLARACIONES_CORRECCIONES', 7000000);  // Gestión 1
actualizarMeta(auditor1.id, 'DECLARACIONES_CORRECCIONES', 13800000); // Gestión 2
actualizarMeta(auditor1.id, 'ACTOS_ADMINISTRATIVOS', 7000000);       // Gestión 3
actualizarMeta(auditor1.id, 'RECAUDO', 3500000);                     // Gestión 7
actualizarMeta(auditor1.id, 'DECLARACIONES_CORRECCIONES', 7000000);  // Gestión 8

// Actualizar metas para Auditor 2
actualizarMeta(auditor2.id, 'DECLARACIONES_CORRECCIONES', 1500000);  // Gestión 4
actualizarMeta(auditor2.id, 'ACTOS_ADMINISTRATIVOS', 28750000);      // Gestión 5
actualizarMeta(auditor2.id, 'ACTOS_ADMINISTRATIVOS', 5000000);       // Gestión 6

console.log('✅ Metas actualizadas');

// ==================== PAGOS 490 ====================
console.log('💵 Creando pagos 490...');

const insertPago = db.prepare(`
    INSERT INTO pagos490 (gestion_id, numero_recibo, fecha_pago, monto_pago, tipo_pago, observaciones)
    VALUES (?, ?, ?, ?, ?, ?)
`);

insertPago.run(gest7.lastInsertRowid, '490-2024-001', '2024-08-15', 3500000, 'Pago Parcial', 'Primer abono a la deuda');

console.log('✅ Pagos 490 creados');

// ==================== ACTUACIONES ====================
console.log('📋 Creando actuaciones administrativas...');

const insertActuacion = db.prepare(`
    INSERT INTO actuaciones (
        expediente_id, tipo_actuacion, numero_acto, fecha_acto,
        es_resolucion_sancion, implica_cierre, observaciones
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertActuacion.run(
    exp1.lastInsertRowid,
    'Requerimiento Ordinario',
    'RO-2024-001',
    '2024-02-01',
    0, 0,
    'Requerimiento inicial para corrección de declaración'
);

insertActuacion.run(
    exp3.lastInsertRowid,
    'Liquidación Oficial',
    'LO-2024-003',
    '2024-05-20',
    0, 0,
    'Liquidación oficial de revisión notificada'
);

insertActuacion.run(
    exp6.lastInsertRowid,
    'Resolución Sanción',
    'RS-2024-006',
    '2024-07-10',
    1, 0,
    'Resolución sanción por no declarar'
);

console.log('✅ Actuaciones creadas');

// ==================== RESUMEN ====================
console.log('\n📊 RESUMEN DE DATOS DE PRUEBA:');
console.log('═══════════════════════════════════════════════════════════');

const resumen = {
    expedientes: db.prepare('SELECT COUNT(*) as count FROM expedientes').get().count,
    gestiones: db.prepare('SELECT COUNT(*) as count FROM gestiones').get().count,
    actuaciones: db.prepare('SELECT COUNT(*) as count FROM actuaciones').get().count,
    pagos: db.prepare('SELECT COUNT(*) as count FROM pagos490').get().count,
};

console.log(`📁 Expedientes: ${resumen.expedientes}`);
console.log(`💰 Gestiones: ${resumen.gestiones}`);
console.log(`📋 Actuaciones: ${resumen.actuaciones}`);
console.log(`💵 Pagos 490: ${resumen.pagos}`);

// Resumen por auditor
console.log('\n👤 RESUMEN POR AUDITOR:');
console.log('───────────────────────────────────────────────────────────');

const auditor1Stats = db.prepare(`
    SELECT 
        COUNT(DISTINCT e.id) as expedientes,
        COUNT(g.id) as gestiones,
        COALESCE(SUM(g.valor_meta), 0) as valor_total
    FROM expedientes e
    LEFT JOIN gestiones g ON e.id = g.expediente_id
    WHERE e.auditor_asignado_id = ?
`).get(auditor1.id);

console.log(`\nAuditor 1 (auditor1@dian.gov.co):`);
console.log(`  Expedientes: ${auditor1Stats.expedientes}`);
console.log(`  Gestiones: ${auditor1Stats.gestiones}`);
console.log(`  Valor Total: $${auditor1Stats.valor_total.toLocaleString('es-CO')}`);

const auditor2Stats = db.prepare(`
    SELECT 
        COUNT(DISTINCT e.id) as expedientes,
        COUNT(g.id) as gestiones,
        COALESCE(SUM(g.valor_meta), 0) as valor_total
    FROM expedientes e
    LEFT JOIN gestiones g ON e.id = g.expediente_id
    WHERE e.auditor_asignado_id = ?
`).get(auditor2.id);

console.log(`\nAuditor 2 (auditor2@dian.gov.co):`);
console.log(`  Expedientes: ${auditor2Stats.expedientes}`);
console.log(`  Gestiones: ${auditor2Stats.gestiones}`);
console.log(`  Valor Total: $${auditor2Stats.valor_total.toLocaleString('es-CO')}`);

// Resumen de metas
console.log('\n🎯 RESUMEN DE METAS:');
console.log('───────────────────────────────────────────────────────────');

const metas = db.prepare(`
    SELECT 
        u.nombre as auditor,
        m.tipo_meta,
        m.valor_meta,
        m.valor_acumulado,
        m.porcentaje_cumplimiento
    FROM metas_gestion m
    JOIN usuarios u ON m.auditor_id = u.id
    ORDER BY u.nombre, m.tipo_meta
`).all();

metas.forEach(meta => {
    console.log(`\n${meta.auditor} - ${meta.tipo_meta}:`);
    console.log(`  Meta: $${meta.valor_meta.toLocaleString('es-CO')}`);
    console.log(`  Acumulado: $${meta.valor_acumulado.toLocaleString('es-CO')}`);
    console.log(`  Cumplimiento: ${meta.porcentaje_cumplimiento.toFixed(2)}%`);
});

console.log('\n═══════════════════════════════════════════════════════════');
console.log('🎉 Datos de prueba insertados exitosamente!');
console.log('═══════════════════════════════════════════════════════════\n');

db.close();