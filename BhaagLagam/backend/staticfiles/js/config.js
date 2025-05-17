const CONFIG = {
    API_BASE_URL: window.location.origin + '/api',
    ENDPOINTS: {
        LOGIN: '/auth/token/',
        REFRESH_TOKEN: '/auth/token/refresh/',
        REGISTER: '/auth/register/',
        USERS: '/users/',
        GROUPS: '/groups/',
        EXPENSES: '/expenses/',
        EXPENSE_SPLITS: '/expense-splits/',
        PROFILE: '/users/me/'
    },
    TOKEN_KEY: 'bhaaglagam_token',
    REFRESH_TOKEN_KEY: 'bhaaglagam_refresh_token',
    USER_DATA_KEY: 'user_data',
    APP_ROUTES: {
        LOGIN: '/login',
        DASHBOARD: '/dashboard',
        GROUPS: '/groups',
        EXPENSES: '/expenses',
        PROFILE: '/profile'
    }
};

// Helper function to get the stored token
function getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
}

// Helper function to get the stored user data
function getUserData() {
    const data = localStorage.getItem(CONFIG.USER_DATA_KEY);
    return data ? JSON.parse(data) : null;
}

// Helper function to get headers with authorization
function getAuthHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Helper function to handle API errors
async function handleApiError(error) {
    if (error.status === 401) {
        // Try to refresh token
        try {
            const refreshToken = localStorage.getItem(CONFIG.REFRESH_TOKEN_KEY);
            if (!refreshToken) throw new Error('No refresh token');

            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.REFRESH_TOKEN}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refresh: refreshToken
                })
            });

            if (!response.ok) throw new Error('Token refresh failed');

            const data = await response.json();
            localStorage.setItem(CONFIG.TOKEN_KEY, data.access);
            return true;
        } catch (refreshError) {
            // If refresh fails, logout
            localStorage.removeItem(CONFIG.TOKEN_KEY);
            localStorage.removeItem(CONFIG.REFRESH_TOKEN_KEY);
            localStorage.removeItem(CONFIG.USER_DATA_KEY);
            window.location.href = '/login.html';
            return false;
        }
    }
    return false;
}

// Helper function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Helper function to format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
} 