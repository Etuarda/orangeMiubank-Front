// src/js/transactions.js
import { api } from './api.js';
import { showMessage, hideMessage, formatCurrency } from './main.js'; // Importa funções de main.js

document.addEventListener('DOMContentLoaded', async () => {
    // Lógica para carregar dados na dashboard (se a página atual for index.html)
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        await loadDashboardData();
    }

    // Lógica para página de Depósito
    const depositForm = document.getElementById('depositForm');
    if (depositForm) {
        const depositMessage = document.getElementById('depositMessage');
        const currentAccountBalanceDepositElem = document.getElementById('currentAccountBalanceDeposit');

        await loadCurrentAccountBalance(currentAccountBalanceDepositElem);

        depositForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            hideMessage(depositMessage);

            const amount = parseFloat(depositForm.elements.amount.value);

            if (isNaN(amount) || amount <= 0) {
                showMessage(depositMessage, 'Por favor, insira um valor de depósito válido.', 'error');
                return;
            }

            try {
                const response = await api.accounts.deposit(amount);
                showMessage(depositMessage, response.message, 'success');
                depositForm.reset(); // Limpa o formulário
                loadCurrentAccountBalance(currentAccountBalanceDepositElem); // Atualiza o saldo
                // Opcional: Recarregar pet mood se o depósito influencia
            } catch (error) {
                console.error('Erro ao realizar depósito:', error);
                showMessage(depositMessage, error.message || 'Erro ao realizar depósito.', 'error');
            }
        });
    }

    // Lógica para página de Saque
    const withdrawForm = document.getElementById('withdrawForm');
    if (withdrawForm) {
        const withdrawMessage = document.getElementById('withdrawMessage');
        const currentAccountBalanceWithdrawElem = document.getElementById('currentAccountBalanceWithdraw');

        await loadCurrentAccountBalance(currentAccountBalanceWithdrawElem);

        withdrawForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            hideMessage(withdrawMessage);

            const amount = parseFloat(withdrawForm.elements.amount.value);

            if (isNaN(amount) || amount <= 0) {
                showMessage(withdrawMessage, 'Por favor, insira um valor de saque válido.', 'error');
                return;
            }

            try {
                const response = await api.accounts.withdraw(amount);
                showMessage(withdrawMessage, response.message, 'success');
                withdrawForm.reset();
                loadCurrentAccountBalance(currentAccountBalanceWithdrawElem); // Atualiza o saldo
            } catch (error) {
                console.error('Erro ao realizar saque:', error);
                showMessage(withdrawMessage, error.message || 'Erro ao realizar saque.', 'error');
            }
        });
    }

    // Lógica para página de Transferência
    const transferForm = document.getElementById('transferForm');
    if (transferForm) {
        const transferMessage = document.getElementById('transferMessage');
        const transferTypeSelect = document.getElementById('transferType');
        const recipientCpfGroup = document.getElementById('recipientCpfGroup');
        const currentAccountBalanceTransferElem = document.getElementById('currentAccountBalanceTransfer');
        const investmentAccountBalanceTransferElem = document.getElementById('investmentAccountBalanceTransfer');

        // Carregar saldos iniciais para a tela de transferência
        await loadAllBalances(currentAccountBalanceTransferElem, investmentAccountBalanceTransferElem);

        transferTypeSelect.addEventListener('change', () => {
            if (transferTypeSelect.value === 'external_cc_cc') {
                recipientCpfGroup.classList.remove('u-hidden');
                recipientCpfGroup.querySelector('input').setAttribute('required', 'required');
            } else {
                recipientCpfGroup.classList.add('u-hidden');
                recipientCpfGroup.querySelector('input').removeAttribute('required');
            }
        });

        transferForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            hideMessage(transferMessage);

            const amount = parseFloat(transferForm.elements.amount.value);
            const transferType = transferForm.elements.transferType.value;
            const recipientCpf = transferForm.elements.recipientCpf ? transferForm.elements.recipientCpf.value : null;

            if (isNaN(amount) || amount <= 0) {
                showMessage(transferMessage, 'Por favor, insira um valor de transferência válido.', 'error');
                return;
            }
            if (!transferType) {
                showMessage(transferMessage, 'Por favor, selecione o tipo de transferência.', 'error');
                return;
            }
            if (transferType === 'external_cc_cc' && (!recipientCpf || !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(recipientCpf))) {
                showMessage(transferMessage, 'Por favor, insira um CPF de destinatário válido (XXX.XXX.XXX-XX).', 'error');
                return;
            }

            try {
                let response;
                if (transferType.startsWith('internal')) {
                    const [_, fromAccountTypeAbbr, toAccountTypeAbbr] = transferType.split('_');
                    const fromAccountType = fromAccountTypeAbbr.toUpperCase();
                    const toAccountType = toAccountTypeAbbr.toUpperCase();
                    response = await api.accounts.transferInternal({ amount, fromAccountType, toAccountType });
                } else if (transferType === 'external_cc_cc') {
                    response = await api.accounts.transferExternal({ amount, recipientCpf });
                } else {
                    showMessage(transferMessage, 'Tipo de transferência inválido.', 'error');
                    return;
                }

                showMessage(transferMessage, response.message, 'success');
                transferForm.reset(); // Limpa o formulário
                recipientCpfGroup.classList.add('u-hidden'); // Esconde o campo CPF novamente
                await loadAllBalances(currentAccountBalanceTransferElem, investmentAccountBalanceTransferElem); // Atualiza os saldos
            } catch (error) {
                console.error('Erro ao realizar transferência:', error);
                showMessage(transferMessage, error.message || 'Erro ao realizar transferência.', 'error');
            }
        });
    }
});

// Funções exportadas para o Dashboard e outras telas (já presentes na última resposta)
export async function loadDashboardData() {
    const currentAccountBalanceElem = document.getElementById('currentAccountBalance');
    const investmentAccountBalanceElem = document.getElementById('investmentAccountBalance');
    const transactionHistoryBody = document.getElementById('transactionHistoryBody');
    const userNameElement = document.getElementById('userName');

    const userName = localStorage.getItem('user_name') || 'Usuário';
    if (userNameElement) {
        userNameElement.textContent = `Olá, ${userName}!`;
    }

    try {
        const balances = await api.accounts.getBalances();
        if (currentAccountBalanceElem) {
            currentAccountBalanceElem.textContent = formatCurrency(balances.corrente);
        }
        if (investmentAccountBalanceElem) {
            investmentAccountBalanceElem.textContent = formatCurrency(balances.investimento);
        }

        const statementResponse = await api.reports.getStatement('CORRENTE');
        const movements = statementResponse.statement || [];

        if (transactionHistoryBody) {
            transactionHistoryBody.innerHTML = '';

            if (movements.length > 0) {
                const latestMovements = movements.slice(-5).reverse();

                latestMovements.forEach(move => {
                    const row = document.createElement('tr');
                    const date = new Date(move.date).toLocaleDateString('pt-BR');
                    const valueClass = move.isDebit ? 'text-error' : 'text-success';

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
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            let errorMessageDiv = document.getElementById('dashboardErrorMessage');
            if (!errorMessageDiv) {
                errorMessageDiv = document.createElement('div');
                errorMessageDiv.id = 'dashboardErrorMessage';
                mainContent.prepend(errorMessageDiv);
            }
            showMessage(errorMessageDiv, `Erro ao carregar dados: ${error.message || 'Verifique sua conexão.'}`, 'error');
        }
    }
}

// Funções auxiliares para carregar saldos em páginas específicas de transação
async function loadCurrentAccountBalance(element) {
    if (!element) return;
    try {
        const balances = await api.accounts.getBalances();
        element.textContent = formatCurrency(balances.corrente);
    } catch (error) {
        console.error('Erro ao carregar saldo da conta corrente:', error);
        element.textContent = 'Erro ao carregar.';
    }
}

async function loadAllBalances(currentElem, investmentElem) {
    if (!currentElem && !investmentElem) return;
    try {
        const balances = await api.accounts.getBalances();
        if (currentElem) currentElem.textContent = formatCurrency(balances.corrente);
        if (investmentElem) investmentElem.textContent = formatCurrency(balances.investimento);
    } catch (error) {
        console.error('Erro ao carregar todos os saldos:', error);
        if (currentElem) currentElem.textContent = 'Erro ao carregar.';
        if (investmentElem) investmentElem.textContent = 'Erro ao carregar.';
    }
}


// Função auxiliar para mapear tipos de movimentação para algo mais legível (usada no dashboard)
function mapMovementType(type) {
    switch (type) {
        case 'DEPOSITO': return 'Depósito';
        case 'SAQUE': return 'Saque';
        case 'TRANSFERENCIA_INTERNA': return 'Transf. Interna';
        case 'TRANSFERENCIA_EXTERNA': return 'Transf. Externa';
        case 'COMPRA_ATIVO': return 'Compra Ativo';
        case 'VENDA_ATIVO': return 'Venda Ativo';
        default: return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase()); // Formata outros tipos
    }
}