import auth from './auth.js';

class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
    }

    // Register a route
    register(path, handler) {
        this.routes[path] = handler;
    }

    // Navigate to a route
    navigate(path) {
        if (this.routes[path]) {
            this.currentRoute = path;
            window.history.pushState({}, '', path);
            this.routes[path]();
        } else {
            console.error(`Route ${path} not found`);
        }
    }

    // Initialize router
    init() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });

        // Handle initial route
        this.handleRoute();
    }

    // Handle current route
    handleRoute() {
        const path = window.location.pathname;

        // Authentication checks
        if (!auth.isAuthenticated() && path !== '/login' && path !== '/register') {
            this.navigate('/login');
            return;
        }

        if (auth.isAuthenticated() && (path === '/login' || path === '/register')) {
            // Redirect to appropriate dashboard based on role
            if (auth.hasRole('REQUESTER')) {
                this.navigate('/requester-dashboard');
            } else if (auth.hasRole('APPROVER')) {
                this.navigate('/approver-dashboard');
            }
            return;
        }

        // Execute route handler
        if (this.routes[path]) {
            this.currentRoute = path;
            this.routes[path]();
        } else {
            // Default route
            if (auth.isAuthenticated()) {
                if (auth.hasRole('REQUESTER')) {
                    this.navigate('/requester-dashboard');
                } else if (auth.hasRole('APPROVER')) {
                    this.navigate('/approver-dashboard');
                }
            } else {
                this.navigate('/login');
            }
        }
    }
}

export default new Router();
