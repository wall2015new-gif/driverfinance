/**
 * AUTENTICAÇÃO — DRIVER FINANCE + SUPABASE
 *
 * - Cria um overlay de login/cadastro (e-mail + senha).
 * - Faz o "gate": esconde o app até o usuário logar.
 * - Após login: roda a sincronização inicial (DFDB.initialSync) e recarrega a UI.
 * - Instala hooks de escrita: quando o app grava as chaves de dados no
 *   localStorage, dispara o sync para o Supabase (offline-first).
 *
 * Se o Supabase não estiver disponível (offline/SDK não carregou), o app
 * funciona normalmente só com LocalStorage (degrade gracioso).
 */
(function () {
  'use strict';

  const DATA_KEYS = ['transactions', 'kmData', 'fuelData', 'maintenanceData', 'bills', 'goals'];

  function client() { return window.supabaseClient || null; }

  // ---------- Hook de escrita no localStorage ----------
  // Envolve setItem para disparar sync quando uma chave de dados muda.
  (function installStorageHook() {
    const original = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (key, value) {
      original(key, value);
      if (DATA_KEYS.includes(key) && window.DFDB && client()) {
        try { window.DFDB.syncKey(key); } catch (e) { /* silencioso */ }
      }
    };
  })();

  // ---------- Overlay de autenticação ----------
  function buildOverlay() {
    if (document.getElementById('authOverlay')) return;
    const el = document.createElement('div');
    el.id = 'authOverlay';
    el.innerHTML = `
      <div class="auth-card">
        <div class="auth-brand">
          <img src="./img/logotipo.png" alt="Driver Finance">
          <div>
            <div class="auth-title">DRIVER FINANCE</div>
            <div class="auth-sub">Mais controle. Mais lucro.</div>
          </div>
        </div>
        <div class="auth-tabs">
          <button id="authTabLogin" class="auth-tab active" type="button">Entrar</button>
          <button id="authTabSignup" class="auth-tab" type="button">Criar conta</button>
        </div>
        <form id="authForm" autocomplete="on">
          <label class="auth-label" for="authEmail">E-mail</label>
          <input id="authEmail" class="auth-input" type="email" required placeholder="voce@email.com" autocomplete="email">
          <label class="auth-label" for="authPass">Senha</label>
          <input id="authPass" class="auth-input" type="password" required minlength="6" placeholder="mínimo 6 caracteres" autocomplete="current-password">
          <div id="authError" class="auth-error" style="display:none"></div>
          <button id="authSubmit" class="auth-submit" type="submit">Entrar</button>
        </form>
        <div class="auth-hint">Seus dados ficam protegidos por login (RLS no Supabase).</div>
      </div>`;
    document.body.appendChild(el);

    const style = document.createElement('style');
    style.textContent = `
      #authOverlay{position:fixed;inset:0;z-index:20000;display:flex;align-items:center;justify-content:center;
        background:linear-gradient(135deg,#0B1F3A,#123456);padding:20px;}
      #authOverlay .auth-card{background:#fff;border-radius:24px;padding:28px 24px;width:100%;max-width:380px;
        box-shadow:0 24px 60px rgba(0,0,0,.35);animation:authIn .35s ease-out;}
      @keyframes authIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
      #authOverlay .auth-brand{display:flex;align-items:center;gap:12px;margin-bottom:20px;}
      #authOverlay .auth-brand img{height:40px;width:auto;}
      #authOverlay .auth-title{font-weight:800;color:#0B1F3A;letter-spacing:.5px;}
      #authOverlay .auth-sub{font-size:12px;color:#00B894;font-weight:600;}
      #authOverlay .auth-tabs{display:flex;gap:8px;margin-bottom:18px;background:#EAF0F6;padding:4px;border-radius:12px;}
      #authOverlay .auth-tab{flex:1;border:none;background:transparent;padding:10px;border-radius:9px;font-weight:700;
        color:#64748B;cursor:pointer;font-size:14px;}
      #authOverlay .auth-tab.active{background:#fff;color:#0B1F3A;box-shadow:0 1px 3px rgba(0,0,0,.1);}
      #authOverlay .auth-label{display:block;font-size:12px;font-weight:700;color:#64748B;margin:12px 0 6px;}
      #authOverlay .auth-input{width:100%;padding:13px 14px;border:1.5px solid #E2E8F0;border-radius:12px;font-size:15px;
        color:#0B1F3A;outline:none;transition:border-color .2s;}
      #authOverlay .auth-input:focus{border-color:#009B7A;}
      #authOverlay .auth-error{background:#FEE2E2;color:#B91C1C;font-size:13px;font-weight:600;padding:10px 12px;
        border-radius:10px;margin-top:12px;}
      #authOverlay .auth-submit{width:100%;margin-top:18px;padding:14px;border:none;border-radius:12px;cursor:pointer;
        background:linear-gradient(135deg,#006B5B,#009B7A);color:#fff;font-size:15px;font-weight:800;}
      #authOverlay .auth-submit:disabled{opacity:.6;cursor:default;}
      #authOverlay .auth-hint{margin-top:16px;font-size:11px;color:#94A3B8;text-align:center;line-height:1.4;}
    `;
    document.head.appendChild(style);

    let mode = 'login';
    const tabLogin = document.getElementById('authTabLogin');
    const tabSignup = document.getElementById('authTabSignup');
    const submit = document.getElementById('authSubmit');
    const pass = document.getElementById('authPass');
    const errBox = document.getElementById('authError');

    function setMode(m) {
      mode = m;
      tabLogin.classList.toggle('active', m === 'login');
      tabSignup.classList.toggle('active', m === 'signup');
      submit.textContent = m === 'login' ? 'Entrar' : 'Criar conta';
      pass.setAttribute('autocomplete', m === 'login' ? 'current-password' : 'new-password');
      errBox.style.display = 'none';
    }
    tabLogin.onclick = () => setMode('login');
    tabSignup.onclick = () => setMode('signup');

    document.getElementById('authForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const c = client();
      if (!c) { showErr('Supabase indisponível. Verifique sua conexão.'); return; }
      const email = document.getElementById('authEmail').value.trim();
      const password = pass.value;
      submit.disabled = true; submit.textContent = 'Aguarde...';
      try {
        if (mode === 'signup') {
          const { error } = await c.auth.signUp({ email, password });
          if (error) throw error;
          const { error: e2 } = await c.auth.signInWithPassword({ email, password });
          if (e2) { showErr('Conta criada! Se pedir confirmação de e-mail, confirme e entre.'); return; }
        } else {
          const { error } = await c.auth.signInWithPassword({ email, password });
          if (error) throw error;
        }
        // onAuthStateChange cuida do restante
      } catch (err) {
        showErr(traduzErro(err.message || 'Falha na autenticação'));
      } finally {
        submit.disabled = false; submit.textContent = mode === 'login' ? 'Entrar' : 'Criar conta';
      }
    });

    function showErr(msg) { errBox.textContent = msg; errBox.style.display = 'block'; }
  }

  function traduzErro(msg) {
    const m = (msg || '').toLowerCase();
    if (m.includes('invalid login')) return 'E-mail ou senha incorretos.';
    if (m.includes('already registered') || m.includes('already exists')) return 'Este e-mail já tem conta. Use "Entrar".';
    if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
    if (m.includes('password')) return 'Senha inválida (mínimo 6 caracteres).';
    return msg;
  }

  function showOverlay() { const o = document.getElementById('authOverlay'); if (o) o.style.display = 'flex'; }
  function hideOverlay() { const o = document.getElementById('authOverlay'); if (o) o.style.display = 'none'; }

  // ---------- Logout ----------
  window.dfLogout = async function () {
    const c = client();
    if (c) { await c.auth.signOut(); }
    location.reload();
  };

  // ---------- Refresh da UI após sincronizar ----------
  function refreshUI() {
    try {
      // Recarrega variáveis em memória a partir do localStorage já sincronizado
      if (typeof reloadStateFromStorage === 'function') reloadStateFromStorage();
      if (typeof updateHomePage === 'function') updateHomePage();
      if (typeof renderTransactions === 'function') renderTransactions();
      if (typeof updateGoals === 'function') updateGoals();
      if (typeof updateAppComparator === 'function') updateAppComparator();
      if (typeof updateGreeting === 'function') updateGreeting();
    } catch (e) { console.warn('refreshUI', e); }
  }

  // ---------- Boot ----------
  document.addEventListener('DOMContentLoaded', () => {
    buildOverlay();
    const c = client();
    if (!c) {
      // Sem Supabase: segue offline, sem gate.
      hideOverlay();
      return;
    }

    // Estado inicial: mostra overlay até confirmar sessão
    showOverlay();

    c.auth.getSession().then(({ data }) => {
      if (!data.session) showOverlay();
    });

    c.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        hideOverlay();
        try {
          if (window.DFDB) {
            await window.DFDB.initialSync();
            refreshUI();
          }
        } catch (e) { console.warn('initialSync', e); }
      } else {
        showOverlay();
      }
    });
  });
})();
