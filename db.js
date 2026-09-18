/**
 * CAMADA DE DADOS — DRIVER FINANCE + SUPABASE (offline-first)
 *
 * Estratégia: o app continua lendo/gravando no LocalStorage (rápido e offline).
 * Este módulo sincroniza LocalStorage <-> Supabase:
 *   - pullAll(): baixa os dados do usuário logado e substitui o LocalStorage.
 *   - pushAll(): envia o estado atual do LocalStorage para o Supabase.
 *   - syncKey(key): envia uma coleção específica após uma alteração local.
 *
 * Toda a lógica financeira/telas permanecem intactas: elas só leem/escrevem
 * LocalStorage; aqui apenas espelhamos para a nuvem.
 *
 * Requer: window.supabaseClient (supabase-config.js) e usuário autenticado.
 */
(function () {
  'use strict';

  // Mapa: chave do localStorage -> { table, single? }
  const COLLECTIONS = {
    transactions:    { table: 'transactions' },
    kmData:          { table: 'km_data' },
    fuelData:        { table: 'fuel_data' },
    maintenanceData: { table: 'maintenance_data' },
    bills:           { table: 'bills' },
    goals:           { table: 'goals', single: true },
  };

  // ---- Conversores camelCase <-> snake_case por tabela ----
  // Mapeamos apenas os campos que diferem; os iguais passam direto.
  const FIELD_MAP = {
    transactions: {
      toRow: (t) => ({
        local_id: numOrNull(t.id),
        type: t.type,
        amount: parseFloat(t.amount) || 0,
        date: t.date,
        description: t.description ?? null,
        category: t.category ?? null,
        app: t.app ?? null,
        trips: intOrNull(t.trips),
        start_time: t.startTime ?? null,
        end_time: t.endTime ?? null,
        work_time: t.workTime ?? null,
        liters: numOrNull(t.liters),
        maintenance_type: t.maintenanceType ?? null,
      }),
      fromRow: (r) => clean({
        id: r.local_id ?? hashId(r.id),
        type: r.type,
        amount: String(r.amount),
        date: r.date,
        description: r.description,
        category: r.category,
        app: r.app,
        trips: r.trips,
        startTime: r.start_time,
        endTime: r.end_time,
        workTime: r.work_time,
        liters: r.liters,
        maintenanceType: r.maintenance_type,
      }),
    },
    kmData: {
      toRow: (k) => ({
        date: k.date,
        km_inicial: numOrNull(k.kmInicial),
        km_final: numOrNull(k.kmFinal),
        km_rodado: numOrNull(k.kmRodado),
        start_time: k.startTime ?? null,
        end_time: k.endTime ?? null,
      }),
      fromRow: (r) => clean({
        date: r.date,
        kmInicial: r.km_inicial,
        kmFinal: r.km_final,
        kmRodado: r.km_rodado,
        startTime: r.start_time,
        endTime: r.end_time,
      }),
    },
    fuelData: {
      toRow: (f) => ({
        local_id: numOrNull(f.id),
        date: f.date,
        litros: numOrNull(f.litros),
        valor: numOrNull(f.valor),
        preco_litro: numOrNull(f.precoLitro),
        km_atual: numOrNull(f.kmAtual),
        km_rodado: numOrNull(f.kmRodado),
        consumo: numOrNull(f.consumo),
      }),
      fromRow: (r) => clean({
        id: r.local_id ?? hashId(r.id),
        date: r.date,
        litros: r.litros,
        valor: r.valor,
        precoLitro: r.preco_litro,
        kmAtual: r.km_atual,
        kmRodado: r.km_rodado,
        consumo: r.consumo,
      }),
    },
    maintenanceData: {
      toRow: (m) => ({
        local_id: numOrNull(m.id),
        type: m.type,
        date: m.date,
        current_km: numOrNull(m.currentKm),
        next_km: numOrNull(m.nextKm),
        cost: numOrNull(m.cost) || 0,
        notes: m.notes ?? null,
        completed: !!m.completed,
      }),
      fromRow: (r) => clean({
        id: r.local_id ?? hashId(r.id),
        type: r.type,
        date: r.date,
        currentKm: r.current_km,
        nextKm: r.next_km,
        cost: r.cost,
        notes: r.notes,
        completed: r.completed,
      }),
    },
    bills: {
      toRow: (b) => ({
        local_id: numOrNull(b.id),
        name: b.name,
        category: b.category ?? null,
        amount: parseFloat(b.amount) || 0,
        due_date: b.dueDate,
        recurring: !!b.recurring,
        paid: !!b.paid,
        paid_at: b.paidAt ?? null,
      }),
      fromRow: (r) => clean({
        id: r.local_id ?? hashId(r.id),
        name: r.name,
        category: r.category,
        amount: r.amount,
        dueDate: r.due_date,
        recurring: r.recurring,
        paid: r.paid,
        paidAt: r.paid_at,
      }),
    },
  };

  // ---------- helpers ----------
  function numOrNull(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }
  function intOrNull(v) { const n = parseInt(v, 10); return isNaN(n) ? null : n; }
  function clean(obj) { Object.keys(obj).forEach(k => { if (obj[k] === null || obj[k] === undefined) delete obj[k]; }); return obj; }
  // Gera um id numérico estável a partir do uuid (fallback quando não há local_id)
  function hashId(uuid) {
    let h = 0; const s = String(uuid || Date.now());
    for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
    return Math.abs(h);
  }
  function getClient() { return window.supabaseClient || null; }
  function lsGet(key, def) { try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; } }
  function lsSet(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

  // ---------- Estado de sincronização (observável pela UI) ----------
  // state: 'offline' | 'idle' | 'syncing' | 'synced' | 'error'
  const syncState = { state: 'offline', lastSync: Number(localStorage.getItem('df_last_sync')) || null, message: '' };
  function setStatus(state, message) {
    syncState.state = state;
    if (message !== undefined) syncState.message = message;
    if (state === 'synced') {
      syncState.lastSync = Date.now();
      try { localStorage.setItem('df_last_sync', String(syncState.lastSync)); } catch (e) {}
    }
    try { window.dispatchEvent(new CustomEvent('df-sync', { detail: Object.assign({}, syncState) })); } catch (e) {}
  }
  function getStatus() { return Object.assign({}, syncState); }
  // marca offline quando perde conexão / online ao voltar
  if (typeof window !== 'undefined') {
    window.addEventListener('offline', () => setStatus('offline'));
    window.addEventListener('online', () => setStatus('idle'));
  }

  async function getUserId() {
    const c = getClient(); if (!c) return null;
    const { data } = await c.auth.getUser();
    return data?.user?.id || null;
  }

  // ---------- PUSH: LocalStorage -> Supabase ----------
  async function pushCollection(key) {
    const c = getClient(); if (!c) return;
    const uid = await getUserId(); if (!uid) return;
    const cfg = COLLECTIONS[key];

    if (cfg.single) {
      // goals: uma linha por usuário (upsert por user_id)
      const g = lsGet('goals', { daily: 200, weekly: 1400, monthly: 6000, trips: 200 });
      const { error } = await c.from(cfg.table).upsert({
        user_id: uid,
        daily: numOrNull(g.daily), weekly: numOrNull(g.weekly),
        monthly: numOrNull(g.monthly), trips: intOrNull(g.trips),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) console.warn(`sync goals:`, error.message);
      return;
    }

    const arr = lsGet(key, []);
    if (!Array.isArray(arr)) return;
    const map = FIELD_MAP[key];

    // Estratégia simples e robusta para uso pessoal: substituir o conjunto do
    // usuário (delete + insert). Evita divergências de merge parcial.
    const del = await c.from(cfg.table).delete().eq('user_id', uid);
    if (del.error) { console.warn(`sync ${key} (delete):`, del.error.message); return; }

    if (arr.length === 0) return;
    const rows = arr.map(item => Object.assign({ user_id: uid }, map.toRow(item)));
    const ins = await c.from(cfg.table).insert(rows);
    if (ins.error) console.warn(`sync ${key} (insert):`, ins.error.message);
  }

  async function pushAll() {
    if (!getClient()) return;
    setStatus('syncing', 'Enviando dados...');
    try {
      for (const key of Object.keys(COLLECTIONS)) {
        // eslint-disable-next-line no-await-in-loop
        await pushCollection(key);
      }
      setStatus('synced');
      console.log('☁️ pushAll concluído');
    } catch (e) {
      setStatus('error', e.message || 'Erro ao enviar');
      console.warn('pushAll', e);
    }
  }

  // Debounce por coleção para não floodar a rede a cada clique
  const pending = {};
  function syncKey(key) {
    if (!getClient()) return;
    clearTimeout(pending[key]);
    setStatus('syncing', 'Salvando...');
    pending[key] = setTimeout(() => {
      pushCollection(key)
        .then(() => setStatus('synced'))
        .catch(e => { setStatus('error', e.message); console.warn('syncKey', key, e); });
    }, 800);
  }

  // ---------- PULL: Supabase -> LocalStorage ----------
  async function pullAll() {
    const c = getClient(); if (!c) return false;
    const uid = await getUserId(); if (!uid) return false;
    setStatus('syncing', 'Baixando dados...');

    for (const [key, cfg] of Object.entries(COLLECTIONS)) {
      // eslint-disable-next-line no-await-in-loop
      const { data, error } = await c.from(cfg.table).select('*').eq('user_id', uid);
      if (error) { console.warn(`pull ${key}:`, error.message); continue; }

      if (cfg.single) {
        if (data && data.length) {
          const r = data[0];
          lsSet('goals', { daily: r.daily, weekly: r.weekly, monthly: r.monthly, trips: r.trips });
        }
        continue;
      }
      const map = FIELD_MAP[key];
      lsSet(key, (data || []).map(map.fromRow));
    }
    setStatus('synced');
    console.log('☁️ pullAll concluído');
    return true;
  }

  // Sincroniza manualmente: envia local -> nuvem e baixa nuvem -> local.
  async function syncNow() {
    if (!getClient()) { setStatus('offline'); return false; }
    const uid = await getUserId();
    if (!uid) { setStatus('offline', 'Não autenticado'); return false; }
    await pushAll();
    return true;
  }

  // ---------- MIGRAÇÃO inicial (primeiro login neste dispositivo) ----------
  // Se a nuvem estiver vazia e houver dados locais, sobe os locais.
  // Caso contrário, baixa a nuvem (fonte da verdade entre dispositivos).
  async function initialSync() {
    const c = getClient(); if (!c) return;
    const uid = await getUserId(); if (!uid) return;

    const { count, error } = await c.from('transactions')
      .select('*', { count: 'exact', head: true }).eq('user_id', uid);

    const localTx = lsGet('transactions', []);
    const cloudEmpty = !error && (count || 0) === 0;

    if (cloudEmpty && Array.isArray(localTx) && localTx.length > 0) {
      console.log('⬆️ Nuvem vazia: migrando dados locais para o Supabase...');
      await pushAll();
    } else {
      console.log('⬇️ Baixando dados da nuvem...');
      await pullAll();
    }
  }

  // Status inicial: se há cliente, estamos "idle" (pronto); senão offline.
  setStatus(getClient() ? 'idle' : 'offline');

  // Expor API
  window.DFDB = { pushAll, pullAll, syncKey, syncNow, initialSync, getUserId, getStatus, COLLECTIONS };
})();
