// src/js/main.js

export function showMessage(element, message, type) {
    if (element) {
        element.textContent = message;
        element.className = `message ${type}`;
        element.classList.remove('u-hidden');
        setTimeout(() => {
            element.classList.add('u-hidden');
        }, 5000);
    }
}

export function hideMessage(element) {
    if (element) {
        element.classList.add('u-hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const contrastModeToggle = document.getElementById('contrastModeToggle');
    const toggleContrastBtn = document.getElementById('toggleContrastBtn');
    const body = document.body;

    const savedContrastMode = localStorage.getItem('contrastMode');
    if (savedContrastMode === 'enabled') {
        body.classList.add('contrast-mode');
    }

    function toggleContrastMode() {
        body.classList.toggle('contrast-mode');
        if (body.classList.contains('contrast-mode')) {
            localStorage.setItem('contrastMode', 'enabled');
        } else {
            localStorage.setItem('contrastMode', 'disabled');
        }
    }

    if (contrastModeToggle) {
        contrastModeToggle.addEventListener('click', toggleContrastMode);
    }
    if (toggleContrastBtn) {
        toggleContrastBtn.addEventListener('click', toggleContrastMode);
    }

    const navbarToggler = document.querySelector('.navbar-toggler');
    const navLinks = document.querySelector('.nav-links');

    if (navbarToggler && navLinks) {
        navbarToggler.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            navbarToggler.classList.toggle('active');
        });
    }

    const protectedPages = ['index.html', 'deposit.html', 'withdraw.html', 'transfer.html', 'buy-assets.html', 'reports.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (protectedPages.includes(currentPage)) {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            window.location.href = 'login.html';
        } else {
            const userName = localStorage.getItem('user_name');
            if (userName) {
                const userNameElement = document.getElementById('userName');
                if (userNameElement) {
                    userNameElement.textContent = `Olá, ${userName}!`;
                }
            }
        }
    }

    window.formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };
});