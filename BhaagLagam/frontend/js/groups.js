// Load and display groups
async function loadGroups() {
    try {
        const groups = await getGroups();
        const groupsList = document.getElementById('groups-list');
        groupsList.innerHTML = '';

        if (!groups || groups.length === 0) {
            groupsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users fa-3x"></i>
                    <p>No groups yet. Create a group to get started!</p>
                    <button onclick="showCreateGroupModal()" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Create Group
                    </button>
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
                            <div class="member-avatar more-members" title="And ${group.members.length - 3} more">+${group.members.length - 3}</div>
                        ` : ''}
                    </div>
                </div>
                <div class="group-actions">
                    <button class="btn btn-outline" onclick="viewGroupDetails('${group.id}')">
                        View Details
                    </button>
                    <button class="btn btn-primary" onclick="addExpense('${group.id}')">
                        Add Expense
                    </button>
                </div>
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

// Show create group modal
function showCreateGroupModal() {
    const modal = document.getElementById('create-group-modal');
    modal.style.display = 'block';
    loadCreateGroupFriends();
}

// Load friends for group creation
async function loadCreateGroupFriends() {
    const friendsList = document.getElementById('create-group-friends-list');
    const selectedContainer = document.getElementById('selected-friends-container');
    
    if (!friendsList || !selectedContainer) {
        console.error('Required containers not found');
        return;
    }

    try {
        const friends = await getFriends();
        friendsList.innerHTML = '';

        friends.forEach(friend => {
            const friendCard = document.createElement('div');
            friendCard.className = 'friend-card';
            friendCard.innerHTML = `
                <div class="friend-select">
                    <input type="checkbox" 
                           id="friend-${friend.id}" 
                           value="${friend.email}"
                           data-name="${friend.name}"
                           class="friend-checkbox"
                           onchange="updateSelectedFriendsDisplay()">
                </div>
                <div class="friend-avatar">
                    ${friend.name.charAt(0).toUpperCase()}
                </div>
                <div class="friend-info">
                    <div class="friend-name">${friend.name}</div>
                    <div class="friend-email">${friend.email}</div>
                </div>
            `;
            friendsList.appendChild(friendCard);
        });

        selectedContainer.innerHTML = '<p>Select friends to add to the group</p>';
    } catch (error) {
        console.error('Error loading friends:', error);
        showError('Error loading friends: ' + error.message);
    }
}

// Handle group creation
async function handleCreateGroup(event) {
    event.preventDefault();
    
    const name = document.getElementById('group-name').value.trim();
    const description = document.getElementById('group-description').value.trim();
    const selectedCheckboxes = document.querySelectorAll('#create-group-friends-list .friend-checkbox:checked');
    
    if (!name) {
        showError('Please enter a group name');
        return;
    }

    const members = Array.from(selectedCheckboxes).map(checkbox => checkbox.value);

    if (members.length === 0) {
        showError('Please select at least one friend');
        return;
    }

    try {
        const groupData = {
            name,
            description,
            members
        };

        await createGroup(groupData);
        closeCreateGroupModal();
        await loadGroups();
        showSuccess('Group created successfully!');
    } catch (error) {
        console.error('Error creating group:', error);
        showError('Failed to create group: ' + error.message);
    }
}

// Close create group modal
function closeCreateGroupModal() {
    const modal = document.getElementById('create-group-modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('create-group-form').reset();
        const selectedContainer = document.getElementById('selected-friends-container');
        if (selectedContainer) {
            selectedContainer.innerHTML = '<p>Select friends to add to the group</p>';
        }
    }
}

// Show success message
function showSuccess(message) {
    showNotification(message, 'success');
}

// Show error message
function showError(message) {
    showNotification(message, 'error');
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    loadGroups();
});

// Load groups when the page loads
document.addEventListener('DOMContentLoaded', function() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Load mock groups data
    loadGroups();
});

// Mock groups data
const mockGroups = [
    {
        id: '1',
        name: 'Weekend Trip',
        description: 'Expenses for our weekend getaway',
        members: ['test@gmail.com', 'friend1@example.com', 'friend2@example.com'],
        totalExpenses: 1500,
        created_at: '2025-05-15'
    },
    {
        id: '2',
        name: 'Roommates',
        description: 'Monthly household expenses',
        members: ['test@gmail.com', 'roommate@example.com'],
        totalExpenses: 2500,
        created_at: '2025-05-10'
    }
];

function loadGroups() {
    const container = document.getElementById('groups-container');
    container.innerHTML = ''; // Clear existing groups

    mockGroups.forEach(group => {
        container.appendChild(createGroupCard(group));
    });
}

function createGroupCard(group) {
    const card = document.createElement('div');
    card.className = 'group-card';
    card.innerHTML = `
        <div class="group-header">
            <div class="group-icon">
                <i class="fas fa-users"></i>
            </div>
            <div class="group-info">
                <h3>${group.name}</h3>
                <p>${group.description || 'No description'}</p>
            </div>
        </div>
        <div class="group-stats">
            <div class="stat">
                <span class="value">${group.members.length}</span>
                <span class="label">Members</span>
            </div>
            <div class="stat">
                <span class="value">₹${group.totalExpenses}</span>
                <span class="label">Total</span>
            </div>
        </div>
        <div class="group-actions">
            <button class="btn btn-outline" onclick="viewGroupDetails('${group.id}')">
                View Details
            </button>
            <button class="btn btn-primary" onclick="addExpense('${group.id}')">
                Add Expense
            </button>
        </div>
    `;
    return card;
}

function showInviteFriendModal() {
    document.getElementById('invite-friend-modal').style.display = 'block';
}

function closeInviteFriendModal() {
    document.getElementById('invite-friend-modal').style.display = 'none';
}

// Load friends list
async function loadFriends() {
    try {
        const friends = getFriends();
        const friendsList = document.getElementById('friends-list');
        
        if (!friendsList) {
            console.error('Friends list container not found');
            return;
        }

        friendsList.innerHTML = '';

        // Add header section with invite friend button
        const headerSection = document.createElement('div');
        headerSection.className = 'friends-header';
        headerSection.innerHTML = `
            <h2>Friends List</h2>
            <div class="action-buttons">
                <button onclick="showInviteFriendModal()" class="btn btn-outline invite-friend-btn">
                    <i class="fas fa-user-plus"></i> Invite Friend
                </button>
                <button onclick="showCreateGroupModal()" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Create Group
                </button>
            </div>
        `;
        friendsList.appendChild(headerSection);

        if (friends.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <i class="fas fa-user-friends fa-3x"></i>
                <p>No friends yet. Invite some friends to get started!</p>
                <button onclick="showInviteFriendModal()" class="btn btn-primary">
                    <i class="fas fa-user-plus"></i> Invite Friend
                </button>
            `;
            friendsList.appendChild(emptyState);
            return;
        }

        const friendsGrid = document.createElement('div');
        friendsGrid.className = 'friends-grid';

        friends.forEach(friend => {
            const friendCard = document.createElement('div');
            friendCard.className = 'friend-card';
            friendCard.innerHTML = `
                <div class="friend-select">
                    <input type="checkbox" 
                           id="friend-${friend.id}" 
                           value="${friend.email}"
                           data-name="${friend.name}"
                           class="friend-checkbox"
                           onchange="updateSelectedFriendsDisplay()">
                </div>
                <div class="friend-avatar">
                    ${friend.name.charAt(0).toUpperCase()}
                </div>
                <div class="friend-info">
                    <div class="friend-name">${friend.name}</div>
                </div>
            `;
            friendsGrid.appendChild(friendCard);
        });

        friendsList.appendChild(friendsGrid);

        // Add selected friends display section
        const selectedFriendsSection = document.createElement('div');
        selectedFriendsSection.id = 'selected-friends-container';
        selectedFriendsSection.className = 'selected-friends-section';
        selectedFriendsSection.innerHTML = '<p>Select friends to create a group</p>';
        friendsList.appendChild(selectedFriendsSection);

    } catch (error) {
        console.error('Error loading friends:', error);
        showError('Error loading friends: ' + error.message);
    }
}

// Update selected friends display
function updateSelectedFriendsDisplay() {
    const selectedFriends = Array.from(document.querySelectorAll('.friend-checkbox:checked'))
        .map(checkbox => checkbox.getAttribute('data-name'));

    const container = document.getElementById('selected-friends-container');
    
    if (selectedFriends.length > 0) {
        container.innerHTML = `
            <h3>Selected Friends (${selectedFriends.length})</h3>
            <div class="selected-friends-list">
                ${selectedFriends.map(name => `
                    <div class="selected-friend-tag">
                        <span>${name}</span>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        container.innerHTML = '<p>Select friends to create a group</p>';
    }
}

// Unselect a friend
function unselectFriend(email) {
    const checkbox = document.querySelector(`.friend-checkbox[value="${email}"]`);
    if (checkbox) {
        checkbox.checked = false;
        updateSelectedFriendsDisplay();
    }
}

// Handle friend invitation
function handleFriendInvite(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value;

    try {
        // Add friend to local storage
        const newFriend = {
            id: Date.now().toString(),
            email: email,
            name: email.split('@')[0], // Use part before @ as name
            status: 'pending'
        };

        // Add to friends list
        const friends = getFriends();
        friends.push(newFriend);
        localStorage.setItem('friends', JSON.stringify(friends));

        // Reset form and close modal
        form.reset();
        closeInviteFriendModal();

        // Reload friends list
        loadFriends();
        showSuccess('Friend invitation sent successfully!');
    } catch (error) {
        console.error('Error inviting friend:', error);
        showError('Error inviting friend: ' + error.message);
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    loadFriends();
    loadGroups();

    // Initialize invite friend form
    const inviteFriendForm = document.getElementById('invite-friend-form');
    if (inviteFriendForm) {
        inviteFriendForm.addEventListener('submit', handleFriendInvite);
    }
}); 