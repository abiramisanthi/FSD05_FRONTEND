import api from '../api.js';
import { showAlert, formatDate } from '../utils.js';
import auth from '../auth.js';

let currentPage = 1;
const limit = 20;
let currentSearch = '';

export const renderAuditLog = async () => {
    // Restrict access
    if (!auth.hasRole('ADMIN') && !auth.hasRole('APPROVER')) {
        window.location.href = '/login';
        return;
    }

    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="dashboard-container">
            <nav class="navbar">
                <div class="logo">Access <span>Portal</span> Audit Log</div>
                <div class="nav-links">
                    <span id="userGreeting"></span>
                    <a href="#" id="homeLink" class="nav-link">Dashboard</a>
                    <a href="#" id="analyticsLink" class="nav-link">Analytics</a>
                    <a href="#" id="logoutBtn" class="btn btn-secondary">Logout</a>
                </div>
            </nav>

            <main class="main-content">
                <div class="page-hero">
                    <div>
                        <h1>System Audit Logs 🛡️</h1>
                        <p>Immutable record of all critical system actions</p>
                    </div>
                </div>

                <div class="filter-bar">
                    <input type="text" id="searchInput" placeholder="Search logs (username, details)...">
                    <button class="btn btn-primary" id="searchBtn">Search</button>
                    <button class="btn btn-secondary" id="clearSearchBtn">Clear</button>
                </div>

                <div class="card">
                    <div style="overflow-x: auto;">
                        <table class="audit-table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody id="auditTableBody">
                                <tr><td colspan="4" style="text-align:center;">Loading logs...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="pagination" id="pagination">
                        <!-- Pagination controls injected here -->
                    </div>
                </div>
            </main>
        </div>
    `;

    // Navigation setup
    const user = auth.getUser();
    document.getElementById('userGreeting').innerText = `Hello, ${user.username}`;

    document.getElementById('homeLink').addEventListener('click', (e) => {
        e.preventDefault();
        window.history.pushState({}, '', '/approver-dashboard');
        window.dispatchEvent(new Event('popstate'));
    });
    
    document.getElementById('analyticsLink').addEventListener('click', (e) => {
        e.preventDefault();
        window.history.pushState({}, '', '/analytics');
        window.dispatchEvent(new Event('popstate'));
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await api.logout();
        window.history.pushState({}, '', '/login');
        window.dispatchEvent(new Event('popstate'));
    });

    // Search events
    document.getElementById('searchBtn').addEventListener('click', () => {
        currentSearch = document.getElementById('searchInput').value.trim();
        currentPage = 1;
        fetchLogs();
    });

    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentSearch = e.target.value.trim();
            currentPage = 1;
            fetchLogs();
        }
    });

    document.getElementById('clearSearchBtn').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        currentSearch = '';
        currentPage = 1;
        fetchLogs();
    });

    // Initial load
    fetchLogs();
};

async function fetchLogs() {
    try {
        const tbody = document.getElementById('auditTableBody');
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';
        
        const data = await api.getAuditLogs({ page: currentPage, limit, search: currentSearch });
        
        if (!data.logs || data.logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No logs found.</td></tr>';
            document.getElementById('pagination').innerHTML = '';
            return;
        }

        tbody.innerHTML = data.logs.map(log => {
            const date = new Date(log.timestamp).toLocaleString();
            let badgeClass = 'action-badge ' + getActionBadgeClass(log.action);
            
            return `
                <tr>
                    <td style="white-space: nowrap; font-size: 0.8rem;">${date}</td>
                    <td><b>${log.username || 'System'}</b></td>
                    <td><span class="${badgeClass}">${log.action.replace('_', ' ')}</span></td>
                    <td>${log.details || '-'}</td>
                </tr>
            `;
        }).join('');

        renderPagination(data.page, data.totalPages);
    } catch (err) {
        console.error(err);
        document.getElementById('auditTableBody').innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Failed to load logs.</td></tr>`;
    }
}

function getActionBadgeClass(action) {
    if (action.includes('LOGIN')) return 'login';
    if (action.includes('LOGOUT')) return 'logout';
    if (action.includes('REGISTER')) return 'register';
    if (action.includes('CREATED')) return 'created';
    if (action.includes('APPROVED')) return 'approved';
    if (action.includes('REJECTED')) return 'rejected';
    if (action.includes('EXPORT')) return 'export';
    if (action.includes('AI')) return 'ai';
    return '';
}

function renderPagination(page, totalPages) {
    const pag = document.getElementById('pagination');
    if (totalPages <= 1) {
        pag.innerHTML = '';
        return;
    }

    pag.innerHTML = `
        <button id="prevPage" ${page === 1 ? 'disabled' : ''}>Previous</button>
        <span class="page-info">Page ${page} of ${totalPages}</span>
        <button id="nextPage" ${page === totalPages ? 'disabled' : ''}>Next</button>
    `;

    if (page > 1) {
        document.getElementById('prevPage').addEventListener('click', () => {
            currentPage--;
            fetchLogs();
        });
    }

    if (page < totalPages) {
        document.getElementById('nextPage').addEventListener('click', () => {
            currentPage++;
            fetchLogs();
        });
    }
}
