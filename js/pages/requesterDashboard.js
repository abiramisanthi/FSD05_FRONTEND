import api from '../api.js';
import auth from '../auth.js';
import router from '../router.js';
import { showAlert, formatDate, getStatusBadge, setButtonLoading, clearForm } from '../utils.js';

export function renderRequesterDashboard() {
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
          <h1 class="dashboard-title">My Access Requests</h1>
          <p class="dashboard-subtitle">Submit and track your access requests</p>
        </div>
        
        <div class="dashboard-grid">
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">New Access Request</h2>
              <p class="card-subtitle">Submit a request for resource access</p>
            </div>
            
            <form id="request-form">
              <div class="form-group">
                <label for="resourceName" class="form-label">Resource Name</label>
                <input 
                  type="text" 
                  id="resourceName" 
                  class="form-input" 
                  placeholder="e.g., Production Database"
                  required
                />
              </div>
              
              <div class="form-group">
                <label for="accessType" class="form-label">Access Type</label>
                <select id="accessType" class="form-select" required>
                  <option value="">Select access type</option>
                  <option value="READ">Read Only</option>
                  <option value="WRITE">Write Access</option>
                  <option value="ADMIN">Admin Access</option>
                  <option value="FULL">Full Access</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="reason" class="form-label">Reason (minimum 10 characters)</label>
                <textarea 
                  id="reason" 
                  class="form-textarea" 
                  placeholder="Explain why you need this access..."
                  minlength="10"
                  required
                ></textarea>
              </div>
              
              <button type="submit" class="btn btn-primary" style="width: 100%;">
                Submit Request
              </button>
            </form>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Request History</h2>
            <p class="card-subtitle">View all your access requests</p>
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

  // Load requests
  loadRequests();

  // Handle form submission
  const form = document.getElementById('request-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
      const resourceName = document.getElementById('resourceName').value;
      const accessType = document.getElementById('accessType').value;
      const reason = document.getElementById('reason').value;

      await api.createRequest({ resourceName, accessType, reason });

      showAlert('Access request submitted successfully!', 'success');
      clearForm('request-form');
      loadRequests();
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  // Handle logout
  document.getElementById('logout-btn').addEventListener('click', () => {
    auth.logout();
    router.navigate('/login');
  });
}

async function loadRequests() {
  const container = document.getElementById('requests-container');

  try {
    const data = await api.getMyRequests();
    const requests = data.requests;

    if (requests.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h3 class="empty-state-title">No requests yet</h3>
          <p>Submit your first access request using the form above</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Resource</th>
              <th>Access Type</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Approver</th>
              <th>Comments</th>
            </tr>
          </thead>
          <tbody>
            ${requests.map(req => `
              <tr>
                <td><strong>${req.resourceName}</strong></td>
                <td>${req.accessType}</td>
                <td>${req.reason.substring(0, 50)}${req.reason.length > 50 ? '...' : ''}</td>
                <td>${getStatusBadge(req.status)}</td>
                <td>${formatDate(req.createdAt)}</td>
                <td>${req.approverName || '-'}</td>
                <td>${req.comments || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `
      <div class="alert alert-error">
        Failed to load requests: ${error.message}
      </div>
    `;
  }
}
