import api from '../api.js';
import auth from '../auth.js';
import router from '../router.js';
import { showAlert, setButtonLoading } from '../utils.js';
import notifications from '../components/notifications.js';

export function renderLogin() {
  // Always destroy notifications on the login page
  notifications.destroy();
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth-container">
      <div class="card auth-card">
        <div class="auth-header">
          <h1 class="auth-title">Welcome Back</h1>
          <p class="auth-subtitle">Sign in to access your account</p>
        </div>
        
        <form id="login-form">
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
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button type="submit" class="btn btn-primary" style="width: 100%;">
            Sign In
          </button>
        </form>
        
        <div class="auth-footer">
          Don't have an account? 
          <a href="/register" class="auth-link" id="register-link">Register here</a>
        </div>
      </div>
    </div>
  `;

  // Handle form submission
  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true);

    try {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      const data = await api.login({ email, password });
      auth.saveUser(data);

      showAlert('Login successful!', 'success');

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

  // Handle register link
  document.getElementById('register-link').addEventListener('click', (e) => {
    e.preventDefault();
    router.navigate('/register');
  });
}
