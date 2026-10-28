-- OBORO+ / OboroCoin / curtidas / comentários / bio de perfil / adicionar páginas.
-- Rode uma vez no Supabase (SQL Editor). É idempotente: pode rodar de novo sem quebrar.
-- Saldo e assinatura só mudam por funções SECURITY DEFINER abaixo: o navegador não consegue
-- gravar direto em wallets / coin_tx, então ninguém "inventa" moedas pelo console.

-- ---------- bio pública ----------
create table if not exists public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  bio text not null default '' check (char_length(bio) <= 300),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select using (true);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ---------- carteira (OboroCoin + OBORO+) ----------
create table if not exists public.wallets(
  user_id uuid primary key references auth.users(id) on delete cascade,
  coins integer not null default 0 check (coins >= 0),
  plus_until timestamptz,
  last_checkin date
);
alter table public.wallets enable row level security;
drop policy if exists wallets_read_own on public.wallets;
create policy wallets_read_own on public.wallets for select to authenticated using (user_id = auth.uid());
-- sem policies de insert/update/delete: só as funções abaixo escrevem.

create table if not exists public.coin_tx(
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);
alter table public.coin_tx enable row level security;
drop policy if exists coin_tx_read_own on public.coin_tx;
create policy coin_tx_read_own on public.coin_tx for select to authenticated using (user_id = auth.uid());

create or replace function public.is_plus(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select plus_until > now() from public.wallets where user_id = uid), false)
$$;

create or replace function public.wallet_get()
returns table(coins integer, plus_until timestamptz, last_checkin date)
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  insert into public.wallets(user_id) values (auth.uid()) on conflict do nothing;
  return query select w.coins, w.plus_until, w.last_checkin from public.wallets w where w.user_id = auth.uid();
end $$;

-- bônus diário: 10 OboroCoin (20 com OBORO+), uma vez por dia no fuso de São Paulo
create or replace function public.claim_daily() returns integer
language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'America/Sao_Paulo')::date; w public.wallets; gain integer;
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  insert into public.wallets(user_id) values (auth.uid()) on conflict do nothing;
  select * into w from public.wallets where user_id = auth.uid() for update;
  if w.last_checkin = today then raise exception 'already_claimed'; end if;
  gain := case when w.plus_until > now() then 20 else 10 end;
  update public.wallets set coins = coins + gain, last_checkin = today where user_id = auth.uid();
  insert into public.coin_tx(user_id, delta, reason) values (auth.uid(), gain, 'daily');
  return w.coins + gain;
end $$;

-- assinatura: 300 OboroCoin por 30 dias (renovar soma 30 dias ao que sobrou)
create or replace function public.buy_plus() returns timestamptz
language plpgsql security definer set search_path = public as $$
declare w public.wallets; newend timestamptz;
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  insert into public.wallets(user_id) values (auth.uid()) on conflict do nothing;
  select * into w from public.wallets where user_id = auth.uid() for update;
  if w.coins < 300 then raise exception 'insufficient_coins'; end if;
  newend := greatest(coalesce(w.plus_until, now()), now()) + interval '30 days';
  update public.wallets set coins = coins - 300, plus_until = newend where user_id = auth.uid();
  insert into public.coin_tx(user_id, delta, reason) values (auth.uid(), -300, 'plus');
  return newend;
end $$;

revoke all on function public.wallet_get(), public.claim_daily(), public.buy_plus() from public, anon;
grant execute on function public.wallet_get(), public.claim_daily(), public.buy_plus() to authenticated;
revoke all on function public.is_plus(uuid) from public, anon;
grant execute on function public.is_plus(uuid) to authenticated;

-- ---------- curtidas e comentários (só quem tem OBORO+ escreve) ----------
create table if not exists public.likes(
  work_id uuid not null references public.works(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (work_id, user_id)
);
alter table public.likes enable row level security;
drop policy if exists likes_read on public.likes;
create policy likes_read on public.likes for select using (true);
drop policy if exists likes_insert_plus on public.likes;
create policy likes_insert_plus on public.likes for insert to authenticated with check (user_id = auth.uid() and public.is_plus(auth.uid()));
drop policy if exists likes_delete_own on public.likes;
create policy likes_delete_own on public.likes for delete to authenticated using (user_id = auth.uid());

create table if not exists public.comments(
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_name text not null default 'Leitor' check (char_length(author_name) <= 40),
  body text not null check (char_length(body) between 1 and 400),
  created_at timestamptz not null default now()
);
create index if not exists comments_work_idx on public.comments(work_id, created_at desc);
alter table public.comments enable row level security;
drop policy if exists comments_read on public.comments;
create policy comments_read on public.comments for select using (true);
drop policy if exists comments_insert_plus on public.comments;
create policy comments_insert_plus on public.comments for insert to authenticated with check (user_id = auth.uid() and public.is_plus(auth.uid()));
drop policy if exists comments_delete on public.comments;
create policy comments_delete on public.comments for delete to authenticated using (
  user_id = auth.uid() or exists (select 1 from public.works w where w.id = work_id and w.author_id = auth.uid()));

-- ---------- adicionar páginas a um capítulo existente ----------
-- ATENÇÃO: assume que chapters.pages é text[] (como o publish_chapter recebe p_pages).
-- Se for jsonb, troque "pages || p_pages" por "pages || to_jsonb(p_pages)".
create or replace function public.add_chapter_pages(p_chapter_id uuid, p_pages text[]) returns void
language plpgsql security definer set search_path = public as $$
declare c record; pfx text; pg text;
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  select ch.id, ch.work_id, cardinality(ch.pages) as n, w.author_id into c
    from public.chapters ch join public.works w on w.id = ch.work_id where ch.id = p_chapter_id for update of ch;
  if not found or c.author_id <> auth.uid() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_pages is null or cardinality(p_pages) = 0 or cardinality(p_pages) > 60 or c.n + cardinality(p_pages) > 200 then
    raise exception 'limite' using errcode = '54000'; end if;
  pfx := auth.uid()::text || '/' || c.work_id::text || '/' || c.id::text || '/';
  foreach pg in array p_pages loop
    if left(pg, length(pfx)) <> pfx or pg like '%..%' then raise exception 'forbidden' using errcode = '42501'; end if;
  end loop;
  update public.chapters set pages = pages || p_pages where id = p_chapter_id;
  update public.works set updated_at = now() where id = c.work_id;
end $$;
revoke all on function public.add_chapter_pages(uuid, text[]) from public, anon;
grant execute on function public.add_chapter_pages(uuid, text[]) to authenticated;
