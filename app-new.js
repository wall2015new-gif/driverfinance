// ========== CONFIGURAÇÃO INICIAL ==========
let currentTheme = localStorage.getItem('theme') || 'light';
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let weeklyChart = null;

// Aplicar tema ao carregar
document.addEventListener('DOMContentLoaded', function() {
    applyTheme(currentTheme);
    updateCircularProgress();
    initializeForms();
    createWeeklyChart();
    renderTransactions();
    
    // Simular dados para demonstração
    setTimeout(() => {
        animateCircularProgress('revenueCircle', 25);
        animateCircularProgress('expenseCircle', 50);
        animateCircularProgress('profitCircle', 45);
        animateCircularProgress('tripsCircle', 40);
    }, 500);
});

// ========== TEMA ==========
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    applyTheme(currentTheme);
    
    // Recriar gráfico com novo tema
    if (weeklyChart) {
        createWeeklyChart();
    }
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    } else {
        document.body.removeAttribute('data-theme');
    }
}

// ========== PROGRESSO CIRCULAR ==========
function updateCircularProgress() {
    // Calcular totais
    const revenues = transactions.filter(t => t.type === 'revenue');
    const expenses = transactions.filter(t => t.type === 'expense');
    
    const totalRevenue = revenues.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpense = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const profit = totalRevenue - totalExpense;
    const trips = revenues.length;
    
    // Atualizar valores
    document.getElementById('circularRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('circularExpense').textContent = formatCurrency(totalExpense);
    document.getElementById('circularProfit').textContent = formatCurrency(profit);
    document.getElementById('circularTrips').textContent = trips;
    
    // Atualizar card principal
    const featuredBalance = document.querySelector('.featured-card-value');
    if (featuredBalance) {
        featuredBalance.textContent = formatCurrency(profit);
    }
    
    // Atualizar mini stats (exemplo)
    const gasExpenses = expenses.filter(e => e.category === 'gas').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const maintenanceExpenses = expenses.filter(e => e.category === 'maintenance').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const appExpenses = expenses.filter(e => e.category === 'app').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const foodExpenses = expenses.filter(e => e.category === 'food').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    document.getElementById('miniGas').textContent = formatCurrency(gasExpenses);
    document.getElementById('miniMaintenance').textContent = formatCurrency(maintenanceExpenses);
    document.getElementById('miniApp').textContent = formatCurrency(appExpenses);
    document.getElementById('miniFood').textContent = formatCurrency(foodExpenses);
}

function animateCircularProgress(circleId, percent) {
    const circle = document.getElementById(circleId);
    if (!circle) return;
    
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    
    // Animar
    circle.style.strokeDashoffset = offset;
    
    // Atualizar texto de porcentagem
    const percentId = circleId.replace('Circle', 'Percent');
    const percentElement = document.getElementById(percentId);
    if (percentElement) {
        let current = 0;
        const target = percent;
        const increment = target / 50;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            percentElement.textContent = Math.round(current) + '%';
        }, 20);
    }
}

// ========== GRÁFICO SEMANAL ==========
function createWeeklyChart() {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return;
    
    // Destruir gráfico anterior se existir
    if (weeklyChart) {
        weeklyChart.destroy();
    }
    
    // Pegar últimos 7 dias
    const last7Days = [];
    const revenueData = [];
    const expenseData = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        last7Days.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
        
        const dayRevenue = transactions
            .filter(t => t.type === 'revenue' && t.date === dateStr)
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        const dayExpense = transactions
            .filter(t => t.type === 'expense' && t.date === dateStr)
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        revenueData.push(dayRevenue);
        expenseData.push(dayExpense);
    }
    
    // Cores baseadas no tema
    const isDark = currentTheme === 'dark';
    const gridColor = isDark ? '#2a2a2a' : '#e4e6eb';
    const textColor = isDark ? '#a0a0a0' : '#65676b';
    
    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: last7Days,
            datasets: [
                {
                    label: 'Receitas',
                    data: revenueData,
                    backgroundColor: '#4267f5',
                    borderRadius: 8,
                    barThickness: 20
                },
                {
                    label: 'Despesas',
                    data: expenseData,
                    backgroundColor: '#f44336',
                    borderRadius: 8,
                    barThickness: 20
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
                        color: textColor,
                        font: {
                            size: 12,
                            weight: 'bold',
                            family: 'Inter'
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? '#151515' : '#ffffff',
                    titleColor: isDark ? '#ffffff' : '#1c1e21',
                    bodyColor: textColor,
                    borderColor: gridColor,
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
                        color: gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            size: 11,
                            family: 'Inter'
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
                        color: textColor,
                        font: {
                            size: 11,
                            family: 'Inter'
                        }
                    }
                }
            }
        }
    });
}

// ========== NAVEGAÇÃO ==========
function switchPage(pageName) {
    console.log('🔄 Mudando para página:', pageName);
    
    // Esconder todas as páginas
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Mostrar página selecionada
    const targetPage = document.getElementById('page-' + pageName);
    if (targetPage) {
        targetPage.classList.add('active');
        console.log('✅ Página encontrada e ativada:', 'page-' + pageName);
    } else {
        console.error('❌ Página não encontrada:', 'page-' + pageName);
    }
    
    // Atualizar navegação
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Marcar o item clicado como ativo
    const clickedItem = document.querySelector(`.nav-item[onclick*="${pageName}"]`);
    if (clickedItem) {
        clickedItem.classList.add('active');
    }
    
    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Atualizar conteúdo específico da página
    if (pageName === 'goals') {
        console.log('📊 Atualizando metas...');
        updateGoals();
    } else if (pageName === 'reports') {
        console.log('📈 Atualizando relatórios...');
        updateReports();
        renderCalendar();
    } else if (pageName === 'history') {
        console.log('📜 Atualizando histórico...');
        renderTransactions();
    }
}

// ========== MODALS ==========
function openModal(type) {
    const modal = document.getElementById(type + 'Modal');
    if (modal) {
        modal.classList.add('active');
        
        // Definir data de hoje
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById(type + 'Date');
        if (dateInput) {
            dateInput.value = today;
        }
    }
}

function closeModal(type) {
    const modal = document.getElementById(type + 'Modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function closeModalOnOutsideClick(event, type) {
    if (event.target.classList.contains('modal')) {
        closeModal(type);
    }
}

// ========== FORMULÁRIOS ==========
function initializeForms() {
    const today = new Date().toISOString().split('T')[0];
    const revenueDate = document.getElementById('revenueDate');
    const expenseDate = document.getElementById('expenseDate');
    
    if (revenueDate) revenueDate.value = today;
    if (expenseDate) expenseDate.value = today;
}

function addRevenue(event) {
    event.preventDefault();
    
    const transaction = {
        id: Date.now(),
        type: 'revenue',
        amount: document.getElementById('revenueValue').value,
        description: document.getElementById('revenueDesc').value,
        date: document.getElementById('revenueDate').value,
        category: 'revenue'
    };
    
    transactions.push(transaction);
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    closeModal('revenue');
    event.target.reset();
    initializeForms();
    
    updateCircularProgress();
    createWeeklyChart();
    renderTransactions();
    
    // Feedback visual
    showNotification('✅ Receita adicionada com sucesso!', 'success');
}

function addExpense(event) {
    event.preventDefault();
    
    const transaction = {
        id: Date.now(),
        type: 'expense',
        amount: document.getElementById('expenseValue').value,
        description: document.getElementById('expenseDesc').value,
        date: document.getElementById('expenseDate').value,
        category: document.getElementById('expenseCategory').value
    };
    
    transactions.push(transaction);
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    closeModal('expense');
    event.target.reset();
    initializeForms();
    
    updateCircularProgress();
    createWeeklyChart();
    renderTransactions();
    
    // Feedback visual
    showNotification('✅ Despesa adicionada com sucesso!', 'success');
}

// ========== HISTÓRICO ==========
function renderTransactions() {
    const container = document.getElementById('transactionsList');
    if (!container) return;
    
    if (transactions.length === 0) {
        container.innerHTML = '<div class="empty-state">📭 Nenhuma transação registrada ainda</div>';
        return;
    }
    
    const categoryIcons = {
        revenue: '💵',
        gas: '⛽',
        maintenance: '🔧',
        app: '📱',
        food: '🍔',
        other: '📦'
    };
    
    const categoryNames = {
        revenue: 'Receita',
        gas: 'Combustível',
        maintenance: 'Manutenção',
        app: 'Taxas de App',
        food: 'Alimentação',
        other: 'Outros'
    };
    
    container.innerHTML = transactions.map(transaction => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-date">${formatDate(transaction.date)}</div>
                <div class="transaction-desc">${categoryIcons[transaction.category] || '💰'} ${transaction.description}</div>
                <div class="transaction-category">${categoryNames[transaction.category] || 'Outros'}</div>
            </div>
            <div class="transaction-value ${transaction.type}">
                ${transaction.type === 'revenue' ? '+' : '-'} ${formatCurrency(transaction.amount)}
            </div>
            <div class="transaction-actions">
                <button class="btn-icon" onclick="deleteTransaction(${transaction.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

function deleteTransaction(id) {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
        transactions = transactions.filter(t => t.id !== id);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        
        updateCircularProgress();
        createWeeklyChart();
        renderTransactions();
        
        showNotification('✅ Transação excluída com sucesso!', 'success');
    }
}

function filterTransactions() {
    const typeFilter = document.getElementById('filterType').value;
    const periodFilter = document.getElementById('filterPeriod').value;
    
    // Implementar filtros aqui
    console.log('Filtros:', typeFilter, periodFilter);
    renderTransactions();
}

// ========== FORMATAÇÃO ==========
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

// ========== NOTIFICAÇÕES ==========
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#00c853' : '#4267f5'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========== EXPORTAR PDF ==========
function exportPDF() {
    showNotification('🚧 Funcionalidade de exportação em desenvolvimento!', 'info');
}

// ========== REGISTRO PWA ==========
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('✅ Service Worker registrado:', registration);
                
                // Verificar atualizações
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('🔄 Nova versão encontrada, atualizando...');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'activated') {
                            console.log('✅ Nova versão ativada');
                            // Recarregar página automaticamente
                            if (confirm('🔄 Nova versão disponível! Recarregar agora?')) {
                                window.location.reload();
                            }
                        }
                    });
                });
                
                // Verificar se há um service worker esperando
                if (registration.waiting) {
                    console.log('⚠️ Service Worker esperando, ativando...');
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
            })
            .catch(error => {
                console.log('❌ Erro ao registrar Service Worker:', error);
            });
        
        // Recarregar quando o service worker assumir controle
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                console.log('🔄 Service Worker assumiu controle, recarregando...');
                window.location.reload();
            }
        });
    });
}

// ========== ANIMAÇÕES CSS ==========
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('🚗 Driver Finance carregado com sucesso!');

// ========== METAS ==========
let goals = JSON.parse(localStorage.getItem('goals')) || {
    daily: 200,
    weekly: 1400,
    monthly: 6000,
    trips: 200
};

function editGoal(type) {
    const titles = {
        daily: 'Meta Diária',
        weekly: 'Meta Semanal',
        monthly: 'Meta Mensal',
        trips: 'Meta de Viagens'
    };
    
    const labels = {
        daily: 'Valor da Meta Diária (R$)',
        weekly: 'Valor da Meta Semanal (R$)',
        monthly: 'Valor da Meta Mensal (R$)',
        trips: 'Número de Viagens'
    };
    
    document.getElementById('goalModalTitle').textContent = titles[type];
    document.getElementById('goalLabel').textContent = labels[type];
    document.getElementById('goalType').value = type;
    document.getElementById('goalValue').value = goals[type] || '';
    
    openModal('goal');
}

function saveGoal(event) {
    event.preventDefault();
    
    const type = document.getElementById('goalType').value;
    const value = parseFloat(document.getElementById('goalValue').value);
    
    goals[type] = value;
    localStorage.setItem('goals', JSON.stringify(goals));
    
    closeModal('goal');
    event.target.reset();
    
    updateGoals();
    showNotification('🎯 Meta definida com sucesso!', 'success');
}

function updateGoals() {
    // Calcular valores atuais
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date();
    monthStart.setDate(1);
    
    const dailyRevenue = transactions
        .filter(t => t.type === 'revenue' && t.date === today)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const weeklyRevenue = transactions
        .filter(t => t.type === 'revenue' && new Date(t.date) >= weekStart)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const monthlyRevenue = transactions
        .filter(t => t.type === 'revenue' && new Date(t.date) >= monthStart)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const monthlyTrips = transactions
        .filter(t => t.type === 'revenue' && new Date(t.date) >= monthStart)
        .length;
    
    // Atualizar metas
    updateGoalCard('Daily', goals.daily, dailyRevenue, true);
    updateGoalCard('Weekly', goals.weekly, weeklyRevenue, true);
    updateGoalCard('Monthly', goals.monthly, monthlyRevenue, true);
    updateGoalCard('Trips', goals.trips, monthlyTrips, false);
    
    // Atualizar conquistas
    renderAchievements();
}

function updateGoalCard(type, target, current, isCurrency) {
    const targetEl = document.getElementById(`goal${type}Target`);
    const currentEl = document.getElementById(`goal${type}Current`);
    const percentEl = document.getElementById(`goal${type}Percent`);
    const progressEl = document.getElementById(`progress${type}`);
    
    if (!targetEl || !currentEl || !percentEl || !progressEl) return;
    
    // Atualizar valores
    if (isCurrency) {
        targetEl.textContent = formatCurrency(target);
        currentEl.textContent = formatCurrency(current);
    } else {
        targetEl.textContent = target + ' viagens';
        currentEl.textContent = current + ' viagens';
    }
    
    // Calcular progresso
    const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    percentEl.textContent = percent.toFixed(0) + '%';
    
    // Atualizar barra
    progressEl.style.width = percent + '%';
    
    // Mudar cor baseado no progresso
    if (percent >= 100) {
        progressEl.style.background = '#00c853';
        progressEl.style.boxShadow = '0 0 10px rgba(0, 200, 83, 0.5)';
    } else if (percent >= 75) {
        progressEl.style.background = '#ffc107';
        progressEl.style.boxShadow = '0 0 10px rgba(255, 193, 7, 0.5)';
    } else if (percent >= 50) {
        progressEl.style.background = '#4267f5';
        progressEl.style.boxShadow = '0 0 10px rgba(66, 103, 245, 0.5)';
    } else {
        progressEl.style.background = '#f44336';
        progressEl.style.boxShadow = '0 0 10px rgba(244, 67, 54, 0.5)';
    }
}

// ========== CONQUISTAS ==========
function renderAchievements() {
    const container = document.getElementById('achievementsList');
    if (!container) return;
    
    const totalRevenue = transactions
        .filter(t => t.type === 'revenue')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalTrips = transactions.filter(t => t.type === 'revenue').length;
    
    const achievements = [
        { icon: '🎯', name: 'Primeira Corrida', desc: 'Complete sua primeira corrida', unlocked: totalTrips >= 1 },
        { icon: '💯', name: '100 Corridas', desc: 'Complete 100 corridas', unlocked: totalTrips >= 100 },
        { icon: '💰', name: 'Primeiro Mil', desc: 'Ganhe R$ 1.000', unlocked: totalRevenue >= 1000 },
        { icon: '🏆', name: 'Cinco Mil', desc: 'Ganhe R$ 5.000', unlocked: totalRevenue >= 5000 },
        { icon: '⭐', name: 'Dez Mil', desc: 'Ganhe R$ 10.000', unlocked: totalRevenue >= 10000 },
        { icon: '🔥', name: 'Sequência 7 Dias', desc: 'Trabalhe 7 dias seguidos', unlocked: false }
    ];
    
    container.innerHTML = achievements.map(achievement => `
        <div class="achievement-badge ${achievement.unlocked ? 'unlocked' : 'locked'}">
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-desc">${achievement.desc}</div>
        </div>
    `).join('');
}

// ========== RELATÓRIOS ==========
let expensePieChart = null;
let monthlyLineChart = null;

function updateReports() {
    const revenues = transactions.filter(t => t.type === 'revenue');
    const expenses = transactions.filter(t => t.type === 'expense');
    
    const totalRevenue = revenues.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpense = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const profit = totalRevenue - totalExpense;
    
    // Atualizar resumo
    const reportRevenue = document.getElementById('reportRevenue');
    const reportExpense = document.getElementById('reportExpense');
    const reportProfit = document.getElementById('reportProfit');
    
    if (reportRevenue) reportRevenue.textContent = formatCurrency(totalRevenue);
    if (reportExpense) reportExpense.textContent = formatCurrency(totalExpense);
    if (reportProfit) reportProfit.textContent = formatCurrency(profit);
    
    // Atualizar análise
    const avgDaily = totalRevenue / Math.max(1, revenues.length);
    const totalTrips = revenues.length;
    const avgTicket = totalRevenue / Math.max(1, totalTrips);
    
    const avgDailyEl = document.getElementById('avgDaily');
    const totalTripsEl = document.getElementById('totalTrips');
    const avgTicketEl = document.getElementById('avgTicket');
    
    if (avgDailyEl) avgDailyEl.textContent = formatCurrency(avgDaily);
    if (totalTripsEl) totalTripsEl.textContent = totalTrips;
    if (avgTicketEl) avgTicketEl.textContent = formatCurrency(avgTicket);
    
    // Criar gráficos
    createExpensePieChart();
    createMonthlyLineChart();
}

function createExpensePieChart() {
    const ctx = document.getElementById('expensePieChart');
    if (!ctx) return;
    
    if (expensePieChart) {
        expensePieChart.destroy();
    }
    
    const expenses = transactions.filter(t => t.type === 'expense');
    const expensesByCategory = {
        'Combustível': 0,
        'Manutenção': 0,
        'Taxas de App': 0,
        'Alimentação': 0,
        'Outros': 0
    };
    
    expenses.forEach(expense => {
        const categoryMap = {
            gas: 'Combustível',
            maintenance: 'Manutenção',
            app: 'Taxas de App',
            food: 'Alimentação',
            other: 'Outros'
        };
        const category = categoryMap[expense.category] || 'Outros';
        expensesByCategory[category] += parseFloat(expense.amount);
    });
    
    const isDark = currentTheme === 'dark';
    const textColor = isDark ? '#a0a0a0' : '#65676b';
    
    expensePieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(expensesByCategory),
            datasets: [{
                data: Object.values(expensesByCategory),
                backgroundColor: [
                    '#f44336',
                    '#ffc107',
                    '#4267f5',
                    '#00c853',
                    '#9c27b0'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        font: {
                            size: 12,
                            family: 'Inter'
                        },
                        padding: 15
                    }
                },
                tooltip: {
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

function createMonthlyLineChart() {
    const ctx = document.getElementById('monthlyLineChart');
    if (!ctx) return;
    
    if (monthlyLineChart) {
        monthlyLineChart.destroy();
    }
    
    // Pegar últimos 30 dias
    const last30Days = [];
    const revenueData = [];
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        last30Days.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
        
        const dayRevenue = transactions
            .filter(t => t.type === 'revenue' && t.date === dateStr)
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        revenueData.push(dayRevenue);
    }
    
    const isDark = currentTheme === 'dark';
    const gridColor = isDark ? '#2a2a2a' : '#e4e6eb';
    const textColor = isDark ? '#a0a0a0' : '#65676b';
    
    monthlyLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last30Days,
            datasets: [{
                label: 'Receita Diária',
                data: revenueData,
                borderColor: '#4267f5',
                backgroundColor: 'rgba(66, 103, 245, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
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
                    callbacks: {
                        label: function(context) {
                            return 'Receita: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: textColor,
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
                        color: textColor,
                        maxTicksLimit: 10
                    }
                }
            }
        }
    });
}

// ========== CALENDÁRIO ==========
let currentCalendarDate = new Date();

function renderCalendar() {
    const container = document.getElementById('calendarGrid');
    if (!container) return;
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Atualizar título
    const monthEl = document.getElementById('calendarMonth');
    if (monthEl) {
        monthEl.textContent = currentCalendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
    
    // Dias da semana
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    let html = '';
    
    // Cabeçalho dos dias da semana
    weekdays.forEach(day => {
        html += `<div class="calendar-weekday">${day}</div>`;
    });
    
    // Dias vazios antes do primeiro dia
    for (let i = 0; i < startingDayOfWeek; i++) {
        html += '<div class="calendar-day other-month"></div>';
    }
    
    // Dias do mês
    const today = new Date().toISOString().split('T')[0];
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayRevenue = transactions
            .filter(t => t.type === 'revenue' && t.date === dateStr)
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        const dayExpense = transactions
            .filter(t => t.type === 'expense' && t.date === dateStr)
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        let classes = 'calendar-day';
        if (dateStr === today) classes += ' today';
        if (dayRevenue > 0 && dayExpense > 0) classes += ' has-both';
        else if (dayRevenue > 0) classes += ' has-revenue';
        else if (dayExpense > 0) classes += ' has-expense';
        
        html += `
            <div class="${classes}">
                <div class="calendar-day-number">${day}</div>
                ${dayRevenue > 0 ? `<div class="calendar-day-value">${formatCurrency(dayRevenue)}</div>` : ''}
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function previousMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
}

// ========== INICIALIZAÇÃO COMPLETA ==========

console.log('🎯 Metas, Relatórios e Calendário carregados!');

// ========== EXPORTAÇÃO ==========

function openExportMenu() {
    openModal('export');
}

// Exportar para PDF
function exportToPDF() {
    showNotification('📄 Gerando PDF...', 'info');
    
    setTimeout(() => {
        // Criar conteúdo do PDF
        const revenues = transactions.filter(t => t.type === 'revenue');
        const expenses = transactions.filter(t => t.type === 'expense');
        
        const totalRevenue = revenues.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalExpense = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const profit = totalRevenue - totalExpense;
        
        // Criar documento
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Título
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('Driver Finance - Relatório', 105, 20, { align: 'center' });
        
        // Data
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 28, { align: 'center' });
        
        // Resumo
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Resumo Financeiro', 20, 45);
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text(`Receita Total: ${formatCurrency(totalRevenue)}`, 20, 55);
        doc.text(`Despesa Total: ${formatCurrency(totalExpense)}`, 20, 62);
        doc.text(`Lucro Líquido: ${formatCurrency(profit)}`, 20, 69);
        doc.text(`Total de Viagens: ${revenues.length}`, 20, 76);
        
        // Transações Recentes
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Últimas Transações', 20, 90);
        
        let y = 100;
        const recentTransactions = transactions.slice(0, 15);
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        
        recentTransactions.forEach(transaction => {
            const date = formatDate(transaction.date);
            const type = transaction.type === 'revenue' ? 'Receita' : 'Despesa';
            const amount = formatCurrency(transaction.amount);
            
            doc.text(`${date} - ${type}: ${transaction.description} - ${amount}`, 20, y);
            y += 7;
            
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
        });
        
        // Salvar
        doc.save(`driver-finance-relatorio-${new Date().toISOString().split('T')[0]}.pdf`);
        
        closeModal('export');
        showNotification('✅ PDF exportado com sucesso!', 'success');
    }, 500);
}

// Exportar para Excel (CSV)
function exportToExcel() {
    showNotification('📊 Gerando planilha...', 'info');
    
    setTimeout(() => {
        // Criar CSV
        let csv = 'Data,Tipo,Categoria,Descrição,Valor\n';
        
        transactions.forEach(transaction => {
            const date = transaction.date;
            const type = transaction.type === 'revenue' ? 'Receita' : 'Despesa';
            const category = transaction.category;
            const description = transaction.description.replace(/,/g, ';');
            const amount = transaction.amount;
            
            csv += `${date},${type},${category},${description},${amount}\n`;
        });
        
        // Criar blob e download
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `driver-finance-transacoes-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        closeModal('export');
        showNotification('✅ Planilha exportada com sucesso!', 'success');
    }, 500);
}

// ========== BACKUP ==========

// Exportar Backup
function exportBackup() {
    showNotification('💾 Criando backup...', 'info');
    
    setTimeout(() => {
        const backup = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            data: {
                transactions: transactions,
                goals: goals,
                theme: currentTheme,
                notifications: {
                    daily: localStorage.getItem('notification_daily') === 'true',
                    goal: localStorage.getItem('notification_goal') === 'true',
                    weekly: localStorage.getItem('notification_weekly') === 'true'
                }
            }
        };
        
        const dataStr = JSON.stringify(backup, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `driver-finance-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        
        closeModal('export');
        showNotification('✅ Backup criado com sucesso!', 'success');
    }, 500);
}

// Importar Backup
function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            
            if (!backup.data || !backup.data.transactions) {
                throw new Error('Arquivo de backup inválido');
            }
            
            if (confirm('⚠️ Isso irá substituir todos os dados atuais. Deseja continuar?')) {
                // Restaurar dados
                transactions = backup.data.transactions || [];
                goals = backup.data.goals || { daily: 200, weekly: 1400, monthly: 6000, trips: 200 };
                
                // Salvar no localStorage
                localStorage.setItem('transactions', JSON.stringify(transactions));
                localStorage.setItem('goals', JSON.stringify(goals));
                
                if (backup.data.theme) {
                    currentTheme = backup.data.theme;
                    localStorage.setItem('theme', currentTheme);
                    applyTheme(currentTheme);
                }
                
                if (backup.data.notifications) {
                    localStorage.setItem('notification_daily', backup.data.notifications.daily);
                    localStorage.setItem('notification_goal', backup.data.notifications.goal);
                    localStorage.setItem('notification_weekly', backup.data.notifications.weekly);
                }
                
                // Atualizar interface
                updateCircularProgress();
                createWeeklyChart();
                renderTransactions();
                updateGoals();
                
                closeModal('export');
                showNotification('✅ Backup restaurado com sucesso!', 'success');
                
                // Recarregar página após 2 segundos
                setTimeout(() => {
                    location.reload();
                }, 2000);
            }
        } catch (error) {
            console.error('Erro ao importar backup:', error);
            showNotification('❌ Erro ao importar backup. Arquivo inválido.', 'error');
        }
    };
    
    reader.readAsText(file);
    
    // Limpar input
    event.target.value = '';
}

// ========== NOTIFICAÇÕES ==========

let notificationSettings = {
    daily: localStorage.getItem('notification_daily') === 'true',
    goal: localStorage.getItem('notification_goal') === 'true',
    weekly: localStorage.getItem('notification_weekly') === 'true'
};

// Solicitar permissão de notificações
function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showNotification('❌ Seu navegador não suporta notificações', 'error');
        return;
    }
    
    if (Notification.permission === 'granted') {
        showNotification('✅ Notificações já estão ativadas!', 'success');
        sendTestNotification();
        return;
    }
    
    if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showNotification('✅ Notificações ativadas com sucesso!', 'success');
                sendTestNotification();
            } else {
                showNotification('❌ Permissão de notificação negada', 'error');
            }
        });
    } else {
        showNotification('❌ Notificações bloqueadas. Ative nas configurações do navegador.', 'error');
    }
}

// Enviar notificação de teste
function sendTestNotification() {
    if (Notification.permission === 'granted') {
        new Notification('🚗 Driver Finance', {
            body: 'Notificações ativadas com sucesso!',
            icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"%3E%3Crect width="512" height="512" rx="100" fill="%234267f5"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="280"%3E🚗%3C/text%3E%3C/svg%3E',
            badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="64"%3E🚗%3C/text%3E%3C/svg%3E',
            vibrate: [200, 100, 200]
        });
    }
}

// Toggle notificação
function toggleNotification(type) {
    const checkbox = document.getElementById(type === 'daily' ? 'dailyReminder' : type === 'goal' ? 'goalNotification' : 'weeklyReport');
    const enabled = checkbox.checked;
    
    notificationSettings[type] = enabled;
    localStorage.setItem(`notification_${type}`, enabled);
    
    if (enabled && Notification.permission !== 'granted') {
        requestNotificationPermission();
    }
    
    showNotification(enabled ? '✅ Notificação ativada' : '❌ Notificação desativada', 'info');
}

// Carregar configurações de notificação
function loadNotificationSettings() {
    const dailyCheckbox = document.getElementById('dailyReminder');
    const goalCheckbox = document.getElementById('goalNotification');
    const weeklyCheckbox = document.getElementById('weeklyReport');
    
    if (dailyCheckbox) dailyCheckbox.checked = notificationSettings.daily;
    if (goalCheckbox) goalCheckbox.checked = notificationSettings.goal;
    if (weeklyCheckbox) weeklyCheckbox.checked = notificationSettings.weekly;
}

// Verificar metas e enviar notificação
function checkGoalsAndNotify() {
    if (!notificationSettings.goal || Notification.permission !== 'granted') return;
    
    const today = new Date().toISOString().split('T')[0];
    const dailyRevenue = transactions
        .filter(t => t.type === 'revenue' && t.date === today)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    if (dailyRevenue >= goals.daily) {
        const lastNotification = localStorage.getItem('last_goal_notification');
        if (lastNotification !== today) {
            new Notification('🎯 Meta Diária Atingida!', {
                body: `Parabéns! Você atingiu sua meta de ${formatCurrency(goals.daily)}!`,
                icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"%3E%3Crect width="512" height="512" rx="100" fill="%2300c853"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="280"%3E🎯%3C/text%3E%3C/svg%3E',
                vibrate: [200, 100, 200, 100, 200]
            });
            localStorage.setItem('last_goal_notification', today);
        }
    }
}

// Lembrete diário
function scheduleDailyReminder() {
    if (!notificationSettings.daily || Notification.permission !== 'granted') return;
    
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(20, 0, 0, 0); // 20:00
    
    if (now > reminderTime) {
        reminderTime.setDate(reminderTime.getDate() + 1);
    }
    
    const timeUntilReminder = reminderTime - now;
    
    setTimeout(() => {
        new Notification('🚗 Driver Finance', {
            body: 'Não esqueça de registrar suas corridas de hoje!',
            icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"%3E%3Crect width="512" height="512" rx="100" fill="%234267f5"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="280"%3E🚗%3C/text%3E%3C/svg%3E',
            vibrate: [200, 100, 200]
        });
        
        // Reagendar para o próximo dia
        scheduleDailyReminder();
    }, timeUntilReminder);
}

// Inicializar notificações
document.addEventListener('DOMContentLoaded', function() {
    loadNotificationSettings();
    scheduleDailyReminder();
    
    // Verificar metas a cada transação
    const originalAddRevenue = addRevenue;
    addRevenue = function(event) {
        originalAddRevenue.call(this, event);
        setTimeout(checkGoalsAndNotify, 1000);
    };
});

// Atualizar showNotification para suportar tipo error
const originalShowNotification = showNotification;
showNotification = function(message, type = 'info') {
    const notification = document.createElement('div');
    const colors = {
        success: '#00c853',
        error: '#f44336',
        info: '#4267f5'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
};

console.log('📤 Exportação, Backup e Notificações carregados!');


// ========== FUNÇÕES DE DESENVOLVIMENTO ==========

// Limpar cache manualmente (útil para desenvolvimento)
function clearCache() {
    if (confirm('⚠️ Isso irá limpar todo o cache. Continuar?')) {
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    console.log('Removendo cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            // Desregistrar service worker
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(registration => {
                        registration.unregister();
                    });
                });
            }
            
            showNotification('✅ Cache limpo! Recarregando...', 'success');
            setTimeout(() => {
                window.location.reload(true);
            }, 1000);
        });
    }
}

// Adicionar atalho de teclado para limpar cache (Ctrl+Shift+C)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        clearCache();
    }
});

console.log('💡 Dica: Pressione Ctrl+Shift+C para limpar o cache');


// ========== ZERAR DADOS ==========

function resetAllData() {
    // Confirmação tripla para segurança
    const confirmation1 = confirm('⚠️ ATENÇÃO! Isso irá apagar TODOS os seus dados permanentemente.\n\nDeseja continuar?');
    
    if (!confirmation1) {
        return;
    }
    
    const confirmation2 = confirm('⚠️ ÚLTIMA CHANCE!\n\nTodos os dados serão perdidos:\n• Transações\n• Metas\n• Configurações\n\nTem certeza absoluta?');
    
    if (!confirmation2) {
        return;
    }
    
    // Digite "ZERAR" para confirmar
    const finalConfirmation = prompt('Digite "ZERAR" (em maiúsculas) para confirmar:');
    
    if (finalConfirmation !== 'ZERAR') {
        showNotification('❌ Operação cancelada', 'info');
        return;
    }
    
    // Zerar todos os dados
    try {
        // Limpar localStorage
        localStorage.clear();
        
        // Resetar variáveis
        transactions = [];
        goals = {
            daily: 200,
            weekly: 1400,
            monthly: 6000,
            trips: 200
        };
        notificationSettings = {
            daily: false,
            goal: true,
            weekly: false
        };
        currentTheme = 'light';
        
        // Salvar valores padrão
        localStorage.setItem('transactions', JSON.stringify(transactions));
        localStorage.setItem('goals', JSON.stringify(goals));
        localStorage.setItem('theme', currentTheme);
        
        showNotification('✅ Todos os dados foram zerados!', 'success');
        
        // Fechar modal
        closeModal('notifications');
        
        // Recarregar página após 2 segundos
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('Erro ao zerar dados:', error);
        showNotification('❌ Erro ao zerar dados', 'error');
    }
}

// Adicionar atalho de teclado para abrir configurações (Ctrl+Shift+S)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        openModal('notifications');
    }
});

console.log('🗑️ Função de reset de dados carregada');
console.log('💡 Dica: Pressione Ctrl+Shift+S para abrir configurações');


// ========== BACKUP AUTOMÁTICO ==========

// Verificar se precisa fazer backup
function checkAutoBackup() {
    const lastBackup = localStorage.getItem('last_backup_date');
    const today = new Date().toISOString().split('T')[0];
    
    if (!lastBackup) {
        // Primeira vez, agendar para daqui 7 dias
        localStorage.setItem('last_backup_date', today);
        return;
    }
    
    const lastBackupDate = new Date(lastBackup);
    const daysSinceBackup = Math.floor((new Date() - lastBackupDate) / (1000 * 60 * 60 * 24));
    
    // Se passou 7 dias, sugerir backup
    if (daysSinceBackup >= 7 && transactions.length > 0) {
        setTimeout(() => {
            if (confirm('📅 Já faz 7 dias desde o último backup!\n\n💾 Deseja fazer backup dos seus dados agora?')) {
                exportBackup();
                localStorage.setItem('last_backup_date', today);
            } else {
                // Perguntar novamente amanhã
                localStorage.setItem('last_backup_date', new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
            }
        }, 3000); // Espera 3 segundos após carregar
    }
}

// Verificar ao carregar
document.addEventListener('DOMContentLoaded', function() {
    checkAutoBackup();
});

// Mostrar última vez que fez backup
function showBackupStatus() {
    const lastBackup = localStorage.getItem('last_backup_date');
    if (lastBackup) {
        const date = new Date(lastBackup);
        const days = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
        console.log(`💾 Último backup: há ${days} dia(s)`);
        
        if (days >= 7) {
            console.warn('⚠️ Faça um backup! Já passou mais de 7 dias.');
        }
    } else {
        console.log('💾 Nenhum backup feito ainda');
    }
}

// Adicionar informação de backup no console
setTimeout(showBackupStatus, 2000);

console.log('💾 Sistema de backup automático ativado!');
console.log('📅 Você será lembrado a cada 7 dias para fazer backup');


// ========== PROMPT DE INSTALAÇÃO PWA ==========

let deferredPrompt;
let installPromptShown = localStorage.getItem('install_prompt_shown') === 'true';

// Capturar o evento beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('📱 Evento beforeinstallprompt capturado');
    
    // Prevenir o prompt automático do navegador
    e.preventDefault();
    
    // Guardar o evento para usar depois
    deferredPrompt = e;
    
    // Verificar se já mostrou o prompt antes
    if (!installPromptShown) {
        // Aguardar 3 segundos antes de mostrar
        setTimeout(() => {
            showInstallPrompt();
        }, 3000);
    }
});

// Mostrar prompt de instalação personalizado
function showInstallPrompt() {
    // Verificar se está em dispositivo móvel
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) {
        console.log('💻 Desktop detectado, não mostrando prompt de instalação');
        return;
    }
    
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('✅ App já está instalado');
        return;
    }
    
    // Criar modal de instalação
    const installModal = document.createElement('div');
    installModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(10px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: fadeIn 0.3s ease-out;
    `;
    
    installModal.innerHTML = `
        <div style="
            background: var(--bg-card);
            border: 2px solid var(--accent-blue);
            border-radius: 20px;
            padding: 32px;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(66, 103, 245, 0.3);
            animation: slideUpModal 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            text-align: center;
        ">
            <div style="font-size: 64px; margin-bottom: 16px;">📱</div>
            <h2 style="
                font-size: 24px;
                font-weight: 800;
                color: var(--text-primary);
                margin-bottom: 12px;
            ">Instalar Driver Finance</h2>
            <p style="
                font-size: 15px;
                color: var(--text-secondary);
                margin-bottom: 24px;
                line-height: 1.5;
            ">
                Instale o app na sua tela inicial para acesso rápido e uso offline!
            </p>
            <div style="
                background: var(--bg-tertiary);
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 24px;
                text-align: left;
            ">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                    <span style="font-size: 20px;">✅</span>
                    <span style="font-size: 14px; color: var(--text-primary); font-weight: 600;">Funciona offline</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                    <span style="font-size: 20px;">⚡</span>
                    <span style="font-size: 14px; color: var(--text-primary); font-weight: 600;">Acesso instantâneo</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 20px;">🔔</span>
                    <span style="font-size: 14px; color: var(--text-primary); font-weight: 600;">Receba notificações</span>
                </div>
            </div>
            <button id="installBtn" style="
                width: 100%;
                padding: 16px;
                background: var(--accent-blue);
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 700;
                cursor: pointer;
                margin-bottom: 12px;
                transition: all 0.3s;
            ">
                📲 Instalar Agora
            </button>
            <button id="laterBtn" style="
                width: 100%;
                padding: 12px;
                background: transparent;
                color: var(--text-secondary);
                border: none;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            ">
                Agora não
            </button>
        </div>
    `;
    
    document.body.appendChild(installModal);
    
    // Botão Instalar
    const installBtn = document.getElementById('installBtn');
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            // Mostrar o prompt de instalação
            deferredPrompt.prompt();
            
            // Aguardar a escolha do usuário
            const { outcome } = await deferredPrompt.userChoice;
            
            console.log(`👤 Usuário escolheu: ${outcome}`);
            
            if (outcome === 'accepted') {
                console.log('✅ App instalado com sucesso!');
                showNotification('✅ App instalado! Abra pela tela inicial', 'success');
            } else {
                console.log('❌ Instalação cancelada');
            }
            
            // Limpar o prompt
            deferredPrompt = null;
        }
        
        // Marcar que já mostrou o prompt
        localStorage.setItem('install_prompt_shown', 'true');
        installPromptShown = true;
        
        // Remover modal
        installModal.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => installModal.remove(), 300);
    });
    
    // Botão Agora não
    const laterBtn = document.getElementById('laterBtn');
    laterBtn.addEventListener('click', () => {
        console.log('⏰ Usuário escolheu instalar depois');
        
        // Marcar que já mostrou o prompt
        localStorage.setItem('install_prompt_shown', 'true');
        installPromptShown = true;
        
        // Remover modal
        installModal.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => installModal.remove(), 300);
        
        showNotification('💡 Você pode instalar depois pelo menu do navegador', 'info');
    });
    
    // Fechar ao clicar fora
    installModal.addEventListener('click', (e) => {
        if (e.target === installModal) {
            laterBtn.click();
        }
    });
}

// Detectar quando o app foi instalado
window.addEventListener('appinstalled', () => {
    console.log('🎉 App instalado com sucesso!');
    showNotification('🎉 Driver Finance instalado com sucesso!', 'success');
    
    // Marcar que já está instalado
    localStorage.setItem('install_prompt_shown', 'true');
    installPromptShown = true;
    
    // Limpar o prompt
    deferredPrompt = null;
});

// Verificar se já está instalado ao carregar
document.addEventListener('DOMContentLoaded', () => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('✅ App rodando em modo standalone (instalado)');
    } else {
        console.log('🌐 App rodando no navegador');
    }
});

// Adicionar animações CSS para o modal
const installStyle = document.createElement('style');
installStyle.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(installStyle);

console.log('📱 Sistema de instalação PWA ativado!');
console.log('💡 O prompt aparecerá automaticamente em dispositivos móveis');

// Função para mostrar o prompt manualmente (pode ser chamada de um botão)
function triggerInstallPrompt() {
    if (deferredPrompt) {
        showInstallPrompt();
    } else if (window.matchMedia('(display-mode: standalone)').matches) {
        showNotification('✅ App já está instalado!', 'success');
    } else {
        showNotification('ℹ️ Use o menu do navegador para instalar', 'info');
    }
}

// Resetar o prompt de instalação (útil para testes)
function resetInstallPrompt() {
    localStorage.removeItem('install_prompt_shown');
    installPromptShown = false;
    console.log('🔄 Prompt de instalação resetado');
    showNotification('🔄 Prompt resetado! Recarregue a página', 'info');
}

// Adicionar atalho de teclado para resetar (Ctrl+Shift+I)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        resetInstallPrompt();
    }
});

console.log('💡 Dica: Pressione Ctrl+Shift+I para resetar o prompt de instalação');


// ========== BOTÃO DE INSTALAÇÃO NO HEADER ==========

// Mostrar/ocultar botão de instalação no header
function updateInstallButton() {
    const installButton = document.getElementById('installButton');
    
    if (!installButton) return;
    
    // Verificar se já está instalado
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    
    // Verificar se é mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Mostrar botão apenas se:
    // 1. Não está instalado
    // 2. É mobile OU tem o deferredPrompt disponível
    if (!isInstalled && (isMobile || deferredPrompt)) {
        installButton.style.display = 'block';
    } else {
        installButton.style.display = 'none';
    }
}

// Atualizar botão ao carregar
document.addEventListener('DOMContentLoaded', () => {
    updateInstallButton();
});

// Atualizar botão quando o prompt estiver disponível
window.addEventListener('beforeinstallprompt', () => {
    setTimeout(updateInstallButton, 100);
});

// Ocultar botão quando instalar
window.addEventListener('appinstalled', () => {
    updateInstallButton();
});

console.log('🔘 Botão de instalação no header configurado!');
