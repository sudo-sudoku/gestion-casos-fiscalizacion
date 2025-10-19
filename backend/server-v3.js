import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import ExcelJS from 'exceljs';

const app = express();
const db = new Database('../database/fiscalizacion-v3.db');
const JWT_SECRET = 'your-secret-key-change-in-production';

app.use(cors());
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static('../frontend'));

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.json({
        token,
        user: {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            role: user.role
        }
    });
});

// ============================================================================
// USER MANAGEMENT ENDPOINTS
// ============================================================================

app.get('/api/users', authenticateToken, (req, res) => {
    if (req.user.role !== 'Administrador' && req.user.role !== 'Supervisor') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    const users = db.prepare('SELECT id, username, full_name, role, created_at FROM users').all();
    res.json(users);
});

app.post('/api/users', authenticateToken, (req, res) => {
    if (req.user.role !== 'Administrador') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    const { username, password, full_name, role } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    try {
        const result = db.prepare(`
            INSERT INTO users (username, password, full_name, role)
            VALUES (?, ?, ?, ?)
        `).run(username, hashedPassword, full_name, role);

        res.json({ id: result.lastInsertRowid, message: 'Usuario creado exitosamente' });
    } catch (error) {
        res.status(400).json({ error: 'Error al crear usuario: ' + error.message });
    }
});

app.put('/api/users/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'Administrador') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    const { id } = req.params;
    const { username, full_name, role, password } = req.body;

    try {
        if (password) {
            const hashedPassword = bcrypt.hashSync(password, 10);
            db.prepare(`
                UPDATE users 
                SET username = ?, full_name = ?, role = ?, password = ?
                WHERE id = ?
            `).run(username, full_name, role, hashedPassword, id);
        } else {
            db.prepare(`
                UPDATE users 
                SET username = ?, full_name = ?, role = ?
                WHERE id = ?
            `).run(username, full_name, role, id);
        }

        res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (error) {
        res.status(400).json({ error: 'Error al actualizar usuario: ' + error.message });
    }
});

app.delete('/api/users/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'Administrador') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    const { id } = req.params;

    try {
        db.prepare('DELETE FROM users WHERE id = ?').run(id);
        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        res.status(400).json({ error: 'Error al eliminar usuario: ' + error.message });
    }
});

// ============================================================================
// PROGRAM CODES & TAX TYPES ENDPOINTS (NEW)
// ============================================================================

app.get('/api/program-codes', authenticateToken, (req, res) => {
    const codes = db.prepare('SELECT * FROM program_codes WHERE active = 1 ORDER BY code').all();
    res.json(codes);
});

app.get('/api/tax-types', authenticateToken, (req, res) => {
    const types = db.prepare('SELECT * FROM tax_types WHERE active = 1 ORDER BY name').all();
    res.json(types);
});

app.get('/api/administrative-act-types', authenticateToken, (req, res) => {
    const types = db.prepare('SELECT * FROM administrative_act_types WHERE active = 1 ORDER BY name').all();
    res.json(types);
});

// ============================================================================
// CASES ENDPOINTS (ENHANCED)
// ============================================================================

app.get('/api/cases', authenticateToken, (req, res) => {
    let query = `
        SELECT c.*, u.full_name as auditor_name, u.role as auditor_role
        FROM cases c
        JOIN users u ON c.auditor_id = u.id
    `;

    const conditions = [];
    const params = [];

    // Filter by auditor for Auditor role
    if (req.user.role === 'Auditor') {
        conditions.push('c.auditor_id = ?');
        params.push(req.user.id);
    }

    // Filter by program code
    if (req.query.program_code) {
        conditions.push('c.program_code = ?');
        params.push(req.query.program_code);
    }

    // Filter by status
    if (req.query.status) {
        conditions.push('c.status = ?');
        params.push(req.query.status);
    }

    // Filter by gestión perceptiva
    if (req.query.gestion_perceptiva !== undefined) {
        conditions.push('c.gestion_perceptiva = ?');
        params.push(req.query.gestion_perceptiva === 'true' ? 1 : 0);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY c.created_at DESC';

    const cases = db.prepare(query).all(...params);
    res.json(cases);
});

app.get('/api/cases/:id', authenticateToken, (req, res) => {
    const caseData = db.prepare(`
        SELECT c.*, u.full_name as auditor_name
        FROM cases c
        JOIN users u ON c.auditor_id = u.id
        WHERE c.id = ?
    `).get(req.params.id);

    if (!caseData) {
        return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    // Get administrative acts
    const acts = db.prepare(`
        SELECT aa.*, aat.name as act_type_name, aat.contributes_to_goal
        FROM administrative_acts aa
        JOIN administrative_act_types aat ON aa.act_type_id = aat.id
        WHERE aa.case_id = ?
        ORDER BY aa.act_date DESC
    `).all(req.params.id);

    // Get monetary actions
    const monetaryActions = db.prepare(`
        SELECT * FROM monetary_actions
        WHERE case_id = ?
        ORDER BY action_date DESC
    `).all(req.params.id);

    // Get payments
    const payments = db.prepare(`
        SELECT * FROM payments
        WHERE case_id = ?
        ORDER BY payment_date DESC
    `).all(req.params.id);

    res.json({
        ...caseData,
        administrative_acts: acts,
        monetary_actions: monetaryActions,
        payments: payments
    });
});

app.post('/api/cases', authenticateToken, (req, res) => {
    const {
        nit, business_name, program_code, tax_type, opening_year, tax_year, period,
        calculation_type, auditor_id, opening_date, gestion_perceptiva,
        gestion_perceptiva_date, gestion_perceptiva_notes, notes
    } = req.body;

    // Generate case_id: NIT-PROGRAM_CODE-TAX_TYPE-OPENING_YEAR-TAX_YEAR-PERIOD
    const case_id = `${nit}-${program_code}-${tax_type}-${opening_year}-${tax_year}-${period}`;

    try {
        const result = db.prepare(`
            INSERT INTO cases (
                case_id, nit, business_name, program_code, tax_type,
                opening_year, tax_year, period, calculation_type, auditor_id, opening_date,
                gestion_perceptiva, gestion_perceptiva_date, gestion_perceptiva_notes, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            case_id, nit, business_name, program_code, tax_type,
            opening_year, tax_year, period, calculation_type, auditor_id, opening_date,
            gestion_perceptiva || 0, gestion_perceptiva_date, gestion_perceptiva_notes, notes
        );

        res.json({ id: result.lastInsertRowid, case_id, message: 'Expediente creado exitosamente' });
    } catch (error) {
        res.status(400).json({ error: 'Error al crear expediente: ' + error.message });
    }
});

app.put('/api/cases/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const {
        status, closing_date, gestion_perceptiva, gestion_perceptiva_date,
        gestion_perceptiva_notes, notes
    } = req.body;

    try {
        db.prepare(`
            UPDATE cases 
            SET status = ?, closing_date = ?, gestion_perceptiva = ?,
                gestion_perceptiva_date = ?, gestion_perceptiva_notes = ?,
                notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(status, closing_date, gestion_perceptiva, gestion_perceptiva_date,
               gestion_perceptiva_notes, notes, id);

        res.json({ message: 'Expediente actualizado exitosamente' });
    } catch (error) {
        res.status(400).json({ error: 'Error al actualizar expediente: ' + error.message });
    }
});

// ============================================================================
// ADMINISTRATIVE ACTS ENDPOINTS (NEW)
// ============================================================================

app.post('/api/cases/:caseId/administrative-acts', authenticateToken, (req, res) => {
    const { caseId } = req.params;
    const { act_type_id, act_date, notification_date, description, amount } = req.body;

    try {
        // Check if act type contributes to goal
        const actType = db.prepare('SELECT contributes_to_goal, goal_type FROM administrative_act_types WHERE id = ?').get(act_type_id);
        const autoTracked = actType && actType.contributes_to_goal ? 1 : 0;

        const result = db.prepare(`
            INSERT INTO administrative_acts (case_id, act_type_id, act_date, notification_date, description, amount, auto_tracked)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(caseId, act_type_id, act_date, notification_date, description, amount || 0, autoTracked);

        // If auto-tracked, update goals
        if (autoTracked) {
            updateGoalsFromAct(caseId, actType.goal_type, amount || 0);
        }

        res.json({ id: result.lastInsertRowid, message: 'Actuación administrativa registrada exitosamente' });
    } catch (error) {
        res.status(400).json({ error: 'Error al registrar actuación: ' + error.message });
    }
});

// Helper function to update goals from administrative acts
function updateGoalsFromAct(caseId, goalType, amount) {
    // Get case details
    const caseData = db.prepare('SELECT auditor_id, tax_year FROM cases WHERE id = ?').get(caseId);
    if (!caseData) return;

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    // Determine goal type for goals table
    let dbGoalType = 'determinacion';
    if (goalType === 'liquidacion_sancion_cierre') {
        dbGoalType = 'sancion';
    }

    // Update or create goal
    try {
        db.prepare(`
            INSERT INTO goals (year, month, auditor_id, goal_type, target_amount, achieved_amount)
            VALUES (?, ?, ?, ?, 0, ?)
            ON CONFLICT(year, month, auditor_id, goal_type) 
            DO UPDATE SET achieved_amount = achieved_amount + ?
        `).run(year, month, caseData.auditor_id, dbGoalType, amount, amount);
    } catch (error) {
        console.error('Error updating goals:', error);
    }
}

// ============================================================================
// EXECUTIVE REPORTS ENDPOINTS (NEW)
// ============================================================================

app.get('/api/reports/inventory', authenticateToken, (req, res) => {
    const { year, month, auditor_id } = req.query;

    // Generar reporte de inventario dinámicamente basado en casos reales
    let query = `
        WITH case_movements AS (
            SELECT 
                c.program_code,
                c.auditor_id,
                u.full_name as auditor_name,
                pc.description as program_description,
                CASE 
                    WHEN strftime('%Y', c.opening_date) < ? AND strftime('%m', c.opening_date) < ? THEN 1
                    ELSE 0
                END as is_initial_inventory,
                CASE 
                    WHEN strftime('%Y', c.opening_date) = ? AND strftime('%m', c.opening_date) = ? THEN 1
                    ELSE 0
                END as is_assigned,
                CASE 
                    WHEN c.closing_date IS NOT NULL 
                    AND strftime('%Y', c.closing_date) = ? 
                    AND strftime('%m', c.closing_date) = ? THEN 1
                    ELSE 0
                END as is_evacuated
            FROM cases c
            JOIN users u ON c.auditor_id = u.id
            JOIN program_codes pc ON c.program_code = pc.code
            WHERE 1=1
    `;

    const params = [];
    const reportYear = year || new Date().getFullYear();
    const reportMonth = month || new Date().getMonth() + 1;
    
    // Parámetros para la consulta (año, mes repetidos para cada CASE)
    params.push(reportYear, reportMonth, reportYear, reportMonth, reportYear, reportMonth);

    if (auditor_id) {
        query += ' AND c.auditor_id = ?';
        params.push(auditor_id);
    }

    query += `
        )
        SELECT 
            program_code as codigo,
            auditor_name as auditor,
            program_description as descripcion_programa,
            SUM(is_initial_inventory) as inventario_inicial,
            SUM(is_assigned) as asignados_reasignados,
            SUM(is_evacuated) as evacuados_reasignados,
            (SUM(is_initial_inventory) + SUM(is_assigned) - SUM(is_evacuated)) as inventario_final
        FROM case_movements
        GROUP BY program_code, auditor_id, auditor_name, program_description
        ORDER BY auditor_name, program_code
    `;

    try {
        const inventory = db.prepare(query).all(...params);
        
        // Calcular totales
        const totals = {
            codigo: 'TOTAL',
            auditor: 'TODOS',
            descripcion_programa: 'TOTAL GENERAL',
            inventario_inicial: inventory.reduce((sum, row) => sum + row.inventario_inicial, 0),
            asignados_reasignados: inventory.reduce((sum, row) => sum + row.asignados_reasignados, 0),
            evacuados_reasignados: inventory.reduce((sum, row) => sum + row.evacuados_reasignados, 0),
            inventario_final: inventory.reduce((sum, row) => sum + row.inventario_final, 0)
        };

        res.json({
            year: reportYear,
            month: reportMonth,
            data: inventory,
            totals: totals
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al generar reporte: ' + error.message });
    }
});

app.get('/api/reports/cases-by-program', authenticateToken, (req, res) => {
    const { year, month } = req.query;

    let query = `
        SELECT 
            c.program_code,
            pc.description as program_description,
            COUNT(*) as total_cases,
            SUM(CASE WHEN c.status = 'Abierto' THEN 1 ELSE 0 END) as open_cases,
            SUM(CASE WHEN c.status = 'En Curso' THEN 1 ELSE 0 END) as in_progress_cases,
            SUM(CASE WHEN c.status = 'Cerrado' THEN 1 ELSE 0 END) as closed_cases,
            SUM(CASE WHEN c.gestion_perceptiva = 1 THEN 1 ELSE 0 END) as gestion_perceptiva_cases
        FROM cases c
        JOIN program_codes pc ON c.program_code = pc.code
    `;

    const conditions = [];
    const params = [];

    if (year) {
        conditions.push('c.tax_year = ?');
        params.push(year);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY c.program_code, pc.description ORDER BY total_cases DESC';

    const report = db.prepare(query).all(...params);
    res.json(report);
});

app.get('/api/reports/auditor-performance', authenticateToken, (req, res) => {
    const { year, month } = req.query;

    const report = db.prepare(`
        SELECT 
            u.id,
            u.full_name,
            COUNT(DISTINCT c.id) as total_cases,
            COUNT(DISTINCT CASE WHEN c.status = 'Cerrado' THEN c.id END) as closed_cases,
            COUNT(DISTINCT CASE WHEN c.gestion_perceptiva = 1 THEN c.id END) as gestion_perceptiva_cases,
            COUNT(DISTINCT aa.id) as total_acts,
            COALESCE(SUM(ma.final_amount), 0) as total_monetary_actions,
            COALESCE(SUM(p.amount), 0) as total_payments
        FROM users u
        LEFT JOIN cases c ON u.id = c.auditor_id
        LEFT JOIN administrative_acts aa ON c.id = aa.case_id
        LEFT JOIN monetary_actions ma ON c.id = ma.case_id
        LEFT JOIN payments p ON c.id = p.case_id
        WHERE u.role = 'Auditor'
        GROUP BY u.id, u.full_name
        ORDER BY total_cases DESC
    `).all();

    res.json(report);
});

// ============================================================================
// MONETARY ACTIONS & PAYMENTS (Existing endpoints - unchanged)
// ============================================================================

app.post('/api/cases/:caseId/monetary-actions', authenticateToken, (req, res) => {
    const { caseId } = req.params;
    const { action_type, base_amount, sanction_percentage, final_amount, action_date, notes } = req.body;

    try {
        const result = db.prepare(`
            INSERT INTO monetary_actions (case_id, action_type, base_amount, sanction_percentage, final_amount, action_date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(caseId, action_type, base_amount, sanction_percentage, final_amount, action_date, notes);

        // Update goals
        updateGoals(caseId, action_type, final_amount);

        res.json({ id: result.lastInsertRowid, message: 'Gestión monetaria registrada exitosamente' });
    } catch (error) {
        res.status(400).json({ error: 'Error al registrar gestión: ' + error.message });
    }
});

function updateGoals(caseId, actionType, amount) {
    const caseData = db.prepare('SELECT auditor_id, tax_year FROM cases WHERE id = ?').get(caseId);
    if (!caseData) return;

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const goalType = actionType === 'Determinación' ? 'determinacion' : 'sancion';

    try {
        db.prepare(`
            INSERT INTO goals (year, month, auditor_id, goal_type, target_amount, achieved_amount)
            VALUES (?, ?, ?, ?, 0, ?)
            ON CONFLICT(year, month, auditor_id, goal_type) 
            DO UPDATE SET achieved_amount = achieved_amount + ?
        `).run(year, month, caseData.auditor_id, goalType, amount, amount);
    } catch (error) {
        console.error('Error updating goals:', error);
    }
}

app.post('/api/cases/:caseId/payments', authenticateToken, (req, res) => {
    const { caseId } = req.params;
    const { payment_date, amount, payment_method, notes } = req.body;

    try {
        const result = db.prepare(`
            INSERT INTO payments (case_id, payment_date, amount, payment_method, notes)
            VALUES (?, ?, ?, ?, ?)
        `).run(caseId, payment_date, amount, payment_method, notes);

        res.json({ id: result.lastInsertRowid, message: 'Pago registrado exitosamente' });
    } catch (error) {
        res.status(400).json({ error: 'Error al registrar pago: ' + error.message });
    }
});

// ============================================================================
// GOALS ENDPOINTS
// ============================================================================

app.get('/api/goals', authenticateToken, (req, res) => {
    let query = `
        SELECT g.*, u.full_name as auditor_name
        FROM goals g
        JOIN users u ON g.auditor_id = u.id
    `;

    const conditions = [];
    const params = [];

    if (req.user.role === 'Auditor') {
        conditions.push('g.auditor_id = ?');
        params.push(req.user.id);
    }

    if (req.query.year) {
        conditions.push('g.year = ?');
        params.push(req.query.year);
    }

    if (req.query.month) {
        conditions.push('g.month = ?');
        params.push(req.query.month);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY g.year DESC, g.month DESC, u.full_name';

    const goals = db.prepare(query).all(...params);
    res.json(goals);
});

app.post('/api/goals', authenticateToken, (req, res) => {
    if (req.user.role !== 'Administrador' && req.user.role !== 'Supervisor') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    const { year, month, auditor_id, goal_type, target_amount } = req.body;

    try {
        const result = db.prepare(`
            INSERT INTO goals (year, month, auditor_id, goal_type, target_amount)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(year, month, auditor_id, goal_type) 
            DO UPDATE SET target_amount = ?
        `).run(year, month, auditor_id, goal_type, target_amount, target_amount);

        res.json({ message: 'Meta establecida exitosamente' });
    } catch (error) {
        res.status(400).json({ error: 'Error al establecer meta: ' + error.message });
    }
});

// ============================================================================
// BULK OPERATIONS ENDPOINTS (NEW)
// ============================================================================

app.post('/api/cases/bulk-import', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Administrador') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    const { cases } = req.body;

    if (!Array.isArray(cases) || cases.length === 0) {
        return res.status(400).json({ error: 'Debe proporcionar un array de casos' });
    }

    const insertCase = db.prepare(`
        INSERT INTO cases (
            case_id, nit, business_name, program_code, tax_type,
            opening_year, tax_year, period, calculation_type, status, auditor_id,
            opening_date, gestion_perceptiva, gestion_perceptiva_date, 
            gestion_perceptiva_notes, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let imported = 0;
    let errors = [];

    const transaction = db.transaction((casesToImport) => {
        for (const caseData of casesToImport) {
            try {
                // Validar datos requeridos
                if (!caseData.nit || !caseData.business_name || !caseData.program_code) {
                    errors.push({ case: caseData, error: 'Faltan datos requeridos' });
                    continue;
                }

                // Generar case_id
                const opening_year = caseData.opening_year || new Date().getFullYear();
                const case_id = `${caseData.nit}-${caseData.program_code}-${caseData.tax_type || 'Renta'}-${opening_year}-${caseData.tax_year}-${caseData.period || 1}`;

                insertCase.run(
                    case_id,
                    caseData.nit,
                    caseData.business_name,
                    caseData.program_code,
                    caseData.tax_type || 'Renta',
                    opening_year,
                    caseData.tax_year,
                    caseData.period || 1,
                    caseData.calculation_type || 'Determinación',
                    caseData.status || 'Abierto',
                    caseData.auditor_id,
                    caseData.opening_date || new Date().toISOString().split('T')[0],
                    caseData.gestion_perceptiva || 0,
                    caseData.gestion_perceptiva_date || null,
                    caseData.gestion_perceptiva_notes || null,
                    caseData.notes || ''
                );

                imported++;
            } catch (error) {
                errors.push({ case: caseData, error: error.message });
            }
        }
    });

    try {
        transaction(cases);
        res.json({
            message: 'Importación completada',
            imported: imported,
            errors: errors.length,
            errorDetails: errors
        });
    } catch (error) {
        res.status(500).json({ error: 'Error en importación masiva: ' + error.message });
    }
});

app.put('/api/goals/bulk-update', authenticateToken, (req, res) => {
    if (req.user.role !== 'Administrador' && req.user.role !== 'Supervisor') {
        return res.status(403).json({ error: 'No autorizado' });
    }

    const { goals } = req.body;

    if (!Array.isArray(goals) || goals.length === 0) {
        return res.status(400).json({ error: 'Debe proporcionar un array de metas' });
    }

    const upsertGoal = db.prepare(`
        INSERT INTO goals (year, month, auditor_id, goal_type, target_amount)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(year, month, auditor_id, goal_type) 
        DO UPDATE SET target_amount = ?
    `);

    let updated = 0;
    let errors = [];

    const transaction = db.transaction((goalsToUpdate) => {
        for (const goal of goalsToUpdate) {
            try {
                upsertGoal.run(
                    goal.year,
                    goal.month,
                    goal.auditor_id,
                    goal.goal_type,
                    goal.target_amount,
                    goal.target_amount
                );
                updated++;
            } catch (error) {
                errors.push({ goal: goal, error: error.message });
            }
        }
    });

    try {
        transaction(goals);
        res.json({
            message: 'Actualización masiva completada',
            updated: updated,
            errors: errors.length,
            errorDetails: errors
        });
    } catch (error) {
        res.status(500).json({ error: 'Error en actualización masiva: ' + error.message });
    }
});

// ============================================================================
// EXCEL EXPORT ENDPOINT (ENHANCED)
// ============================================================================

app.get('/api/export/cases', authenticateToken, async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Expedientes');

        // Define columns
        worksheet.columns = [
            { header: 'ID Expediente', key: 'case_id', width: 30 },
            { header: 'NIT', key: 'nit', width: 15 },
            { header: 'Razón Social', key: 'business_name', width: 40 },
            { header: 'Código Programa', key: 'program_code', width: 15 },
            { header: 'Tipo Impuesto', key: 'tax_type', width: 15 },
            { header: 'Año Gravable', key: 'tax_year', width: 12 },
            { header: 'Período', key: 'period', width: 10 },
            { header: 'Tipo Cálculo', key: 'calculation_type', width: 15 },
            { header: 'Estado', key: 'status', width: 15 },
            { header: 'Auditor', key: 'auditor_name', width: 30 },
            { header: 'Gestión Perceptiva', key: 'gestion_perceptiva', width: 18 },
            { header: 'Fecha Apertura', key: 'opening_date', width: 15 },
            { header: 'Fecha Cierre', key: 'closing_date', width: 15 }
        ];

        // Get cases
        let query = `
            SELECT c.*, u.full_name as auditor_name
            FROM cases c
            JOIN users u ON c.auditor_id = u.id
        `;

        if (req.user.role === 'Auditor') {
            query += ' WHERE c.auditor_id = ?';
        }

        query += ' ORDER BY c.created_at DESC';

        const cases = req.user.role === 'Auditor' 
            ? db.prepare(query).all(req.user.id)
            : db.prepare(query).all();

        // Add rows
        cases.forEach(c => {
            worksheet.addRow({
                ...c,
                gestion_perceptiva: c.gestion_perceptiva ? 'Sí' : 'No'
            });
        });

        // Style header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=expedientes.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).json({ error: 'Error al exportar: ' + error.message });
    }
});

// ============================================================================
// DASHBOARD STATS
// ============================================================================

app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
    const stats = {
        totalCases: 0,
        openCases: 0,
        closedCases: 0,
        gestionPerceptivaCases: 0,
        totalMonetaryActions: 0,
        totalPayments: 0,
        casesByProgram: [],
        casesByStatus: [],
        recentCases: []
    };

    // Filter by auditor if role is Auditor
    const auditorFilter = req.user.role === 'Auditor' ? 'WHERE c.auditor_id = ?' : '';
    const auditorParam = req.user.role === 'Auditor' ? [req.user.id] : [];

    stats.totalCases = db.prepare(`SELECT COUNT(*) as count FROM cases c ${auditorFilter}`).get(...auditorParam).count;
    stats.openCases = db.prepare(`SELECT COUNT(*) as count FROM cases c ${auditorFilter} ${auditorFilter ? 'AND' : 'WHERE'} c.status = 'Abierto'`).get(...auditorParam).count;
    stats.closedCases = db.prepare(`SELECT COUNT(*) as count FROM cases c ${auditorFilter} ${auditorFilter ? 'AND' : 'WHERE'} c.status = 'Cerrado'`).get(...auditorParam).count;
    stats.gestionPerceptivaCases = db.prepare(`SELECT COUNT(*) as count FROM cases c ${auditorFilter} ${auditorFilter ? 'AND' : 'WHERE'} c.gestion_perceptiva = 1`).get(...auditorParam).count;

    stats.totalMonetaryActions = db.prepare(`
        SELECT COALESCE(SUM(ma.final_amount), 0) as total
        FROM monetary_actions ma
        JOIN cases c ON ma.case_id = c.id
        ${auditorFilter}
    `).get(...auditorParam).total;

    stats.totalPayments = db.prepare(`
        SELECT COALESCE(SUM(p.amount), 0) as total
        FROM payments p
        JOIN cases c ON p.case_id = c.id
        ${auditorFilter}
    `).get(...auditorParam).total;

    stats.casesByProgram = db.prepare(`
        SELECT c.program_code, COUNT(*) as count
        FROM cases c
        ${auditorFilter}
        GROUP BY c.program_code
        ORDER BY count DESC
    `).all(...auditorParam);

    stats.casesByStatus = db.prepare(`
        SELECT c.status, COUNT(*) as count
        FROM cases c
        ${auditorFilter}
        GROUP BY c.status
        ORDER BY count DESC
    `).all(...auditorParam);

    stats.recentCases = db.prepare(`
        SELECT c.*, u.full_name as auditor_name
        FROM cases c
        JOIN users u ON c.auditor_id = u.id
        ${auditorFilter}
        ORDER BY c.created_at DESC
        LIMIT 10
    `).all(...auditorParam);

    res.json(stats);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Database: fiscalizacion-v3.db`);
    console.log(`✓ API ready at http://localhost:${PORT}/api`);
});