#!/usr/bin/env python3
"""
Script to reorganize the Driver Finance HTML interface
Moves sections from dashboard to new dedicated pages
"""

# Read the HTML file
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find and extract sections to move
# KM Control section
km_start = html.find('<!-- Controle de Quilometragem -->')
km_end = html.find('</div>\n\n        <!-- Calculadora de Combustível -->')
km_section = html[km_start:km_end+6]

# Fuel Calculator section  
fuel_start = html.find('<!-- Calculadora de Combustível -->')
fuel_end = html.find('</div>\n\n        <!-- Controle de Manutenção -->')
fuel_section = html[fuel_start:fuel_end+6]

# Maintenance section
maint_start = html.find('<!-- Controle de Manutenção -->')
maint_end = html.find('<!-- Ações Rápidas -->')
maint_section = html[maint_start:maint_end-9]

# App Comparator section
app_start = html.find('<!-- Comparador de Apps -->')
app_end = html.find('<!-- Gráfico de Barras -->')
app_section = html[app_start:app_end-9]

# Remove these sections from dashboard
html = html.replace(km_section, '')
html = html.replace(fuel_section, '')
html = html.replace(maint_section, '')
html = html.replace(app_section, '')

# Create Vehicle page
vehicle_page = f'''
    <!-- Página Veículo -->
    <div id="page-vehicle" class="page">
        <div class="page-header">
            <h2>🚗 Veículo</h2>
            <p>Controle de KM, Combustível e Manutenção</p>
        </div>

        {km_section}

        {fuel_section}

        {maint_section}

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
'''

# Create Apps page
apps_page = f'''
    <!-- Página Apps -->
    <div id="page-apps" class="page">
        <div class="page-header">
            <h2>📱 Comparador de Apps</h2>
            <p>Compare o desempenho entre Uber, 99, InDrive e outros</p>
        </div>

        {app_section}

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
'''

# Insert new pages before the history page
history_marker = '        <!-- Página de Histórico -->'
insert_pos = html.find(history_marker)
html = html[:insert_pos] + vehicle_page + '\n' + apps_page + '\n' + html[insert_pos:]

# Update navigation
old_nav = '''    <!-- Bottom Navigation -->
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
    </div>'''

new_nav = '''    <!-- Bottom Navigation -->
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
    </div>'''

html = html.replace(old_nav, new_nav)

# Write the reorganized HTML
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("✅ Interface reorganizada com sucesso!")
print("📊 Dashboard - Simplificado")
print("🚗 Veículo - Nova página criada")
print("📱 Apps - Nova página criada")
print("📜 Histórico - Mantido")
print("🎯 Metas - Mantido")
print("📈 Relatórios - Mantido")
