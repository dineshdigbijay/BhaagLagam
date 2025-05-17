// Database Helper Functions

// Storage keys
const STORAGE_KEYS = {
    TOKEN: 'bhaaglagam_token',
    USER: 'user_data',
    GROUPS: 'groups',
    FRIENDS: 'friends',
    EXPENSES: 'expenses'
};

// Cache management
const cache = {
    groups: new Map(),
    expenses: new Map(),
    users: new Map(),
    friends: new Map()
};

// Get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Get groups from API
async function getGroups() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.GROUPS}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch groups');
        }

        const groups = await response.json();
        groups.forEach(group => cache.groups.set(group.id, group));
        return groups;
    } catch (error) {
        console.error('Error fetching groups:', error);
        throw error;
    }
}

// Get friends from API
async function getFriends() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.FRIENDS}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch friends');
        }

        const friends = await response.json();
        friends.forEach(friend => cache.friends.set(friend.id, friend));
        return friends;
    } catch (error) {
        console.error('Error fetching friends:', error);
        return DEFAULT_FRIENDS; // Fallback to default friends for now
    }
}

// Create a new group
async function createGroup(groupData) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.GROUPS}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(groupData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create group');
        }

        const group = await response.json();
        cache.groups.set(group.id, group);
        return group;
    } catch (error) {
        console.error('Error creating group:', error);
        throw error;
    }
}

// Update a group
async function updateGroup(groupId, updates) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.GROUPS}${groupId}/`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update group');
        }

        const group = await response.json();
        cache.groups.set(group.id, group);
        return group;
    } catch (error) {
        console.error('Error updating group:', error);
        throw error;
    }
}

// Delete a group
async function deleteGroup(groupId) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.GROUPS}${groupId}/`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete group');
        }

        cache.groups.delete(groupId);
        return true;
    } catch (error) {
        console.error('Error deleting group:', error);
        throw error;
    }
}

// Clear cache
function clearCache(type = null) {
    if (type) {
        cache[type].clear();
    } else {
        Object.values(cache).forEach(map => map.clear());
    }
}

// Default friends list (temporary until friend system is implemented)
const DEFAULT_FRIENDS = [
    { id: '1', name: 'Dinesh Dahal', email: 'dinesh@gmail.com' },
    { id: '2', name: 'Dilip Chaudhary', email: 'dilip@gmail.com' },
    { id: '3', name: 'Sandeep Adhikari', email: 'sandeep@gmail.com' },
    { id: '4', name: 'Anurag Adhikari', email: 'anurag@gmail.com' },
    { id: '5', name: 'Abinash Koirala', email: 'abinash@gmail.com' }
];

// Initialize local storage
function initializeStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.FRIENDS)) {
        localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(DEFAULT_FRIENDS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.GROUPS)) {
        localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
    }
}

// Get user data from storage
function getCurrentUser() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER));
}

// Get groups from storage
function getGroups() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUPS)) || [];
}

// Get friends from storage
function getFriends() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FRIENDS)) || DEFAULT_FRIENDS;
}

// Save groups to storage
function saveGroups(groups) {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
}

// Save friends to storage
function saveFriends(friends) {
    localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(friends));
}

// Save user data to storage
function saveCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

// Add a group
function addGroup(group) {
    const groups = getGroups();
    group.id = Date.now().toString();
    groups.push(group);
    saveGroups(groups);
    return group;
}

// Update a group
function updateGroup(groupId, updates) {
    const groups = getGroups();
    const index = groups.findIndex(g => g.id === groupId);
    if (index !== -1) {
        groups[index] = { ...groups[index], ...updates };
        saveGroups(groups);
        return groups[index];
    }
    return null;
}

// Delete a group
function deleteGroup(groupId) {
    const groups = getGroups();
    const index = groups.findIndex(g => g.id === groupId);
    if (index !== -1) {
        groups.splice(index, 1);
        saveGroups(groups);
        return true;
    }
    return false;
}

// Add a friend
function addFriend(friend) {
    const friends = getFriends();
    friend.id = Date.now().toString();
    friends.push(friend);
    saveFriends(friends);
    return friend;
}

// Update a friend
function updateFriend(friendId, updates) {
    const friends = getFriends();
    const index = friends.findIndex(f => f.id === friendId);
    if (index !== -1) {
        friends[index] = { ...friends[index], ...updates };
        saveFriends(friends);
        cache.friends.set(friendId, friends[index]);
        return friends[index];
    }
    return null;
}

// Delete a friend
function deleteFriend(friendId) {
    const friends = getFriends();
    const index = friends.findIndex(f => f.id === friendId);
    if (index !== -1) {
        friends.splice(index, 1);
        saveFriends(friends);
        cache.friends.delete(friendId);
        return true;
    }
    return false;
}

// Clear all data
function clearAllData() {
    localStorage.clear();
    initializeStorage();
}

// Initialize storage on load
initializeStorage();

// Fetch and cache groups
async function fetchGroups() {
    try {
        const groups = await apiCall(CONFIG.ENDPOINTS.GROUPS);
        groups.forEach(group => {
            cache.groups.set(group.id, group);
        });
        return groups;
    } catch (error) {
        console.error('Error fetching groups:', error);
        throw error;
    }
}

// Fetch and cache expenses
async function fetchExpenses(groupId = null) {
    try {
        const endpoint = groupId 
            ? `${CONFIG.ENDPOINTS.EXPENSES}?group_id=${groupId}`
            : CONFIG.ENDPOINTS.EXPENSES;
        const expenses = await apiCall(endpoint);
        expenses.forEach(expense => {
            cache.expenses.set(expense.id, expense);
        });
        return expenses;
    } catch (error) {
        console.error('Error fetching expenses:', error);
        throw error;
    }
}

// Fetch and cache user details
async function fetchUserDetails(userId) {
    if (cache.users.has(userId)) {
        return cache.users.get(userId);
    }
    try {
        const user = await apiCall(`${CONFIG.ENDPOINTS.USERS}${userId}/`);
        cache.users.set(userId, user);
        return user;
    } catch (error) {
        console.error('Error fetching user details:', error);
        throw error;
    }
}

// Create a new expense
async function createExpense(expenseData) {
    try {
        const expense = await apiCall(CONFIG.ENDPOINTS.EXPENSES, 'POST', expenseData);
        cache.expenses.set(expense.id, expense);
        return expense;
    } catch (error) {
        console.error('Error creating expense:', error);
        throw error;
    }
}

// Update expense
async function updateExpense(expenseId, expenseData) {
    try {
        const expense = await apiCall(`${CONFIG.ENDPOINTS.EXPENSES}${expenseId}/`, 'PUT', expenseData);
        cache.expenses.set(expense.id, expense);
        return expense;
    } catch (error) {
        console.error('Error updating expense:', error);
        throw error;
    }
} 