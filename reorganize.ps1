# PowerShell script to reorganize the Driver Finance HTML interface

Write-Host "🔄 Iniciando reorganização da interface..." -ForegroundColor Cyan

# Read the HTML file
$html = Get-Content -Path "index.html" -Raw -Encoding UTF8

# Create Vehicle page HTML
$vehiclePage = @"

    <!-- Página Veículo -->
    <div id="page-vehicle" class="page">
        <div class="page-header">
            <h2>🚗 Veículo</h2>
            <p>Controle de KM, Combustível e Manutenção</p>
        </div>

        <!-- VEHICLE_CONTENT_PLACEHOLDER -->

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

"@

# Create Apps page HTML
$appsPage = @"

    <!-- Página Apps -->
    <div id="page-apps" class="page">
        <div class="page-header">
            <h2>📱 Comparador de Apps</h2>
            <p>Compare o desempenho entre Uber, 99, InDrive e outros</p>
        </div>

        <!-- APPS_CONTENT_PLACEHOLDER -->

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

"@

# Insert new pages before history page
$historyMarker = "        <!-- Página de Histórico -->"
$insertPos = $html.IndexOf($historyMarker)

if ($insertPos -gt 0) {
    $html = $html.Substring(0, $insertPos) + $vehiclePage + $appsPage + $html.Substring($insertPos)
    Write-Host "✅ Páginas Veículo e Apps criadas" -ForegroundColor Green
} else {
    Write-Host "❌ Erro: Marcador de histórico não encontrado" -ForegroundColor Red
    exit 1
}

# Update navigation
$oldNav = @"
    <!-- Bottom Navigation -->
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
    </div>
"@

$newNav = @"
    <!-- Bottom Navigation -->
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
    </div>
"@

$html = $html.Replace($oldNav, $newNav)
Write-Host "✅ Navegação atualizada com 6 páginas" -ForegroundColor Green

# Write the reorganized HTML
$html | Out-File -FilePath "index.html" -Encoding UTF8 -NoNewline

Write-Host ""
Write-Host "✅ Interface reorganizada com sucesso!" -ForegroundColor Green
Write-Host "📊 Dashboard - Simplificado" -ForegroundColor Yellow
Write-Host "🚗 Veículo - Nova página criada" -ForegroundColor Yellow
Write-Host "📱 Apps - Nova página criada" -ForegroundColor Yellow
Write-Host "📜 Histórico - Mantido" -ForegroundColor Yellow
Write-Host "🎯 Metas - Mantido" -ForegroundColor Yellow
Write-Host "📈 Relatórios - Mantido" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  PRÓXIMO PASSO: Mover o conteúdo das seções para as novas páginas" -ForegroundColor Magenta
