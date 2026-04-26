// Dados armazenados no LocalStorage
let earnings = JSON.parse(localStorage.getItem('earnings')) || [];
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let goals = JSON.parse(localStorage.getItem('goals')) || {
    daily: 0,
    weekly: 0,
    monthly: 0,
    km: 0
};
let currentPeriod = 'day';

// Inicializar datas nos formulários
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('earning-date').value = today;
    document.getElementById('expense-date').value = today;
    
    updateDashboard();
    renderEarningsList();
    renderExpensesList();
    updateGoals();
});

// Formatar moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Formatar data
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

// Obter intervalo de datas
function getDateRange(period) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch(period) {
        case 'day':
            return {
                start: today,
                end: new Date(today.getTime() + 86400000 - 1)
            };
        case 'week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            return { start: weekStart, end: weekEnd };
        case 'month':
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
            return { start: monthStart, end: monthEnd };
    }
}

// Filtrar dados por período
function filterByPeriod(data, period) {
    const { start, end } = getDateRange(period);
    return data.filter(item => {
        const itemDate = new Date(item.date + 'T00:00:00');
        return itemDate >= start && itemDate <= end;
    });
}

// Mudar período
function changePeriod(period) {
    currentPeriod = period;
    
    // Atualizar botões
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    updateDashboard();
}

// Atualizar dashboard
function updateDashboard() {
    const filteredEarnings = filterByPeriod(earnings, currentPeriod);
    const filteredExpenses = filterByPeriod(expenses, currentPeriod);
    
    // Calcular totais
    const totalEarnings = filteredEarnings.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalKm = filteredEarnings.reduce((sum, e) => sum + parseFloat(e.km), 0);
    const totalHours = filteredEarnings.reduce((sum, e) => sum + parseFloat(e.hours), 0);
    
    const profit = totalEarnings - totalExpenses;
    const earningPerKm = totalKm > 0 ? totalEarnings / totalKm : 0;
    const earningPerHour = totalHours > 0 ? totalEarnings / totalHours : 0;
    
    // Atualizar UI
    document.getElementById('stat-earnings').textContent = formatCurrency(totalEarnings);
    document.getElementById('stat-expenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('stat-profit').textContent = formatCurrency(profit);
    document.getElementById('stat-km').textContent = totalKm.toFixed(0) + ' km';
    document.getElementById('stat-hours').textContent = totalHours.toFixed(1) + ' h';
    document.getElementById('stat-per-km').textContent = formatCurrency(earningPerKm);
    document.getElementById('stat-per-hour').textContent = formatCurrency(earningPerHour);
    
    // Colorir lucro
    const profitElement = document.getElementById('stat-profit');
    profitElement.className = 'stat-value ' + (profit >= 0 ? 'green' : 'red');
    
    // Atualizar mini cards de metas
    updateMiniGoals();
}

// Salvar ganho
function saveEarning(event) {
    event.preventDefault();
    
    const earning = {
        id: Date.now(),
        date: document.getElementById('earning-date').value,
        platform: document.getElementById('earning-platform').value,
        amount: document.getElementById('earning-amount').value,
        hours: document.getElementById('earning-hours').value,
        km: document.getElementById('earning-km').value
    };
    
    earnings.push(earning);
    earnings.sort((a, b) => new Date(b.date) - new Date(a.date));
    localStorage.setItem('earnings', JSON.stringify(earnings));
    
    closeModal('earning');
    document.getElementById('form-earning').reset();
    document.getElementById('earning-date').value = new Date().toISOString().split('T')[0];
    
    updateDashboard();
    renderEarningsList();
    updateGoals();
    updateCharts();
    renderCalendar();
    
    alert('✅ Ganho registrado com sucesso!');
}

// Salvar gasto
function saveExpense(event) {
    event.preventDefault();
    
    const expense = {
        id: Date.now(),
        date: document.getElementById('expense-date').value,
        type: document.getElementById('expense-type').value,
        amount: document.getElementById('expense-amount').value,
        description: document.getElementById('expense-description').value
    };
    
    expenses.push(expense);
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    localStorage.setItem('expenses', JSON.stringify(expenses));
    
    closeModal('expense');
    document.getElementById('form-expense').reset();
    document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
    
    updateDashboard();
    renderExpensesList();
    updateGoals();
    updateCharts();
    
    alert('✅ Gasto registrado com sucesso!');
}

// Deletar ganho
function deleteEarning(id) {
    if (confirm('Tem certeza que deseja excluir este ganho?')) {
        earnings = earnings.filter(e => e.id !== id);
        localStorage.setItem('earnings', JSON.stringify(earnings));
        updateDashboard();
        renderEarningsList();
        updateGoals();
        updateCharts();
        renderCalendar();
    }
}

// Deletar gasto
function deleteExpense(id) {
    if (confirm('Tem certeza que deseja excluir este gasto?')) {
        expenses = expenses.filter(e => e.id !== id);
        localStorage.setItem('expenses', JSON.stringify(expenses));
        updateDashboard();
        renderExpensesList();
        updateGoals();
        updateCharts();
    }
}

// Renderizar lista de ganhos
function renderEarningsList() {
    const container = document.getElementById('earnings-list');
    
    if (earnings.length === 0) {
        container.innerHTML = '<div class="empty-state">📭 Nenhum ganho registrado ainda</div>';
        return;
    }
    
    container.innerHTML = earnings.map(earning => `
        <div class="history-item">
            <div class="history-item-info">
                <div class="history-item-date">${formatDate(earning.date)}</div>
                <div class="history-item-details">
                    ${earning.platform} • ${parseFloat(earning.hours).toFixed(1)}h • ${parseFloat(earning.km).toFixed(0)}km
                </div>
            </div>
            <div style="display: flex; align-items: center;">
                <div class="history-item-value green">${formatCurrency(earning.amount)}</div>
                <button class="btn-delete" onclick="deleteEarning(${earning.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Renderizar lista de gastos
function renderExpensesList() {
    const container = document.getElementById('expenses-list');
    
    if (expenses.length === 0) {
        container.innerHTML = '<div class="empty-state">📭 Nenhum gasto registrado ainda</div>';
        return;
    }
    
    container.innerHTML = expenses.map(expense => `
        <div class="history-item">
            <div class="history-item-info">
                <div class="history-item-date">${formatDate(expense.date)}</div>
                <div class="history-item-details">
                    ${expense.type}${expense.description ? ' • ' + expense.description : ''}
                </div>
            </div>
            <div style="display: flex; align-items: center;">
                <div class="history-item-value red">${formatCurrency(expense.amount)}</div>
                <button class="btn-delete" onclick="deleteExpense(${expense.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Abrir modal
function openModal(type) {
    document.getElementById('modal-' + type).classList.add('active');
}

// Fechar modal
function closeModal(type) {
    document.getElementById('modal-' + type).classList.remove('active');
}

// Fechar modal ao clicar fora
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

// Mostrar página
function showPage(page) {
    // Esconder todas as páginas
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
    });
    
    // Mostrar página selecionada
    document.getElementById('page-' + page).classList.add('active');
    
    // Atualizar navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');
    
    // Atualizar listas se necessário
    if (page === 'earnings') {
        renderEarningsList();
    } else if (page === 'expenses') {
        renderExpensesList();
    } else if (page === 'goals') {
        updateGoals();
    } else if (page === 'dashboard') {
        updateComparison();
        renderAchievements();
    }
}

// Exportar dados
function exportData() {
    const data = {
        earnings: earnings,
        expenses: expenses,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'driver-finance-backup-' + new Date().toISOString().split('T')[0] + '.json';
    link.click();
    
    URL.revokeObjectURL(url);
    
    alert('✅ Dados exportados com sucesso!');
}

// Importar dados (adicionar botão se necessário)
function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (confirm('Isso irá substituir todos os dados atuais. Continuar?')) {
                earnings = data.earnings || [];
                expenses = data.expenses || [];
                localStorage.setItem('earnings', JSON.stringify(earnings));
                localStorage.setItem('expenses', JSON.stringify(expenses));
                updateDashboard();
                renderEarningsList();
                renderExpensesList();
                alert('✅ Dados importados com sucesso!');
            }
        } catch (error) {
            alert('❌ Erro ao importar dados. Arquivo inválido.');
        }
    };
    reader.readAsText(file);
}


// ========== FUNÇÕES DE METAS ==========

// Editar meta
function editGoal(type) {
    const titles = {
        daily: 'Meta Diária',
        weekly: 'Meta Semanal',
        monthly: 'Meta Mensal',
        km: 'Meta de KM (Mensal)'
    };
    
    const labels = {
        daily: 'Valor da Meta Diária (R$)',
        weekly: 'Valor da Meta Semanal (R$)',
        monthly: 'Valor da Meta Mensal (R$)',
        km: 'Meta de KM (km)'
    };
    
    document.getElementById('goal-modal-title').textContent = titles[type];
    document.getElementById('goal-label').textContent = labels[type];
    document.getElementById('goal-type').value = type;
    document.getElementById('goal-value').value = goals[type] || '';
    
    openModal('goal');
}

// Salvar meta
function saveGoal(event) {
    event.preventDefault();
    
    const type = document.getElementById('goal-type').value;
    const value = parseFloat(document.getElementById('goal-value').value);
    
    goals[type] = value;
    localStorage.setItem('goals', JSON.stringify(goals));
    
    closeModal('goal');
    document.getElementById('form-goal').reset();
    
    updateGoals();
    
    alert('🎯 Meta definida com sucesso!');
}

// Atualizar metas
function updateGoals() {
    // Calcular valores atuais
    const dailyEarnings = filterByPeriod(earnings, 'day').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const weeklyEarnings = filterByPeriod(earnings, 'week').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const monthlyEarnings = filterByPeriod(earnings, 'month').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const monthlyKm = filterByPeriod(earnings, 'month').reduce((sum, e) => sum + parseFloat(e.km), 0);
    
    // Atualizar meta diária
    updateGoalCard('daily', goals.daily, dailyEarnings, true);
    
    // Atualizar meta semanal
    updateGoalCard('weekly', goals.weekly, weeklyEarnings, true);
    
    // Atualizar meta mensal
    updateGoalCard('monthly', goals.monthly, monthlyEarnings, true);
    
    // Atualizar meta de KM
    updateGoalCard('km', goals.km, monthlyKm, false);
}

// Atualizar card de meta
function updateGoalCard(type, target, current, isCurrency) {
    const targetElement = document.getElementById(`goal-${type}-target`);
    const currentElement = document.getElementById(`goal-${type}-current`);
    const percentElement = document.getElementById(`goal-${type}-percent`);
    const progressElement = document.getElementById(`progress-${type}`);
    const cardElement = progressElement.closest('.goal-card');
    
    // Atualizar valores
    if (isCurrency) {
        targetElement.textContent = target > 0 ? formatCurrency(target) : 'Não definida';
        currentElement.textContent = formatCurrency(current);
    } else {
        targetElement.textContent = target > 0 ? target.toFixed(0) + ' km' : 'Não definida';
        currentElement.textContent = current.toFixed(0) + ' km';
    }
    
    // Calcular progresso
    const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    percentElement.textContent = percent.toFixed(0) + '%';
    
    // Atualizar barra de progresso
    progressElement.style.width = percent + '%';
    
    // Adicionar classe de completado se atingiu a meta
    if (percent >= 100 && target > 0) {
        cardElement.classList.add('completed');
        
        // Mostrar confete (emoji) se acabou de completar
        if (!cardElement.dataset.celebrated) {
            cardElement.dataset.celebrated = 'true';
            showCelebration();
            
            // Enviar notificação
            const goalNames = {
                daily: 'Meta Diária',
                weekly: 'Meta Semanal',
                monthly: 'Meta Mensal',
                km: 'Meta de KM'
            };
            
            if (typeof sendNotification === 'function') {
                sendNotification(
                    '🎉 Meta Atingida!',
                    `Parabéns! Você completou sua ${goalNames[type]}!`
                );
            }
        }
    } else {
        cardElement.classList.remove('completed');
        cardElement.dataset.celebrated = '';
    }
    
    // Mudar cor da barra baseado no progresso
    if (percent >= 100) {
        progressElement.style.background = 'linear-gradient(90deg, #10b981, #059669)';
        progressElement.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.8)';
    } else if (percent >= 75) {
        progressElement.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
        progressElement.style.boxShadow = '0 0 20px rgba(245, 158, 11, 0.6)';
    } else if (percent >= 50) {
        progressElement.style.background = 'linear-gradient(90deg, #06b6d4, #0891b2)';
        progressElement.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.6)';
    } else {
        progressElement.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
        progressElement.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.6)';
    }
}

// Mostrar celebração
function showCelebration() {
    // Criar overlay de celebração
    const celebration = document.createElement('div');
    celebration.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 80px;
        z-index: 9999;
        animation: celebrationPop 1s ease-out;
        pointer-events: none;
    `;
    celebration.textContent = '🎉';
    
    document.body.appendChild(celebration);
    
    // Adicionar animação
    const style = document.createElement('style');
    style.textContent = `
        @keyframes celebrationPop {
            0% {
                transform: translate(-50%, -50%) scale(0) rotate(0deg);
                opacity: 0;
            }
            50% {
                transform: translate(-50%, -50%) scale(1.5) rotate(180deg);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, -50%) scale(1) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Remover após animação
    setTimeout(() => {
        celebration.remove();
        style.remove();
    }, 1000);
    
    // Vibrar se disponível
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
    }
}

// Atualizar mini cards de metas no dashboard
function updateMiniGoals() {
    const dailyEarnings = filterByPeriod(earnings, 'day').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const weeklyEarnings = filterByPeriod(earnings, 'week').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const monthlyEarnings = filterByPeriod(earnings, 'month').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    updateMiniGoalCard('daily', goals.daily, dailyEarnings);
    updateMiniGoalCard('weekly', goals.weekly, weeklyEarnings);
    updateMiniGoalCard('monthly', goals.monthly, monthlyEarnings);
}

function updateMiniGoalCard(type, target, current) {
    const valueElement = document.getElementById(`mini-goal-${type}`);
    const progressElement = document.getElementById(`mini-progress-${type}`);
    
    if (!valueElement || !progressElement) return;
    
    const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    valueElement.textContent = percent.toFixed(0) + '%';
    progressElement.style.width = percent + '%';
    
    // Mudar cor baseado no progresso
    if (percent >= 100) {
        progressElement.style.background = 'linear-gradient(90deg, #10b981, #059669)';
    } else if (percent >= 75) {
        progressElement.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
    } else if (percent >= 50) {
        progressElement.style.background = 'linear-gradient(90deg, #06b6d4, #0891b2)';
    } else {
        progressElement.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
    }
}


// ========== GRÁFICOS ==========

let earningsChartInstance = null;
let expensesChartInstance = null;
let platformsChartInstance = null;

// Configuração padrão dos gráficos
Chart.defaults.color = '#a0a0a0';
Chart.defaults.borderColor = '#222222';
Chart.defaults.font.family = 'Inter';

function createCharts() {
    createEarningsChart();
    createExpensesChart();
    createPlatformsChart();
}

// Gráfico de Ganhos vs Gastos (Linha)
function createEarningsChart() {
    const ctx = document.getElementById('earningsChart');
    if (!ctx) return;

    // Pegar últimos 7 dias
    const last7Days = [];
    const earningsData = [];
    const expensesData = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        last7Days.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
        
        const dayEarnings = earnings
            .filter(e => e.date === dateStr)
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);
        
        const dayExpenses = expenses
            .filter(e => e.date === dateStr)
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);
        
        earningsData.push(dayEarnings);
        expensesData.push(dayExpenses);
    }

    if (earningsChartInstance) {
        earningsChartInstance.destroy();
    }

    earningsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last7Days,
            datasets: [
                {
                    label: 'Ganhos',
                    data: earningsData,
                    borderColor: '#00ff88',
                    backgroundColor: 'rgba(0, 255, 136, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#00ff88',
                    pointBorderColor: '#0a0a0a',
                    pointBorderWidth: 2
                },
                {
                    label: 'Gastos',
                    data: expensesData,
                    borderColor: '#ff3366',
                    backgroundColor: 'rgba(255, 51, 102, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#ff3366',
                    pointBorderColor: '#0a0a0a',
                    pointBorderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: '#151515',
                    titleColor: '#ffffff',
                    bodyColor: '#a0a0a0',
                    borderColor: '#222222',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#222222',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#a0a0a0',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(0);
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#a0a0a0',
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de Distribuição de Gastos (Doughnut)
function createExpensesChart() {
    const ctx = document.getElementById('expensesChart');
    if (!ctx) return;

    const expensesByType = {
        'Combustível': 0,
        'Manutenção': 0,
        'Alimentação': 0,
        'Outros': 0
    };

    const monthExpenses = filterByPeriod(expenses, 'month');
    monthExpenses.forEach(expense => {
        const type = expense.type;
        if (expensesByType[type] !== undefined) {
            expensesByType[type] += parseFloat(expense.amount);
        }
    });

    if (expensesChartInstance) {
        expensesChartInstance.destroy();
    }

    expensesChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(expensesByType),
            datasets: [{
                data: Object.values(expensesByType),
                backgroundColor: [
                    '#ff3366',
                    '#ffcc00',
                    '#00d4ff',
                    '#b366ff'
                ],
                borderColor: '#0a0a0a',
                borderWidth: 3,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: '#ffffff',
                        font: {
                            size: 11,
                            weight: 'bold'
                        },
                        padding: 12,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: '#151515',
                    titleColor: '#ffffff',
                    bodyColor: '#a0a0a0',
                    borderColor: '#222222',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return context.label + ': ' + formatCurrency(context.parsed) + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de Plataformas (Bar)
function createPlatformsChart() {
    const ctx = document.getElementById('platformsChart');
    if (!ctx) return;

    const platformData = {};
    const monthEarnings = filterByPeriod(earnings, 'month');
    
    monthEarnings.forEach(earning => {
        const platform = earning.platform;
        if (!platformData[platform]) {
            platformData[platform] = 0;
        }
        platformData[platform] += parseFloat(earning.amount);
    });

    if (platformsChartInstance) {
        platformsChartInstance.destroy();
    }

    platformsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(platformData),
            datasets: [{
                label: 'Ganhos',
                data: Object.values(platformData),
                backgroundColor: '#00ff88',
                borderColor: '#00ff88',
                borderWidth: 0,
                borderRadius: 8,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#151515',
                    titleColor: '#ffffff',
                    bodyColor: '#a0a0a0',
                    borderColor: '#222222',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return 'Ganhos: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#222222',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#a0a0a0',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(0);
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#a0a0a0',
                        font: {
                            size: 11,
                            weight: 'bold'
                        }
                    }
                }
            }
        }
    });
}

// Atualizar gráficos quando dados mudarem
function updateCharts() {
    createCharts();
}

// Inicializar gráficos quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createCharts);
} else {
    createCharts();
}


// ========== NOTIFICAÇÕES AUTOMÁTICAS ==========

// Verificar se deve enviar lembrete
function checkDailyReminder() {
    const lastReminder = localStorage.getItem('last-reminder');
    const today = new Date().toISOString().split('T')[0];
    
    if (lastReminder !== today) {
        const todayEarnings = earnings.filter(e => e.date === today);
        
        // Se não registrou nada hoje e já é tarde
        const hour = new Date().getHours();
        if (todayEarnings.length === 0 && hour >= 20) {
            if (typeof sendNotification === 'function') {
                sendNotification(
                    '📝 Lembrete',
                    'Não esqueça de registrar seus ganhos de hoje!'
                );
            }
            localStorage.setItem('last-reminder', today);
        }
    }
}

// Verificar a cada hora
setInterval(checkDailyReminder, 60 * 60 * 1000);

// Verificar ao carregar
setTimeout(checkDailyReminder, 5000);


// ========== COMPARAÇÃO DE PERÍODOS ==========

function updateComparison() {
    const current = getCurrentPeriodData();
    const previous = getPreviousPeriodData();
    
    updateComparisonCard('earnings', current.earnings, previous.earnings);
    updateComparisonCard('expenses', current.expenses, previous.expenses);
    updateComparisonCard('profit', current.profit, previous.profit);
    updateComparisonCard('km', current.km, previous.km);
}

function getCurrentPeriodData() {
    const filtered = filterByPeriod(earnings, currentPeriod);
    const filteredExpenses = filterByPeriod(expenses, currentPeriod);
    
    const totalEarnings = filtered.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalKm = filtered.reduce((sum, e) => sum + parseFloat(e.km), 0);
    
    return {
        earnings: totalEarnings,
        expenses: totalExpenses,
        profit: totalEarnings - totalExpenses,
        km: totalKm
    };
}

function getPreviousPeriodData() {
    const now = new Date();
    let start, end;
    
    switch(currentPeriod) {
        case 'day':
            start = new Date(now);
            start.setDate(now.getDate() - 1);
            end = new Date(start);
            break;
        case 'week':
            start = new Date(now);
            start.setDate(now.getDate() - 7);
            end = new Date(now);
            end.setDate(now.getDate() - 1);
            break;
        case 'month':
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
    }
    
    const filtered = earnings.filter(e => {
        const date = new Date(e.date + 'T00:00:00');
        return date >= start && date <= end;
    });
    
    const filteredExpenses = expenses.filter(e => {
        const date = new Date(e.date + 'T00:00:00');
        return date >= start && date <= end;
    });
    
    const totalEarnings = filtered.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalKm = filtered.reduce((sum, e) => sum + parseFloat(e.km), 0);
    
    return {
        earnings: totalEarnings,
        expenses: totalExpenses,
        profit: totalEarnings - totalExpenses,
        km: totalKm
    };
}

function updateComparisonCard(type, current, previous) {
    const valueEl = document.getElementById(`comp-${type}`);
    const changeEl = document.getElementById(`comp-${type}-change`);
    
    if (!valueEl || !changeEl) return;
    
    const isKm = type === 'km';
    valueEl.textContent = isKm ? current.toFixed(0) + ' km' : formatCurrency(current);
    
    if (previous === 0) {
        changeEl.textContent = '-';
        changeEl.className = 'comparison-change';
        return;
    }
    
    const change = ((current - previous) / previous) * 100;
    const isPositive = change >= 0;
    
    changeEl.textContent = (isPositive ? '+' : '') + change.toFixed(1) + '%';
    changeEl.className = 'comparison-change ' + (isPositive ? 'positive' : 'negative');
}

// ========== SISTEMA DE CONQUISTAS ==========

const achievements = [
    { id: 'first-earning', icon: '🎉', name: 'Primeira Corrida', desc: 'Registre seu primeiro ganho', check: () => earnings.length >= 1 },
    { id: 'week-streak', icon: '🔥', name: 'Semana Completa', desc: 'Trabalhe 7 dias seguidos', check: () => checkWeekStreak() },
    { id: 'goal-100', icon: '🎯', name: 'Meta Atingida', desc: 'Complete uma meta 100%', check: () => checkGoalCompleted() },
    { id: 'earnings-1k', icon: '💰', name: 'Mil Reais', desc: 'Ganhe R$ 1.000 em um mês', check: () => checkMonthlyEarnings(1000) },
    { id: 'earnings-5k', icon: '💎', name: 'Cinco Mil', desc: 'Ganhe R$ 5.000 em um mês', check: () => checkMonthlyEarnings(5000) },
    { id: 'km-1000', icon: '🚗', name: 'Mil KM', desc: 'Rode 1.000 km em um mês', check: () => checkMonthlyKm(1000) },
    { id: 'profit-positive', icon: '📈', name: 'Lucro Positivo', desc: 'Tenha lucro por 7 dias seguidos', check: () => checkProfitStreak() },
];

function checkWeekStreak() {
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const hasEarning = earnings.some(e => e.date === dateStr);
        if (!hasEarning) return false;
    }
    return true;
}

function checkGoalCompleted() {
    const dailyEarnings = filterByPeriod(earnings, 'day').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const weeklyEarnings = filterByPeriod(earnings, 'week').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const monthlyEarnings = filterByPeriod(earnings, 'month').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    return (goals.daily > 0 && dailyEarnings >= goals.daily) ||
           (goals.weekly > 0 && weeklyEarnings >= goals.weekly) ||
           (goals.monthly > 0 && monthlyEarnings >= goals.monthly);
}

function checkMonthlyEarnings(target) {
    const monthlyEarnings = filterByPeriod(earnings, 'month').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    return monthlyEarnings >= target;
}

function checkMonthlyKm(target) {
    const monthlyKm = filterByPeriod(earnings, 'month').reduce((sum, e) => sum + parseFloat(e.km), 0);
    return monthlyKm >= target;
}

function checkProfitStreak() {
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayEarnings = earnings.filter(e => e.date === dateStr).reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const dayExpenses = expenses.filter(e => e.date === dateStr).reduce((sum, e) => sum + parseFloat(e.amount), 0);
        
        if (dayEarnings - dayExpenses <= 0) return false;
    }
    return true;
}

function renderAchievements() {
    const container = document.getElementById('achievements-container');
    if (!container) return;
    
    container.innerHTML = achievements.map(achievement => {
        const unlocked = achievement.check();
        return `
            <div class="achievement-badge ${unlocked ? 'unlocked' : 'locked'}" title="${achievement.desc}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.desc}</div>
            </div>
        `;
    }).join('');
}


// ========== CALENDÁRIO HEATMAP ==========

let currentCalendarDate = new Date();

function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Atualizar título
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    document.getElementById('calendar-month-year').textContent = `${monthNames[month]} ${year}`;
    
    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Calcular níveis de intensidade baseado nos ganhos do mês
    const monthEarnings = earnings.filter(e => {
        const date = new Date(e.date + 'T00:00:00');
        return date.getFullYear() === year && date.getMonth() === month;
    });
    
    // Agrupar ganhos por dia
    const earningsByDay = {};
    monthEarnings.forEach(earning => {
        const day = new Date(earning.date + 'T00:00:00').getDate();
        if (!earningsByDay[day]) {
            earningsByDay[day] = 0;
        }
        earningsByDay[day] += parseFloat(earning.amount);
    });
    
    // Encontrar máximo para calcular níveis
    const maxEarning = Math.max(...Object.values(earningsByDay), 1);
    
    // Renderizar dias
    const container = document.getElementById('calendar-days');
    container.innerHTML = '';
    
    // Dias vazios antes do primeiro dia
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        container.appendChild(emptyDay);
    }
    
    // Dias do mês
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day current-month';
        dayElement.textContent = day;
        
        // Verificar se é hoje
        if (year === today.getFullYear() && 
            month === today.getMonth() && 
            day === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        // Adicionar nível de intensidade
        const dayEarning = earningsByDay[day] || 0;
        if (dayEarning > 0) {
            dayElement.classList.add('has-data');
            
            // Calcular nível (0-5)
            const percentage = (dayEarning / maxEarning) * 100;
            let level = 0;
            if (percentage > 0) level = 1;
            if (percentage > 20) level = 2;
            if (percentage > 40) level = 3;
            if (percentage > 60) level = 4;
            if (percentage > 80) level = 5;
            
            dayElement.classList.add(`level-${level}`);
            
            // Adicionar tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'calendar-tooltip';
            tooltip.textContent = `${day}/${month + 1}: ${formatCurrency(dayEarning)}`;
            dayElement.appendChild(tooltip);
        } else {
            dayElement.classList.add('level-0');
        }
        
        // Click para ver detalhes
        dayElement.addEventListener('click', () => {
            showDayDetails(year, month, day);
        });
        
        container.appendChild(dayElement);
    }
}

function changeCalendarMonth(direction) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + direction);
    renderCalendar();
}

function showDayDetails(year, month, day) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const dayEarnings = earnings.filter(e => e.date === dateStr);
    const dayExpenses = expenses.filter(e => e.date === dateStr);
    
    const totalEarnings = dayEarnings.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalExpenses = dayExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const profit = totalEarnings - totalExpenses;
    
    let message = `📅 ${day}/${month + 1}/${year}\n\n`;
    message += `💰 Ganhos: ${formatCurrency(totalEarnings)}\n`;
    message += `📉 Gastos: ${formatCurrency(totalExpenses)}\n`;
    message += `💵 Lucro: ${formatCurrency(profit)}\n\n`;
    
    if (dayEarnings.length > 0) {
        message += `📊 Detalhes:\n`;
        dayEarnings.forEach(e => {
            message += `• ${e.platform}: ${formatCurrency(e.amount)} (${e.hours}h, ${e.km}km)\n`;
        });
    } else {
        message += `Nenhum ganho registrado neste dia.`;
    }
    
    alert(message);
}

// Renderizar calendário ao carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderCalendar);
} else {
    renderCalendar();
}


// ========== EXPORTAR PDF ==========

function exportToPDF() {
    openModal('export');
}

async function generatePDF() {
    const period = document.getElementById('export-period').value;
    const includeSummary = document.getElementById('export-summary').checked;
    const includeCharts = document.getElementById('export-charts').checked;
    const includeEarnings = document.getElementById('export-earnings').checked;
    const includeExpenses = document.getElementById('export-expenses').checked;
    const includeGoals = document.getElementById('export-goals').checked;

    // Fechar modal e mostrar loading
    closeModal('export');
    showLoading('Gerando PDF...');

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 15;
        let y = margin;

        // Cores
        const green = [0, 200, 100];
        const dark = [20, 20, 20];
        const gray = [120, 120, 120];
        const red = [220, 50, 80];
        const white = [255, 255, 255];

        // Fundo preto
        doc.setFillColor(...dark);
        doc.rect(0, 0, pageW, pageH, 'F');

        // Header
        doc.setFillColor(...green);
        doc.rect(0, 0, pageW, 28, 'F');
        doc.setTextColor(...dark);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('🚗 DRIVER FINANCE', margin, 12);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Relatório Financeiro', margin, 19);

        const periodLabels = { day: 'Hoje', week: 'Esta Semana', month: 'Este Mês', all: 'Todos os Dados' };
        const dateNow = new Date().toLocaleDateString('pt-BR');
        doc.text(`Período: ${periodLabels[period]}   |   Gerado em: ${dateNow}`, pageW - margin, 19, { align: 'right' });

        y = 38;

        // Filtrar dados
        const filteredEarnings = period === 'all' ? earnings : filterByPeriod(earnings, period === 'day' ? 'day' : period === 'week' ? 'week' : 'month');
        const filteredExpenses = period === 'all' ? expenses : filterByPeriod(expenses, period === 'day' ? 'day' : period === 'week' ? 'week' : 'month');

        const totalEarnings = filteredEarnings.reduce((s, e) => s + parseFloat(e.amount), 0);
        const totalExpenses = filteredExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);
        const totalKm = filteredEarnings.reduce((s, e) => s + parseFloat(e.km), 0);
        const totalHours = filteredEarnings.reduce((s, e) => s + parseFloat(e.hours), 0);
        const profit = totalEarnings - totalExpenses;

        // Resumo financeiro
        if (includeSummary) {
            doc.setTextColor(...green);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('RESUMO FINANCEIRO', margin, y);
            y += 7;

            // Cards de resumo
            const cards = [
                { label: 'Faturamento', value: formatCurrency(totalEarnings), color: green },
                { label: 'Gastos', value: formatCurrency(totalExpenses), color: red },
                { label: 'Lucro Líquido', value: formatCurrency(profit), color: profit >= 0 ? green : red },
                { label: 'KM Rodados', value: totalKm.toFixed(0) + ' km', color: [0, 180, 220] },
                { label: 'Horas', value: totalHours.toFixed(1) + ' h', color: [0, 180, 220] },
                { label: 'R$/KM', value: formatCurrency(totalKm > 0 ? totalEarnings / totalKm : 0), color: [255, 200, 0] },
            ];

            const cardW = (pageW - margin * 2 - 10) / 3;
            const cardH = 18;
            cards.forEach((card, i) => {
                const col = i % 3;
                const row = Math.floor(i / 3);
                const cx = margin + col * (cardW + 5);
                const cy = y + row * (cardH + 4);

                doc.setFillColor(35, 35, 35);
                doc.roundedRect(cx, cy, cardW, cardH, 2, 2, 'F');
                doc.setDrawColor(...card.color);
                doc.setLineWidth(0.5);
                doc.roundedRect(cx, cy, cardW, cardH, 2, 2, 'S');

                doc.setTextColor(...gray);
                doc.setFontSize(7);
                doc.setFont('helvetica', 'normal');
                doc.text(card.label.toUpperCase(), cx + 4, cy + 6);

                doc.setTextColor(...card.color);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(card.value, cx + 4, cy + 14);
            });

            y += Math.ceil(cards.length / 3) * (cardH + 4) + 8;
        }

        // Gráficos
        if (includeCharts) {
            const chartCanvas = document.getElementById('earningsChart');
            if (chartCanvas) {
                doc.setTextColor(...green);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('GRÁFICO — GANHOS VS GASTOS (7 DIAS)', margin, y);
                y += 5;

                const imgData = chartCanvas.toDataURL('image/png');
                const chartW = pageW - margin * 2;
                const chartH = 55;
                doc.setFillColor(35, 35, 35);
                doc.roundedRect(margin, y, chartW, chartH, 2, 2, 'F');
                doc.addImage(imgData, 'PNG', margin + 2, y + 2, chartW - 4, chartH - 4);
                y += chartH + 8;
            }
        }

        // Verificar se precisa de nova página
        const checkPage = (needed) => {
            if (y + needed > pageH - margin) {
                doc.addPage();
                doc.setFillColor(...dark);
                doc.rect(0, 0, pageW, pageH, 'F');
                y = margin;
            }
        };

        // Lista de ganhos
        if (includeEarnings && filteredEarnings.length > 0) {
            checkPage(30);
            doc.setTextColor(...green);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('GANHOS', margin, y);
            y += 7;

            // Cabeçalho da tabela
            doc.setFillColor(35, 35, 35);
            doc.rect(margin, y, pageW - margin * 2, 8, 'F');
            doc.setTextColor(...gray);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('DATA', margin + 2, y + 5.5);
            doc.text('PLATAFORMA', margin + 28, y + 5.5);
            doc.text('HORAS', margin + 70, y + 5.5);
            doc.text('KM', margin + 95, y + 5.5);
            doc.text('VALOR', pageW - margin - 2, y + 5.5, { align: 'right' });
            y += 9;

            filteredEarnings.forEach((e, i) => {
                checkPage(8);
                if (i % 2 === 0) {
                    doc.setFillColor(28, 28, 28);
                    doc.rect(margin, y - 1, pageW - margin * 2, 7, 'F');
                }
                doc.setTextColor(...white);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text(formatDate(e.date), margin + 2, y + 4);
                doc.text(e.platform, margin + 28, y + 4);
                doc.text(parseFloat(e.hours).toFixed(1) + 'h', margin + 70, y + 4);
                doc.text(parseFloat(e.km).toFixed(0) + 'km', margin + 95, y + 4);
                doc.setTextColor(...green);
                doc.text(formatCurrency(e.amount), pageW - margin - 2, y + 4, { align: 'right' });
                y += 7;
            });

            // Total
            doc.setFillColor(...green);
            doc.rect(margin, y, pageW - margin * 2, 8, 'F');
            doc.setTextColor(...dark);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('TOTAL', margin + 2, y + 5.5);
            doc.text(formatCurrency(totalEarnings), pageW - margin - 2, y + 5.5, { align: 'right' });
            y += 14;
        }

        // Lista de gastos
        if (includeExpenses && filteredExpenses.length > 0) {
            checkPage(30);
            doc.setTextColor(...red);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('GASTOS', margin, y);
            y += 7;

            doc.setFillColor(35, 35, 35);
            doc.rect(margin, y, pageW - margin * 2, 8, 'F');
            doc.setTextColor(...gray);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('DATA', margin + 2, y + 5.5);
            doc.text('TIPO', margin + 28, y + 5.5);
            doc.text('DESCRIÇÃO', margin + 70, y + 5.5);
            doc.text('VALOR', pageW - margin - 2, y + 5.5, { align: 'right' });
            y += 9;

            filteredExpenses.forEach((e, i) => {
                checkPage(8);
                if (i % 2 === 0) {
                    doc.setFillColor(28, 28, 28);
                    doc.rect(margin, y - 1, pageW - margin * 2, 7, 'F');
                }
                doc.setTextColor(...white);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text(formatDate(e.date), margin + 2, y + 4);
                doc.text(e.type, margin + 28, y + 4);
                doc.text(e.description ? e.description.substring(0, 30) : '-', margin + 70, y + 4);
                doc.setTextColor(...red);
                doc.text(formatCurrency(e.amount), pageW - margin - 2, y + 4, { align: 'right' });
                y += 7;
            });

            doc.setFillColor(...red);
            doc.rect(margin, y, pageW - margin * 2, 8, 'F');
            doc.setTextColor(...white);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('TOTAL', margin + 2, y + 5.5);
            doc.text(formatCurrency(totalExpenses), pageW - margin - 2, y + 5.5, { align: 'right' });
            y += 14;
        }

        // Metas
        if (includeGoals) {
            checkPage(50);
            doc.setTextColor(...green);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('PROGRESSO DAS METAS', margin, y);
            y += 7;

            const dailyE = filterByPeriod(earnings, 'day').reduce((s, e) => s + parseFloat(e.amount), 0);
            const weeklyE = filterByPeriod(earnings, 'week').reduce((s, e) => s + parseFloat(e.amount), 0);
            const monthlyE = filterByPeriod(earnings, 'month').reduce((s, e) => s + parseFloat(e.amount), 0);
            const monthlyKm = filterByPeriod(earnings, 'month').reduce((s, e) => s + parseFloat(e.km), 0);

            const goalItems = [
                { label: 'Meta Diária', target: goals.daily, current: dailyE, isCurrency: true },
                { label: 'Meta Semanal', target: goals.weekly, current: weeklyE, isCurrency: true },
                { label: 'Meta Mensal', target: goals.monthly, current: monthlyE, isCurrency: true },
                { label: 'Meta de KM', target: goals.km, current: monthlyKm, isCurrency: false },
            ];

            goalItems.forEach(g => {
                if (g.target <= 0) return;
                checkPage(16);

                const pct = Math.min((g.current / g.target) * 100, 100);
                const barW = pageW - margin * 2;

                doc.setTextColor(...white);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.text(g.label, margin, y + 4);
                const valText = g.isCurrency
                    ? `${formatCurrency(g.current)} / ${formatCurrency(g.target)}`
                    : `${g.current.toFixed(0)}km / ${g.target.toFixed(0)}km`;
                doc.text(valText, pageW - margin, y + 4, { align: 'right' });
                y += 7;

                // Barra de fundo
                doc.setFillColor(40, 40, 40);
                doc.roundedRect(margin, y, barW, 5, 1, 1, 'F');

                // Barra de progresso
                const barColor = pct >= 100 ? [16, 185, 129] : pct >= 75 ? [245, 158, 11] : pct >= 50 ? [6, 182, 212] : [239, 68, 68];
                doc.setFillColor(...barColor);
                doc.roundedRect(margin, y, barW * (pct / 100), 5, 1, 1, 'F');

                doc.setTextColor(...barColor);
                doc.setFontSize(8);
                doc.text(pct.toFixed(0) + '%', margin + barW / 2, y + 4, { align: 'center' });
                y += 12;
            });
        }

        // Rodapé
        const totalPages = doc.internal.getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
            doc.setPage(p);
            doc.setFillColor(35, 35, 35);
            doc.rect(0, pageH - 10, pageW, 10, 'F');
            doc.setTextColor(...gray);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.text('Driver Finance — Gestão Financeira para Motoristas', margin, pageH - 4);
            doc.text(`Página ${p} de ${totalPages}`, pageW - margin, pageH - 4, { align: 'right' });
        }

        // Salvar
        const filename = `driver-finance-${period}-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);

    } catch (err) {
        console.error('Erro ao gerar PDF:', err);
        alert('❌ Erro ao gerar PDF. Tente novamente.');
    } finally {
        hideLoading();
    }
}

function showLoading(msg) {
    let el = document.getElementById('loading-overlay');
    if (!el) {
        el = document.createElement('div');
        el.id = 'loading-overlay';
        el.style.cssText = `
            position: fixed; inset: 0; background: rgba(0,0,0,0.85);
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; z-index: 9999; gap: 16px;
        `;
        el.innerHTML = `
            <div style="font-size: 40px; animation: spin 1s linear infinite;">⚙️</div>
            <div id="loading-msg" style="color: #00ff88; font-size: 16px; font-weight: 700;"></div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        `;
        document.body.appendChild(el);
    }
    document.getElementById('loading-msg').textContent = msg;
    el.style.display = 'flex';
}

function hideLoading() {
    const el = document.getElementById('loading-overlay');
    if (el) el.style.display = 'none';
}
