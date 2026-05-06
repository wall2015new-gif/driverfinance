# ⏰ CONTROLE DE HORÁRIO DE TRABALHO

## 📋 FUNCIONALIDADE IMPLEMENTADA

Adicionado controle de horário de início e fim no formulário de receita, permitindo que o motorista registre quando começou e parou de trabalhar. O sistema calcula automaticamente o tempo trabalhado.

## ✨ COMO FUNCIONA

### Formulário de Receita Atualizado

**Campos Adicionados:**
```
⏰ Início: [HH:MM]
🏁 Fim: [HH:MM]
```

**Cálculo Automático:**
- Ao preencher ambos os horários, o sistema calcula automaticamente
- Mostra o tempo trabalhado em tempo real
- Formato: "Xh Ymin"

### Exemplo de Uso

**Cenário 1: Turno da Manhã**
```
Valor Total: R$ 180,00
Quantidade de Corridas: 12
⏰ Início: 06:00
🏁 Fim: 12:00
App: Uber
Descrição: Turno Manhã

→ Sistema calcula: 6h 0min
→ Salva todos os dados
```

**Cenário 2: Turno da Tarde**
```
Valor Total: R$ 220,00
Quantidade de Corridas: 15
⏰ Início: 14:30
🏁 Fim: 20:15
App: 99
Descrição: Turno Tarde

→ Sistema calcula: 5h 45min
→ Salva todos os dados
```

**Cenário 3: Virada de Dia (Madrugada)**
```
Valor Total: R$ 150,00
Quantidade de Corridas: 8
⏰ Início: 22:00
🏁 Fim: 02:30
App: InDrive
Descrição: Turno Noite

→ Sistema calcula: 4h 30min
→ Detecta automaticamente que passou da meia-noite
```

## 🔧 DETALHES TÉCNICOS

### 1. HTML (index.html)

**Campos de Horário:**
```html
<input type="time" id="revenueStartTime" onchange="calculateWorkTime()">
<input type="time" id="revenueEndTime" onchange="calculateWorkTime()">
```

**Display do Tempo Calculado:**
```html
<div id="workTimeDisplay">
    ⏱️ TEMPO TRABALHADO
    <div id="workTimeValue">6h 30min</div>
</div>
```

### 2. JavaScript (app-new.js)

**Função calculateWorkTime():**
```javascript
function calculateWorkTime() {
    // Converte horários para minutos
    // Calcula diferença
    // Detecta virada de dia (meia-noite)
    // Retorna { hours, minutes, totalMinutes }
}
```

**Dados Salvos na Transação:**
```javascript
{
    amount: 180.00,
    trips: 12,
    startTime: "06:00",      // ← NOVO
    endTime: "12:00",        // ← NOVO
    workTime: {              // ← NOVO
        hours: 6,
        minutes: 0,
        totalMinutes: 360
    },
    app: "uber",
    description: "Turno Manhã",
    date: "2026-05-05"
}
```

### 3. Exibição no Histórico

**Informações Adicionais Mostradas:**
```
💵 Turno Manhã
Receita
12 corridas • ⏱️ 06:00 - 12:00 (6h 0min)
+ R$ 180,00
```

## 📊 CÁLCULOS AUTOMÁTICOS

### Tempo Trabalhado
```javascript
Início: 06:00 → 360 minutos
Fim: 12:00 → 720 minutos
Diferença: 360 minutos = 6h 0min
```

### Virada de Dia (Meia-Noite)
```javascript
Início: 22:00 → 1320 minutos
Fim: 02:30 → 150 minutos
Detecta que fim < início
Adiciona 24h ao fim: 150 + 1440 = 1590 minutos
Diferença: 1590 - 1320 = 270 minutos = 4h 30min
```

### Estatísticas Possíveis (Futuro)
Com esses dados, é possível calcular:
- ✅ Tempo total trabalhado no dia/semana/mês
- ✅ Ganho por hora (R$/h)
- ✅ Corridas por hora
- ✅ Eficiência (tempo online vs tempo trabalhando)

## 🎯 CASOS DE USO

### Caso 1: Lançamento Completo
```
Motorista trabalha das 6h às 12h
Faz 12 corridas
Fatura R$ 180,00

Preenche:
- Valor: R$ 180,00
- Corridas: 12
- Início: 06:00
- Fim: 12:00
- App: Uber
- Descrição: Turno Manhã

Sistema salva tudo e mostra:
✅ 12 corridas
✅ 6h 0min trabalhadas
✅ R$ 30,00/hora
✅ 2 corridas/hora
```

### Caso 2: Lançamento Sem Horário
```
Motorista não quer informar horário

Preenche:
- Valor: R$ 180,00
- Corridas: 12
- Início: (vazio)
- Fim: (vazio)
- App: Uber
- Descrição: Turno Manhã

Sistema salva normalmente:
✅ Campos de horário são opcionais
✅ Funciona sem problemas
```

### Caso 3: Múltiplos Turnos no Dia
```
Turno 1 - Manhã:
- Valor: R$ 180,00
- Corridas: 12
- Horário: 06:00 - 12:00

Turno 2 - Tarde:
- Valor: R$ 220,00
- Corridas: 15
- Horário: 14:00 - 20:00

Sistema registra separadamente:
✅ 2 lançamentos
✅ Total: 27 corridas
✅ Total: R$ 400,00
✅ Tempo: 12h trabalhadas
```

## ✨ BENEFÍCIOS

### 1. Controle Completo
- Sabe exatamente quanto tempo trabalhou
- Pode calcular ganho por hora
- Identifica turnos mais rentáveis

### 2. Flexibilidade
- Campos de horário são **opcionais**
- Pode usar ou não, conforme preferir
- Não quebra funcionalidade existente

### 3. Estatísticas Precisas
- Tempo total trabalhado
- Ganho por hora
- Corridas por hora
- Eficiência do trabalho

### 4. Histórico Detalhado
- Vê quando trabalhou
- Quanto tempo ficou online
- Quantas corridas fez por período

## 🔄 RETROCOMPATIBILIDADE

**Transações antigas sem horário:**
```javascript
// Transação antiga
{
    amount: 100,
    trips: 5,
    // Sem startTime, endTime, workTime
}

// Funciona normalmente!
// Sistema verifica se os campos existem
// Não quebra nada
```

## 📱 INTERFACE

### Modal de Receita
```
┌─────────────────────────────────┐
│     💵 Nova Receita             │
├─────────────────────────────────┤
│ Valor Total: R$ 180,00          │
│ Quantidade: 12 corridas         │
│                                 │
│ ⏰ Início    🏁 Fim             │
│ [06:00]      [12:00]            │
│                                 │
│ ⏱️ TEMPO TRABALHADO             │
│      6h 0min                    │
│                                 │
│ App: Uber                       │
│ Descrição: Turno Manhã          │
│ Data: 05/05/2026                │
│                                 │
│ [Cancelar]  [Adicionar]         │
└─────────────────────────────────┘
```

### Histórico
```
┌─────────────────────────────────┐
│ 05/05/2026                      │
│ 💵 Turno Manhã                  │
│ Receita                         │
│ 12 corridas • ⏱️ 06:00 - 12:00 │
│ (6h 0min)                       │
│                    + R$ 180,00  │
└─────────────────────────────────┘
```

## 🧪 TESTES NECESSÁRIOS

- [ ] Adicionar receita com horários
- [ ] Cálculo de tempo funciona
- [ ] Virada de meia-noite funciona
- [ ] Adicionar receita sem horários (opcional)
- [ ] Histórico mostra horários corretamente
- [ ] Transações antigas funcionam
- [ ] Campos são resetados ao fechar modal
- [ ] Display de tempo aparece/desaparece corretamente

## 🎉 RESULTADO

Agora o motorista tem controle total do tempo trabalhado! Pode registrar quando começou e parou, e o sistema calcula tudo automaticamente. Os campos são opcionais, então quem não quiser usar, não precisa!

**Estatísticas Futuras Possíveis:**
- 📊 Ganho por hora (R$/h)
- ⏱️ Tempo total trabalhado
- 🚗 Corridas por hora
- 📈 Turnos mais rentáveis
- 💰 Eficiência do trabalho

---

**Data:** 05/05/2026
**Versão:** 2.3 - Controle de Horário de Trabalho
