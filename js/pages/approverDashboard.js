import api from '../api.js';
import auth from '../auth.js';
import router from '../router.js';
import {
  showAlert,
  formatDate,
  getStatusBadge,
  setButtonLoading
} from '../utils.js';

let currentPage = 1;

export function renderApproverDashboard() {

  const user = auth.getCurrentUser();
  const app = document.getElementById('app');

  const isAdmin = auth.hasRole('ADMIN');

  app.innerHTML = `
    <nav class="navbar">
      <div class="navbar-content">
        <div class="navbar-brand">
          Access Portal
        </div>

        <div class="navbar-menu">

          ${isAdmin ? `
            <a href="#"
               id="analyticsLink"
               class="nav-link"
               style="margin-right:15px;color:white;">
               Analytics
            </a>

            <a href="#"
               id="auditLink"
               class="nav-link"
               style="margin-right:15px;color:white;">
               Audit Logs
            </a>
          ` : ''}

          <div class="user-info">
            <div class="user-avatar">
              ${auth.getUserInitials()}
            </div>

            <div class="user-details">
              <div class="user-name">
                ${user.username}
              </div>

              <div class="user-role">
                ${user.role}
              </div>
            </div>
          </div>

          <button
            class="btn btn-logout"
            id="logout-btn">
            Logout
          </button>

        </div>
      </div>
    </nav>

    <div class="dashboard">
      <div class="container">

        <div class="dashboard-header
                    flex
                    justify-between
                    items-center"
             style="margin-bottom:24px;">

          <div>
            <h1 class="dashboard-title">
              Access Request Management
            </h1>

            <p class="dashboard-subtitle">
              Review and approve access
              requests with AI assistance
            </p>
          </div>

          <div style="display:flex;gap:10px;">
            <button id="exportCsvBtn"
                    class="export-btn csv">
              📊 CSV
            </button>

            <button id="exportPdfBtn"
                    class="export-btn pdf">
              📄 PDF
            </button>
          </div>

        </div>

        <div class="dashboard-grid"
             id="stats-container">
        </div>

        <div class="card"
             style="margin-top:24px;">

          <div class="card-header
                      flex
                      justify-between
                      items-center">

            <div>
              <h2 class="card-title">
                All Access Requests
              </h2>

              <div id="anomalyAlert"
                   style="
                     display:none;
                     background:#fee2e2;
                     color:#991b1b;
                     padding:10px;
                     border-radius:8px;
                     margin-top:10px;
                     font-weight:600;
                   ">
                🚨 AI Alert:
                High request frequency detected
              </div>

            </div>

            <button
              class="btn btn-secondary"
              id="refresh-btn">
              🔄 Refresh
            </button>

          </div>

          <div class="filter-bar">

            <input
              type="text"
              id="searchInput"
              placeholder="Search resources or users...">

            <select id="statusFilter">

              <option value="">
                All Statuses
              </option>

              <option value="PENDING"
                      selected>
                Pending
              </option>

              <option value="APPROVED">
                Approved
              </option>

              <option value="REJECTED">
                Rejected
              </option>

            </select>

            <select id="riskFilter">

              <option value="">
                All Risks
              </option>

              <option value="LOW">
                Low Risk
              </option>

              <option value="MEDIUM">
                Medium Risk
              </option>

              <option value="HIGH">
                High Risk
              </option>

            </select>

            <button
              class="btn btn-primary"
              id="searchBtn">
              Search
            </button>

          </div>

          <div id="requests-container">

            <div class="text-center"
                 style="padding:2rem;">
              <span class="spinner"></span>
              Loading requests...
            </div>

          </div>

        </div>

      </div>
    </div>
  `;

  loadRequests();

  if (isAdmin) {

    document
      .getElementById('analyticsLink')
      .addEventListener(
        'click',
        (e) => {

          e.preventDefault();

          router.navigate(
            '/analytics'
          );

        }
      );

    document
      .getElementById('auditLink')
      .addEventListener(
        'click',
        (e) => {

          e.preventDefault();

          router.navigate(
            '/audit-log'
          );

        }
      );

  }

  document
    .getElementById('exportCsvBtn')
    .addEventListener(
      'click',
      async (e) => {

        const btn = e.target;

        setButtonLoading(
          btn,
          true
        );

        try {

          await api.downloadExport(
            'csv'
          );

        }
        catch (err) {

          showAlert(
            err.message,
            'error'
          );

        }

        setButtonLoading(
          btn,
          false
        );

      }
    );

  document
    .getElementById('exportPdfBtn')
    .addEventListener(
      'click',
      async (e) => {

        const btn = e.target;

        setButtonLoading(
          btn,
          true
        );

        try {

          await api.downloadExport(
            'pdf'
          );

        }
        catch (err) {

          showAlert(
            err.message,
            'error'
          );

        }

        setButtonLoading(
          btn,
          false
        );

      }
    );

  document
    .getElementById('searchBtn')
    .addEventListener(
      'click',
      () => {

        currentPage = 1;

        loadRequests();

      }
    );

  document
    .getElementById('logout-btn')
    .addEventListener(
      'click',
      () => {

        api.logout()
          .then(
            () => {

              router.navigate(
                '/login'
              );

            }
          );

      }
    );

  document
    .getElementById('refresh-btn')
    .addEventListener(
      'click',
      () => {

        document
          .getElementById(
            'searchInput'
          ).value = '';

        document
          .getElementById(
            'statusFilter'
          ).value = '';

        document
          .getElementById(
            'riskFilter'
          ).value = '';

        currentPage = 1;

        loadRequests();

      }
    );

}

async function loadRequests() {

  const container =
    document.getElementById(
      'requests-container'
    );

  const statsContainer =
    document.getElementById(
      'stats-container'
    );

  const search =
    document.getElementById(
      'searchInput'
    ).value;

  const status =
    document.getElementById(
      'statusFilter'
    ).value;

  const riskLevel =
    document.getElementById(
      'riskFilter'
    ).value;

  try {

    const [
      reqData,
      analytics
    ] =
      await Promise.all([

        api.getAllRequests({
          page: currentPage,
          limit: 10,
          search,
          status,
          riskLevel
        }),

        api.getAnalytics()

      ]);

    const requests =
      reqData.requests;

    statsContainer.innerHTML = `

      <div class="stat-card">
        <div class="stat-icon pending">
          ⏳
        </div>
        <div class="stat-content">
          <div class="stat-label">
            System Pending
          </div>
          <div class="stat-value">
            ${analytics.summary.pending}
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon approved">
          ✓
        </div>
        <div class="stat-content">
          <div class="stat-label">
            System Approved
          </div>
          <div class="stat-value">
            ${analytics.summary.approved}
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon rejected">
          ✕
        </div>
        <div class="stat-content">
          <div class="stat-label">
            System Rejected
          </div>
          <div class="stat-value">
            ${analytics.summary.rejected}
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon"
             style="background:#7c3aed;">
          🤖
        </div>
        <div class="stat-content">
          <div class="stat-label">
            AI Insights
          </div>
          <div class="stat-value">
            High Risk:
            ${analytics.riskDistribution?.HIGH || 0}
          </div>
        </div>
      </div>

    `;

    // ── Empty state ──────────────────────────────────────────────────────────
    if (requests.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <h3 class="empty-state-title">No requests found</h3>
          <p>There are no access requests matching your filters</p>
        </div>
      `;
      return;
    }

    // ── Anomaly Detection Alert ───────────────────────────────────────────────
    if (requests.length >= 3) {
      const alertBox = document.getElementById('anomalyAlert');
      if (alertBox) alertBox.style.display = 'block';
    }

    container.innerHTML = `

      <div class="table-container">

        <table class="table">

          <thead>
            <tr>
              <th>Requester</th>
              <th>Resource / Reason</th>
              <th>Type</th>
              <th>Risk / AI Score</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            ${requests.map(
      req => `

              <tr>

                <td>
                  <strong>
                    ${req.requesterName}
                  </strong>
                </td>

                <td>
                  <strong>
                    ${req.resourceName}
                  </strong>
                  <p>
                    "${req.reason}"
                  </p>
                </td>

                <td>
                  ${req.accessType}
                </td>

                <td>

                  ${getRiskBadge(
        req.riskLevel
      )}

                  <br>

                  ${req.aiValidationScore
          ? `
                      <span
                        class="ai-score-badge">

                        🤖
                        ${req.aiValidationScore}/10

                      </span>
                    `
          : ''
        }

                  ${req.recommendation
          ? `
                      <div
                        style="
                          margin-top:6px;
                          color:#22c55e;
                          font-weight:600;
                        ">

                        ${req.recommendation}

                      </div>
                    `
          : ''
        }

                  ${req.confidence
          ? `
                      <div
                        style="
                          font-size:12px;
                          color:#94a3b8;
                        ">

                        Confidence:
                        ${req.confidence}%

                      </div>
                    `
          : ''
        }

                </td>

                <td>
                  ${getStatusBadge(
          req.status
        )}
                </td>

                <td>
                  ${formatDate(
          req.createdAt
        )}
                </td>

                <td>

                  ${req.status === 'PENDING'
          ? `
                      <button
                        class="btn btn-success btn-sm approve-btn"
                        data-id="${req._id}">

                        Approve

                      </button>

                      <button
                        class="btn btn-danger btn-sm reject-btn"
                        data-id="${req._id}">

                        Reject

                      </button>
                    `
          : `
                      Reviewed
                    `
        }

                </td>

              </tr>

            `
    ).join('')}

          </tbody>

        </table>

      </div>

      <div class="pagination" id="reqPagination"></div>

    `;

    // ── Wire up pagination & action buttons ────────────────────────────────────
    renderPagination(reqData.page, reqData.totalPages, 'reqPagination');

    document.querySelectorAll('.approve-btn').forEach(btn =>
      btn.addEventListener('click', () => handleApprove(btn))
    );
    document.querySelectorAll('.reject-btn').forEach(btn =>
      btn.addEventListener('click', () => handleReject(btn))
    );

  }
  catch (error) {

    container.innerHTML = `
      <div class="alert alert-error">
        Failed to load requests: ${error.message}
      </div>
    `;

  }

}

// ─── Approve ──────────────────────────────────────────────────────────────────
async function handleApprove(btn) {
  const requestId = btn.dataset.id;
  const comments = prompt('Approve this request?\n\nOptional comments:');
  if (comments === null) return;

  setButtonLoading(btn, true);
  try {
    await api.updateRequestStatus(requestId, {
      status: 'APPROVED',
      comments: comments || 'Approved via dashboard'
    });
    showAlert('Request approved successfully!', 'success');
    loadRequests();
  } catch (error) {
    showAlert(error.message, 'error');
    setButtonLoading(btn, false);
  }
}

// ─── Reject ───────────────────────────────────────────────────────────────────
async function handleReject(btn) {
  const requestId = btn.dataset.id;
  const comments = prompt('Reject this request?\n\nReason for rejection (required):');
  if (comments === null) return;
  if (!comments.trim()) {
    showAlert('Please provide a reason for rejection', 'error');
    return;
  }

  setButtonLoading(btn, true);
  try {
    await api.updateRequestStatus(requestId, { status: 'REJECTED', comments });
    showAlert('Request rejected', 'info');
    loadRequests();
  } catch (error) {
    showAlert(error.message, 'error');
    setButtonLoading(btn, false);
  }
}

// ─── Risk Badge ───────────────────────────────────────────────────────────────
function getRiskBadge(level) {

  if (!level) {
    return `
      <span style="color:#999; font-size:0.8rem;">
        UNRATED
      </span>
    `;
  }

  return `
    <span class="risk-badge ${level.toLowerCase()}">
      <div class="risk-dot"></div>
      ${level} Risk
    </span>
  `;

}

// ─── Pagination ───────────────────────────────────────────────────────────────
function renderPagination(page, totalPages, containerId) {
  const pag = document.getElementById(containerId);
  if (!pag || totalPages <= 1) return;

  pag.innerHTML = `
    <button class="prev-page" ${page === 1 ? 'disabled' : ''}>Previous</button>
    <span class="page-info">Page ${page} of ${totalPages}</span>
    <button class="next-page" ${page === totalPages ? 'disabled' : ''}>Next</button>
  `;

  if (page > 1)
    pag.querySelector('.prev-page').addEventListener('click', () => { currentPage--; loadRequests(); });
  if (page < totalPages)
    pag.querySelector('.next-page').addEventListener('click', () => { currentPage++; loadRequests(); });
}
