import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dian-fiscalizacion-secret-key-2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Base de datos
const db = new Database(path.join(__dirname, '../database/fiscalizacion.db'));

// Middleware de autenticación
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

// ==================== RUTAS DE AUTENTICACIÓN ====================

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    try {
        const user = db.prepare('SELECT * FROM usuarios WHERE email = ? AND activo = 1').get(email);

        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const validPassword = bcrypt.compareSync(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, rol: user.rol },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ==================== RUTAS DE USUARIOS ====================

app.get('/api/usuarios', authenticateToken, (req, res) => {
    try {
        if (req.user.rol !== 'Administrador') {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const usuarios = db.prepare('SELECT id, nombre, email, rol, activo FROM usuarios').all();
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

app.post('/api/usuarios', authenticateToken, (req, res) => {
    try {
        if (req.user.rol !== 'Administrador') {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        const { nombre, email, password, rol } = req.body;
        const passwordHash = bcrypt.hashSync(password, 10);

        const stmt = db.prepare(`
            INSERT INTO usuarios (nombre, email, password_hash, rol)
            VALUES (?, ?, ?, ?)
        `);

        const result = stmt.run(nombre, email, passwordHash, rol);
        res.json({ id: result.lastInsertRowid, mensaje: 'Usuario creado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

// ==================== RUTAS DE EXPEDIENTES ====================

app.get('/api/expedientes', authenticateToken, (req, res) => {
    try {
        let query = `
            SELECT e.*, 
                   u1.nombre as auditor_nombre,
                   u2.nombre as supervisor_nombre
            FROM expedientes e
            LEFT JOIN usuarios u1 ON e.auditor_asignado_id = u1.id
            LEFT JOIN usuarios u2 ON e.supervisor_asignado_id = u2.id
        `;

        // Filtrar por rol
        if (req.user.rol === 'Auditor') {
            query += ' WHERE e.auditor_asignado_id = ?';
            const expedientes = db.prepare(query).all(req.user.id);
            return res.json(expedientes);
        }

        const expedientes = db.prepare(query).all();
        res.json(expedientes);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener expedientes' });
    }
});

app.get('/api/expedientes/:id', authenticateToken, (req, res) => {
    try {
        const expediente = db.prepare(`
            SELECT e.*, 
                   u1.nombre as auditor_nombre,
                   u2.nombre as supervisor_nombre
            FROM expedientes e
            LEFT JOIN usuarios u1 ON e.auditor_asignado_id = u1.id
            LEFT JOIN usuarios u2 ON e.supervisor_asignado_id = u2.id
            WHERE e.id = ?
        `).get(req.params.id);

        if (!expediente) {
            return res.status(404).json({ error: 'Expediente no encontrado' });
        }

        // Verificar permisos
        if (req.user.rol === 'Auditor' && expediente.auditor_asignado_id !== req.user.id) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        res.json(expediente);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener expediente' });
    }
});

app.post('/api/expedientes', authenticateToken, (req, res) => {
    try {
        const {
            nit, razon_social, codigo_investigacion, impuesto,
            ano_gravable, ano_calendario, periodo, auditor_asignado_id,
            supervisor_asignado_id, estado_expediente, fecha_inicio,
            fecha_vencimiento, prioridad, observaciones
        } = req.body;

        // Generar ID del expediente
        const expediente_id = `${nit}-${codigo_investigacion}-${impuesto}-${ano_calendario}-${ano_gravable}-${periodo}`;

        const stmt = db.prepare(`
            INSERT INTO expedientes (
                expediente_id, nit, razon_social, codigo_investigacion, impuesto,
                ano_gravable, ano_calendario, periodo, auditor_asignado_id,
                supervisor_asignado_id, estado_expediente, fecha_inicio,
                fecha_vencimiento, prioridad, observaciones
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            expediente_id, nit, razon_social, codigo_investigacion, impuesto,
            ano_gravable, ano_calendario, periodo, auditor_asignado_id,
            supervisor_asignado_id, estado_expediente, fecha_inicio,
            fecha_vencimiento, prioridad, observaciones
        );

        res.json({ id: result.lastInsertRowid, expediente_id, mensaje: 'Expediente creado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear expediente: ' + error.message });
    }
});

app.put('/api/expedientes/:id', authenticateToken, (req, res) => {
    try {
        const {
            nit, razon_social, codigo_investigacion, impuesto,
            ano_gravable, ano_calendario, periodo, auditor_asignado_id,
            supervisor_asignado_id, estado_expediente, fecha_inicio,
            fecha_vencimiento, prioridad, observaciones
        } = req.body;

        // Generar ID del expediente
        const expediente_id = `${nit}-${codigo_investigacion}-${impuesto}-${ano_calendario}-${ano_gravable}-${periodo}`;

        const stmt = db.prepare(`
            UPDATE expedientes SET
                expediente_id = ?, nit = ?, razon_social = ?, codigo_investigacion = ?,
                impuesto = ?, ano_gravable = ?, ano_calendario = ?, periodo = ?,
                auditor_asignado_id = ?, supervisor_asignado_id = ?, estado_expediente = ?,
                fecha_inicio = ?, fecha_vencimiento = ?, prioridad = ?, observaciones = ?,
                ultima_actualizacion = CURRENT_TIMESTAMP
            WHERE id = ?
        `);

        stmt.run(
            expediente_id, nit, razon_social, codigo_investigacion, impuesto,
            ano_gravable, ano_calendario, periodo, auditor_asignado_id,
            supervisor_asignado_id, estado_expediente, fecha_inicio,
            fecha_vencimiento, prioridad, observaciones, req.params.id
        );

        res.json({ mensaje: 'Expediente actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar expediente' });
    }
});

// ==================== RUTAS DE GESTIONES ====================

app.get('/api/gestiones', authenticateToken, (req, res) => {
    try {
        const { expediente_id } = req.query;

        let query = `
            SELECT g.*, e.expediente_id as expediente_codigo, e.razon_social
            FROM gestiones g
            JOIN expedientes e ON g.expediente_id = e.id
        `;

        if (expediente_id) {
            query += ' WHERE g.expediente_id = ?';
            const gestiones = db.prepare(query).all(expediente_id);
            return res.json(gestiones);
        }

        // Filtrar por rol
        if (req.user.rol === 'Auditor') {
            query += ' WHERE e.auditor_asignado_id = ?';
            const gestiones = db.prepare(query).all(req.user.id);
            return res.json(gestiones);
        }

        const gestiones = db.prepare(query).all();
        res.json(gestiones);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener gestiones' });
    }
});

app.post('/api/gestiones', authenticateToken, (req, res) => {
    try {
        const gestion = req.body;
        
        // Calcular valor de la meta según el tipo de gestión
        const { valor_meta, explicacion } = calcularValorMeta(gestion);
        
        const stmt = db.prepare(`
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

        const result = stmt.run(
            gestion.expediente_id, gestion.tipo_gestion, gestion.fecha_gestion,
            gestion.impuesto_original || 0, gestion.saldo_pagar_original || 0, gestion.saldo_favor_original || 0,
            gestion.perdida_liquida_original || 0, gestion.renta_liquida_original || 0,
            gestion.impuesto_corregido || 0, gestion.saldo_pagar_corregido || 0, gestion.saldo_favor_corregido || 0,
            gestion.perdida_liquida_corregida || 0, gestion.renta_liquida_corregida || 0,
            gestion.diferencia_impuesto || 0, gestion.diferencia_saldo_pagar || 0, gestion.diferencia_saldo_favor || 0,
            gestion.monto_sancion || 0, gestion.intereses || 0, gestion.tasa_impuesto_renta || 0.35,
            valor_meta, explicacion, gestion.observaciones
        );

        // Actualizar meta correspondiente
        actualizarMeta(gestion.expediente_id, gestion.tipo_gestion, valor_meta);

        res.json({ id: result.lastInsertRowid, valor_meta, mensaje: 'Gestión creada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear gestión: ' + error.message });
    }
});

// ==================== FUNCIONES DE CÁLCULO ====================

function calcularValorMeta(gestion) {
    let valor_meta = 0;
    let explicacion = '';

    switch (gestion.tipo_gestion) {
        case 'Presentación Omiso':
            if (gestion.saldo_pagar_corregido > 0) {
                valor_meta = gestion.saldo_pagar_corregido + (gestion.intereses || 0);
                explicacion = `Saldo a Pagar (${formatCurrency(gestion.saldo_pagar_corregido)}) + Intereses (${formatCurrency(gestion.intereses || 0)}) = ${formatCurrency(valor_meta)}`;
            } else {
                valor_meta = gestion.monto_sancion || 0;
                explicacion = `Monto de Sanción: ${formatCurrency(valor_meta)}`;
            }
            break;

        case 'Corrección Declaración':
            const difSaldoPagar = gestion.saldo_pagar_corregido - gestion.saldo_pagar_original;
            const difSaldoFavor = gestion.saldo_favor_original - gestion.saldo_favor_corregido;
            const difPerdida = gestion.perdida_liquida_original - gestion.perdida_liquida_corregida;
            const difRenta = gestion.renta_liquida_corregida - gestion.renta_liquida_original;

            if (difSaldoPagar > 0 || difSaldoFavor > 0) {
                valor_meta = Math.max(difSaldoPagar, difSaldoFavor);
                explicacion = `Mayor valor entre: Diferencia Saldo a Pagar (${formatCurrency(difSaldoPagar)}) y Diferencia Saldo a Favor (${formatCurrency(difSaldoFavor)}) = ${formatCurrency(valor_meta)}`;
            } else if (difPerdida > 0) {
                valor_meta = difPerdida * (gestion.tasa_impuesto_renta || 0.35);
                explicacion = `Disminución Pérdida Líquida (${formatCurrency(difPerdida)}) × Tasa (${(gestion.tasa_impuesto_renta || 0.35) * 100}%) = ${formatCurrency(valor_meta)}`;
            } else if (difRenta > 0) {
                valor_meta = difRenta * (gestion.tasa_impuesto_renta || 0.35);
                explicacion = `Aumento Renta Líquida (${formatCurrency(difRenta)}) × Tasa (${(gestion.tasa_impuesto_renta || 0.35) * 100}%) = ${formatCurrency(valor_meta)}`;
            }
            break;

        case 'Liquidación Oficial de Revisión':
            // Misma lógica que Corrección Declaración
            const difSaldoPagar2 = gestion.saldo_pagar_corregido - gestion.saldo_pagar_original;
            const difSaldoFavor2 = gestion.saldo_favor_original - gestion.saldo_favor_corregido;
            const difPerdida2 = gestion.perdida_liquida_original - gestion.perdida_liquida_corregida;
            const difRenta2 = gestion.renta_liquida_corregida - gestion.renta_liquida_original;

            if (difSaldoPagar2 > 0 || difSaldoFavor2 > 0) {
                valor_meta = Math.max(difSaldoPagar2, difSaldoFavor2);
                explicacion = `Mayor valor entre: Diferencia Saldo a Pagar (${formatCurrency(difSaldoPagar2)}) y Diferencia Saldo a Favor (${formatCurrency(difSaldoFavor2)}) = ${formatCurrency(valor_meta)}`;
            } else if (difPerdida2 > 0) {
                valor_meta = difPerdida2 * (gestion.tasa_impuesto_renta || 0.35);
                explicacion = `Disminución Pérdida Líquida (${formatCurrency(difPerdida2)}) × Tasa (${(gestion.tasa_impuesto_renta || 0.35) * 100}%) = ${formatCurrency(valor_meta)}`;
            } else if (difRenta2 > 0) {
                valor_meta = difRenta2 * (gestion.tasa_impuesto_renta || 0.35);
                explicacion = `Aumento Renta Líquida (${formatCurrency(difRenta2)}) × Tasa (${(gestion.tasa_impuesto_renta || 0.35) * 100}%) = ${formatCurrency(valor_meta)}`;
            }
            break;

        case 'Liquidación de Aforo':
            if (gestion.saldo_pagar_corregido > 0) {
                valor_meta = gestion.saldo_pagar_corregido + (gestion.intereses || 0);
                explicacion = `Saldo a Pagar (${formatCurrency(gestion.saldo_pagar_corregido)}) + Intereses (${formatCurrency(gestion.intereses || 0)}) = ${formatCurrency(valor_meta)}`;
            } else {
                valor_meta = gestion.monto_sancion || 0;
                explicacion = `Monto de Sanción: ${formatCurrency(valor_meta)}`;
            }
            break;

        case 'Resolución Sanción':
            valor_meta = gestion.monto_sancion || 0;
            explicacion = `Monto de Sanción Impuesta: ${formatCurrency(valor_meta)}`;
            break;

        case 'Pagos 490':
            valor_meta = gestion.saldo_pagar_corregido || 0;
            explicacion = `Monto del Pago: ${formatCurrency(valor_meta)}`;
            break;
    }

    return { valor_meta, explicacion };
}

function actualizarMeta(expediente_id, tipo_gestion, valor) {
    try {
        // Obtener auditor del expediente
        const expediente = db.prepare('SELECT auditor_asignado_id FROM expedientes WHERE id = ?').get(expediente_id);
        
        if (!expediente || !expediente.auditor_asignado_id) return;

        // Determinar tipo de meta
        let tipo_meta = '';
        if (['Presentación Omiso', 'Corrección Declaración'].includes(tipo_gestion)) {
            tipo_meta = 'DECLARACIONES_CORRECCIONES';
        } else if (['Liquidación Oficial de Revisión', 'Liquidación de Aforo', 'Resolución Sanción'].includes(tipo_gestion)) {
            tipo_meta = 'ACTOS_ADMINISTRATIVOS';
        } else if (tipo_gestion === 'Pagos 490') {
            tipo_meta = 'RECAUDO';
        }

        if (!tipo_meta) return;

        // Actualizar meta del mes actual
        const stmt = db.prepare(`
            UPDATE metas_gestion
            SET valor_acumulado = valor_acumulado + ?,
                porcentaje_cumplimiento = (valor_acumulado + ?) * 100.0 / valor_meta,
                ultima_actualizacion = CURRENT_TIMESTAMP
            WHERE auditor_id = ?
            AND tipo_meta = ?
            AND date('now') BETWEEN fecha_inicio AND fecha_fin
        `);

        stmt.run(valor, valor, expediente.auditor_asignado_id, tipo_meta);
    } catch (error) {
        console.error('Error actualizando meta:', error);
    }
}

function formatCurrency(value) {
    // Asegurar que el valor sea un número válido
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue === null || numValue === undefined) {
        return '$0';
    }
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(numValue);
}

// ==================== RUTAS DE METAS ====================

app.get('/api/metas', authenticateToken, (req, res) => {
    try {
        let query = `
            SELECT m.*, u.nombre as auditor_nombre
            FROM metas_gestion m
            JOIN usuarios u ON m.auditor_id = u.id
        `;

        // Filtrar por rol
        if (req.user.rol === 'Auditor') {
            query += ' WHERE m.auditor_id = ?';
            const metas = db.prepare(query).all(req.user.id);
            return res.json(metas);
        }

        const metas = db.prepare(query).all();
        res.json(metas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener metas' });
    }
});

// ==================== RUTAS DE ESTADÍSTICAS ====================

app.get('/api/estadisticas/dashboard', authenticateToken, (req, res) => {
    try {
        let whereClause = '';
        let params = [];

        if (req.user.rol === 'Auditor') {
            whereClause = 'WHERE e.auditor_asignado_id = ?';
            params = [req.user.id];
        }

        const stats = {
            total_expedientes: db.prepare(`SELECT COUNT(*) as count FROM expedientes e ${whereClause}`).get(...params).count,
            expedientes_abiertos: db.prepare(`SELECT COUNT(*) as count FROM expedientes e ${whereClause} ${whereClause ? 'AND' : 'WHERE'} e.estado_expediente = 'Abierto'`).get(...params).count,
            total_gestiones: db.prepare(`SELECT COUNT(*) as count FROM gestiones g JOIN expedientes e ON g.expediente_id = e.id ${whereClause}`).get(...params).count,
            valor_total_gestiones: db.prepare(`SELECT COALESCE(SUM(valor_meta), 0) as total FROM gestiones g JOIN expedientes e ON g.expediente_id = e.id ${whereClause}`).get(...params).total,
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

app.get('/api/estadisticas/por-estado', authenticateToken, (req, res) => {
    try {
        let whereClause = '';
        let params = [];

        if (req.user.rol === 'Auditor') {
            whereClause = 'WHERE auditor_asignado_id = ?';
            params = [req.user.id];
        }

        const stats = db.prepare(`
            SELECT estado_expediente, COUNT(*) as cantidad
            FROM expedientes
            ${whereClause}
            GROUP BY estado_expediente
        `).all(...params);

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener estadísticas por estado' });
    }
});

// ==================== RUTA PRINCIPAL ====================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor iniciado en http://localhost:${PORT}`);
    console.log(`📊 Sistema de Gestión de Casos de Fiscalización - DIAN Leticia`);
    console.log(`\n📝 Para inicializar la base de datos, ejecute: npm run init-db\n`);
});