// src/js/api.js

const API_BASE_URL = 'https://orangemiubank.onrender.com'; // SEU LINK DEPLOY

export async function apiRequest(endpoint, method = 'GET', data = null, requiresAuth = false) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
    };

    if (requiresAuth) {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            console.error('Nenhum token JWT encontrado. Redirecionando para login.');
            window.location.href = 'login.html';
            throw new Error('Não autenticado: Token JWT ausente.');
        }
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (jsonError) {
                errorData = { error: `Erro HTTP: ${response.status} ${response.statusText}` };
            }
            const error = new Error(errorData.error || `Erro desconhecido da API: ${response.status}`);
            error.status = response.status;
            throw error;
        }

        if (response.status === 204) { // No Content
            return {};
        }

        return await response.json();
    } catch (error) {
        console.error(`Erro na requisição ${method} ${url}:`, error);
        throw error;
    }
}

// Mapeamento de funções da API para facilitar o uso no frontend
export const api = {
    auth: {
        register: (userData) => apiRequest('/auth/register', 'POST', userData),
        login: (credentials) => apiRequest('/auth/login', 'POST', credentials),
    },
    accounts: {
        getBalances: () => apiRequest('/accounts/balances', 'GET', null, true),
        deposit: (amount) => apiRequest('/accounts/deposit', 'POST', { amount }, true),
        withdraw: (amount) => apiRequest('/accounts/withdraw', 'POST', { amount }, true),
        transferInternal: (data) => apiRequest('/accounts/transfer/internal', 'POST', data, true),
        transferExternal: (data) => apiRequest('/accounts/transfer/external', 'POST', data, true),
    },
    market: {
        getAssets: () => apiRequest('/market/assets', 'GET', null, true),
        getUserInvestments: () => apiRequest('/market/investments', 'GET', null, true),
        buyAsset: (data) => apiRequest('/market/buy', 'POST', data, true),
        sellAsset: (data) => apiRequest('/market/sell', 'POST', data, true),
    },
    reports: {
        getStatement: (accountType, startDate, endDate) => {
            let query = `?accountType=${accountType}`;
            if (startDate) query += `&startDate=${startDate}`;
            if (endDate) query += `&endDate=${endDate}`;
            return apiRequest(`/reports/statement${query}`, 'GET', null, true);
        },
        getInvestmentSummary: () => apiRequest('/reports/investments-summary', 'GET', null, true),
        getTaxReport: (year, startDate, endDate) => {
            let query = '?';
            const params = new URLSearchParams();
            if (year) params.append('year', year);
            else if (startDate && endDate) {
                params.append('startDate', startDate);
                params.append('endDate', endDate);
            }
            query += params.toString();
            return apiRequest(`/reports/tax-report${query}`, 'GET', null, true);
        },
    },
    // user.getProfile agora busca dados que incluem pontos do user e pet (APÓS ATUALIZAÇÃO DO BACKEND)
    user: {
        getProfile: () => apiRequest('/user/profile', 'GET', null, true),
    },
    // NOVO: Métodos para Pílulas de Riqueza (AGORA SUPORTADO PELO BACKEND)
    financialTips: {
        getAll: () => apiRequest('/financial-tips', 'GET', null, true),
        getRandom: () => apiRequest('/financial-tips/random', 'GET', null, true),
    },
    // Métodos para Metas Financeiras
    goals: {
        createGoal: (data) => apiRequest('/goals', 'POST', data, true),
        getGoals: () => apiRequest('/goals', 'GET', null, true),
        updateGoalProgress: (goalId, amountAdded) => apiRequest(`/goals/${goalId}/track-progress`, 'PATCH', { amountAdded }, true),
        updateGoal: (goalId, data) => apiRequest(`/goals/${goalId}`, 'PUT', data, true),
        deleteGoal: (goalId) => apiRequest(`/goals/${goalId}`, 'DELETE', null, true),
    }
};