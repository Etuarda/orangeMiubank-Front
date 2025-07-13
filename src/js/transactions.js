// src/js/transactions.js
import { api } from './api.js';
import { showMessage, hideMessage, formatCurrency } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Lógica para carregar dados na dashboard (se a página atual for index.html)
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        await loadDashboardData();
        const refreshTipBtn = document.getElementById('refreshTipBtn');
        if (refreshTipBtn) {
            refreshTipBtn.addEventListener('click', loadRandomFinancialTip);
        }
        const createGoalBtn = document.getElementById('createGoalBtn');
        if (createGoalBtn) {
            createGoalBtn.addEventListener('click', () => {
                const goalName = prompt('Qual o nome da sua nova meta? (Ex: Viagem)');
                if (!goalName) return;

                let goalAmount = parseFloat(prompt('Qual o valor total da meta? (Ex: 1000.00)'));
                while (isNaN(goalAmount) || goalAmount <= 0) {
                    goalAmount = parseFloat(prompt('Valor inválido. Por favor, insira um valor válido e maior que zero.'));
                }

                createFinancialGoal(goalName, goalAmount);
            });
        }
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
                loadCurrentAccountBalance(currentAccountBalanceWithdrawElem);
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

        await loadAllBalances(currentAccountBalanceTransferElem, investmentAccountBalanceTransferElem);

        transferTypeSelect.addEventListener('change', () => {
            if (transferTypeSelect.value === 'external_CORRENTE_CORRENTE') {
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
            const recipientCpf = transferType === 'external_CORRENTE_CORRENTE' ? transferForm.elements.recipientCpf.value : null;

            if (isNaN(amount) || amount <= 0) {
                showMessage(transferMessage, 'Por favor, insira um valor de transferência válido.', 'error');
                return;
            }
            if (!transferType) {
                showMessage(transferMessage, 'Por favor, selecione o tipo de transferência.', 'error');
                return;
            }
            if (transferType === 'external_CORRENTE_CORRENTE' && (!recipientCpf || !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(recipientCpf))) {
                showMessage(transferMessage, 'Por favor, insira um CPF de destinatário válido (XXX.XXX.XXX-XX) para transferências externas.', 'error');
                return;
            }

            try {
                let response;
                if (transferType.startsWith('internal')) {
                    const [_, fromAccountType, toAccountType] = transferType.split('_');
                    response = await api.accounts.transferInternal({ amount, fromAccountType, toAccountType });
                } else if (transferType === 'external_CORRENTE_CORRENTE') {
                    response = await api.accounts.transferExternal({ amount, recipientCpf });
                } else {
                    showMessage(transferMessage, 'Tipo de transferência inválido.', 'error');
                    return;
                }

                showMessage(transferMessage, response.message, 'success');
                transferForm.reset();
                recipientCpfGroup.classList.add('u-hidden');
                await loadAllBalances(currentAccountBalanceTransferElem, investmentAccountBalanceTransferElem);
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
    const petPointsTextElement = document.getElementById('petPointsText'); // NOVO: Elemento para pontos do usuário
    const petMoodTextElement = document.getElementById('petMoodText'); // NOVO: Elemento para humor do pet
    const petImageElement = document.getElementById('petImage'); // Elemento para imagem do pet


    const userName = localStorage.getItem('user_name') || 'Usuário';
    if (userNameElement) {
        userNameElement.textContent = `Olá, ${userName}!`;
    }

    try {
        // Carrega e exibe os saldos
        const balances = await api.accounts.getBalances();
        if (currentAccountBalanceElem) {
            currentAccountBalanceElem.textContent = formatCurrency(balances.corrente);
        }
        if (investmentAccountBalanceElem) {
            investmentAccountBalanceElem.textContent = formatCurrency(balances.investimento);
        }

        // NOVO: Carrega e exibe o perfil do usuário (para pontos e pet)
        // Isso é crucial para o pet dinâmico e para os pontos
        const userProfile = await api.user.getProfile();
        if (userProfile) {
            if (petPointsTextElement) {
                petPointsTextElement.textContent = `Pontos: ${userProfile.points || 0}`;
            }
            // Lógica para o humor do pet baseada nos pontos
            if (petMoodTextElement && petImageElement) {
                updatePetMoodAndImage(userProfile.points || 0, petMoodTextElement, petImageElement);
            }
        }


        // Carrega e exibe as últimas movimentações da Conta Corrente
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
                        <td class="${valueClass}">${formatCurrency(move.rawAmount)}</td>
                    `;
                    transactionHistoryBody.appendChild(row);
                });
            } else {
                const noDataRow = document.createElement('tr');
                noDataRow.innerHTML = `<td colspan="4" class="text-center text-secondary">Nenhuma movimentação recente.</td>`;
                transactionHistoryBody.appendChild(noDataRow);
            }
        }

        // NOVO: Carregar e exibir Pílula de Riqueza
        await loadRandomFinancialTip();

        // Carregar e exibir Metas Financeiras (OK, backend já tem)
        await loadFinancialGoals();

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

// NOVO: Função para carregar uma pílula de riqueza aleatória
async function loadRandomFinancialTip() {
    const financialTipContentElem = document.getElementById('financialTipContent');
    const refreshTipBtn = document.getElementById('refreshTipBtn');
    if (!financialTipContentElem || !refreshTipBtn) return;

    financialTipContentElem.textContent = 'Carregando dica...'; // Feedback visual
    refreshTipBtn.disabled = true; // Desabilita o botão enquanto carrega
    try {
        const tip = await api.financialTips.getRandom(); // Chama o método da API
        if (tip && tip.description) { // Usar 'description' conforme seu seed
            financialTipContentElem.innerHTML = `<strong>${tip.title || 'Dica Financeira'}</strong>: ${tip.description}`;
        } else {
            financialTipContentElem.innerHTML = 'Nenhuma pílula de riqueza disponível no momento.';
        }
    } catch (error) {
        console.error('Erro ao carregar pílula de riqueza:', error);
        financialTipContentElem.innerHTML = 'Erro ao carregar dica.';
    } finally {
        refreshTipBtn.disabled = false; // Habilita o botão novamente
    }
}

// NOVO: Função para criar uma meta financeira (chamada pelo botão Criar Nova Meta)
async function createFinancialGoal(name, targetAmount) {
    try {
        const response = await api.goals.createGoal({ name, targetAmount });
        showMessage(document.getElementById('dashboardErrorMessage'), response.message, 'success');
        await loadDashboardData(); // Recarrega a dashboard para mostrar a nova meta
    } catch (error) {
        console.error('Erro ao criar meta:', error);
        showMessage(document.getElementById('dashboardErrorMessage'), error.message || 'Erro ao criar meta.', 'error');
    }
}

// NOVO: Função para carregar e exibir metas financeiras
async function loadFinancialGoals() {
    const financialGoalsListElem = document.getElementById('financialGoalsList');
    const noGoalsMessageElem = document.getElementById('noGoalsMessage');
    if (!financialGoalsListElem || !noGoalsMessageElem) return;

    financialGoalsListElem.innerHTML = ''; // Limpa a lista
    noGoalsMessageElem.classList.add('u-hidden'); // Esconde a mensagem de "sem metas" inicialmente

    try {
        const goals = await api.goals.getGoals();

        if (goals && goals.length > 0) {
            goals.forEach(goal => {
                const goalItem = document.createElement('div');
                goalItem.classList.add('goal-item');

                const progressPercentage = (goal.targetAmount > 0) ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                // Garante que o progresso não ultrapasse 100% visualmente
                const clampedProgress = Math.min(progressPercentage, 100).toFixed(2);

                goalItem.innerHTML = `
                    <h3>${goal.name}</h3>
                    <p>Meta: ${formatCurrency(goal.targetAmount)}</p>
                    <p>Atual: ${formatCurrency(goal.currentAmount)}</p>
                    <div class="progress-bar-container"><div class="progress-bar" style="width: ${clampedProgress}%;"></div></div>
                    <p class="progress-text">${clampedProgress}% Concluído ${goal.isAchieved ? '(Alcançada!)' : ''}</p>
                    ${!goal.isAchieved ? `<button class="btn btn-secondary btn-sm" data-goal-id="${goal.id}" data-current-amount="${goal.currentAmount}" data-target-amount="${goal.targetAmount}">Atualizar Progresso</button>` : ''}
                    <button class="btn btn-error btn-sm u-margin-left-sm" data-goal-id="${goal.id}" data-action="delete">Excluir</button>
                `;
                financialGoalsListElem.appendChild(goalItem);
            });
            // Adiciona listeners para os botões após todos os itens serem criados
            financialGoalsListElem.querySelectorAll('.btn-secondary').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const goalId = event.target.dataset.goalId;
                    const currentAmount = parseFloat(event.target.dataset.currentAmount);
                    const targetAmount = parseFloat(event.target.dataset.targetAmount);

                    const amountToAdd = parseFloat(prompt('Quanto você deseja adicionar a esta meta?'));
                    if (isNaN(amountToAdd) || amountToAdd <= 0) {
                        alert('Por favor, insira um valor válido e maior que zero.');
                        return;
                    }

                    try {
                        const response = await api.goals.updateGoalProgress(goalId, amountToAdd);
                        showMessage(document.getElementById('dashboardErrorMessage'), response.message, 'success');
                        await loadDashboardData();
                    } catch (error) {
                        console.error('Erro ao atualizar progresso da meta:', error);
                        showMessage(document.getElementById('dashboardErrorMessage'), error.message || 'Erro ao atualizar progresso da meta.', 'error');
                    }
                });
            });
            // Listener para o botão de excluir
            financialGoalsListElem.querySelectorAll('.btn-error[data-action="delete"]').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const goalId = event.target.dataset.goalId;
                    if (confirm('Tem certeza que deseja excluir esta meta?')) {
                        try {
                            const response = await api.goals.deleteGoal(goalId);
                            showMessage(document.getElementById('dashboardErrorMessage'), response.message, 'success');
                            await loadDashboardData();
                        } catch (error) {
                            console.error('Erro ao excluir meta:', error);
                            showMessage(document.getElementById('dashboardErrorMessage'), error.message || 'Erro ao excluir meta.', 'error');
                        }
                    }
                });
            });

        } else {
            noGoalsMessageElem.classList.remove('u-hidden'); // Garante que a mensagem "sem metas" esteja visível
        }
    } catch (error) {
        console.error('Erro ao carregar metas financeiras:', error);
        financialGoalsListElem.innerHTML = `<p class="text-error text-center">Erro ao carregar metas.</p>`;
        noGoalsMessageElem.classList.add('u-hidden');
    }
}

// NOVO: Função para atualizar o humor e imagem do pet
function updatePetMoodAndImage(points, petMoodTextElement, petImageElement) {
    let mood = 'Neutro';
    let imagePath = '/src/assets/images/cat-neutral.svg'; // Caminho absoluto para SVG

    // Adapte esta lógica aos seus critérios de gamificação e imagens
    if (points >= 100) {
        mood = 'muito feliz!';
        imagePath = '/src/assets/images/cat-happy.svg';
    } else if (points >= 50) {
        mood = 'feliz!';
        imagePath = '/src/assets/images/cat-neutral.svg'; // Pode ser cat-happy ou um intermediário
    } else if (points < 0) { // Exemplo: se os pontos ficarem negativos
        mood = 'triste.';
        imagePath = '/src/assets/images/cat-sad.svg';
    }

    petMoodTextElement.textContent = `Humor: ${mood}`;
    petImageElement.src = imagePath;
}

// Funções auxiliares (mantidas)
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
function mapMovementType(type) {
    switch (type) {
        case 'DEPOSITO': return 'Depósito';
        case 'SAQUE': return 'Saque';
        case 'TRANSFERENCIA_INTERNA': return 'Transf. Interna';
        case 'TRANSFERENCIA_EXTERNA': return 'Transf. Externa';
        case 'COMPRA_ATIVO': return 'Compra Ativo';
        case 'VENDA_ATIVO': return 'Venda Ativo';
        default: return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
    }
}