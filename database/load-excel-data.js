const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

// Datos reales extraídos del Excel "1Consolidado Cargas de Servicio"
const excelCases = [
  // MARIA JOSE MURILLO URIBE (Cédula: 1094957256)
  { nit: '900392207', taxpayer_name: 'INVERCOM F&M LTDA', program_code: 'IH', tax_type: 'Renta', opening_year: 2025, taxable_year: 2022, period: '1', auditor_name: 'MARIA JOSE MURILLO URIBE', status: 'En Notificación', last_action: 'Pliego de Cargos', last_action_date: '2025-04-04', notes: 'PENDIENTE PROFERIR RESOLUCIÓN SANCIÓN' },
  { nit: '18050626', taxpayer_name: 'HENRRY ARMANDO ESPEJO BAOS', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2019, period: '1', auditor_name: 'MARIA JOSE MURILLO URIBE', status: 'En Notificación', last_action: 'Auto de Archivo', last_action_date: '2025-09-26', notes: '' },
  { nit: '800216414', taxpayer_name: 'GASEOSAS RIO LTDA', program_code: 'N1', tax_type: 'Renta', opening_year: 2025, taxable_year: 2020, period: '6', auditor_name: 'MARIA JOSE MURILLO URIBE', status: 'En Notificación', last_action: 'Liquidación Oficial de Aforo', last_action_date: '2025-07-07', notes: 'EJECUTORIADO 18/09/2025' },
  { nit: '8150900', taxpayer_name: 'IVAN DE JESUS MONSALVE GRANDA', program_code: 'OY', tax_type: 'Renta', opening_year: 2022, taxable_year: 2019, period: '1', auditor_name: 'MARIA JOSE MURILLO URIBE', status: 'En Curso', last_action: 'Informe de Gestión por Declaración Presentada', last_action_date: '2024-10-30', notes: 'PROFERIR INFORME FINAL Y AUTO DE ARCHIVO', gestion_perceptiva: 1 },
  { nit: '800216414', taxpayer_name: 'GASEOSAS RIO LTDA', program_code: 'N1', tax_type: 'Renta', opening_year: 2025, taxable_year: 2020, period: '7', auditor_name: 'MARIA JOSE MURILLO URIBE', status: 'En Notificación', last_action: 'Liquidación Oficial de Aforo', last_action_date: '2025-07-07', notes: 'EJECUTORIADO 18/09/2025' },
  { nit: '52698471', taxpayer_name: 'SILVANA VILLA PEREZ', program_code: 'OY', tax_type: 'Renta', opening_year: 2022, taxable_year: 2019, period: '1', auditor_name: 'MARIA JOSE MURILLO URIBE', status: 'En Notificación', last_action: 'Resolución Sanción por No Declarar', last_action_date: '2025-08-27', notes: 'CONTRIBUYENTE EN TERMINOS PARA INTERPONER RECURSO' },
  { nit: '15889352', taxpayer_name: 'JUAN NAFORO BAUTISTA', program_code: 'OY', tax_type: 'Renta', opening_year: 2022, taxable_year: 2019, period: '1', auditor_name: 'MARIA JOSE MURILLO URIBE', status: 'En Notificación', last_action: 'Liquidación Provisional', last_action_date: '2025-07-07', notes: 'PROFERIR INFORME FINAL Y AUTO DE ARCHIVO' },
  { nit: '800216414', taxpayer_name: 'GASEOSAS RIO LTDA', program_code: 'N1', tax_type: 'Renta', opening_year: 2025, taxable_year: 2020, period: '8', auditor_name: 'MARIA JOSE MURILLO URIBE', status: 'En Notificación', last_action: 'Liquidación Oficial de Aforo', last_action_date: '2025-07-07', notes: 'EJECUTORIADO 18/09/2025' },
  { nit: '1032420750', taxpayer_name: 'DARWIN IVAN VELEZ OROZCO', program_code: 'OY', tax_type: 'Renta', opening_year: 2022, taxable_year: 2019, period: '1', auditor_name: 'MARIA JOSE MURILLO URIBE', status: 'En Notificación', last_action: 'Liquidación Provisional', last_action_date: '2025-09-17', notes: 'CONTRIBUYENTE EN TERMINOS PARA DAR RESPUESTA' },
  { nit: '15886341', taxpayer_name: 'JAIME BARBOSA', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2019, period: '1', auditor_name: 'MARIA JOSE MURILLO URIBE', status: 'En Notificación', last_action: 'Auto Inspección Tributaria', last_action_date: '2025-09-10', notes: '' },
  { nit: '15887244', taxpayer_name: 'RAIMUNDO OROZCO ALVEZ', program_code: 'OY', tax_type: 'Renta', opening_year: 2022, taxable_year: 2019, period: '1', auditor_name: 'MARIA JOSE MURILLO URIBE', status: 'En Notificación', last_action: 'Liquidación Provisional', last_action_date: '2025-09-17', notes: 'CONTRIBUYENTE EN TERMINOS PARA DAR RESPUESTA' },
  { nit: '15889944', taxpayer_name: 'DAVID MARTINEZ PEREIRA', program_code: 'OY', tax_type: 'Renta', opening_year: 2022, taxable_year: 2019, period: '1', auditor_name: 'MARIA JOSE MURILLO URIBE', status: 'En Notificación', last_action: 'Liquidación Provisional', last_action_date: '2025-09-17', notes: 'CONTRIBUYENTE EN TERMINOS PARA DAR RESPUESTA' },
  { nit: '79987039', taxpayer_name: 'PABLO MEDINA DOS SANTOS', program_code: 'OY', tax_type: 'Renta', opening_year: 2022, taxable_year: 2019, period: '1', auditor_name: 'MARIA JOSE MURILLO URIBE', status: 'En Notificación', last_action: 'Liquidación Provisional', last_action_date: '2025-09-23', notes: 'CONTRIBUYENTE EN TERMINOS PARA DAR RESPUESTA' },
  { nit: '800216414', taxpayer_name: 'GASEOSAS RIO LTDA', program_code: 'N1', tax_type: 'Renta', opening_year: 2025, taxable_year: 2020, period: '9', auditor_name: 'MARIA JOSE MURILLO URIBE', status: 'En Notificación', last_action: 'Liquidación Oficial de Aforo', last_action_date: '2025-07-07', notes: 'EJECUTORIADO 19/09/2025' },
  { nit: '79406610', taxpayer_name: 'OLVER ALEXANDER HERRERA DUARTE', program_code: 'OY', tax_type: 'Renta', opening_year: 2022, taxable_year: 2019, period: '1', auditor_name: 'MARIA JOSE MURILLO URIBE', status: 'En Curso', last_action: 'Auto de Apertura', last_action_date: '2022-10-20', notes: 'PROFERIR LIQUIDACION PROVISIONAL' },
  { nit: '1064109203', taxpayer_name: 'EDINSON RODRIGUEZ JULIO', program_code: 'OY', tax_type: 'Renta', opening_year: 2022, taxable_year: 2019, period: '1', auditor_name: 'MARIA JOSE MURILLO URIBE', status: 'En Curso', last_action: 'Informe de Gestión por Declaración Presentada', last_action_date: '2022-10-20', notes: 'PROFERIR INFORME FINAL Y AUTO DE ARCHIVO', gestion_perceptiva: 1 },
  { nit: '17021104', taxpayer_name: 'GUSTAVO ADOLFO NAVIA REYES', program_code: 'OY', tax_type: 'Renta', opening_year: 2022, taxable_year: 2019, period: '1', auditor_name: 'MARIA JOSE MURILLO URIBE', status: 'En Curso', last_action: 'Auto de Apertura', last_action_date: '2022-10-20', notes: 'PROFERIR LIQUIDACION PROVISIONAL' },
  { nit: '800216414', taxpayer_name: 'GASEOSAS RIO LTDA', program_code: 'N1', tax_type: 'Renta', opening_year: 2025, taxable_year: 2020, period: '10', auditor_name: 'MARIA JOSE MURILLO URIBE', status: 'En Notificación', last_action: 'Liquidación Oficial de Aforo', last_action_date: '2025-07-07', notes: 'EJECUTORIADO 19/09/2025' },
  { nit: '900644790', taxpayer_name: 'FUNDACION MALOKA DEL AMAZONAS', program_code: 'DU', tax_type: 'Renta', opening_year: 2025, taxable_year: 2021, period: '1', auditor_name: 'MARIA JOSE MURILLO URIBE', status: 'En Curso', last_action: 'Etapa Persuasiva - Llamada Telefónica', last_action_date: '2025-05-31', notes: 'PROFERIR AUTO DE APERTURA' },
  { nit: '800216414', taxpayer_name: 'GASEOSAS RIO LTDA', program_code: 'N1', tax_type: 'Renta', opening_year: 2025, taxable_year: 2021, period: '1', auditor_name: 'MARIA JOSE MURILLO URIBE', status: 'En Curso', last_action: 'Auto de Apertura', last_action_date: '2025-02-17', notes: 'PROFERIR LIQUIDACIÓN OFICIAL DE AFORO' },
  
  // EDY YOLANDA CALDERON RUALES (Cédula: 30732489)
  { nit: '1116432831', taxpayer_name: 'MORANO CUERO WILSON JAVIER', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2022, period: '1', auditor_name: 'EDY YOLANDA CALDERON RUALES', status: 'En Curso', last_action: 'Emplazamiento para Corregir', last_action_date: '2024-02-06', notes: 'PROFERIR REQUERIMIENTO ESPECIAL' },
  { nit: '1088536512', taxpayer_name: 'GAVIRIA BERNAL CARLOS MARIO', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2022, period: '1', auditor_name: 'EDY YOLANDA CALDERON RUALES', status: 'En Curso', last_action: 'Emplazamiento para Corregir', last_action_date: '2024-02-06', notes: 'PROFERIR REQUERIMIENTO ESPECIAL' },
  { nit: '12189805', taxpayer_name: 'CASTILLO TOVAR HECTOR ANGEL', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2019, period: '1', auditor_name: 'EDY YOLANDA CALDERON RUALES', status: 'En Curso', last_action: 'Auto de Apertura', last_action_date: '2024-12-31', notes: 'PROFERIR REQUERIMIENTO ESPECIAL' },
  { nit: '901448569', taxpayer_name: 'POWER Y TALENT JJ SAS', program_code: 'OE', tax_type: 'RteFte', opening_year: 2024, taxable_year: 2021, period: '5', auditor_name: 'EDY YOLANDA CALDERON RUALES', status: 'En Curso', last_action: 'Resolución Sanción por No Declarar', last_action_date: '2025-07-16', notes: 'EN TERMINOS PARA DAR RESPUESTA' },
  { nit: '901448569', taxpayer_name: 'POWER Y TALENT JJ SAS', program_code: 'OE', tax_type: 'RteFte', opening_year: 2024, taxable_year: 2021, period: '6', auditor_name: 'EDY YOLANDA CALDERON RUALES', status: 'En Curso', last_action: 'Resolución Sanción por No Declarar', last_action_date: '2025-07-16', notes: 'EN TERMINOS PARA DAR RESPUESTA' },
  { nit: '901448569', taxpayer_name: 'POWER Y TALENT JJ SAS', program_code: 'OE', tax_type: 'RteFte', opening_year: 2024, taxable_year: 2021, period: '11', auditor_name: 'EDY YOLANDA CALDERON RUALES', status: 'En Curso', last_action: 'Resolución Sanción por No Declarar', last_action_date: '2025-07-16', notes: 'EN TERMINOS PARA DAR RESPUESTA' },
  { nit: '838000450', taxpayer_name: 'EXPRESOS UNIDOS TRES FRONTERAS', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2023, period: '1', auditor_name: 'EDY YOLANDA CALDERON RUALES', status: 'En Curso', last_action: 'Auto de Apertura', last_action_date: '2024-12-09', notes: 'PROFERIR REQUERIMIENTO DE INFORMACION' },
  { nit: '41058267', taxpayer_name: 'GALVIS BELEÑO LEYLA YADIRA', program_code: 'OY', tax_type: 'Renta', opening_year: 2025, taxable_year: 2019, period: '1', auditor_name: 'EDY YOLANDA CALDERON RUALES', status: 'Evacuado', last_action: 'Resolución de Sanción', last_action_date: '2025-06-03', notes: 'Ejecutoriada el 28/08/2025' },
  { nit: '1032364610', taxpayer_name: 'CUERVO ACOSTA OSCAR ANDRES', program_code: 'I1', tax_type: 'Renta', opening_year: 2021, taxable_year: 2021, period: '1', auditor_name: 'EDY YOLANDA CALDERON RUALES', status: 'En Curso', last_action: 'Auto Inspección Tributaria', last_action_date: '2025-08-06', notes: 'Practicar visita de Inspeccion Tributaria' },
  { nit: '900256694', taxpayer_name: 'PRECOOPERATIVA DE TRABAJO ASOCIADO CENTRAL DE VIAS', program_code: 'DU', tax_type: 'Renta', opening_year: 2021, taxable_year: 2021, period: '1', auditor_name: 'EDY YOLANDA CALDERON RUALES', status: 'En Curso', last_action: 'Requerimiento Ordinario', last_action_date: '2025-03-19', notes: 'EN TERMINOS PARA RESPUESTA' },
  { nit: '1121208266', taxpayer_name: 'CASTILLO MAYARITOMA JUAN DAVID', program_code: 'DI', tax_type: 'Renta', opening_year: 2025, taxable_year: 2023, period: '1', auditor_name: 'EDY YOLANDA CALDERON RUALES', status: 'En Curso', last_action: 'Etapa Persuasiva - Solicitud de Información', last_action_date: '2025-07-23', notes: 'CRUCE DE INFORMACCION CON BANCOS' },
  
  // BORIS ENRIQUE PÉREZ PEREIRA (Cédula: 79718267)
  { nit: '41058891', taxpayer_name: 'TRIXY HEUMANN PINEDA', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2019, period: '1', auditor_name: 'BORIS ENRIQUE PÉREZ PEREIRA', status: 'En Curso', last_action: 'Requerimiento Especial', last_action_date: '2025-09-08', notes: 'Se Corre Vencimiento un Mes' },
  { nit: '40176200', taxpayer_name: 'REINA PINO GLORIA', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2019, period: '1', auditor_name: 'BORIS ENRIQUE PÉREZ PEREIRA', status: 'En Curso', last_action: 'Requerimiento Ordinario', last_action_date: '2025-08-12', notes: 'Se amplía término 3 meses porque se profirió auto de inspección tributaria' },
  { nit: '700018378', taxpayer_name: 'PEÑA CAÑAS CARLOS IVAN', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2018, period: '1', auditor_name: 'BORIS ENRIQUE PÉREZ PEREIRA', status: 'En Curso', last_action: 'Emplazamiento para Corregir', last_action_date: '2025-06-03', notes: 'Expediente derivado de otra investigación (OY 2018)' },
  { nit: '79312117', taxpayer_name: 'LUIS ALFREDO RODRÍGUEZ PRADA', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2021, period: '1', auditor_name: 'BORIS ENRIQUE PÉREZ PEREIRA', status: 'En Curso', last_action: 'Requerimiento Ordinario', last_action_date: '2025-09-16', notes: 'Se amplía término 3 meses porque se profirió auto de inspección tributaria' },
  { nit: '15888628', taxpayer_name: 'JULIO PASCUAL MARTINEZ CRUZ', program_code: 'OY', tax_type: 'Renta', opening_year: 2022, taxable_year: 2019, period: '1', auditor_name: 'BORIS ENRIQUE PÉREZ PEREIRA', status: 'En Curso', last_action: 'Liquidación Provisional', last_action_date: '2025-09-29', notes: '' },
  { nit: '17621766', taxpayer_name: 'JOSE MIGUEL GUTIERREZ', program_code: 'DT', tax_type: 'Renta', opening_year: 2024, taxable_year: 2019, period: '1', auditor_name: 'BORIS ENRIQUE PÉREZ PEREIRA', status: 'En Curso', last_action: 'Requerimiento Especial', last_action_date: '2025-09-19', notes: '' },
  { nit: '80820351', taxpayer_name: 'HENRY ANTONIO VERA DIAZ', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2019, period: '1', auditor_name: 'BORIS ENRIQUE PÉREZ PEREIRA', status: 'En Curso', last_action: 'Requerimiento Ordinario', last_action_date: '2025-07-03', notes: '' },
  { nit: '900584422', taxpayer_name: 'GIRALDO INGENIERIA S.A.S.', program_code: 'BF', tax_type: 'Renta', opening_year: 2022, taxable_year: 2021, period: '1', auditor_name: 'BORIS ENRIQUE PÉREZ PEREIRA', status: 'En Curso', last_action: 'Requerimiento Especial', last_action_date: '2025-08-13', notes: 'Se profirio requerimiento especial, se amplía término máximo de 9 meses.' },
  { nit: '6565838', taxpayer_name: 'BELTRÁN FILÓ SIGIFREDO', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2019, period: '1', auditor_name: 'BORIS ENRIQUE PÉREZ PEREIRA', status: 'En Curso', last_action: 'Auto de Inspección Tributaria', last_action_date: '2025-08-20', notes: 'Se amplía término 3 meses porque se profirió auto de inspección tributaria' },
  
  // YENNSY NARAY MANTILLA TABARES (Cédula: 1098718531)
  { nit: '901083289', taxpayer_name: 'TRANSPORTE FLUVIAL DEL AMAZONAS SAS', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2022, period: '1', auditor_name: 'YENNSY NARAY MANTILLA TABARES', status: 'En Curso', last_action: 'Auto de Apertura', last_action_date: '2024-08-07', notes: '' },
  { nit: '838000252', taxpayer_name: 'LINEAS AMAZONAS S.A.S.', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2023, period: '1', auditor_name: 'YENNSY NARAY MANTILLA TABARES', status: 'En Curso', last_action: 'Auto de Apertura', last_action_date: '2025-06-03', notes: '' },
  { nit: '900763407', taxpayer_name: 'FUNDACIÓN HABITATSUR', program_code: 'DU', tax_type: 'Renta', opening_year: 2024, taxable_year: 2023, period: '1', auditor_name: 'YENNSY NARAY MANTILLA TABARES', status: 'En Curso', last_action: 'Auto de Verificación o Cruce', last_action_date: '2025-08-12', notes: '' },
  { nit: '901372127', taxpayer_name: 'COMERCIALIZADORA YAWARAPANA SAS', program_code: 'I1', tax_type: 'Renta', opening_year: 2024, taxable_year: 2022, period: '1', auditor_name: 'YENNSY NARAY MANTILLA TABARES', status: 'En Curso', last_action: 'Auto de Apertura', last_action_date: '2025-06-03', notes: '' },
  { nit: '901281610', taxpayer_name: 'AMAZONAS GRID ZOMAC S.A.S.', program_code: 'I1', tax_type: 'Renta', opening_year: 2025, taxable_year: 2022, period: '1', auditor_name: 'YENNSY NARAY MANTILLA TABARES', status: 'En Curso', last_action: 'Requerimiento Ordinario de Información', last_action_date: '2025-09-12', notes: '' },
  
  // JOSÉ ARTURO MARTÍNEZ COGOLLO (Cédula: 1039450885)
  { nit: '901678106', taxpayer_name: 'INVERSIONES NATIVO S.A.S.', program_code: 'FT', tax_type: 'Facturación', opening_year: 2025, taxable_year: 2024, period: '1', auditor_name: 'JOSÉ ARTURO MARTÍNEZ COGOLLO', status: 'En Curso', last_action: 'Pliego de Cargos', last_action_date: '2025-09-22', notes: 'En Revision Pliego de Cargos' },
  { nit: '900142282', taxpayer_name: 'FUNDACION CLINICA LETICIA', program_code: 'FT', tax_type: 'Facturación', opening_year: 2025, taxable_year: 2024, period: '1', auditor_name: 'JOSÉ ARTURO MARTÍNEZ COGOLLO', status: 'En Curso', last_action: 'Pliego de Cargos', last_action_date: '2025-09-27', notes: 'En Revision Pliego de Cargos' },
  { nit: '838000396', taxpayer_name: 'POSSU NOVEDADES', program_code: 'FT', tax_type: 'Facturación', opening_year: 2025, taxable_year: 2024, period: '1', auditor_name: 'JOSÉ ARTURO MARTÍNEZ COGOLLO', status: 'En Curso', last_action: 'Pliego de Cargos', last_action_date: '2025-08-28', notes: 'En Revision Pliego de Cargos' },
  
  // CARMEN LILIANA RUGELES RAMIREZ (Cédula: 41055968)
  { nit: '901615824', taxpayer_name: 'CONSORCIO INTERNACIONAL WOC', program_code: 'OE', tax_type: 'RteFte', opening_year: 2025, taxable_year: 2024, period: '4', auditor_name: 'CARMEN LILIANA RUGELES RAMIREZ', status: 'En Curso', last_action: 'Etapa Persuasiva - Llamada Telefónica', last_action_date: '2025-07-09', notes: 'PENDIENTE DAR APERTURA' },
  { nit: '901615824', taxpayer_name: 'CONSORCIO INTERNACIONAL WOC', program_code: 'OE', tax_type: 'RteFte', opening_year: 2025, taxable_year: 2024, period: '5', auditor_name: 'CARMEN LILIANA RUGELES RAMIREZ', status: 'En Curso', last_action: 'Etapa Persuasiva - Llamada Telefónica', last_action_date: '2025-07-09', notes: 'PENDIENTE DAR APERTURA' },
  { nit: '901615824', taxpayer_name: 'CONSORCIO INTERNACIONAL WOC', program_code: 'OE', tax_type: 'RteFte', opening_year: 2025, taxable_year: 2024, period: '7', auditor_name: 'CARMEN LILIANA RUGELES RAMIREZ', status: 'En Curso', last_action: 'Etapa Persuasiva - Llamada Telefónica', last_action_date: '2025-07-10', notes: 'PENDIENTE DAR APERTURA' },
  { nit: '901444087', taxpayer_name: 'REPRESENTACIONES LOS MONTAÑEROS SAS', program_code: 'OE', tax_type: 'RteFte', opening_year: 2025, taxable_year: 2024, period: '2', auditor_name: 'CARMEN LILIANA RUGELES RAMIREZ', status: 'En Curso', last_action: 'Etapa Persuasiva - Llamada Telefónica', last_action_date: '2025-07-09', notes: 'PENDIENTE DAR APERTURA' }
];

// Mapeo de nombres de auditores a IDs
const auditorMapping = {
  'MARIA JOSE MURILLO URIBE': 3,
  'EDY YOLANDA CALDERON RUALES': 4,
  'BORIS ENRIQUE PÉREZ PEREIRA': 5,
  'YENNSY NARAY MANTILLA TABARES': 6,
  'JOSÉ ARTURO MARTÍNEZ COGOLLO': 7,
  'CARMEN LILIANA RUGELES RAMIREZ': 8
};

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database.db');
const db = new Database(dbPath);

console.log('📊 Cargando casos del Excel...');

const insertCase = db.prepare(`
  INSERT OR IGNORE INTO cases (
    case_id, nit, taxpayer_name, program_code, tax_type,
    opening_year, taxable_year, period, auditor_id,
    gestion_perceptiva, status, last_action, last_action_date, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction((cases) => {
  let inserted = 0;
  for (const caseData of cases) {
    const auditorId = auditorMapping[caseData.auditor_name] || 3;
    const caseId = `${caseData.nit}-${caseData.program_code}-${caseData.tax_type}-${caseData.opening_year}-${caseData.taxable_year}-${caseData.period || '1'}`;
    
    try {
      insertCase.run(
        caseId,
        caseData.nit,
        caseData.taxpayer_name,
        caseData.program_code,
        caseData.tax_type,
        caseData.opening_year,
        caseData.taxable_year,
        caseData.period || '1',
        auditorId,
        caseData.gestion_perceptiva || 0,
        caseData.status || 'En Curso',
        caseData.last_action || '',
        caseData.last_action_date || null,
        caseData.notes || ''
      );
      inserted++;
    } catch (error) {
      console.error(`Error insertando caso ${caseId}:`, error.message);
    }
  }
  return inserted;
});

const totalInserted = insertMany(excelCases);

console.log(`✅ ${totalInserted} casos adicionales del Excel insertados`);
console.log('✅ Carga de datos completada');

db.close();