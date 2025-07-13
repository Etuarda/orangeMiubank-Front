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

export function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}


document.addEventListener('DOMContentLoaded', () => {
    // --- Lógica de Alto Contraste ---
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

    // --- Lógica da Navbar Responsiva ---
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navLinks = document.querySelector('.nav-links');

    if (navbarToggler && navLinks) {
        navbarToggler.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            navbarToggler.classList.toggle('active');
        });
    }

    // --- Lógica do Botão Sair (Logout) ---
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', (event) => {
            event.preventDefault(); // Previne o comportamento padrão do link
            localStorage.removeItem('jwt_token'); // Remove o token
            localStorage.removeItem('user_name'); // Remove o nome do usuário
            window.location.href = 'login.html'; // Redireciona para a página de login
        });
    }

    // --- Verificação de Autenticação para páginas protegidas ---
    const protectedPages = ['index.html', 'deposit.html', 'withdraw.html', 'transfer.html', 'buy-assets.html', 'reports.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (protectedPages.includes(currentPage)) {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            console.log('Token não encontrado ou expirado. Redirecionando para login.');
            window.location.href = 'login.html';
        } else {
            // Opcional: Você pode adicionar uma validação de token no backend aqui
            // para verificar se ele é válido, não apenas se existe.
            // Por enquanto, a simples existência já permite o acesso.
            const userName = localStorage.getItem('user_name');
            if (userName) {
                const userNameElement = document.getElementById('userName');
                if (userNameElement) {
                    userNameElement.textContent = `Olá, ${userName}!`;
                }
            }
        }
    }
});