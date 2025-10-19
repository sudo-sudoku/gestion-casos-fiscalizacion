import Database from 'better-sqlite3';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const db = new Database('../database/fiscalizacion-v3.db');

console.log('=== IMPORTING REAL DATA FROM EXCEL ===\n');

// Read the analyzed data
const cases = JSON.parse(fs.readFileSync('excel-cases.json', 'utf8'));
const analysis = JSON.parse(fs.readFileSync('excel-analysis.json', 'utf8'));

console.log(`Found ${cases.length} cases to import`);
console.log(`Found ${analysis.auditors.length} auditors`);

// Create tables from schema
const schema = fs.readFileSync('schema-v3.sql', 'utf8');
const statements = schema.split(';').filter(s => s.trim());

console.log('\n1. Creating database schema...');
statements.forEach(stmt => {
    if (stmt.trim()) {
        try {
            db.exec(stmt);
        } catch (err) {
            // Ignore errors for existing tables
        }
    }
});
console.log('✓ Schema created');

// Insert real auditors from Excel
console.log('\n2. Inserting auditors...');
const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, password, full_name, role)
    VALUES (?, ?, ?, ?)
`);

const auditorMap = {};
let auditorId = 1;

// Add admin user
const adminPassword = bcrypt.hashSync('admin123', 10);
insertUser.run('admin', adminPassword, 'Administrador Sistema', 'Administrador');
console.log('✓ Admin user created');

// Add supervisor user
const supervisorPassword = bcrypt.hashSync('supervisor123', 10);
insertUser.run('supervisor', supervisorPassword, 'Supervisor General', 'Supervisor');
console.log('✓ Supervisor user created');

// Add real auditors from Excel
analysis.auditors.forEach(auditorName => {
    const username = auditorName.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]/g, '') // Remove special chars
        .substring(0, 20);
    
    const password = bcrypt.hashSync('auditor123', 10);
    
    try {
        insertUser.run(username, password, auditorName, 'Auditor');
        auditorId++;
        console.log(`✓ Auditor: ${auditorName} (username: ${username})`);
    } catch (err) {
        console.log(`  Skipped duplicate: ${auditorName}`);
    }
});

// Get auditor IDs
const getAuditorId = db.prepare('SELECT id, full_name FROM users WHERE role = ?');
const auditors = getAuditorId.all('Auditor');
auditors.forEach(auditor => {
    auditorMap[auditor.full_name] = auditor.id;
});

console.log(`\n✓ Total auditors in database: ${auditors.length}`);

// Insert real cases from Excel
console.log('\n3. Inserting cases from Excel...');
const insertCase = db.prepare(`
    INSERT OR IGNORE INTO cases (
        case_id, nit, business_name, program_code, tax_type,
        opening_year, tax_year, period, calculation_type, status, auditor_id,
        opening_date, gestion_perceptiva, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let importedCases = 0;
let skippedCases = 0;

cases.forEach((caseData, index) => {
    // Skip cases without essential data
    if (!caseData.nit || !caseData.businessName || !caseData.programCode) {
        skippedCases++;
        return;
    }
    
    // Get auditor ID
    const auditorId = auditorMap[caseData.auditorName];
    if (!auditorId) {
        console.log(`Warning: Auditor not found for case ${index + 1}: ${caseData.auditorName}`);
        skippedCases++;
        return;
    }
    
    // Generate case_id in correct format: NIT-PROGRAM_CODE-TAX_TYPE-OPENING_YEAR-TAX_YEAR-PERIOD
    const openingYear = caseData.calendarYear || caseData.taxYear || 2025;
    const caseId = `${caseData.nit}-${caseData.programCode}-${caseData.taxType || 'Renta'}-${openingYear}-${caseData.taxYear}-${caseData.period || 1}`;
    
    // Determine calculation type based on case data
    let calculationType = 'Determinación';
    if (caseData.lastAction && caseData.lastAction.toLowerCase().includes('sanción')) {
        calculationType = 'Sanción';
    }
    
    // Map Excel status to system status
    let status = 'En Curso';
    if (caseData.status) {
        if (caseData.status.includes('Evacuado')) status = 'Cerrado';
        else if (caseData.status.includes('Archivo')) status = 'Archivado';
        else if (caseData.status.includes('Curso')) status = 'En Curso';
        else status = 'Abierto';
    }
    
    // Check if it's gestión perceptiva (Etapa Persuasiva)
    const gestionPerceptiva = (caseData.status && caseData.status.includes('Etapa Persuasiva')) ? 1 : 0;
    
    // Use opening date or assignment date
    const openingDate = caseData.openingDate || caseData.assignmentDate || '2025-01-01';
    
    try {
        insertCase.run(
            caseId,
            caseData.nit,
            caseData.businessName,
            caseData.programCode,
            caseData.taxType || 'Renta',
            openingYear,
            caseData.taxYear || 2024,
            caseData.period || 1,
            calculationType,
            status,
            auditorId,
            openingDate,
            gestionPerceptiva,
            caseData.observations || ''
        );
        importedCases++;
        
        if (importedCases % 50 === 0) {
            console.log(`  Imported ${importedCases} cases...`);
        }
    } catch (err) {
        console.log(`  Error importing case ${caseId}: ${err.message}`);
        skippedCases++;
    }
});

console.log(`\n✓ Imported ${importedCases} cases`);
console.log(`  Skipped ${skippedCases} cases`);

// Insert administrative acts for cases with last actions
console.log('\n4. Inserting administrative acts...');
const insertAct = db.prepare(`
    INSERT INTO administrative_acts (case_id, act_type_id, act_date, description, auto_tracked)
    VALUES (?, ?, ?, ?, ?)
`);

const getCaseId = db.prepare('SELECT id FROM cases WHERE case_id = ?');
const getActTypeId = db.prepare('SELECT id, contributes_to_goal FROM administrative_act_types WHERE name = ?');

let importedActs = 0;

cases.forEach(caseData => {
    if (!caseData.lastAction || !caseData.nit || !caseData.programCode) return;
    
    const caseId = `${caseData.nit}-${caseData.programCode}-${caseData.taxType || 'RENTA'}-${caseData.taxYear}-${caseData.period || 1}`;
    const caseRecord = getCaseId.get(caseId);
    
    if (!caseRecord) return;
    
    // Try to match the last action to an administrative act type
    const actType = getActTypeId.get(caseData.lastAction);
    
    if (actType) {
        const actDate = caseData.lastActionDate || caseData.openingDate || '2025-09-01';
        const autoTracked = actType.contributes_to_goal ? 1 : 0;
        
        try {
            insertAct.run(
                caseRecord.id,
                actType.id,
                actDate,
                `Acto registrado desde Excel: ${caseData.lastAction}`,
                autoTracked
            );
            importedActs++;
        } catch (err) {
            // Ignore duplicates
        }
    }
});

console.log(`✓ Imported ${importedActs} administrative acts`);

// Generate statistics
console.log('\n5. Generating statistics...');
const stats = {
    totalCases: db.prepare('SELECT COUNT(*) as count FROM cases').get().count,
    totalAuditors: db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('Auditor').count,
    casesByProgram: db.prepare(`
        SELECT program_code, COUNT(*) as count 
        FROM cases 
        GROUP BY program_code 
        ORDER BY count DESC
    `).all(),
    casesByAuditor: db.prepare(`
        SELECT u.full_name, COUNT(c.id) as count 
        FROM users u 
        LEFT JOIN cases c ON u.id = c.auditor_id 
        WHERE u.role = 'Auditor'
        GROUP BY u.id 
        ORDER BY count DESC
    `).all(),
    casesByStatus: db.prepare(`
        SELECT status, COUNT(*) as count 
        FROM cases 
        GROUP BY status 
        ORDER BY count DESC
    `).all(),
    gestionPerceptivaCases: db.prepare('SELECT COUNT(*) as count FROM cases WHERE gestion_perceptiva = 1').get().count
};

console.log('\n=== IMPORT SUMMARY ===');
console.log(`Total Cases: ${stats.totalCases}`);
console.log(`Total Auditors: ${stats.totalAuditors}`);
console.log(`Gestión Perceptiva Cases: ${stats.gestionPerceptivaCases}`);

console.log('\nCases by Program Code:');
stats.casesByProgram.forEach(row => {
    console.log(`  ${row.program_code}: ${row.count} cases`);
});

console.log('\nCases by Auditor:');
stats.casesByAuditor.forEach(row => {
    console.log(`  ${row.full_name}: ${row.count} cases`);
});

console.log('\nCases by Status:');
stats.casesByStatus.forEach(row => {
    console.log(`  ${row.status}: ${row.count} cases`);
});

console.log('\n✓ Data import completed successfully!');
console.log('\nLogin credentials:');
console.log('  Admin: admin / admin123');
console.log('  Supervisor: supervisor / supervisor123');
console.log('  Auditors: [username from name] / auditor123');

db.close();