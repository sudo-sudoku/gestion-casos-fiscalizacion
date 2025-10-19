// ============================================================================
// GESTIÓN WEB CASOS FISCALIZACIÓN - VERSION 3.0
// DIAN LETICIA - APLICACIÓN PRINCIPAL
// ============================================================================

const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let authToken = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');

    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        showMainScreen();
    }

    // Event Listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Login
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            showSection(section);
        });
    });

    // Cases
    document.getElementById('new-case-btn')?.addEventListener('click', () => openCaseForm());
    document.getElementById('export-cases-btn')?.addEventListener('click', exportCases);
    document.getElementById('case-form')?.addEventListener('submit', handleCaseSubmit);
    document.getElementById('search-cases')?.addEventListener('input', filterCases);
    document.getElementById('filter-program')?.addEventListener('change', filterCases);
    document.getElementById('filter-status')?.addEventListener('change', filterCases);
    document.getElementById('filter-gestion-perceptiva')?.addEventListener('change', filterCases);

    // Gestión Perceptiva checkbox
    document.getElementById('case-gestion-perceptiva')?.addEventListener('change', (e) => {
        const fields = document.getElementById('gestion-perceptiva-fields');
        fields.style.display = e.target.checked ? 'block' : 'none';
    });

    // Reports
    document.getElementById('generate-inventory-btn')?.addEventListener('click', generateInventoryReport);
    document.getElementById('generate-program-btn')?.addEventListener('click', generateProgramReport);
    document.getElementById('generate-performance-btn')?.addEventListener('click', generatePerformanceReport);

    // Report tabs
    document.querySelectorAll('.report-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.report-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.report-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.report}-report`).classList.add('active');
        });
    });

    // Admin tabs
    document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.admin-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.admin}-admin`).classList.add('active');
        });
    });

    // Goals
    document.getElementById('new-goal-btn')?.addEventListener('click', () => openGoalForm());
    document.getElementById('filter-goals-btn')?.addEventListener('click', loadGoals);
    document.getElementById('goal-form')?.addEventListener('submit', handleGoalSubmit);

    // Admin
    document.getElementById('new-user-btn')?.addEventListener('click', () => openUserForm());
    document.getElementById('user-form')?.addEventListener('submit', handleUserSubmit);
    document.getElementById('bulk-import-btn')?.addEventListener('click', handleBulkImport);

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('active');
        });
    });

    // Close modal on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showMainScreen();
        } else {
            showError('login-error', data.error || 'Error al iniciar sesión');
        }
    } catch (error) {
        showError('login-error', 'Error de conexión con el servidor');
    }
}

function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showLoginScreen();
}

function showLoginScreen() {
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('main-screen').classList.remove('active');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

function showMainScreen() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('main-screen').classList.add('active');
    document.getElementById('user-info').textContent = `${currentUser.full_name} (${currentUser.role})`;
    
    // Show/hide navigation based on role
    updateNavigationByRole();
    
    // Load initial data
    loadDashboard();
}

function updateNavigationByRole() {
    document.querySelectorAll('[data-role]').forEach(element => {
        const allowedRoles = element.dataset.role.split(',');
        if (!allowedRoles.includes(currentUser.role)) {
            element.style.display = 'none';
        } else {
            element.style.display = '';
        }
    });
}

// ============================================================================
// NAVIGATION
// ============================================================================

function showSection(sectionName) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // Update sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionName}-section`).classList.add('active');

    // Load section data
    switch(sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'cases':
            loadCases();
            break;
        case 'reports':
            // Reports load on demand
            break;
        case 'goals':
            loadGoals();
            break;
        case 'admin':
            loadAdminData();
            break;
    }
}

// ============================================================================
// DASHBOARD
// ============================================================================

async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const stats = await response.json();

        // Update stat cards
        document.getElementById('stat-total-cases').textContent = stats.totalCases;
        document.getElementById('stat-open-cases').textContent = stats.openCases;
        document.getElementById('stat-gestion-perceptiva').textContent = stats.gestionPerceptivaCases;
        document.getElementById('stat-closed-cases').textContent = stats.closedCases;

        // Update charts
        renderChart('chart-by-program', stats.casesByProgram, 'program_code', 'count');
        renderChart('chart-by-status', stats.casesByStatus, 'status', 'count');

        // Update recent cases
        renderRecentCases(stats.recentCases);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function renderChart(elementId, data, labelKey, valueKey) {
    const container = document.getElementById(elementId);
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<p>No hay datos disponibles</p>';
        return;
    }

    const maxValue = Math.max(...data.map(item => item[valueKey]));

    data.forEach(item => {
        const barContainer = document.createElement('div');
        barContainer.className = 'chart-bar';

        const label = document.createElement('div');
        label.className = 'chart-label';
        label.textContent = item[labelKey];

        const bar = document.createElement('div');
        bar.className = 'chart-bar-fill';
        bar.style.width = `${(item[valueKey] / maxValue) * 100}%`;
        bar.textContent = item[valueKey];

        barContainer.appendChild(label);
        barContainer.appendChild(bar);
        container.appendChild(barContainer);
    });
}

function renderRecentCases(cases) {
    const tbody = document.querySelector('#recent-cases-table tbody');
    tbody.innerHTML = '';

    cases.forEach(caseData => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${caseData.case_id}</td>
            <td>${caseData.business_name}</td>
            <td><span class="badge badge-primary">${caseData.program_code}</span></td>
            <td><span class="badge ${getStatusBadgeClass(caseData.status)}">${caseData.status}</span></td>
            <td>${caseData.auditor_name}</td>
        `;
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => viewCaseDetail(caseData.id));
    });
}

// ============================================================================
// CASES
// ============================================================================

let allCases = [];

async function loadCases() {
    try {
        const response = await fetch(`${API_URL}/cases`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        allCases = await response.json();
        renderCases(allCases);
        
        // Load program codes for filter
        await loadProgramCodes();
    } catch (error) {
        console.error('Error loading cases:', error);
    }
}

function renderCases(cases) {
    const tbody = document.querySelector('#cases-table tbody');
    tbody.innerHTML = '';

    if (cases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center">No hay expedientes para mostrar</td></tr>';
        return;
    }

    cases.forEach(caseData => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><strong>${caseData.case_id}</strong></td>
            <td>${caseData.nit}</td>
            <td>${caseData.business_name}</td>
            <td><span class="badge badge-primary">${caseData.program_code}</span></td>
            <td>${caseData.tax_type}</td>
            <td>${caseData.tax_year}</td>
            <td><span class="badge ${getStatusBadgeClass(caseData.status)}">${caseData.status}</span></td>
            <td>${caseData.gestion_perceptiva ? '<span class="badge badge-warning">Sí</span>' : '<span class="badge badge-info">No</span>'}</td>
            <td>${caseData.auditor_name}</td>
            <td>
                <button class="btn btn-small btn-primary" onclick="viewCaseDetail(${caseData.id})">Ver</button>
            </td>
        `;
    });
}

function filterCases() {
    const searchTerm = document.getElementById('search-cases').value.toLowerCase();
    const programFilter = document.getElementById('filter-program').value;
    const statusFilter = document.getElementById('filter-status').value;
    const gestionFilter = document.getElementById('filter-gestion-perceptiva').value;

    const filtered = allCases.filter(caseData => {
        const matchesSearch = caseData.nit.includes(searchTerm) || 
                            caseData.business_name.toLowerCase().includes(searchTerm);
        const matchesProgram = !programFilter || caseData.program_code === programFilter;
        const matchesStatus = !statusFilter || caseData.status === statusFilter;
        const matchesGestion = !gestionFilter || 
                              (gestionFilter === 'true' && caseData.gestion_perceptiva === 1) ||
                              (gestionFilter === 'false' && caseData.gestion_perceptiva === 0);

        return matchesSearch && matchesProgram && matchesStatus && matchesGestion;
    });

    renderCases(filtered);
}

async function viewCaseDetail(caseId) {
    try {
        const response = await fetch(`${API_URL}/cases/${caseId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const caseData = await response.json();
        
        const modal = document.getElementById('case-modal');
        const content = document.getElementById('case-detail-content');

        // Determinar si el usuario puede editar
        const canEdit = currentUser.role === 'Administrador' || currentUser.role === 'Supervisor';

        content.innerHTML = `
            <div class="case-detail-grid">
                <div class="detail-group">
                    <h4>Información General</h4>
                    <div class="detail-item">
                        <div class="detail-label">ID Expediente:</div>
                        <div class="detail-value"><strong>${caseData.case_id}</strong></div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">NIT:</div>
                        <div class="detail-value">${caseData.nit}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Razón Social:</div>
                        <div class="detail-value">${caseData.business_name}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Código Programa:</div>
                        <div class="detail-value"><span class="badge badge-primary">${caseData.program_code}</span></div>
                    </div>
                </div>

                <div class="detail-group">
                    <h4>Información Tributaria</h4>
                    <div class="detail-item">
                        <div class="detail-label">Tipo Impuesto:</div>
                        <div class="detail-value">${caseData.tax_type}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Año Apertura:</div>
                        <div class="detail-value">${caseData.opening_year}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Año Gravable:</div>
                        <div class="detail-value">${caseData.tax_year}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Período:</div>
                        <div class="detail-value">${caseData.period}</div>
                    </div>
                </div>

                <div class="detail-group">
                    <h4>Estado y Fechas</h4>
                    <div class="detail-item">
                        <div class="detail-label">Estado:</div>
                        <div class="detail-value"><span class="badge ${getStatusBadgeClass(caseData.status)}">${caseData.status}</span></div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Fecha Apertura:</div>
                        <div class="detail-value">${formatDate(caseData.opening_date)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Fecha Cierre:</div>
                        <div class="detail-value">${caseData.closing_date ? formatDate(caseData.closing_date) : 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Auditor:</div>
                        <div class="detail-value">${caseData.auditor_name}</div>
                    </div>
                </div>

                <div class="detail-group">
                    <h4>Gestión Perceptiva</h4>
                    <div class="detail-item">
                        <div class="detail-label">¿Es Gestión Perceptiva?:</div>
                        <div class="detail-value">
                            ${caseData.gestion_perceptiva ? '<span class="badge badge-warning">Sí</span>' : '<span class="badge badge-info">No</span>'}
                        </div>
                    </div>
                    ${caseData.gestion_perceptiva ? `
                        <div class="detail-item">
                            <div class="detail-label">Fecha:</div>
                            <div class="detail-value">${formatDate(caseData.gestion_perceptiva_date)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Notas:</div>
                            <div class="detail-value">${caseData.gestion_perceptiva_notes || 'N/A'}</div>
                        </div>
                    ` : ''}
                </div>
            </div>

            ${caseData.notes ? `
                <div class="detail-group">
                    <h4>Observaciones</h4>
                    <p>${caseData.notes}</p>
                </div>
            ` : ''}

            <div class="case-tabs">
                <button class="case-tab-btn active" data-tab="acts">Actuaciones Administrativas</button>
                <button class="case-tab-btn" data-tab="monetary">Gestiones Monetarias</button>
                <button class="case-tab-btn" data-tab="payments">Pagos</button>
            </div>

            <div id="acts-tab" class="case-tab-content active">
                <h4>Actuaciones Administrativas</h4>
                ${renderAdministrativeActs(caseData.administrative_acts || [])}
                ${canEdit ? `<button class="btn btn-primary mt-20" onclick="addAdministrativeAct(${caseData.id})">➕ Nueva Actuación</button>` : ''}
            </div>

            <div id="monetary-tab" class="case-tab-content">
                <h4>Gestiones Monetarias</h4>
                ${renderMonetaryActions(caseData.monetary_actions || [])}
                ${canEdit ? `<button class="btn btn-primary mt-20" onclick="addMonetaryAction(${caseData.id})">➕ Nueva Gestión</button>` : ''}
            </div>

            <div id="payments-tab" class="case-tab-content">
                <h4>Pagos Recibidos</h4>
                ${renderPayments(caseData.payments || [])}
                ${canEdit ? `<button class="btn btn-primary mt-20" onclick="addPayment(${caseData.id})">➕ Nuevo Pago</button>` : ''}
            </div>
        `;

        // Setup tab switching
        content.querySelectorAll('.case-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                content.querySelectorAll('.case-tab-btn').forEach(b => b.classList.remove('active'));
                content.querySelectorAll('.case-tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                content.querySelector(`#${btn.dataset.tab}-tab`).classList.add('active');
            });
        });

        modal.classList.add('active');
    } catch (error) {
        console.error('Error loading case detail:', error);
        alert('Error al cargar detalle del expediente');
    }
}

function renderAdministrativeActs(acts) {
    if (acts.length === 0) {
        return '<p class="text-center">No hay actuaciones registradas</p>';
    }

    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Tipo de Actuación</th>
                    <th>Fecha</th>
                    <th>Fecha Notificación</th>
                    <th>Monto</th>
                    <th>Auto-Tracked</th>
                </tr>
            </thead>
            <tbody>
                ${acts.map(act => `
                    <tr>
                        <td>${act.act_type_name}</td>
                        <td>${formatDate(act.act_date)}</td>
                        <td>${act.notification_date ? formatDate(act.notification_date) : 'N/A'}</td>
                        <td>${formatCurrency(act.amount || 0)}</td>
                        <td>${act.auto_tracked ? '<span class="badge badge-success">Sí</span>' : '<span class="badge badge-info">No</span>'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderMonetaryActions(actions) {
    if (actions.length === 0) {
        return '<p class="text-center">No hay gestiones monetarias registradas</p>';
    }

    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Tipo</th>
                    <th>Monto Base</th>
                    <th>% Sanción</th>
                    <th>Monto Final</th>
                    <th>Fecha</th>
                </tr>
            </thead>
            <tbody>
                ${actions.map(action => `
                    <tr>
                        <td><span class="badge ${action.action_type === 'Determinación' ? 'badge-success' : 'badge-warning'}">${action.action_type}</span></td>
                        <td class="text-right">${formatCurrency(action.base_amount)}</td>
                        <td class="text-center">${action.sanction_percentage || 'N/A'}</td>
                        <td class="text-right"><strong>${formatCurrency(action.final_amount)}</strong></td>
                        <td>${formatDate(action.action_date)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderPayments(payments) {
    if (payments.length === 0) {
        return '<p class="text-center">No hay pagos registrados</p>';
    }

    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Monto</th>
                    <th>Método</th>
                    <th>Notas</th>
                </tr>
            </thead>
            <tbody>
                ${payments.map(payment => `
                    <tr>
                        <td>${formatDate(payment.payment_date)}</td>
                        <td class="text-right"><strong>${formatCurrency(payment.amount)}</strong></td>
                        <td>${payment.payment_method || 'N/A'}</td>
                        <td>${payment.notes || ''}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function openCaseForm(caseId = null) {
    const modal = document.getElementById('case-form-modal');
    const form = document.getElementById('case-form');
    const title = document.getElementById('case-form-title');

    // Load program codes and tax types
    await loadProgramCodes();
    await loadTaxTypes();
    await loadAuditors();

    // Set today's date as default
    document.getElementById('case-opening-date').valueAsDate = new Date();

    if (caseId) {
        title.textContent = 'Editar Expediente';
        // Load case data
        // ... (implementation for edit)
    } else {
        title.textContent = 'Nuevo Expediente';
        form.reset();
        document.getElementById('case-opening-year').value = new Date().getFullYear();
        document.getElementById('case-tax-year').value = new Date().getFullYear() - 1;
    }

    modal.classList.add('active');
}

async function handleCaseSubmit(e) {
    e.preventDefault();

    const formData = {
        nit: document.getElementById('case-nit').value,
        business_name: document.getElementById('case-business-name').value,
        program_code: document.getElementById('case-program-code').value,
        tax_type: document.getElementById('case-tax-type').value,
        opening_year: parseInt(document.getElementById('case-opening-year').value),
        tax_year: parseInt(document.getElementById('case-tax-year').value),
        period: parseInt(document.getElementById('case-period').value),
        calculation_type: document.getElementById('case-calculation-type').value,
        auditor_id: parseInt(document.getElementById('case-auditor').value),
        opening_date: document.getElementById('case-opening-date').value,
        gestion_perceptiva: document.getElementById('case-gestion-perceptiva').checked ? 1 : 0,
        gestion_perceptiva_date: document.getElementById('case-gestion-date').value || null,
        gestion_perceptiva_notes: document.getElementById('case-gestion-notes').value || null,
        notes: document.getElementById('case-notes').value
    };

    try {
        const response = await fetch(`${API_URL}/cases`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            alert('Expediente creado exitosamente\nID: ' + result.case_id);
            document.getElementById('case-form-modal').classList.remove('active');
            loadCases();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error creating case:', error);
        alert('Error al crear expediente');
    }
}

async function exportCases() {
    try {
        const response = await fetch(`${API_URL}/export/cases`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expedientes_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error exporting cases:', error);
        alert('Error al exportar expedientes');
    }
}

// ============================================================================
// REPORTS
// ============================================================================

async function generateInventoryReport() {
    const year = document.getElementById('inventory-year').value;
    const month = document.getElementById('inventory-month').value;
    const auditorId = document.getElementById('inventory-auditor').value;

    try {
        let url = `${API_URL}/reports/inventory?year=${year}&month=${month}`;
        if (auditorId) url += `&auditor_id=${auditorId}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const report = await response.json();
        renderInventoryReport(report);
    } catch (error) {
        console.error('Error generating inventory report:', error);
        alert('Error al generar reporte');
    }
}

function renderInventoryReport(report) {
    const container = document.getElementById('inventory-report-content');

    if (!report.data || report.data.length === 0) {
        container.innerHTML = '<p class="text-center">No hay datos disponibles para el período seleccionado</p>';
        return;
    }

    const monthNames = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    container.innerHTML = `
        <h3>PROCESO: FISCALIZACIÓN PROGRAMA - ${monthNames[report.month]} ${report.year}</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Código Programa</th>
                    <th>Auditor</th>
                    <th class="text-right">Inventario Inicial<br>(Expedientes que tenía)</th>
                    <th class="text-right">Asignados/Reasignados<br>(Entran al reparto)</th>
                    <th class="text-right">Evacuados/Reasignados<br>(Salen del reparto)</th>
                    <th class="text-right">Inventario Final<br>(A + B - C)</th>
                </tr>
            </thead>
            <tbody>
                ${report.data.map(row => `
                    <tr>
                        <td><strong>${row.codigo}</strong></td>
                        <td>${row.auditor}</td>
                        <td class="text-right">${row.inventario_inicial}</td>
                        <td class="text-right">${row.asignados_reasignados}</td>
                        <td class="text-right">${row.evacuados_reasignados}</td>
                        <td class="text-right"><strong>${row.inventario_final}</strong></td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="2"><strong>TOTAL</strong></td>
                    <td class="text-right"><strong>${report.totals.inventario_inicial}</strong></td>
                    <td class="text-right"><strong>${report.totals.asignados_reasignados}</strong></td>
                    <td class="text-right"><strong>${report.totals.evacuados_reasignados}</strong></td>
                    <td class="text-right"><strong>${report.totals.inventario_final}</strong></td>
                </tr>
            </tfoot>
        </table>
        <div class="mt-20">
            <button class="btn btn-secondary" onclick="exportInventoryReport()">📥 Exportar a Excel</button>
        </div>
    `;
}

async function generateProgramReport() {
    const year = document.getElementById('program-year').value;

    try {
        const response = await fetch(`${API_URL}/reports/cases-by-program?year=${year}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const report = await response.json();
        renderProgramReport(report);
    } catch (error) {
        console.error('Error generating program report:', error);
        alert('Error al generar reporte');
    }
}

function renderProgramReport(report) {
    const container = document.getElementById('program-report-content');

    if (report.length === 0) {
        container.innerHTML = '<p class="text-center">No hay datos disponibles</p>';
        return;
    }

    container.innerHTML = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Descripción</th>
                    <th class="text-right">Total</th>
                    <th class="text-right">Abiertos</th>
                    <th class="text-right">En Curso</th>
                    <th class="text-right">Cerrados</th>
                    <th class="text-right">G. Perceptiva</th>
                </tr>
            </thead>
            <tbody>
                ${report.map(row => `
                    <tr>
                        <td><strong>${row.program_code}</strong></td>
                        <td>${row.program_description}</td>
                        <td class="text-right"><strong>${row.total_cases}</strong></td>
                        <td class="text-right">${row.open_cases}</td>
                        <td class="text-right">${row.in_progress_cases}</td>
                        <td class="text-right">${row.closed_cases}</td>
                        <td class="text-right">${row.gestion_perceptiva_cases}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function generatePerformanceReport() {
    try {
        const response = await fetch(`${API_URL}/reports/auditor-performance`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const report = await response.json();
        renderPerformanceReport(report);
    } catch (error) {
        console.error('Error generating performance report:', error);
        alert('Error al generar reporte');
    }
}

function renderPerformanceReport(report) {
    const container = document.getElementById('performance-report-content');

    if (report.length === 0) {
        container.innerHTML = '<p class="text-center">No hay datos disponibles</p>';
        return;
    }

    container.innerHTML = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Auditor</th>
                    <th class="text-right">Total Casos</th>
                    <th class="text-right">Cerrados</th>
                    <th class="text-right">G. Perceptiva</th>
                    <th class="text-right">Actuaciones</th>
                    <th class="text-right">Gestiones</th>
                    <th class="text-right">Pagos</th>
                </tr>
            </thead>
            <tbody>
                ${report.map(row => `
                    <tr>
                        <td><strong>${row.full_name}</strong></td>
                        <td class="text-right">${row.total_cases}</td>
                        <td class="text-right">${row.closed_cases}</td>
                        <td class="text-right">${row.gestion_perceptiva_cases}</td>
                        <td class="text-right">${row.total_acts}</td>
                        <td class="text-right">${formatCurrency(row.total_monetary_actions)}</td>
                        <td class="text-right">${formatCurrency(row.total_payments)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ============================================================================
// GOALS
// ============================================================================

async function loadGoals() {
    const year = document.getElementById('goals-year').value;
    const month = document.getElementById('goals-month').value;

    try {
        let url = `${API_URL}/goals?year=${year}`;
        if (month) url += `&month=${month}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const goals = await response.json();
        renderGoals(goals);
    } catch (error) {
        console.error('Error loading goals:', error);
    }
}

function renderGoals(goals) {
    const tbody = document.querySelector('#goals-table tbody');
    tbody.innerHTML = '';

    if (goals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay metas establecidas</td></tr>';
        return;
    }

    const monthNames = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    goals.forEach(goal => {
        const percentage = goal.target_amount > 0 ? (goal.achieved_amount / goal.target_amount * 100).toFixed(1) : 0;
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${goal.year}</td>
            <td>${monthNames[goal.month]}</td>
            <td>${goal.auditor_name}</td>
            <td><span class="badge ${goal.goal_type === 'determinacion' ? 'badge-success' : 'badge-warning'}">${goal.goal_type === 'determinacion' ? 'Determinación' : 'Sanción'}</span></td>
            <td class="text-right">${formatCurrency(goal.target_amount)}</td>
            <td class="text-right">${formatCurrency(goal.achieved_amount)}</td>
            <td class="text-right">
                <span class="badge ${percentage >= 100 ? 'badge-success' : percentage >= 50 ? 'badge-warning' : 'badge-danger'}">
                    ${percentage}%
                </span>
            </td>
        `;
    });
}

async function openGoalForm() {
    await loadAuditors();
    document.getElementById('goal-form-modal').classList.add('active');
}

async function handleGoalSubmit(e) {
    e.preventDefault();

    const formData = {
        year: parseInt(document.getElementById('goal-year').value),
        month: parseInt(document.getElementById('goal-month').value),
        auditor_id: parseInt(document.getElementById('goal-auditor').value),
        goal_type: document.getElementById('goal-type').value,
        target_amount: parseFloat(document.getElementById('goal-amount').value)
    };

    try {
        const response = await fetch(`${API_URL}/goals`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            alert('Meta establecida exitosamente');
            document.getElementById('goal-form-modal').classList.remove('active');
            loadGoals();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error setting goal:', error);
        alert('Error al establecer meta');
    }
}

// ============================================================================
// ADMIN
// ============================================================================

async function loadAdminData() {
    await loadUsers();
    await loadProgramCodesAdmin();
    await loadTaxTypesAdmin();
}

async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const users = await response.json();
        renderUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function renderUsers(users) {
    const tbody = document.querySelector('#users-table tbody');
    tbody.innerHTML = '';

    users.forEach(user => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.full_name}</td>
            <td><span class="badge ${getRoleBadgeClass(user.role)}">${user.role}</span></td>
            <td>${formatDate(user.created_at)}</td>
            <td>
                <button class="btn btn-small btn-warning" onclick="editUser(${user.id})">Editar</button>
                <button class="btn btn-small btn-danger" onclick="deleteUser(${user.id})">Eliminar</button>
            </td>
        `;
    });
}

async function openUserForm(userId = null) {
    const modal = document.getElementById('user-form-modal');
    const form = document.getElementById('user-form');
    const title = document.getElementById('user-form-title');

    if (userId) {
        title.textContent = 'Editar Usuario';
        // Load user data
    } else {
        title.textContent = 'Nuevo Usuario';
        form.reset();
    }

    modal.classList.add('active');
}

async function handleUserSubmit(e) {
    e.preventDefault();

    const formData = {
        username: document.getElementById('user-username').value,
        full_name: document.getElementById('user-fullname').value,
        role: document.getElementById('user-role').value,
        password: document.getElementById('user-password').value
    };

    try {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            alert('Usuario creado exitosamente');
            document.getElementById('user-form-modal').classList.remove('active');
            loadUsers();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error creating user:', error);
        alert('Error al crear usuario');
    }
}

async function deleteUser(userId) {
    if (!confirm('¿Está seguro de eliminar este usuario?')) return;

    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            alert('Usuario eliminado exitosamente');
            loadUsers();
        } else {
            const result = await response.json();
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error al eliminar usuario');
    }
}

async function loadProgramCodesAdmin() {
    try {
        const response = await fetch(`${API_URL}/program-codes`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const codes = await response.json();
        
        // Get case counts
        const casesResponse = await fetch(`${API_URL}/cases`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const cases = await casesResponse.json();
        
        const caseCounts = {};
        cases.forEach(c => {
            caseCounts[c.program_code] = (caseCounts[c.program_code] || 0) + 1;
        });

        renderProgramCodesAdmin(codes, caseCounts);
    } catch (error) {
        console.error('Error loading program codes:', error);
    }
}

function renderProgramCodesAdmin(codes, caseCounts) {
    const tbody = document.querySelector('#programs-table tbody');
    tbody.innerHTML = '';

    codes.forEach(code => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><strong>${code.code}</strong></td>
            <td>${code.description}</td>
            <td class="text-right">${caseCounts[code.code] || 0}</td>
            <td><span class="badge ${code.active ? 'badge-success' : 'badge-danger'}">${code.active ? 'Activo' : 'Inactivo'}</span></td>
        `;
    });
}

async function loadTaxTypesAdmin() {
    try {
        const response = await fetch(`${API_URL}/tax-types`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const types = await response.json();
        
        // Get case counts
        const casesResponse = await fetch(`${API_URL}/cases`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const cases = await casesResponse.json();
        
        const caseCounts = {};
        cases.forEach(c => {
            caseCounts[c.tax_type] = (caseCounts[c.tax_type] || 0) + 1;
        });

        renderTaxTypesAdmin(types, caseCounts);
    } catch (error) {
        console.error('Error loading tax types:', error);
    }
}

function renderTaxTypesAdmin(types, caseCounts) {
    const tbody = document.querySelector('#taxes-table tbody');
    tbody.innerHTML = '';

    types.forEach(type => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><strong>${type.name}</strong></td>
            <td>${type.description || 'N/A'}</td>
            <td class="text-right">${caseCounts[type.name] || 0}</td>
            <td><span class="badge ${type.active ? 'badge-success' : 'badge-danger'}">${type.active ? 'Activo' : 'Inactivo'}</span></td>
        `;
    });
}

async function handleBulkImport() {
    const fileInput = document.getElementById('bulk-import-file');
    const resultBox = document.getElementById('bulk-import-result');

    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Por favor seleccione un archivo JSON');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
        try {
            const jsonData = JSON.parse(e.target.result);

            const response = await fetch(`${API_URL}/cases/bulk-import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonData)
            });

            const result = await response.json();

            resultBox.style.display = 'block';
            if (response.ok) {
                resultBox.className = 'result-box success';
                resultBox.innerHTML = `
                    <h4>✓ Importación Exitosa</h4>
                    <p>Casos importados: ${result.imported}</p>
                    <p>Errores: ${result.errors}</p>
                    ${result.errors > 0 ? `<pre>${JSON.stringify(result.errorDetails, null, 2)}</pre>` : ''}
                `;
                loadCases();
            } else {
                resultBox.className = 'result-box error';
                resultBox.innerHTML = `<h4>✗ Error</h4><p>${result.error}</p>`;
            }
        } catch (error) {
            resultBox.style.display = 'block';
            resultBox.className = 'result-box error';
            resultBox.innerHTML = `<h4>✗ Error</h4><p>Archivo JSON inválido: ${error.message}</p>`;
        }
    };

    reader.readAsText(file);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function loadProgramCodes() {
    try {
        const response = await fetch(`${API_URL}/program-codes`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const codes = await response.json();
        
        const select = document.getElementById('case-program-code');
        const filterSelect = document.getElementById('filter-program');
        
        if (select) {
            select.innerHTML = '<option value="">Seleccione...</option>';
            codes.forEach(code => {
                select.innerHTML += `<option value="${code.code}">${code.code} - ${code.description}</option>`;
            });
        }

        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">Todos los Programas</option>';
            codes.forEach(code => {
                filterSelect.innerHTML += `<option value="${code.code}">${code.code} - ${code.description}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading program codes:', error);
    }
}

async function loadTaxTypes() {
    try {
        const response = await fetch(`${API_URL}/tax-types`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const types = await response.json();
        
        const select = document.getElementById('case-tax-type');
        if (select) {
            select.innerHTML = '<option value="">Seleccione...</option>';
            types.forEach(type => {
                select.innerHTML += `<option value="${type.name}">${type.name}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading tax types:', error);
    }
}

async function loadAuditors() {
    try {
        const response = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const users = await response.json();
        const auditors = users.filter(u => u.role === 'Auditor');
        
        const selects = ['case-auditor', 'goal-auditor', 'inventory-auditor'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const currentOptions = select.innerHTML;
                select.innerHTML = selectId === 'inventory-auditor' ? '<option value="">Todos</option>' : '<option value="">Seleccione...</option>';
                auditors.forEach(auditor => {
                    select.innerHTML += `<option value="${auditor.id}">${auditor.full_name}</option>`;
                });
            }
        });
    } catch (error) {
        console.error('Error loading auditors:', error);
    }
}

function getStatusBadgeClass(status) {
    switch(status) {
        case 'Abierto': return 'badge-info';
        case 'En Curso': return 'badge-warning';
        case 'Cerrado': return 'badge-success';
        case 'Archivado': return 'badge-danger';
        default: return 'badge-info';
    }
}

function getRoleBadgeClass(role) {
    switch(role) {
        case 'Administrador': return 'badge-danger';
        case 'Supervisor': return 'badge-warning';
        case 'Auditor': return 'badge-success';
        default: return 'badge-info';
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO');
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

// ============================================================================
// PLACEHOLDER FUNCTIONS (To be implemented)
// ============================================================================

function addAdministrativeAct(caseId) {
    alert('Funcionalidad de agregar actuación administrativa - En desarrollo');
}

function addMonetaryAction(caseId) {
    alert('Funcionalidad de agregar gestión monetaria - En desarrollo');
}

function addPayment(caseId) {
    alert('Funcionalidad de agregar pago - En desarrollo');
}

function editUser(userId) {
    alert('Funcionalidad de editar usuario - En desarrollo');
}

function exportInventoryReport() {
    alert('Funcionalidad de exportar reporte - En desarrollo');
}