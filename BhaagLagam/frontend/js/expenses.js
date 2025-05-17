// Load and display expenses
async function loadExpenses() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.EXPENSES}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch expenses');
        }

        const expenses = await response.json();
        const expensesList = document.getElementById('expenses-list');
        expensesList.innerHTML = '';

        if (expenses.length === 0) {
            expensesList.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                    <h3>No expenses yet</h3>
                    <p>Create a new expense to get started!</p>
                </div>
            `;
            return;
        }

        expenses.forEach(expense => {
            const expenseCard = document.createElement('div');
            expenseCard.className = 'expense-card';
            expenseCard.innerHTML = `
                <div class="expense-header">
                    <div class="expense-icon">
                        <i class="fas fa-receipt"></i>
                    </div>
                    <div class="expense-info">
                        <h3>${expense.description}</h3>
                        <p>${expense.group_name}</p>
                    </div>
                </div>
                <div class="expense-meta">
                    <div class="expense-details">
                        <div class="expense-amount">${formatCurrency(expense.amount)}</div>
                        <div class="expense-date">${new Date(expense.created_at).toLocaleDateString()}</div>
                    </div>
                    <div class="expense-split">
                        <div class="split-type">${expense.split_type.charAt(0).toUpperCase() + expense.split_type.slice(1)} Split</div>
                        <div class="split-members">
                            ${expense.splits.slice(0, 3).map(split => `
                                <div class="member-avatar" title="${split.user_email}">${split.user_email.charAt(0).toUpperCase()}</div>
                            `).join('')}
                            ${expense.splits.length > 3 ? `
                                <div class="member-avatar" title="And ${expense.splits.length - 3} more">+${expense.splits.length - 3}</div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <button onclick="viewExpenseDetails('${expense.id}')" class="btn btn-outline">View Details</button>
            `;
            expensesList.appendChild(expenseCard);
        });
    } catch (error) {
        console.error('Error loading expenses:', error);
        showError('Error loading expenses: ' + error.message);
    }
}

// Load user's groups for expense creation and filtering
async function loadGroups() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.GROUPS}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch groups');
        }

        const groups = await response.json();
        
        // Update group select in create expense form
        const groupSelect = document.getElementById('group');
        groupSelect.innerHTML = '<option value="">Select a group</option>';
        
        // Update group filter
        const groupFilter = document.getElementById('group-filter');
        groupFilter.innerHTML = '<option value="">All Groups</option>';

        groups.forEach(group => {
            // Add to create expense form
            const createOption = document.createElement('option');
            createOption.value = group.id;
            createOption.textContent = group.name;
            groupSelect.appendChild(createOption);

            // Add to filter
            const filterOption = document.createElement('option');
            filterOption.value = group.id;
            filterOption.textContent = group.name;
            groupFilter.appendChild(filterOption);

            // Store group members for split calculations
            window.groupMembers = window.groupMembers || {};
            window.groupMembers[group.id] = group.members;
        });
    } catch (error) {
        console.error('Error loading groups:', error);
        showError('Error loading groups: ' + error.message);
    }
}

// View expense details
async function viewExpenseDetails(expenseId) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.EXPENSES}${expenseId}/`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to fetch expense details');
        }

        const expense = await response.json();
        const detailsContainer = document.getElementById('expense-details');
        detailsContainer.style.display = 'block';
        detailsContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2>${expense.description}</h2>
                <button class="btn btn-outline" onclick="document.getElementById('expense-details').style.display='none'">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
            <div class="expense-info-grid">
                <div class="info-item">
                    <span class="label">Amount</span>
                    <span class="value">${formatCurrency(expense.amount)}</span>
                </div>
                <div class="info-item">
                    <span class="label">Group</span>
                    <span class="value">${expense.group_name}</span>
                </div>
                <div class="info-item">
                    <span class="label">Split Type</span>
                    <span class="value">${expense.split_type.charAt(0).toUpperCase() + expense.split_type.slice(1)}</span>
                </div>
                <div class="info-item">
                    <span class="label">Paid By</span>
                    <span class="value">${expense.paid_by}</span>
                </div>
                <div class="info-item">
                    <span class="label">Date</span>
                    <span class="value">${new Date(expense.created_at).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="splits-section">
                <h3>Split Details</h3>
                <div class="splits-grid">
                    ${expense.splits.map(split => `
                        <div class="split-item">
                            <div class="member-avatar">${split.user_email.charAt(0).toUpperCase()}</div>
                            <span class="user">${split.user_email}</span>
                            <span class="amount ${split.amount >= 0 ? 'positive' : 'negative'}">
                                ${formatCurrency(split.amount)}
                            </span>
                            ${split.paid_status === 'PENDING' ? `
                                <button class="btn btn-outline" onclick="markAsPaid('${split.id}')">
                                    Mark as Paid
                                </button>
                            ` : `
                                <span class="paid-status">Paid</span>
                            `}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Scroll to the details section
        detailsContainer.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error loading expense details:', error);
        showError('Error loading expense details: ' + error.message);
    }
}

// Create new expense
async function createExpense(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    try {
        const groupId = formData.get('group_id');
        const amount = parseFloat(formData.get('amount'));
        const splitType = formData.get('split_type').toUpperCase();
        let customSplits = [];

        // Calculate splits based on split type
        const members = window.groupMembers[groupId];
        if (!members || members.length === 0) {
            throw new Error('No members found in the selected group');
        }

        if (splitType !== 'EQUAL') {
            customSplits = Array.from(document.querySelectorAll('.custom-split-item')).map(item => {
                const userEmail = item.getAttribute('data-member');
                const value = parseFloat(item.querySelector('input').value);
                
                if (splitType === 'PERCENTAGE') {
                    return {
                        user_email: userEmail,
                        amount: (amount * value) / 100
                    };
                } else {
                    return {
                        user_email: userEmail,
                        amount: value
                    };
                }
            });

            // Validate splits
            const totalSplit = customSplits.reduce((sum, split) => sum + split.amount, 0);
            if (Math.abs(totalSplit - amount) > 0.01) {
                throw new Error('Split amounts must add up to the total amount');
            }
        }

        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.EXPENSES}`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                description: formData.get('description'),
                amount: amount,
                group_id: groupId,
                split_type: splitType,
                custom_splits: splitType !== 'EQUAL' ? customSplits : undefined
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create expense');
        }

        // Close modal and reload expenses
        document.getElementById('create-expense-modal').style.display = 'none';
        form.reset();
        loadExpenses();
        showSuccess('Expense created successfully!');
    } catch (error) {
        console.error('Error creating expense:', error);
        showError('Error creating expense: ' + error.message);
    }
}

// Mark split as paid
async function markAsPaid(splitId) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.EXPENSE_SPLITS}${splitId}/mark_as_paid/`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to mark split as paid');
        }

        showSuccess('Split marked as paid successfully!');
        loadExpenses(); // Reload expenses to reflect the change
    } catch (error) {
        console.error('Error marking split as paid:', error);
        showError('Error marking split as paid: ' + error.message);
    }
}

// Toggle custom splits section based on split type
function toggleCustomSplits() {
    const splitType = document.getElementById('split-type').value;
    const customSplits = document.getElementById('custom-splits');
    const groupId = document.getElementById('group').value;
    const amount = parseFloat(document.getElementById('amount').value) || 0;

    if (!groupId) {
        showError('Please select a group first');
        document.getElementById('split-type').value = 'equal';
        return;
    }

    const members = window.groupMembers[groupId];
    if (!members || members.length === 0) {
        showError('No members found in the selected group');
        document.getElementById('split-type').value = 'equal';
        return;
    }

    if (splitType === 'equal') {
        customSplits.style.display = 'none';
        return;
    }

    customSplits.style.display = 'block';
    customSplits.innerHTML = members.map(member => `
        <div class="custom-split-item" data-member="${member}">
            <div class="member-avatar">${member.charAt(0).toUpperCase()}</div>
            <span>${member}</span>
            <input type="number" 
                   step="${splitType === 'percentage' ? '1' : '0.01'}" 
                   min="0" 
                   max="${splitType === 'percentage' ? '100' : amount}"
                   placeholder="${splitType === 'percentage' ? 'Percentage' : 'Amount'}"
                   onchange="validateSplits()"
                   required>
            <span>${splitType === 'percentage' ? '%' : '$'}</span>
        </div>
    `).join('');
}

// Validate splits to ensure they add up correctly
function validateSplits() {
    const splitType = document.getElementById('split-type').value;
    const amount = parseFloat(document.getElementById('amount').value) || 0;
    const splits = Array.from(document.querySelectorAll('.custom-split-item input'));
    
    let total = splits.reduce((sum, input) => sum + (parseFloat(input.value) || 0), 0);
    
    if (splitType === 'percentage' && Math.round(total) !== 100) {
        showError('Percentages must add up to 100%');
        return false;
    }
    
    if (splitType === 'custom' && Math.abs(total - amount) > 0.01) {
        showError('Split amounts must add up to the total amount');
        return false;
    }
    
    return true;
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

// Initialize expenses page
document.addEventListener('DOMContentLoaded', () => {
    loadProfile(); // Load user profile for the navigation
    loadExpenses();
    loadGroups();

    // Initialize create expense form
    const createExpenseForm = document.getElementById('create-expense-form');
    if (createExpenseForm) {
        createExpenseForm.addEventListener('submit', createExpense);
    }

    // Close modals when clicking outside
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };

    // Handle amount changes
    const amountInput = document.getElementById('amount');
    if (amountInput) {
        amountInput.addEventListener('change', () => {
            const splitType = document.getElementById('split-type').value;
            if (splitType !== 'equal') {
                toggleCustomSplits();
            }
        });
    }

    // Handle group changes
    const groupSelect = document.getElementById('group');
    if (groupSelect) {
        groupSelect.addEventListener('change', () => {
            const splitType = document.getElementById('split-type').value;
            if (splitType !== 'equal') {
                toggleCustomSplits();
            }
        });
    }

    // Handle filter changes
    const groupFilter = document.getElementById('group-filter');
    if (groupFilter) {
        groupFilter.addEventListener('change', loadExpenses);
    }
}); 