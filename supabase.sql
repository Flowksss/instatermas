-- ============================================================
--  INSTERMAS · Setup do Supabase
--  Cole tudo isto no SQL Editor do seu projeto e clique RUN (1x).
-- ============================================================

-- 1) Tabela das mensagens
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name       text not null,
  sector     text not null,
  type       text not null check (type in ('elogio', 'reclamacao')),
  message    text not null,
  hidden     boolean not null default false
);

-- 2) Ligar o tempo real nesta tabela
--    (se der erro "is already member", pode ignorar)
alter publication supabase_realtime add table public.posts;

-- 3) Segurança (RLS): app não tem login, então liberamos o acesso anônimo.
alter table public.posts enable row level security;

create policy "ler mensagens"     on public.posts for select using (true);
create policy "criar mensagens"   on public.posts for insert with check (true);
create policy "ocultar mensagens" on public.posts for update using (true) with check (true);
