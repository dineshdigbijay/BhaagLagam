// Load and display groups
async function loadGroups() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.GROUPS}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch groups');
        }

        const groups = await response.json();
        const groupsList = document.getElementById('groups-list');
        groupsList.innerHTML = '';

        if (groups.length === 0) {
            groupsList.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                    <h3>No groups yet</h3>
                    <p>Create a new group to get started!</p>
                </div>
            `;
            return;
        }

        groups.forEach(group => {
            const groupCard = document.createElement('div');
            groupCard.className = 'group-card';
            groupCard.innerHTML = `
                <div class="group-header">
                    <div class="group-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="group-info">
                        <h3>${group.name}</h3>
                        <p>${group.description || 'No description'}</p>
                    </div>
                </div>
                <div class="group-meta">
                    <div class="group-members">
                        ${group.members.slice(0, 3).map(member => `
                            <div class="member-avatar" title="${member}">${member.charAt(0).toUpperCase()}</div>
                        `).join('')}
                        ${group.members.length > 3 ? `
                            <div class="member-avatar" title="And ${group.members.length - 3} more">+${group.members.length - 3}</div>
                        ` : ''}
                    </div>
                    <div class="group-balance ${group.balance >= 0 ? 'balance-positive' : 'balance-negative'}">
                        ${formatCurrency(group.balance || 0)}
                    </div>
                </div>
                <button onclick="viewGroupDetails('${group.id}')" class="btn btn-outline">View Details</button>
            `;
            groupsList.appendChild(groupCard);
        });
    } catch (error) {
        console.error('Error loading groups:', error);
        showError('Error loading groups: ' + error.message);
    }
}

// View group details
async function viewGroupDetails(groupId) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.GROUPS}${groupId}/`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch group details');
        }

        const group = await response.json();
        const detailsContainer = document.getElementById('group-details');
        detailsContainer.style.display = 'block';
        detailsContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2>${group.name}</h2>
                <button class="btn btn-primary" onclick="showAddMemberModal('${group.id}')">
                    <i class="fas fa-user-plus"></i> Add Member
                </button>
            </div>
            <p>${group.description || 'No description'}</p>
            <div class="members-section">
                <h3>Members</h3>
                <ul class="member-list">
                    ${group.members.map(member => `
                        <li>
                            <div class="member-avatar">${member.charAt(0).toUpperCase()}</div>
                            <div>
                                <div>${member}</div>
                                <div style="font-size: 0.9rem; opacity: 0.7;">
                                    ${member === group.created_by ? 'Group Admin' : 'Member'}
                                </div>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div class="expenses-section">
                <h3>Recent Expenses</h3>
                <div class="expenses-list">
                    ${await loadGroupExpenses(groupId)}
                </div>
            </div>
        `;

        // Scroll to group details
        detailsContainer.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading group details:', error);
        showError('Error loading group details: ' + error.message);
    }
}

// Load group expenses
async function loadGroupExpenses(groupId) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.EXPENSES}?group=${groupId}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch group expenses');
        }

        const expenses = await response.json();

        if (expenses.length === 0) {
            return '<p>No expenses yet</p>';
        }

        return expenses.map(expense => `
            <div class="expense-item">
                <div>
                    <div>${expense.description}</div>
                    <div class="expense-date">${new Date(expense.created_at).toLocaleDateString()}</div>
                </div>
                <div class="expense-amount">${formatCurrency(expense.amount)}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading group expenses:', error);
        return '<p>Error loading expenses</p>';
    }
}

// Create new group
async function createGroup(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    try {
        const members = formData.get('members')
            .split(',')
            .map(email => email.trim())
            .filter(email => email);

        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.GROUPS}`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: formData.get('name'),
                description: formData.get('description'),
                members: members
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create group');
        }

        // Close modal and reload groups
        document.getElementById('create-group-modal').style.display = 'none';
        form.reset();
        loadGroups();
        showSuccess('Group created successfully!');
    } catch (error) {
        console.error('Error creating group:', error);
        showError('Error creating group: ' + error.message);
    }
}

// Add member to group
async function addMember(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const groupId = form.getAttribute('data-group-id');
    const email = formData.get('email');

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.GROUPS}${groupId}/members/`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to add member');
        }

        // Close modal and reload group details
        document.getElementById('add-member-modal').style.display = 'none';
        form.reset();
        viewGroupDetails(groupId);
        showSuccess('Member added successfully!');
    } catch (error) {
        console.error('Error adding member:', error);
        showError('Error adding member: ' + error.message);
    }
}

// Show add member modal
function showAddMemberModal(groupId) {
    const modal = document.getElementById('add-member-modal');
    const form = document.getElementById('add-member-form');
    form.setAttribute('data-group-id', groupId);
    modal.style.display = 'block';
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

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize groups page
document.addEventListener('DOMContentLoaded', () => {
    loadProfile(); // Load user profile for the navigation
    loadGroups();

    // Initialize create group form
    const createGroupForm = document.getElementById('create-group-form');
    if (createGroupForm) {
        createGroupForm.addEventListener('submit', createGroup);
    }

    // Initialize add member form
    const addMemberForm = document.getElementById('add-member-form');
    if (addMemberForm) {
        addMemberForm.addEventListener('submit', addMember);
    }

    // Close modals when clicking outside
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
}); 