# 🚗 Driver Finance

Sistema completo de gestão financeira para motoristas de aplicativo. PWA moderno, responsivo e offline-first.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![PWA](https://img.shields.io/badge/PWA-enabled-success.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

## ✨ Funcionalidades

### 📊 Dashboard Completo
- **Visão Geral Financeira**: Receitas, despesas, lucro e número de viagens
- **Gráficos Interativos**: Visualização semanal e mensal com Chart.js
- **Cards de Progresso Circular**: Acompanhamento visual em tempo real
- **Mini Estatísticas**: Gastos por categoria (combustível, manutenção, apps, alimentação)

### 💰 Gestão de Transações
- **Registro de Receitas**: Adicione ganhos de corridas rapidamente
- **Registro de Despesas**: Categorize gastos (combustível, manutenção, taxas, alimentação)
- **Histórico Completo**: Visualize todas as transações com filtros
- **Edição e Exclusão**: Gerencie suas transações facilmente

### 🎯 Sistema de Metas
- **Metas Personalizáveis**: Diária, semanal, mensal e de viagens
- **Progresso Visual**: Barras de progresso com cores dinâmicas
- **Conquistas**: Sistema de badges para motivação
- **Notificações**: Alertas quando atingir suas metas

### 📈 Relatórios Detalhados
- **Análise Financeira**: Receita total, despesas, lucro líquido
- **Gráfico de Pizza**: Despesas por categoria
- **Gráfico de Linha**: Evolução de receitas nos últimos 30 dias
- **Calendário Heatmap**: Visualização de dias com atividade

### 💾 Backup e Exportação
- **Exportar PDF**: Relatório completo em PDF
- **Exportar Excel/CSV**: Planilha com todas as transações
- **Backup Completo**: Exportar/importar todos os dados em JSON
- **Backup Automático**: Lembrete a cada 7 dias

### 🔔 Notificações
- **Lembrete Diário**: Notificação às 20h para registrar corridas
- **Meta Atingida**: Alerta quando completar suas metas
- **Relatório Semanal**: Resumo semanal de desempenho

### 🎨 Interface Moderna
- **Design Minimalista**: Interface limpa inspirada em apps modernos
- **Tema Claro/Escuro**: Alternância automática de temas
- **Totalmente Responsivo**: Otimizado para mobile, tablet e desktop
- **Animações Suaves**: Transições e efeitos visuais elegantes

### 📱 PWA (Progressive Web App)
- **Instalável**: Adicione à tela inicial como app nativo
- **Offline First**: Funciona sem conexão com internet
- **Service Worker**: Cache inteligente com estratégia Network First
- **Ícones Personalizados**: Ícones para todas as plataformas

## 🚀 Como Usar

### Opção 1: Acesso Online (Recomendado)
1. Acesse: [https://wall2015new-gif.github.io/driverfinance](https://wall2015new-gif.github.io/driverfinance)
2. Clique no ícone de instalação no navegador
3. Use como um app nativo!

### Opção 2: Executar Localmente
```bash
# Clone o repositório
git clone https://github.com/wall2015new-gif/driverfinance.git

# Entre na pasta
cd driverfinance

# Abra o index.html no navegador
# Ou use um servidor local:
npx serve
# ou
python -m http.server 8000
```

## 📱 Instalação como PWA

### No Android (Chrome/Edge)
1. Abra o site no navegador
2. Toque no menu (⋮) → "Adicionar à tela inicial"
3. Confirme a instalação
4. O app aparecerá na tela inicial!

### No iOS (Safari)
1. Abra o site no Safari
2. Toque no botão de compartilhar (□↑)
3. Role e toque em "Adicionar à Tela de Início"
4. Confirme a instalação

### No Desktop (Chrome/Edge)
1. Abra o site no navegador
2. Clique no ícone de instalação (⊕) na barra de endereço
3. Clique em "Instalar"
4. O app abrirá em janela própria!

## 💾 Backup dos Dados

**IMPORTANTE**: Os dados ficam salvos localmente no seu dispositivo/navegador.

### Fazer Backup
1. Clique no botão flutuante (⚙️)
2. Selecione "Exportar"
3. Escolha "Backup Completo"
4. Salve o arquivo JSON em local seguro (Google Drive, Dropbox, etc.)

### Restaurar Backup
1. Clique no botão flutuante (⚙️)
2. Selecione "Exportar"
3. Clique em "Importar Backup"
4. Selecione o arquivo JSON salvo

### Backup Automático
- O app lembra você a cada 7 dias para fazer backup
- Recomendamos fazer backup semanal

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Estilização moderna com variáveis CSS
- **JavaScript (Vanilla)**: Lógica sem dependências
- **Chart.js**: Gráficos interativos
- **jsPDF**: Geração de PDFs
- **Service Worker**: Funcionalidade offline
- **LocalStorage**: Persistência de dados
- **Notification API**: Notificações do navegador

## 📊 Estrutura do Projeto

```
driver-finance/
├── index.html          # Página principal com toda a estrutura
├── app-new.js          # Lógica JavaScript completa
├── service-worker.js   # Service Worker para PWA
├── manifest.json       # Manifesto PWA
├── .gitignore         # Arquivos ignorados pelo Git
└── README.md          # Este arquivo
```

## ⚙️ Funcionalidades Avançadas

### Atalhos de Teclado
- `Ctrl + Shift + C`: Limpar cache do app
- `Ctrl + Shift + S`: Abrir configurações/notificações

### Zona de Perigo
- **Zerar Dados**: Opção para resetar todos os dados (requer confirmação tripla)

### Desenvolvimento
- Cache inteligente com versionamento
- Atualização automática do Service Worker
- Console logs para debugging

## 🔒 Privacidade e Segurança

- ✅ **100% Local**: Todos os dados ficam no seu dispositivo
- ✅ **Sem Servidor**: Não enviamos dados para nenhum servidor
- ✅ **Sem Rastreamento**: Não coletamos informações pessoais
- ✅ **Sem Anúncios**: Completamente livre de propagandas
- ✅ **Open Source**: Código aberto para auditoria

**Nota**: Cada pessoa que acessa tem seus próprios dados separados por navegador/dispositivo.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer um Fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abrir um Pull Request

## 📝 Roadmap

- [ ] Sistema de múltiplos usuários com login
- [ ] Sincronização na nuvem (Google Drive/Dropbox)
- [ ] Gráficos adicionais (comparativo mensal, previsões)
- [ ] Exportar para Google Sheets
- [ ] Modo de economia de bateria
- [ ] Suporte a múltiplas moedas
- [ ] Categorias personalizáveis
- [ ] Anexar fotos de recibos

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

Desenvolvido com ❤️ para motoristas de aplicativo

## 🙏 Agradecimentos

- Chart.js pela biblioteca de gráficos
- jsPDF pela geração de PDFs
- Comunidade open source

---

**⭐ Se este projeto te ajudou, deixe uma estrela no GitHub!**

**🐛 Encontrou um bug?** Abra uma [issue](https://github.com/wall2015new-gif/driverfinance/issues)

**💡 Tem uma sugestão?** Abra uma [issue](https://github.com/wall2015new-gif/driverfinance/issues) ou contribua!
