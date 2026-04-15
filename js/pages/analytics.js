import api from '../api.js';
import { showAlert, formatDate } from '../utils.js';
import auth from '../auth.js';

export const renderAnalytics = async () => {
    // Restrict access
    if (!auth.hasRole('APPROVER') && !auth.hasRole('ADMIN')) {
        window.location.href = '/login';
        return;
    }

    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="dashboard-container">
            <nav class="navbar">
                <div class="logo">Access <span>Portal</span> Analytics</div>
                <div class="nav-links">
                    <span id="userGreeting"></span>
                    <a href="#" id="homeLink" class="nav-link">Dashboard</a>
                    <a href="#" id="auditLink" class="nav-link" style="display: none;">Audit Logs</a>
                    <a href="#" id="logoutBtn" class="btn btn-secondary">Logout</a>
                </div>
            </nav>

            <main class="main-content">
                <div class="page-hero">
                    <div>
                        <h1>Analytics & Reporting 📈</h1>
                        <p>Real-time insights on access requests and approval efficiency</p>
                    </div>
                    <div>
                        <button id="exportCsvBtn" class="export-btn csv">📊 Export CSV</button>
                        <button id="exportPdfBtn" class="export-btn pdf">📄 Export PDF</button>
                    </div>
                </div>

                <div id="analyticsLoader" class="loader">Loading analytics data...</div>
                
                <div id="analyticsContent" style="display: none;">
                    <!-- Top stats -->
                    <div class="analytics-grid" id="statsGrid"></div>

                    <!-- Charts row -->
                    <div class="charts-grid">
                        <div class="chart-card">
                            <h3>Volume Trend (Last 6 Months)</h3>
                            <canvas id="trendChart"></canvas>
                        </div>
                        <div class="chart-card">
                            <h3>Approval Rate</h3>
                            <canvas id="rateChart"></canvas>
                        </div>
                        <div class="chart-card">
                            <h3>Requests by Access Type</h3>
                            <canvas id="typeChart"></canvas>
                        </div>
                        <div class="chart-card">
                            <h3>Requests by ML Risk Level</h3>
                            <canvas id="riskChart"></canvas>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    `;

    // Setup navigation
    const user = auth.getUser();
    document.getElementById('userGreeting').innerText = `Hello, ${user.username}`;
    document.getElementById('homeLink').addEventListener('click', (e) => {
        e.preventDefault();
        window.history.pushState({}, '', '/approver-dashboard');
        window.dispatchEvent(new Event('popstate'));
    });
    
    if (auth.hasRole('ADMIN')) {
        const auditLink = document.getElementById('auditLink');
        auditLink.style.display = 'inline-block';
        auditLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/audit-log');
            window.dispatchEvent(new Event('popstate'));
        });
    }

    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await api.logout();
        window.history.pushState({}, '', '/login');
        window.dispatchEvent(new Event('popstate'));
    });

    // Export binds
    document.getElementById('exportCsvBtn').addEventListener('click', () => {
        window.open(api.getExportUrl('csv'), '_blank');
    });
    document.getElementById('exportPdfBtn').addEventListener('click', () => {
        window.open(api.getExportUrl('pdf'), '_blank');
    });

    // Fetch data
    try {
        const data = await api.getAnalytics();
        document.getElementById('analyticsLoader').style.display = 'none';
        document.getElementById('analyticsContent').style.display = 'block';

        renderStats(data.summary);
        renderCharts(data);

    } catch (error) {
        document.getElementById('analyticsLoader').innerText = `Error loading analytics: ${error.message}`;
    }
};

function renderStats(summary) {
    const grid = document.getElementById('statsGrid');
    grid.innerHTML = `
        <div class="stat-card" style="--card-accent: linear-gradient(90deg, #6366f1, #8b5cf6);">
            <div class="stat-label">Total Requests</div>
            <div class="stat-value">${summary.totalRequests}</div>
            <div class="stat-icon" style="position: absolute; right: 20px; bottom: 20px; opacity: 0.1;">📂</div>
        </div>
        <div class="stat-card" style="--card-accent: linear-gradient(90deg, #10b981, #34d399);">
            <div class="stat-label">Approval Rate</div>
            <div class="stat-value">${summary.approvalRate}%</div>
            <div class="stat-icon" style="position: absolute; right: 20px; bottom: 20px; opacity: 0.1;">✅</div>
        </div>
        <div class="stat-card" style="--card-accent: linear-gradient(90deg, #ef4444, #f87171);">
            <div class="stat-label">Pending Reviews</div>
            <div class="stat-value">${summary.pending}</div>
            <div class="stat-icon" style="position: absolute; right: 20px; bottom: 20px; opacity: 0.1;">⏳</div>
        </div>
        <div class="stat-card" style="--card-accent: linear-gradient(90deg, #f59e0b, #fbbf24);">
            <div class="stat-label">Avg Decision Time</div>
            <div class="stat-value">${summary.avgDecisionTime}h</div>
            <div class="stat-icon" style="position: absolute; right: 20px; bottom: 20px; opacity: 0.1;">⏱️</div>
        </div>
    `;
}

function renderCharts(data) {
    // 1. Line Chart: Volume Trend
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendLabels = data.byMonth.map(item => `${months[item._id.month - 1]} ${item._id.year}`);
    const trendTotals = data.byMonth.map(item => item.total);
    const trendApproved = data.byMonth.map(item => item.approved);

    new Chart(document.getElementById('trendChart'), {
        type: 'line',
        data: {
            labels: trendLabels,
            datasets: [
                {
                    label: 'Total Requests',
                    data: trendTotals,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99,102,241,0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Approved',
                    data: trendApproved,
                    borderColor: '#10b981',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.3
                }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // 2. Doughnut Chart: Approval Rate
    new Chart(document.getElementById('rateChart'), {
        type: 'doughnut',
        data: {
            labels: ['Approved', 'Rejected', 'Pending'],
            datasets: [{
                data: [data.summary.approved, data.summary.rejected, data.summary.pending],
                backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
    });

    // 3. Bar Chart: Access Type
    const typeLabels = data.byAccessType.map(item => item._id);
    const typeData = data.byAccessType.map(item => item.count);

    new Chart(document.getElementById('typeChart'), {
        type: 'bar',
        data: {
            labels: typeLabels,
            datasets: [{
                label: 'Requests',
                data: typeData,
                backgroundColor: ['#8b5cf6', '#3b82f6', '#14b8a6', '#f43f5e'],
                borderRadius: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // 4. Pie Chart: Risk Level
    const riskLabels = data.byRiskLevel.map(item => item._id || 'UNRATED');
    const riskData = data.byRiskLevel.map(item => item.count);

    new Chart(document.getElementById('riskChart'), {
        type: 'doughnut',
        data: {
            labels: riskLabels,
            datasets: [{
                data: riskData,
                backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#9ca3af'], // HIGH, MED, LOW, UNRATED
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}
