// Main application initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI components
    initializeUI();
    
    // Check authentication status
    if (isAuthenticated()) {
        const user = getCurrentUser();
        updateUIForAuthenticatedUser(user);
    } else {
        // If on a protected page, redirect to login
        const protectedPages = ['/dashboard.html', '/groups.html', '/expenses.html', '/profile.html'];
        if (protectedPages.includes(window.location.pathname)) {
            window.location.href = '/login.html';
        }
    }
});

function initializeUI() {
    // Add event listeners for navigation
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (!isAuthenticated() && this.dataset.protected) {
                e.preventDefault();
                window.location.href = '/login.html';
            }
        });
    });
}

function updateUIForAuthenticatedUser(user) {
    // Update user info in the UI
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => {
        el.textContent = user.username;
    });

    // Show authenticated navigation items
    const authNav = document.querySelectorAll('.auth-nav');
    authNav.forEach(el => el.style.display = 'block');

    // Hide non-authenticated navigation items
    const nonAuthNav = document.querySelectorAll('.non-auth-nav');
    nonAuthNav.forEach(el => el.style.display = 'none');
} 