import api from '../api.js';
import auth from '../auth.js';
import router from '../router.js';
import { showAlert, formatDate, getStatusBadge, setButtonLoading } from '../utils.js';

export function renderApproverDashboard() {
  const user = auth.getCurrentUser();

  const app = document.getElementById('app');
  app.innerHTML = `
    <nav class="navbar">
      <div class="navbar-content">
        <div class="navbar-brand">Access Portal</div>
        <div class="navbar-menu">
          <div class="user-info">
            <div class="user-avatar">${auth.getUserInitials()}</div>
            <div class="user-details">
              <div class="user-name">${user.username}</div>
              <div class="user-role">${user.role}</div>
            </div>
          </div>
          <button class="btn btn-logout" id="logout-btn">Logout</button>
        </div>
      </div>
    </nav>
    
    <div class="dashboard">
      <div class="container">
        <div class="dashboard-header">
          <h1 class="dashboard-title">Access Request Management</h1>
          <p class="dashboard-subtitle">Review and approve access requests</p>
        </div>
        
        <div class="dashboard-grid" id="stats-container">
          <div class="text-center" style="padding: 2rem;">
            <span class="spinner"></span> Loading statistics...
          </div>
        </div>
        
        <div class="card">
          <div class="card-header flex justify-between items-center">
            <div>
              <h2 class="card-title">All Access Requests</h2>
              <p class="card-subtitle">Review and take action on pending requests</p>
            </div>
            <button class="btn btn-secondary" id="refresh-btn">🔄 Refresh</button>
          </div>
          
          <div id="requests-container">
            <div class="text-center" style="padding: 2rem;">
              <span class="spinner"></span> Loading requests...
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Load requests and stats
  loadRequests();

  // Handle logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    auth.logout();
    router.navigate('/login');
  });

  // Handle refresh
  document.getElementById('refresh-btn').addEventListener('click', () => {
    loadRequests();
  });
}

async function loadRequests() {
  const container = document.getElementById('requests-container');
  const statsContainer = document.getElementById('stats-container');

  try {
    const data = await api.getAllRequests();
    const requests = data.requests;

    // Calculate statistics
    const pending = requests.filter(r => r.status === 'PENDING').length;
    const approved = requests.filter(r => r.status === 'APPROVED').length;
    const rejected = requests.filter(r => r.status === 'REJECTED').length;

    // Render statistics
    statsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon pending">⏳</div>
        <div class="stat-content">
          <div class="stat-label">Pending</div>
          <div class="stat-value">${pending}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon approved">✓</div>
        <div class="stat-content">
          <div class="stat-label">Approved</div>
          <div class="stat-value">${approved}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon rejected">✕</div>
        <div class="stat-content">
          <div class="stat-label">Rejected</div>
          <div class="stat-value">${rejected}</div>
        </div>
      </div>
    `;

    if (requests.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <h3 class="empty-state-title">No requests found</h3>
          <p>There are no access requests in the system yet</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Requester</th>
              <th>Resource</th>
              <th>Access Type</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${requests.map(req => `
              <tr>
                <td><strong>${req.requesterName}</strong></td>
                <td>${req.resourceName}</td>
                <td>${req.accessType}</td>
                <td title="${req.reason}">${req.reason.substring(0, 40)}${req.reason.length > 40 ? '...' : ''}</td>
                <td>${getStatusBadge(req.status)}</td>
                <td>${formatDate(req.createdAt)}</td>
                <td>
                  ${req.status === 'PENDING' ? `
                    <div class="action-buttons">
                      <button 
                        class="btn btn-success btn-sm approve-btn" 
                        data-id="${req._id}"
                        data-requester="${req.requesterName}"
                        data-resource="${req.resourceName}"
                      >
                        ✓ Approve
                      </button>
                      <button 
                        class="btn btn-danger btn-sm reject-btn" 
                        data-id="${req._id}"
                        data-requester="${req.requesterName}"
                        data-resource="${req.resourceName}"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  ` : `
                    <span style="color: var(--text-muted);">
                      ${req.status === 'APPROVED' ? 'Approved' : 'Rejected'} by ${req.approverName}
                    </span>
                  `}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Add event listeners to action buttons
    document.querySelectorAll('.approve-btn').forEach(btn => {
      btn.addEventListener('click', () => handleApprove(btn));
    });

    document.querySelectorAll('.reject-btn').forEach(btn => {
      btn.addEventListener('click', () => handleReject(btn));
    });

  } catch (error) {
    container.innerHTML = `
      <div class="alert alert-error">
        Failed to load requests: ${error.message}
      </div>
    `;
  }
}

async function handleApprove(btn) {
  const requestId = btn.dataset.id;
  const requester = btn.dataset.requester;
  const resource = btn.dataset.resource;

  const comments = prompt(`Approve access to "${resource}" for ${requester}?\n\nOptional comments:`);

  if (comments === null) return; // User cancelled

  setButtonLoading(btn, true);

  try {
    await api.updateRequestStatus(requestId, {
      status: 'APPROVED',
      comments: comments || 'Approved'
    });

    showAlert('Request approved successfully!', 'success');
    loadRequests();
  } catch (error) {
    showAlert(error.message, 'error');
    setButtonLoading(btn, false);
  }
}

async function handleReject(btn) {
  const requestId = btn.dataset.id;
  const requester = btn.dataset.requester;
  const resource = btn.dataset.resource;

  const comments = prompt(`Reject access to "${resource}" for ${requester}?\n\nReason for rejection:`);

  if (comments === null) return; // User cancelled

  if (!comments.trim()) {
    showAlert('Please provide a reason for rejection', 'error');
    return;
  }

  setButtonLoading(btn, true);

  try {
    await api.updateRequestStatus(requestId, {
      status: 'REJECTED',
      comments: comments
    });

    showAlert('Request rejected', 'info');
    loadRequests();
  } catch (error) {
    showAlert(error.message, 'error');
    setButtonLoading(btn, false);
  }
}
