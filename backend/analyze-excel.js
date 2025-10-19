import XLSX from 'xlsx';
import fs from 'fs';

// Read the Excel file
const workbook = XLSX.readFile('../../NUEVAS CARGAS DE SERVICIO INTEGRA-MANUAL SEPTIEMBRE 2025 JEFATURA.xlsx');
const sheetName = workbook.SheetNames[0]; // First sheet
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log('=== EXCEL DATA ANALYSIS ===\n');
console.log('Total rows:', data.length);

// Find header row (row 11 based on Excel structure)
const headerRow = data[10]; // 0-indexed, so row 11 is index 10
console.log('\nHeader Row:', headerRow);

// Extract all cases (starting from row 12)
const cases = [];
const programCodes = new Set();
const taxTypes = new Set();
const auditors = new Set();
const caseStatuses = new Set();
const lastActions = new Set();

for (let i = 11; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 10) continue; // Skip empty rows
    
    const caseData = {
        rowNumber: i + 1,
        no: row[1],
        month: row[2],
        auditorId: row[3],
        auditorName: row[4],
        position: row[5],
        division: row[6],
        git: row[7],
        selectionType: row[8],
        nit: row[9],
        businessName: row[10],
        programCode: row[11], // CODIGO_PROGRAMA
        taxYear: row[12],
        calendarYear: row[13],
        caseNumber: row[14],
        taxType: row[15], // Impuesto
        period: row[16],
        status: row[17],
        lastAction: row[18],
        lastActionDate: row[19],
        notificationDate: row[20],
        assignmentDate: row[21],
        openingDate: row[22],
        reassignmentDate: row[23],
        commitmentDate: row[24],
        dueDate: row[25],
        managementValue: row[26],
        dataSource: row[27],
        observations: row[28]
    };
    
    // Only process rows with valid data
    if (caseData.nit && caseData.businessName) {
        cases.push(caseData);
        
        if (caseData.programCode) programCodes.add(caseData.programCode);
        if (caseData.taxType) taxTypes.add(caseData.taxType);
        if (caseData.auditorName) auditors.add(caseData.auditorName);
        if (caseData.status) caseStatuses.add(caseData.status);
        if (caseData.lastAction) lastActions.add(caseData.lastAction);
    }
}

console.log('\n=== STATISTICS ===');
console.log('Total valid cases:', cases.length);
console.log('Unique program codes:', programCodes.size);
console.log('Unique tax types:', taxTypes.size);
console.log('Unique auditors:', auditors.size);
console.log('Unique case statuses:', caseStatuses.size);
console.log('Unique last actions:', lastActions.size);

console.log('\n=== PROGRAM CODES ===');
console.log(Array.from(programCodes).sort());

console.log('\n=== TAX TYPES ===');
console.log(Array.from(taxTypes).sort());

console.log('\n=== AUDITORS ===');
console.log(Array.from(auditors).sort());

console.log('\n=== CASE STATUSES ===');
console.log(Array.from(caseStatuses).sort());

console.log('\n=== LAST ACTIONS (First 20) ===');
console.log(Array.from(lastActions).sort().slice(0, 20));

// Count cases per auditor
const casesByAuditor = {};
cases.forEach(c => {
    if (c.auditorName) {
        casesByAuditor[c.auditorName] = (casesByAuditor[c.auditorName] || 0) + 1;
    }
});

console.log('\n=== CASES PER AUDITOR ===');
Object.entries(casesByAuditor).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
    console.log(`${name}: ${count} cases`);
});

// Count cases per program code
const casesByProgram = {};
cases.forEach(c => {
    if (c.programCode) {
        casesByProgram[c.programCode] = (casesByProgram[c.programCode] || 0) + 1;
    }
});

console.log('\n=== CASES PER PROGRAM CODE ===');
Object.entries(casesByProgram).sort((a, b) => b[1] - a[1]).forEach(([code, count]) => {
    console.log(`${code}: ${count} cases`);
});

// Save analysis to file
const analysis = {
    totalCases: cases.length,
    programCodes: Array.from(programCodes).sort(),
    taxTypes: Array.from(taxTypes).sort(),
    auditors: Array.from(auditors).sort(),
    caseStatuses: Array.from(caseStatuses).sort(),
    lastActions: Array.from(lastActions).sort(),
    casesByAuditor,
    casesByProgram,
    sampleCases: cases.slice(0, 5)
};

fs.writeFileSync('excel-analysis.json', JSON.stringify(analysis, null, 2));
console.log('\n✓ Analysis saved to excel-analysis.json');

// Save all cases to file
fs.writeFileSync('excel-cases.json', JSON.stringify(cases, null, 2));
console.log('✓ All cases saved to excel-cases.json');