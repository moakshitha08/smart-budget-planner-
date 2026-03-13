const API_URL = 'http://localhost:3000/api';

// Toggle Password Visibility
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const type = field.type === 'password' ? 'text' : 'password';
    field.type = type;
    event.target.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
}

// Show Notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Handle Signup
async function handleSignup(e) {
    e.preventDefault();
    
    const formData = {
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value,
        monthlySalary: parseFloat(document.getElementById('monthlySalary').value)
    };
    
    const errorDiv = document.getElementById('errorMessage');
    
    // Frontend Validations
    if (!formData.fullName || !formData.email || !formData.username || !formData.password || !formData.monthlySalary) {
        errorDiv.textContent = 'All fields are required';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (formData.password !== formData.confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (formData.password.length < 6 || formData.password.length > 8) {
        errorDiv.textContent = 'Password must be between 6-8 characters';
        errorDiv.style.display = 'block';
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        errorDiv.textContent = 'Please enter a valid email address';
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Account created successfully! Redirecting to login...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            errorDiv.textContent = data.error || 'Registration failed';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
    }
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    
    const credentials = {
        emailOrUsername: document.getElementById('emailOrUsername').value.trim(),
        password: document.getElementById('password').value
    };
    
    const errorDiv = document.getElementById('errorMessage');
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showNotification('Login successful!', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            errorDiv.textContent = data.error || 'Invalid credentials';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
    }
}

// Check Authentication Status
function checkAuth() {
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname;
    
    const publicPages = ['/', '/index.html', '/login.html', '/signup.html'];
    const isPublicPage = publicPages.some(page => currentPage.includes(page) || currentPage === '/' || currentPage === '');
    
    if (!token && !isPublicPage) {
        window.location.href = 'login.html';
    } else if (token && isPublicPage && !currentPage.includes('dashboard')) {
        // Optional: redirect to dashboard if logged in
        // window.location.href = 'dashboard.html';
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Initialize
document.addEventListener('DOMContentLoaded', checkAuth);