// Mock user data for testing
const MOCK_USERS = [
    { email: 'test@gmail.com', password: 'test123', name: 'Test User' }
];

// Get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem(CONFIG.TOKEN_KEY);
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        // For now, use mock authentication
        const user = MOCK_USERS.find(u => u.email === email && u.password === password);
        
        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Store user data and mock token
        const mockToken = btoa(user.email + ':' + Date.now());
        localStorage.setItem(STORAGE_KEYS.TOKEN, mockToken);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({
            email: user.email,
            name: user.name
        }));

        // Initialize storage
        initializeStorage();

        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message || 'Failed to login');
    }
}

// Handle registration form submission
async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const errorDiv = document.getElementById('register-error');
    const successDiv = document.getElementById('register-success');
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    // Validate passwords match
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.style.display = 'block';
        return;
    }

    try {
        // Mock successful registration
        const mockUserData = {
            email: email,
            username: username,
            id: 'new_user_' + Date.now(),
            created_at: new Date().toISOString()
        };

        // Show success message and redirect to login
        successDiv.textContent = 'Registration successful! Please login with test@gmail.com / test123';
        successDiv.style.display = 'block';
        setTimeout(() => {
            // Switch to login tab
            showForm('login');
        }, 1500);
    } catch (error) {
        console.error('Registration error:', error);
        errorDiv.textContent = error.message || 'Registration failed. Please try again.';
        errorDiv.style.display = 'block';
        successDiv.style.display = 'none';
    }
}

// Handle logout
function handleLogout() {
    clearAllData();
    window.location.href = 'login.html';
}

// Check if user is authenticated
function isAuthenticated() {
    return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
}

// Get current user
function getCurrentUser() {
    const userData = localStorage.getItem(STORAGE_KEYS.USER);
    return userData ? JSON.parse(userData) : null;
}

// Initialize auth state
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Check authentication on protected pages
    const currentPage = window.location.pathname;
    if (currentPage !== '/login.html' && currentPage !== '/index.html' && currentPage !== '/') {
        if (!isAuthenticated()) {
            window.location.href = 'login.html';
        }
    }
}); 