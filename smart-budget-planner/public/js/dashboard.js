// ============================================
// SMART BUDGET PLANNER - DASHBOARD
// ============================================

let budgetChart = null;
let categoryChart = null;
let trendChart = null;
let currentExpenses = [];
let deletedExpenses = [];
let budgetSummary = {};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if logged in
    checkAuth();
    
    // Load initial data
    loadUserData();
    loadDashboardData();
    
    // Initialize UI
    initializeUI();
    
    // Set today's date
    var dateInput = document.getElementById('expenseDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    var quickDateInput = document.getElementById('quickDate');
    if (quickDateInput) {
        quickDateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Load other data
    loadFinancialTip();
    renderSavingsGoals();
    renderCategoryLimits();
    renderThemeGrid();
    loadSettingsValues();
    
    // Load initial section data
    switchSection('overview');
});

// Check authentication
function checkAuth() {
    var currentUser = localStorage.getItem('smart_budget_current_user');
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
}

// Load user data
function loadUserData() {
    var user = JSON.parse(localStorage.getItem('smart_budget_current_user'));
    var usernameDisplay = document.getElementById('usernameDisplay');
    if (usernameDisplay && user) {
        usernameDisplay.textContent = user.username;
    }
}

// Initialize UI components
function initializeUI() {
    // Theme toggle
    var themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            var currentTheme = localStorage.getItem('smart_budget_theme') || 'light';
            var themeKeys = Object.keys(THEMES);
            var currentIndex = themeKeys.indexOf(currentTheme);
            var newIndex = (currentIndex + 1) % themeKeys.length;
            var newTheme = themeKeys[newIndex];
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('smart_budget_theme', newTheme);
            renderThemeGrid();
        });
        
        // Set initial theme
        var savedTheme = localStorage.getItem('smart_budget_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
    
    // Hamburger menu toggle
    var hamburgerBtn = document.getElementById('hamburgerBtn');
    var sidebar = document.getElementById('sidebar');
    var mobileOverlay = document.getElementById('mobileOverlay');
    
    if (hamburgerBtn && sidebar) {
        hamburgerBtn.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            hamburgerBtn.classList.toggle('active');
            if (mobileOverlay) {
                mobileOverlay.classList.toggle('active');
            }
        });
        
        // Close sidebar when clicking overlay
        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', function() {
                sidebar.classList.remove('active');
                hamburgerBtn.classList.remove('active');
                mobileOverlay.classList.remove('active');
            });
        }
    }
    
    // Navigation
    var navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            var section = this.dataset.section;
            switchSection(section);
            
            // Update active nav
            navItems.forEach(function(nav) {
                nav.classList.remove('active');
            });
            this.classList.add('active');
            
            // Close sidebar on mobile after navigation
            if (window.innerWidth <= 768 && sidebar) {
                sidebar.classList.remove('active');
                if (hamburgerBtn) hamburgerBtn.classList.remove('active');
                if (mobileOverlay) mobileOverlay.classList.remove('active');
            }
        });
    });
    
    // Logout
    var logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('smart_budget_current_user');
            window.location.href = 'index.html';
        });
    }
    
    // Add expense form
    var addExpenseForm = document.getElementById('addExpenseForm');
    if (addExpenseForm) {
        addExpenseForm.addEventListener('submit', handleAddExpense);
    }
    
    // Search
    var searchInput = document.getElementById('searchExpenses');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Savings goal form
    var savingsGoalForm = document.getElementById('savingsGoalForm');
    if (savingsGoalForm) {
        savingsGoalForm.addEventListener('submit', handleSavingsGoal);
    }
    
    // Save limits button
    var saveLimitsBtn = document.getElementById('saveLimitsBtn');
    if (saveLimitsBtn) {
        saveLimitsBtn.addEventListener('click', saveCategoryLimits);
    }
    
    // Export buttons
    var exportJsonBtn = document.getElementById('exportJsonBtn');
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', handleExportJSON);
    }
    
    // Import file
    var importFile = document.getElementById('importFile');
    if (importFile) {
        importFile.addEventListener('change', handleImportJSON);
    }
    
    // Backup section buttons
    var copyNotepadBtn = document.getElementById('copyNotepadBtn');
    if (copyNotepadBtn) {
        copyNotepadBtn.addEventListener('click', handleCopyNotepad);
    }
    
    var downloadTextBtn = document.getElementById('downloadTextBtn');
    if (downloadTextBtn) {
        downloadTextBtn.addEventListener('click', handleDownloadText);
    }
    
    var exportCSVBtn = document.getElementById('exportCSVBtn');
    if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', handleExportCSV);
    }
    
    var exportTextBtn = document.getElementById('exportTextBtn');
    if (exportTextBtn) {
        exportTextBtn.addEventListener('click', handleExportText);
    }
    
    // Word export button
    var exportWordBtn = document.getElementById('exportWordBtn');
    if (exportWordBtn) {
        exportWordBtn.addEventListener('click', handleExportWord);
    }
    
    var importCSVFile = document.getElementById('importCSVFile');
    if (importCSVFile) {
        importCSVFile.addEventListener('change', handleImportCSV);
    }
    
    var importTextFile = document.getElementById('importTextFile');
    if (importTextFile) {
        importTextFile.addEventListener('change', handleImportText);
    }
    
    // Settings buttons
    var saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', handleSaveSettings);
    }
    
    var currencySelect = document.getElementById('currencySelect');
    if (currencySelect) {
        currencySelect.addEventListener('change', function() {
            showToast('Currency updated to ' + this.value);
        });
    }
    
    // Quick add buttons
    var quickBtns = document.querySelectorAll('.quick-btn');
    quickBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var category = this.dataset.category;
            var quickAddModal = document.getElementById('quickAddModal');
            var quickCategory = document.getElementById('quickCategory');
            if (quickCategory) quickCategory.value = category;
            if (quickAddModal) quickAddModal.classList.remove('hidden');
        });
    });
    
    // Close quick add modal
    var closeQuickAdd = document.getElementById('closeQuickAdd');
    if (closeQuickAdd) {
        closeQuickAdd.addEventListener('click', function() {
            var quickAddModal = document.getElementById('quickAddModal');
            if (quickAddModal) quickAddModal.classList.add('hidden');
        });
    }
    
    // Quick add form
    var quickAddForm = document.getElementById('quickAddForm');
    if (quickAddForm) {
        quickAddForm.addEventListener('submit', handleQuickAdd);
    }
}

// Section switching
function switchSection(sectionName) {
    var sections = document.querySelectorAll('.section');
    sections.forEach(function(section) {
        section.classList.remove('active');
    });
    
    var targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update page title
    var titles = {
        'overview': 'Dashboard Overview',
        'expenses': 'All Expenses',
        'savings': 'Savings Goals',
        'insights': 'Smart Insights',
        'reports': 'Weekly Reports',
        'add': 'Add New Expense',
        'backup': 'Backup & Restore',
        'deleted': 'Deleted Expenses',
        'settings': 'Settings'
    };
    
    var pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = titles[sectionName] || 'Dashboard';
    }
    
    // Load section-specific data
    if (sectionName === 'expenses') {
        renderExpensesTable(currentExpenses);
    } else if (sectionName === 'deleted') {
        loadDeletedExpenses();
    } else if (sectionName === 'overview') {
        updateCharts();
        renderHeatmap();
    } else if (sectionName === 'insights') {
        renderInsights();
    } else if (sectionName === 'reports') {
        renderWeeklyReport();
    } else if (sectionName === 'backup') {
        loadExpenseNotepad();
    }
}

// Load dashboard data
function loadDashboardData() {
    currentExpenses = getExpenses();
    budgetSummary = calculateBudgetSummary();
    
    updateDashboardStats();
    updateCharts();
    renderHeatmap();
    updateSpendingPersonality();
}

// Update dashboard stats
function updateDashboardStats() {
    var user = JSON.parse(localStorage.getItem('smart_budget_current_user'));
    var monthlyIncome = user ? user.monthlyIncome || 0 : 0;
    
    // Update values
    var incomeEl = document.querySelector('.summary-card.income .summary-value');
    var expensesEl = document.querySelector('.summary-card.expenses .summary-value');
    var savingsEl = document.querySelector('.summary-card.savings .summary-value');
    var balanceEl = document.querySelector('.summary-card.balance .summary-value');
    var healthEl = document.querySelector('.summary-card.health .summary-value');
    
    if (incomeEl) incomeEl.textContent = formatCurrency(monthlyIncome);
    if (expensesEl) expensesEl.textContent = formatCurrency(budgetSummary.total || 0);
    if (savingsEl) savingsEl.textContent = formatCurrency(budgetSummary.savings || 0);
    if (balanceEl) balanceEl.textContent = formatCurrency(budgetSummary.remainingBalance || 0);
    if (healthEl) healthEl.textContent = (budgetSummary.healthScore || 0) + '%';
    
    // Update health status
    var healthStatus = document.getElementById('healthStatus');
    if (healthStatus) {
        var score = budgetSummary.healthScore || 0;
        if (score >= 80) {
            healthStatus.textContent = 'Excellent';
            healthStatus.className = 'health-status';
        } else if (score >= 60) {
            healthStatus.textContent = 'Good';
            healthStatus.className = 'health-status warning';
        } else {
            healthStatus.textContent = 'Needs Improvement';
            healthStatus.className = 'health-status danger';
        }
    }
    
    // Update progress bars
    updateBudgetProgress();
}

// Update budget progress bars
function updateBudgetProgress() {
    var monthlyIncome = budgetSummary.monthlyIncome || 0;
    var needs = budgetSummary.needs || 0;
    var wants = budgetSummary.wants || 0;
    var savings = budgetSummary.savings || 0;
    
    var needsTarget = monthlyIncome * 0.5;
    var wantsTarget = monthlyIncome * 0.3;
    var savingsTarget = monthlyIncome * 0.2;
    
    var needsBar = document.getElementById('needsProgressBar');
    var wantsBar = document.getElementById('wantsProgressBar');
    var savingsBar = document.getElementById('savingsProgressBar');
    
    if (needsBar) needsBar.style.width = monthlyIncome > 0 ? Math.min((needs / needsTarget) * 100, 100) + '%' : '0%';
    if (wantsBar) wantsBar.style.width = monthlyIncome > 0 ? Math.min((wants / wantsTarget) * 100, 100) + '%' : '0%';
    if (savingsBar) savingsBar.style.width = monthlyIncome > 0 ? Math.min((savings / savingsTarget) * 100, 100) + '%' : '0%';
    
    var needsText = document.getElementById('needsProgressText');
    var wantsText = document.getElementById('wantsProgressText');
    var savingsText = document.getElementById('savingsProgressText');
    
    if (needsText) needsText.textContent = formatCurrency(needs) + ' / ' + formatCurrency(needsTarget);
    if (wantsText) wantsText.textContent = formatCurrency(wants) + ' / ' + formatCurrency(wantsTarget);
    if (savingsText) savingsText.textContent = formatCurrency(savings) + ' / ' + formatCurrency(savingsTarget);
}

// Update charts
function updateCharts() {
    updateBudgetChart();
    updateCategoryChart();
    updateTrendChart();
}

// Budget chart
function updateBudgetChart() {
    var canvas = document.getElementById('budgetChart');
    if (!canvas) return;
    
    var ctx = canvas.getContext('2d');
    if (budgetChart) budgetChart.destroy();
    
    budgetChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['🏠 Needs (50%)', '🎮 Wants (30%)', '💎 Savings (20%)'],
            datasets: [{
                data: [budgetSummary.needs || 0, budgetSummary.wants || 0, budgetSummary.savings || 0],
                backgroundColor: ['#3b82f6', '#ec4899', '#10b981'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// Category chart
function updateCategoryChart() {
    var canvas = document.getElementById('categoryChart');
    if (!canvas) return;
    
    var ctx = canvas.getContext('2d');
    if (categoryChart) categoryChart.destroy();
    
    var categories = budgetSummary.categories || {};
    var labels = Object.keys(categories);
    var data = Object.values(categories);
    
    var sorted = labels.map(function(label, i) {
        return { label: label, value: data[i] };
    }).sort(function(a, b) { return b.value - a.value; }).slice(0, 8);
    
    // Color based on type
    var colors = sorted.map(function(item) {
        return getBudgetType(item.label) === 'Needs' ? '#3b82f6' : 
               getBudgetType(item.label) === 'Wants' ? '#ec4899' : '#10b981';
    });
    
    categoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted.map(function(item) { return item.label; }),
            datasets: [{
                label: 'Amount (INR)',
                data: sorted.map(function(item) { return item.value; }),
                backgroundColor: colors,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// Trend chart
function updateTrendChart() {
    var canvas = document.getElementById('trendChart');
    if (!canvas) return;
    
    var ctx = canvas.getContext('2d');
    if (trendChart) trendChart.destroy();
    
    var trends = getMonthlyTrends(6);
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trends.map(function(t) { return t.month; }),
            datasets: [
                {
                    label: 'Total',
                    data: trends.map(function(t) { return t.total; }),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16,185,129,0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Needs',
                    data: trends.map(function(t) { return t.needs; }),
                    borderColor: '#3b82f6',
                    tension: 0.4
                },
                {
                    label: 'Wants',
                    data: trends.map(function(t) { return t.wants; }),
                    borderColor: '#ec4899',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// Render heatmap
function renderHeatmap() {
    var container = document.getElementById('expenseHeatmap');
    if (!container) return;
    
    var heatmapData = getHeatmapData();
    var today = new Date();
    var daysToShow = 35;
    
    var hasData = Object.values(heatmapData).some(function(val) { return val > 0; });
    
    if (!hasData) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-alt"></i><p>Add expenses to see heatmap</p></div>';
        return;
    }
    
    var html = '';
    for (var i = daysToShow - 1; i >= 0; i--) {
        var date = new Date(today);
        date.setDate(today.getDate() - i);
        var dateStr = date.toISOString().split('T')[0];
        var amount = heatmapData[dateStr] || 0;
        
        var maxAmount = Math.max.apply(null, Object.values(heatmapData).concat([1]));
        var level = 0;
        if (amount > 0) {
            var ratio = amount / maxAmount;
            if (ratio <= 0.2) level = 1;
            else if (ratio <= 0.4) level = 2;
            else if (ratio <= 0.6) level = 3;
            else if (ratio <= 0.8) level = 4;
            else level = 5;
        }
        
        html += '<div class="heatmap-day level-' + level + '" title="' + formatDate(dateStr) + ': ' + formatCurrency(amount) + '">' + date.getDate() + '</div>';
    }
    
    container.innerHTML = html;
}

// Handle add expense
function handleAddExpense(e) {
    e.preventDefault();
    
    var category = document.getElementById('expenseCategory').value;
    var amount = parseFloat(document.getElementById('expenseAmount').value);
    var date = document.getElementById('expenseDate').value;
    var description = document.getElementById('expenseDescription').value;
    
    if (!category || !amount || amount <= 0) {
        showToast('Please fill all required fields', 'error');
        return;
    }
    
    try {
        const result = addExpense(category, amount, date, description);
        showToast(result.aggregated ? `Updated ${category}: total ₹${result.totalAmount?.toLocaleString() || amount.toLocaleString()}` : 'New expense added');
        document.getElementById('addExpenseForm').reset();
        document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
        loadDashboardData();
        
        setTimeout(function() {
            document.querySelector('[data-section="overview"]').click();
        }, 500);
    } catch (error) {
        showToast(error.message || 'Failed to add expense', 'error');
    }
}

// Handle quick add
function handleQuickAdd(e) {
    e.preventDefault();
    
    var category = document.getElementById('quickCategory').value;
    var amount = parseFloat(document.getElementById('quickAmount').value);
    var date = document.getElementById('quickDate').value;
    
    if (!amount || amount <= 0) {
        showToast('Please enter an amount', 'error');
        return;
    }
    
    try {
        const result = addExpense(category, amount, date, '');
        showToast(result.aggregated ? `Updated ${category}: total ₹${result.totalAmount?.toLocaleString() || amount.toLocaleString()}` : 'Quick expense added!');
        document.getElementById('quickAddForm').reset();
        document.getElementById('quickAddModal').classList.add('hidden');
        loadDashboardData();
    } catch (error) {
        showToast(error.message || 'Failed to add expense', 'error');
    }
}

// Render expenses table
function renderExpensesTable(expenses) {
    var tbody = document.getElementById('expensesTableBody');
    var noExpenses = document.getElementById('noExpenses');
    var table = document.getElementById('expensesTable');
    
    if (expenses.length === 0) {
        if (table) table.classList.add('hidden');
        if (noExpenses) noExpenses.classList.remove('hidden');
        return;
    }
    
    if (table) table.classList.remove('hidden');
    if (noExpenses) noExpenses.classList.add('hidden');
    
    // Sort by date
    var sorted = expenses.slice().sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
    
    var html = sorted.map(function(expense) {
        var icon = getCategoryIcon(expense.category);
        var badgeClass = getBudgetType(expense.category) === 'Needs' ? 'badge-needs' : 
                        getBudgetType(expense.category) === 'Wants' ? 'badge-wants' : 'badge-savings';
        
        return '<tr>' +
            '<td><i class="' + icon + '"></i> <strong>' + expense.category + '</strong></td>' +
            '<td><span class="badge ' + badgeClass + '">' + expense.budgetType + '</span></td>' +
            '<td>' + formatCurrency(expense.amount) + '</td>' +
            '<td>' + formatDate(expense.date) + '</td>' +
            '<td><button class="btn btn-danger btn-sm" onclick="deleteExpenseAction(\'' + expense.id + '\')"><i class="fas fa-trash"></i></button></td>' +
        '</tr>';
    }).join('');
    
    if (tbody) tbody.innerHTML = html;
}

// Delete expense
window.deleteExpenseAction = function(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
        deleteExpenseLocal(id);
        showToast('Expense deleted');
        loadDashboardData();
        renderExpensesTable(currentExpenses);
    } catch (error) {
        showToast('Failed to delete', 'error');
    }
};

// Load deleted expenses
function loadDeletedExpenses() {
    deletedExpenses = getDeletedExpenses();
    renderDeletedTable();
}

// Render deleted table
function renderDeletedTable() {
    var tbody = document.getElementById('deletedTableBody');
    var noDeleted = document.getElementById('noDeleted');
    var table = document.getElementById('deletedTable');
    
    if (deletedExpenses.length === 0) {
        if (table) table.classList.add('hidden');
        if (noDeleted) noDeleted.classList.remove('hidden');
        return;
    }
    
    if (table) table.classList.remove('hidden');
    if (noDeleted) noDeleted.classList.add('hidden');
    
    var html = deletedExpenses.map(function(expense) {
        return '<tr>' +
            '<td>' + expense.category + '</td>' +
            '<td>' + formatCurrency(expense.amount) + '</td>' +
            '<td>' + formatDate(expense.deletedAt) + '</td>' +
            '<td><button class="btn btn-success btn-sm" onclick="restoreExpenseAction(\'' + expense.id + '\')"><i class="fas fa-undo"></i> Restore</button></td>' +
        '</tr>';
    }).join('');
    
    if (tbody) tbody.innerHTML = html;
}

// Restore expense
window.restoreExpenseAction = function(id) {
    try {
        restoreExpenseLocal(id);
        showToast('Expense restored');
        loadDeletedExpenses();
        loadDashboardData();
    } catch (error) {
        showToast('Failed to restore', 'error');
    }
};

// Search
function handleSearch(e) {
    var query = e.target.value.toLowerCase();
    var filtered = currentExpenses.filter(function(expense) {
        return expense.category.toLowerCase().includes(query) ||
               (expense.description && expense.description.toLowerCase().includes(query));
    });
    renderExpensesTable(filtered);
}

// Update spending personality
function updateSpendingPersonality() {
    var personality = analyzeSpendingPersonality();
    
    var typeEl = document.getElementById('personalityType');
    var descEl = document.getElementById('personalityDesc');
    var iconEl = document.getElementById('personalityIcon');
    
    if (typeEl) typeEl.textContent = personality.type;
    if (descEl) descEl.textContent = personality.description;
    if (iconEl) iconEl.innerHTML = '<i class="fas ' + personality.icon + '"></i>';
}

// Financial tip
function loadFinancialTip() {
    var tip = getFinancialTip();
    var tipText = document.getElementById('tipText');
    if (tipText) tipText.textContent = tip;
}

// Savings goals
function handleSavingsGoal(e) {
    e.preventDefault();
    
    var name = document.getElementById('goalName').value;
    var amount = document.getElementById('goalAmount').value;
    var deadline = document.getElementById('goalDeadline').value;
    
    if (!name || !amount) {
        showToast('Please fill required fields', 'error');
        return;
    }
    
    try {
        addSavingsGoal(name, amount, deadline);
        showToast('Savings goal created!');
        document.getElementById('savingsGoalForm').reset();
        renderSavingsGoals();
    } catch (error) {
        showToast(error.message || 'Failed to create goal', 'error');
    }
}

function renderSavingsGoals() {
    var goals = getSavingsGoals();
    var container = document.getElementById('goalsList');
    
    if (!container) return;
    
    if (goals.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-bullseye"></i><p>No savings goals yet</p></div>';
        return;
    }
    
    var html = goals.map(function(goal) {
        var progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
        var deadline = goal.deadline ? formatDate(goal.deadline) : 'No deadline';
        
        return '<div class="goal-card">' +
            '<div class="goal-header">' +
                '<div>' +
                    '<div class="goal-name">' + goal.name + '</div>' +
                    '<div class="goal-target">' + formatCurrency(goal.currentAmount) + ' / ' + formatCurrency(goal.targetAmount) + '</div>' +
                '</div>' +
                '<button class="btn btn-danger btn-sm" onclick="deleteGoal(\'' + goal.id + '\')"><i class="fas fa-trash"></i></button>' +
            '</div>' +
            '<div class="goal-progress">' +
                '<div class="goal-progress-bar"><div class="goal-progress-fill" style="width: ' + Math.min(progress, 100) + '%"></div></div>' +
                '<div class="goal-progress-text"><span>' + progress.toFixed(1) + '% saved</span><span>' + formatCurrency(goal.targetAmount - goal.currentAmount) + ' remaining</span></div>' +
            '</div>' +
            '<div class="goal-deadline"><i class="fas fa-calendar"></i> Target: ' + deadline + '</div>' +
            '<div class="goal-actions"><button class="btn btn-primary btn-sm" onclick="addToGoal(\'' + goal.id + '\')"><i class="fas fa-plus"></i> Add Savings</button></div>' +
        '</div>';
    }).join('');
    
    container.innerHTML = html;
}

window.deleteGoal = function(id) {
    if (!confirm('Delete this goal?')) return;
    deleteSavingsGoal(id);
    renderSavingsGoals();
    showToast('Goal deleted');
};

window.addToGoal = function(id) {
    var amount = prompt('Enter amount to add:');
    if (amount && parseFloat(amount) > 0) {
        updateSavingsGoal(id, parseFloat(amount));
        renderSavingsGoals();
        showToast('Savings added!');
        loadDashboardData();
    }
};

// Category limits
function renderCategoryLimits() {
    var limits = getCategoryLimits();
    var container = document.getElementById('limitInputs');
    if (!container) return;
    
    var categories = [
        { name: 'Groceries', icon: 'fa-shopping-basket' },
        { name: 'Dining Out', icon: 'fa-utensils' },
        { name: 'Entertainment', icon: 'fa-film' },
        { name: 'Shopping', icon: 'fa-shopping-bag' },
        { name: 'Transport', icon: 'fa-bus' },
        { name: 'Subscriptions', icon: 'fa-play-circle' },
        { name: 'Coffee', icon: 'fa-coffee' },
        { name: 'Personal Care', icon: 'fa-spa' }
    ];
    
    var html = categories.map(function(cat) {
        return '<div class="limit-input-group">' +
            '<i class="fas ' + cat.icon + '"></i>' +
            '<input type="number" placeholder="Limit for ' + cat.name + '" data-category="' + cat.name + '" value="' + (limits[cat.name] || '') + '" min="0">' +
        '</div>';
    }).join('');
    
    container.innerHTML = html;
}

function saveCategoryLimits() {
    var inputs = document.querySelectorAll('#limitInputs input');
    var limits = {};
    
    inputs.forEach(function(input) {
        if (input.value && parseFloat(input.value) > 0) {
            limits[input.dataset.category] = parseFloat(input.value);
        }
    });
    
    setCategoryLimits(limits);
    showToast('Category limits saved!');
}

// Insights
function renderInsights() {
    var insights = getSpendingInsights();
    
    var highestSpending = document.getElementById('highestSpending');
    var highestAmount = document.getElementById('highestAmount');
    var lowestSpending = document.getElementById('lowestSpending');
    var lowestAmount = document.getElementById('lowestAmount');
    var savingsRate = document.getElementById('savingsRate');
    var avgDaily = document.getElementById('avgDaily');
    
    if (highestSpending) highestSpending.textContent = insights.highestCategory || '-';
    if (highestAmount) highestAmount.textContent = formatCurrency(insights.highestAmount || 0);
    if (lowestSpending) lowestSpending.textContent = insights.lowestCategory || '-';
    if (lowestAmount) lowestAmount.textContent = formatCurrency(insights.lowestAmount || 0);
    if (savingsRate) savingsRate.textContent = (insights.savingsRate || 0) + '%';
    if (avgDaily) avgDaily.textContent = formatCurrency(insights.avgDaily || 0);
    
    // Suggestions
    var suggestions = getSuggestions();
    var suggestionsContainer = document.getElementById('suggestionsList');
    if (suggestionsContainer) {
        var html = suggestions.map(function(s) {
            return '<div class="suggestion-item"><i class="fas ' + s.icon + '"></i><p>' + s.text + '</p></div>';
        }).join('');
        suggestionsContainer.innerHTML = html;
    }
}

// Weekly report - ENHANCED
function renderWeeklyReport() {
    var report = getWeeklyReport();
    var container = document.getElementById('weeklyReport');
    if (!container) return;
    
    var categoryCount = Object.keys(report.byCategory).length;
    
    var html = '<div class="weekly-summary">' +
        '<div class="weekly-stat"><div class="weekly-stat-label">Total This Week</div><div class="weekly-stat-value">' + formatCurrency(report.total) + '</div></div>' +
        '<div class="weekly-stat"><div class="weekly-stat-label">Transactions</div><div class="weekly-stat-value">' + report.count + '</div></div>' +
        '<div class="weekly-stat"><div class="weekly-stat-label">🏠 Needs</div><div class="weekly-stat-value">' + formatCurrency(report.byType.needs) + '</div></div>' +
        '<div class="weekly-stat"><div class="weekly-stat-label">🎮 Wants</div><div class="weekly-stat-value">' + formatCurrency(report.byType.wants) + '</div></div>' +
    '</div>';
    
    if (categoryCount > 0) {
        html += '<div class="weekly-categories" style="margin-top: 25px;">';
        html += '<h4><i class="fas fa-chart-bar"></i> Spending by Category</h4>';
        
        var sortedCategories = Object.entries(report.byCategory).sort(function(a, b) { return b[1] - a[1]; });
        
        sortedCategories.forEach(function(entry) {
            var cat = entry[0];
            var amt = entry[1];
            var icon = getCategoryIcon(cat);
            var pct = report.total > 0 ? Math.round((amt / report.total) * 100) : 0;
            
            html += '<div class="category-row">' +
                '<span><i class="' + icon + '"></i> ' + cat + '</span>' +
                '<span><strong>' + formatCurrency(amt) + '</strong> (' + pct + '%)</span>' +
            '</div>';
        });
        
        html += '</div>';
    }
    
    // Monthly comparison
    var trends = getMonthlyTrends(2);
    if (trends.length >= 2) {
        var thisMonth = trends[trends.length - 1].total;
        var lastMonth = trends[trends.length - 2].total;
        var change = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;
        var changeIcon = change > 0 ? 'fa-arrow-up' : change < 0 ? 'fa-arrow-down' : 'fa-minus';
        var changeColor = change > 0 ? '#ef4444' : change < 0 ? '#10b981' : '#6b7280';
        
        html += '<div style="margin-top: 25px; padding: 15px; background: var(--primary-light); border-radius: 12px;">';
        html += '<h4><i class="fas fa-calendar-check"></i> vs Last Month</h4>';
        html += '<p style="margin-top: 10px; font-size: 1.1rem;">';
        html += '<i class="fas ' + changeIcon + '" style="color: ' + changeColor + ';"></i> ';
        html += 'This month: <strong>' + formatCurrency(thisMonth) + '</strong> vs last month: <strong>' + formatCurrency(lastMonth) + '</strong>';
        if (change !== 0) {
            html += ' (' + (change > 0 ? '+' : '') + change + '%)';
        }
        html += '</p></div>';
    }
    
    container.innerHTML = html;
}

// Theme grid rendering
function renderThemeGrid() {
    var container = document.getElementById('themeGrid');
    if (!container) return;
    
    var currentTheme = localStorage.getItem('smart_budget_theme') || 'light';
    
    var html = Object.keys(THEMES).map(function(themeKey) {
        var theme = THEMES[themeKey];
        var isActive = themeKey === currentTheme ? 'active' : '';
        
        return '<div class="theme-option ' + isActive + '" onclick="selectTheme(\'' + themeKey + '\')" style="cursor:pointer; padding:15px; border:2px solid ' + (isActive ? 'var(--primary-color)' : 'transparent') + '; border-radius:12px; text-align:center; background:var(--primary-light); margin:5px;">' +
            '<div style="width:40px; height:40px; background:' + theme.color + '; border-radius:50%; margin:0 auto 8px; border:2px solid white;"></div>' +
            '<span style="font-size:0.85rem; font-weight:500;">' + theme.name + '</span>' +
        '</div>';
    }).join('');
    
    container.innerHTML = html;
}

window.selectTheme = function(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('smart_budget_theme', themeName);
    renderThemeGrid();
    showToast('Theme changed to ' + THEMES[themeName].name + '!');
};

// Load settings values
function loadSettingsValues() {
    var user = JSON.parse(localStorage.getItem('smart_budget_current_user'));
    
    var settingsIncome = document.getElementById('settingsIncome');
    if (settingsIncome && user) {
        settingsIncome.value = user.monthlyIncome || '';
    }
}

// Save settings
function handleSaveSettings() {
    var income = document.getElementById('settingsIncome').value;
    var user = JSON.parse(localStorage.getItem('smart_budget_current_user'));
    
    if (user && income) {
        // Update user income
        var users = JSON.parse(localStorage.getItem('smart_budget_users') || '[]');
        var userIndex = users.findIndex(function(u) { return u.id === user.id; });
        
        if (userIndex !== -1) {
            users[userIndex].monthlyIncome = parseFloat(income);
            localStorage.setItem('smart_budget_users', JSON.stringify(users));
            
            user.monthlyIncome = parseFloat(income);
            localStorage.setItem('smart_budget_current_user', JSON.stringify(user));
        }
        
        showToast('Settings saved successfully!');
        loadDashboardData();
    } else {
        showToast('Please enter your monthly income', 'error');
    }
}

// Export/Import functions
function handleExportJSON() {
    try {
        var jsonContent = exportData();
        var timestamp = new Date().toISOString().split('T')[0];
        downloadJSON(jsonContent, 'smart_budget_backup_' + timestamp + '.json');
        showToast('Data exported successfully!');
    } catch (error) {
        showToast(error.message || 'Failed to export', 'error');
    }
}

function handleImportJSON(e) {
    var file = e.target.files[0];
    if (!file) return;
    
    var reader = new FileReader();
    reader.onload = function(event) {
        try {
            importData(event.target.result);
            showToast('Data imported successfully!');
            loadDashboardData();
            e.target.value = '';
        } catch (error) {
            showToast(error.message || 'Failed to import', 'error');
        }
    };
    reader.readAsText(file);
}

// Notepad
function loadExpenseNotepad() {
    var notepadElement = document.getElementById('expenseNotepad');
    if (!notepadElement) return;
    
    var user = JSON.parse(localStorage.getItem('smart_budget_current_user'));
    var expenses = getExpenses();
    var goals = getSavingsGoals();
    var summary = calculateBudgetSummary();
    
    if (!user) {
        notepadElement.textContent = 'Please login to view your expenses.';
        return;
    }
    
    if (expenses.length === 0 && goals.length === 0) {
        notepadElement.textContent = 'No expenses yet. Add some expenses first!';
        return;
    }
    
    var text = '📊 SMART BUDGET PLANNER - EXPENSE REPORT\n';
    text += '═══════════════════════════════════════════\n\n';
    text += '👤 User: ' + user.username + '\n';
    text += '📅 Date: ' + new Date().toLocaleString() + '\n';
    text += '💰 Monthly Income: ₹' + (user.monthlyIncome || 0).toLocaleString('en-IN') + '\n\n';
    
    text += '═══════════ SUMMARY ═══════════\n';
    text += '📈 Total: ₹' + (summary.total || 0).toLocaleString('en-IN') + '\n';
    text += '🏠 Needs: ₹' + (summary.needs || 0).toLocaleString('en-IN') + '\n';
    text += '🎮 Wants: ₹' + (summary.wants || 0).toLocaleString('en-IN') + '\n';
    text += '💎 Savings: ₹' + (summary.savings || 0).toLocaleString('en-IN') + '\n';
    text += '❤️ Health: ' + (summary.healthScore || 0) + '%\n\n';
    
    text += '═══════════ EXPENSES (' + expenses.length + ') ═══════════\n';
    
    expenses.forEach(function(e, i) {
        text += (i+1) + '. ' + e.category + ' | ' + e.budgetType + ' | ₹' + e.amount.toLocaleString('en-IN') + ' | ' + e.date + '\n';
    });
    
    if (goals.length > 0) {
        text += '\n═══════════ SAVINGS GOALS ═══════════\n';
        goals.forEach(function(g) {
            var progress = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
            text += '🎯 ' + g.name + ': ₹' + g.currentAmount.toLocaleString('en-IN') + '/₹' + g.targetAmount.toLocaleString('en-IN') + ' (' + progress + '%)\n';
        });
    }
    
    notepadElement.textContent = text;
}

function handleCopyNotepad() {
    var notepadElement = document.getElementById('expenseNotepad');
    if (!notepadElement) return;
    
    var text = notepadElement.textContent;
    navigator.clipboard.writeText(text).then(function() {
        showToast('Copied to clipboard! Paste anywhere.');
    }).catch(function() {
        showToast('Failed to copy', 'error');
    });
}

function handleDownloadText() {
    var notepadElement = document.getElementById('expenseNotepad');
    if (!notepadElement) return;
    
    var text = notepadElement.textContent;
    var timestamp = new Date().toISOString().split('T')[0];
    downloadTextFile(text, 'my_expenses_' + timestamp + '.txt');
    showToast('Text file downloaded!');
}

function downloadTextFile(content, filename) {
    var blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    var link = document.createElement('a');
    var url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Export to Word Document
function handleExportWord() {
    try {
        var user = JSON.parse(localStorage.getItem('smart_budget_current_user'));
        if (!user) {
            showToast('Please login first', 'error');
            return;
        }
        
        var expenses = getExpenses();
        var goals = getSavingsGoals();
        var summary = calculateBudgetSummary();
        
        // Create Word document content with HTML formatting
        var wordContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Smart Budget Planner Report</title></head><body>';
        
        // Header
        wordContent += '<h1 style="color:#059669;text-align:center;">📊 SMART BUDGET PLANNER</h1>';
        wordContent += '<p style="text-align:center;color:#666;">Expense Report</p>';
        wordContent += '<hr>';
        
        // User Info
        wordContent += '<h2>👤 User Information</h2>';
        wordContent += '<table border="0" style="border-collapse:collapse;width:100%;">';
        wordContent += '<tr><td style="padding:5px;"><strong>Name:</strong></td><td style="padding:5px;">' + user.username + '</td></tr>';
        wordContent += '<tr><td style="padding:5px;"><strong>Monthly Income:</strong></td><td style="padding:5px;">₹' + (user.monthlyIncome || 0).toLocaleString('en-IN') + '</td></tr>';
        wordContent += '<tr><td style="padding:5px;"><strong>Report Date:</strong></td><td style="padding:5px;">' + new Date().toLocaleDateString() + '</td></tr>';
        wordContent += '</table><br>';
        
        // Summary
        wordContent += '<h2>📈 Budget Summary</h2>';
        wordContent += '<table border="1" style="border-collapse:collapse;width:100%;border-color:#ddd;">';
        wordContent += '<tr style="background:#f5f5f5;"><th style="padding:8px;">Category</th><th style="padding:8px;">Amount (₹)</th></tr>';
        wordContent += '<tr><td style="padding:8px;">Total Expenses</td><td style="padding:8px;">' + (summary.total || 0).toLocaleString('en-IN') + '</td></tr>';
        wordContent += '<tr><td style="padding:8px;">🏠 Needs (50%)</td><td style="padding:8px;">' + (summary.needs || 0).toLocaleString('en-IN') + '</td></tr>';
        wordContent += '<tr><td style="padding:8px;">🎮 Wants (30%)</td><td style="padding:8px;">' + (summary.wants || 0).toLocaleString('en-IN') + '</td></tr>';
        wordContent += '<tr><td style="padding:8px;">💎 Savings (20%)</td><td style="padding:8px;">' + (summary.savings || 0).toLocaleString('en-IN') + '</td></tr>';
        wordContent += '<tr><td style="padding:8px;"><strong>Remaining Balance</strong></td><td style="padding:8px;"><strong>' + (summary.remainingBalance || 0).toLocaleString('en-IN') + '</strong></td></tr>';
        wordContent += '<tr><td style="padding:8px;">❤️ Health Score</td><td style="padding:8px;">' + (summary.healthScore || 0) + '%</td></tr>';
        wordContent += '</table><br>';
        
        // Expenses Table
        if (expenses.length > 0) {
            wordContent += '<h2>💰 Expense Details (' + expenses.length + ' items)</h2>';
            wordContent += '<table border="1" style="border-collapse:collapse;width:100%;border-color:#ddd;font-size:11px;">';
            wordContent += '<tr style="background:#059669;color:white;"><th style="padding:6px;">#</th><th style="padding:6px;">Category</th><th style="padding:6px;">Type</th><th style="padding:6px;">Amount (₹)</th><th style="padding:6px;">Date</th><th style="padding:6px;">Description</th></tr>';
            
            expenses.forEach(function(e, i) {
                var bgColor = i % 2 === 0 ? '#fff' : '#f9f9f9';
                wordContent += '<tr style="background:' + bgColor + ';">';
                wordContent += '<td style="padding:6px;">' + (i+1) + '</td>';
                wordContent += '<td style="padding:6px;">' + e.category + '</td>';
                wordContent += '<td style="padding:6px;">' + e.budgetType + '</td>';
                wordContent += '<td style="padding:6px;">' + e.amount.toLocaleString('en-IN') + '</td>';
                wordContent += '<td style="padding:6px;">' + e.date + '</td>';
                wordContent += '<td style="padding:6px;">' + (e.description || '-') + '</td>';
                wordContent += '</tr>';
            });
            wordContent += '</table><br>';
        }
        
        // Savings Goals
        if (goals.length > 0) {
            wordContent += '<h2>🎯 Savings Goals</h2>';
            wordContent += '<table border="1" style="border-collapse:collapse;width:100%;border-color:#ddd;">';
            wordContent += '<tr style="background:#f5f5f5;"><th style="padding:8px;">Goal Name</th><th style="padding:8px;">Target</th><th style="padding:8px;">Saved</th><th style="padding:8px;">Progress</th><th style="padding:8px;">Deadline</th></tr>';
            
            goals.forEach(function(g) {
                var progress = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
                wordContent += '<tr>';
                wordContent += '<td style="padding:8px;">' + g.name + '</td>';
                wordContent += '<td style="padding:8px;">₹' + g.targetAmount.toLocaleString('en-IN') + '</td>';
                wordContent += '<td style="padding:8px;">₹' + g.currentAmount.toLocaleString('en-IN') + '</td>';
                wordContent += '<td style="padding:8px;">' + progress + '%</td>';
                wordContent += '<td style="padding:8px;">' + (g.deadline || 'No deadline') + '</td>';
                wordContent += '</tr>';
            });
            wordContent += '</table><br>';
        }
        
        // Footer
        wordContent += '<hr>';
        wordContent += '<p style="text-align:center;color:#999;font-size:10px;">Generated from Smart Budget Planner App</p>';
        
        wordContent += '</body></html>';
        
        // Create blob and download
        var blob = new Blob([wordContent], { type: 'application/msword' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        var timestamp = new Date().toISOString().split('T')[0];
        link.download = 'SmartBudget_Report_' + timestamp + '.doc';
        link.click();
        
        showToast('Word document downloaded!');
    } catch (error) {
        showToast('Failed to export Word document', 'error');
        console.error(error);
    }
}

function handleExportCSV() {
    try {
        var csvContent = exportToCSV();
        var timestamp = new Date().toISOString().split('T')[0];
        downloadCSV(csvContent, 'expenses_' + timestamp + '.csv');
        showToast('CSV exported! Open in Excel.');
    } catch (error) {
        showToast(error.message || 'Failed to export CSV', 'error');
    }
}

function handleExportText() {
    try {
        var textContent = exportDataAsText();
        var timestamp = new Date().toISOString().split('T')[0];
        downloadTextFile(textContent, 'my_expenses_' + timestamp + '.txt');
        showToast('Text file downloaded!');
    } catch (error) {
        showToast(error.message || 'Failed to export', 'error');
    }
}

function handleImportCSV(e) {
    var file = e.target.files[0];
    if (!file) return;
    
    document.getElementById('importCSVFileName').textContent = file.name;
    
    var reader = new FileReader();
    reader.onload = function(event) {
        try {
            var csvContent = event.target.result;
            var lines = csvContent.split('\n');
            var importedCount = 0;
            
            for (var i = 1; i < lines.length; i++) {
                var line = lines[i].trim();
                if (!line) continue;
                
                var values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                if (values && values.length >= 3) {
                    var category = values[0].replace(/"/g, '').trim();
                    var amount = parseFloat(values[2].replace(/"/g, '').trim());
                    var date = values.length >= 4 ? values[3].replace(/"/g, '').trim() : getTodayDate();
                    
                    if (category && amount && !isNaN(amount)) {
                        addExpense(category, amount, date, '');
                        importedCount++;
                    }
                }
            }
            
            if (importedCount > 0) {
                showToast('Imported ' + importedCount + ' expenses!');
                loadDashboardData();
            } else {
                showToast('No valid expenses found', 'error');
            }
            
            e.target.value = '';
            document.getElementById('importCSVFileName').textContent = 'No file chosen';
        } catch (error) {
            showToast('Failed to import CSV', 'error');
        }
    };
    reader.readAsText(file);
}

function handleImportText(e) {
    var file = e.target.files[0];
    if (!file) return;
    
    document.getElementById('importTextFileName').textContent = file.name;
    
    var reader = new FileReader();
    reader.onload = function(event) {
        try {
            var text = event.target.result;
            showToast('Text file imported!');
            loadDashboardData();
            e.target.value = '';
            document.getElementById('importTextFileName').textContent = 'No file chosen';
        } catch (error) {
            showToast('Failed to import', 'error');
        }
    };
    reader.readAsText(file);
}

// Toast notification
function showToast(message, type) {
    type = type || 'success';
    var toast = document.getElementById('toast');
    var toastMessage = document.getElementById('toastMessage');
    var icon = toast ? toast.querySelector('i') : null;
    
    if (toastMessage) toastMessage.textContent = message;
    if (icon) {
        icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    }
    
    if (toast) {
        toast.classList.add('show');
        setTimeout(function() {
            toast.classList.remove('show');
        }, 3000);
    }
}

