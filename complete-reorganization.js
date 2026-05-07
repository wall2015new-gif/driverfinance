// Complete reorganization - Move content to new pages
const fs = require('fs');

console.log('🔄 Completando reorganização - Movendo conteúdo...\n');

// Read the current HTML
let html = fs.readFileSync('index.html', 'utf8');

// Extract KM Control section
const kmStart = html.indexOf('        <!-- Controle de Quilometragem -->');
const kmEnd = html.indexOf('        <!-- Calculadora de Combustível -->');
const kmSection = html.substring(kmStart, kmEnd);
console.log('✅ Seção de KM extraída');

// Extract Fuel Calculator section
const fuelStart = html.indexOf('        <!-- Calculadora de Combustível -->');
const fuelEnd = html.indexOf('        <!-- Controle de Manutenção -->');
const fuelSection = html.substring(fuelStart, fuelEnd);
console.log('✅ Seção de Combustível extraída');

// Extract Maintenance section
const maintStart = html.indexOf('        <!-- Controle de Manutenção -->');
const maintEnd = html.indexOf('        <!-- Ações Rápidas -->');
const maintSection = html.substring(maintStart, maintEnd);
console.log('✅ Seção de Manutenção extraída');

// Extract App Comparator section
const appStart = html.indexOf('        <!-- Comparador de Apps -->');
const appEnd = html.indexOf('        <!-- Gráfico de Barras -->');
const appSection = html.substring(appStart, appEnd);
console.log('✅ Seção de Apps extraída\n');

// Remove sections from dashboard
console.log('🗑️  Removendo seções do Dashboard...');
html = html.replace(kmSection, '');
html = html.replace(fuelSection, '');
html = html.replace(maintSection, '');
html = html.replace(appSection, '');
console.log('✅ Seções removidas do Dashboard\n');

// Insert content into Vehicle page
console.log('📦 Inserindo conteúdo na página Veículo...');
const vehiclePlaceholder = '        <!-- Conteúdo será movido aqui -->\n        <div class="empty-state" style="padding: 40px; text-align: center; color: var(--text-secondary);">\n            <h3>🚧 Página em Construção</h3>\n            <p>As seções de KM, Combustível e Manutenção serão movidas para cá.</p>\n        </div>';
const vehicleContent = kmSection + '\n' + fuelSection + '\n' + maintSection;
html = html.replace(vehiclePlaceholder, vehicleContent);
console.log('✅ Conteúdo inserido na página Veículo\n');

// Insert content into Apps page
console.log('📦 Inserindo conteúdo na página Apps...');
const appsPlaceholder = '        <!-- Conteúdo será movido aqui -->\n        <div class="empty-state" style="padding: 40px; text-align: center; color: var(--text-secondary);">\n            <h3>🚧 Página em Construção</h3>\n            <p>O comparador de apps será movido para cá.</p>\n        </div>';
html = html.replace(appsPlaceholder, appSection);
console.log('✅ Conteúdo inserido na página Apps\n');

// Write the final HTML
fs.writeFileSync('index.html', html, 'utf8');

console.log('═══════════════════════════════════════════════════');
console.log('✅ REORGANIZAÇÃO COMPLETA!');
console.log('═══════════════════════════════════════════════════\n');

console.log('📊 DASHBOARD');
console.log('   ├─ Card de Faturamento');
console.log('   ├─ Seletor de Período');
console.log('   ├─ 4 Cards Circulares');
console.log('   ├─ Mini Stats');
console.log('   ├─ Gráfico Semanal');
console.log('   └─ Botões de Ação\n');

console.log('🚗 VEÍCULO (Nova Página)');
console.log('   ├─ Controle de KM');
console.log('   ├─ Calculadora de Combustível');
console.log('   └─ Controle de Manutenção\n');

console.log('📱 APPS (Nova Página)');
console.log('   ├─ Comparador de Apps');
console.log('   ├─ Melhor App do Mês');
console.log('   └─ Gráfico de Comparação\n');

console.log('📜 HISTÓRICO (Mantido)');
console.log('🎯 METAS (Mantido)');
console.log('📈 RELATÓRIOS (Mantido)\n');

console.log('═══════════════════════════════════════════════════');
console.log('🎉 Abra o index.html no navegador para testar!');
console.log('═══════════════════════════════════════════════════');
