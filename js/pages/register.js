import api from '../api.js';
import auth from '../auth.js';
import router from '../router.js';
import { showAlert, setButtonLoading } from '../utils.js';

export function renderRegister() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-container">
      <div class="card auth-card">
        <div class="auth-header">
          <h1 class="auth-title">Create Account</h1>
          <p class="auth-subtitle">Join our access management system</p>
        </div>
        
        <form id="register-form">
          <div class="form-group">
            <label for="username" class="form-label">Username</label>
            <input 
              type="text" 
              id="username" 
              class="form-input" 
              placeholder="Choose a username"
              minlength="3"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="email" class="form-label">Email Address</label>
            <input 
              type="email" 
              id="email" 
              class="form-input" 
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <input 
              type="password" 
              id="password" 
              class="form-input" 
              placeholder="Create a password"
              minlength="6"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="role" class="form-label">Role</label>
            <select id="role" class="form-select" required>
              <option value="">Select your role</option>
              <option value="REQUESTER">Requester</option>
              <option value="APPROVER">Approver</option>
            </select>
          </div>
          
          <button type="submit" class="btn btn-primary" style="width: 100%;">
            Create Account
          </button>
        </form>
        
        <div class="auth-footer">
          Already have an account? 
          <a href="/login" class="auth-link" id="login-link">Sign in here</a>
        </div>
      </div>
    </div>
  `;

  // Handle form submission
  const form = document.getElementById('register-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const role = document.getElementById('role').value;

      const data = await api.register({ username, email, password, role });
      auth.saveUser(data);

      showAlert('Registration successful!', 'success');

      // Redirect based on role
      if (data.role === 'REQUESTER') {
        router.navigate('/requester-dashboard');
      } else if (data.role === 'APPROVER') {
        router.navigate('/approver-dashboard');
      }
    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  // Handle login link
  document.getElementById('login-link').addEventListener('click', (e) => {
    e.preventDefault();
    router.navigate('/login');
  });
}
