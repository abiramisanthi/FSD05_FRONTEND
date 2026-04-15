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
            
            // Re-init features
            this.reinitFeatures();
        } else {
            console.error(`Route ${path} not found`);
        }
    }

    reinitFeatures() {
        const publicRoutes = ['/login', '/register'];
        const isPublic = publicRoutes.includes(this.currentRoute);

        if (isPublic) {
            // Destroy socket/UI on public pages so notification bell never shows
            import('./components/notifications.js').then(m => m.default.destroy());
        } else {
            // Only init for authenticated pages
            import('./components/chatbot.js').then(m => m.default.init());
            import('./components/notifications.js').then(m => m.default.init());
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
            } else if (auth.hasRole('APPROVER') || auth.hasRole('ADMIN')) {
                this.navigate('/approver-dashboard');
            }
            return;
        }

        // Execute route handler
        if (this.routes[path]) {
            this.currentRoute = path;
            this.routes[path]();
            this.reinitFeatures();
        } else {
            // Default route
            if (auth.isAuthenticated()) {
                if (auth.hasRole('REQUESTER')) {
                    this.navigate('/requester-dashboard');
                } else if (auth.hasRole('APPROVER') || auth.hasRole('ADMIN')) {
                    this.navigate('/approver-dashboard');
                }
            } else {
                this.navigate('/login');
            }
        }
    }
}

export default new Router();
