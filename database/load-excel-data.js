const Database = require('better-sqlite3');
const ExcelJS = require('exceljs');
const path = require('path');

// Ruta de la base de datos
const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

// Ruta del archivo Excel
const excelPath = path.join(__dirname, '..', '..', 'NUEVAS CARGAS DE SERVICIO INTEGRA-MANUAL SEPTIEMBRE 2025 JEFATURA.xlsx');

console.log('📊 Cargando casos del Excel...\n');

async function loadExcelData() {
    try {
        // Leer el archivo Excel
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(excelPath);
        
        // Obtener la primera hoja
        const worksheet = workbook.getWorksheet('1Consolidado Cargas de Servicio');
        
        if (!worksheet) {
            throw new Error('No se encontró la hoja "1Consolidado Cargas de Servicio"');
        }

        // Preparar statement para insertar casos
        const insertCase = db.prepare(`
            INSERT INTO cases (
                case_id, nit, taxpayer_name, program_code, tax_type,
                opening_year, taxable_year, period, status,
                last_action, last_action_date, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `);

        let casesInserted = 0;
        let errors = 0;

        // Procesar todas las filas (empezando desde la fila 12, que es donde empiezan los datos)
        // La fila 11 es el encabezado
        for (let rowNumber = 12; rowNumber <= worksheet.rowCount; rowNumber++) {
            const row = worksheet.getRow(rowNumber);
            
            // Verificar si la fila tiene datos (columna B - No.)
            const numeroFila = row.getCell(2).value;
            if (!numeroFila) continue; // Saltar filas vacías

            try {
                // Extraer datos de las columnas
                const nit = row.getCell(10).value?.toString() || '';
                const razonSocial = row.getCell(11).value?.toString() || '';
                const codigoInvestigacion = row.getCell(12).value?.toString() || '';
                const anoGravable = row.getCell(13).value?.toString() || '';
                const anoCalendario = row.getCell(14).value?.toString() || '';
                const consecutivo = row.getCell(15).value?.toString() || '';
                const impuesto = row.getCell(16).value?.toString() || '';
                const periodo = row.getCell(17).value?.toString() || '';
                const estadoRaw = row.getCell(18).value?.toString() || '';
                
                // Mapear estados del Excel a estados válidos en la BD
                let estado = 'Activo';
                if (estadoRaw.includes('Evacuado')) {
                    estado = 'Evacuado';
                } else if (estadoRaw.includes('Notificación')) {
                    estado = 'En Notificación';
                } else if (estadoRaw.includes('Cerrado') || estadoRaw.includes('Cerrada')) {
                    estado = 'Cerrado';
                } else if (estadoRaw.includes('Suspendido')) {
                    estado = 'Suspendido';
                } else if (estadoRaw.includes('Curso')) {
                    estado = 'En Curso';
                } else {
                    estado = 'Activo';
                }
                const ultimaAccion = row.getCell(19).value?.toString() || '';
                const fechaUltimaAccion = row.getCell(20).value;
                const fechaAsignacion = row.getCell(22).value;
                const fechaApertura = row.getCell(23).value;
                const fechaVencimiento = row.getCell(26).value;
                const observaciones = row.getCell(29).value?.toString() || '';
                const nombreFuncionario = row.getCell(5).value?.toString() || '';

                // Validar que al menos tenga NIT y razón social
                if (!nit || !razonSocial) continue;
                
                // Validar que el código de programa exista, si no, usar uno por defecto
                const programExists = db.prepare('SELECT code FROM program_codes WHERE code = ?').get(codigoInvestigacion);
                const finalProgramCode = programExists ? codigoInvestigacion : 'OT';
                
                // Validar que el tipo de impuesto exista, si no, usar uno por defecto
                const taxExists = db.prepare('SELECT name FROM tax_types WHERE name = ?').get(impuesto);
                const finalTaxType = taxExists ? impuesto : 'Otros';

                // Generar número de caso único
                let caseNumber = consecutivo || `CASO-${anoCalendario}-${String(numeroFila).padStart(4, '0')}`;
                
                // Verificar si el case_id ya existe
                const existingCase = db.prepare('SELECT id FROM cases WHERE case_id = ?').get(caseNumber);
                if (existingCase) {
                    // Si existe, agregar un sufijo único
                    caseNumber = `${caseNumber}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                }

                // Formatear fechas
                const formatDate = (date) => {
                    if (!date) return null;
                    if (date instanceof Date) {
                        return date.toISOString().split('T')[0];
                    }
                    if (typeof date === 'string') {
                        // Intentar parsear la fecha
                        const parsed = new Date(date);
                        if (!isNaN(parsed.getTime())) {
                            return parsed.toISOString().split('T')[0];
                        }
                    }
                    return null;
                };

                // Insertar el caso
                insertCase.run(
                    caseNumber,
                    nit,
                    razonSocial,
                    finalProgramCode,
                    finalTaxType,
                    parseInt(anoCalendario) || new Date().getFullYear(),
                    parseInt(anoGravable) || new Date().getFullYear(),
                    periodo,
                    estado,
                    ultimaAccion,
                    formatDate(fechaUltimaAccion),
                    observaciones
                );

                casesInserted++;
            } catch (error) {
                errors++;
                console.error(`❌ Error en fila ${rowNumber}:`, error.message);
            }
        }

        console.log(`\n✅ Proceso completado:`);
        console.log(`   📊 Casos insertados: ${casesInserted}`);
        if (errors > 0) {
            console.log(`   ⚠️  Errores: ${errors}`);
        }

    } catch (error) {
        console.error('❌ Error al cargar datos del Excel:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Ejecutar la carga
loadExcelData().catch(console.error);