// ✅ Production API URL (Render Backend)
const API_URL = 'https://fsd05-backend-2.onrender.com/api';

class API {
    // Get auth token from localStorage
    getToken() {
        return localStorage.getItem('token');
    }

    // Get auth headers
    getAuthHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    // Handle API response
    async handleResponse(response) {
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }

        return data;
    }

    // Auth APIs
    async register(userData) {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return this.handleResponse(response);
    }

    async login(credentials) {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        return this.handleResponse(response);
    }

    async getProfile() {
        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    // Request APIs
    async createRequest(requestData) {
        const response = await fetch(`${API_URL}/requests`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(requestData)
        });
        return this.handleResponse(response);
    }

    async getMyRequests() {
        const response = await fetch(`${API_URL}/requests/my-requests`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    async getAllRequests() {
        const response = await fetch(`${API_URL}/requests/all`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    async updateRequestStatus(requestId, statusData) {
        const response = await fetch(`${API_URL}/requests/${requestId}/status`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(statusData)
        });
        return this.handleResponse(response);
    }
}

export default new API();
