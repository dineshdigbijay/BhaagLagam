const CONFIG = {
    API_BASE_URL: 'http://localhost:8001/api',
    ENDPOINTS: {
        LOGIN: '/auth/login/',
        REGISTER: '/auth/register/',
        PROFILE: '/auth/profile/',
        GROUPS: '/groups/',
        FRIENDS: '/friends/',
        EXPENSES: '/expenses/'
    }
};

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers,
        credentials: 'include',
        mode: 'cors'
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(CONFIG.API_BASE_URL + endpoint, options);
        
        // Check content type
        const contentType = response.headers.get("content-type");
        let result;
        
        if (contentType && contentType.indexOf("application/json") !== -1) {
            result = await response.json();
        } else {
            throw new Error('Invalid response format from server');
        }

        if (!response.ok) {
            throw new Error(result.error || result.detail || `API call failed: ${response.status}`);
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        await handleApiError(error);
        throw error;
    }
}

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
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// Helper function to handle API errors
async function handleApiError(error) {
    if (error.status === 401) {
        // If unauthorized, redirect to login
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_DATA_KEY);
        window.location.href = '/login.html';
        return false;
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