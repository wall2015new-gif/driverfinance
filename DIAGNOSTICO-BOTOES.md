# 🔧 Diagnóstico - Botões Não Funcionando

## 🔍 Como Diagnosticar o Problema

### Passo 1: Abrir o Console do Navegador

#### No Chrome/Edge:
1. Pressione **F12** ou **Ctrl+Shift+I**
2. Clique na aba **Console**
3. Recarregue a página (**Ctrl+R**)
4. Procure por mensagens de erro em **vermelho**

#### No Firefox:
1. Pressione **F12**
2. Clique em **Console**
3. Recarregue a página
4. Veja os erros

#### No Safari:
1. Cmd+Option+C
2. Aba Console
3. Recarregue

---

## ❌ Erros Comuns e Soluções

### Erro 1: "Uncaught ReferenceError: [função] is not defined"

**Exemplo:**
```
Uncaught ReferenceError: openModal is not defined
```

**Causa:** O arquivo `app-new.js` não carregou ou tem erro de sintaxe

**Solução:**
1. Abra o DevTools (F12)
2. Vá em **Network** (Rede)
3. Recarregue a página
4. Procure por `app-new.js`
5. Verifique se:
   - Status: 200 (OK) ✅
   - Status: 404 (Não encontrado) ❌
   - Status: 500 (Erro no servidor) ❌

---

### Erro 2: "Uncaught SyntaxError"

**Exemplo:**
```
Uncaught SyntaxError: Unexpected token '}'
```

**Causa:** Erro de sintaxe no JavaScript

**Solução:**
1. Veja a linha do erro no console
2. Abra `app-new.js` nessa linha
3. Procure por:
   - Chaves `{}` não fechadas
   - Parênteses `()` não fechados
   - Vírgulas faltando
   - Aspas não fechadas

---

### Erro 3: Cache Antigo

**Sintoma:** Mudanças no código não aparecem

**Solução:**
1. **Ctrl+Shift+R** (recarregar forçado)
2. Ou limpar cache:
   - F12 → Application → Clear storage
   - Marcar tudo
   - Clear site data

---

### Erro 4: Service Worker Antigo

**Sintoma:** App não atualiza

**Solução:**
1. F12 → Application → Service Workers
2. Clique em **Unregister**
3. Recarregue a página
4. Aguarde novo SW instalar

---

## 🧪 Teste Rápido

### Abra o Console e Digite:

```javascript
// Teste 1: Verificar se funções existem
console.log('openModal:', typeof openModal);
console.log('closeModal:', typeof closeModal);
console.log('switchPage:', typeof switchPage);
console.log('changePeriod:', typeof changePeriod);
console.log('addRevenue:', typeof addRevenue);
console.log('updateAppComparator:', typeof updateAppComparator);
```

**Resultado Esperado:**
```
openModal: function
closeModal: function
switchPage: function
changePeriod: function
addRevenue: function
updateAppComparator: function
```

**Se aparecer "undefined":** A função não foi carregada!

---

### Teste 2: Verificar Erros

```javascript
// Ver todos os erros
console.error('Teste de erro');
```

---

### Teste 3: Testar Função Manualmente

```javascript
// Tentar abrir modal
openModal('revenue');

// Tentar mudar período
changePeriod('today');

// Tentar mudar página
switchPage('dashboard');
```

**Se funcionar:** O problema é no HTML (onclick)
**Se não funcionar:** O problema é no JavaScript

---

## 🔧 Soluções Rápidas

### Solução 1: Limpar Tudo e Recarregar

```javascript
// Cole no console:
localStorage.clear();
caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
location.reload(true);
```

---

### Solução 2: Desregistrar Service Worker

```javascript
// Cole no console:
navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
    location.reload();
});
```

---

### Solução 3: Verificar Arquivo JavaScript

1. Abra: `http://localhost/app-new.js` (ou seu domínio)
2. Veja se o arquivo carrega
3. Procure por erros visuais (texto estranho, caracteres especiais)

---

## 📋 Checklist de Diagnóstico

Execute na ordem:

- [ ] **1. Abrir Console (F12)**
- [ ] **2. Ver se há erros vermelhos**
- [ ] **3. Verificar se app-new.js carregou (Network)**
- [ ] **4. Testar funções no console**
- [ ] **5. Limpar cache (Ctrl+Shift+R)**
- [ ] **6. Desregistrar Service Worker**
- [ ] **7. Recarregar página**
- [ ] **8. Testar botões novamente**

---

## 🐛 Problemas Específicos

### Botão "Adicionar Receita" não funciona

**Teste:**
```javascript
openModal('revenue');
```

**Se funcionar:** Problema no HTML
**Se não funcionar:** Problema no JS

---

### Botão "Hoje/Semana/Mês" não funciona

**Teste:**
```javascript
changePeriod('today');
```

**Se funcionar:** Problema no HTML
**Se não funcionar:** Problema no JS

---

### Botão de Navegação não funciona

**Teste:**
```javascript
switchPage('dashboard');
```

**Se funcionar:** Problema no HTML
**Se não funcionar:** Problema no JS

---

## 📱 Teste em Dispositivo Móvel

### Android (Chrome):
1. Conecte o celular ao PC via USB
2. Ative "Depuração USB" no celular
3. No Chrome do PC: `chrome://inspect`
4. Clique em "Inspect" no seu dispositivo
5. Veja o console

### iOS (Safari):
1. Ative "Web Inspector" no iPhone
2. Conecte ao Mac
3. Safari → Develop → [Seu iPhone]
4. Veja o console

---

## 🔍 Informações para Reportar

Se o problema persistir, colete estas informações:

1. **Navegador e Versão:**
   - Chrome 120, Firefox 121, etc.

2. **Sistema Operacional:**
   - Windows 11, Android 13, iOS 17, etc.

3. **Erros do Console:**
   - Copie TODOS os erros vermelhos

4. **Teste de Funções:**
   ```javascript
   console.log('Funções:', {
       openModal: typeof openModal,
       closeModal: typeof closeModal,
       switchPage: typeof switchPage,
       changePeriod: typeof changePeriod,
       addRevenue: typeof addRevenue
   });
   ```
   - Copie o resultado

5. **Network:**
   - app-new.js carregou? Status?

6. **Service Worker:**
   - Está ativo? Versão?

---

## ✅ Solução Definitiva

Se nada funcionar, faça isso:

### 1. Backup dos Dados
```javascript
// Cole no console:
const backup = {
    transactions: localStorage.getItem('transactions'),
    goals: localStorage.getItem('goals'),
    kmData: localStorage.getItem('kmData'),
    fuelData: localStorage.getItem('fuelData')
};
console.log('BACKUP:', JSON.stringify(backup));
// Copie o resultado e salve em um arquivo
```

### 2. Limpar Completamente
```javascript
// Cole no console:
localStorage.clear();
sessionStorage.clear();
caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.unregister());
});
```

### 3. Fechar TODAS as Abas

### 4. Abrir Nova Aba

### 5. Testar

### 6. Restaurar Dados (se necessário)
```javascript
// Cole no console:
localStorage.setItem('transactions', '[COLE AQUI]');
localStorage.setItem('goals', '[COLE AQUI]');
// etc...
location.reload();
```

---

## 📞 Precisa de Ajuda?

**Me envie:**
1. Print do console com erros
2. Resultado do teste de funções
3. Navegador e sistema operacional
4. O que acontece quando clica no botão

**Vou resolver! 🚀**
