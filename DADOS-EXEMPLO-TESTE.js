/**
 * DADOS DE EXEMPLO PARA TESTE DO FILTRO DE PERÍODO
 * 
 * Como usar:
 * 1. Abra o index.html no navegador
 * 2. Pressione F12 para abrir DevTools
 * 3. Vá até a aba "Console"
 * 4. Copie e cole este código completo
 * 5. Pressione Enter
 * 6. Página será recarregada com dados de teste
 */

// ========== FUNÇÃO AUXILIAR - CALCULAR DATAS ==========
function getDateDaysAgo(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
}

// ========== DADOS DE TESTE - TRANSAÇÕES ==========
const testTransactions = [
    // ========== HOJE (dia atual) ==========
    {
        id: Date.now() + 1,
        type: 'revenue',
        amount: 45.80,
        date: getDateDaysAgo(0),
        app: 'Uber',
        trips: 1,
        description: 'Corrida manhã',
        workTime: {
            start: '08:00',
            end: '08:30',
            totalMinutes: 30
        }
    },
    {
        id: Date.now() + 2,
        type: 'revenue',
        amount: 38.50,
        date: getDateDaysAgo(0),
        app: '99',
        trips: 1,
        description: 'Corrida tarde',
        workTime: {
            start: '14:00',
            end: '14:25',
            totalMinutes: 25
        }
    },
    {
        id: Date.now() + 3,
        type: 'revenue',
        amount: 52.00,
        date: getDateDaysAgo(0),
        app: 'Uber',
        trips: 1,
        description: 'Corrida noite',
        workTime: {
            start: '19:00',
            end: '19:40',
            totalMinutes: 40
        }
    },
    {
        id: Date.now() + 4,
        type: 'expense',
        amount: 80.00,
        date: getDateDaysAgo(0),
        category: 'gas',
        description: 'Abastecimento manhã'
    },
    {
        id: Date.now() + 5,
        type: 'expense',
        amount: 15.00,
        date: getDateDaysAgo(0),
        category: 'food',
        description: 'Almoço'
    },
    
    // ========== ONTEM (1 dia atrás) ==========
    {
        id: Date.now() + 6,
        type: 'revenue',
        amount: 180.50,
        date: getDateDaysAgo(1),
        app: 'Uber',
        trips: 5,
        description: 'Dia de trabalho completo',
        workTime: {
            start: '08:00',
            end: '18:00',
            totalMinutes: 600
        }
    },
    {
        id: Date.now() + 7,
        type: 'expense',
        amount: 100.00,
        date: getDateDaysAgo(1),
        category: 'gas',
        description: 'Abastecimento'
    },
    {
        id: Date.now() + 8,
        type: 'expense',
        amount: 25.00,
        date: getDateDaysAgo(1),
        category: 'food',
        description: 'Alimentação'
    },
    
    // ========== 2 DIAS ATRÁS ==========
    {
        id: Date.now() + 9,
        type: 'revenue',
        amount: 220.00,
        date: getDateDaysAgo(2),
        app: '99',
        trips: 7,
        description: 'Bom dia de trabalho',
        workTime: {
            start: '07:00',
            end: '19:00',
            totalMinutes: 720
        }
    },
    {
        id: Date.now() + 10,
        type: 'expense',
        amount: 95.00,
        date: getDateDaysAgo(2),
        category: 'gas',
        description: 'Abastecimento'
    },
    
    // ========== 3 DIAS ATRÁS ==========
    {
        id: Date.now() + 11,
        type: 'revenue',
        amount: 195.00,
        date: getDateDaysAgo(3),
        app: 'Indrive',
        trips: 6,
        description: 'Dia normal',
        workTime: {
            start: '09:00',
            end: '17:00',
            totalMinutes: 480
        }
    },
    {
        id: Date.now() + 12,
        type: 'expense',
        amount: 85.00,
        date: getDateDaysAgo(3),
        category: 'gas',
        description: 'Abastecimento'
    },
    
    // ========== 4 DIAS ATRÁS ==========
    {
        id: Date.now() + 13,
        type: 'revenue',
        amount: 175.00,
        date: getDateDaysAgo(4),
        app: 'Uber',
        trips: 5,
        description: 'Dia médio',
        workTime: {
            start: '10:00',
            end: '18:00',
            totalMinutes: 480
        }
    },
    {
        id: Date.now() + 14,
        type: 'expense',
        amount: 90.00,
        date: getDateDaysAgo(4),
        category: 'gas',
        description: 'Abastecimento'
    },
    
    // ========== 5 DIAS ATRÁS ==========
    {
        id: Date.now() + 15,
        type: 'revenue',
        amount: 240.00,
        date: getDateDaysAgo(5),
        app: '99',
        trips: 8,
        description: 'Excelente dia',
        workTime: {
            start: '07:00',
            end: '20:00',
            totalMinutes: 780
        }
    },
    {
        id: Date.now() + 16,
        type: 'expense',
        amount: 110.00,
        date: getDateDaysAgo(5),
        category: 'gas',
        description: 'Abastecimento'
    },
    
    // ========== 6 DIAS ATRÁS ==========
    {
        id: Date.now() + 17,
        type: 'revenue',
        amount: 165.00,
        date: getDateDaysAgo(6),
        app: 'Indrive',
        trips: 5,
        description: 'Dia tranquilo',
        workTime: {
            start: '11:00',
            end: '18:00',
            totalMinutes: 420
        }
    },
    {
        id: Date.now() + 18,
        type: 'expense',
        amount: 75.00,
        date: getDateDaysAgo(6),
        category: 'gas',
        description: 'Abastecimento'
    },
    
    // ========== 10 DIAS ATRÁS ==========
    {
        id: Date.now() + 19,
        type: 'revenue',
        amount: 280.00,
        date: getDateDaysAgo(10),
        app: 'Uber',
        trips: 9,
        description: 'Dia recorde',
        workTime: {
            start: '06:00',
            end: '20:00',
            totalMinutes: 840
        }
    },
    {
        id: Date.now() + 20,
        type: 'expense',
        amount: 120.00,
        date: getDateDaysAgo(10),
        category: 'gas',
        description: 'Abastecimento'
    },
    {
        id: Date.now() + 21,
        type: 'expense',
        amount: 200.00,
        date: getDateDaysAgo(10),
        category: 'maintenance',
        description: 'Troca de óleo'
    },
    
    // ========== 15 DIAS ATRÁS ==========
    {
        id: Date.now() + 22,
        type: 'revenue',
        amount: 320.00,
        date: getDateDaysAgo(15),
        app: '99',
        trips: 10,
        description: 'Dia cheio',
        workTime: {
            start: '07:00',
            end: '21:00',
            totalMinutes: 840
        }
    },
    {
        id: Date.now() + 23,
        type: 'expense',
        amount: 130.00,
        date: getDateDaysAgo(15),
        category: 'gas',
        description: 'Abastecimento duplo'
    },
    
    // ========== 25 DIAS ATRÁS ==========
    {
        id: Date.now() + 24,
        type: 'revenue',
        amount: 190.00,
        date: getDateDaysAgo(25),
        app: 'Indrive',
        trips: 6,
        description: 'Dia comum',
        workTime: {
            start: '09:00',
            end: '17:00',
            totalMinutes: 480
        }
    },
    {
        id: Date.now() + 25,
        type: 'expense',
        amount: 85.00,
        date: getDateDaysAgo(25),
        category: 'gas',
        description: 'Abastecimento'
    },
    
    // ========== MÊS PASSADO (35 dias atrás) ==========
    {
        id: Date.now() + 26,
        type: 'revenue',
        amount: 400.00,
        date: getDateDaysAgo(35),
        app: 'Uber',
        trips: 12,
        description: 'Dia histórico',
        workTime: {
            start: '06:00',
            end: '22:00',
            totalMinutes: 960
        }
    },
    {
        id: Date.now() + 27,
        type: 'expense',
        amount: 150.00,
        date: getDateDaysAgo(35),
        category: 'gas',
        description: 'Abastecimento completo'
    },
    {
        id: Date.now() + 28,
        type: 'expense',
        amount: 500.00,
        date: getDateDaysAgo(35),
        category: 'maintenance',
        description: 'Revisão completa'
    }
];

// ========== SALVAR NO LOCALSTORAGE ==========
console.log('📦 Salvando dados de teste no localStorage...');
localStorage.setItem('transactions', JSON.stringify(testTransactions));

// ========== CALCULAR E MOSTRAR ESTATÍSTICAS ==========
const hoje = getDateDaysAgo(0);
const transacoesHoje = testTransactions.filter(t => t.date === hoje);
const receitasHoje = transacoesHoje.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0);
const despesasHoje = transacoesHoje.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
const lucroHoje = receitasHoje - despesasHoje;

console.log('✅ Dados salvos com sucesso!');
console.log('');
console.log('📊 ESTATÍSTICAS DOS DADOS DE TESTE:');
console.log('════════════════════════════════════');
console.log('Total de transações:', testTransactions.length);
console.log('');
console.log('💰 HOJE:');
console.log('  Receitas:', 'R$', receitasHoje.toFixed(2));
console.log('  Despesas:', 'R$', despesasHoje.toFixed(2));
console.log('  Lucro:   ', 'R$', lucroHoje.toFixed(2));
console.log('');

// Calcular semana
const inicioSemana = new Date();
inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
const transacoesSemana = testTransactions.filter(t => {
    const transDate = new Date(t.date + 'T00:00:00');
    return transDate >= inicioSemana;
});
const receitasSemana = transacoesSemana.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0);
const despesasSemana = transacoesSemana.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
const lucroSemana = receitasSemana - despesasSemana;

console.log('📅 ESTA SEMANA:');
console.log('  Receitas:', 'R$', receitasSemana.toFixed(2));
console.log('  Despesas:', 'R$', despesasSemana.toFixed(2));
console.log('  Lucro:   ', 'R$', lucroSemana.toFixed(2));
console.log('');

// Calcular mês
const inicioMes = new Date();
inicioMes.setDate(1);
const transacoesMes = testTransactions.filter(t => {
    const transDate = new Date(t.date + 'T00:00:00');
    return transDate >= inicioMes;
});
const receitasMes = transacoesMes.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0);
const despesasMes = transacoesMes.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
const lucroMes = receitasMes - despesasMes;

console.log('📆 ESTE MÊS:');
console.log('  Receitas:', 'R$', receitasMes.toFixed(2));
console.log('  Despesas:', 'R$', despesasMes.toFixed(2));
console.log('  Lucro:   ', 'R$', lucroMes.toFixed(2));
console.log('');
console.log('════════════════════════════════════');
console.log('🔄 Recarregando página em 2 segundos...');

// ========== RECARREGAR PÁGINA ==========
setTimeout(() => {
    location.reload();
}, 2000);
