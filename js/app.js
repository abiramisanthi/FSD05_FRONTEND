import router from './router.js';
import { renderLogin } from './pages/login.js';
import { renderRegister } from './pages/register.js';
import { renderRequesterDashboard } from './pages/requesterDashboard.js';
import { renderApproverDashboard } from './pages/approverDashboard.js';

// Register all routes
router.register('/', renderLogin);
router.register('/login', renderLogin);
router.register('/register', renderRegister);
router.register('/requester-dashboard', renderRequesterDashboard);
router.register('/approver-dashboard', renderApproverDashboard);

// Initialize the application
router.init();
