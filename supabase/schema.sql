-- ============================================================
-- Driver Finance — Schema + Row Level Security (RLS)
-- Cole este script no Supabase: Dashboard -> SQL Editor -> New query -> Run
-- Requer autenticação (Supabase Auth). Cada usuário só acessa os próprios dados.
-- ============================================================

-- Extensão para gen_random_uuid (já vem habilitada na maioria dos projetos)
create extension if not exists "pgcrypto";

-- ---------- TRANSAÇÕES (receitas e despesas) ----------
create table if not exists public.transactions (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references auth.users(id) on delete cascade,
    local_id     bigint,                       -- id original do localStorage (para migração/idempotência)
    type         text not null check (type in ('revenue', 'expense')),
    amount       numeric(12,2) not null,
    date         date not null,
    description  text,
    category     text,
    app          text,
    trips        integer default 1,
    start_time   text,
    end_time     text,
    work_time    jsonb,
    liters       numeric(10,2),
    maintenance_type text,
    created_at   timestamptz not null default now()
);

-- ---------- QUILOMETRAGEM ----------
create table if not exists public.km_data (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users(id) on delete cascade,
    date        date not null,
    km_inicial  numeric(12,1),
    km_final    numeric(12,1),
    km_rodado   numeric(12,1),
    start_time  timestamptz,
    end_time    timestamptz,
    created_at  timestamptz not null default now(),
    unique (user_id, date)                      -- um registro de KM por dia por usuário
);

-- ---------- ABASTECIMENTOS ----------
create table if not exists public.fuel_data (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users(id) on delete cascade,
    local_id    bigint,
    date        date not null,
    litros      numeric(10,2),
    valor       numeric(12,2),
    preco_litro numeric(10,3),
    km_atual    numeric(12,1),
    km_rodado   numeric(12,1),
    consumo     numeric(10,2),
    created_at  timestamptz not null default now()
);

-- ---------- MANUTENÇÕES ----------
create table if not exists public.maintenance_data (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users(id) on delete cascade,
    local_id    bigint,
    type        text,
    date        date not null,
    current_km  numeric(12,1),
    next_km     numeric(12,1),
    cost        numeric(12,2) default 0,
    notes       text,
    completed   boolean default false,
    created_at  timestamptz not null default now()
);

-- ---------- CONTAS A PAGAR ----------
create table if not exists public.bills (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users(id) on delete cascade,
    local_id    bigint,
    name        text not null,
    category    text,
    amount      numeric(12,2) not null,
    due_date    date not null,
    recurring   boolean default false,
    paid        boolean default false,
    paid_at     timestamptz,
    created_at  timestamptz not null default now()
);

-- ---------- METAS (uma linha por usuário) ----------
create table if not exists public.goals (
    user_id     uuid primary key references auth.users(id) on delete cascade,
    daily       numeric(12,2) default 200,
    weekly      numeric(12,2) default 1400,
    monthly     numeric(12,2) default 6000,
    trips       integer default 200,
    updated_at  timestamptz not null default now()
);

-- ---------- Índices ----------
create index if not exists idx_tx_user_date   on public.transactions(user_id, date);
create index if not exists idx_tx_user_type   on public.transactions(user_id, type);
create index if not exists idx_km_user_date   on public.km_data(user_id, date);
create index if not exists idx_fuel_user_date on public.fuel_data(user_id, date);
create index if not exists idx_maint_user     on public.maintenance_data(user_id);
create index if not exists idx_bills_user_due on public.bills(user_id, due_date);

-- ============================================================
-- ROW LEVEL SECURITY: cada usuário só enxerga o próprio user_id
-- ============================================================
alter table public.transactions     enable row level security;
alter table public.km_data          enable row level security;
alter table public.fuel_data        enable row level security;
alter table public.maintenance_data enable row level security;
alter table public.bills            enable row level security;
alter table public.goals            enable row level security;

-- Helper: cria as 4 políticas (select/insert/update/delete) para uma tabela
-- (Postgres não tem "create policy if not exists"; por isso usamos DO blocks.)
do $$
declare t text;
begin
  foreach t in array array['transactions','km_data','fuel_data','maintenance_data','bills','goals']
  loop
    execute format('drop policy if exists "own_select" on public.%I;', t);
    execute format('drop policy if exists "own_insert" on public.%I;', t);
    execute format('drop policy if exists "own_update" on public.%I;', t);
    execute format('drop policy if exists "own_delete" on public.%I;', t);

    execute format('create policy "own_select" on public.%I for select using (auth.uid() = user_id);', t);
    execute format('create policy "own_insert" on public.%I for insert with check (auth.uid() = user_id);', t);
    execute format('create policy "own_update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
    execute format('create policy "own_delete" on public.%I for delete using (auth.uid() = user_id);', t);
  end loop;
end $$;

-- Pronto! Após rodar, ative a autenticação por e-mail em:
-- Authentication -> Providers -> Email (e, para testar sem confirmar e-mail,
-- pode desativar "Confirm email" em Authentication -> Providers -> Email).
