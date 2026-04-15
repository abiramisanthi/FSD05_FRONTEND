import api from '../api.js';
import auth from '../auth.js';
import router from '../router.js';
import { showAlert, formatDate, getStatusBadge, setButtonLoading } from '../utils.js';

let currentPage = 1;

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
                <label for="department" class="form-label">Department</label>
                <input type="text" id="department" class="form-input" value="${user.department || 'General'}"/>
              </div>

              <div class="form-group">
                <label for="resourceName" class="form-label">Resource Name</label>
                <input type="text" id="resourceName" class="form-input" placeholder="e.g., Production Database" required/>
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
              
              <div class="form-group" style="position: relative;">
                <label for="reason" class="form-label flex justify-between">
                  <span>Reason (minimum 10 characters)</span>
                  <button type="button" id="aiSuggestBtn" class="suggest-btn" style="padding: 2px 8px; font-size: 0.75rem; margin-top: 0;">✨ AI Suggest</button>
                </label>
                <textarea id="reason" class="form-textarea" placeholder="Explain why you need this access..." minlength="10" required></textarea>
                <div id="aiPromptBox" style="display: none; background: #fdf2f8; padding: 10px; border-radius: 8px; margin-top: 10px; border: 1px solid #fbcfe8;">
                    <label style="font-size: 0.75rem; font-weight: 700; color: #db2777; margin-bottom: 4px; display: block;">What is your context? (e.g. 'fixing prod bug')</label>
                    <div style="display: flex; gap: 8px;">
                        <input type="text" id="aiCustomPrompt" class="form-input" style="flex: 1; padding: 8px 12px; font-size: 0.8rem; border-color: #f9a8d4;" placeholder="Briefly describe your task..."/>
                        <button type="button" id="aiGenerateBtn" class="btn btn-primary" style="padding: 0 16px; font-size: 0.8rem; min-width: 90px; height: 38px;">Generate</button>
                    </div>
                </div>
                <div id="aiSuggestionsList" class="suggestions-list" style="display: none; margin-top: 10px;"></div>
              </div>
              
              <div class="form-group">
                <label for="priority" class="form-label">Priority Level</label>
                <select id="priority" class="form-select">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM" selected>Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div class="form-group">
                <label for="expiryDays" class="form-label">Access Duration (Days)</label>
                <input type="number" id="expiryDays" class="form-input" placeholder="Leave empty for permanent access" min="1"/>
              </div>
              
              <button type="submit" class="btn btn-primary" style="width: 100%;">Submit Request</button>
            </form>
          </div>
        </div>
        
        <div class="card" style="margin-top: 24px;">
          <div class="card-header flex justify-between items-center">
            <div>
              <h2 class="card-title">Request History</h2>
              <p class="card-subtitle">View all your access requests</p>
            </div>
          </div>
          
          <div class="filter-bar">
            <input type="text" id="searchInput" placeholder="Search resources...">
            <select id="statusFilter">
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <select id="riskFilter">
              <option value="">All Risks</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <button class="btn btn-primary" id="searchBtn">Search</button>
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

  loadRequests();
  setupSmartSuggestions();

  // Search logic
  document.getElementById('searchBtn').addEventListener('click', () => {
    currentPage = 1;
    loadRequests();
  });

  // Handle form submission
  const form = document.getElementById('request-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
      const payload = {
        department: document.getElementById('department').value,
        resourceName: document.getElementById('resourceName').value,
        accessType: document.getElementById('accessType').value,
        reason: document.getElementById('reason').value,
        priority: document.getElementById('priority').value,
        expiryDays: document.getElementById('expiryDays').value,
      };

      // 1. Validate reason with AI before creating the request
      const aiVal = await api.validateRequest({
        reason: payload.reason,
        resourceName: payload.resourceName,
        accessType: payload.accessType
      });

      if (!aiVal.isValid) {
        if (!confirm(`🤖 AI Notice: Your reason seems vague (Score: ${aiVal.score}/10).\nAI Suggests: ${aiVal.suggestion}\n\nDo you still want to submit?`)) {
          setButtonLoading(submitBtn, false);
          return; // user cancelled
        }
      }

      // 2. Create the request
      const res = await api.createRequest(payload);

      // 3. Update AI score via a follow-up validate call with the requestId
      await api.validateRequest({
        reason: payload.reason,
        resourceName: payload.resourceName,
        accessType: payload.accessType,
        requestId: res.request._id
      });

      // 4. Clear the form so the user knows submission was successful
      form.reset();

      // 5. Refresh the request history table
      await loadRequests();

      showAlert(`✅ Request submitted! ML Risk Level: ${res.riskLevel}`, 'success');

    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    api.logout().then(() => { router.navigate('/login'); });
  });
}

function setupSmartSuggestions() {
  const btn = document.getElementById('aiSuggestBtn');
  const loader = document.getElementById('aiSuggestionsList');
  const promptBox = document.getElementById('aiPromptBox');
  const generateBtn = document.getElementById('aiGenerateBtn');

  btn.addEventListener('click', () => {
    promptBox.style.display = promptBox.style.display === 'none' ? 'block' : 'none';
    if (promptBox.style.display === 'block') document.getElementById('aiCustomPrompt').focus();
  });

  generateBtn.addEventListener('click', async () => {
    const resourceName = document.getElementById('resourceName').value;
    const accessType = document.getElementById('accessType').value;
    const userPrompt = document.getElementById('aiCustomPrompt').value;

    if (!resourceName || !accessType) {
      showAlert('Please enter a Resource Name and Access Type first.', 'error');
      return;
    }
    if (!userPrompt.trim()) {
      showAlert('Please give AI a hint of why you need access first.', 'error');
      return;
    }

    generateBtn.innerText = '⏳ Thinking...';
    generateBtn.disabled = true;
    loader.style.display = 'none'; // Clear old ones

    try {
      const data = await api.suggestReasons({ resourceName, accessType, userPrompt });

      if (!data.suggestions || data.suggestions.length === 0) {
        throw new Error('No suggestions returned');
      }

      loader.innerHTML = data.suggestions.map(s => `<div class="suggestion-item">${s}</div>`).join('');
      loader.style.display = 'flex';

      document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
          document.getElementById('reason').value = item.innerText;
          loader.innerHTML = '';
          loader.style.display = 'none';
          promptBox.style.display = 'none';
        });
      });
    } catch (err) {
      console.error('AI Suggestion error:', err);
      showAlert('Unable to connect to AI server. Please check your API key in .env and restart backend.', 'error');
    } finally {
      generateBtn.innerText = 'Generate';
      generateBtn.disabled = false;
    }
  });
}

async function loadRequests() {
  const container = document.getElementById('requests-container');
  const search = document.getElementById('searchInput').value;
  const status = document.getElementById('statusFilter').value;
  const riskLevel = document.getElementById('riskFilter').value;

  try {
    const data = await api.getMyRequests({ page: currentPage, limit: 10, search, status, riskLevel });
    const requests = data.requests;

    if (requests.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h3 class="empty-state-title">No requests found</h3>
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
              <th>Type</th>
              <th>Status</th>
              <th>Risk Level</th>
              <th>AI Score</th>
              <th>Submitted</th>
              <th>Expiry</th>
            </tr>
          </thead>
          <tbody>
            ${requests.map(req => `
              <tr>
                <td><strong>${req.resourceName}</strong></td>
                <td>${req.accessType}</td>
                <td>${getStatusBadge(req.status)}</td>
                <td>${getRiskBadge(req.riskLevel)}</td>
                <td>${req.aiValidationScore ? `<span class="ai-score-badge">🤖 ${req.aiValidationScore}/10</span>` : '-'}</td>
                <td>${formatDate(req.createdAt)}</td>
                <td>${req.expiryDate ? formatDate(req.expiryDate) : (req.expiryDays ? `${req.expiryDays} days` : 'Permanent')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="pagination" id="reqPagination"></div>
    `;

    renderPagination(data.page, data.totalPages, 'reqPagination');

  } catch (error) {
    container.innerHTML = `<div class="alert alert-error">Failed to load requests: ${error.message}</div>`;
  }
}

function getRiskBadge(level) {
  if (!level) return '<span style="color:#999; font-size:0.8rem;">UNRATED</span>';
  const l = level.toLowerCase();
  return `<span class="risk-badge ${l}"><div class="risk-dot"></div>${level}</span>`;
}

function renderPagination(page, totalPages, containerId) {
  const pag = document.getElementById(containerId);
  if (totalPages <= 1) return;

  pag.innerHTML = `
      <button class="prev-page" ${page === 1 ? 'disabled' : ''}>Previous</button>
      <span class="page-info">Page ${page} of ${totalPages}</span>
      <button class="next-page" ${page === totalPages ? 'disabled' : ''}>Next</button>
  `;

  if (page > 1) {
    pag.querySelector('.prev-page').addEventListener('click', () => { currentPage--; loadRequests(); });
  }
  if (page < totalPages) {
    pag.querySelector('.next-page').addEventListener('click', () => { currentPage++; loadRequests(); });
  }
}
