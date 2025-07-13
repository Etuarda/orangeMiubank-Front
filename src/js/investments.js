// src/js/investments.js
import { api } from './api.js';
import { showMessage, hideMessage, formatCurrency } from './main.js';

let availableAssets = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (window.location.pathname.endsWith('buy-assets.html')) {
        await loadInvestmentData();
        setupBuyAssetForm();
        setupSellAssetListeners();
    }
});

async function loadInvestmentData() {
    await loadInvestmentAccountBalance();
    await loadAvailableAssets(); // Aqui vamos depurar
    await loadUserInvestments();
}

async function loadInvestmentAccountBalance() {
    const balanceElem = document.getElementById('investmentAccountBalanceBuy');
    if (!balanceElem) return;
    try {
        const balances = await api.accounts.getBalances();
        balanceElem.textContent = formatCurrency(balances.investimento);
    } catch (error) {
        console.error('Erro ao carregar saldo da conta investimento:', error);
        showMessage(document.getElementById('buyAssetMessage'), `Erro ao carregar saldo: ${error.message}`, 'error');
        balanceElem.textContent = 'Erro ao carregar.';
    }
}

async function loadAvailableAssets() {
    const assetSelect = document.getElementById('assetSelect');
    if (!assetSelect) return;

    try {
        // --- ADICIONAR ESTES CONSOLE.LOGS ---
        console.log('Tentando carregar ativos disponíveis da API...');
        const assetsFromApi = await api.market.getAssets();
        console.log('Resposta da API para ativos disponíveis:', assetsFromApi);
        // --- FIM DOS CONSOLE.LOGS ---

        availableAssets = assetsFromApi; // Armazena a resposta completa

        assetSelect.innerHTML = '<option value="">Selecione um ativo...</option>';

        if (availableAssets.length > 0) {
            availableAssets.forEach(asset => {
                const option = document.createElement('option');
                option.value = asset.id;
                // Verifique se as propriedades existem antes de acessá-las
                if (asset.type === 'ACAO') {
                    option.textContent = `${asset.symbol || 'N/A'} - ${asset.name || 'N/A'} (R$ ${asset.currentPrice ? asset.currentPrice.toFixed(2) : '0,00'})`;
                } else {
                    option.textContent = `${asset.name || 'N/A'} (Min. R$ ${asset.minimumInvestment ? asset.minimumInvestment.toFixed(2) : '0,00'})`;
                }
                assetSelect.appendChild(option);
            });
            console.log('Ativos carregados e dropdown preenchido.');
        } else {
            assetSelect.innerHTML = '<option value="">Nenhum ativo disponível.</option>';
            console.warn('API retornou nenhum ativo disponível.');
        }


        assetSelect.addEventListener('change', updateEstimatedCost);
        document.getElementById('quantity').addEventListener('input', updateEstimatedCost);

    } catch (error) {
        console.error('Erro ao carregar ativos disponíveis:', error);
        showMessage(document.getElementById('buyAssetMessage'), `Erro ao carregar ativos: ${error.message}`, 'error');
        assetSelect.innerHTML = '<option value="">Erro ao carregar ativos.</option>';
    }
}

// ... (restante do investments.js, sem alterações) ...
function updateEstimatedCost() {
    const assetSelect = document.getElementById('assetSelect');
    const quantityInput = document.getElementById('quantity');
    const assetPriceElem = document.getElementById('assetPrice');
    const estimatedTotalCostElem = document.getElementById('estimatedTotalCost');

    const selectedAssetId = assetSelect.value;
    const quantity = parseFloat(quantityInput.value);

    const selectedAsset = availableAssets.find(asset => asset.id === selectedAssetId);

    if (selectedAsset && quantity > 0) {
        let price = selectedAsset.currentPrice; // Já é um number graças ao .map no controller do backend
        let totalCost = price * quantity;

        if (selectedAsset.type === 'ACAO') {
            const brokerageFee = totalCost * 0.01;
            totalCost += brokerageFee;
        }

        assetPriceElem.textContent = formatCurrency(price);
        estimatedTotalCostElem.textContent = formatCurrency(totalCost);
    } else {
        assetPriceElem.textContent = formatCurrency(0);
        estimatedTotalCostElem.textContent = formatCurrency(0);
    }
}


function setupBuyAssetForm() {
    const buyAssetForm = document.getElementById('buyAssetForm');
    const buyAssetMessage = document.getElementById('buyAssetMessage');

    if (!buyAssetForm) return;

    buyAssetForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        hideMessage(buyAssetMessage);

        const assetId = buyAssetForm.elements.assetId.value;
        const quantity = parseFloat(buyAssetForm.elements.quantity.value);

        if (!assetId || isNaN(quantity) || quantity <= 0) {
            showMessage(buyAssetMessage, 'Selecione um ativo e insira uma quantidade válida.', 'error');
            return;
        }

        try {
            const response = await api.market.buyAsset({ assetId, quantity });
            showMessage(buyAssetMessage, response.message, 'success');
            buyAssetForm.reset();
            updateEstimatedCost();
            await loadInvestmentData();
        } catch (error) {
            console.error('Erro ao comprar ativo:', error);
            showMessage(buyAssetMessage, error.message || 'Erro ao comprar ativo.', 'error');
        }
    });
}

async function loadUserInvestments() {
    const tableBody = document.getElementById('userInvestmentsTableBody');
    if (!tableBody) return;

    try {
        const investments = await api.market.getUserInvestments();
        tableBody.innerHTML = '';

        if (investments.length > 0) {
            investments.forEach(inv => {
                const row = document.createElement('tr');
                const profitOrLossClass = inv.profitOrLoss >= 0 ? 'text-success' : 'text-error';

                row.innerHTML = `
                    <td>${inv.assetSymbol}</td>
                    <td>${mapAssetType(inv.assetType)}</td>
                    <td>${inv.quantity.toFixed(2)}</td>
                    <td>${formatCurrency(inv.purchasePrice)}</td>
                    <td>${formatCurrency(inv.currentPrice)}</td>
                    <td>${formatCurrency(inv.currentValue)}</td>
                    <td class="${profitOrLossClass}">${formatCurrency(inv.profitOrLoss)}</td>
                    <td>
                        <button class="btn btn-primary btn-sell" data-investment-id="${inv.id}" 
                                data-asset-symbol="${inv.assetSymbol}" data-quantity="${inv.quantity}"
                                title="Vender">Vender</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            console.log('Investimentos do usuário carregados.');
        } else {
            const noDataRow = document.createElement('tr');
            noDataRow.innerHTML = `<td colspan="8" class="text-center text-secondary">Nenhum investimento ativo.</td>`;
            tableBody.appendChild(noDataRow);
            console.log('Nenhum investimento ativo para o usuário.');
        }
    } catch (error) {
        console.error('Erro ao carregar investimentos do usuário:', error);
        showMessage(document.getElementById('buyAssetMessage'), `Erro ao carregar investimentos: ${error.message}`, 'error');
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-error">Erro ao carregar investimentos.</td></tr>`;
    }
}

function setupSellAssetListeners() {
    const tableBody = document.getElementById('userInvestmentsTableBody');
    if (!tableBody) return;

    tableBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('btn-sell')) {
            const button = event.target;
            const investmentId = button.dataset.investmentId;
            const assetSymbol = button.dataset.assetSymbol;
            const quantity = parseFloat(button.dataset.quantity);

            const sellAll = confirm(`Deseja vender TODAS as ${quantity.toFixed(2)} unidades de ${assetSymbol}? Clique em OK para vender tudo, ou Cancelar para vender uma quantidade específica (ainda não implementado, mas é o fluxo).`);

            let quantityToSell = quantity;

            if (sellAll) {
                try {
                    const response = await api.market.sellAsset({ investmentId, quantityToSell });
                    showMessage(document.getElementById('buyAssetMessage'), response.message, 'success');
                    await loadInvestmentData();
                } catch (error) {
                    console.error('Erro ao vender ativo:', error);
                    showMessage(document.getElementById('buyAssetMessage'), error.message || 'Erro ao vender ativo.', 'error');
                }
            } else {
                showMessage(document.getElementById('buyAssetMessage'), 'Para o hackathon, a venda é apenas da quantidade total. Por favor, clique OK para vender tudo.', 'error');
            }
        }
    });
}

function mapAssetType(type) {
    switch (type) {
        case 'ACAO': return 'Ação';
        case 'CDB': return 'CDB';
        case 'TESOURO_DIRETO': return 'Tesouro Direto';
        default: return type;
    }
}