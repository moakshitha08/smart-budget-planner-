// ============================================
// SMART BUDGET PLANNER - AUTH (Local Storage)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    if (isLoggedIn()) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Initialize theme
    initializeTheme();
    
    // Initialize event listeners
    initializeEventListeners();
});

function initializeTheme() {
    const theme = getTheme();
    applyTheme(theme);
}

function initializeEventListeners() {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });
            document.getElementById(tab === 'login' ? 'loginForm' : 'registerForm').classList.add('active');
            hideMessage();
        });
    });
    
    // Password toggle
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const input = btn.previousElementSibling;
            const icon = btn.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // Theme toggle
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            toggleTheme();
        });
    }
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', handleRegister);
}

function handleLogin(e) {
    e.preventDefault();
    hideMessage();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showMessage('Please fill in all fields');
        return;
    }
    
    try {
        loginUser(email, password);
        showMessage('Login successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 800);
    } catch (error) {
        showMessage(error.message);
    }
}

function handleRegister(e) {
    e.preventDefault();
    hideMessage();
    
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const monthlyIncome = document.getElementById('regIncome').value;
    
    if (!username || !email || !password) {
        showMessage('Please fill in all required fields');
        return;
    }
    
    if (username.length < 3) {
        showMessage('Username must be at least 3 characters');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters');
        return;
    }
    
    try {
        registerUser(username, email, password, monthlyIncome);
        
        // Auto-login after registration
        loginUser(email, password);
        showMessage('Account created! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 800);
    } catch (error) {
        showMessage(error.message);
    }
}

function showMessage(message, type = 'error') {
    const authMessage = document.getElementById('authMessage');
    authMessage.textContent = message;
    authMessage.className = `message ${type}`;
}

function hideMessage() {
    const authMessage = document.getElementById('authMessage');
    authMessage.className = 'message';
    authMessage.textContent = '';
}
