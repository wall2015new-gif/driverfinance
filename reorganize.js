// Node.js script to reorganize the Driver Finance HTML interface
const fs = require('fs');

console.log('🔄 Iniciando reorganização da interface...');

// Read the HTML file
let html = fs.readFileSync('index-backup.html', 'utf8');

// Find the history page marker
const historyMarker = '        <!-- Página de Histórico -->';
const historyPos = html.indexOf(historyMarker);

if (historyPos === -1) {
    console.error('❌ Erro: Marcador de histórico não encontrado');
    process.exit(1);
}

// Create Vehicle page
const vehiclePage = `
    <!-- Página Veículo -->
    <div id="page-vehicle" class="page">
        <div class="page-header">
            <h2>🚗 Veículo</h2>
            <p>Controle de KM, Combustível e Manutenção</p>
        </div>

        <!-- Conteúdo será movido aqui -->
        <div class="empty-state" style="padding: 40px; text-align: center; color: var(--text-secondary);">
            <h3>🚧 Página em Construção</h3>
            <p>As seções de KM, Combustível e Manutenção serão movidas para cá.</p>
        </div>

        <!-- Ações Rápidas -->
        <div class="actions">
            <button class="btn btn-primary" onclick="openModal('revenue')">
                <span>💵</span> Receita
            </button>
            <button class="btn btn-danger" onclick="openModal('expense')">
                <span>💸</span> Despesa
            </button>
        </div>
    </div>

`;

// Create Apps page
const appsPage = `
    <!-- Página Apps -->
    <div id="page-apps" class="page">
        <div class="page-header">
            <h2>📱 Comparador de Apps</h2>
            <p>Compare o desempenho entre Uber, 99, InDrive e outros</p>
        </div>

        <!-- Conteúdo será movido aqui -->
        <div class="empty-state" style="padding: 40px; text-align: center; color: var(--text-secondary);">
            <h3>🚧 Página em Construção</h3>
            <p>O comparador de apps será movido para cá.</p>
        </div>

        <!-- Ações Rápidas -->
        <div class="actions">
            <button class="btn btn-primary" onclick="openModal('revenue')">
                <span>💵</span> Receita
            </button>
            <button class="btn btn-danger" onclick="openModal('expense')">
                <span>💸</span> Despesa
            </button>
        </div>
    </div>

`;

// Insert new pages before history
html = html.substring(0, historyPos) + vehiclePage + appsPage + html.substring(historyPos);
console.log('✅ Páginas Veículo e Apps criadas');

// Update navigation
const oldNav = `    <!-- Bottom Navigation -->
    <div class="bottom-nav">
        <div class="nav-item active" onclick="switchPage('dashboard')">
            <div class="nav-icon">📊</div>
            Dashboard
        </div>
        <div class="nav-item" onclick="switchPage('history')">
            <div class="nav-icon">📜</div>
            Histórico
        </div>
        <div class="nav-item" onclick="switchPage('goals')">
            <div class="nav-icon">🎯</div>
            Metas
        </div>
        <div class="nav-item" onclick="switchPage('reports')">
            <div class="nav-icon">📈</div>
            Relatórios
        </div>
    </div>`;

const newNav = `    <!-- Bottom Navigation -->
    <div class="bottom-nav">
        <div class="nav-item active" onclick="switchPage('dashboard')">
            <div class="nav-icon">📊</div>
            Dashboard
        </div>
        <div class="nav-item" onclick="switchPage('vehicle')">
            <div class="nav-icon">🚗</div>
            Veículo
        </div>
        <div class="nav-item" onclick="switchPage('apps')">
            <div class="nav-icon">📱</div>
            Apps
        </div>
        <div class="nav-item" onclick="switchPage('history')">
            <div class="nav-icon">📜</div>
            Histórico
        </div>
        <div class="nav-item" onclick="switchPage('goals')">
            <div class="nav-icon">🎯</div>
            Metas
        </div>
        <div class="nav-item" onclick="switchPage('reports')">
            <div class="nav-icon">📈</div>
            Relatórios
        </div>
    </div>`;

html = html.replace(oldNav, newNav);
console.log('✅ Navegação atualizada com 6 páginas');

// Write the reorganized HTML
fs.writeFileSync('index.html', html, 'utf8');

console.log('');
console.log('✅ Interface reorganizada com sucesso!');
console.log('📊 Dashboard - Mantido (será simplificado)');
console.log('🚗 Veículo - Nova página criada');
console.log('📱 Apps - Nova página criada');
console.log('📜 Histórico - Mantido');
console.log('🎯 Metas - Mantido');
console.log('📈 Relatórios - Mantido');
console.log('');
console.log('⚠️  PRÓXIMO PASSO: Mover o conteúdo das seções para as novas páginas');
