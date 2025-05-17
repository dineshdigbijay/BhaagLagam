// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    errorDiv.style.display = 'none';

    try {
        console.log('Attempting login...');
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.LOGIN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        console.log('Login response:', response.status);
        const data = await response.json();
        console.log('Login data:', data);

        if (!response.ok) {
            throw new Error(data.detail || 'Invalid credentials');
        }

        // Store tokens
        localStorage.setItem(CONFIG.TOKEN_KEY, data.access);
        localStorage.setItem(CONFIG.REFRESH_TOKEN_KEY, data.refresh);
        
        // Fetch user data
        const userResponse = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.PROFILE}`, {
            headers: {
                'Authorization': `Bearer ${data.access}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (!userResponse.ok) {
            throw new Error('Failed to fetch user data');
        }

        const userData = await userResponse.json();
        localStorage.setItem(CONFIG.USER_DATA_KEY, JSON.stringify(userData));

        // Redirect to dashboard
        window.location.href = CONFIG.APP_ROUTES.DASHBOARD;
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
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
        console.log('Attempting registration...');
        // Register user
        const registerResponse = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.REGISTER}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                password
            })
        });

        console.log('Registration response:', registerResponse.status);
        const registerData = await registerResponse.json();
        console.log('Registration data:', registerData);

        if (!registerResponse.ok) {
            let errorMessage = 'Registration failed';
            if (registerData) {
                if (typeof registerData === 'object') {
                    if (registerData.detail) {
                        errorMessage = registerData.detail;
                    } else {
                        const errors = [];
                        for (const [field, fieldErrors] of Object.entries(registerData)) {
                            if (Array.isArray(fieldErrors)) {
                                errors.push(`${field}: ${fieldErrors.join(', ')}`);
                            } else if (typeof fieldErrors === 'string') {
                                errors.push(`${field}: ${fieldErrors}`);
                            }
                        }
                        if (errors.length > 0) {
                            errorMessage = errors.join('; ');
                        }
                    }
                } else if (typeof registerData === 'string') {
                    errorMessage = registerData;
                }
            }
            throw new Error(errorMessage);
        }

        // Show success message
        successDiv.textContent = 'Registration successful! Logging you in...';
        successDiv.style.display = 'block';

        // Auto login after registration
        console.log('Attempting auto-login...');
        const loginResponse = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.LOGIN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        console.log('Auto-login response:', loginResponse.status);
        const loginData = await loginResponse.json();
        console.log('Auto-login data:', loginData);

        if (!loginResponse.ok) {
            throw new Error('Registration successful. Please login manually.');
        }

        // Store tokens
        localStorage.setItem(CONFIG.TOKEN_KEY, loginData.access);
        localStorage.setItem(CONFIG.REFRESH_TOKEN_KEY, loginData.refresh);

        // Fetch user data
        const userResponse = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.PROFILE}`, {
            headers: {
                'Authorization': `Bearer ${loginData.access}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!userResponse.ok) {
            throw new Error('Failed to fetch user data');
        }

        const userData = await userResponse.json();
        localStorage.setItem(CONFIG.USER_DATA_KEY, JSON.stringify(userData));

        // Redirect to dashboard
        window.location.href = CONFIG.APP_ROUTES.DASHBOARD;
    } catch (error) {
        console.error('Registration error:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        successDiv.style.display = 'none';
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.REFRESH_TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_DATA_KEY);
    window.location.href = CONFIG.APP_ROUTES.LOGIN;
}

// Check if user is authenticated
function isAuthenticated() {
    return !!getToken();
}

// Protect routes that require authentication
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = CONFIG.APP_ROUTES.LOGIN;
        return false;
    }
    return true;
}

// Initialize auth-related elements
document.addEventListener('DOMContentLoaded', () => {
    // Add logout event listeners to all logout buttons
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(btn => btn.addEventListener('click', handleLogout));

    // Add login form submission handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Add registration form submission handler
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Protect authenticated routes
    if (!window.location.pathname.includes('login.html') && 
        !window.location.pathname.includes('index.html')) {
        requireAuth();
    }
}); 