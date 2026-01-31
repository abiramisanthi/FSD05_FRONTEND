class Auth {
    constructor() {
        this.user = null;
        this.token = localStorage.getItem('token');
    }

    // Save user data to localStorage
    saveUser(userData) {
        this.user = userData;
        this.token = userData.token;
        localStorage.setItem('token', userData.token);
        localStorage.setItem('user', JSON.stringify({
            _id: userData._id,
            username: userData.username,
            email: userData.email,
            role: userData.role
        }));
    }

    // Get current user
    getCurrentUser() {
        if (!this.user) {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                this.user = JSON.parse(userStr);
            }
        }
        return this.user;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token && !!this.getCurrentUser();
    }

    // Check user role
    hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    }

    // Logout
    logout() {
        this.user = null;
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    // Get user initials for avatar
    getUserInitials() {
        const user = this.getCurrentUser();
        if (!user) return '?';
        return user.username.substring(0, 2).toUpperCase();
    }
}

export default new Auth();
