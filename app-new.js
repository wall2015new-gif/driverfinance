// ========== CONFIGURAÇÃO INICIAL ==========
let currentTheme = localStorage.getItem('theme') || 'light';
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let weeklyChart = null;
let currentPeriod = 'today'; // Período atual: today, week, month
let goals = JSON.parse(localStorage.getItem('goals')) || {
    daily: 200,
    weekly: 1400,
    monthly: 6000,
    trips: 200
};

// Aplicar tema ao carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Driver Finance carregando...');
    
    try {
        applyTheme(currentTheme);
        updateHomePage();
        initializeForms();
        createWeeklyChart();
        
        console.log('✅ Driver Finance carregado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao carregar:', error);
    }
});

// ========== FAB & BOTTOM SHEET - Premium ========== 
function toggleFAB() {
    const fab = document.getElementById('fabButton');
    const bottomSheet = document.getElementById('bottomSheet');
    const backdrop = document.getElementById('backdrop');
    
    const isActive = fab.classList.contains('active');
    
    if (isActive) {
        closeFAB();
    } else {
        fab.classList.add('active');
        bottomSheet.classList.add('active');
        backdrop.classList.add('active');
    }
}

function closeFAB() {
    const fab = document.getElementById('fabButton');
    const bottomSheet = document.getElementById('bottomSheet');
    const backdrop = document.getElementById('backdrop');
    
    if (fab) fab.classList.remove('active');
    if (bottomSheet) bottomSheet.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
}

// ========== HOME PAGE - Premium Update ==========
function updateHomePage() {
    console.log('🔄 Atualizando página inicial premium...');
    
    // Filtrar transações de hoje
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = transactions.filter(t => t.date === today);
    
    // Calcular totais
    const revenues = todayTransactions.filter(t => t.type === 'revenue');
    const expenses = todayTransactions.filter(t => t.type === 'expense');
    
    const totalRevenue = revenues.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpense = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const profit = totalRevenue - totalExpense;
    
    // Calcular tempo trabalhado
    let totalMinutes = 0;
    revenues.forEach(r => {
        if (r.workTime && r.workTime.totalMinutes) {
            totalMinutes += r.workTime.totalMinutes;
        }
    });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    // Combustível do dia
    const fuelExpenses = expenses.filter(e => e.category === 'gas');
    const totalFuel = fuelExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    // Atualizar Hero Card
    const heroProfit = document.getElementById('heroProfit');
    const heroProgressBar = document.getElementById('heroProgressBar');
    const heroSubtitle = document.getElementById('heroSubtitle');
    
    if (heroProfit) {
        heroProfit.textContent = formatCurrency(profit);
    }
    
    // Calcular progresso da meta
    const dailyGoal = goals.daily || 200;
    const progress = dailyGoal > 0 ? Math.min((profit / dailyGoal) * 100, 100) : 0;
    
    if (heroProgressBar) {
        heroProgressBar.style.width = progress + '%';
    }
    
    if (heroSubtitle) {
        if (profit >= dailyGoal) {
            heroSubtitle.textContent = '🎉 Parabéns! Você bateu sua meta!';
        } else if (profit > 0) {
            const remaining = dailyGoal - profit;
            heroSubtitle.textContent = `Faltam ${formatCurrency(remaining)} para sua meta`;
        } else {
            heroSubtitle.textContent = 'Comece a registrar suas corridas';
        }
    }
    
    // Atualizar Quick Metrics
    const metricRevenue = document.getElementById('metricRevenue');
    const metricTime = document.getElementById('metricTime');
    const metricFuel = document.getElementById('metricFuel');
    
    if (metricRevenue) {
        metricRevenue.textContent = formatCurrency(totalRevenue);
    }
    
    if (metricTime) {
        if (totalMinutes > 0) {
            metricTime.textContent = `${hours}h${minutes > 0 ? minutes + 'm' : ''}`;
        } else {
            metricTime.textContent = '0h';
        }
    }
    
    if (metricFuel) {
        metricFuel.textContent = formatCurrency(totalFuel);
    }
    
    // Atualizar Insights
    updateInsights(totalRevenue, profit, dailyGoal, revenues.length);
    
    // Atualizar gráfico
    createWeeklyChart();
    
    console.log('✅ Página inicial atualizada!');
}

function updateInsights(revenue, profit, goal, trips) {
    const insightsCard = document.getElementById('insightsCard');
    const insightsTitle = document.getElementById('insightsTitle');
    const insightsText = document.getElementById('insightsText');
    
    if (!insightsCard || !insightsTitle || !insightsText) return;
    
    // Se não tem dados suficientes, esconder
    if (transactions.length < 5) {
        insightsCard.style.display = 'none';
        return;
    }
    
    insightsCard.style.display = 'block';
    
    // Calcular insights
    const percentOfGoal = goal > 0 ? Math.round((profit / goal) * 100) : 0;
    
    // Calcular média dos últimos 7 dias
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayRevenues = transactions.filter(t => t.type === 'revenue' && t.date === dateStr);
        const dayExpenses = transactions.filter(t => t.type === 'expense' && t.date === dateStr);
        const dayProfit = dayRevenues.reduce((sum, t) => sum + parseFloat(t.amount), 0) - 
                         dayExpenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        if (dayProfit > 0) {
            last7Days.push(dayProfit);
        }
    }
    
    const avgProfit = last7Days.length > 0 ? last7Days.reduce((a, b) => a + b, 0) / last7Days.length : 0;
    
    // Gerar insight
    if (percentOfGoal >= 100) {
        insightsTitle.textContent = '🎉 Meta Batida!';
        insightsText.textContent = `Você já atingiu ${percentOfGoal}% da sua meta diária. Continue assim!`;
    } else if (profit > avgProfit && avgProfit > 0) {
        const percentAbove = Math.round(((profit - avgProfit) / avgProfit) * 100);
        insightsTitle.textContent = '📈 Acima da Média';
        insightsText.textContent = `Você está ${percentAbove}% acima da sua média dos últimos 7 dias!`;
    } else if (trips > 0) {
        const avgPerTrip = revenue / trips;
        insightsTitle.textContent = '💡 Análise de Corridas';
        insightsText.textContent = `Média de ${formatCurrency(avgPerTrip)} por corrida hoje. ${trips} corridas realizadas.`;
    } else {
        insightsTitle.textContent = '💪 Vamos Começar!';
        insightsText.textContent = `Sua meta é ${formatCurrency(goal)}. Registre suas corridas para acompanhar o progresso.`;
    }
}

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
    console.log('🔄 Atualizando dashboard...', transactions.length, 'transações');
    
    // Filtrar transações por período
    const filteredTransactions = filterTransactionsByPeriod(transactions, currentPeriod);
    
    // Calcular totais
    const revenues = filteredTransactions.filter(t => t.type === 'revenue');
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    
    const totalRevenue = revenues.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpense = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const profit = totalRevenue - totalExpense;
    // Somar a quantidade de corridas de cada receita
    const trips = revenues.reduce((sum, t) => sum + (parseInt(t.trips) || 1), 0);
    
    console.log('💰 Totais:', { totalRevenue, totalExpense, profit, trips });
    
    // Atualizar valores dos cards circulares
    const revenueEl = document.getElementById('circularRevenue');
    const expenseEl = document.getElementById('circularExpense');
    const profitEl = document.getElementById('circularProfit');
    const tripsEl = document.getElementById('circularTrips');
    
    if (revenueEl) revenueEl.textContent = formatCurrency(totalRevenue);
    if (expenseEl) expenseEl.textContent = formatCurrency(totalExpense);
    if (profitEl) profitEl.textContent = formatCurrency(profit);
    if (tripsEl) tripsEl.textContent = trips;
    
    // Atualizar card principal (faturamento)
    const featuredBalance = document.querySelector('.featured-card-value');
    if (featuredBalance) {
        featuredBalance.textContent = formatCurrency(totalRevenue);
        console.log('✅ Card principal atualizado:', formatCurrency(totalRevenue));
    }
    
    // Atualizar subtítulo do card principal com o período
    const featuredSubtitle = document.querySelector('.featured-card-subtitle');
    if (featuredSubtitle) {
        const periodText = {
            'today': 'Faturamento de Hoje',
            'week': 'Faturamento da Semana',
            'month': 'Faturamento do Mês'
        };
        featuredSubtitle.textContent = periodText[currentPeriod] || 'Faturamento Total';
    }
    
    // Calcular porcentagens para os gráficos circulares
    // Usar metas baseadas no período
    let revenueGoal, tripsGoal;
    
    if (currentPeriod === 'today') {
        revenueGoal = goals.daily || 200;
        tripsGoal = 20;
    } else if (currentPeriod === 'week') {
        revenueGoal = goals.weekly || 1400;
        tripsGoal = 100;
    } else {
        revenueGoal = goals.monthly || 6000;
        tripsGoal = goals.trips || 200;
    }
    
    const revenuePercent = revenueGoal > 0 ? Math.min((totalRevenue / revenueGoal) * 100, 100) : 0;
    const expensePercent = totalRevenue > 0 ? Math.min((totalExpense / totalRevenue) * 100, 100) : 0;
    const profitPercent = totalRevenue > 0 ? Math.min((profit / totalRevenue) * 100, 100) : 0;
    const tripsPercent = tripsGoal > 0 ? Math.min((trips / tripsGoal) * 100, 100) : 0;
    
    // Animar gráficos circulares
    animateCircularProgress('revenueCircle', revenuePercent);
    animateCircularProgress('expenseCircle', expensePercent);
    animateCircularProgress('profitCircle', profitPercent);
    animateCircularProgress('tripsCircle', tripsPercent);
    
    // Atualizar mini stats por categoria (sempre do mês todo)
    const allExpenses = transactions.filter(t => t.type === 'expense');
    const gasExpenses = allExpenses.filter(e => e.category === 'gas').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const maintenanceExpenses = allExpenses.filter(e => e.category === 'maintenance').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const appExpenses = allExpenses.filter(e => e.category === 'app').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const foodExpenses = allExpenses.filter(e => e.category === 'food').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    const miniGasEl = document.getElementById('miniGas');
    const miniMaintenanceEl = document.getElementById('miniMaintenance');
    const miniAppEl = document.getElementById('miniApp');
    const miniFoodEl = document.getElementById('miniFood');
    
    if (miniGasEl) miniGasEl.textContent = formatCurrency(gasExpenses);
    if (miniMaintenanceEl) miniMaintenanceEl.textContent = formatCurrency(maintenanceExpenses);
    if (miniAppEl) miniAppEl.textContent = formatCurrency(appExpenses);
    if (miniFoodEl) miniFoodEl.textContent = formatCurrency(foodExpenses);
    
    console.log('✅ Dashboard atualizado com sucesso!');
}

// Filtrar transações por período
function filterTransactionsByPeriod(transactions, period) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (period === 'today') {
        return transactions.filter(t => t.date === today);
    } else if (period === 'week') {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Domingo
        weekStart.setHours(0, 0, 0, 0);
        
        return transactions.filter(t => {
            const transDate = new Date(t.date + 'T00:00:00');
            return transDate >= weekStart;
        });
    } else if (period === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        return transactions.filter(t => {
            const transDate = new Date(t.date + 'T00:00:00');
            return transDate >= monthStart;
        });
    }
    
    return transactions;
}

// Mudar período
function changePeriod(period) {
    currentPeriod = period;
    
    // Atualizar botões ativos
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    // Atualizar dashboard
    updateCircularProgress();
    
    console.log('📅 Período alterado para:', period);
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
    
    // Fechar FAB se estiver aberto
    closeFAB();

    // Fechar submenus do nav
    if (typeof closeAllSubmenus === 'function') closeAllSubmenus();
    
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
    if (pageName === 'home') {
        console.log('🏠 Atualizando página inicial...');
        updateHomePage();
    } else if (pageName === 'earnings') {
        console.log('💰 Atualizando ganhos...');
        renderEarnings();
    } else if (pageName === 'vehicle') {
        console.log('🚗 Atualizando página do veículo...');
        switchVehicleTab('km');
    } else if (pageName === 'profile') {
        console.log('👤 Página de perfil...');
        // Perfil é apenas menu, não precisa atualizar
    } else if (pageName === 'goals') {
        console.log('📊 Atualizando metas...');
        updateGoals();
        renderBills();
        updateSmartCalculator();
    } else if (pageName === 'ai') {
        console.log('🤖 Atualizando Assistente IA...');
        updateAIPage();
    } else if (pageName === 'reports') {
        console.log('📈 Atualizando relatórios...');
        updateReports();
        renderCalendar();
    } else if (pageName === 'history') {
        console.log('📜 Atualizando histórico...');
        renderTransactions();
    } else if (pageName === 'apps') {
        console.log('📱 Atualizando comparador de apps...');
        updateAppComparator();
    }
}

// ========== EARNINGS PAGE ==========
function renderEarnings() {
    const earningsList = document.getElementById('earningsList');
    if (!earningsList) return;
    
    const revenues = transactions.filter(t => t.type === 'revenue').sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (revenues.length === 0) {
        earningsList.innerHTML = `
            <div style="text-align: center; padding: var(--space-xl); color: var(--text-tertiary);">
                <div style="font-size: 48px; margin-bottom: var(--space-sm);">💰</div>
                <div style="font-size: var(--font-md); font-weight: 600; margin-bottom: var(--space-xs);">Nenhum ganho registrado</div>
                <div style="font-size: var(--font-sm);">Adicione sua primeira corrida usando o botão +</div>
            </div>
        `;
        return;
    }
    
    earningsList.innerHTML = revenues.map(r => {
        const appIcons = {
            'uber': '🚗',
            '99': '🟡',
            'indrive': '🔵',
            'outros': '📱'
        };
        
        return `
            <div style="background: var(--bg-secondary); border-radius: var(--radius-lg); padding: var(--space-md); margin-bottom: var(--space-sm); border: 1px solid var(--border-light);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--space-xs);">
                    <div>
                        <div style="font-size: var(--font-xs); color: var(--text-tertiary); font-weight: 600; margin-bottom: 4px;">
                            ${formatDate(r.date)}
                        </div>
                        <div style="font-size: var(--font-xl); font-weight: 800; color: var(--primary-green);">
                            ${formatCurrency(r.amount)}
                        </div>
                    </div>
                    <div style="font-size: 32px;">
                        ${appIcons[r.app] || '📱'}
                    </div>
                </div>
                <div style="display: flex; gap: var(--space-sm); flex-wrap: wrap; font-size: var(--font-xs); color: var(--text-secondary);">
                    ${r.trips && r.trips > 1 ? `<span>🚗 ${r.trips} corridas</span>` : ''}
                    ${r.workTime ? `<span>⏱️ ${r.workTime.hours}h ${r.workTime.minutes}m</span>` : ''}
                    ${r.description ? `<span>📝 ${r.description}</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function filterEarnings(period) {
    // TODO: Implementar filtro
    console.log('Filtrar ganhos:', period);
}

// ========== VEHICLE TABS ==========
function switchVehicleTab(tab) {
    const content = document.getElementById('vehicleTabContent');
    if (!content) return;
    
    if (tab === 'km') {
        content.innerHTML = `
            <div style="text-align: center; padding: var(--space-lg); color: var(--text-tertiary);">
                <div style="font-size: 48px; margin-bottom: var(--space-sm);">🚗</div>
                <div style="font-size: var(--font-md); font-weight: 600;">Controle de KM</div>
                <div style="font-size: var(--font-sm); margin-top: var(--space-xs);">Em breve</div>
            </div>
        `;
    } else if (tab === 'fuel') {
        content.innerHTML = `
            <div style="text-align: center; padding: var(--space-lg); color: var(--text-tertiary);">
                <div style="font-size: 48px; margin-bottom: var(--space-sm);">⛽</div>
                <div style="font-size: var(--font-md); font-weight: 600;">Controle de Combustível</div>
                <div style="font-size: var(--font-sm); margin-top: var(--space-xs);">Em breve</div>
            </div>
        `;
    } else if (tab === 'maintenance') {
        content.innerHTML = `
            <div style="text-align: center; padding: var(--space-lg); color: var(--text-tertiary);">
                <div style="font-size: 48px; margin-bottom: var(--space-sm);">🔧</div>
                <div style="font-size: var(--font-md); font-weight: 600;">Controle de Manutenção</div>
                <div style="font-size: var(--font-sm); margin-top: var(--space-xs);">Em breve</div>
            </div>
        `;
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
    const fuelDate = document.getElementById('fuelDate');
    const maintenanceDate = document.getElementById('maintenanceDate');
    
    if (revenueDate) revenueDate.value = today;
    if (expenseDate) expenseDate.value = today;
    if (fuelDate) fuelDate.value = today;
    if (maintenanceDate) maintenanceDate.value = today;
}

// Calcular tempo trabalhado
function calculateWorkTime() {
    const startTime = document.getElementById('revenueStartTime').value;
    const endTime = document.getElementById('revenueEndTime').value;
    const display = document.getElementById('workTimeDisplay');
    const valueEl = document.getElementById('workTimeValue');
    
    if (startTime && endTime) {
        // Converter para minutos
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        let startTotalMin = startHour * 60 + startMin;
        let endTotalMin = endHour * 60 + endMin;
        
        // Se o horário final for menor, assumir que passou da meia-noite
        if (endTotalMin < startTotalMin) {
            endTotalMin += 24 * 60; // Adicionar 24 horas
        }
        
        const diffMin = endTotalMin - startTotalMin;
        const hours = Math.floor(diffMin / 60);
        const minutes = diffMin % 60;
        
        valueEl.textContent = `${hours}h ${minutes}min`;
        display.style.display = 'block';
        
        return { hours, minutes, totalMinutes: diffMin };
    } else {
        display.style.display = 'none';
        return null;
    }
}

function addRevenue(event) {
    event.preventDefault();
    
    const trips = parseInt(document.getElementById('revenueTrips').value) || 1;
    const startTime = document.getElementById('revenueStartTime').value;
    const endTime = document.getElementById('revenueEndTime').value;
    
    const transaction = {
        id: Date.now(),
        type: 'revenue',
        amount: document.getElementById('revenueValue').value,
        trips: trips,
        startTime: startTime || null,
        endTime: endTime || null,
        app: document.getElementById('revenueApp').value,
        description: document.getElementById('revenueDesc').value,
        date: document.getElementById('revenueDate').value,
        category: 'revenue'
    };
    
    // Calcular tempo trabalhado se ambos os horários foram informados
    if (startTime && endTime) {
        const workTime = calculateWorkTime();
        if (workTime) {
            transaction.workTime = workTime;
        }
    }
    
    transactions.push(transaction);
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    closeModal('revenue');
    event.target.reset();
    initializeForms();
    
    // Esconder o display de tempo
    const workTimeDisplay = document.getElementById('workTimeDisplay');
    if (workTimeDisplay) {
        workTimeDisplay.style.display = 'none';
    }
    
    // Atualizar todas as visualizações
    updateHomePage();
    renderTransactions();
    updateAppComparator();
    
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
    
    // Atualizar todas as visualizações
    updateHomePage();
    renderTransactions();
    
    showNotification('✅ Despesa adicionada com sucesso!', 'success');
}

// ========== FUEL & MAINTENANCE ==========
function addFuel(event) {
    event.preventDefault();
    
    const transaction = {
        id: Date.now(),
        type: 'expense',
        amount: document.getElementById('fuelValue').value,
        description: document.getElementById('fuelDesc').value || 'Abastecimento',
        date: document.getElementById('fuelDate').value,
        category: 'gas',
        liters: document.getElementById('fuelLiters').value || null
    };
    
    transactions.push(transaction);
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    closeModal('fuel');
    event.target.reset();
    initializeForms();
    
    updateHomePage();
    renderTransactions();
    
    showNotification('⛽ Abastecimento registrado!', 'success');
}

function addMaintenance(event) {
    event.preventDefault();
    
    const transaction = {
        id: Date.now(),
        type: 'expense',
        amount: document.getElementById('maintenanceValue').value,
        description: document.getElementById('maintenanceDesc').value,
        date: document.getElementById('maintenanceDate').value,
        category: 'maintenance',
        maintenanceType: document.getElementById('maintenanceType').value
    };
    
    transactions.push(transaction);
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    closeModal('maintenance');
    event.target.reset();
    initializeForms();
    
    updateHomePage();
    renderTransactions();
    
    showNotification('🔧 Manutenção registrada!', 'success');
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
    
    container.innerHTML = transactions.map(transaction => {
        // Montar informações adicionais para receitas
        let additionalInfo = '';
        if (transaction.type === 'revenue') {
            const details = [];
            
            // Quantidade de corridas
            if (transaction.trips && transaction.trips > 1) {
                details.push(`${transaction.trips} corridas`);
            }
            
            // Tempo trabalhado
            if (transaction.startTime && transaction.endTime) {
                details.push(`⏱️ ${transaction.startTime} - ${transaction.endTime}`);
                if (transaction.workTime) {
                    details.push(`(${transaction.workTime.hours}h ${transaction.workTime.minutes}min)`);
                }
            }
            
            if (details.length > 0) {
                additionalInfo = `<div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">${details.join(' • ')}</div>`;
            }
        }
        
        return `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-date">${formatDate(transaction.date)}</div>
                    <div class="transaction-desc">${categoryIcons[transaction.category] || '💰'} ${transaction.description}</div>
                    <div class="transaction-category">${categoryNames[transaction.category] || 'Outros'}</div>
                    ${additionalInfo}
                </div>
                <div class="transaction-value ${transaction.type}">
                    ${transaction.type === 'revenue' ? '+' : '-'} ${formatCurrency(transaction.amount)}
                </div>
                <div class="transaction-actions">
                    <button class="btn-icon" onclick="deleteTransaction(${transaction.id})">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

function deleteTransaction(id) {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
        transactions = transactions.filter(t => t.id !== id);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        
        updateCircularProgress();
        createWeeklyChart();
        renderTransactions();
        updateAppComparator();
        
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
    
    // Somar a quantidade de corridas de cada receita do mês
    const monthlyTrips = transactions
        .filter(t => t.type === 'revenue' && new Date(t.date) >= monthStart)
        .reduce((sum, t) => sum + (parseInt(t.trips) || 1), 0);
    
    // Atualizar metas
    updateGoalCard('Daily', goals.daily, dailyRevenue, true);
    updateGoalCard('Weekly', goals.weekly, weeklyRevenue, true);
    updateGoalCard('Monthly', goals.monthly, monthlyRevenue, true);
    
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
    
    // Somar a quantidade de corridas de todas as receitas
    const totalTrips = transactions
        .filter(t => t.type === 'revenue')
        .reduce((sum, t) => sum + (parseInt(t.trips) || 1), 0);
    
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
    // Somar a quantidade de corridas de cada receita
    const totalTrips = revenues.reduce((sum, t) => sum + (parseInt(t.trips) || 1), 0);
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

// ========== CONTAS A PAGAR ==========

let bills = JSON.parse(localStorage.getItem('bills')) || [];

// Abrir modal de adicionar conta
function openAddBillModal() {
    const modal = document.getElementById('addBillModal');
    if (!modal) return;
    
    // Limpar formulário
    document.getElementById('billId').value = '';
    document.getElementById('billName').value = '';
    document.getElementById('billCategory').value = '';
    document.getElementById('billAmount').value = '';
    document.getElementById('billDueDate').value = '';
    document.getElementById('billRecurring').value = 'false';
    document.getElementById('billModalTitle').textContent = 'Adicionar Conta';
    
    modal.classList.add('active');
}

// Salvar conta
function saveBill(event) {
    event.preventDefault();
    
    const id = document.getElementById('billId').value;
    const name = document.getElementById('billName').value;
    const category = document.getElementById('billCategory').value;
    const amount = parseFloat(document.getElementById('billAmount').value);
    const dueDate = document.getElementById('billDueDate').value;
    const recurring = document.getElementById('billRecurring').value === 'true';
    
    if (!name || !category || !amount || !dueDate) {
        showNotification('❌ Preencha todos os campos', 'info');
        return;
    }
    
    const bill = {
        id: id || Date.now(),
        name,
        category,
        amount,
        dueDate,
        recurring,
        paid: false,
        createdAt: new Date().toISOString()
    };
    
    if (id) {
        // Editar existente
        const index = bills.findIndex(b => b.id == id);
        if (index >= 0) {
            bills[index] = { ...bills[index], ...bill };
        }
    } else {
        // Adicionar nova
        bills.push(bill);
    }
    
    // Ordenar por data de vencimento
    bills.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    localStorage.setItem('bills', JSON.stringify(bills));
    
    closeModal('addBill');
    renderBills();
    updateSmartCalculator();
    
    showNotification('✅ Conta salva com sucesso!', 'success');
}

// Editar conta
function editBill(id) {
    const bill = bills.find(b => b.id == id);
    if (!bill) return;
    
    document.getElementById('billId').value = bill.id;
    document.getElementById('billName').value = bill.name;
    document.getElementById('billCategory').value = bill.category;
    document.getElementById('billAmount').value = bill.amount;
    document.getElementById('billDueDate').value = bill.dueDate;
    document.getElementById('billRecurring').value = bill.recurring ? 'true' : 'false';
    document.getElementById('billModalTitle').textContent = 'Editar Conta';
    
    openModal('addBill');
}

// Marcar conta como paga
function payBill(id) {
    const bill = bills.find(b => b.id == id);
    if (!bill) return;
    
    bill.paid = true;
    bill.paidAt = new Date().toISOString();
    
    localStorage.setItem('bills', JSON.stringify(bills));
    
    renderBills();
    updateSmartCalculator();
    
    showNotification('✅ Conta marcada como paga!', 'success');
}

// Deletar conta
function deleteBill(id) {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
    
    bills = bills.filter(b => b.id != id);
    localStorage.setItem('bills', JSON.stringify(bills));
    
    renderBills();
    updateSmartCalculator();
    
    showNotification('✅ Conta excluída!', 'success');
}

// Renderizar lista de contas
function renderBills() {
    const container = document.getElementById('billsList');
    if (!container) return;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Filtrar contas do mês atual
    const monthBills = bills.filter(bill => {
        const billDate = new Date(bill.dueDate);
        return billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear;
    });
    
    if (monthBills.length === 0) {
        container.innerHTML = '<div class="empty-state">📭 Nenhuma conta cadastrada para este mês</div>';
        return;
    }
    
    const categoryIcons = {
        vehicle: '🚗',
        internet: '📡',
        housing: '🏠',
        personal: '👤',
        other: '📦'
    };
    
    const categoryNames = {
        vehicle: 'Veículo',
        internet: 'Internet/Telefone',
        housing: 'Moradia',
        personal: 'Pessoal',
        other: 'Outros'
    };
    
    container.innerHTML = monthBills.map(bill => {
        const dueDate = new Date(bill.dueDate + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        let statusClass = '';
        let statusText = '';
        
        if (bill.paid) {
            statusClass = 'paid';
            statusText = '✅ Paga';
        } else if (daysUntilDue < 0) {
            statusClass = 'overdue';
            statusText = `⚠️ Vencida há ${Math.abs(daysUntilDue)} dias`;
        } else if (daysUntilDue <= 3) {
            statusClass = 'due-soon';
            statusText = `⏰ Vence em ${daysUntilDue} dias`;
        } else {
            statusText = `📅 Vence em ${daysUntilDue} dias`;
        }
        
        return `
            <div class="bill-item ${statusClass}">
                <div class="bill-info">
                    <div class="bill-name">
                        ${categoryIcons[bill.category] || '📦'} ${bill.name}
                    </div>
                    <div class="bill-details">
                        <span>${categoryNames[bill.category] || 'Outros'}</span>
                        <span>${dueDate.toLocaleDateString('pt-BR')}</span>
                        <span>${statusText}</span>
                        ${bill.recurring ? '<span>🔄 Recorrente</span>' : ''}
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="bill-amount">${formatCurrency(bill.amount)}</div>
                    <div class="bill-actions">
                        ${!bill.paid ? `<button class="btn-pay-bill" onclick="payBill(${bill.id})">✅ Pagar</button>` : ''}
                        <button class="btn-edit-bill" onclick="editBill(${bill.id})">✏️</button>
                        <button class="btn-delete-bill" onclick="deleteBill(${bill.id})">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Atualizar calculadora inteligente
function updateSmartCalculator() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Total de contas não pagas do mês
    const monthBills = bills.filter(bill => {
        const billDate = new Date(bill.dueDate);
        return billDate.getMonth() === currentMonth && 
               billDate.getFullYear() === currentYear &&
               !bill.paid;
    });
    
    const totalBills = monthBills.reduce((sum, bill) => sum + bill.amount, 0);
    
    // Calcular gasto médio com combustível por dia
    const monthStart = new Date(currentYear, currentMonth, 1);
    const fuelExpenses = transactions.filter(t => {
        const transDate = new Date(t.date);
        return t.type === 'expense' && 
               t.category === 'gas' && 
               transDate >= monthStart;
    });
    
    const totalFuel = fuelExpenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = new Date().getDate();
    const avgFuelPerDay = currentDay > 0 ? totalFuel / currentDay : 0;
    
    // Dias úteis restantes no mês (considerando 26 dias úteis por mês)
    const workingDaysInMonth = 26;
    const workingDaysLeft = Math.max(0, workingDaysInMonth - currentDay);
    
    // Meta diária necessária = (Total de contas + Combustível estimado) / Dias restantes
    const estimatedFuelRemaining = avgFuelPerDay * workingDaysLeft;
    const totalNeeded = totalBills + estimatedFuelRemaining;
    const dailyTargetNeeded = workingDaysLeft > 0 ? totalNeeded / workingDaysLeft : 0;
    
    // Atualizar interface
    const totalBillsEl = document.getElementById('totalBills');
    const avgFuelPerDayEl = document.getElementById('avgFuelPerDay');
    const workingDaysLeftEl = document.getElementById('workingDaysLeft');
    const dailyTargetNeededEl = document.getElementById('dailyTargetNeeded');
    
    if (totalBillsEl) totalBillsEl.textContent = formatCurrency(totalBills);
    if (avgFuelPerDayEl) avgFuelPerDayEl.textContent = formatCurrency(avgFuelPerDay);
    if (workingDaysLeftEl) workingDaysLeftEl.textContent = workingDaysLeft;
    if (dailyTargetNeededEl) dailyTargetNeededEl.textContent = formatCurrency(dailyTargetNeeded);
}

// Inicializar contas ao carregar a página de metas
document.addEventListener('DOMContentLoaded', function() {
    renderBills();
    updateSmartCalculator();
});

console.log('💳 Sistema de Contas a Pagar carregado!');

// ========== ASSISTENTE IA (LOCAL) ==========

const AIAssistant = {
    // Coletar todos os dados necessários
    collectData() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Dados do mês
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthTransactions = transactions.filter(t => {
            const transDate = new Date(t.date);
            return transDate >= monthStart;
        });
        
        const monthRevenues = monthTransactions.filter(t => t.type === 'revenue');
        const monthExpenses = monthTransactions.filter(t => t.type === 'expense');
        
        const totalRevenue = monthRevenues.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalExpense = monthExpenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalTrips = monthRevenues.reduce((sum, t) => sum + (parseInt(t.trips) || 1), 0);
        
        // Dados de hoje
        const todayRevenues = monthRevenues.filter(t => t.date === today);
        const todayRevenue = todayRevenues.reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const todayTrips = todayRevenues.reduce((sum, t) => sum + (parseInt(t.trips) || 1), 0);
        
        // Dias trabalhados
        const uniqueDays = [...new Set(monthRevenues.map(t => t.date))];
        const daysWorked = uniqueDays.length;
        const avgDailyRevenue = daysWorked > 0 ? totalRevenue / daysWorked : 0;
        
        // KM rodado
        const monthKm = kmData.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
        });
        const totalKm = monthKm.reduce((sum, item) => sum + item.kmRodado, 0);
        
        // Combustível
        const fuelExpenses = monthExpenses.filter(e => e.category === 'gas');
        const totalFuel = fuelExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const avgFuelPerDay = daysWorked > 0 ? totalFuel / daysWorked : 0;
        
        // Eficiência
        const efficiency = totalKm > 0 ? totalRevenue / totalKm : 0;
        
        // Contas
        const monthBills = bills.filter(bill => {
            const billDate = new Date(bill.dueDate);
            return billDate.getMonth() === currentMonth && 
                   billDate.getFullYear() === currentYear &&
                   !bill.paid;
        });
        const totalBills = monthBills.reduce((sum, bill) => sum + bill.amount, 0);
        
        // Dias restantes
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const currentDay = now.getDate();
        const daysLeft = daysInMonth - currentDay;
        const workingDaysLeft = Math.max(0, 26 - daysWorked);
        
        return {
            today,
            currentMonth,
            currentYear,
            totalRevenue,
            totalExpense,
            totalTrips,
            todayRevenue,
            todayTrips,
            daysWorked,
            avgDailyRevenue,
            totalKm,
            totalFuel,
            avgFuelPerDay,
            efficiency,
            totalBills,
            daysLeft,
            workingDaysLeft,
            monthRevenues,
            monthExpenses,
            monthKm,
            goals: goals
        };
    },
    
    // Gerar insights inteligentes
    generateInsights() {
        const data = this.collectData();
        const insights = [];
        
        // Insight 1: Performance vs Meta
        const targetDaily = data.goals.daily || 200;
        const percentVsTarget = ((data.avgDailyRevenue - targetDaily) / targetDaily) * 100;
        
        if (percentVsTarget >= 10) {
            insights.push({
                type: 'success',
                icon: '🎉',
                message: `Excelente! Você está ${percentVsTarget.toFixed(1)}% acima da meta diária!`,
                detail: `Média de ${formatCurrency(data.avgDailyRevenue)}/dia vs meta de ${formatCurrency(targetDaily)}/dia`
            });
        } else if (percentVsTarget >= 0) {
            insights.push({
                type: 'success',
                icon: '✅',
                message: `Bom trabalho! Você está ${percentVsTarget.toFixed(1)}% acima da meta.`,
                detail: `Continue assim para atingir seus objetivos`
            });
        } else if (percentVsTarget >= -10) {
            insights.push({
                type: 'warning',
                icon: '⚠️',
                message: `Atenção! Você está ${Math.abs(percentVsTarget).toFixed(1)}% abaixo da meta.`,
                detail: `Precisa fazer mais ${formatCurrency(Math.abs(data.avgDailyRevenue - targetDaily))}/dia`
            });
        } else {
            insights.push({
                type: 'danger',
                icon: '🚨',
                message: `Alerta! Você está ${Math.abs(percentVsTarget).toFixed(1)}% abaixo da meta!`,
                detail: `É necessário aumentar o ritmo urgentemente`
            });
        }
        
        // Insight 2: Desempenho de hoje
        if (data.todayRevenue > 0) {
            if (data.todayRevenue >= targetDaily) {
                insights.push({
                    type: 'success',
                    icon: '💰',
                    message: `Hoje você já fez ${formatCurrency(data.todayRevenue)}!`,
                    detail: `Meta diária já atingida com ${data.todayTrips} corridas`
                });
            } else {
                const remaining = targetDaily - data.todayRevenue;
                insights.push({
                    type: 'info',
                    icon: '📊',
                    message: `Você já fez ${formatCurrency(data.todayRevenue)} hoje.`,
                    detail: `Faltam ${formatCurrency(remaining)} para atingir a meta diária`
                });
            }
        }
        
        // Insight 3: Contas a vencer
        const upcomingBills = bills.filter(bill => {
            const billDate = new Date(bill.dueDate + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const daysUntil = Math.ceil((billDate - today) / (1000 * 60 * 60 * 24));
            return daysUntil >= 0 && daysUntil <= 7 && !bill.paid;
        });
        
        if (upcomingBills.length > 0) {
            const totalUpcoming = upcomingBills.reduce((sum, b) => sum + b.amount, 0);
            insights.push({
                type: 'warning',
                icon: '💳',
                message: `${upcomingBills.length} conta(s) vencem nos próximos 7 dias`,
                detail: `Total de ${formatCurrency(totalUpcoming)} a pagar`
            });
        }
        
        // Insight 4: Eficiência
        if (data.efficiency > 0) {
            insights.push({
                type: 'info',
                icon: '⚡',
                message: `Sua eficiência está em ${formatCurrency(data.efficiency)}/km`,
                detail: `${formatCurrency(data.totalRevenue)} faturados em ${data.totalKm.toFixed(0)} km rodados`
            });
        }
        
        // Insight 5: Manutenções próximas
        const maintenanceInsights = this.getMaintenanceInsights(data);
        insights.push(...maintenanceInsights);
        
        return insights;
    },
    
    // Gerar recomendações personalizadas
    generateRecommendations() {
        const data = this.collectData();
        const recommendations = [];
        
        // Recomendação 1: Baseada em meta
        const targetMonthly = data.goals.monthly || 6000;
        const projected = data.avgDailyRevenue * 26; // 26 dias úteis
        
        if (projected < targetMonthly) {
            const needed = (targetMonthly - data.totalRevenue) / data.workingDaysLeft;
            recommendations.push(
                `Para atingir sua meta mensal de ${formatCurrency(targetMonthly)}, você precisa fazer ${formatCurrency(needed)}/dia nos próximos ${data.workingDaysLeft} dias úteis.`
            );
        } else {
            recommendations.push(
                `Você está no caminho certo! Mantendo este ritmo, vai faturar ${formatCurrency(projected)} este mês.`
            );
        }
        
        // Recomendação 2: Melhor dia da semana
        const bestDay = this.findBestDayOfWeek(data.monthRevenues);
        if (bestDay) {
            recommendations.push(
                `Seus melhores dias são ${bestDay.name} (média de ${formatCurrency(bestDay.avg)}). Considere trabalhar mais nestes dias.`
            );
        }
        
        // Recomendação 3: Combustível
        if (data.avgFuelPerDay > 0) {
            const fuelPercent = (data.totalFuel / data.totalRevenue) * 100;
            if (fuelPercent > 20) {
                recommendations.push(
                    `Seu gasto com combustível está em ${fuelPercent.toFixed(1)}% do faturamento. Considere otimizar suas rotas ou procurar postos mais baratos.`
                );
            } else {
                recommendations.push(
                    `Seu gasto com combustível está controlado em ${fuelPercent.toFixed(1)}% do faturamento. Continue assim!`
                );
            }
        }
        
        // Recomendação 4: Apps
        const bestApp = this.findBestApp(data.monthRevenues);
        if (bestApp && bestApp.name !== 'Não especificado') {
            recommendations.push(
                `O app ${bestApp.name} está sendo mais rentável para você (${formatCurrency(bestApp.avg)}/corrida). Foque mais nele.`
            );
        }
        
        // Recomendação 5: Manutenções
        const maintenanceRecs = this.getMaintenanceRecommendations(data);
        recommendations.push(...maintenanceRecs);
        
        return recommendations;
    },
    
    // Obter insights de manutenção
    getMaintenanceInsights(data) {
        const insights = [];
        const maintenanceTypes = {
            'oil': { name: 'Troca de Óleo', icon: '🛢️' },
            'oil-filter': { name: 'Filtro de Óleo', icon: '🔧' },
            'air-filter': { name: 'Filtro de Ar', icon: '💨' },
            'fuel-filter': { name: 'Filtro de Combustível', icon: '⛽' },
            'cabin-filter': { name: 'Filtro de Cabine', icon: '🌬️' },
            'tires': { name: 'Pneus', icon: '🛞' },
            'brakes': { name: 'Freios', icon: '🛑' },
            'battery': { name: 'Bateria', icon: '🔋' },
            'alignment': { name: 'Alinhamento', icon: '📐' },
            'balancing': { name: 'Balanceamento', icon: '⚖️' },
            'suspension': { name: 'Suspensão', icon: '🔩' },
            'other': { name: 'Outros', icon: '🔧' }
        };
        
        // Pegar KM atual
        let currentKm = 0;
        if (data.monthKm.length > 0) {
            const lastKm = data.monthKm[data.monthKm.length - 1];
            currentKm = lastKm.kmFinal || 0;
        }
        
        // Verificar manutenções ativas
        const activeMaintenances = maintenanceData.filter(m => !m.completed);
        
        if (activeMaintenances.length === 0) {
            return insights;
        }
        
        // Manutenções críticas (atrasadas)
        const overdue = activeMaintenances.filter(m => m.nextKm <= currentKm);
        if (overdue.length > 0) {
            const m = overdue[0];
            const typeInfo = maintenanceTypes[m.type];
            const kmOverdue = currentKm - m.nextKm;
            
            insights.push({
                type: 'danger',
                icon: '🚨',
                message: `${typeInfo.icon} ${typeInfo.name} está atrasada!`,
                detail: `Você já passou ${kmOverdue.toFixed(0)} km da troca programada`
            });
        }
        
        // Manutenções urgentes (menos de 500 km)
        const urgent = activeMaintenances.filter(m => {
            const kmRemaining = m.nextKm - currentKm;
            return kmRemaining > 0 && kmRemaining <= 500;
        });
        
        if (urgent.length > 0) {
            const m = urgent[0];
            const typeInfo = maintenanceTypes[m.type];
            const kmRemaining = m.nextKm - currentKm;
            
            insights.push({
                type: 'warning',
                icon: '⚠️',
                message: `${typeInfo.icon} ${typeInfo.name} precisa ser feita em breve!`,
                detail: `Faltam apenas ${kmRemaining.toFixed(0)} km para a troca`
            });
        }
        
        // Manutenções próximas (500-1000 km)
        const upcoming = activeMaintenances.filter(m => {
            const kmRemaining = m.nextKm - currentKm;
            return kmRemaining > 500 && kmRemaining <= 1000;
        });
        
        if (upcoming.length > 0 && overdue.length === 0 && urgent.length === 0) {
            const m = upcoming[0];
            const typeInfo = maintenanceTypes[m.type];
            const kmRemaining = m.nextKm - currentKm;
            
            insights.push({
                type: 'info',
                icon: '🔧',
                message: `${typeInfo.icon} ${typeInfo.name} se aproxima`,
                detail: `Faltam ${kmRemaining.toFixed(0)} km. Planeje-se!`
            });
        }
        
        return insights;
    },
    
    // Obter recomendações de manutenção
    getMaintenanceRecommendations(data) {
        const recommendations = [];
        const maintenanceTypes = {
            'oil': { name: 'Troca de Óleo', icon: '🛢️' },
            'oil-filter': { name: 'Filtro de Óleo', icon: '🔧' },
            'air-filter': { name: 'Filtro de Ar', icon: '💨' },
            'fuel-filter': { name: 'Filtro de Combustível', icon: '⛽' },
            'cabin-filter': { name: 'Filtro de Cabine', icon: '🌬️' },
            'tires': { name: 'Pneus', icon: '🛞' },
            'brakes': { name: 'Freios', icon: '🛑' },
            'battery': { name: 'Bateria', icon: '🔋' },
            'alignment': { name: 'Alinhamento', icon: '📐' },
            'balancing': { name: 'Balanceamento', icon: '⚖️' },
            'suspension': { name: 'Suspensão', icon: '🔩' },
            'other': { name: 'Outros', icon: '🔧' }
        };
        
        // Pegar KM atual
        let currentKm = 0;
        if (data.monthKm.length > 0) {
            const lastKm = data.monthKm[data.monthKm.length - 1];
            currentKm = lastKm.kmFinal || 0;
        }
        
        // Verificar manutenções ativas
        const activeMaintenances = maintenanceData.filter(m => !m.completed);
        
        // Manutenções urgentes (menos de 1000 km)
        const urgent = activeMaintenances.filter(m => {
            const kmRemaining = m.nextKm - currentKm;
            return kmRemaining <= 1000;
        });
        
        if (urgent.length > 0) {
            const totalCost = urgent.reduce((sum, m) => sum + (m.cost || 0), 0);
            const maintenanceNames = urgent.map(m => maintenanceTypes[m.type].name).join(', ');
            
            if (totalCost > 0) {
                recommendations.push(
                    `Você tem ${urgent.length} manutenção(ões) próxima(s): ${maintenanceNames}. Reserve aproximadamente ${formatCurrency(totalCost)} para os custos.`
                );
            } else {
                recommendations.push(
                    `Você tem ${urgent.length} manutenção(ões) próxima(s): ${maintenanceNames}. Planeje-se para não atrasar!`
                );
            }
        }
        
        // Análise de custos de manutenção
        const monthMaintenances = maintenanceData.filter(m => {
            const mDate = new Date(m.date);
            return mDate.getMonth() === data.currentMonth && 
                   mDate.getFullYear() === data.currentYear &&
                   m.cost > 0;
        });
        
        if (monthMaintenances.length > 0) {
            const totalMaintenanceCost = monthMaintenances.reduce((sum, m) => sum + m.cost, 0);
            const percentOfRevenue = data.totalRevenue > 0 ? (totalMaintenanceCost / data.totalRevenue) * 100 : 0;
            
            if (percentOfRevenue > 15) {
                recommendations.push(
                    `Seus gastos com manutenção estão altos este mês (${percentOfRevenue.toFixed(1)}% do faturamento). Considere fazer manutenções preventivas para evitar custos maiores.`
                );
            }
        }
        
        return recommendations;
    },
    
    // Encontrar melhor dia da semana
    findBestDayOfWeek(revenues) {
        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const dayStats = {};
        
        revenues.forEach(t => {
            const date = new Date(t.date + 'T00:00:00');
            const dayOfWeek = date.getDay();
            
            if (!dayStats[dayOfWeek]) {
                dayStats[dayOfWeek] = { total: 0, count: 0, name: dayNames[dayOfWeek] };
            }
            
            dayStats[dayOfWeek].total += parseFloat(t.amount);
            dayStats[dayOfWeek].count++;
        });
        
        let bestDay = null;
        let bestAvg = 0;
        
        Object.values(dayStats).forEach(day => {
            const avg = day.total / day.count;
            if (avg > bestAvg) {
                bestAvg = avg;
                bestDay = { ...day, avg };
            }
        });
        
        return bestDay;
    },
    
    // Encontrar melhor app
    findBestApp(revenues) {
        const appStats = {};
        
        revenues.forEach(t => {
            const app = t.app || 'Não especificado';
            const trips = parseInt(t.trips) || 1;
            
            if (!appStats[app]) {
                appStats[app] = { total: 0, trips: 0, name: app };
            }
            
            appStats[app].total += parseFloat(t.amount);
            appStats[app].trips += trips;
        });
        
        let bestApp = null;
        let bestAvg = 0;
        
        Object.values(appStats).forEach(app => {
            const avg = app.total / app.trips;
            if (avg > bestAvg && app.trips >= 5) { // Mínimo 5 corridas
                bestAvg = avg;
                bestApp = { ...app, avg };
            }
        });
        
        return bestApp;
    },
    
    // Encontrar melhor horário
    findBestTime(revenues) {
        const timeStats = {};
        
        revenues.forEach(t => {
            if (t.startTime) {
                const hour = parseInt(t.startTime.split(':')[0]);
                const period = hour < 12 ? 'Manhã (6h-12h)' : 
                              hour < 18 ? 'Tarde (12h-18h)' : 
                              'Noite (18h-00h)';
                
                if (!timeStats[period]) {
                    timeStats[period] = { total: 0, count: 0, name: period };
                }
                
                timeStats[period].total += parseFloat(t.amount);
                timeStats[period].count++;
            }
        });
        
        let bestTime = null;
        let bestAvg = 0;
        
        Object.values(timeStats).forEach(time => {
            const avg = time.total / time.count;
            if (avg > bestAvg) {
                bestAvg = avg;
                bestTime = { ...time, avg };
            }
        });
        
        return bestTime;
    },
    
    // Gerar previsões
    generatePredictions() {
        const data = this.collectData();
        
        // Faturamento projetado
        const projectedRevenue = data.avgDailyRevenue * 26; // 26 dias úteis
        
        // Probabilidade de atingir meta
        const targetMonthly = data.goals.monthly || 6000;
        const progress = (data.totalRevenue / targetMonthly) * 100;
        const daysProgress = (data.daysWorked / 26) * 100;
        const probability = Math.min(100, (progress / daysProgress) * 100);
        
        // Valor necessário
        const needed = Math.max(0, targetMonthly - data.totalRevenue);
        
        // Tendência
        let trend = '';
        if (probability >= 90) {
            trend = '📈 Excelente! Muito acima da meta';
        } else if (probability >= 70) {
            trend = '✅ Boa! No caminho certo';
        } else if (probability >= 50) {
            trend = '⚠️ Atenção! Precisa melhorar';
        } else {
            trend = '🚨 Crítica! Muito abaixo';
        }
        
        return {
            projectedRevenue,
            probability: probability.toFixed(0),
            needed,
            trend
        };
    },
    
    // Gerar alertas
    generateAlerts() {
        const data = this.collectData();
        const alerts = [];
        
        // Alerta 1: Manutenções atrasadas (PRIORIDADE MÁXIMA)
        const maintenanceAlerts = this.getMaintenanceAlerts(data);
        alerts.push(...maintenanceAlerts);
        
        // Alerta 2: Contas vencidas
        const overdueBills = bills.filter(bill => {
            const billDate = new Date(bill.dueDate + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return billDate < today && !bill.paid;
        });
        
        if (overdueBills.length > 0) {
            const totalOverdue = overdueBills.reduce((sum, b) => sum + b.amount, 0);
            alerts.push({
                icon: '🚨',
                text: `Você tem ${overdueBills.length} conta(s) vencida(s) no valor de ${formatCurrency(totalOverdue)}`
            });
        }
        
        // Alerta 3: Meta muito distante
        const targetMonthly = data.goals.monthly || 6000;
        const needed = targetMonthly - data.totalRevenue;
        const dailyNeeded = data.workingDaysLeft > 0 ? needed / data.workingDaysLeft : 0;
        
        if (dailyNeeded > data.avgDailyRevenue * 1.5) {
            alerts.push({
                icon: '⚠️',
                text: `Para atingir a meta, você precisa fazer ${formatCurrency(dailyNeeded)}/dia, 50% acima da sua média atual`
            });
        }
        
        // Alerta 4: Combustível alto
        if (data.totalFuel > 0 && data.totalRevenue > 0) {
            const fuelPercent = (data.totalFuel / data.totalRevenue) * 100;
            if (fuelPercent > 25) {
                alerts.push({
                    icon: '⛽',
                    text: `Seu gasto com combustível está muito alto (${fuelPercent.toFixed(1)}% do faturamento)`
                });
            }
        }
        
        return alerts;
    },
    
    // Obter alertas de manutenção
    getMaintenanceAlerts(data) {
        const alerts = [];
        const maintenanceTypes = {
            'oil': { name: 'Troca de Óleo', icon: '🛢️' },
            'oil-filter': { name: 'Filtro de Óleo', icon: '🔧' },
            'air-filter': { name: 'Filtro de Ar', icon: '💨' },
            'fuel-filter': { name: 'Filtro de Combustível', icon: '⛽' },
            'cabin-filter': { name: 'Filtro de Cabine', icon: '🌬️' },
            'tires': { name: 'Pneus', icon: '🛞' },
            'brakes': { name: 'Freios', icon: '🛑' },
            'battery': { name: 'Bateria', icon: '🔋' },
            'alignment': { name: 'Alinhamento', icon: '📐' },
            'balancing': { name: 'Balanceamento', icon: '⚖️' },
            'suspension': { name: 'Suspensão', icon: '🔩' },
            'other': { name: 'Outros', icon: '🔧' }
        };
        
        // Pegar KM atual
        let currentKm = 0;
        if (data.monthKm.length > 0) {
            const lastKm = data.monthKm[data.monthKm.length - 1];
            currentKm = lastKm.kmFinal || 0;
        }
        
        // Verificar manutenções ativas
        const activeMaintenances = maintenanceData.filter(m => !m.completed);
        
        // Manutenções atrasadas (CRÍTICO)
        const overdue = activeMaintenances.filter(m => m.nextKm <= currentKm);
        overdue.forEach(m => {
            const typeInfo = maintenanceTypes[m.type];
            const kmOverdue = currentKm - m.nextKm;
            alerts.push({
                icon: '🚨',
                text: `${typeInfo.icon} ${typeInfo.name} está ${kmOverdue.toFixed(0)} km atrasada! Faça urgentemente para evitar danos ao veículo.`
            });
        });
        
        // Manutenções muito urgentes (menos de 200 km)
        const veryUrgent = activeMaintenances.filter(m => {
            const kmRemaining = m.nextKm - currentKm;
            return kmRemaining > 0 && kmRemaining <= 200;
        });
        
        veryUrgent.forEach(m => {
            const typeInfo = maintenanceTypes[m.type];
            const kmRemaining = m.nextKm - currentKm;
            alerts.push({
                icon: '⚠️',
                text: `${typeInfo.icon} ${typeInfo.name} precisa ser feita URGENTE! Faltam apenas ${kmRemaining.toFixed(0)} km.`
            });
        });
        
        return alerts;
    }
};

// Atualizar página de IA
function updateAIPage() {
    const data = AIAssistant.collectData();
    
    // Atualizar resumo rápido
    const targetDaily = data.goals.daily || 200;
    const percentVsTarget = ((data.avgDailyRevenue - targetDaily) / targetDaily) * 100;
    
    let statusText = '';
    if (percentVsTarget >= 10) {
        statusText = '🎉 Excelente!';
    } else if (percentVsTarget >= 0) {
        statusText = '✅ Bom';
    } else if (percentVsTarget >= -10) {
        statusText = '⚠️ Atenção';
    } else {
        statusText = '🚨 Crítico';
    }
    
    document.getElementById('aiStatusValue').textContent = statusText;
    document.getElementById('aiDailyTarget').textContent = formatCurrency(targetDaily);
    document.getElementById('aiTodayRevenue').textContent = formatCurrency(data.todayRevenue);
    
    // Atualizar insights
    const insights = AIAssistant.generateInsights();
    const insightsList = document.getElementById('aiInsightsList');
    if (insightsList) {
        insightsList.innerHTML = insights.map(insight => `
            <div class="ai-insight-card ${insight.type}">
                <div class="ai-insight-icon">${insight.icon}</div>
                <div class="ai-insight-content">
                    <div class="ai-insight-message">${insight.message}</div>
                    <div class="ai-insight-detail">${insight.detail}</div>
                </div>
            </div>
        `).join('');
    }
    
    // Atualizar recomendações
    const recommendations = AIAssistant.generateRecommendations();
    const recommendationsList = document.getElementById('aiRecommendationsList');
    if (recommendationsList) {
        recommendationsList.innerHTML = recommendations.map((rec, index) => `
            <div class="ai-recommendation-card">
                <div class="ai-recommendation-number">${index + 1}</div>
                <div class="ai-recommendation-text">${rec}</div>
            </div>
        `).join('');
    }
    
    // Atualizar padrões
    const bestDay = AIAssistant.findBestDayOfWeek(data.monthRevenues);
    if (bestDay) {
        document.getElementById('aiBestDay').textContent = bestDay.name;
        document.getElementById('aiBestDayDetail').textContent = `Média de ${formatCurrency(bestDay.avg)}`;
    }
    
    const bestTime = AIAssistant.findBestTime(data.monthRevenues);
    if (bestTime) {
        document.getElementById('aiBestTime').textContent = bestTime.name;
        document.getElementById('aiBestTimeDetail').textContent = `Média de ${formatCurrency(bestTime.avg)}`;
    } else {
        document.getElementById('aiBestTime').textContent = 'Sem dados';
        document.getElementById('aiBestTimeDetail').textContent = 'Registre horários nas receitas';
    }
    
    if (data.efficiency > 0) {
        document.getElementById('aiEfficiency').textContent = formatCurrency(data.efficiency);
        document.getElementById('aiEfficiencyDetail').textContent = `${data.totalKm.toFixed(0)} km rodados`;
    }
    
    const bestApp = AIAssistant.findBestApp(data.monthRevenues);
    if (bestApp) {
        document.getElementById('aiBestApp').textContent = bestApp.name;
        document.getElementById('aiBestAppDetail').textContent = `${formatCurrency(bestApp.avg)}/corrida`;
    }
    
    // Atualizar previsões
    const predictions = AIAssistant.generatePredictions();
    document.getElementById('aiProjectedRevenue').textContent = formatCurrency(predictions.projectedRevenue);
    document.getElementById('aiGoalProbability').textContent = predictions.probability + '%';
    document.getElementById('aiNeededAmount').textContent = formatCurrency(predictions.needed);
    document.getElementById('aiTrend').textContent = predictions.trend;
    
    // Atualizar alertas
    const alerts = AIAssistant.generateAlerts();
    const alertsSection = document.getElementById('aiAlertsSection');
    const alertsList = document.getElementById('aiAlertsList');
    
    if (alerts.length > 0) {
        alertsSection.style.display = 'block';
        alertsList.innerHTML = alerts.map(alert => `
            <div class="ai-alert-card">
                <div class="ai-alert-icon">${alert.icon}</div>
                <div class="ai-alert-text">${alert.text}</div>
            </div>
        `).join('');
    } else {
        alertsSection.style.display = 'none';
    }
}

// Atualizar insights (botão)
function refreshAIInsights() {
    updateAIPage();
    showNotification('🤖 Análises atualizadas!', 'success');
}

console.log('🤖 Assistente IA carregado!');

// ========== EXPORTAÇÃO DE RELATÓRIOS EM PDF ==========

// Abrir modal de período personalizado
function openCustomPeriodModal() {
    const modal = document.getElementById('customPeriodModal');
    if (!modal) return;
    
    // Definir data final como hoje
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reportEndDate').value = today;
    
    // Definir data inicial como 30 dias atrás
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    document.getElementById('reportStartDate').value = startDate.toISOString().split('T')[0];
    
    // Adicionar listeners para calcular dias
    const startInput = document.getElementById('reportStartDate');
    const endInput = document.getElementById('reportEndDate');
    
    const calculateDays = () => {
        const start = new Date(startInput.value);
        const end = new Date(endInput.value);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        document.getElementById('periodDays').textContent = days + ' dias';
    };
    
    startInput.addEventListener('change', calculateDays);
    endInput.addEventListener('change', calculateDays);
    calculateDays();
    
    modal.classList.add('active');
}

// Exportar relatório com período personalizado
function exportCustomPeriodPDF(event) {
    event.preventDefault();
    
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    if (!startDate || !endDate) {
        showNotification('❌ Selecione as datas', 'info');
        return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
        showNotification('❌ Data inicial deve ser anterior à data final', 'info');
        return;
    }
    
    closeModal('customPeriod');
    generatePDFReport(startDate, endDate);
}

// Exportar relatório em PDF (7, 15 ou 30 dias)
function exportReportPDF(days) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    generatePDFReport(startDateStr, endDateStr);
}

// Gerar relatório PDF completo
async function generatePDFReport(startDate, endDate) {
    showNotification('📄 Gerando relatório em PDF...', 'info');
    
    try {
        // Coletar dados do período
        const reportData = collectReportData(startDate, endDate);
        
        // Criar PDF com jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        let yPos = 20;
        const pageWidth = 210;
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        
        // ========== CABEÇALHO ==========
        doc.setFillColor(30, 136, 229); // Azul do logo
        doc.rect(0, 0, pageWidth, 45, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('Driver Finance', margin, 20);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('Relatorio Financeiro Completo', margin, 30);
        
        doc.setFontSize(11);
        doc.text('Periodo: ' + formatDateBR(startDate) + ' a ' + formatDateBR(endDate), margin, 38);
        
        yPos = 55;
        
        // ========== RESUMO FINANCEIRO ==========
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('RESUMO FINANCEIRO', margin, yPos);
        yPos += 10;
        
        // Box de resumo com grid
        doc.setFillColor(245, 250, 255);
        doc.roundedRect(margin, yPos, contentWidth, 50, 3, 3, 'F');
        doc.setDrawColor(30, 136, 229);
        doc.setLineWidth(0.5);
        doc.roundedRect(margin, yPos, contentWidth, 50, 3, 3, 'S');
        
        // Coluna 1
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Receita Total:', margin + 5, yPos + 10);
        doc.setFontSize(16);
        doc.setTextColor(76, 175, 80);
        doc.text(formatCurrency(reportData.totalRevenue), margin + 5, yPos + 18);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Despesa Total:', margin + 5, yPos + 28);
        doc.setFontSize(16);
        doc.setTextColor(244, 67, 54);
        doc.text(formatCurrency(reportData.totalExpense), margin + 5, yPos + 36);
        
        // Coluna 2
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Lucro Liquido:', margin + 70, yPos + 10);
        doc.setFontSize(16);
        doc.setTextColor(30, 136, 229);
        doc.text(formatCurrency(reportData.profit), margin + 70, yPos + 18);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Media Diaria:', margin + 70, yPos + 28);
        doc.setFontSize(16);
        doc.setTextColor(38, 166, 154);
        doc.text(formatCurrency(reportData.avgDaily), margin + 70, yPos + 36);
        
        // Coluna 3
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Total de Corridas:', margin + 135, yPos + 10);
        doc.setFontSize(20);
        doc.setTextColor(30, 136, 229);
        doc.text(reportData.totalTrips.toString(), margin + 135, yPos + 20);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Dias Trabalhados:', margin + 135, yPos + 32);
        doc.setFontSize(20);
        doc.setTextColor(38, 166, 154);
        doc.text(reportData.daysWorked.toString(), margin + 135, yPos + 42);
        
        yPos += 60;
        
        // ========== ANÁLISE POR APP ==========
        if (reportData.appStats.length > 0) {
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('ANALISE POR APLICATIVO', margin, yPos);
            yPos += 8;
            
            // Tabela de apps
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, yPos, contentWidth, 8, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('App', margin + 3, yPos + 5);
            doc.text('Corridas', margin + 50, yPos + 5);
            doc.text('Faturamento', margin + 85, yPos + 5);
            doc.text('Media/Corrida', margin + 130, yPos + 5);
            yPos += 8;
            
            reportData.appStats.forEach((app, index) => {
                if (index % 2 === 0) {
                    doc.setFillColor(255, 255, 255);
                } else {
                    doc.setFillColor(248, 248, 248);
                }
                doc.rect(margin, yPos, contentWidth, 7, 'F');
                
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);
                doc.text(app.name, margin + 3, yPos + 5);
                doc.text(app.trips.toString(), margin + 50, yPos + 5);
                doc.text(formatCurrency(app.revenue), margin + 85, yPos + 5);
                doc.text(formatCurrency(app.avg), margin + 130, yPos + 5);
                yPos += 7;
            });
            
            yPos += 8;
        }
        
        // Verificar se precisa de nova página
        if (yPos > 240) {
            doc.addPage();
            yPos = 20;
        }
        
        // ========== DESPESAS POR CATEGORIA ==========
        if (reportData.expensesByCategory.length > 0) {
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('DESPESAS POR CATEGORIA', margin, yPos);
            yPos += 8;
            
            // Tabela de categorias
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, yPos, contentWidth, 8, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Categoria', margin + 3, yPos + 5);
            doc.text('Valor', margin + 100, yPos + 5);
            doc.text('Percentual', margin + 140, yPos + 5);
            yPos += 8;
            
            reportData.expensesByCategory.forEach((cat, index) => {
                if (index % 2 === 0) {
                    doc.setFillColor(255, 255, 255);
                } else {
                    doc.setFillColor(248, 248, 248);
                }
                doc.rect(margin, yPos, contentWidth, 7, 'F');
                
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);
                doc.text(cat.name, margin + 3, yPos + 5);
                doc.text(formatCurrency(cat.amount), margin + 100, yPos + 5);
                doc.text(cat.percent + '%', margin + 140, yPos + 5);
                yPos += 7;
            });
            
            yPos += 8;
        }
        
        // Verificar se precisa de nova página
        if (yPos > 240) {
            doc.addPage();
            yPos = 20;
        }
        
        // ========== QUILOMETRAGEM ==========
        if (reportData.kmData.totalKm > 0) {
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('QUILOMETRAGEM', margin, yPos);
            yPos += 8;
            
            doc.setFillColor(245, 250, 255);
            doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'F');
            doc.setDrawColor(30, 136, 229);
            doc.setLineWidth(0.5);
            doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'S');
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('KM Rodado:', margin + 5, yPos + 8);
            doc.setFont('helvetica', 'normal');
            doc.text(reportData.kmData.totalKm.toFixed(1) + ' km', margin + 35, yPos + 8);
            
            doc.setFont('helvetica', 'bold');
            doc.text('Eficiencia:', margin + 5, yPos + 16);
            doc.setFont('helvetica', 'normal');
            doc.text(formatCurrency(reportData.kmData.efficiency) + '/km', margin + 35, yPos + 16);
            
            doc.setFont('helvetica', 'bold');
            doc.text('Combustivel:', margin + 100, yPos + 8);
            doc.setFont('helvetica', 'normal');
            doc.text(formatCurrency(reportData.kmData.fuelCost), margin + 135, yPos + 8);
            
            doc.setFont('helvetica', 'bold');
            doc.text('% do Faturamento:', margin + 100, yPos + 16);
            doc.setFont('helvetica', 'normal');
            doc.text(reportData.kmData.fuelPercent + '%', margin + 145, yPos + 16);
            
            yPos += 33;
        }
        
        // ========== MANUTENÇÕES ==========
        if (reportData.maintenances.length > 0) {
            // Verificar se precisa de nova página
            if (yPos > 220) {
                doc.addPage();
                yPos = 20;
            }
            
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('MANUTENCOES REALIZADAS', margin, yPos);
            yPos += 8;
            
            // Tabela de manutenções
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, yPos, contentWidth, 8, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Tipo', margin + 3, yPos + 5);
            doc.text('Data', margin + 80, yPos + 5);
            doc.text('Custo', margin + 130, yPos + 5);
            yPos += 8;
            
            reportData.maintenances.forEach((m, index) => {
                if (index % 2 === 0) {
                    doc.setFillColor(255, 255, 255);
                } else {
                    doc.setFillColor(248, 248, 248);
                }
                doc.rect(margin, yPos, contentWidth, 7, 'F');
                
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);
                doc.text(m.name, margin + 3, yPos + 5);
                doc.text(formatDateBR(m.date), margin + 80, yPos + 5);
                doc.text(formatCurrency(m.cost), margin + 130, yPos + 5);
                yPos += 7;
            });
        }
        
        // ========== RODAPÉ ==========
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            
            // Linha separadora
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(margin, 280, pageWidth - margin, 280);
            
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.setFont('helvetica', 'normal');
            doc.text('Gerado em ' + new Date().toLocaleString('pt-BR'), margin, 285);
            doc.text('Driver Finance - Gestao Financeira para Motoristas', pageWidth / 2, 285, { align: 'center' });
            doc.text('Pagina ' + i + ' de ' + pageCount, pageWidth - margin, 285, { align: 'right' });
        }
        
        // Salvar PDF
        const fileName = `relatorio_${startDate}_a_${endDate}.pdf`;
        doc.save(fileName);
        
        showNotification('✅ Relatório PDF gerado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        showNotification('❌ Erro ao gerar relatório: ' + error.message, 'info');
    }
}

// Coletar dados para o relatório
function collectReportData(startDate, endDate) {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    
    // Filtrar transações do período
    const periodTransactions = transactions.filter(t => {
        const tDate = new Date(t.date + 'T00:00:00');
        return tDate >= start && tDate <= end;
    });
    
    const revenues = periodTransactions.filter(t => t.type === 'revenue');
    const expenses = periodTransactions.filter(t => t.type === 'expense');
    
    const totalRevenue = revenues.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpense = expenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const profit = totalRevenue - totalExpense;
    const totalTrips = revenues.reduce((sum, t) => sum + (parseInt(t.trips) || 1), 0);
    
    // Dias trabalhados
    const uniqueDays = [...new Set(revenues.map(t => t.date))];
    const daysWorked = uniqueDays.length;
    const avgDaily = daysWorked > 0 ? totalRevenue / daysWorked : 0;
    
    // Análise por app
    const appStats = {};
    revenues.forEach(t => {
        const app = t.app || 'Não especificado';
        if (!appStats[app]) {
            appStats[app] = { name: app, revenue: 0, trips: 0 };
        }
        appStats[app].revenue += parseFloat(t.amount);
        appStats[app].trips += parseInt(t.trips) || 1;
    });
    
    const appStatsArray = Object.values(appStats).map(app => ({
        ...app,
        avg: app.trips > 0 ? app.revenue / app.trips : 0
    })).sort((a, b) => b.revenue - a.revenue);
    
    // Despesas por categoria
    const categoryNames = {
        gas: { name: 'Combustível', icon: '⛽' },
        maintenance: { name: 'Manutenção', icon: '🔧' },
        app: { name: 'Taxas de App', icon: '📱' },
        food: { name: 'Alimentação', icon: '🍔' },
        other: { name: 'Outros', icon: '📦' }
    };
    
    const expensesByCategory = {};
    expenses.forEach(e => {
        const cat = e.category || 'other';
        if (!expensesByCategory[cat]) {
            expensesByCategory[cat] = 0;
        }
        expensesByCategory[cat] += parseFloat(e.amount);
    });
    
    const expensesByCategoryArray = Object.entries(expensesByCategory).map(([cat, amount]) => ({
        name: categoryNames[cat]?.name || 'Outros',
        icon: categoryNames[cat]?.icon || '📦',
        amount,
        percent: totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0
    })).sort((a, b) => b.amount - a.amount);
    
    // KM rodado
    const periodKm = kmData.filter(item => {
        const itemDate = new Date(item.date + 'T00:00:00');
        return itemDate >= start && itemDate <= end;
    });
    
    const totalKm = periodKm.reduce((sum, item) => sum + item.kmRodado, 0);
    const efficiency = totalKm > 0 ? totalRevenue / totalKm : 0;
    
    const fuelExpenses = expenses.filter(e => e.category === 'gas');
    const fuelCost = fuelExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const fuelPercent = totalRevenue > 0 ? ((fuelCost / totalRevenue) * 100).toFixed(1) : 0;
    
    // Manutenções
    const maintenanceTypes = {
        'oil': { name: 'Troca de Óleo', icon: '🛢️' },
        'oil-filter': { name: 'Filtro de Óleo', icon: '🔧' },
        'air-filter': { name: 'Filtro de Ar', icon: '💨' },
        'fuel-filter': { name: 'Filtro de Combustível', icon: '⛽' },
        'cabin-filter': { name: 'Filtro de Cabine', icon: '🌬️' },
        'tires': { name: 'Pneus', icon: '🛞' },
        'brakes': { name: 'Freios', icon: '🛑' },
        'battery': { name: 'Bateria', icon: '🔋' },
        'alignment': { name: 'Alinhamento', icon: '📐' },
        'balancing': { name: 'Balanceamento', icon: '⚖️' },
        'suspension': { name: 'Suspensão', icon: '🔩' },
        'other': { name: 'Outros', icon: '🔧' }
    };
    
    const periodMaintenances = maintenanceData.filter(m => {
        const mDate = new Date(m.date + 'T00:00:00');
        return mDate >= start && mDate <= end;
    }).map(m => ({
        name: maintenanceTypes[m.type]?.name || 'Outros',
        icon: maintenanceTypes[m.type]?.icon || '🔧',
        date: m.date,
        cost: m.cost
    }));
    
    return {
        totalRevenue,
        totalExpense,
        profit,
        totalTrips,
        daysWorked,
        avgDaily,
        appStats: appStatsArray,
        expensesByCategory: expensesByCategoryArray,
        kmData: {
            totalKm,
            efficiency,
            fuelCost,
            fuelPercent
        },
        maintenances: periodMaintenances
    };
}

// Formatar data para BR
function formatDateBR(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

console.log('📄 Sistema de Exportação de Relatórios carregado!');

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
    
    if (!installButton) {
        console.log('⚠️ Botão de instalação não encontrado');
        return;
    }
    
    // Verificar se já está instalado (múltiplas formas)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = window.navigator.standalone === true;
    const isInstalled = isStandalone || isIOSStandalone;
    
    console.log('🔍 Status de instalação:', {
        isStandalone,
        isIOSStandalone,
        isInstalled
    });
    
    // Verificar se é mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Ocultar botão se já está instalado
    if (isInstalled) {
        installButton.style.display = 'none';
        console.log('✅ App instalado - botão ocultado');
        return;
    }
    
    // Mostrar botão apenas se:
    // 1. Não está instalado
    // 2. É mobile OU tem o deferredPrompt disponível
    if (isMobile || deferredPrompt) {
        installButton.style.display = 'block';
        console.log('📱 Botão de instalação visível');
    } else {
        installButton.style.display = 'none';
        console.log('🖥️ Desktop sem prompt - botão ocultado');
    }
}

// Atualizar botão ao carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM carregado - verificando botão de instalação');
    updateInstallButton();
    
    // Verificar novamente após 1 segundo (garantir que tudo carregou)
    setTimeout(updateInstallButton, 1000);
});

// Atualizar botão quando o prompt estiver disponível
window.addEventListener('beforeinstallprompt', () => {
    console.log('📲 beforeinstallprompt - atualizando botão');
    setTimeout(updateInstallButton, 100);
});

// Ocultar botão quando instalar
window.addEventListener('appinstalled', () => {
    console.log('🎉 App instalado - ocultando botão');
    updateInstallButton();
    
    // Garantir que o botão foi ocultado
    setTimeout(() => {
        const installButton = document.getElementById('installButton');
        if (installButton) {
            installButton.style.display = 'none';
        }
    }, 500);
});

// Verificar a cada 5 segundos se o app foi instalado (fallback)
setInterval(() => {
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isInstalled) {
        const installButton = document.getElementById('installButton');
        if (installButton && installButton.style.display !== 'none') {
            console.log('🔄 Detectado app instalado - ocultando botão');
            installButton.style.display = 'none';
        }
    }
}, 5000);

console.log('🔘 Botão de instalação no header configurado!');


// ========== ADIÇÃO RÁPIDA DE RECEITAS ==========

// Abrir modal de adição rápida
function openQuickAddModal() {
    const modal = document.getElementById('quickAddModal');
    if (modal) {
        modal.classList.add('active');
        
        // Focar no input
        setTimeout(() => {
            const input = document.getElementById('quickRevenueValue');
            if (input) {
                input.focus();
            }
        }, 300);
    }
}

// Adicionar receita com valor rápido (botões)
function addQuickRevenue(amount) {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const transaction = {
        id: Date.now(),
        type: 'revenue',
        amount: amount,
        app: 'outros', // Quick add sempre vai para "outros"
        description: `Corrida ${time}`,
        date: today,
        category: 'revenue'
    };
    
    // Adicionar transação
    transactions.push(transaction);
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    // Fechar modal
    closeModal('quickAdd');
    
    // Atualizar interface
    updateCircularProgress();
    createWeeklyChart();
    renderTransactions();
    updateAppComparator();
    
    // Verificar metas
    setTimeout(checkGoalsAndNotify, 500);
    
    // Feedback visual com animação
    showQuickAddFeedback(amount);
    
    console.log(`💰 Receita rápida adicionada: R$ ${amount}`);
}

// Adicionar receita com valor personalizado
function addCustomQuickRevenue(event) {
    event.preventDefault();
    
    const amount = parseFloat(document.getElementById('quickRevenueValue').value);
    
    if (amount && amount > 0) {
        addQuickRevenue(amount);
        
        // Limpar input
        document.getElementById('quickRevenueValue').value = '';
    }
}

// Feedback visual animado
function showQuickAddFeedback(amount) {
    // Criar elemento de feedback
    const feedback = document.createElement('div');
    feedback.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        background: linear-gradient(135deg, var(--accent-green) 0%, #00a843 100%);
        color: white;
        padding: 32px 48px;
        border-radius: 20px;
        font-size: 48px;
        font-weight: 900;
        z-index: 10001;
        box-shadow: 0 20px 60px rgba(0, 200, 83, 0.5);
        animation: quickAddPop 1s cubic-bezier(0.4, 0, 0.2, 1);
        text-align: center;
    `;
    
    feedback.innerHTML = `
        <div style="font-size: 64px; margin-bottom: 8px;">✅</div>
        <div style="font-size: 36px; margin-bottom: 4px;">+${formatCurrency(amount)}</div>
        <div style="font-size: 16px; opacity: 0.9; font-weight: 600;">Receita adicionada!</div>
    `;
    
    document.body.appendChild(feedback);
    
    // Remover após animação
    setTimeout(() => {
        feedback.style.animation = 'quickAddPopOut 0.3s ease-out';
        setTimeout(() => feedback.remove(), 300);
    }, 1500);
    
    // Vibrar (se suportado)
    if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
    }
}

// Adicionar animações CSS
const quickAddStyle = document.createElement('style');
quickAddStyle.textContent = `
    @keyframes quickAddPop {
        0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
        }
        50% {
            transform: translate(-50%, -50%) scale(1.1);
        }
        100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
    }
    
    @keyframes quickAddPopOut {
        from {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
        to {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0;
        }
    }
`;
document.head.appendChild(quickAddStyle);

console.log('💰 Sistema de adição rápida ativado!');
console.log('💡 Clique no botão verde 💰 para adicionar receitas rapidamente');

// Atalho de teclado para adição rápida (Ctrl+Shift+A)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        openQuickAddModal();
    }
});

console.log('⌨️ Atalho: Ctrl+Shift+A para adição rápida');


// ========== ATALHOS RÁPIDOS DA URL ==========

// Detectar se foi aberto por um atalho rápido
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Atalho de valor rápido (?quick=25)
    const quickValue = urlParams.get('quick');
    if (quickValue) {
        const amount = parseFloat(quickValue);
        if (amount && amount > 0) {
            console.log(`⚡ Atalho rápido detectado: R$ ${amount}`);
            
            // Aguardar 500ms para garantir que tudo carregou
            setTimeout(() => {
                addQuickRevenue(amount);
            }, 500);
        }
    }
    
    // Atalho para abrir modal de adição (?action=quick)
    const action = urlParams.get('action');
    if (action === 'quick') {
        console.log('⚡ Atalho de adição rápida detectado');
        
        setTimeout(() => {
            openQuickAddModal();
        }, 500);
    }
    
    // Limpar URL após processar
    if (quickValue || action === 'quick') {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

console.log('⚡ Sistema de atalhos rápidos ativado!');
console.log('💡 Pressione e segure o ícone do app para ver os atalhos');


// ========== RECEBER MENSAGENS DO SERVICE WORKER ==========

// Listener para mensagens do service worker (adição via notificação)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
        console.log('📨 Mensagem recebida do Service Worker:', event.data);
        
        if (event.data && event.data.type === 'QUICK_ADD') {
            const amount = event.data.amount;
            console.log(`💰 Processando adição rápida: R$ ${amount}`);
            
            // Adicionar receita
            addQuickRevenue(amount);
        }
    });
}

console.log('📨 Listener de mensagens do Service Worker ativado');

// ========== CONTROLE DE QUILOMETRAGEM (NOVO SISTEMA) ==========

let kmData = JSON.parse(localStorage.getItem('kmData')) || [];
let currentDaySession = JSON.parse(localStorage.getItem('currentDaySession')) || null;

// Iniciar dia de trabalho
function startDay() {
    const today = new Date().toISOString().split('T')[0];
    
    // Verificar se já tem sessão ativa hoje
    if (currentDaySession && currentDaySession.date === today) {
        showNotification('⚠️ Dia já foi iniciado!', 'info');
        return;
    }
    
    // Pedir KM inicial
    const kmInicial = prompt('Digite o KM inicial do veículo:');
    
    if (!kmInicial || kmInicial.trim() === '') {
        showNotification('❌ KM inicial não informado', 'info');
        return;
    }
    
    const kmInicialNum = parseFloat(kmInicial);
    
    if (isNaN(kmInicialNum) || kmInicialNum < 0) {
        showNotification('❌ KM inicial inválido', 'info');
        return;
    }
    
    // Criar sessão do dia
    currentDaySession = {
        date: today,
        kmInicial: kmInicialNum,
        startTime: new Date().toISOString()
    };
    
    localStorage.setItem('currentDaySession', JSON.stringify(currentDaySession));
    
    // Atualizar interface
    updateKmInterface();
    
    showNotification(`🚀 Dia iniciado! KM inicial: ${kmInicialNum.toFixed(1)} km`, 'success');
    
    // Vibrar
    if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
    }
}

// Finalizar dia de trabalho
function endDay() {
    if (!currentDaySession) {
        showNotification('⚠️ Você precisa iniciar o dia primeiro!', 'info');
        return;
    }
    
    // Pedir KM final
    const kmFinal = prompt('Digite o KM final do veículo:');
    
    if (!kmFinal || kmFinal.trim() === '') {
        showNotification('❌ KM final não informado', 'info');
        return;
    }
    
    const kmFinalNum = parseFloat(kmFinal);
    
    if (isNaN(kmFinalNum) || kmFinalNum < 0) {
        showNotification('❌ KM final inválido', 'info');
        return;
    }
    
    if (kmFinalNum <= currentDaySession.kmInicial) {
        showNotification('❌ KM final deve ser maior que o inicial!', 'info');
        return;
    }
    
    // Calcular KM rodado
    const kmRodado = kmFinalNum - currentDaySession.kmInicial;
    
    // Salvar registro
    const record = {
        date: currentDaySession.date,
        kmInicial: currentDaySession.kmInicial,
        kmFinal: kmFinalNum,
        kmRodado: kmRodado,
        startTime: currentDaySession.startTime,
        endTime: new Date().toISOString()
    };
    
    // Verificar se já existe registro para hoje
    const existingIndex = kmData.findIndex(item => item.date === currentDaySession.date);
    
    if (existingIndex >= 0) {
        kmData[existingIndex] = record;
    } else {
        kmData.push(record);
    }
    
    // Ordenar por data (mais recente primeiro)
    kmData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Salvar no localStorage
    localStorage.setItem('kmData', JSON.stringify(kmData));
    
    // Limpar sessão atual
    currentDaySession = null;
    localStorage.removeItem('currentDaySession');
    
    // Atualizar interface
    updateKmInterface();
    updateKmDisplay();
    
    // Atualizar manutenção
    if (typeof updateMaintenanceDisplay === 'function') {
        updateMaintenanceDisplay();
    }
    
    showNotification(`🏁 Dia finalizado! Você rodou ${kmRodado.toFixed(1)} km hoje`, 'success');
    
    // Vibrar
    if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
    }
}

// Atualizar interface do controle de KM
function updateKmInterface() {
    const kmInicialInput = document.getElementById('kmInicial');
    const kmFinalInput = document.getElementById('kmFinal');
    const btnStartDay = document.getElementById('btnStartDay');
    const btnEndDay = document.getElementById('btnEndDay');
    const statusBadge = document.getElementById('kmStatusBadge');
    const kmResult = document.getElementById('kmResult');
    const kmRodadoHoje = document.getElementById('kmRodadoHoje');
    
    if (!btnStartDay || !btnEndDay || !statusBadge) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Verificar se já finalizou hoje
    const todayRecord = kmData.find(item => item.date === today);
    
    if (todayRecord) {
        // Dia já finalizado
        statusBadge.className = 'km-status-badge completed';
        statusBadge.innerHTML = `
            <span class="km-status-icon">✅</span>
            <span class="km-status-text">Dia finalizado</span>
        `;
        
        kmInicialInput.value = todayRecord.kmInicial.toFixed(1);
        kmFinalInput.value = todayRecord.kmFinal.toFixed(1);
        
        btnStartDay.style.display = 'none';
        btnEndDay.style.display = 'none';
        
        if (kmResult) {
            kmResult.style.display = 'flex';
            kmRodadoHoje.textContent = todayRecord.kmRodado.toFixed(1) + ' km';
        }
    } else if (currentDaySession && currentDaySession.date === today) {
        // Dia em andamento
        statusBadge.className = 'km-status-badge active';
        statusBadge.innerHTML = `
            <span class="km-status-icon">🚗</span>
            <span class="km-status-text">Dia em andamento</span>
        `;
        
        kmInicialInput.value = currentDaySession.kmInicial.toFixed(1);
        kmFinalInput.value = '';
        
        btnStartDay.style.display = 'none';
        btnEndDay.style.display = 'block';
        
        if (kmResult) {
            kmResult.style.display = 'none';
        }
    } else {
        // Dia não iniciado
        statusBadge.className = 'km-status-badge';
        statusBadge.innerHTML = `
            <span class="km-status-icon">⏸️</span>
            <span class="km-status-text">Dia não iniciado</span>
        `;
        
        kmInicialInput.value = '';
        kmFinalInput.value = '';
        
        btnStartDay.style.display = 'block';
        btnEndDay.style.display = 'none';
        
        if (kmResult) {
            kmResult.style.display = 'none';
        }
    }
}

// Atualizar display de KM (resumo do mês)
function updateKmDisplay() {
    // Calcular totais do mês
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthData = kmData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
    });
    
    const totalKmMes = monthData.reduce((sum, item) => sum + item.kmRodado, 0);
    const diasTrabalhados = monthData.length;
    const mediaKmDia = diasTrabalhados > 0 ? totalKmMes / diasTrabalhados : 0;
    
    // Atualizar resumo do mês
    const kmTotalMesEl = document.getElementById('kmTotalMes');
    const kmMediaDiaEl = document.getElementById('kmMediaDia');
    const diasTrabalhadosEl = document.getElementById('diasTrabalhados');
    
    if (kmTotalMesEl) kmTotalMesEl.textContent = totalKmMes.toFixed(1) + ' km';
    if (kmMediaDiaEl) kmMediaDiaEl.textContent = mediaKmDia.toFixed(1) + ' km';
    if (diasTrabalhadosEl) diasTrabalhadosEl.textContent = diasTrabalhados;
}

// Ver histórico de KM
function viewKmHistory() {
    const modal = document.getElementById('kmHistoryModal');
    const list = document.getElementById('kmHistoryList');
    
    if (!modal || !list) return;
    
    if (kmData.length === 0) {
        list.innerHTML = '<div class="empty-state">📭 Nenhum registro de quilometragem ainda</div>';
    } else {
        list.innerHTML = kmData.map(item => {
            const date = new Date(item.date + 'T00:00:00');
            const dateStr = date.toLocaleDateString('pt-BR', { 
                weekday: 'short', 
                day: '2-digit', 
                month: 'short' 
            });
            
            return `
                <div class="km-history-item">
                    <div>
                        <div class="km-history-date">${dateStr}</div>
                        <div class="km-history-details">
                            ${item.kmInicial.toFixed(1)} km → ${item.kmFinal.toFixed(1)} km
                        </div>
                    </div>
                    <div class="km-history-value">${item.kmRodado.toFixed(1)} km</div>
                </div>
            `;
        }).join('');
    }
    
    modal.classList.add('active');
}

// Abrir modal de adicionar registro de KM
function openAddKmModal() {
    const modal = document.getElementById('addKmModal');
    if (!modal) return;
    
    // Definir data de hoje como padrão
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('kmRecordDate');
    if (dateInput) {
        dateInput.value = today;
    }
    
    // Limpar campos
    document.getElementById('kmRecordInicial').value = '';
    document.getElementById('kmRecordFinal').value = '';
    document.getElementById('kmRecordCalculated').textContent = '0 km';
    
    // Adicionar listeners para calcular automaticamente
    const kmInicialInput = document.getElementById('kmRecordInicial');
    const kmFinalInput = document.getElementById('kmRecordFinal');
    
    const calculateKm = () => {
        const inicial = parseFloat(kmInicialInput.value) || 0;
        const final = parseFloat(kmFinalInput.value) || 0;
        const rodado = final > inicial ? final - inicial : 0;
        document.getElementById('kmRecordCalculated').textContent = rodado.toFixed(1) + ' km';
    };
    
    kmInicialInput.addEventListener('input', calculateKm);
    kmFinalInput.addEventListener('input', calculateKm);
    
    modal.classList.add('active');
}

// Salvar registro de KM
function saveKmRecord(event) {
    event.preventDefault();
    
    const date = document.getElementById('kmRecordDate').value;
    const kmInicial = parseFloat(document.getElementById('kmRecordInicial').value);
    const kmFinal = parseFloat(document.getElementById('kmRecordFinal').value);
    
    // Validações
    if (!date) {
        showNotification('❌ Data não informada', 'info');
        return;
    }
    
    if (isNaN(kmInicial) || kmInicial < 0) {
        showNotification('❌ KM inicial inválido', 'info');
        return;
    }
    
    if (isNaN(kmFinal) || kmFinal < 0) {
        showNotification('❌ KM final inválido', 'info');
        return;
    }
    
    if (kmFinal <= kmInicial) {
        showNotification('❌ KM final deve ser maior que o inicial', 'info');
        return;
    }
    
    const kmRodado = kmFinal - kmInicial;
    
    // Criar registro
    const record = {
        date: date,
        kmInicial: kmInicial,
        kmFinal: kmFinal,
        kmRodado: kmRodado,
        startTime: new Date(date + 'T00:00:00').toISOString(),
        endTime: new Date(date + 'T23:59:59').toISOString()
    };
    
    // Verificar se já existe registro para esta data
    const existingIndex = kmData.findIndex(item => item.date === date);
    
    if (existingIndex >= 0) {
        // Perguntar se quer substituir
        if (confirm(`Já existe um registro para ${new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')}. Deseja substituir?`)) {
            kmData[existingIndex] = record;
        } else {
            return;
        }
    } else {
        kmData.push(record);
    }
    
    // Ordenar por data (mais recente primeiro)
    kmData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Salvar no localStorage
    localStorage.setItem('kmData', JSON.stringify(kmData));
    
    // Fechar modal
    closeModal('addKm');
    
    // Atualizar interface
    updateKmInterface();
    updateKmDisplay();
    
    // Atualizar manutenção
    if (typeof updateMaintenanceDisplay === 'function') {
        updateMaintenanceDisplay();
    }
    
    showNotification(`✅ Registro salvo! ${kmRodado.toFixed(1)} km rodados`, 'success');
}

// Inicializar KM ao carregar
document.addEventListener('DOMContentLoaded', function() {
    updateKmInterface();
    updateKmDisplay();
});

console.log('🚗 Sistema de controle de quilometragem carregado!');

// ========== CALCULADORA DE COMBUSTÍVEL ==========

let fuelData = JSON.parse(localStorage.getItem('fuelData')) || [];

// Atualizar preço por litro em tempo real
document.addEventListener('DOMContentLoaded', function() {
    const fuelLitrosInput = document.getElementById('fuelLitros');
    const fuelValorInput = document.getElementById('fuelValor');
    
    if (fuelLitrosInput && fuelValorInput) {
        fuelLitrosInput.addEventListener('input', calculatePricePerLiter);
        fuelValorInput.addEventListener('input', calculatePricePerLiter);
    }
    
    updateFuelStats();
});

// Calcular preço por litro
function calculatePricePerLiter() {
    const litros = parseFloat(document.getElementById('fuelLitros').value) || 0;
    const valor = parseFloat(document.getElementById('fuelValor').value) || 0;
    
    const precoLitro = litros > 0 ? valor / litros : 0;
    
    const precoLitroEl = document.getElementById('fuelPrecoLitro');
    if (precoLitroEl) {
        precoLitroEl.textContent = formatCurrency(precoLitro);
    }
}

// Salvar registro de abastecimento
function saveFuelRecord() {
    const litros = parseFloat(document.getElementById('fuelLitros').value) || 0;
    const valor = parseFloat(document.getElementById('fuelValor').value) || 0;
    const kmAtual = parseFloat(document.getElementById('fuelKmAtual').value) || 0;
    
    if (litros === 0 || valor === 0 || kmAtual === 0) {
        showNotification('⚠️ Preencha todos os campos!', 'info');
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const precoLitro = valor / litros;
    
    // Calcular consumo se houver abastecimento anterior
    let consumo = null;
    let kmRodado = null;
    
    if (fuelData.length > 0) {
        const lastFuel = fuelData[fuelData.length - 1];
        kmRodado = kmAtual - lastFuel.kmAtual;
        
        if (kmRodado > 0) {
            consumo = kmRodado / litros; // km/litro
        }
    }
    
    // Adicionar novo registro
    const newRecord = {
        id: Date.now(),
        date: today,
        litros: litros,
        valor: valor,
        precoLitro: precoLitro,
        kmAtual: kmAtual,
        kmRodado: kmRodado,
        consumo: consumo
    };
    
    fuelData.push(newRecord);
    
    // Salvar no localStorage
    localStorage.setItem('fuelData', JSON.stringify(fuelData));
    
    // Limpar formulário
    document.getElementById('fuelLitros').value = '';
    document.getElementById('fuelValor').value = '';
    document.getElementById('fuelKmAtual').value = '';
    document.getElementById('fuelPrecoLitro').textContent = 'R$ 0,00';
    
    // Atualizar estatísticas
    updateFuelStats();
    
    // Feedback
    if (consumo) {
        showNotification(`✅ Abastecimento registrado! Consumo: ${consumo.toFixed(2)} km/l`, 'success');
    } else {
        showNotification('✅ Primeiro abastecimento registrado!', 'success');
    }
    
    // Vibrar no mobile
    if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
    }
}

// Atualizar estatísticas de combustível
function updateFuelStats() {
    if (fuelData.length === 0) {
        // Zerar tudo se não houver dados
        const consumoMedioEl = document.getElementById('fuelConsumoMedio');
        const custoKmEl = document.getElementById('fuelCustoKm');
        const totalMesEl = document.getElementById('fuelTotalMes');
        const precoMedioEl = document.getElementById('fuelPrecoMedio');
        
        if (consumoMedioEl) consumoMedioEl.textContent = '0 km/l';
        if (custoKmEl) custoKmEl.textContent = 'R$ 0,00';
        if (totalMesEl) totalMesEl.textContent = 'R$ 0,00';
        if (precoMedioEl) precoMedioEl.textContent = 'R$ 0,00';
        
        // Esconder alerta
        const alertEl = document.getElementById('fuelAlert');
        if (alertEl) alertEl.style.display = 'none';
        
        return;
    }
    
    // Filtrar dados do mês atual
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthData = fuelData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
    });
    
    // Calcular consumo médio (apenas registros com consumo calculado)
    const recordsWithConsumption = fuelData.filter(item => item.consumo !== null);
    const avgConsumption = recordsWithConsumption.length > 0
        ? recordsWithConsumption.reduce((sum, item) => sum + item.consumo, 0) / recordsWithConsumption.length
        : 0;
    
    // Calcular custo por km
    const totalLitros = monthData.reduce((sum, item) => sum + item.litros, 0);
    const totalValor = monthData.reduce((sum, item) => sum + item.valor, 0);
    const totalKmRodado = monthData.reduce((sum, item) => sum + (item.kmRodado || 0), 0);
    
    const custoKm = totalKmRodado > 0 ? totalValor / totalKmRodado : 0;
    
    // Calcular preço médio por litro
    const avgPrecoLitro = monthData.length > 0
        ? monthData.reduce((sum, item) => sum + item.precoLitro, 0) / monthData.length
        : 0;
    
    // Atualizar interface
    const consumoMedioEl = document.getElementById('fuelConsumoMedio');
    const custoKmEl = document.getElementById('fuelCustoKm');
    const totalMesEl = document.getElementById('fuelTotalMes');
    const precoMedioEl = document.getElementById('fuelPrecoMedio');
    
    if (consumoMedioEl) consumoMedioEl.textContent = avgConsumption.toFixed(2) + ' km/l';
    if (custoKmEl) custoKmEl.textContent = formatCurrency(custoKm);
    if (totalMesEl) totalMesEl.textContent = formatCurrency(totalValor);
    if (precoMedioEl) precoMedioEl.textContent = formatCurrency(avgPrecoLitro);
    
    // Verificar alerta de consumo
    checkFuelAlert(avgConsumption, recordsWithConsumption);
}

// Verificar alerta de consumo
function checkFuelAlert(avgConsumption, records) {
    const alertEl = document.getElementById('fuelAlert');
    const alertMessageEl = document.getElementById('fuelAlertMessage');
    
    if (!alertEl || !alertMessageEl || records.length < 3) {
        if (alertEl) alertEl.style.display = 'none';
        return;
    }
    
    // Pegar últimos 3 abastecimentos
    const last3 = records.slice(-3);
    const last3Avg = last3.reduce((sum, item) => sum + item.consumo, 0) / 3;
    
    // Se o consumo dos últimos 3 for 10% menor que a média geral
    if (last3Avg < avgConsumption * 0.9) {
        const diff = ((avgConsumption - last3Avg) / avgConsumption * 100).toFixed(1);
        alertMessageEl.textContent = `Seu consumo caiu ${diff}% nos últimos abastecimentos. Verifique se há algum problema no veículo.`;
        alertEl.style.display = 'flex';
    } else {
        alertEl.style.display = 'none';
    }
}

// Ver histórico de combustível
function viewFuelHistory() {
    const modal = document.getElementById('fuelHistoryModal');
    const list = document.getElementById('fuelHistoryList');
    
    if (!modal || !list) return;
    
    if (fuelData.length === 0) {
        list.innerHTML = '<div class="empty-state">📭 Nenhum abastecimento registrado ainda</div>';
    } else {
        // Ordenar por data (mais recente primeiro)
        const sortedData = [...fuelData].reverse();
        
        list.innerHTML = sortedData.map(item => {
            const date = new Date(item.date + 'T00:00:00');
            const dateStr = date.toLocaleDateString('pt-BR', { 
                weekday: 'short', 
                day: '2-digit', 
                month: 'short' 
            });
            
            const consumoText = item.consumo 
                ? `<div class="fuel-history-consumption">⚡ ${item.consumo.toFixed(2)} km/l</div>`
                : '';
            
            const kmRodadoText = item.kmRodado 
                ? `${item.kmRodado.toFixed(1)} km rodados • `
                : '';
            
            return `
                <div class="fuel-history-item">
                    <div>
                        <div class="fuel-history-date">${dateStr}</div>
                        <div class="fuel-history-details">
                            ${item.litros.toFixed(2)}L • ${formatCurrency(item.precoLitro)}/L
                        </div>
                        <div class="fuel-history-details">
                            ${kmRodadoText}KM: ${item.kmAtual.toFixed(1)}
                        </div>
                        ${consumoText}
                    </div>
                    <div class="fuel-history-value">${formatCurrency(item.valor)}</div>
                </div>
            `;
        }).join('');
    }
    
    modal.classList.add('active');
}

console.log('⛽ Calculadora de combustível carregada!');

// ========== CONTROLE DE MANUTENÇÃO ==========

let maintenanceData = JSON.parse(localStorage.getItem('maintenanceData')) || [];

// Tipos de manutenção com ícones
const maintenanceTypes = {
    'oil': { name: 'Troca de Óleo', icon: '🛢️', defaultInterval: 5000 },
    'oil-filter': { name: 'Filtro de Óleo', icon: '🔧', defaultInterval: 5000 },
    'air-filter': { name: 'Filtro de Ar', icon: '💨', defaultInterval: 10000 },
    'fuel-filter': { name: 'Filtro de Combustível', icon: '⛽', defaultInterval: 20000 },
    'cabin-filter': { name: 'Filtro de Cabine', icon: '🌬️', defaultInterval: 10000 },
    'tires': { name: 'Pneus', icon: '🛞', defaultInterval: 40000 },
    'brakes': { name: 'Freios', icon: '🛑', defaultInterval: 30000 },
    'battery': { name: 'Bateria', icon: '🔋', defaultInterval: 50000 },
    'alignment': { name: 'Alinhamento', icon: '📐', defaultInterval: 10000 },
    'balancing': { name: 'Balanceamento', icon: '⚖️', defaultInterval: 10000 },
    'suspension': { name: 'Suspensão', icon: '🔩', defaultInterval: 30000 },
    'other': { name: 'Outros', icon: '🔧', defaultInterval: 10000 }
};

// Salvar registro de manutenção
function saveMaintenanceRecord() {
    const type = document.getElementById('maintenanceType').value;
    const date = document.getElementById('maintenanceDate').value;
    const currentKm = parseFloat(document.getElementById('maintenanceCurrentKm').value) || 0;
    const nextKm = parseFloat(document.getElementById('maintenanceNextKm').value) || 0;
    const cost = parseFloat(document.getElementById('maintenanceCost').value) || 0;
    const notes = document.getElementById('maintenanceNotes').value;
    
    if (!type || !date || currentKm === 0 || nextKm === 0) {
        showNotification('⚠️ Preencha todos os campos obrigatórios!', 'info');
        return;
    }
    
    if (nextKm <= currentKm) {
        showNotification('⚠️ KM da próxima troca deve ser maior que o KM atual!', 'info');
        return;
    }
    
    const newRecord = {
        id: Date.now(),
        type: type,
        date: date,
        currentKm: currentKm,
        nextKm: nextKm,
        cost: cost,
        notes: notes,
        completed: false
    };
    
    maintenanceData.push(newRecord);
    
    // Ordenar por próxima troca (mais urgente primeiro)
    maintenanceData.sort((a, b) => a.nextKm - b.nextKm);
    
    // Salvar no localStorage
    localStorage.setItem('maintenanceData', JSON.stringify(maintenanceData));
    
    // Limpar formulário
    document.getElementById('maintenanceType').value = '';
    document.getElementById('maintenanceDate').value = '';
    document.getElementById('maintenanceCurrentKm').value = '';
    document.getElementById('maintenanceNextKm').value = '';
    document.getElementById('maintenanceCost').value = '';
    document.getElementById('maintenanceNotes').value = '';
    
    // Atualizar interface
    updateMaintenanceDisplay();
    
    // Feedback
    const typeName = maintenanceTypes[type].name;
    showNotification(`✅ ${typeName} registrada com sucesso!`, 'success');
    
    // Vibrar no mobile
    if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
    }
    
    // Verificar alertas
    checkMaintenanceAlerts();
}

// Atualizar display de manutenções
function updateMaintenanceDisplay() {
    const list = document.getElementById('maintenanceList');
    
    if (!list) return;
    
    // Filtrar apenas manutenções ativas (não completadas)
    const activeMaintenances = maintenanceData.filter(m => !m.completed);
    
    if (activeMaintenances.length === 0) {
        list.innerHTML = '<div class="empty-state">📭 Nenhuma manutenção registrada</div>';
        return;
    }
    
    // Pegar KM atual do último registro de KM
    const kmData = JSON.parse(localStorage.getItem('kmData')) || [];
    let currentKm = 0;
    if (kmData.length > 0) {
        const lastKm = kmData[kmData.length - 1];
        currentKm = lastKm.kmFinal || 0;
    }
    
    list.innerHTML = activeMaintenances.map(maintenance => {
        const typeInfo = maintenanceTypes[maintenance.type];
        const kmRemaining = maintenance.nextKm - currentKm;
        const kmTotal = maintenance.nextKm - maintenance.currentKm;
        const progress = currentKm > maintenance.currentKm 
            ? Math.min(((currentKm - maintenance.currentKm) / kmTotal) * 100, 100)
            : 0;
        
        // Determinar status
        let status = 'ok';
        let statusText = '✅ Em dia';
        let progressClass = '';
        
        if (kmRemaining <= 0) {
            status = 'urgent';
            statusText = '🚨 Atrasado!';
            progressClass = 'danger';
        } else if (kmRemaining <= 500) {
            status = 'urgent';
            statusText = '⚠️ Urgente!';
            progressClass = 'danger';
        } else if (kmRemaining <= 1000) {
            status = 'warning';
            statusText = '⚠️ Atenção';
            progressClass = 'warning';
        }
        
        return `
            <div class="maintenance-item">
                <div class="maintenance-item-header">
                    <div class="maintenance-item-type">
                        ${typeInfo.icon} ${typeInfo.name}
                    </div>
                    <div class="maintenance-item-date">
                        ${formatDate(maintenance.date)}
                    </div>
                </div>
                <div class="maintenance-item-details">
                    <div class="maintenance-detail">
                        <div class="maintenance-detail-label">KM Atual</div>
                        <div class="maintenance-detail-value">${currentKm.toFixed(0)} km</div>
                    </div>
                    <div class="maintenance-detail">
                        <div class="maintenance-detail-label">Próxima Troca</div>
                        <div class="maintenance-detail-value">${maintenance.nextKm.toFixed(0)} km</div>
                    </div>
                    <div class="maintenance-detail">
                        <div class="maintenance-detail-label">Faltam</div>
                        <div class="maintenance-detail-value">${Math.max(0, kmRemaining).toFixed(0)} km</div>
                    </div>
                    ${maintenance.cost > 0 ? `
                    <div class="maintenance-detail">
                        <div class="maintenance-detail-label">Custo</div>
                        <div class="maintenance-detail-value">${formatCurrency(maintenance.cost)}</div>
                    </div>
                    ` : ''}
                </div>
                <div class="maintenance-progress-bar">
                    <div class="maintenance-progress-fill ${progressClass}" style="width: ${progress}%"></div>
                </div>
                <div class="maintenance-status ${status}">${statusText}</div>
            </div>
        `;
    }).join('');
    
    // Verificar alertas
    checkMaintenanceAlerts();
}

// Verificar alertas de manutenção
function checkMaintenanceAlerts() {
    const alertEl = document.getElementById('maintenanceAlert');
    const alertMessageEl = document.getElementById('maintenanceAlertMessage');
    
    if (!alertEl || !alertMessageEl) return;
    
    // Pegar KM atual
    const kmData = JSON.parse(localStorage.getItem('kmData')) || [];
    let currentKm = 0;
    if (kmData.length > 0) {
        const lastKm = kmData[kmData.length - 1];
        currentKm = lastKm.kmFinal || 0;
    }
    
    // Filtrar manutenções urgentes
    const urgentMaintenances = maintenanceData.filter(m => {
        if (m.completed) return false;
        const kmRemaining = m.nextKm - currentKm;
        return kmRemaining <= 500;
    });
    
    if (urgentMaintenances.length === 0) {
        alertEl.style.display = 'none';
        return;
    }
    
    // Mostrar alerta
    alertEl.style.display = 'flex';
    
    if (urgentMaintenances.length === 1) {
        const m = urgentMaintenances[0];
        const typeInfo = maintenanceTypes[m.type];
        const kmRemaining = m.nextKm - currentKm;
        
        if (kmRemaining <= 0) {
            alertMessageEl.textContent = `${typeInfo.name} está atrasada! Você já passou ${Math.abs(kmRemaining).toFixed(0)} km da troca.`;
        } else {
            alertMessageEl.textContent = `${typeInfo.name} precisa ser feita em breve! Faltam apenas ${kmRemaining.toFixed(0)} km.`;
        }
    } else {
        alertMessageEl.textContent = `Você tem ${urgentMaintenances.length} manutenções urgentes! Verifique a lista.`;
    }
    
    // Enviar notificação se suportado
    sendMaintenanceNotification(urgentMaintenances);
}

// Enviar notificação de manutenção
function sendMaintenanceNotification(urgentMaintenances) {
    if (Notification.permission !== 'granted') return;
    if (urgentMaintenances.length === 0) return;
    
    // Verificar se já enviou notificação hoje
    const lastNotification = localStorage.getItem('last_maintenance_notification');
    const today = new Date().toISOString().split('T')[0];
    
    if (lastNotification === today) return;
    
    // Enviar notificação
    const m = urgentMaintenances[0];
    const typeInfo = maintenanceTypes[m.type];
    
    new Notification('🔧 Manutenção Urgente!', {
        body: `${typeInfo.name} precisa ser feita em breve!`,
        icon: './img/logotipo.png',
        badge: './img/logotipo.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: 'maintenance-alert'
    });
    
    localStorage.setItem('last_maintenance_notification', today);
}

// Ver histórico de manutenção
function viewMaintenanceHistory() {
    const modal = document.getElementById('maintenanceHistoryModal');
    const list = document.getElementById('maintenanceHistoryList');
    
    if (!modal || !list) return;
    
    if (maintenanceData.length === 0) {
        list.innerHTML = '<div class="empty-state">📭 Nenhuma manutenção registrada ainda</div>';
    } else {
        // Ordenar por data (mais recente primeiro)
        const sortedData = [...maintenanceData].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        list.innerHTML = sortedData.map(maintenance => {
            const typeInfo = maintenanceTypes[maintenance.type];
            const date = new Date(maintenance.date + 'T00:00:00');
            const dateStr = date.toLocaleDateString('pt-BR', { 
                weekday: 'short', 
                day: '2-digit', 
                month: 'short',
                year: 'numeric'
            });
            
            return `
                <div class="maintenance-history-item">
                    <div class="maintenance-history-info">
                        <div class="maintenance-history-type">
                            ${typeInfo.icon} ${typeInfo.name}
                        </div>
                        <div class="maintenance-history-date">${dateStr}</div>
                        <div class="maintenance-history-details">
                            KM: ${maintenance.currentKm.toFixed(0)} → ${maintenance.nextKm.toFixed(0)}
                            ${maintenance.cost > 0 ? ` • Custo: ${formatCurrency(maintenance.cost)}` : ''}
                            ${maintenance.notes ? ` • ${maintenance.notes}` : ''}
                        </div>
                    </div>
                    <div class="maintenance-history-actions">
                        <button class="btn-delete-maintenance" onclick="deleteMaintenanceRecord(${maintenance.id})">
                            🗑️ Excluir
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    modal.classList.add('active');
}

// Excluir registro de manutenção
function deleteMaintenanceRecord(id) {
    if (confirm('Tem certeza que deseja excluir este registro de manutenção?')) {
        maintenanceData = maintenanceData.filter(m => m.id !== id);
        localStorage.setItem('maintenanceData', JSON.stringify(maintenanceData));
        
        updateMaintenanceDisplay();
        viewMaintenanceHistory(); // Atualizar modal se estiver aberto
        
        showNotification('✅ Registro de manutenção excluído!', 'success');
    }
}

// Marcar manutenção como completada
function completeMaintenanceRecord(id) {
    const maintenance = maintenanceData.find(m => m.id === id);
    if (maintenance) {
        maintenance.completed = true;
        localStorage.setItem('maintenanceData', JSON.stringify(maintenanceData));
        
        updateMaintenanceDisplay();
        showNotification('✅ Manutenção marcada como completada!', 'success');
    }
}

// Inicializar manutenção ao carregar
document.addEventListener('DOMContentLoaded', function() {
    const maintenanceDateInput = document.getElementById('maintenanceDate');
    if (maintenanceDateInput) {
        maintenanceDateInput.value = new Date().toISOString().split('T')[0];
    }
    
    updateMaintenanceDisplay();
});

// Atualizar manutenção quando KM mudar
const originalSaveKmDay = saveKmDay;
if (typeof saveKmDay === 'function') {
    saveKmDay = function() {
        originalSaveKmDay();
        setTimeout(() => {
            updateMaintenanceDisplay();
        }, 500);
    };
}

console.log('🔧 Sistema de controle de manutenção carregado!');

// ========== COMPARADOR DE APPS ==========

let appComparisonChart = null;

// Atualizar comparador de apps
function updateAppComparator() {
    console.log('📱 Atualizando comparador de apps...');
    
    // Filtrar apenas receitas do mês atual
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthRevenues = transactions.filter(t => {
        if (t.type !== 'revenue') return false;
        const transDate = new Date(t.date);
        return transDate.getMonth() === currentMonth && transDate.getFullYear() === currentYear;
    });
    
    // Calcular estatísticas por app
    const appStats = {
        uber: { trips: 0, revenue: 0, avg: 0 },
        '99': { trips: 0, revenue: 0, avg: 0 },
        indrive: { trips: 0, revenue: 0, avg: 0 },
        outros: { trips: 0, revenue: 0, avg: 0 }
    };
    
    monthRevenues.forEach(transaction => {
        const app = transaction.app || 'outros';
        if (appStats[app]) {
            // Somar a quantidade de corridas informada
            const trips = parseInt(transaction.trips) || 1;
            appStats[app].trips += trips;
            appStats[app].revenue += parseFloat(transaction.amount);
        }
    });
    
    // Calcular médias
    Object.keys(appStats).forEach(app => {
        if (appStats[app].trips > 0) {
            appStats[app].avg = appStats[app].revenue / appStats[app].trips;
        }
    });
    
    // Atualizar cards
    updateAppCard('uber', appStats.uber);
    updateAppCard('99', appStats['99']);
    updateAppCard('indrive', appStats.indrive);
    updateAppCard('outros', appStats.outros);
    
    // Encontrar melhor app
    findBestApp(appStats);
    
    // Criar gráfico de comparação
    createAppComparisonChart(appStats);
    
    console.log('✅ Comparador de apps atualizado!', appStats);
}

// Atualizar card de app individual
function updateAppCard(appName, stats) {
    const tripsEl = document.getElementById(`${appName}Trips`);
    const revenueEl = document.getElementById(`${appName}Revenue`);
    const avgEl = document.getElementById(`${appName}Avg`);
    
    if (tripsEl) tripsEl.textContent = stats.trips;
    if (revenueEl) revenueEl.textContent = formatCurrency(stats.revenue);
    if (avgEl) avgEl.textContent = formatCurrency(stats.avg);
}

// Encontrar e exibir melhor app do mês
function findBestApp(appStats) {
    const banner = document.getElementById('bestAppBanner');
    const nameEl = document.getElementById('bestAppName');
    const statsEl = document.getElementById('bestAppStats');
    
    if (!banner || !nameEl || !statsEl) return;
    
    // Encontrar app com maior faturamento
    let bestApp = null;
    let maxRevenue = 0;
    
    Object.keys(appStats).forEach(app => {
        if (appStats[app].revenue > maxRevenue) {
            maxRevenue = appStats[app].revenue;
            bestApp = app;
        }
    });
    
    // Se não houver dados, esconder banner
    if (!bestApp || maxRevenue === 0) {
        banner.style.display = 'none';
        return;
    }
    
    // Nomes dos apps
    const appNames = {
        uber: 'Uber',
        '99': '99',
        indrive: 'InDrive',
        outros: 'Outros'
    };
    
    // Mostrar banner
    banner.style.display = 'flex';
    nameEl.textContent = appNames[bestApp];
    statsEl.textContent = `${appStats[bestApp].trips} corridas • ${formatCurrency(appStats[bestApp].revenue)} • Média: ${formatCurrency(appStats[bestApp].avg)}`;
}

// Criar gráfico de comparação de apps
function createAppComparisonChart(appStats) {
    const ctx = document.getElementById('appComparisonChart');
    if (!ctx) return;
    
    // Destruir gráfico anterior se existir
    if (appComparisonChart) {
        appComparisonChart.destroy();
    }
    
    const isDark = currentTheme === 'dark';
    const gridColor = isDark ? '#2a2a2a' : '#e4e6eb';
    const textColor = isDark ? '#a0a0a0' : '#65676b';
    
    // Dados para o gráfico
    const labels = ['Uber', '99', 'InDrive', 'Outros'];
    const revenues = [
        appStats.uber.revenue,
        appStats['99'].revenue,
        appStats.indrive.revenue,
        appStats.outros.revenue
    ];
    
    const trips = [
        appStats.uber.trips,
        appStats['99'].trips,
        appStats.indrive.trips,
        appStats.outros.trips
    ];
    
    appComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Faturamento (R$)',
                    data: revenues,
                    backgroundColor: [
                        'rgba(0, 0, 0, 0.8)',
                        'rgba(255, 215, 0, 0.8)',
                        'rgba(0, 214, 50, 0.8)',
                        'rgba(108, 117, 125, 0.8)'
                    ],
                    borderRadius: 8,
                    yAxisID: 'y'
                },
                {
                    label: 'Corridas',
                    data: trips,
                    backgroundColor: [
                        'rgba(0, 0, 0, 0.4)',
                        'rgba(255, 215, 0, 0.4)',
                        'rgba(0, 214, 50, 0.4)',
                        'rgba(108, 117, 125, 0.4)'
                    ],
                    borderRadius: 8,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
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
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.datasetIndex === 0) {
                                label += formatCurrency(context.parsed.y);
                            } else {
                                label += context.parsed.y + ' corridas';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
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
                    },
                    title: {
                        display: true,
                        text: 'Faturamento (R$)',
                        color: textColor,
                        font: {
                            size: 12,
                            weight: 'bold',
                            family: 'Inter'
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            size: 11,
                            family: 'Inter'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Corridas',
                        color: textColor,
                        font: {
                            size: 12,
                            weight: 'bold',
                            family: 'Inter'
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
                            family: 'Inter',
                            weight: 'bold'
                        }
                    }
                }
            }
        }
    });
}

console.log('📱 Comparador de apps carregado!');

