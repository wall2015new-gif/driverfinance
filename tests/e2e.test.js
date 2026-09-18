/*
 * Driver Finance — Teste E2E de regressão.
 *
 * Carrega o app-new.js REAL num DOM/localStorage simulado (vm) e exercita as
 * funções de negócio para provar:
 *   (1) o script carrega sem ReferenceError (regressão do crash 'saveKmDay');
 *   (2) registros do dia 1 do mês entram no mês certo (regressão de timezone);
 *   (3) updateAppComparator() roda sem lançar (regressão do TDZ de
 *       appComparisonChart, que era efeito colateral do crash de load).
 *
 * Rodar (de preferência num fuso negativo):
 *   TZ='America/Sao_Paulo' node tests/e2e.test.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let pass = 0, fail = 0;
function ok(name, cond, extra = '') { console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${extra}`); cond ? pass++ : fail++; }

// ----- DOM/localStorage stub mínimo -----
const elements = {};
function makeEl(id) {
  return {
    id, _text: '', value: '', style: {}, className: '',
    set textContent(v) { this._text = String(v); }, get textContent() { return this._text; },
    set innerHTML(v) { this._html = String(v); }, get innerHTML() { return this._html || ''; },
    classList: { add() {}, remove() {}, contains() { return false; } },
    addEventListener() {}, removeEventListener() {}, appendChild() {}, remove() {}, setAttribute() {}, getContext() { return {}; },
    querySelector() { return null; }, querySelectorAll() { return []; }, focus() {},
  };
}
function getEl(id) { return elements[id] || (elements[id] = makeEl(id)); }

const store = {};
const sandbox = {
  console,
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
    clear: () => { for (const k in store) delete store[k]; },
  },
  document: {
    addEventListener() {},
    getElementById: getEl,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => makeEl('tmp'),
    head: { appendChild() {} },
    body: { appendChild() {}, removeChild() {}, setAttribute() {}, removeAttribute() {} },
    title: '',
  },
  window: { matchMedia: () => ({ matches: false }), addEventListener() {}, location: { search: '', pathname: '/' }, history: { replaceState() {} }, navigator: {}, jspdf: {} },
  navigator: { userAgent: 'node', vibrate() {}, serviceWorker: { addEventListener() {}, register() { return { then() { return { catch() {} }; } }; } } },
  Chart: function () { return { destroy() {} }; },
  Notification: Object.assign(function () {}, { permission: 'default' }),
  caches: { keys: () => Promise.resolve([]) },
  setInterval: () => {}, setTimeout: () => {}, clearInterval: () => {},
  Intl,
};
sandbox.globalThis = sandbox;

// ----- Dados de teste: registros no dia 1 (caso crítico de timezone) -----
const M = '2026-09';
store.transactions = JSON.stringify([
  { type: 'revenue', amount: '200', trips: 5, date: `${M}-01`, app: 'uber' },
  { type: 'revenue', amount: '100', trips: 2, date: `${M}-15`, app: '99' },
  { type: 'expense', amount: '80', category: 'gas', date: `${M}-01` },
]);
store.kmData = JSON.stringify([{ date: `${M}-01`, kmRodado: 120, kmFinal: 50120 }]);
store.bills = JSON.stringify([{ id: 1, name: 'Parcela', category: 'vehicle', amount: 500, dueDate: `${M}-01`, paid: false }]);
store.maintenanceData = JSON.stringify([]);
store.fuelData = JSON.stringify([]);
store.goals = JSON.stringify({ daily: 200, weekly: 1400, monthly: 6000, trips: 200 });

// Congela "hoje" para tornar o teste determinístico.
const RealDate = Date;
const FIXED_NOW = new RealDate('2026-09-16T12:00:00');
sandbox.Date = class extends RealDate {
  constructor(...args) { if (args.length === 0) return new RealDate(FIXED_NOW); return new RealDate(...args); }
  static now() { return FIXED_NOW.getTime(); }
};

const code = fs.readFileSync(path.join(__dirname, '..', 'app-new.js'), 'utf8');
let loadErr = null;
try {
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: 'app-new.js' });
} catch (e) { loadErr = e; }

ok('app-new.js carrega sem erro de load-time', !loadErr, loadErr ? '-> ' + loadErr.message : '');

try {
  sandbox.updateSmartCalculator();
  const totalBills = getEl('totalBills')._html || getEl('totalBills')._text;
  ok('Conta com vencimento no dia 1 entra no total (timezone fix)', /500/.test(totalBills), `-> totalBills="${totalBills}"`);
} catch (e) { ok('updateSmartCalculator executa', false, '-> ' + e.message); }

try {
  const data = vm.runInContext('AIAssistant.collectData()', sandbox);
  ok('KM do dia 1 contabilizado no mês (esperado 120)', data.totalKm === 120, `-> totalKm=${data.totalKm}`);
  ok('Receita do mês inclui dia 1 (esperado 300)', data.totalRevenue === 300, `-> totalRevenue=${data.totalRevenue}`);
} catch (e) { ok('AIAssistant.collectData executa', false, '-> ' + e.message); }

try {
  sandbox.updateAppComparator();
  const uberRev = getEl('uberRevenue')._text;
  ok('updateAppComparator executa sem lançar (fix crítico)', true, `-> uberRevenue="${uberRev}"`);
} catch (e) { ok('updateAppComparator executa sem lançar (fix crítico)', false, '-> ' + e.message); }

// (4) Redesign 2025 — home renderiza sem erro e Resumo do Mês usa dados reais
store.userName = 'Wallace Silva';
try {
  sandbox.updateGreeting();
  ok('updateGreeting define nome do usuário', getEl('greetingTitle')._text.includes('Wallace'), `-> "${getEl('greetingTitle')._text}"`);
  ok('Avatar usa iniciais do usuário', getEl('userAvatar')._text === 'WS', `-> "${getEl('userAvatar')._text}"`);
} catch (e) { ok('updateGreeting executa', false, '-> ' + e.message); }

try {
  sandbox.updateHomePage('today');
  ok('updateHomePage("today") executa sem lançar', true);
  sandbox.updateHomePage('month');
  // Mês tem receitas 300 e despesa 80 => lucro 220
  ok('Resumo do mês: ganhos reais (R$ 300)', /300/.test(getEl('monthRevenue')._text), `-> "${getEl('monthRevenue')._text}"`);
  ok('Resumo do mês: lucro real (R$ 220)', /220/.test(getEl('monthProfit')._text), `-> "${getEl('monthProfit')._text}"`);
} catch (e) { ok('updateHomePage/Resumo do mês executa', false, '-> ' + e.message); }

console.log(`\n=== E2E: ${pass} PASS / ${fail} FAIL (TZ=${Intl.DateTimeFormat().resolvedOptions().timeZone}) ===`);
process.exit(fail > 0 ? 1 : 0);
