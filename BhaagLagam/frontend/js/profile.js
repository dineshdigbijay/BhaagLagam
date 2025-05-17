// Mock data for development
const MOCK_DATA = {
    profile: {
        username: 'Test User',
        email: 'test@gmail.com',
        phone_number: '+1234567890',
        date_joined: '2024-05-17'
    },
    statistics: {
        total_expenses: 1250.00,
        total_groups: 3,
        amount_owed: 450.00,
        amount_owed_to_user: 750.00
    },
    activities: [
        {
            description: 'Dinner at Restaurant',
            group_name: 'Friends Group',
            amount: 120.00,
            created_at: '2024-05-16'
        },
        {
            description: 'Movie Night',
            group_name: 'Roommates',
            amount: 80.00,
            created_at: '2024-05-15'
        },
        {
            description: 'Groceries',
            group_name: 'Family',
            amount: 200.00,
            created_at: '2024-05-14'
        }
    ]
};

// Load user profile data
async function loadProfile() {
    try {
        // Use mock data instead of API call
        const profile = MOCK_DATA.profile;
        
        // Update profile information
        document.getElementById('profile-name').textContent = profile.username;
        document.getElementById('profile-email').textContent = profile.email;
        document.getElementById('profile-phone').textContent = profile.phone_number || 'No phone number';
        
        // Update avatar initials
        const initialsElement = document.getElementById('profile-initials');
        if (initialsElement) {
            initialsElement.textContent = getInitials(profile.username);
        }

        // Load statistics and activities
        loadStatistics();
        loadRecentActivity();

        // Setup edit buttons
        setupEditButtons();
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Error loading profile data');
    }
}

// Load user statistics
function loadStatistics() {
    try {
        const stats = MOCK_DATA.statistics;
        
        // Update statistics display
        document.getElementById('total-expenses').textContent = formatCurrency(stats.total_expenses);
        document.getElementById('total-groups').textContent = stats.total_groups;
        document.getElementById('amount-owed').textContent = formatCurrency(stats.amount_owed);
        document.getElementById('amount-owed-to-you').textContent = formatCurrency(stats.amount_owed_to_user);
    } catch (error) {
        console.error('Error loading statistics:', error);
        showError('Error loading statistics');
    }
}

// Load recent activity
function loadRecentActivity() {
    try {
        const activities = MOCK_DATA.activities;
        const activityList = document.getElementById('activity-list');
        
        if (!activities || activities.length === 0) {
            activityList.innerHTML = '<div class="no-activity">No recent activity</div>';
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
                        ${activity.group_name} • ${formatDate(activity.created_at)}
                    </div>
                </div>
                <div class="activity-amount ${activity.amount >= 0 ? 'positive' : 'negative'}">
                    ${formatCurrency(activity.amount)}
                </div>
            </li>
        `).join('');
    } catch (error) {
        console.error('Error loading activities:', error);
        showError('Error loading recent activities');
    }
}

// Setup edit buttons
function setupEditButtons() {
    const editButtons = document.querySelectorAll('.edit-button');
    editButtons.forEach(button => {
        button.addEventListener('click', () => toggleEditMode(button.dataset.field));
    });
}

// Handle profile update
function handleProfileUpdate(event) {
    event.preventDefault();
    
    const name = document.getElementById('edit-name').value;
    const email = document.getElementById('edit-email').value;
    const phone = document.getElementById('edit-phone').value;

    // Update mock data
    MOCK_DATA.profile = {
        ...MOCK_DATA.profile,
        username: name,
        email: email,
        phone_number: phone
    };

    // Update display
    document.getElementById('profile-name').textContent = name;
    document.getElementById('profile-email').textContent = email;
    document.getElementById('profile-phone').textContent = phone || 'No phone number';
    document.getElementById('profile-initials').textContent = getInitials(name);

    // Close modal and show success
    closeEditModal();
    showSuccess('Profile updated successfully!');
}

// Helper function to get initials
function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Toggle edit mode
function toggleEditMode(field) {
    const modal = document.getElementById('edit-modal');
    
    // Populate form with current values
    document.getElementById('edit-name').value = MOCK_DATA.profile.username;
    document.getElementById('edit-email').value = MOCK_DATA.profile.email;
    document.getElementById('edit-phone').value = MOCK_DATA.profile.phone_number || '';

    modal.style.display = 'block';
}

// Close edit modal
function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    modal.style.display = 'none';
}

// Show success message
function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'alert success';
    alert.textContent = message;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}

// Show error message
function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert error';
    alert.textContent = message;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Setup form submission
    const editProfileForm = document.getElementById('edit-profile-form');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', handleProfileUpdate);
    }

    // Setup modal close on outside click
    window.onclick = function(event) {
        const modal = document.getElementById('edit-modal');
        if (event.target === modal) {
            closeEditModal();
        }
    };
});

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
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

// Load profile data
document.addEventListener('DOMContentLoaded', function() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Update profile display
    updateProfileDisplay(user);
});

function updateProfileDisplay(user) {
    // Update name and initials
    const nameElement = document.getElementById('profile-name');
    const initialsElement = document.getElementById('profile-initial');
    nameElement.textContent = user.username || 'Anonymous User';
    initialsElement.textContent = getInitials(user.username || 'AU');

    // Update email and phone
    const emailElement = document.getElementById('profile-email');
    const phoneElement = document.getElementById('profile-phone');
    emailElement.textContent = user.email || 'No email added';
    phoneElement.textContent = user.phone || 'Add phone number';
}

function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function toggleEditMode(field) {
    const modal = document.getElementById('edit-modal');
    const form = document.getElementById('edit-profile-form');
    const user = getCurrentUser();

    // Populate form with current values
    document.getElementById('edit-name').value = user.username || '';
    document.getElementById('edit-email').value = user.email || '';
    document.getElementById('edit-phone').value = user.phone || '';

    modal.style.display = 'block';
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

function handleProfileUpdate(event) {
    event.preventDefault();
    
    // Get form values
    const name = document.getElementById('edit-name').value;
    const email = document.getElementById('edit-email').value;
    const phone = document.getElementById('edit-phone').value;

    // Get current user data
    const userData = getCurrentUser();
    
    // Update user data
    const updatedUser = {
        ...userData,
        username: name,
        email: email,
        phone: phone
    };

    // Save to localStorage (in real app, this would be an API call)
    localStorage.setItem(CONFIG.USER_DATA_KEY, JSON.stringify(updatedUser));

    // Update display
    updateProfileDisplay(updatedUser);

    // Close modal
    closeEditModal();

    // Show success message
    showNotification('Profile updated successfully!', 'success');
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add to document
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('edit-modal');
    if (event.target === modal) {
        closeEditModal();
    }
}; 