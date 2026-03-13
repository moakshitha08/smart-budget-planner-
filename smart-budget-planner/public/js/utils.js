// ============================================
// SMART BUDGET PLANNER - UTILS (Local Storage)
// ============================================

// Storage keys
const STORAGE_KEYS = {
    USERS: 'smart_budget_users',
    CURRENT_USER: 'smart_budget_current_user',
    EXPENSES: 'smart_budget_expenses',
    THEME: 'smart_budget_theme',
    SAVINGS_GOALS: 'smart_budget_savings_goals',
    CATEGORY_LIMITS: 'smart_budget_category_limits',
    FINANCIAL_TIP_DATE: 'smart_budget_tip_date'
};

// Get data from local storage
function getFromStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// Save data to local storage
function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// ============================================
// USER MANAGEMENT (Local Storage)
// ============================================

// Get all users
function getUsers() {
    return getFromStorage(STORAGE_KEYS.USERS) || [];
}

// Save users
function saveUsers(users) {
    saveToStorage(STORAGE_KEYS.USERS, users);
}

// Register new user
function registerUser(username, email, password, monthlyIncome = 0) {
    const users = getUsers();
    
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('Email already registered');
    }
    
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        throw new Error('Username already taken');
    }
    
    const newUser = {
        id: generateId(),
        username,
        email: email.toLowerCase(),
        password: hashPassword(password),
        monthlyIncome: parseFloat(monthlyIncome) || 0,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
}

// Login user
function loginUser(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
        throw new Error('User not found');
    }
    
    if (user.password !== hashPassword(password)) {
        throw new Error('Invalid password');
    }
    
    const { password: _, ...userWithoutPassword } = user;
    saveToStorage(STORAGE_KEYS.CURRENT_USER, userWithoutPassword);
    
    return userWithoutPassword;
}

// Logout user
function logoutUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

// Get current user
function getCurrentUser() {
    return getFromStorage(STORAGE_KEYS.CURRENT_USER);
}

// Check if user is logged in
function isLoggedIn() {
    return getCurrentUser() !== null;
}

// Update user income
function updateUserIncome(userId, monthlyIncome) {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        throw new Error('User not found');
    }
    
    users[userIndex].monthlyIncome = parseFloat(monthlyIncome);
    saveUsers(users);
    
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
        currentUser.monthlyIncome = parseFloat(monthlyIncome);
        saveToStorage(STORAGE_KEYS.CURRENT_USER, currentUser);
    }
}

// ============================================
// EXPENSE MANAGEMENT (Local Storage)
// ============================================

// Get expenses for current user
function getExpenses() {
    const user = getCurrentUser();
    if (!user) return [];
    
    const allExpenses = getFromStorage(STORAGE_KEYS.EXPENSES) || [];
    return allExpenses.filter(e => e.userId === user.id && !e.isDeleted);
}

// Get deleted expenses
function getDeletedExpenses() {
    const user = getCurrentUser();
    if (!user) return [];
    
    const allExpenses = getFromStorage(STORAGE_KEYS.EXPENSES) || [];
    return allExpenses.filter(e => e.userId === user.id && e.isDeleted);
}

// Get all expenses
function getAllExpenses() {
    const user = getCurrentUser();
    if (!user) return [];
    
    const allExpenses = getFromStorage(STORAGE_KEYS.EXPENSES) || [];
    return allExpenses.filter(e => e.userId === user.id);
}

// Add expense
function addExpense(category, amount, date, description = '') {
    const user = getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    const allExpenses = getFromStorage(STORAGE_KEYS.EXPENSES) || [];
    
    const existingExpense = allExpenses.find(
        e => e.userId === user.id && 
             e.category === category && 
             !e.isDeleted
    );
    
    if (existingExpense) {
        const oldAmount = existingExpense.amount;
        existingExpense.amount += parseFloat(amount);
        existingExpense.updatedAt = new Date().toISOString();
        saveToStorage(STORAGE_KEYS.EXPENSES, allExpenses);
        return { aggregated: true, category, totalAmount: existingExpense.amount, oldAmount };
    } else {
        const newExpense = {
            id: generateId(),
            userId: user.id,
            category,
            amount: parseFloat(amount),
            date,
            description,
            budgetType: getBudgetType(category),
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        allExpenses.push(newExpense);
        saveToStorage(STORAGE_KEYS.EXPENSES, allExpenses);
        return { aggregated: false, category, totalAmount: parseFloat(amount) };
    }
}

// Delete expense
function deleteExpenseLocal(id) {
    const user = getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    const allExpenses = getFromStorage(STORAGE_KEYS.EXPENSES) || [];
    const expenseIndex = allExpenses.findIndex(e => e.id === id && e.userId === user.id);
    
    if (expenseIndex === -1) {
        throw new Error('Expense not found');
    }
    
    allExpenses[expenseIndex].isDeleted = true;
    allExpenses[expenseIndex].deletedAt = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.EXPENSES, allExpenses);
}

// Restore expense
function restoreExpenseLocal(id) {
    const user = getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    const allExpenses = getFromStorage(STORAGE_KEYS.EXPENSES) || [];
    const expenseIndex = allExpenses.findIndex(e => e.id === id && e.userId === user.id);
    
    if (expenseIndex === -1) {
        throw new Error('Expense not found');
    }
    
    allExpenses[expenseIndex].isDeleted = false;
    allExpenses[expenseIndex].deletedAt = null;
    allExpenses[expenseIndex].updatedAt = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.EXPENSES, allExpenses);
}

// ============================================
// SAVINGS GOALS
// ============================================

function getSavingsGoals() {
    const user = getCurrentUser();
    if (!user) return [];
    
    const goals = getFromStorage(STORAGE_KEYS.SAVINGS_GOALS) || [];
    return goals.filter(g => g.userId === user.id);
}

function addSavingsGoal(name, targetAmount, deadline) {
    const user = getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    const goals = getFromStorage(STORAGE_KEYS.SAVINGS_GOALS) || [];
    
    const newGoal = {
        id: generateId(),
        userId: user.id,
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: 0,
        deadline,
        createdAt: new Date().toISOString()
    };
    
    goals.push(newGoal);
    saveToStorage(STORAGE_KEYS.SAVINGS_GOALS, goals);
    return newGoal;
}

function updateSavingsGoal(id, amount) {
    const user = getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    const goals = getFromStorage(STORAGE_KEYS.SAVINGS_GOALS) || [];
    const goalIndex = goals.findIndex(g => g.id === id && g.userId === user.id);
    
    if (goalIndex === -1) {
        throw new Error('Goal not found');
    }
    
    goals[goalIndex].currentAmount += parseFloat(amount);
    saveToStorage(STORAGE_KEYS.SAVINGS_GOALS, goals);
}

function deleteSavingsGoal(id) {
    const user = getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    const goals = getFromStorage(STORAGE_KEYS.SAVINGS_GOALS) || [];
    const filteredGoals = goals.filter(g => !(g.id === id && g.userId === user.id));
    saveToStorage(STORAGE_KEYS.SAVINGS_GOALS, filteredGoals);
}

// ============================================
// CATEGORY BUDGET LIMITS
// ============================================

function getCategoryLimits() {
    const user = getCurrentUser();
    if (!user) return {};
    
    const limits = getFromStorage(STORAGE_KEYS.CATEGORY_LIMITS) || {};
    return limits[user.id] || {};
}

function setCategoryLimit(category, limit) {
    const user = getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    const limits = getFromStorage(STORAGE_KEYS.CATEGORY_LIMITS) || {};
    if (!limits[user.id]) {
        limits[user.id] = {};
    }
    limits[user.id][category] = parseFloat(limit);
    saveToStorage(STORAGE_KEYS.CATEGORY_LIMITS, limits);
}

function setCategoryLimits(limitsObj) {
    const user = getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    const limits = getFromStorage(STORAGE_KEYS.CATEGORY_LIMITS) || {};
    limits[user.id] = limitsObj;
    saveToStorage(STORAGE_KEYS.CATEGORY_LIMITS, limits);
}

// ============================================
// BUDGET CALCULATIONS
// ============================================

function calculateBudgetSummary() {
    const user = getCurrentUser();
    if (!user) return null;
    
    const expenses = getExpenses();
    const monthlyIncome = user.monthlyIncome || 0;
    
    let needs = 0;
    let wants = 0;
    let savings = 0;
    const categories = {};
    
    expenses.forEach(expense => {
        const type = expense.budgetType;
        const amount = expense.amount;
        
        if (type === 'Needs') {
            needs += amount;
        } else if (type === 'Wants') {
            wants += amount;
        } else {
            savings += amount;
        }
        
        if (!categories[expense.category]) {
            categories[expense.category] = 0;
        }
        categories[expense.category] += amount;
    });
    
    const total = needs + wants + savings;
    const remainingBalance = Math.max(0, monthlyIncome - total);
    
    const needsPercentage = monthlyIncome > 0 ? (needs / (monthlyIncome * 0.5)) * 100 : 0;
    const wantsPercentage = monthlyIncome > 0 ? (wants / (monthlyIncome * 0.3)) * 100 : 0;
    const savingsPercentage = monthlyIncome > 0 ? (savings / (monthlyIncome * 0.2)) * 100 : 0;
    
    const budgetAlert = monthlyIncome > 0 && total >= (monthlyIncome * 0.9);
    const healthScore = calculateBudgetHealthScore(needsPercentage, wantsPercentage, savingsPercentage);
    
    return {
        needs,
        wants,
        savings,
        total,
        monthlyIncome,
        remainingBalance,
        categories,
        needsPercentage: Math.min(needsPercentage, 100),
        wantsPercentage: Math.min(wantsPercentage, 100),
        savingsPercentage: Math.min(savingsPercentage, 100),
        budgetAlert,
        healthScore
    };
}

function calculateBudgetHealthScore(needsPct, wantsPct, savingsPct) {
    let score = 100;
    
    if (needsPct > 50) {
        score -= (needsPct - 50) * 2;
    }
    
    if (wantsPct > 30) {
        score -= (wantsPct - 30) * 3;
    }
    
    if (savingsPct >= 20) {
        score += (savingsPct - 20);
    } else if (savingsPct < 10) {
        score -= 20;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
}

function getHealthStatus(score) {
    if (score >= 80) return { status: 'Excellent', class: '' };
    if (score >= 60) return { status: 'Good', class: 'warning' };
    return { status: 'Needs Improvement', class: 'danger' };
}

// ============================================
// SPENDING PERSONALITY
// ============================================

function analyzeSpendingPersonality() {
    const summary = calculateBudgetSummary();
    if (!summary || summary.total === 0) {
        return {
            type: 'Analyzer',
            icon: 'fa-user-clock',
            description: 'Start adding expenses to discover your spending pattern.'
        };
    }
    
    const savingsRate = summary.monthlyIncome > 0 ? (summary.savings / summary.monthlyIncome) * 100 : 0;
    const wantsRate = summary.monthlyIncome > 0 ? (summary.wants / summary.monthlyIncome) * 100 : 0;
    
    if (savingsRate >= 20 && wantsRate <= 20) {
        return { type: 'Saver', icon: 'fa-hand-holding-usd', description: 'Great job! You are saving well.' };
    } else if (savingsRate >= 10 && wantsRate <= 30) {
        return { type: 'Balanced Spender', icon: 'fa-balance-scale', description: 'You have a good balance.' };
    } else if (wantsRate > 40) {
        return { type: 'High Spender', icon: 'fa-shopping-cart', description: 'Reduce wants to build savings.' };
    } else {
        return { type: 'Moderate Spender', icon: 'fa-sliders-h', description: 'Consider increasing savings.' };
    }
}

// ============================================
// INSIGHTS
// ============================================

function getSpendingInsights() {
    const summary = calculateBudgetSummary();
    if (!summary) return {};
    
    const categories = summary.categories;
    const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    
    const highest = sorted[0] || ['-', 0];
    const lowest = sorted[sorted.length - 1] || ['-', 0];
    
    const savingsRate = summary.monthlyIncome > 0 ? ((summary.savings / summary.monthlyIncome) * 100).toFixed(1) : 0;
    
    const today = new Date();
    const dayOfMonth = today.getDate();
    const avgDaily = summary.total > 0 ? (summary.total / dayOfMonth).toFixed(0) : 0;
    
    return {
        highestCategory: highest[0],
        highestAmount: highest[1],
        lowestCategory: lowest[0],
        lowestAmount: lowest[1],
        savingsRate,
        avgDaily
    };
}

function getSuggestions() {
    const summary = calculateBudgetSummary();
    const insights = getSpendingInsights();
    const suggestions = [];
    
    if (!summary || summary.monthlyIncome === 0) {
        suggestions.push({ icon: 'fa-money-bill-wave', text: 'Set your monthly income to enable budget tracking.' });
        return suggestions;
    }
    
    if (insights.savingsRate < 20) {
        suggestions.push({ icon: 'fa-piggy-bank', text: 'Try to save at least 20% of your income.' });
    }
    
    if (summary.wantsPercentage > 30) {
        suggestions.push({ icon: 'fa-cut', text: 'Your wants expenses are high. Consider reducing.' });
    }
    
    if (summary.needsPercentage > 50) {
        suggestions.push({ icon: 'fa-search-dollar', text: 'Your needs are exceeding 50%.' });
    }
    
    if (suggestions.length === 0) {
        suggestions.push({ icon: 'fa-star', text: 'Great job! Your budget is well balanced.' });
    }
    
    return suggestions;
}

// ============================================
// WEEKLY REPORT
// ============================================

function getWeeklyReport() {
    const expenses = getExpenses();
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    const weeklyExpenses = expenses.filter(e => new Date(e.date) >= weekAgo);
    
    let total = 0;
    const byCategory = {};
    
    weeklyExpenses.forEach(expense => {
        total += expense.amount;
        if (!byCategory[expense.category]) {
            byCategory[expense.category] = 0;
        }
        byCategory[expense.category] += expense.amount;
    });
    
    const byType = { needs: 0, wants: 0, savings: 0 };
    weeklyExpenses.forEach(expense => {
        const type = expense.budgetType.toLowerCase();
        if (byType[type] !== undefined) {
            byType[type] += expense.amount;
        }
    });
    
    return {
        total,
        byCategory,
        byType,
        count: weeklyExpenses.length,
        startDate: weekAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
    };
}

// ============================================
// MONTHLY TRENDS
// ============================================

function getMonthlyTrends(months = 6) {
    const expenses = getExpenses();
    const trends = [];
    const today = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthExpenses = expenses.filter(e => {
            const expDate = new Date(e.date);
            return expDate.getMonth() === date.getMonth() && expDate.getFullYear() === date.getFullYear();
        });
        
        const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
        
        trends.push({
            month: date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
            total,
            needs: monthExpenses.filter(e => e.budgetType === 'Needs').reduce((s, e) => s + e.amount, 0),
            wants: monthExpenses.filter(e => e.budgetType === 'Wants').reduce((s, e) => s + e.amount, 0),
            savings: monthExpenses.filter(e => e.budgetType === 'Savings').reduce((s, e) => s + e.amount, 0)
        });
    }
    
    return trends;
}

// ============================================
// HEATMAP DATA
// ============================================

function getHeatmapData() {
    const expenses = getExpenses();
    const heatmap = {};
    
    expenses.forEach(expense => {
        const date = expense.date;
        if (!heatmap[date]) {
            heatmap[date] = 0;
        }
        heatmap[date] += expense.amount;
    });
    
    return heatmap;
}

// ============================================
// FINANCIAL TIPS
// ============================================

const FINANCIAL_TIPS = [
    "Start paying yourself first - set aside savings before spending.",
    "The 50-30-20 rule: 50% for needs, 30% for wants, 20% for savings.",
    "Track every expense for a month to understand where your money goes.",
    "Automate your savings to make saving effortless.",
    "Avoid impulse purchases by waiting 24 hours before buying.",
    "Cook at home more often - it's healthier and cheaper.",
    "Cancel subscriptions you don't use regularly.",
    "Build an emergency fund covering 3-6 months of expenses.",
    "Pay off high-interest debt first.",
    "Set specific financial goals with deadlines."
];

function getFinancialTip() {
    const today = new Date().toISOString().split('T')[0];
    const savedDate = getFromStorage(STORAGE_KEYS.FINANCIAL_TIP_DATE);
    
    let tip;
    if (savedDate === today) {
        const dayNum = new Date(today).getDate();
        tip = FINANCIAL_TIPS[dayNum % FINANCIAL_TIPS.length];
    } else {
        tip = FINANCIAL_TIPS[Math.floor(Math.random() * FINANCIAL_TIPS.length)];
        saveToStorage(STORAGE_KEYS.FINANCIAL_TIP_DATE, today);
    }
    
    return tip;
}

// ============================================
// THEME MANAGEMENT
// ============================================

// Available themes
const THEMES = {
    light: { name: 'Light', icon: 'fa-sun', color: '#f8f9fa' },
    dark: { name: 'Dark', icon: 'fa-moon', color: '#1a1a2e' },
    ocean: { name: 'Ocean Blue', icon: 'fa-water', color: '#0077b6' },
    forest: { name: 'Forest Green', icon: 'fa-tree', color: '#2d6a4f' },
    sunset: { name: 'Sunset', icon: 'fa-sunrise', color: '#f4a261' },
    purple: { name: 'Purple Night', icon: 'fa-moon', color: '#7b2cbf' },
    rose: { name: 'Rose', icon: 'fa-spa', color: '#e63946' },
    mint: { name: 'Mint Fresh', icon: 'fa-leaf', color: '#06d6a0' }
};

function getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
}

function saveTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
    
    // Update theme toggle button icon
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        const themeIcon = themeBtn.querySelector('i');
        if (THEMES[theme]) {
            themeIcon.className = 'fas ' + THEMES[theme].icon;
        }
    }
}

function toggleTheme() {
    const currentTheme = getTheme();
    const themeKeys = Object.keys(THEMES);
    const currentIndex = themeKeys.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    const newTheme = themeKeys[nextIndex];
    applyTheme(newTheme);
    return newTheme;
}

function setTheme(themeName) {
    if (THEMES[themeName]) {
        applyTheme(themeName);
        return true;
    }
    return false;
}

function getAllThemes() {
    return THEMES;
}

function checkBudgetTheme() {
    const summary = calculateBudgetSummary();
    if (summary && summary.budgetAlert) {
        document.documentElement.setAttribute('data-budget', 'danger');
    } else {
        document.documentElement.removeAttribute('data-budget');
    }
}

// ============================================
// SETTINGS MANAGEMENT
// ============================================

const SETTINGS_KEYS = {
    CURRENCY: 'smart_budget_currency',
    DATE_FORMAT: 'smart_budget_date_format',
    NOTIFICATIONS: 'smart_budget_notifications',
    AUTO_BACKUP: 'smart_budget_auto_backup',
    LANGUAGE: 'smart_budget_language'
};

// Default settings
const DEFAULT_SETTINGS = {
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    notifications: true,
    autoBackup: false,
    language: 'en'
};

function getSettings() {
    const saved = getFromStorage('smart_budget_settings');
    return { ...DEFAULT_SETTINGS, ...saved };
}

function saveSettings(settings) {
    saveToStorage('smart_budget_settings', settings);
}

function updateSetting(key, value) {
    const settings = getSettings();
    settings[key] = value;
    saveSettings(settings);
}

function getCurrency() {
    return getSettings().currency || 'INR';
}

function getDateFormat() {
    return getSettings().dateFormat || 'DD/MM/YYYY';
}

function formatCurrencyWithSettings(amount) {
    const currency = getCurrency();
    const formats = {
        'INR': { style: 'currency', currency: 'INR' },
        'USD': { style: 'currency', currency: 'USD' },
        'EUR': { style: 'currency', currency: 'EUR' },
        'GBP': { style: 'currency', currency: 'GBP' }
    };
    const format = formats[currency] || formats['INR'];
    return new Intl.NumberFormat('en-IN', {
        ...format,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// ============================================
// EXPORT/IMPORT FUNCTIONS
// ============================================

function exportToCSV() {
    const expenses = getExpenses();
    if (expenses.length === 0) {
        throw new Error('No expenses to export');
    }
    
    const headers = ['Category', 'Budget Type', 'Amount', 'Date', 'Description'];
    const rows = expenses.map(e => [e.category, e.budgetType, e.amount, e.date, e.description || '']);
    
    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => '"' + cell + '"').join(','))
        .join('\n');
    
    return csvContent;
}

function exportData() {
    const user = getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    return JSON.stringify({
        user: { id: user.id, username: user.username, email: user.email, monthlyIncome: user.monthlyIncome },
        expenses: getExpenses(),
        deletedExpenses: getDeletedExpenses(),
        savingsGoals: getSavingsGoals(),
        categoryLimits: getCategoryLimits(),
        exportDate: new Date().toISOString()
    }, null, 2);
}

// Mobile-friendly text export
function exportDataAsText() {
    const user = getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    const expenses = getExpenses();
    const goals = getSavingsGoals();
    const summary = calculateBudgetSummary();
    
    var text = "SMART BUDGET PLANNER - BACKUP DATA\n";
    text += "=====================================\n\n";
    text += "Generated: " + new Date().toLocaleString() + "\n";
    text += "User: " + user.username + "\n";
    text += "Monthly Income: Rs." + (user.monthlyIncome || 0).toLocaleString('en-IN') + "\n\n";
    
    text += "--- SUMMARY ---\n";
    text += "Total Expenses: Rs." + (summary.total || 0).toLocaleString('en-IN') + "\n";
    text += "Needs: Rs." + (summary.needs || 0).toLocaleString('en-IN') + "\n";
    text += "Wants: Rs." + (summary.wants || 0).toLocaleString('en-IN') + "\n";
    text += "Savings: Rs." + (summary.savings || 0).toLocaleString('en-IN') + "\n";
    text += "Remaining Balance: Rs." + (summary.remainingBalance || 0).toLocaleString('en-IN') + "\n";
    text += "Budget Health Score: " + (summary.healthScore || 0) + "%\n\n";
    
    text += "--- EXPENSES (" + expenses.length + " items) ---\n";
    expenses.forEach(function(e, i) {
        text += (i+1) + ". " + e.category + " | " + e.budgetType + " | Rs." + e.amount.toLocaleString('en-IN') + " | " + e.date;
        if (e.description) text += " | " + e.description;
        text += "\n";
    });
    
    if (goals.length > 0) {
        text += "\n--- SAVINGS GOALS ---\n";
        goals.forEach(function(g) {
            text += g.name + ": Rs." + g.currentAmount.toLocaleString('en-IN') + " / Rs." + g.targetAmount.toLocaleString('en-IN');
            if (g.deadline) text += " (Deadline: " + g.deadline + ")";
            text += "\n";
        });
    }
    
    return text;
}

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    } else {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return Promise.resolve();
    }
}

function importData(jsonData) {
    const data = JSON.parse(jsonData);
    const user = getCurrentUser();
    
    if (!user) throw new Error('User not logged in');
    
    const allExpenses = getFromStorage(STORAGE_KEYS.EXPENSES) || [];
    const otherExpenses = allExpenses.filter(e => e.userId !== user.id);
    
    if (data.expenses) {
        const importedExpenses = data.expenses.map(e => ({
            ...e,
            id: generateId(),
            userId: user.id
        }));
        saveToStorage(STORAGE_KEYS.EXPENSES, [...otherExpenses, ...importedExpenses]);
    }
    
    if (data.savingsGoals) {
        const goals = getFromStorage(STORAGE_KEYS.SAVINGS_GOALS) || [];
        const otherGoals = goals.filter(g => g.userId !== user.id);
        const importedGoals = data.savingsGoals.map(g => ({
            ...g,
            id: generateId(),
            userId: user.id
        }));
        saveToStorage(STORAGE_KEYS.SAVINGS_GOALS, [...otherGoals, ...importedGoals]);
    }
    
    if (data.categoryLimits) {
        const limits = getFromStorage(STORAGE_KEYS.CATEGORY_LIMITS) || {};
        limits[user.id] = data.categoryLimits;
        saveToStorage(STORAGE_KEYS.CATEGORY_LIMITS, limits);
    }
    
    if (data.user && data.user.monthlyIncome) {
        updateUserIncome(user.id, data.user.monthlyIncome);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

function getBudgetType(category) {
    const needs = ['Rent/Mortgage', 'Utilities', 'Groceries', 'Insurance', 'Healthcare', 'Transportation', 'Debt Payments', 'Phone/Internet'];
    const wants = ['Dining Out', 'Entertainment', 'Shopping', 'Hobbies', 'Travel', 'Subscriptions', 'Personal Care', 'Coffee'];
    
    if (needs.includes(category)) return 'Needs';
    if (wants.includes(category)) return 'Wants';
    return 'Savings';
}

function getCategoryIcon(category) {
    const icons = {
        'Rent/Mortgage': 'fa-home', 'Utilities': 'fa-lightbulb', 'Groceries': 'fa-shopping-basket',
        'Insurance': 'fa-shield-alt', 'Healthcare': 'fa-hospital', 'Transportation': 'fa-bus',
        'Debt Payments': 'fa-credit-card', 'Phone/Internet': 'fa-mobile-alt', 'Dining Out': 'fa-utensils',
        'Entertainment': 'fa-film', 'Shopping': 'fa-shopping-bag', 'Hobbies': 'fa-palette',
        'Travel': 'fa-plane', 'Subscriptions': 'fa-play-circle', 'Personal Care': 'fa-spa',
        'Coffee': 'fa-coffee', 'Emergency Fund': 'fa-umbrella', 'Retirement': 'fa-sun',
        'Investments': 'fa-chart-line', 'Education': 'fa-graduation-cap', 'Major Purchases': 'fa-trophy'
    };
    return icons[category] || 'fa-tag';
}

function getCategoryBadgeClass(category) {
    const type = getBudgetType(category);
    if (type === 'Needs') return 'badge-needs';
    if (type === 'Wants') return 'badge-wants';
    return 'badge-savings';
}

function showToast(message, type) {
    type = type || 'success';
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const icon = toast.querySelector('i');
    
    toastMessage.textContent = message;
    icon.className = type === 'success' ? 'fas fa-check-circle' : 
                     type === 'error' ? 'fas fa-exclamation-circle' : 
                     'fas fa-info-circle';
    
    toast.classList.add('show');
    
    setTimeout(function() {
        toast.classList.remove('show');
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction() {
        const later = function() {
            clearTimeout(timeout);
            func.apply(this, arguments);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function confirmDialog(message) {
    return new Promise(function(resolve) {
        const result = confirm(message);
        resolve(result);
    });
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function downloadJSON(jsonContent, filename) {
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Download as Text file (for Notepad/Word)
function downloadAsText(textContent, filename) {
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Import data from text file
function importFromText(textContent) {
    const lines = textContent.split('\n');
    const expenses = [];
    const goals = [];
    let currentSection = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Detect section headers
        if (line.includes('EXPENSES') || line.includes('expenses')) {
            currentSection = 'expenses';
            continue;
        }
        if (line.includes('SAVINGS GOALS') || line.includes('savings goals')) {
            currentSection = 'goals';
            continue;
        }
        
        // Parse expense lines (format: Category | Type | Amount | Date | Description)
        if (currentSection === 'expenses' && line.includes('|')) {
            const parts = line.split('|').map(p => p.trim());
            if (parts.length >= 4) {
                const category = parts[0];
                const budgetType = parts[1];
                const amountStr = parts[2].replace(/[Rs.,\s]/g, '');
                const amount = parseFloat(amountStr) || 0;
                const date = parts[3] || getTodayDate();
                const description = parts[4] || '';
                
                if (category && amount > 0) {
                    expenses.push({ category, budgetType, amount, date, description });
                }
            }
        }
    }
    
    return { expenses, goals };
}

// Get formatted expenses for notepad display
function getExpensesAsText() {
    const user = getCurrentUser();
    if (!user) throw new Error('User not logged in');
    
    const expenses = getExpenses();
    const goals = getSavingsGoals();
    const summary = calculateBudgetSummary();
    
    let text = "📊 SMART BUDGET PLANNER - EXPENSE REPORT\n";
    text += "═══════════════════════════════════════════\n\n";
    text += "Generated: " + new Date().toLocaleString() + "\n";
    text += "User: " + user.username + "\n";
    text += "Monthly Income: Rs." + (user.monthlyIncome || 0).toLocaleString('en-IN') + "\n\n";
    
    text += "═══════════ SUMMARY ═══════════\n";
    text += "Total Expenses: Rs." + (summary.total || 0).toLocaleString('en-IN') + "\n";
    text += "Needs (50%):    Rs." + (summary.needs || 0).toLocaleString('en-IN') + "\n";
    text += "Wants (30%):    Rs." + (summary.wants || 0).toLocaleString('en-IN') + "\n";
    text += "Savings (20%):  Rs." + (summary.savings || 0).toLocaleString('en-IN') + "\n";
    text += "Balance:        Rs." + (summary.remainingBalance || 0).toLocaleString('en-IN') + "\n";
    text += "Health Score:  " + (summary.healthScore || 0) + "%\n\n";
    
    text += "═══════════ EXPENSES (" + expenses.length + " items) ═══════════\n";
    text += "Category          | Type    | Amount       | Date\n";
    text += "──────────────────┼─────────┼──────────────┼────────────\n";
    
    expenses.forEach(function(e) {
        const cat = (e.category || '').padEnd(17).substring(0, 17);
        const type = (e.budgetType || '').padEnd(8).substring(0, 8);
        const amt = "Rs." + (e.amount || 0).toLocaleString('en-IN').padStart(10);
        const date = e.date || '';
        text += cat + " | " + type + " | " + amt + " | " + date + "\n";
    });
    
    if (goals.length > 0) {
        text += "\n═══════════ SAVINGS GOALS ═══════════\n";
        goals.forEach(function(g) {
            text += "• " + g.name + ": Rs." + (g.currentAmount || 0).toLocaleString('en-IN') + 
                    " / Rs." + (g.targetAmount || 0).toLocaleString('en-IN');
            if (g.deadline) text += " (Target: " + g.deadline + ")";
            text += "\n";
        });
    }
    
    text += "\n═══════════════════════════════════════════\n";
    text += "Copied from Smart Budget Planner App\n";
    
    return text;
}

function animateCounter(element, target, prefix, suffix) {
    prefix = prefix || 'Rs.';
    suffix = suffix || '';
    const duration = 1000;
    const start = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * easeOut);
        
        element.textContent = prefix + current.toLocaleString('en-IN') + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

function checkCategoryLimitExceeded(category) {
    const limits = getCategoryLimits();
    if (!limits[category]) return false;
    
    const expenses = getExpenses();
    const total = expenses
        .filter(function(e) { return e.category === category; })
        .reduce(function(sum, e) { return sum + e.amount; }, 0);
    
    return total > limits[category];
}

function getExceededCategories() {
    const limits = getCategoryLimits();
    const exceeded = [];
    
    Object.keys(limits).forEach(function(category) {
        if (checkCategoryLimitExceeded(category)) {
            exceeded.push(category);
        }
    });
    
    return exceeded;
}

