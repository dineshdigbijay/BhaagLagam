// Load user profile data
async function loadProfile() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.USERS}me/`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }

        const profile = await response.json();
        
        // Update profile information
        document.getElementById('profile-name').textContent = profile.username;
        document.getElementById('profile-email').textContent = profile.email;
        document.getElementById('profile-phone').textContent = profile.phone_number || 'No phone number';
        document.getElementById('profile-joined').textContent = `Joined ${new Date(profile.date_joined).toLocaleDateString()}`;
        document.getElementById('profile-initial').textContent = profile.username.charAt(0).toUpperCase();

        // Pre-fill edit form
        document.getElementById('username').value = profile.username;
        document.getElementById('phone').value = profile.phone_number || '';

        // Load statistics
        loadStatistics();
        loadRecentActivity();
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Error loading profile: ' + error.message);
    }
}

// Load user statistics
async function loadStatistics() {
    try {
        // Load groups count
        const groupsResponse = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.GROUPS}`, {
            headers: getAuthHeaders()
        });

        if (!groupsResponse.ok) {
            throw new Error('Failed to fetch groups');
        }

        const groups = await groupsResponse.json();
        document.getElementById('total-groups').textContent = groups.length;

        // Load expenses summary
        const expensesResponse = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.EXPENSE_SPLITS}summary/`, {
            headers: getAuthHeaders()
        });

        if (!expensesResponse.ok) {
            throw new Error('Failed to fetch expenses summary');
        }

        const summary = await expensesResponse.json();
        document.getElementById('total-expenses').textContent = formatCurrency(summary.total_expenses || 0);
        document.getElementById('amount-owed').textContent = formatCurrency(summary.total_owed || 0);
        document.getElementById('amount-owed-to-you').textContent = formatCurrency(summary.total_owed_to_user || 0);
    } catch (error) {
        console.error('Error loading statistics:', error);
        showError('Error loading statistics: ' + error.message);
    }
}

// Load recent activity
async function loadRecentActivity() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.EXPENSES}?limit=5`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch recent activity');
        }

        const activities = await response.json();
        const activityList = document.getElementById('activity-list');
        
        if (activities.length === 0) {
            activityList.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <p>No recent activity</p>
                </div>
            `;
            return;
        }

        activityList.innerHTML = activities.map(activity => `
            <li class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-receipt"></i>
                </div>
                <div class="activity-content">
                    <div class="title">${activity.description}</div>
                    <div class="meta">
                        ${activity.group_name} • ${new Date(activity.created_at).toLocaleDateString()}
                    </div>
                </div>
                <div class="activity-amount ${activity.amount >= 0 ? 'positive' : 'negative'}">
                    ${formatCurrency(activity.amount)}
                </div>
            </li>
        `).join('');
    } catch (error) {
        console.error('Error loading recent activity:', error);
        showError('Error loading recent activity: ' + error.message);
    }
}

// Update profile
async function updateProfile(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.USERS}me/`, {
            method: 'PATCH',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: formData.get('username'),
                phone_number: formData.get('phone')
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update profile');
        }

        // Close modal and reload profile
        document.getElementById('edit-profile-modal').style.display = 'none';
        loadProfile();
        showSuccess('Profile updated successfully!');
    } catch (error) {
        console.error('Error updating profile:', error);
        showError('Error updating profile: ' + error.message);
    }
}

// Update profile picture
async function updateProfilePicture(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.USERS}me/avatar/`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update profile picture');
        }

        // Close modal and reload profile
        document.getElementById('edit-avatar-modal').style.display = 'none';
        loadProfile();
        showSuccess('Profile picture updated successfully!');
    } catch (error) {
        console.error('Error updating profile picture:', error);
        showError('Error updating profile picture: ' + error.message);
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Show success message
function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem;
        background: var(--success);
        color: white;
        border-radius: 8px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    alert.textContent = message;
    document.body.appendChild(alert);
    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// Show error message
function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-error';
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem;
        background: var(--error);
        color: white;
        border-radius: 8px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    alert.textContent = message;
    document.body.appendChild(alert);
    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// Initialize profile page
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();

    // Initialize edit profile form
    const editProfileForm = document.getElementById('edit-profile-form');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', updateProfile);
    }

    // Initialize edit avatar form
    const editAvatarForm = document.getElementById('edit-avatar-form');
    if (editAvatarForm) {
        editAvatarForm.addEventListener('submit', updateProfilePicture);
    }

    // Close modals when clicking outside
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
}); 