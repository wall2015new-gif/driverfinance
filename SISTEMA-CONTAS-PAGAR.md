# 💳 Sistema de Contas a Pagar com Calculadora Inteligente

## 🎯 Objetivo
Ajudar o motorista a gerenciar suas contas mensais e calcular automaticamente quanto precisa fazer por dia para pagar tudo, considerando também o gasto com combustível.

## ✨ Funcionalidades

### 1. **Cadastro de Contas**
Permite cadastrar todas as contas mensais com:
- 📝 **Nome da Conta** (Ex: Parcela do Carro, Internet, Aluguel)
- 🏷️ **Categoria**:
  - 🚗 Veículo (Parcela, IPVA, Seguro)
  - 📡 Internet/Telefone
  - 🏠 Moradia (Aluguel, Água, Luz)
  - 👤 Pessoal (Cartão, Empréstimo)
  - 📦 Outros
- 💰 **Valor** da conta
- 📅 **Data de Vencimento**
- 🔄 **Recorrente?** (Se repete todo mês ou é pagamento único)

### 2. **Calculadora Inteligente** 🧮
Calcula automaticamente:

#### **Entradas:**
- 💰 **Total de Contas do Mês** - Soma de todas as contas não pagas
- ⛽ **Gasto Médio com Combustível/Dia** - Baseado no histórico real do mês
- 📅 **Dias Úteis Restantes no Mês** - Considera 26 dias úteis por mês

#### **Saída:**
- 🎯 **Meta Diária Necessária** - Valor que precisa fazer por dia

#### **Fórmula:**
```
Meta Diária = (Total de Contas + Combustível Estimado Restante) / Dias Úteis Restantes

Onde:
- Combustível Estimado Restante = Média Diária × Dias Restantes
- Média Diária = Total gasto até hoje / Dias trabalhados
```

### 3. **Gerenciamento de Contas**
- ✅ **Marcar como Paga** - Remove do cálculo
- ✏️ **Editar** - Alterar valores ou datas
- 🗑️ **Excluir** - Remover conta
- 📊 **Status Visual**:
  - ⚠️ **Vencida** (vermelho) - Passou da data
  - ⏰ **Vence em breve** (laranja) - Faltam 3 dias ou menos
  - ✅ **Paga** (verde, opaco) - Já foi paga

### 4. **Contas Recorrentes**
- Contas marcadas como recorrentes aparecem todo mês
- Útil para: aluguel, internet, parcelas fixas

## 🎨 Interface

### Localização
**Página:** 🎯 Metas (última seção)

### Componentes

#### **Botão "➕ Adicionar Conta"**
- Verde, destaque
- Abre modal de cadastro

#### **Calculadora Inteligente**
- Fundo gradiente azul/turquesa (cores do logo)
- Destaque visual para a meta diária (dourado)
- Explicação clara do cálculo

#### **Lista de Contas**
- Cards organizados por data de vencimento
- Cores indicam status (vencida, próxima, paga)
- Ações rápidas: Pagar, Editar, Excluir

## 📊 Exemplo de Uso

### Cenário:
```
Contas do Mês:
- Parcela do Carro: R$ 800,00 (vence dia 15)
- Internet: R$ 100,00 (vence dia 10)
- Aluguel: R$ 1.200,00 (vence dia 5)
- Cartão de Crédito: R$ 450,00 (vence dia 20)

Total de Contas: R$ 2.550,00

Gasto com Combustível:
- Até hoje (dia 8): R$ 240,00
- Média por dia: R$ 30,00
- Estimativa restante (18 dias): R$ 540,00

Dias Úteis Restantes: 18 dias

Meta Diária Necessária:
(R$ 2.550,00 + R$ 540,00) / 18 = R$ 171,67/dia
```

### Interpretação:
💡 **"Você precisa fazer R$ 171,67 por dia para pagar todas as contas e o combustível"**

## 🔄 Integração com Sistema Existente

### Dados Utilizados:
- ✅ **Transações de combustível** - Para calcular média diária
- ✅ **Data atual** - Para calcular dias restantes
- ✅ **localStorage** - Persistência das contas

### Atualização Automática:
- Ao adicionar/editar/excluir conta
- Ao marcar conta como paga
- Ao entrar na página de Metas

## 🎯 Benefícios

### Para o Motorista:
1. **Visão Clara** - Sabe exatamente quanto precisa fazer por dia
2. **Planejamento** - Não esquece de nenhuma conta
3. **Realista** - Considera o gasto real com combustível
4. **Motivação** - Meta diária tangível e alcançável

### Para o Negócio:
1. **Controle Financeiro** - Evita atrasos e multas
2. **Previsibilidade** - Sabe quanto precisa trabalhar
3. **Eficiência** - Foca nos dias que realmente importam

## 🔧 Arquivos Modificados

### **index.html**
- Adicionada seção "Contas a Pagar" na página de Metas
- Criado modal de adicionar/editar conta
- Adicionado CSS completo para calculadora e lista de contas

### **app-new.js**
- Funções de gerenciamento: `openAddBillModal()`, `saveBill()`, `editBill()`, `payBill()`, `deleteBill()`
- Função de renderização: `renderBills()`
- Função de cálculo: `updateSmartCalculator()`
- Integração com `switchPage()` para atualizar ao abrir página

## 📱 Responsividade
- ✅ Adapta-se a diferentes tamanhos de tela
- ✅ Cards empilham em telas pequenas
- ✅ Botões acessíveis em mobile

## 🚀 Próximos Passos Sugeridos

### Melhorias Futuras:
1. **Notificações** - Avisar quando conta está próxima do vencimento
2. **Histórico** - Ver contas pagas dos meses anteriores
3. **Gráficos** - Visualizar distribuição de gastos
4. **Exportação** - Gerar relatório de contas em PDF
5. **Integração com Banco** - Importar contas automaticamente (futuro)

---
**Data**: 2026-05-06  
**Status**: ✅ Implementado e Testado
