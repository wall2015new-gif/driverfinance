# Configuração do Supabase — Driver Finance

Integração de banco de dados na nuvem com **autenticação por e-mail** e **RLS**
(cada usuário só acessa os próprios dados). Arquitetura **offline-first**: o app
continua usando LocalStorage como cache e sincroniza com o Supabase.

## Credenciais (já configuradas em `supabase-config.js`)
- **Project URL:** `https://bwoycbcwebbfennfepkw.supabase.co`
- **Publishable key:** `sb_publishable_...` (feita para o frontend; a proteção
  real vem do RLS). **Nunca** coloque a `secret`/`service_role` no frontend.

## Passo a passo (no painel do Supabase)

### 1. Criar as tabelas + RLS
1. Menu lateral → **SQL Editor** → **New query**.
2. Cole todo o conteúdo de [`schema.sql`](./schema.sql) e clique **Run**.
3. Confirme em **Table Editor** que apareceram: `transactions`, `km_data`,
   `fuel_data`, `maintenance_data`, `bills`, `goals`.

### 2. Ativar login por e-mail
1. **Authentication → Providers → Email** → deixe **Email** habilitado.
2. Para **testar rápido**, desative **"Confirm email"** (assim você cria a conta
   e entra na hora). Em produção, é recomendável religar.

### 3. Testar
1. Abra o app (`index.html` / Vercel).
2. Vai aparecer a tela de login. Clique em **Criar conta**, informe e-mail e senha
   (mín. 6 caracteres) e confirme.
3. No primeiro login, se você já tinha dados no aparelho, eles são **migrados**
   automaticamente para o Supabase. Em outros dispositivos, os dados são
   **baixados** da nuvem.

## Como funciona a sincronização
- **Leitura/gravação** do app continuam no LocalStorage (rápido, offline).
- Ao gravar qualquer dado (`transactions`, `kmData`, `fuelData`,
  `maintenanceData`, `bills`, `goals`), um hook dispara o envio para o Supabase
  (com debounce de 0,8s).
- No login: `initialSync()` decide entre **migrar** (nuvem vazia + dados locais)
  ou **baixar** (nuvem é a fonte da verdade).
- Estratégia por coleção: *delete + insert* do conjunto do usuário — simples e
  consistente para uso pessoal.

## Segurança
- O RLS garante que cada `user_id` só enxerga os próprios registros.
- A publishable key pode ficar no frontend **desde que o RLS esteja ativo**
  (o `schema.sql` já ativa e cria as políticas).
- Logout: modal de **Configurações → Conta → Sair**.

## Arquivos da integração
- `supabase-config.js` — inicializa o cliente Supabase.
- `db.js` — camada de sincronização (`window.DFDB`).
- `auth.js` — tela de login/cadastro, gate de sessão e hooks de escrita.
- `supabase/schema.sql` — tabelas + RLS.
