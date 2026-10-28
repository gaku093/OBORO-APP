-- =====================================================================
-- OBORO — endurecimento de segurança (aditivo, não apaga dados)
-- Baseado no esquema real inspecionado em 26/10/2026:
--   public.works, public.chapters, public.reads, public.favorites (RLS já ligado)
--   bucket "oboro" (público, limite 5 MB, jpeg/png/webp)
-- Rode no SQL Editor do Supabase (ou via CLI) ANTES de publicar o novo front-end.
-- O front-end novo usa as funções publish_work / publish_chapter e o novo
-- formato de caminho de arquivos: <uid>/<work_id>/cover.<ext>
--                                  <uid>/<work_id>/<chapter_id>/NNN.<ext>
-- Obras já publicadas (caminhos antigos .../c0/000.jpg) continuam funcionando.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Privilégios mínimos (defesa em profundidade além do RLS)
--    TRUNCATE e REFERENCES/TRIGGER não são cobertos por RLS: removê-los.
-- ---------------------------------------------------------------------
revoke all on public.works, public.chapters, public.reads, public.favorites from anon;
grant select on public.works, public.chapters to anon;           -- leitura pública das obras

revoke all on public.works, public.chapters, public.reads, public.favorites from authenticated;
grant select, insert, delete on public.works    to authenticated;
grant update (author_name, title, genre, age, mode, synopsis) on public.works to authenticated;
grant select, insert, delete on public.chapters to authenticated;
grant update (title) on public.chapters to authenticated;
grant select, insert         on public.reads    to authenticated;  -- sem update/delete: não dá para manipular
grant select, insert, delete on public.favorites to authenticated;

-- ---------------------------------------------------------------------
-- 2. Restrições de formato (os dados atuais já atendem)
-- ---------------------------------------------------------------------
alter table public.works
  add constraint works_genre_check check (genre in
    ('Ação','Aventura','Comédia','Drama','Fantasia','Ficção científica','Romance','Slice of life','Terror')),
  add constraint works_age_check check (age in ('Livre','12+','14+','16+','18+')),
  add constraint works_cover_path_check check (
    cover_path like author_id::text || '/' || id::text || '/%'
    and cover_path ~ '/cover\.(jpg|png|webp)$');

-- ---------------------------------------------------------------------
-- 3. Gatilhos de validação (valem também para chamadas diretas à API)
-- ---------------------------------------------------------------------
create or replace function public.works_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null and new.author_id is distinct from auth.uid() then
      raise exception 'author_id deve ser o usuário autenticado' using errcode = '42501';
    end if;
    if (select count(*) from public.works where author_id = new.author_id) >= 100 then
      raise exception 'limite de obras por autor atingido' using errcode = '54000';
    end if;
    new.created_at := now();
    new.updated_at := now();
  else
    if new.id <> old.id or new.author_id <> old.author_id
       or new.cover_path <> old.cover_path or new.created_at <> old.created_at then
      raise exception 'campos imutáveis da obra' using errcode = '42501';
    end if;
    new.updated_at := now();
  end if;
  new.title       := btrim(new.title);
  new.author_name := btrim(new.author_name);
  new.synopsis    := btrim(coalesce(new.synopsis, ''));
  return new;
end $$;

drop trigger if exists works_guard on public.works;
create trigger works_guard before insert or update on public.works
  for each row execute function public.works_guard();

create or replace function public.chapters_guard() returns trigger
language plpgsql set search_path = '' as $$
declare
  v_author uuid;
  v_prefix text;
  p text;
begin
  select author_id into v_author from public.works where id = new.work_id;
  if v_author is null then
    raise exception 'obra inexistente' using errcode = '23503';
  end if;

  if tg_op = 'INSERT' then
    if auth.uid() is not null and v_author <> auth.uid() then
      raise exception 'você não é o autor desta obra' using errcode = '42501';
    end if;
    if (select count(*) from public.chapters where work_id = new.work_id) >= 300 then
      raise exception 'limite de capítulos atingido' using errcode = '54000';
    end if;
    -- páginas só podem apontar para <autor>/<obra>/<capítulo>/NNN.ext
    v_prefix := v_author::text || '/' || new.work_id::text || '/' || new.id::text || '/';
    foreach p in array new.pages loop
      if left(p, length(v_prefix)) <> v_prefix
         or substr(p, length(v_prefix) + 1) !~ '^[0-9]{3}\.(jpg|png|webp)$' then
        raise exception 'caminho de página inválido' using errcode = '22023';
      end if;
    end loop;
    new.created_at := now();
  else
    if new.id <> old.id or new.work_id <> old.work_id or new.idx <> old.idx
       or new.pages is distinct from old.pages or new.created_at <> old.created_at then
      raise exception 'campos imutáveis do capítulo' using errcode = '42501';
    end if;
  end if;
  new.title := btrim(new.title);
  return new;
end $$;

drop trigger if exists chapters_guard on public.chapters;
create trigger chapters_guard before insert or update on public.chapters
  for each row execute function public.chapters_guard();

-- novo capítulo "sobe" a obra na lista (roda como dono: o autor não pode alterar updated_at)
create or replace function public.chapters_touch_work() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.works set updated_at = now() where id = new.work_id;
  return null;
end $$;

drop trigger if exists chapters_touch_work on public.chapters;
create trigger chapters_touch_work after insert on public.chapters
  for each row execute function public.chapters_touch_work();

-- leituras: data do servidor (não falsificável) e autor não conta como leitor
create or replace function public.reads_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from public.works w where w.id = new.work_id and w.author_id = new.user_id) then
    return null;  -- ignora silenciosamente
  end if;
  new.created_at := now();
  return new;
end $$;

drop trigger if exists reads_guard on public.reads;
create trigger reads_guard before insert on public.reads
  for each row execute function public.reads_guard();

revoke execute on function public.works_guard(), public.chapters_guard(),
  public.chapters_touch_work(), public.reads_guard() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. Políticas RLS: reforço (with check também no UPDATE de capítulos)
-- ---------------------------------------------------------------------
drop policy if exists chapters_update_own on public.chapters;
create policy chapters_update_own on public.chapters for update to authenticated
  using (exists (select 1 from public.works w where w.id = chapters.work_id and w.author_id = (select auth.uid())))
  with check (exists (select 1 from public.works w where w.id = chapters.work_id and w.author_id = (select auth.uid())));

-- ---------------------------------------------------------------------
-- 5. Publicação atômica no banco (obra + capítulo na mesma transação)
--    SECURITY INVOKER: RLS e gatilhos continuam valendo para quem chama.
-- ---------------------------------------------------------------------
create or replace function public.publish_work(
  p_id uuid, p_title text, p_genre text, p_age text, p_mode text, p_synopsis text,
  p_author_name text, p_cover_path text, p_chapter_id uuid, p_chapter_title text, p_pages text[]
) returns uuid
language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'não autenticado' using errcode = '42501';
  end if;
  insert into public.works (id, author_id, author_name, title, genre, age, mode, synopsis, cover_path)
  values (p_id, auth.uid(), p_author_name, p_title, p_genre, p_age, p_mode, coalesce(p_synopsis, ''), p_cover_path);
  insert into public.chapters (id, work_id, idx, title, pages)
  values (p_chapter_id, p_id, 0, p_chapter_title, p_pages);
  return p_id;
end $$;

create or replace function public.publish_chapter(
  p_work_id uuid, p_chapter_id uuid, p_title text, p_pages text[]
) returns integer
language plpgsql security invoker set search_path = '' as $$
declare v_idx integer;
begin
  if auth.uid() is null then
    raise exception 'não autenticado' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_work_id::text, 0));  -- evita idx duplicado
  select coalesce(max(idx) + 1, 0) into v_idx from public.chapters where work_id = p_work_id;
  insert into public.chapters (id, work_id, idx, title, pages)
  values (p_chapter_id, p_work_id, v_idx, p_title, p_pages);
  return v_idx;
end $$;

revoke execute on function public.publish_work(uuid,text,text,text,text,text,text,text,uuid,text,text[]) from public, anon;
revoke execute on function public.publish_chapter(uuid,uuid,text,text[]) from public, anon;
grant  execute on function public.publish_work(uuid,text,text,text,text,text,text,text,uuid,text,text[]) to authenticated;
grant  execute on function public.publish_chapter(uuid,uuid,text,text[]) to authenticated;

-- ---------------------------------------------------------------------
-- 6. Storage (bucket "oboro"): leitura pública, escrita somente do dono
--    Não há política de UPDATE => ninguém sobrescreve arquivos existentes.
--    DELETE continua restrito à pasta do próprio usuário (auth.uid()).
-- ---------------------------------------------------------------------
update storage.buckets
   set public = true,
       file_size_limit = 2097152,                                   -- 2 MB por imagem
       allowed_mime_types = array['image/jpeg','image/png','image/webp']
 where id = 'oboro';

drop policy if exists oboro_upload_own on storage.objects;
create policy oboro_upload_own on storage.objects for insert to authenticated
with check (
  bucket_id = 'oboro'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  -- formato exato: <uid>/<obra>/cover.ext  ou  <uid>/<obra>/<capítulo>/NNN.ext
  and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/(cover\.(jpg|png|webp)|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9]{3}\.(jpg|png|webp))$'
  -- a obra (se já existir) precisa ser do usuário
  and not exists (
    select 1 from public.works w
    where w.id::text = (storage.foldername(name))[2] and w.author_id <> (select auth.uid()))
  -- teto de arquivos por usuário (evita encher o bucket sem publicar)
  and (select count(*) from storage.objects o
        where o.bucket_id = 'oboro' and o.name like (select auth.uid())::text || '/%') < 3000
);

commit;
