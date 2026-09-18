/**
 * CONFIGURAÇÃO SUPABASE - DRIVER FINANCE
 *
 * Inicializa o cliente Supabase (SDK v2) usando a URL do projeto e a
 * publishable key (sb_publishable_...). A publishable key é feita para o
 * frontend — a proteção real dos dados vem do RLS (cada usuário só acessa o
 * próprio user_id), definido em supabase/schema.sql.
 *
 * O SDK é carregado via CDN no index.html ANTES deste arquivo.
 */

// ========== CREDENCIAIS ==========
const SUPABASE_URL = 'https://bwoycbcwebbfennfepkw.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_vIKO1qgh4QHf_rPL3aZ0_g_qlXteayd';

// ========== INICIALIZAR CLIENTE ==========
// `supabase` é o objeto global exposto pelo SDK da CDN.
let supabaseClient = null;
try {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                storageKey: 'driver-finance-auth'
            }
        });
        // Exposto globalmente para o restante do app
        window.supabaseClient = supabaseClient;
        console.log('✅ Supabase inicializado');
    } else {
        console.warn('⚠️ SDK do Supabase não carregado — app segue em modo offline (LocalStorage).');
    }
} catch (e) {
    console.error('❌ Erro ao inicializar Supabase:', e);
}
