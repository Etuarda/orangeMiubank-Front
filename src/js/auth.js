// src/js/auth.js
import { api } from './api.js';
import { showMessage, hideMessage } from './main.js'; // Importa funções de mensagem de main.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    const loginMessage = document.getElementById('loginMessage');
    const registerMessage = document.getElementById('registerMessage');

    // Lógica de Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            hideMessage(loginMessage);

            const email = loginForm.email.value;
            const password = loginForm.password.value;

            try {
                const response = await api.auth.login({ email, password });
                console.log('Login bem-sucedido:', response);

                localStorage.setItem('jwt_token', response.token);
                localStorage.setItem('user_id', response.userId);
                localStorage.setItem('user_name', response.name);
                localStorage.setItem('user_email', response.email);

                showMessage(loginMessage, 'Login realizado com sucesso! Redirecionando...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } catch (error) {
                console.error('Erro no login:', error);
                const errorMessage = error.message || 'Erro ao fazer login. Verifique suas credenciais.';
                showMessage(loginMessage, errorMessage, 'error');
            }
        });
    }

    // Lógica de Registro
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            hideMessage(registerMessage);

            // Coleta os dados do formulário usando os atributos 'name' dos inputs
            const formData = {
                name: registerForm.elements.name.value,
                email: registerForm.elements.email.value,
                password: registerForm.elements.password.value,
                cpf: registerForm.elements.cpf.value,
                // A data de nascimento deve ser no formato YYYY-MM-DD
                birthDate: registerForm.elements.birthDate.value,
            };

            // Validação simples de formato de CPF para garantir que o Regex HTML5 funcionou
            const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
            if (!cpfRegex.test(formData.cpf)) {
                showMessage(registerMessage, 'Formato de CPF inválido. Use XXX.XXX.XXX-XX.', 'error');
                return;
            }

            try {
                const response = await api.auth.register(formData);
                console.log('Registro bem-sucedido:', response);

                localStorage.setItem('jwt_token', response.token);
                localStorage.setItem('user_id', response.user.id);
                localStorage.setItem('user_name', response.user.name);
                localStorage.setItem('user_email', response.user.email);

                showMessage(registerMessage, 'Cadastro realizado com sucesso! Redirecionando para o login...', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } catch (error) {
                console.error('Erro no registro:', error);
                // Sua API retorna a mensagem de erro no campo `error`.
                const errorMessage = error.message || 'Erro ao cadastrar. Verifique os dados e tente novamente.';
                showMessage(registerMessage, errorMessage, 'error');
            }
        });
    }

    // Lógica de Logout
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', (event) => {
            event.preventDefault();
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }
});