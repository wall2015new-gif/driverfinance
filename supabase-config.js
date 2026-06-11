/**
 * CONFIGURAÇÃO SUPABASE - DRIVER FINANCE
 * 
 * Este arquivo contém a configuração para migrar do localStorage
 * para Supabase (banco de dados na nuvem)
 * 
 * INSTRUÇÕES:
 * 1. Criar conta no Supabase: https://supabase.com
 * 2. Criar novo projeto
 * 3. Pegar as credenciais (URL e KEY)
 * 4. Substituir abaixo
 * 5. Descomentar e usar as funções
 */

// ========== CREDENCIAIS (SUBSTITUIR) ==========
const SUPABASE_URL = 'https://seu-projeto.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-anonima-aqui';

// ========== INICIALIZAR SUPABASE ==========
// Descomentar quando quiser usar:
// const { createClient } = supabase;
// const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== FUNÇÕES DE MIGRAÇÃO ==========

/**
 * Migrar transações do localStorage para Supabase
 */
async function migrateToSupabase() {
    // Pegar dados do localStorage
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const goals = JSON.parse(localStorage.getItem('goals')) || {};
    
    if (transactions.length === 0) {
        console.warn('⚠️ Nenhuma transação para migrar');
        return;
    }
    
    console.log('🔄 Migrando', transactions.length, 'transações...');
    
    // Inserir no Supabase
    // const { data, error } = await supabaseClient
    //     .from('transactions')
    //     .insert(transactions);
    
    // if (error) {
    //     console.error('❌ Erro ao migrar:', error);
    // } else {
    //     console.log('✅ Migração concluída!', data);
    // }
}

/**
 * Salvar transação no Supabase
 */
async function saveTransactionToSupabase(transaction) {
    // const { data, error } = await supabaseClient
    //     .from('transactions')
    //     .insert([transaction]);
    
    // if (error) {
    //     console.error('❌ Erro ao salvar:', error);
    //     return null;
    // }
    
    // return data;
}

/**
 * Buscar transações do Supabase
 */
async function getTransactionsFromSupabase() {
    // const { data, error } = await supabaseClient
    //     .from('transactions')
    //     .select('*')
    //     .order('date', { ascending: false });
    
    // if (error) {
    //     console.error('❌ Erro ao buscar:', error);
    //     return [];
    // }
    
    // return data;
}

// ========== SCHEMA DO BANCO (SQL) ==========
/*
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(10) NOT NULL CHECK (type IN ('revenue', 'expense')),
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    category VARCHAR(50),
    app VARCHAR(50),
    trips INTEGER DEFAULT 1,
    work_time JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE goals (
    id BIGSERIAL PRIMARY KEY,
    daily DECIMAL(10,2) DEFAULT 200,
    weekly DECIMAL(10,2) DEFAULT 1400,
    monthly DECIMAL(10,2) DEFAULT 6000,
    trips INTEGER DEFAULT 200,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices para performance
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_app ON transactions(app);
*/

// ========== EXPORTAR ==========
// Descomentar quando usar:
// export { migrateToSupabase, saveTransactionToSupabase, getTransactionsFromSupabase };
