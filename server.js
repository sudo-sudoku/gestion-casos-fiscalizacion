const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'clave-secreta-por-defecto-cambiar';

// Asegurar que existe el directorio de base de datos
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Configuración de base de datos
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'database', 'database.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Función para actualizar metas automáticamente
const updateGoals = (programCode, year = new Date().getFullYear()) => {
  try {
    // Calcular el monto total de gestión para el programa y año
    const result = db.prepare(`
      SELECT COALESCE(SUM(gestion_amount), 0) as total
      FROM cases
      WHERE program_code = ? AND opening_year = ?
    `).get(programCode, year);

    // Actualizar la meta
    db.prepare(`
      UPDATE goals
      SET achieved_amount = ?, updated_at = CURRENT_TIMESTAMP
      WHERE program_code = ? AND year = ?
    `).run(result.total, programCode, year);

    console.log(`✅ Meta actualizada para ${programCode} (${year}): ${result.total}`);
  } catch (error) {
    console.error('Error al actualizar metas:', error);
  }
};

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user;
    next();
  });
};

// Middleware de autorización por roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tiene permisos para esta acción' });
    }
    next();
  };
};

// ==================== RUTAS DE AUTENTICACIÓN ====================

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Obtener usuario actual
app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, name, role FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ==================== RUTAS DE CASOS ====================

// Obtener todos los casos con filtros
app.get('/api/cases', authenticateToken, (req, res) => {
  try {
    const { search, program, tax_type, auditor, status, gestion_perceptiva } = req.query;
    
    let query = 'SELECT * FROM cases WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (case_id LIKE ? OR taxpayer_name LIKE ? OR nit LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    if (program) {
      query += ' AND program_code = ?';
      params.push(program);
    }

    if (tax_type) {
      query += ' AND tax_type = ?';
      params.push(tax_type);
    }

    if (auditor) {
      query += ' AND auditor_id = ?';
      params.push(auditor);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (gestion_perceptiva !== undefined) {
      query += ' AND gestion_perceptiva = ?';
      params.push(gestion_perceptiva === 'true' ? 1 : 0);
    }

    // Si el usuario es auditor, solo mostrar sus casos
    if (req.user.role === 'auditor') {
      query += ' AND auditor_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY created_at DESC';

    const cases = db.prepare(query).all(...params);
    res.json(cases);
  } catch (error) {
    console.error('Error al obtener casos:', error);
    res.status(500).json({ error: 'Error al obtener casos' });
  }
});

// Obtener un caso específico
app.get('/api/cases/:id', authenticateToken, (req, res) => {
  try {
    const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
    
    if (!caseData) {
      return res.status(404).json({ error: 'Caso no encontrado' });
    }

    // Verificar permisos
    if (req.user.role === 'auditor' && caseData.auditor_id !== req.user.id) {
      return res.status(403).json({ error: 'No tiene permisos para ver este caso' });
    }

    res.json(caseData);
  } catch (error) {
    console.error('Error al obtener caso:', error);
    res.status(500).json({ error: 'Error al obtener caso' });
  }
});

// Crear nuevo caso
app.post('/api/cases', authenticateToken, authorizeRoles('admin', 'supervisor'), (req, res) => {
  try {
    const {
      case_id, nit, taxpayer_name, program_code, tax_type,
      opening_year, taxable_year, period, auditor_id,
      gestion_perceptiva, status, last_action, last_action_date, notes
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO cases (
        case_id, nit, taxpayer_name, program_code, tax_type,
        opening_year, taxable_year, period, auditor_id,
        gestion_perceptiva, status, last_action, last_action_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      case_id, nit, taxpayer_name, program_code, tax_type,
      opening_year, taxable_year, period, auditor_id,
      gestion_perceptiva ? 1 : 0, status || 'Activo', last_action || '',
      last_action_date || null, notes || ''
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Caso creado exitosamente' });
      
      // Actualizar metas automáticamente
      if (program_code && opening_year) {
        updateGoals(program_code, opening_year);
      }
  } catch (error) {
    console.error('Error al crear caso:', error);
    res.status(500).json({ error: 'Error al crear caso: ' + error.message });
  }
});

// Actualizar caso
app.put('/api/cases/:id', authenticateToken, (req, res) => {
  try {
    const caseData = db.prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id);
    
    if (!caseData) {
      return res.status(404).json({ error: 'Caso no encontrado' });
    }

    // Verificar permisos
    if (req.user.role === 'auditor' && caseData.auditor_id !== req.user.id) {
      return res.status(403).json({ error: 'No tiene permisos para editar este caso' });
    }

    const {
      taxpayer_name, program_code, tax_type, opening_year,
      taxable_year, period, auditor_id, gestion_perceptiva,
      status, last_action, last_action_date, notes
    } = req.body;

    const stmt = db.prepare(`
      UPDATE cases SET
        taxpayer_name = ?, program_code = ?, tax_type = ?,
        opening_year = ?, taxable_year = ?, period = ?,
        auditor_id = ?, gestion_perceptiva = ?, status = ?,
        last_action = ?, last_action_date = ?, notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      taxpayer_name, program_code, tax_type, opening_year,
      taxable_year, period, auditor_id, gestion_perceptiva ? 1 : 0,
      status, last_action || '', last_action_date || null, notes || '',
      req.params.id
    );

      
      // Actualizar metas automáticamente
      if (program_code && opening_year) {
        updateGoals(program_code, opening_year);
      }
    res.json({ message: 'Caso actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar caso:', error);
    res.status(500).json({ error: 'Error al actualizar caso' });
  }
});

// Eliminar caso
app.delete('/api/cases/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM cases WHERE id = ?');
    const result = stmt.run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Caso no encontrado' });
    }

    res.json({ message: 'Caso eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar caso:', error);
    res.status(500).json({ error: 'Error al eliminar caso' });
  }
});

// Carga masiva de casos
app.post('/api/cases/bulk', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    const { cases } = req.body;

    if (!Array.isArray(cases) || cases.length === 0) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    const stmt = db.prepare(`
      INSERT INTO cases (
        case_id, nit, taxpayer_name, program_code, tax_type,
        opening_year, taxable_year, period, auditor_id,
        gestion_perceptiva, status, last_action, last_action_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((casesData) => {
      for (const caseData of casesData) {
        stmt.run(
          caseData.case_id, caseData.nit, caseData.taxpayer_name,
          caseData.program_code, caseData.tax_type, caseData.opening_year,
          caseData.taxable_year, caseData.period, caseData.auditor_id,
          caseData.gestion_perceptiva ? 1 : 0, caseData.status || 'Activo',
          caseData.last_action || '', caseData.last_action_date || null,
          caseData.notes || ''
        );
      }
    });

    insertMany(cases);

    res.json({ message: `${cases.length} casos cargados exitosamente` });
  } catch (error) {
    console.error('Error en carga masiva:', error);
    res.status(500).json({ error: 'Error al cargar casos' });
  }
});

// ==================== RUTAS DE ACTOS ADMINISTRATIVOS ====================

// Obtener actos de un caso
app.get('/api/cases/:caseId/acts', authenticateToken, (req, res) => {
  try {
    const acts = db.prepare('SELECT * FROM administrative_acts WHERE case_id = ? ORDER BY act_date DESC').all(req.params.caseId);
    res.json(acts);
  } catch (error) {
    console.error('Error al obtener actos:', error);
    res.status(500).json({ error: 'Error al obtener actos administrativos' });
  }
});

// Crear acto administrativo
app.post('/api/cases/:caseId/acts', authenticateToken, (req, res) => {
  try {
    const { act_type, act_number, act_date, amount, description } = req.body;

    const stmt = db.prepare(`
      INSERT INTO administrative_acts (case_id, act_type, act_number, act_date, amount, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(req.params.caseId, act_type, act_number, act_date, amount || 0, description || '');

    res.status(201).json({ id: result.lastInsertRowid, message: 'Acto administrativo creado exitosamente' });
  } catch (error) {
    console.error('Error al crear acto:', error);
    res.status(500).json({ error: 'Error al crear acto administrativo' });
  }
});

// ==================== RUTAS DE USUARIOS ====================

// Obtener todos los usuarios
app.get('/api/users', authenticateToken, authorizeRoles('admin', 'supervisor'), (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, name, role, created_at FROM users ORDER BY name').all();
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Obtener solo auditores
app.get('/api/users/auditors', authenticateToken, (req, res) => {
  try {
    const auditors = db.prepare("SELECT id, username, name FROM users WHERE role = 'auditor' ORDER BY name").all();
    res.json(auditors);
  } catch (error) {
    console.error('Error al obtener auditores:', error);
    res.status(500).json({ error: 'Error al obtener auditores' });
  }
});

// Crear usuario
app.post('/api/users', authenticateToken, authorizeRoles('admin'), (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    const hashedPassword = bcrypt.hashSync(password, 10);

    const stmt = db.prepare('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)');
    const result = stmt.run(username, hashedPassword, name, role);

    res.status(201).json({ id: result.lastInsertRowid, message: 'Usuario creado exitosamente' });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// ==================== RUTAS DE REPORTES ====================

// Reporte de inventario
app.get('/api/reports/inventory', authenticateToken, (req, res) => {
  try {
    const report = db.prepare(`
      SELECT 
        program_code,
        COUNT(*) as total_cases,
        SUM(CASE WHEN gestion_perceptiva = 1 THEN 1 ELSE 0 END) as gestion_perceptiva_count,
        SUM(CASE WHEN status = 'Activo' OR status = 'En Curso' THEN 1 ELSE 0 END) as active_cases,
        SUM(CASE WHEN status = 'Cerrado' OR status = 'Evacuado' THEN 1 ELSE 0 END) as closed_cases
      FROM cases
      GROUP BY program_code
      ORDER BY program_code
    `).all();

    res.json(report);
  } catch (error) {
    console.error('Error en reporte de inventario:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// Reporte por programa
app.get('/api/reports/by-program', authenticateToken, (req, res) => {
  try {
    const { program } = req.query;
    
    let query = `
      SELECT 
        c.*,
        u.name as auditor_name,
        COALESCE(SUM(aa.amount), 0) as total_amount
      FROM cases c
      LEFT JOIN users u ON c.auditor_id = u.id
      LEFT JOIN administrative_acts aa ON c.id = aa.case_id
    `;

    const params = [];
    if (program) {
      query += ' WHERE c.program_code = ?';
      params.push(program);
    }

    query += ' GROUP BY c.id ORDER BY c.case_id';

    const report = db.prepare(query).all(...params);
    res.json(report);
  } catch (error) {
    console.error('Error en reporte por programa:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// Reporte de desempeño de auditores
app.get('/api/reports/auditor-performance', authenticateToken, (req, res) => {
  try {
    const report = db.prepare(`
      SELECT 
        u.id,
        u.name as auditor_name,
        COUNT(c.id) as total_cases,
        SUM(CASE WHEN c.gestion_perceptiva = 1 THEN 1 ELSE 0 END) as gestion_perceptiva_count,
        SUM(CASE WHEN c.status = 'Activo' OR c.status = 'En Curso' THEN 1 ELSE 0 END) as active_cases,
        SUM(CASE WHEN c.status = 'Cerrado' OR c.status = 'Evacuado' THEN 1 ELSE 0 END) as closed_cases,
        COALESCE(SUM(aa.amount), 0) as total_amount
      FROM users u
      LEFT JOIN cases c ON u.id = c.auditor_id
      LEFT JOIN administrative_acts aa ON c.id = aa.case_id
      WHERE u.role = 'auditor'
      GROUP BY u.id, u.name
      ORDER BY u.name
    `).all();

    res.json(report);
  } catch (error) {
    console.error('Error en reporte de auditores:', error);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// Estadísticas del dashboard
app.get('/api/reports/dashboard', authenticateToken, (req, res) => {
  try {
    const stats = {
      total_cases: db.prepare('SELECT COUNT(*) as count FROM cases').get().count,
      active_cases: db.prepare("SELECT COUNT(*) as count FROM cases WHERE status IN ('Activo', 'En Curso')").get().count,
      closed_cases: db.prepare("SELECT COUNT(*) as count FROM cases WHERE status IN ('Cerrado', 'Evacuado')").get().count,
      gestion_perceptiva: db.prepare('SELECT COUNT(*) as count FROM cases WHERE gestion_perceptiva = 1').get().count,
      total_auditors: db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'auditor'").get().count,
      total_amount: db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM administrative_acts').get().total
    };

    res.json(stats);
  } catch (error) {
    console.error('Error en estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// ==================== RUTAS DE DATOS DE REFERENCIA ====================

// Obtener códigos de programa
app.get('/api/reference/programs', authenticateToken, (req, res) => {
  try {
    const programs = db.prepare('SELECT * FROM program_codes ORDER BY code').all();
    res.json(programs);
  } catch (error) {
    console.error('Error al obtener programas:', error);
    res.status(500).json({ error: 'Error al obtener programas' });
  }
});

// Obtener tipos de impuesto
app.get('/api/reference/tax-types', authenticateToken, (req, res) => {
  try {
    const taxTypes = db.prepare('SELECT * FROM tax_types ORDER BY name').all();
    res.json(taxTypes);
  } catch (error) {
    console.error('Error al obtener tipos de impuesto:', error);
    res.status(500).json({ error: 'Error al obtener tipos de impuesto' });
  }
});

// ==================== VERIFICACIÓN DE SALUD ====================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Servir el frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor DIAN Leticia corriendo en puerto ${PORT}`);
  console.log(`📊 Base de datos: ${dbPath}`);
  console.log(`🔐 JWT Secret configurado: ${JWT_SECRET !== 'clave-secreta-por-defecto-cambiar' ? 'Sí' : 'No (usando default)'}`);
  console.log(`🌐 Acceso: http://localhost:${PORT}`);
  console.log(`\n✅ Sistema listo para usar\n`);
});

// Cierre graceful
process.on('SIGINT', () => {
  db.close();
  console.log('\n👋 Base de datos cerrada. Servidor detenido.');
  process.exit(0);
});