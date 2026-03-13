const API_URL = 'http://localhost:3000/api';
let currentPeriod = 'monthly';
let expensesData = [];

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    setupEventListeners();
    setDefaultDate();
});

function initializeDashboard() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('userName').textContent = `Welcome, ${user.fullName}`;
        document.getElementById('salaryAmount').textContent = `₹${user.monthlySalary.toLocaleString()}`;
    }
    
    loadExpenses();
    loadSummary();
}

function setupEventListeners() {
    document.getElementById('expenseForm').addEventListener('submit', handleAddExpense);
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expenseDate').value = today;
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Load Expenses with Period Filter
async function loadExpenses() {
    try {
        const response = await fetch(`${API_URL}/expenses?period=${currentPeriod}`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load expenses');
        
        expensesData = await response.json();
        renderExpenses();
    } catch (error) {
        showNotification('Failed to load expenses', 'error');
    }
}

// Render Expenses List
function renderExpenses() {
    const container = document.getElementById('expensesList');
    
    if (expensesData.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>No expenses found for this period</p></div>';
        return;
    }
    
    container.innerHTML = expensesData.map(expense => {
        const categoryIcons = {
            'Food': 'fa-utensils', 'Rent': 'fa-home', 'Utilities': 'fa-bolt',
            'Insurance': 'fa-shield-alt', 'Healthcare': 'fa-heartbeat',
            'Travel': 'fa-plane', 'Entertainment': 'fa-film',
            'Shopping': 'fa-shopping-bag', 'Savings': 'fa-piggy-bank'
        };
        
        const icon = categoryIcons[expense.category] || 'fa-tag';
        const date = new Date(expense.date).toLocaleDateString('en-IN');
        
        return `
            <div class="expense-item" data-id="${expense.id}">
                <div class="expense-info">
                    <div class="expense-category" style="background: rgba(99, 102, 241, 0.2); color: var(--primary-color);">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="expense-details">
                        <h4>${expense.category}</h4>
                        <small>${date}</small>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span class="expense-amount">-₹${expense.amount.toLocaleString()}</span>
                    <button class="delete-btn" onclick="deleteExpense(${expense.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Handle Add Expense with Aggregation
async function handleAddExpense(e) {
    e.preventDefault();
    
    const expenseData = {
        category: document.getElementById('expenseCategory').value,
        amount: parseFloat(document.getElementById('expenseAmount').value),
        date: document.getElementById('expenseDate').value
    };
    
    try {
        const response = await fetch(`${API_URL}/expenses`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(expenseData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const message = data.aggregated ? 
                `Updated ${expenseData.category}: New total ₹${data.newAmount}` : 
                'Expense added successfully';
            
            showNotification(message, 'success');
            
            // Reset form but keep date
            document.getElementById('expenseCategory').value = '';
            document.getElementById('expenseAmount').value = '';
            
            // Reload data
            loadExpenses();
            loadSummary();
        } else {
            showNotification(data.error || 'Failed to add expense', 'error');
        }
    } catch (error) {
        showNotification('Network error', 'error');
    }
}

// Delete Expense
async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
        const response = await fetch(`${API_URL}/expenses/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            showNotification('Expense deleted successfully');
            loadExpenses();
            loadSummary();
        } else {
            showNotification('Failed to delete expense', 'error');
        }
    } catch (error) {
        showNotification('Network error', 'error');
    }
}

// Load Summary Statistics
async function loadSummary() {
    try {
        const response = await fetch(`${API_URL}/summary`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Failed to load summary');
        
        const data = await response.json();
        updateDashboardUI(data);
    } catch (error) {
        showNotification('Failed to load summary', 'error');
    }
}

// Update Dashboard UI
function updateDashboardUI(data) {
    // Update main stats
    document.getElementById('totalSpent').textContent = `₹${data.totalSpent.toLocaleString()}`;
    document.getElementById('remaining').textContent = `₹${data.remaining.toLocaleString()}`;
    
    // Update 50/30/20 breakdown
    const salary = data.monthlySalary;
    const needsPercent = salary > 0 ? ((data.breakdown.needs / (salary * 0.5)) * 100).toFixed(1) : 0;
    const wantsPercent = salary > 0 ? ((data.breakdown.wants / (salary * 0.3)) * 100).toFixed(1) : 0;
    const savingsPercent = salary > 0 ? ((data.breakdown.savings / (salary * 0.2)) * 100).toFixed(1) : 0;
    
    document.getElementById('needsPercent').textContent = `${needsPercent}%`;
    document.getElementById('wantsPercent').textContent = `${wantsPercent}%`;
    document.getElementById('savingsPercent').textContent = `${savingsPercent}%`;
    
    document.getElementById('needsBar').style.width = `${Math.min(needsPercent, 100)}%`;
    document.getElementById('wantsBar').style.width = `${Math.min(wantsPercent, 100)}%`;
    document.getElementById('savingsBar').style.width = `${Math.min(savingsPercent, 100)}%`;
    
    document.getElementById('needsText').textContent = `₹${data.breakdown.needs.toLocaleString()} / ₹${data.breakdown.needsPercentage.toLocaleString()}`;
    document.getElementById('wantsText').textContent = `₹${data.breakdown.wants.toLocaleString()} / ₹${data.breakdown.wantsPercentage.toLocaleString()}`;
    document.getElementById('savingsText').textContent = `₹${data.breakdown.savings.toLocaleString()} / ₹${data.breakdown.savingsPercentage.toLocaleString()}`;
    
    // Warning Banner Logic (90% threshold)
    if (data.spentPercentage >= 90) {
        document.getElementById('warningBanner').style.display = 'block';
        document.getElementById('spentPercent').textContent = `${Math.round(data.spentPercentage)}%`;
    } else {
        document.getElementById('warningBanner').style.display = 'none';
    }
    
    // Update category summary
    renderCategorySummary(data.expenses);
}

function renderCategorySummary(expenses) {
    const container = document.getElementById('categorySummary');
    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6'];
    
    if (expenses.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No data available</p>';
        return;
    }
    
    container.innerHTML = expenses.map((exp, index) => `
        <div class="category-item" style="border-left-color: ${colors[index % colors.length]}">
            <div class="category-info">
                <div class="category-dot" style="background: ${colors[index % colors.length]}"></div>
                <span>${exp.category}</span>
            </div>
            <strong>₹${exp.total.toLocaleString()}</strong>
        </div>
    `).join('');
}

// Switch Period (Week/Month/Year)
function switchPeriod(period) {
    currentPeriod = period;
    
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update label
    const labels = { weekly: 'This Week', monthly: 'This Month', yearly: 'This Year' };
    document.getElementById('periodLabel').textContent = labels[period];
    
    loadExpenses();
}

// Salary Update Functions
function toggleSalaryEdit() {
    const form = document.getElementById('salaryEditForm');
    const isVisible = form.style.display === 'flex';
    form.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) {
        const currentSalary = document.getElementById('salaryAmount').textContent.replace(/[₹,]/g, '');
        document.getElementById('newSalary').value = currentSalary;
    }
}

async function updateSalary() {
    const newSalary = parseFloat(document.getElementById('newSalary').value);
    
    if (!newSalary || newSalary <= 0) {
        showNotification('Please enter a valid salary', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/salary`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ monthlySalary: newSalary })
        });
        
        if (response.ok) {
            // Update local storage
            const user = JSON.parse(localStorage.getItem('user'));
            user.monthlySalary = newSalary;
            localStorage.setItem('user', JSON.stringify(user));
            
            document.getElementById('salaryAmount').textContent = `₹${newSalary.toLocaleString()}`;
            toggleSalaryEdit();
            showNotification('Salary updated successfully');
            loadSummary();
        } else {
            showNotification('Failed to update salary', 'error');
        }
    } catch (error) {
        showNotification('Network error', 'error');
    }
}

function closeWarning() {
    document.getElementById('warningBanner').style.display = 'none';
}

// Logout function (duplicate for dashboard page)
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}