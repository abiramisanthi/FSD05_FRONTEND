// API base URL
const API_URL = 'https://fsd05-backend-3.onrender.com';

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

    // ================= AUTH APIs =================

    async register(userData) {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return this.handleResponse(response);
    }

    async login(credentials) {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        return this.handleResponse(response);
    }

    async getProfile() {
        const response = await fetch(`${API_URL}/api/auth/profile`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    async logout() {
        const response = await fetch(`${API_URL}/api/auth/logout`, {
            method: 'POST',
            headers: this.getAuthHeaders()
        });

        localStorage.removeItem('token');
        localStorage.removeItem('user');

        return this.handleResponse(response);
    }

    // ================= REQUEST APIs =================

    async createRequest(requestData) {
        const response = await fetch(`${API_URL}/api/requests`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(requestData)
        });
        return this.handleResponse(response);
    }

    async getMyRequests(params = {}) {
        const query = new URLSearchParams(params).toString();

        const response = await fetch(
            `${API_URL}/api/requests/my-requests?${query}`,
            {
                headers: this.getAuthHeaders()
            }
        );

        return this.handleResponse(response);
    }

    async getAllRequests(params = {}) {
        const query = new URLSearchParams(params).toString();

        const response = await fetch(
            `${API_URL}/api/requests/all?${query}`,
            {
                headers: this.getAuthHeaders()
            }
        );

        return this.handleResponse(response);
    }

    async updateRequestStatus(requestId, statusData) {
        const response = await fetch(
            `${API_URL}/api/requests/${requestId}/status`,
            {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(statusData)
            }
        );

        return this.handleResponse(response);
    }

    // ================= AI APIs =================

    async validateRequest(data) {
        const response = await fetch(
            `${API_URL}/api/ai/validate-request`,
            {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data)
            }
        );

        return this.handleResponse(response);
    }

    async suggestReasons(data) {
        const response = await fetch(
            `${API_URL}/api/ai/suggest-reasons`,
            {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data)
            }
        );

        return this.handleResponse(response);
    }

    async chat(data) {
        const response = await fetch(
            `${API_URL}/api/ai/chat`,
            {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(data)
            }
        );

        return this.handleResponse(response);
    }

    // ================= ANALYTICS =================

    async getAnalytics() {
        const response = await fetch(
            `${API_URL}/api/analytics`,
            {
                headers: this.getAuthHeaders()
            }
        );

        return this.handleResponse(response);
    }

    // ================= AUDIT =================

    async getAuditLogs(params = {}) {
        const query = new URLSearchParams(params).toString();

        const response = await fetch(
            `${API_URL}/api/audit?${query}`,
            {
                headers: this.getAuthHeaders()
            }
        );

        return this.handleResponse(response);
    }

    // ================= NOTIFICATIONS =================

    async getNotifications() {
        const response = await fetch(
            `${API_URL}/api/notifications`,
            {
                headers: this.getAuthHeaders()
            }
        );

        return this.handleResponse(response);
    }

    async markNotificationsRead() {
        const response = await fetch(
            `${API_URL}/api/notifications/read-all`,
            {
                method: 'PUT',
                headers: this.getAuthHeaders()
            }
        );

        return this.handleResponse(response);
    }

    async clearNotifications() {
        const response = await fetch(
            `${API_URL}/api/notifications/clear`,
            {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            }
        );

        return this.handleResponse(response);
    }

    // ================= EXPORT =================

    async downloadExport(type) {
        const response = await fetch(
            `${API_URL}/api/requests/export/${type}`,
            {
                method: 'GET',
                headers: this.getAuthHeaders()
            }
        );

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Export failed');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `access_requests.${type}`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(downloadUrl);
    }
}

export default new API();