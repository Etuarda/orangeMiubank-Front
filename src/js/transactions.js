// src/js/transactions.js
import { api } from './api.js';
import { showMessage, hideMessage } from './main.js'; // Para exibir mensagens

document.addEventListener('DOMContentLoaded', async () => {
    // Só carrega os dados se estiver na página da dashboard
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        await loadDashboardData();
    }
});

export async function loadDashboardData() {
    const currentAccountBalanceElem = document.getElementById('currentAccountBalance');
    const investmentAccountBalanceElem = document.getElementById('investmentAccountBalance');
    const transactionHistoryBody = document.getElementById('transactionHistoryBody');
    const userNameElement = document.getElementById('userName');

    // Recupera o nome do usuário do localStorage (já salvo no login/registro)
    const userName = localStorage.getItem('user_name') || 'Usuário';
    if (userNameElement) {
        userNameElement.textContent = `Olá, ${userName}!`;
    }

    try {
        // Carregar Saldos
        const balances = await api.accounts.getBalances();
        if (currentAccountBalanceElem) {
            currentAccountBalanceElem.textContent = window.formatCurrency(balances.corrente);
        }
        if (investmentAccountBalanceElem) {
            investmentAccountBalanceElem.textContent = window.formatCurrency(balances.investimento);
        }

        // Carregar Últimas Movimentações (Extrato da Conta Corrente, 5 últimos)
        // A API de extrato permite filtrar por tipo de conta, então vamos pegar da corrente
        // Seu endpoint de statement não tem limite, então vamos pegar os 5 últimos no frontend
        const statementResponse = await api.reports.getStatement('CORRENTE');
        const movements = statementResponse.statement || [];

        if (transactionHistoryBody) {
            transactionHistoryBody.innerHTML = ''; // Limpa qualquer placeholder

            if (movements.length > 0) {
                // Pega os 5 últimos, ordenados pela data mais recente (se a API retornar do mais antigo para o mais novo, reverse)
                const latestMovements = movements.slice(-5).reverse();

                latestMovements.forEach(move => {
                    const row = document.createElement('tr');
                    const date = new Date(move.date).toLocaleDateString('pt-BR');
                    const valueClass = move.isDebit ? 'text-error' : 'text-success'; // Adiciona classe para cor

                    row.innerHTML = `
                        <td>${date}</td>
                        <td>${mapMovementType(move.type)}</td>
                        <td>${move.description || 'Movimentação'}</td>
                        <td class="${valueClass}">${move.value}</td>
                    `;
                    transactionHistoryBody.appendChild(row);
                });
            } else {
                const noDataRow = document.createElement('tr');
                noDataRow.innerHTML = `<td colspan="4" class="text-center text-secondary">Nenhuma movimentação recente.</td>`;
                transactionHistoryBody.appendChild(noDataRow);
            }
        }

    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        // Exibir uma mensagem de erro na dashboard se falhar
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            const errorMessageDiv = document.createElement('div');
            errorMessageDiv.id = 'dashboardErrorMessage';
            mainContent.prepend(errorMessageDiv);
            showMessage(errorMessageDiv, `Erro ao carregar dados: ${error.message || 'Verifique sua conexão.'}`, 'error');
        }
    }
}

// Função auxiliar para mapear tipos de movimentação para algo mais legível
function mapMovementType(type) {
    switch (type) {
        case 'DEPOSITO': return 'Depósito';
        case 'SAQUE': return 'Saque';
        case 'TRANSFERENCIA_INTERNA': return 'Transf. Interna';
        case 'TRANSFERENCIA_EXTERNA': return 'Transf. Externa';
        case 'COMPRA_ATIVO': return 'Compra Ativo';
        case 'VENDA_ATIVO': return 'Venda Ativo';
        default: return type;
    }
}

// Exporta loadDashboardData para que outras páginas possam chamá-lo se necessário
// window.loadDashboardData = loadDashboardData; // Ou importe diretamente onde precisar