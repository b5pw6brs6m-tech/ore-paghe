-- =====================================================================
--  Ore & Paghe — struttura del database
--  Copia TUTTO questo file e incollalo nel "SQL Editor" di Supabase,
--  poi premi Run. Si può rieseguire senza rompere nulla.
-- =====================================================================

-- ---------------------------------------------------------------- 1. Tabelle

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null default '',
  role       text not null default 'worker' check (role in ('admin', 'worker')),
  created_at timestamptz not null default now()
);

create table if not exists public.workers (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid not null references auth.users(id) on delete cascade,
  user_id     uuid unique references auth.users(id) on delete set null,
  name        text not null check (length(btrim(name)) > 0),
  hourly_rate numeric(10,2) not null default 0 check (hourly_rate >= 0),
  link_code   text not null default encode(gen_random_bytes(8), 'hex'),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists workers_admin_idx on public.workers(admin_id);
create index if not exists workers_user_idx  on public.workers(user_id);

create table if not exists public.work_entries (
  id            uuid primary key default gen_random_uuid(),
  worker_id     uuid not null references public.workers(id) on delete cascade,
  work_date     date not null,
  start_time    time,
  end_time      time,
  break_minutes int not null default 0 check (break_minutes >= 0),
  hours         numeric(6,2) not null check (hours > 0 and hours <= 24),
  hourly_rate   numeric(10,2) not null default 0,   -- riempita dal trigger
  note          text,
  created_by    uuid not null default auth.uid() references auth.users(id),
  created_at    timestamptz not null default now()
);
create index if not exists entries_worker_idx on public.work_entries(worker_id, work_date desc);

create table if not exists public.payments (
  id         uuid primary key default gen_random_uuid(),
  worker_id  uuid not null references public.workers(id) on delete cascade,
  paid_on    date not null default current_date,
  amount     numeric(10,2) not null check (amount > 0),
  method     text,
  note       text,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists payments_worker_idx on public.payments(worker_id, paid_on desc);

-- ------------------------------------------------- 2. Tariffa "congelata"
-- La paga di una giornata resta quella del momento in cui è stata registrata:
-- se domani alzi la tariffa, le giornate passate non cambiano valore.

create or replace function public.congela_tariffa()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select hourly_rate into new.hourly_rate from public.workers where id = new.worker_id;
  return new;
end $$;

drop trigger if exists trg_congela_tariffa on public.work_entries;
create trigger trg_congela_tariffa
before insert on public.work_entries
for each row execute function public.congela_tariffa();

-- ---------------------------------------- 3. Chi può creare un account
-- La registrazione pubblica è CHIUSA. Si entra solo in due modi:
--   - il titolare: uno solo, il primo che si è registrato;
--   - il lavoratore: con il codice segreto che gli genera il titolare.
-- Ogni altro tentativo viene rifiutato qui, non solo nella schermata.
--
-- Se un giorno serve creare un utente a mano dalla dashboard, si sospende
-- il controllo e poi lo si riattiva:
--   alter table auth.users disable trigger on_auth_user_created;
--   ...crea l'utente...
--   alter table auth.users enable  trigger on_auth_user_created;

create or replace function public.gestisci_nuovo_utente()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta      jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  ruolo     text  := coalesce(meta->>'role', 'worker');
  wid       uuid;
  collegati int;
begin
  -- ------------------------------------------------------------ titolare
  -- Ce n'è uno solo: il primo che si registra. Dopo di lui la registrazione
  -- è chiusa, così nessuno può crearsi un account da titolare.
  if ruolo = 'admin' then
    if exists (select 1 from public.profiles where role = 'admin') then
      raise exception 'REGISTRAZIONE_CHIUSA' using errcode = 'P0001';
    end if;

    insert into public.profiles (id, full_name, role)
    values (new.id, coalesce(meta->>'full_name', ''), 'admin')
    on conflict (id) do nothing;
    return new;
  end if;

  -- ---------------------------------------------------------- lavoratore
  -- Un lavoratore non si registra da solo: il suo accesso lo crea il
  -- titolare, e la registrazione porta con sé il codice segreto della sua
  -- scheda. Senza quel codice non si entra.
  if not (meta ? 'worker_id') or not (meta ? 'link_code') then
    raise exception 'REGISTRAZIONE_CHIUSA' using errcode = 'P0001';
  end if;

  begin
    wid := (meta->>'worker_id')::uuid;
  exception when others then
    raise exception 'REGISTRAZIONE_CHIUSA' using errcode = 'P0001';
  end;

  update public.workers
     set user_id = new.id
   where id = wid
     and link_code = (meta->>'link_code')
     and user_id is null;

  get diagnostics collegati = row_count;
  if collegati = 0 then
    raise exception 'REGISTRAZIONE_CHIUSA' using errcode = 'P0001';
  end if;

  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(meta->>'full_name', ''), 'worker')
  on conflict (id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.gestisci_nuovo_utente();

-- ------------------------------------------------- 4. Chi può vedere cosa
-- Funzioni di appoggio in SECURITY DEFINER: evitano che i controlli di
-- accesso si richiamino a vicenda all'infinito.

create or replace function public.puo_vedere_worker(w uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workers
    where id = w and (admin_id = auth.uid() or user_id = auth.uid())
  )
$$;

create or replace function public.e_admin_di(w uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workers where id = w and admin_id = auth.uid())
$$;

-- "Oggi" secondo il fuso italiano: il database gira in UTC e vicino a mezzanotte
-- darebbe la data sbagliata.
create or replace function public.oggi()
returns date language sql stable as $$
  select (now() at time zone 'Europe/Rome')::date
$$;

create or replace function public.e_lavoratore_di(w uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workers where id = w and user_id = auth.uid())
$$;

-- --------------------------------------------------------------- 5. Regole

alter table public.profiles     enable row level security;
alter table public.workers      enable row level security;
alter table public.work_entries enable row level security;
alter table public.payments     enable row level security;

drop policy if exists "profilo: leggo il mio"    on public.profiles;
drop policy if exists "profilo: modifico il mio" on public.profiles;
create policy "profilo: leggo il mio"    on public.profiles for select using (id = auth.uid());
create policy "profilo: modifico il mio" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "lavoratori: lettura"    on public.workers;
drop policy if exists "lavoratori: inserisco"  on public.workers;
drop policy if exists "lavoratori: modifico"   on public.workers;
drop policy if exists "lavoratori: elimino"    on public.workers;
create policy "lavoratori: lettura"   on public.workers for select using (admin_id = auth.uid() or user_id = auth.uid());
create policy "lavoratori: inserisco" on public.workers for insert with check (admin_id = auth.uid());
create policy "lavoratori: modifico"  on public.workers for update using (admin_id = auth.uid()) with check (admin_id = auth.uid());
create policy "lavoratori: elimino"   on public.workers for delete using (admin_id = auth.uid());

drop policy if exists "ore: lettura"                    on public.work_entries;
drop policy if exists "ore: registro le mie"            on public.work_entries;
drop policy if exists "ore: il lavoratore registra oggi" on public.work_entries;
drop policy if exists "ore: correggo entro 24 ore"      on public.work_entries;
drop policy if exists "ore: il titolare corregge"       on public.work_entries;
drop policy if exists "ore: il titolare elimina"        on public.work_entries;
create policy "ore: lettura" on public.work_entries for select using (public.puo_vedere_worker(worker_id));
-- Il lavoratore registra SOLO la giornata di oggi: niente giorni passati, niente futuri.
-- È il suo obbligo di fine giornata. Il titolare invece può inserire qualsiasi data,
-- per rimediare a una giornata dimenticata.
create policy "ore: il lavoratore registra oggi" on public.work_entries for insert
  with check (
    (public.e_lavoratore_di(worker_id) and work_date = public.oggi())
    or public.e_admin_di(worker_id)
  );
-- Il lavoratore può cancellare solo un errore appena fatto (24 ore), non riscrivere il passato.
create policy "ore: correggo entro 24 ore" on public.work_entries for delete
  using (public.e_lavoratore_di(worker_id) and created_at > now() - interval '24 hours');
create policy "ore: il titolare corregge" on public.work_entries for update
  using (public.e_admin_di(worker_id)) with check (public.e_admin_di(worker_id));
create policy "ore: il titolare elimina"  on public.work_entries for delete using (public.e_admin_di(worker_id));

drop policy if exists "pagamenti: lettura"   on public.payments;
drop policy if exists "pagamenti: registro"  on public.payments;
drop policy if exists "pagamenti: modifico"  on public.payments;
drop policy if exists "pagamenti: elimino"   on public.payments;
-- Il lavoratore li vede ma non li scrive: i pagamenti li registra solo il titolare.
create policy "pagamenti: lettura"  on public.payments for select using (public.puo_vedere_worker(worker_id));
create policy "pagamenti: registro" on public.payments for insert with check (public.e_admin_di(worker_id));
create policy "pagamenti: modifico" on public.payments for update using (public.e_admin_di(worker_id)) with check (public.e_admin_di(worker_id));
create policy "pagamenti: elimino"  on public.payments for delete using (public.e_admin_di(worker_id));

-- ------------------------------------------------- 6. Aggiornamento in diretta

do $$
begin
  begin execute 'alter publication supabase_realtime add table public.work_entries'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.payments';     exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.workers';      exception when duplicate_object then null; end;
end $$;

-- Fine. Se non compaiono errori rossi, il database è pronto.
