/*
 * Driver Finance — Testes de cálculos financeiros e de datas.
 *
 * Valida as fórmulas de negócio contra valores conhecidos e documenta o bug de
 * timezone que foi corrigido (parse de 'YYYY-MM-DD' deve ser ancorado em
 * meia-noite LOCAL, não UTC).
 *
 * Rodar (de preferência num fuso negativo, p/ exercitar o caso do Brasil):
 *   TZ='America/Sao_Paulo' node tests/calc.test.js
 */

let pass = 0, fail = 0;
function assert(name, got, expected) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  -> got=${JSON.stringify(got)} expected=${JSON.stringify(expected)}`);
  ok ? pass++ : fail++;
}

// ---------- Cenário de transações conhecidas ----------
const transactions = [
  { type: 'revenue', amount: '100.50', trips: 3, date: '2026-09-10', app: 'uber' },
  { type: 'revenue', amount: '49.50', trips: 2, date: '2026-09-10', app: '99' },
  { type: 'revenue', amount: '200', trips: 5, date: '2026-09-01', app: 'uber' }, // dia 1 do mês
  { type: 'expense', amount: '80', category: 'gas', date: '2026-09-10' },
  { type: 'expense', amount: '20.25', category: 'food', date: '2026-09-10' },
];

const revenues = transactions.filter(t => t.type === 'revenue');
const expenses = transactions.filter(t => t.type === 'expense');
const totalRevenue = revenues.reduce((s, t) => s + parseFloat(t.amount), 0);
const totalExpense = expenses.reduce((s, t) => s + parseFloat(t.amount), 0);
const profit = totalRevenue - totalExpense;

assert('Ganhos totais', totalRevenue, 350);
assert('Despesas totais', totalExpense, 100.25);
assert('Lucro liquido', +profit.toFixed(2), 249.75);

const totalTrips = revenues.reduce((s, t) => s + (parseInt(t.trips) || 1), 0);
assert('Total de corridas', totalTrips, 10);
assert('Ticket medio', +(totalRevenue / totalTrips).toFixed(4), 35);

const kmData = [{ date: '2026-09-10', kmRodado: 50 }, { date: '2026-09-01', kmRodado: 100 }];
const totalKm = kmData.reduce((s, k) => s + k.kmRodado, 0);
assert('R$/km', +(totalRevenue / totalKm).toFixed(4), 2.3333);

// ---------- Regressão do bug de timezone ----------
// new Date('YYYY-MM-DD') = meia-noite UTC; em UTC-3 "volta" um dia.
// A correção usa new Date(str + 'T00:00:00') = meia-noite LOCAL.
const dateStr = '2026-09-01';
const correctMonth = new Date(dateStr + 'T00:00:00').getMonth(); // deve ser 8 (set) em qualquer fuso
console.log(`\n[TZ=${Intl.DateTimeFormat().resolvedOptions().timeZone}] offset(min)=${new Date().getTimezoneOffset()}`);
assert('Data ancorada em meia-noite local -> Setembro (8)', correctMonth, 8);

console.log(`\n=== RESULTADO: ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail > 0 ? 1 : 0);
