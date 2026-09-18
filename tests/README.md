# Testes — Driver Finance

Testes de regressão em Node puro (sem dependências). Cobrem os bugs corrigidos
na auditoria: cálculos financeiros, datas/timezone e o crash de carregamento.

## Como rodar

```bash
# De preferência num fuso negativo, para exercitar o caso do Brasil (UTC-3):
TZ='America/Sao_Paulo' node tests/calc.test.js
TZ='America/Sao_Paulo' node tests/e2e.test.js
```

No Windows (PowerShell):

```powershell
$env:TZ='America/Sao_Paulo'; node tests/calc.test.js
$env:TZ='America/Sao_Paulo'; node tests/e2e.test.js
```

## O que cada arquivo cobre

- `calc.test.js` — fórmulas de negócio contra valores conhecidos (ganhos,
  despesas, lucro, corridas, ticket médio, R$/km) e a regressão do parse de
  datas ancorado em meia-noite local.
- `e2e.test.js` — carrega o `app-new.js` real num DOM/localStorage simulado e
  verifica: (1) carga sem `ReferenceError`; (2) registros do dia 1 do mês
  contabilizados no mês certo; (3) `updateAppComparator()` sem exceção;
  (4) redesign 2025: saudação com nome do usuário, iniciais no avatar,
  `updateHomePage()` (hoje/mês) e card "Resumo do Mês" com valores reais.

Saída esperada: todas as linhas `PASS` e `0 FAIL`.
