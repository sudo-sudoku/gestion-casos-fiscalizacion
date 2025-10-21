// Estado Global
let currentUser = null;
let authToken = null;
let allCases = [];
let allUsers = [];
let programs = [];
let taxTypes = [];

// URL Base de la API
const API_URL = window.location.origin + '/api';

// Funciones de Utilidad
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CO');
};

const showError = (message) => {
    alert('Error: ' + message);
};

const showSuccess = (message) => {
    alert('Éxito: ' + message);
};

// Llamadas a la API con autenticación
const apiCall = async (endpoint, options = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error en la solicitud');
        }

        return await response.json();
    } catch (error) {
        console.error('Error en API:', error);
        throw error;
    }
};

// Autenticación
const login = async (username, password) => {
    try {
        const data = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        return true;
    } catch (error) {
        throw error;
    }
};

const logout = () => {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showScreen('login');
};

const checkAuth = async () => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');

    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);

        try {
            await apiCall('/auth/me');
            showScreen('app');
            return true;
        } catch (error) {
            logout();
            return false;
        }
    }
    return false;
};

// Gestión de Pantallas
const showScreen = (screen) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    if (screen === 'login') {
        document.getElementById('loginScreen').classList.add('active');
    } else if (screen === 'app') {
        document.getElementById('appScreen').classList.add('active');
        initApp();
    }
};

// Inicializar Aplicación
const initApp = async () => {
    document.getElementById('userInfo').textContent = `${currentUser.name} (${currentUser.role})`;

    if (currentUser.role === 'admin' || currentUser.role === 'supervisor') {
        document.getElementById('usersNavBtn').style.display = 'block';
    }

    if (currentUser.role === 'admin' || currentUser.role === 'supervisor') {
        document.getElementById('addCaseBtn').style.display = 'flex';
    }

    await loadReferenceData();
    showView('dashboard');
};

// Cargar Datos de Referencia
const loadReferenceData = async () => {
    try {
        programs = await apiCall('/reference/programs');
        taxTypes = await apiCall('/reference/tax-types');
        allUsers = await apiCall('/users/auditors');

        populateFilters();
    } catch (error) {
        console.error('Error al cargar datos de referencia:', error);
    }
};

const populateFilters = () => {
    const programSelects = ['programFilter', 'caseProgramCode', 'programReportFilter'];
    programSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = selectId === 'programFilter' ? '<option value="">Todos los Programas</option>' : 
                              selectId === 'programReportFilter' ? '<option value="">Seleccionar Programa</option>' :
                              '<option value="">Seleccionar...</option>';
            programs.forEach(program => {
                const option = document.createElement('option');
                option.value = program.code;
                option.textContent = `${program.code} - ${program.description}`;
                select.appendChild(option);
            });
            select.value = currentValue;
        }
    });

    const taxSelects = ['taxTypeFilter', 'caseTaxType'];
    taxSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = selectId === 'taxTypeFilter' ? '<option value="">Todos los Impuestos</option>' : '<option value="">Seleccionar...</option>';
            taxTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type.name;
                option.textContent = type.name;
                select.appendChild(option);
            });
            select.value = currentValue;
        }
    });

    const auditorSelects = ['auditorFilter', 'caseAuditor'];
    auditorSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = selectId === 'auditorFilter' ? '<option value="">Todos los Auditores</option>' : '<option value="">Seleccionar...</option>';
            allUsers.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name;
                select.appendChild(option);
            });
            select.value = currentValue;
        }
    });
};

// Gestión de Vistas
const showView = (viewName) => {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(`${viewName}View`).classList.add('active');
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

    switch(viewName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'cases':
            loadCases();
            break;
        case 'reports':
            loadReports();
            break;
        case 'users':
            loadUsers();
            break;
    }
};

// Dashboard
const loadDashboard = async () => {
    try {
        const stats = await apiCall('/reports/dashboard');
        
        document.getElementById('totalCases').textContent = stats.total_cases;
        document.getElementById('activeCases').textContent = stats.active_cases;
        document.getElementById('closedCases').textContent = stats.closed_cases;
        document.getElementById('gestionPerceptiva').textContent = stats.gestion_perceptiva;
        document.getElementById('totalAuditors').textContent = stats.total_auditors;
        document.getElementById('totalAmount').textContent = formatCurrency(stats.total_amount);
    } catch (error) {
        showError('Error al cargar estadísticas');
    }
};

// Casos
const loadCases = async () => {
    try {
        const filters = {
            search: document.getElementById('searchInput').value,
            program: document.getElementById('programFilter').value,
            tax_type: document.getElementById('taxTypeFilter').value,
            auditor: document.getElementById('auditorFilter').value,
            status: document.getElementById('statusFilter').value,
            gestion_perceptiva: document.getElementById('gestionFilter').value
        };

        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) queryParams.append(key, value);
        });

        allCases = await apiCall(`/cases?${queryParams.toString()}`);
        renderCasesTable();
    } catch (error) {
        showError('Error al cargar casos');
    }
};

const renderCasesTable = () => {
    const tbody = document.getElementById('casesTableBody');
    
    if (allCases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center">No se encontraron casos</td></tr>';
        return;
    }

    tbody.innerHTML = allCases.map(c => {
        const auditor = allUsers.find(u => u.id === c.auditor_id);
        const statusBadge = c.status === 'Activo' || c.status === 'En Curso' ? 'badge-success' : 
                           c.status === 'Cerrado' || c.status === 'Evacuado' ? 'badge-danger' : 'badge-warning';
        
        return `
            <tr>
                <td>${c.case_id}</td>
                <td>${c.nit}</td>
                <td>${c.taxpayer_name}</td>
                <td>${c.program_code}</td>
                <td>${c.tax_type}</td>
                <td>${c.taxable_year}</td>
                <td>${auditor ? auditor.name : '-'}</td>
                <td>${c.gestion_perceptiva ? '✅' : '❌'}</td>
                <td><span class="badge ${statusBadge}">${c.status}</span></td>
                <td>
                    ${currentUser.role !== 'auditor' || c.auditor_id === currentUser.id ? 
                        `<button class="btn btn-sm btn-primary" onclick="editCase(${c.id})">Editar</button>` : 
                        `<button class="btn btn-sm btn-secondary" onclick="viewCase(${c.id})">Ver</button>`
                    }
                    ${currentUser.role === 'admin' ? 
                        `<button class="btn btn-sm btn-danger" onclick="deleteCase(${c.id})">Eliminar</button>` : ''
                    }
                </td>
            </tr>
        `;
    }).join('');
};

const openCaseModal = (caseData = null) => {
    const modal = document.getElementById('caseModal');
    const form = document.getElementById('caseForm');
    const title = document.getElementById('caseModalTitle');

    form.reset();
    
    if (caseData) {
        title.textContent = 'Editar Caso';
        document.getElementById('caseId').value = caseData.id;
        document.getElementById('caseNit').value = caseData.nit;
        document.getElementById('caseTaxpayerName').value = caseData.taxpayer_name;
        document.getElementById('caseProgramCode').value = caseData.program_code;
        document.getElementById('caseTaxType').value = caseData.tax_type;
        document.getElementById('caseOpeningYear').value = caseData.opening_year;
        document.getElementById('caseTaxableYear').value = caseData.taxable_year;
        document.getElementById('casePeriod').value = caseData.period || '';
        document.getElementById('caseAuditor').value = caseData.auditor_id;
        document.getElementById('caseStatus').value = caseData.status;
        document.getElementById('caseGestionPerceptiva').checked = caseData.gestion_perceptiva === 1;
        document.getElementById('caseNotes').value = caseData.notes || '';
    } else {
        title.textContent = 'Nuevo Caso';
        document.getElementById('caseOpeningYear').value = new Date().getFullYear();
    }

    modal.classList.add('active');
};

const editCase = async (caseId) => {
    try {
        const caseData = await apiCall(`/cases/${caseId}`);
        openCaseModal(caseData);
    } catch (error) {
        showError('Error al cargar caso');
    }
};

const viewCase = async (caseId) => {
    await editCase(caseId);
    document.querySelectorAll('#caseForm input, #caseForm select, #caseForm textarea').forEach(field => {
        field.disabled = true;
    });
    document.querySelector('#caseForm button[type="submit"]').style.display = 'none';
};

const deleteCase = async (caseId) => {
    if (!confirm('¿Está seguro de eliminar este caso?')) return;

    try {
        await apiCall(`/cases/${caseId}`, { method: 'DELETE' });
        showSuccess('Caso eliminado exitosamente');
        loadCases();
    } catch (error) {
        showError('Error al eliminar caso');
    }
};

const saveCaseForm = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const caseId = formData.get('id');
    
    const data = {
        nit: formData.get('nit'),
        taxpayer_name: formData.get('taxpayer_name'),
        program_code: formData.get('program_code'),
        tax_type: formData.get('tax_type'),
        opening_year: parseInt(formData.get('opening_year')),
        taxable_year: parseInt(formData.get('taxable_year')),
        period: formData.get('period'),
        auditor_id: parseInt(formData.get('auditor_id')),
        status: formData.get('status'),
        gestion_perceptiva: formData.get('gestion_perceptiva') === 'on',
        notes: formData.get('notes')
    };

    if (!caseId) {
        data.case_id = `${data.nit}-${data.program_code}-${data.tax_type}-${data.opening_year}-${data.taxable_year}-${data.period || '1'}`;
    }

    try {
        if (caseId) {
            await apiCall(`/cases/${caseId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            showSuccess('Caso actualizado exitosamente');
        } else {
            await apiCall('/cases', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            showSuccess('Caso creado exitosamente');
        }

        document.getElementById('caseModal').classList.remove('active');
        loadCases();
    } catch (error) {
        showError(error.message);
    }
};

// Reportes
const loadReports = () => {
    loadInventoryReport();
};

const loadInventoryReport = async () => {
    try {
        const report = await apiCall('/reports/inventory');
        const tbody = document.getElementById('inventoryReportBody');
        
        if (report.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay datos</td></tr>';
            return;
        }

        tbody.innerHTML = report.map(r => `
            <tr>
                <td>${r.program_code}</td>
                <td>${r.total_cases}</td>
                <td>${r.gestion_perceptiva_count}</td>
                <td>${r.active_cases}</td>
                <td>${r.closed_cases}</td>
            </tr>
        `).join('');
    } catch (error) {
        showError('Error al cargar reporte de inventario');
    }
};

const loadProgramReport = async () => {
    const program = document.getElementById('programReportFilter').value;
    
    if (!program) {
        showError('Seleccione un programa');
        return;
    }

    try {
        const report = await apiCall(`/reports/by-program?program=${program}`);
        const tbody = document.getElementById('programReportBody');
        
        if (report.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay datos para este programa</td></tr>';
            return;
        }

        tbody.innerHTML = report.map(r => `
            <tr>
                <td>${r.case_id}</td>
                <td>${r.taxpayer_name}</td>
                <td>${r.auditor_name || '-'}</td>
                <td><span class="badge ${r.status === 'Activo' || r.status === 'En Curso' ? 'badge-success' : 'badge-danger'}">${r.status}</span></td>
                <td>${formatCurrency(r.total_amount)}</td>
            </tr>
        `).join('');
    } catch (error) {
        showError('Error al cargar reporte por programa');
    }
};

const loadAuditorReport = async () => {
    try {
        const report = await apiCall('/reports/auditor-performance');
        const tbody = document.getElementById('auditorReportBody');
        
        if (report.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay datos</td></tr>';
            return;
        }

        tbody.innerHTML = report.map(r => `
            <tr>
                <td>${r.auditor_name}</td>
                <td>${r.total_cases}</td>
                <td>${r.gestion_perceptiva_count}</td>
                <td>${r.active_cases}</td>
                <td>${r.closed_cases}</td>
                <td>${formatCurrency(r.total_amount)}</td>
            </tr>
        `).join('');
    } catch (error) {
        showError('Error al cargar reporte de auditores');
    }
};

// Usuarios
const loadUsers = async () => {
    try {
        const users = await apiCall('/users');
        const tbody = document.getElementById('usersTableBody');
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay usuarios</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(u => `
            <tr>
                <td>${u.username}</td>
                <td>${u.name}</td>
                <td><span class="badge badge-info">${u.role}</span></td>
                <td>${formatDate(u.created_at)}</td>
            </tr>
        `).join('');
    } catch (error) {
        showError('Error al cargar usuarios');
    }
};

const openUserModal = () => {
    const modal = document.getElementById('userModal');
    document.getElementById('userForm').reset();
    modal.classList.add('active');
};

const saveUserForm = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        username: formData.get('username'),
        password: formData.get('password'),
        name: formData.get('name'),
        role: formData.get('role')
    };

    try {
        await apiCall('/users', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showSuccess('Usuario creado exitosamente');
        document.getElementById('userModal').classList.remove('active');
        loadUsers();
        loadReferenceData();
    } catch (error) {
        showError(error.message);
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
        showScreen('login');
    }

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        try {
            await login(username, password);
            showScreen('app');
            errorDiv.style.display = 'none';
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        }
    });

    document.getElementById('logoutBtn').addEventListener('click', logout);

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showView(btn.dataset.view);
        });
    });

    ['searchInput', 'programFilter', 'taxTypeFilter', 'auditorFilter', 'statusFilter', 'gestionFilter'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', loadCases);
            if (id === 'searchInput') {
                element.addEventListener('input', debounce(loadCases, 500));
            }
        }
    });

    document.getElementById('addCaseBtn').addEventListener('click', () => openCaseModal());
    document.getElementById('caseForm').addEventListener('submit', saveCaseForm);

    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('active');
            document.querySelectorAll('#caseForm input, #caseForm select, #caseForm textarea').forEach(field => {
                field.disabled = false;
            });
            document.querySelector('#caseForm button[type="submit"]').style.display = 'inline-flex';
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.report-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const reportType = btn.dataset.report;
            document.getElementById(`${reportType}Report`).classList.add('active');

            if (reportType === 'inventory') {
                loadInventoryReport();
            } else if (reportType === 'auditor') {
                loadAuditorReport();
            }
        });
    });

    document.getElementById('loadProgramReport').addEventListener('click', loadProgramReport);
    document.getElementById('addUserBtn').addEventListener('click', openUserModal);
    document.getElementById('userForm').addEventListener('submit', saveUserForm);
});

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

window.editCase = editCase;
window.viewCase = viewCase;
window.deleteCase = deleteCase;