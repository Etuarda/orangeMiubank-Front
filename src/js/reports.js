// src/js/reports.js
import { api } from './api.js';
import { showMessage, hideMessage, formatCurrency } from './main.js'; // Importa funções de main.js

document.addEventListener('DOMContentLoaded', () => {
    // Lógica para Extrato de Conta
    const statementForm = document.getElementById('statementForm');
    if (statementForm) {
        const statementMessage = document.getElementById('statementMessage');
        const statementTableBody = document.getElementById('statementTableBody');
        const currentStatementBalanceElem = document.getElementById('currentStatementBalance');

        statementForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            hideMessage(statementMessage);
            statementTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-secondary">Carregando...</td></tr>';
            currentStatementBalanceElem.textContent = formatCurrency(0);

            const accountType = statementForm.elements.accountType.value;
            const startDate = statementForm.elements.startDate.value;
            const endDate = statementForm.elements.endDate.value;

            try {
                const response = await api.reports.getStatement(accountType, startDate, endDate);
                currentStatementBalanceElem.textContent = formatCurrency(response.currentBalance);

                renderStatementTable(response.statement, statementTableBody);
                showMessage(statementMessage, `Extrato da Conta ${accountType} gerado com sucesso.`, 'success');
            } catch (error) {
                console.error('Erro ao gerar extrato:', error);
                showMessage(statementMessage, error.message || 'Erro ao gerar extrato.', 'error');
                statementTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-error">Erro ao carregar extrato.</td></tr>';
            }
        });
    }

    // Lógica para Resumo de Investimentos
    const generateInvestmentSummaryBtn = document.getElementById('generateInvestmentSummaryBtn');
    if (generateInvestmentSummaryBtn) {
        const investmentSummaryMessage = document.getElementById('investmentSummaryMessage');
        const investmentSummaryTableBody = document.getElementById('investmentSummaryTableBody');

        generateInvestmentSummaryBtn.addEventListener('click', async () => {
            hideMessage(investmentSummaryMessage);
            investmentSummaryTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-secondary">Carregando resumo...</td></tr>';

            try {
                const investments = await api.reports.getInvestmentSummary();
                renderInvestmentSummaryTable(investments, investmentSummaryTableBody);
                showMessage(investmentSummaryMessage, 'Resumo de investimentos gerado com sucesso.', 'success');
            } catch (error) {
                console.error('Erro ao gerar resumo de investimentos:', error);
                showMessage(investmentSummaryMessage, error.message || 'Erro ao gerar resumo de investimentos.', 'error');
                investmentSummaryTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-error">Erro ao carregar resumo.</td></tr>';
            }
        });
    }

    // Lógica para Relatório de Imposto de Renda
    const taxReportForm = document.getElementById('taxReportForm');
    if (taxReportForm) {
        const taxReportMessage = document.getElementById('taxReportMessage');
        const taxReportPeriodElem = document.getElementById('taxReportPeriod');
        const totalProfitIRElem = document.getElementById('totalProfitIR');
        const totalTaxPaidIRElem = document.getElementById('totalTaxPaidIR');
        const taxReportTableBody = document.getElementById('taxReportTableBody');

        taxReportForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            hideMessage(taxReportMessage);
            taxReportTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary">Carregando relatório...</td></tr>';
            totalProfitIRElem.textContent = formatCurrency(0);
            totalTaxPaidIRElem.textContent = formatCurrency(0);
            taxReportPeriodElem.textContent = 'Carregando...';

            const year = taxReportForm.elements.year.value;
            const startDate = taxReportForm.elements.startDate.value;
            const endDate = taxReportForm.elements.endDate.value;

            // Validação de entrada para evitar year e date range juntos, ou nenhum
            if (year && (startDate || endDate)) {
                showMessage(taxReportMessage, 'Por favor, forneça um Ano OU um período de data (De/Até), não ambos.', 'error');
                taxReportTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary">Selecione o filtro corretamente.</td></tr>';
                return;
            }
            if (!year && !startDate && !endDate) {
                showMessage(taxReportMessage, 'Por favor, selecione um Ano ou um período de data para o relatório.', 'error');
                taxReportTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary">Selecione o filtro.</td></tr>';
                return;
            }


            try {
                const response = await api.reports.getTaxReport(year, startDate, endDate);

                taxReportPeriodElem.textContent = response.filterPeriod || 'Período Indefinido';
                totalProfitIRElem.textContent = formatCurrency(response.totalProfit);
                totalTaxPaidIRElem.textContent = formatCurrency(response.totalTaxPaid);

                renderTaxReportTable(response.detailedReport, taxReportTableBody);
                showMessage(taxReportMessage, 'Relatório de Imposto de Renda gerado com sucesso.', 'success');
            } catch (error) {
                console.error('Erro ao gerar relatório de IR:', error);
                showMessage(taxReportMessage, error.message || 'Erro ao gerar relatório de Imposto de Renda.', 'error');
                taxReportTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-error">Erro ao carregar relatório.</td></tr>';
            }
        });
    }
});

// Funções auxiliares para renderização de tabelas
function renderStatementTable(movements, tableBody) {
    tableBody.innerHTML = '';
    if (movements.length > 0) {
        movements.forEach(move => {
            const row = document.createElement('tr');
            const date = new Date(move.date).toLocaleDateString('pt-BR');
            const valueClass = move.isDebit ? 'text-error' : 'text-success';
            row.innerHTML = `
                <td>${date}</td>
                <td>${mapMovementType(move.type)}</td>
                <td>${move.description || 'Movimentação'}</td>
                <td class="${valueClass}">${move.value}</td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-secondary">Nenhuma movimentação para o período/conta.</td></tr>';
    }
}

function renderInvestmentSummaryTable(investments, tableBody) {
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
            `;
            tableBody.appendChild(row);
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-secondary">Nenhum investimento ativo.</td></tr>';
    }
}

function renderTaxReportTable(reports, tableBody) {
    tableBody.innerHTML = '';
    if (reports.length > 0) {
        reports.forEach(item => {
            const row = document.createElement('tr');
            const profitClass = item.profit >= 0 ? 'text-success' : 'text-error';
            const saleDate = item.saleDate ? new Date(item.saleDate).toLocaleDateString('pt-BR') : '-';
            row.innerHTML = `
                <td>${item.assetSymbol || item.assetName}</td>
                <td>${mapAssetType(item.assetType)}</td>
                <td>${item.quantity.toFixed(2)}</td>
                <td class="${profitClass}">${formatCurrency(item.profit)}</td>
                <td>${formatCurrency(item.taxPaid)}</td>
                <td>${saleDate}</td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-secondary">Nenhuma operação tributável no período.</td></tr>';
    }
}

// Funções auxiliares (pode ser movida para utils.js se você criar)
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

function mapAssetType(type) {
    switch (type) {
        case 'ACAO': return 'Ação';
        case 'CDB': return 'CDB';
        case 'TESOURO_DIRETO': return 'Tesouro Direto';
        default: return type;
    }
}