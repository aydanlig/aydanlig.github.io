# Datenbank für Auktion & Forum (Supabase)

Für `labor/auktion.html` und `labor/forum.html`. Nutzt **dasselbe Supabase-Projekt wie das Board**
– du brauchst kein neues Projekt und keine neuen Schlüssel.

Bis du das hier erledigt hast, zeigen beide Seiten nur „startet bald“.

---

## 1. Tabellen anlegen (einmalig, ~2 Minuten)

Supabase → **SQL Editor** → **New query** → alles unten einfügen → **Run**.
Erwartet: „Success. No rows returned“.

```sql
-- =========================================================
-- AUKTION
-- =========================================================
create table public.auction_lots (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) <= 120),
  description text check (char_length(description) <= 1000),
  image_url text,
  start_price numeric(10,2) not null check (start_price >= 0),
  min_increment numeric(10,2) not null default 5 check (min_increment > 0),
  ends_at timestamptz not null,
  current_bid numeric(10,2),
  current_bidder text,
  bid_count integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Gebote mit E-Mail: NIEMAND kann sie über die Website lesen (keine Policy = kein Zugriff)
create table public.auction_bids (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.auction_lots(id) on delete cascade,
  bidder_name text not null,
  bidder_email text not null,
  amount numeric(10,2) not null,
  created_at timestamptz not null default now()
);

alter table public.auction_lots enable row level security;
alter table public.auction_bids enable row level security;

create policy "read active lots" on public.auction_lots
  for select to anon using (active = true);

-- Bieten nur über diese Funktion: prüft Mindestgebot + Laufzeit auf dem Server,
-- verlängert bei Geboten in den letzten 2 Minuten um 2 Minuten (kein "Sniping")
create or replace function public.place_bid(p_lot uuid, p_name text, p_email text, p_amount numeric)
returns json language plpgsql security definer set search_path = public as $$
declare
  lot public.auction_lots;
  needed numeric;
begin
  if p_name is null or char_length(trim(p_name)) = 0 or char_length(p_name) > 40 then
    return json_build_object('ok', false, 'message', 'Bitte gib einen Vornamen an (max. 40 Zeichen).');
  end if;
  if p_email is null or p_email !~ '^[^@ ]+@[^@ ]+\.[^@ ]+$' then
    return json_build_object('ok', false, 'message', 'Bitte gib eine gültige E-Mail-Adresse an.');
  end if;

  select * into lot from public.auction_lots where id = p_lot and active = true for update;
  if not found then
    return json_build_object('ok', false, 'message', 'Diese Auktion gibt es nicht (mehr).');
  end if;
  if now() >= lot.ends_at then
    return json_build_object('ok', false, 'message', 'Diese Auktion ist bereits beendet.');
  end if;

  needed := coalesce(lot.current_bid + lot.min_increment, lot.start_price);
  if p_amount is null or p_amount < needed then
    return json_build_object('ok', false, 'message',
      'Das Gebot muss mindestens ' || to_char(needed, 'FM999999990.00') || ' € betragen.');
  end if;

  insert into public.auction_bids(lot_id, bidder_name, bidder_email, amount)
    values (p_lot, trim(p_name), lower(trim(p_email)), p_amount);

  update public.auction_lots set
    current_bid = p_amount,
    current_bidder = trim(p_name),
    bid_count = bid_count + 1,
    ends_at = case when ends_at - now() < interval '2 minutes' then now() + interval '2 minutes' else ends_at end
  where id = p_lot;

  return json_build_object('ok', true);
end; $$;
revoke all on function public.place_bid(uuid, text, text, numeric) from public;
grant execute on function public.place_bid(uuid, text, text, numeric) to anon;

-- Öffentliche Gebotshistorie: nur Vorname, Betrag, Zeit – NIE die E-Mail
create or replace function public.get_bids(p_lot uuid)
returns table(bidder_name text, amount numeric, created_at timestamptz)
language sql security definer set search_path = public as $$
  select b.bidder_name, b.amount, b.created_at
  from public.auction_bids b
  join public.auction_lots l on l.id = b.lot_id and l.active = true
  where b.lot_id = p_lot
  order by b.amount desc
  limit 10;
$$;
revoke all on function public.get_bids(uuid) from public;
grant execute on function public.get_bids(uuid) to anon;

-- =========================================================
-- FORUM
-- =========================================================
create table public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  category text not null check (char_length(category) <= 40),
  title text not null check (char_length(title) between 3 and 120),
  body text not null check (char_length(body) between 1 and 4000),
  author text not null check (char_length(author) between 1 and 40),
  comment_count integer not null default 0,
  reports integer not null default 0,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  last_activity timestamptz not null default now()
);

create table public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  author text not null check (char_length(author) between 1 and 40),
  reports integer not null default 0,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.forum_threads enable row level security;
alter table public.forum_comments enable row level security;

create policy "read visible threads" on public.forum_threads
  for select to anon using (hidden = false);
create policy "create threads" on public.forum_threads
  for insert to anon with check (hidden = false and reports = 0 and comment_count = 0);
create policy "read visible comments" on public.forum_comments
  for select to anon using (hidden = false);
create policy "create comments" on public.forum_comments
  for insert to anon with check (hidden = false and reports = 0);

-- Schutz: Zeitstempel & Zähler setzt immer die Datenbank (niemand kann Beiträge "nach oben pinnen"),
-- Flut-Bremse (max. 5 neue Themen / 20 Kommentare pro Minute insgesamt),
-- reservierte Namen (niemand kann sich als Aydan ausgeben)
create or replace function public.forum_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare recent integer;
begin
  if new.author ~* '(aydan|smiley ?foxy|admin|moderator)' then
    raise exception 'Dieser Name ist reserviert. Bitte wähle einen anderen.';
  end if;
  new.created_at := now();
  new.reports := 0;
  new.hidden := false;
  if tg_table_name = 'forum_threads' then
    new.last_activity := now();
    new.comment_count := 0;
    select count(*) into recent from public.forum_threads where created_at > now() - interval '1 minute';
    if recent >= 5 then raise exception 'Gerade ist viel los – bitte versuch es in einer Minute noch einmal.'; end if;
  else
    select count(*) into recent from public.forum_comments where created_at > now() - interval '1 minute';
    if recent >= 20 then raise exception 'Gerade ist viel los – bitte versuch es in einer Minute noch einmal.'; end if;
  end if;
  return new;
end; $$;
create trigger forum_threads_guard before insert on public.forum_threads
  for each row execute function public.forum_guard();
create trigger forum_comments_guard before insert on public.forum_comments
  for each row execute function public.forum_guard();

-- Kommentarzähler + "zuletzt aktiv" automatisch aktualisieren
create or replace function public.forum_after_comment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.forum_threads
    set comment_count = comment_count + 1, last_activity = now()
    where id = new.thread_id;
  return new;
end; $$;
create trigger forum_comment_added after insert on public.forum_comments
  for each row execute function public.forum_after_comment();

-- Melden: nach 3 Meldungen automatisch ausblenden
create or replace function public.report_content(p_kind text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_kind = 'thread' then
    update public.forum_threads set reports = reports + 1, hidden = hidden or (reports + 1 >= 3) where id = p_id;
  elsif p_kind = 'comment' then
    update public.forum_comments set reports = reports + 1, hidden = hidden or (reports + 1 >= 3) where id = p_id;
  end if;
end; $$;
revoke all on function public.report_content(text, uuid) from public;
grant execute on function public.report_content(text, uuid) to anon;
```

## 1b. Erste Auktion: rote Marker-Skizze (fertig vorbereitet)

Direkt nach Schritt 1 im SQL Editor ausführen. Startpreis und Mindestschritt kannst du vorher ändern.
Ende: **31.12.2026, 20:00 Uhr** (Berliner Zeit).

```sql
insert into public.auction_lots (title, description, image_url, start_price, min_increment, ends_at)
values (
  'Rote Skizze in 15 Minuten – Original',
  'Original-Zeichnung mit rotem Marker im Skizzenbuch, live in 15 Minuten gezeichnet. Ca. A5, signiert. Versteigert wird das Original (nicht das Foto).',
  'https://smileyfoxyportraits.com/img/auktion/rote-skizze-15-minuten.jpg',
  25,
  5,
  '2026-12-31 20:00:00+01'
);
```

## 1c. Kontaktdaten beim Bieten (schon eingerichtet am 23.10.2026)

Bieter:innen hinterlassen E-Mail **oder** Telefon **oder** Lieferadresse + Klingelname (mind. eins).
Die SQL dafür liegt nur lokal; die Funktion `place_bid` hat jetzt 7 Parameter.

## 2. Eine Auktion starten

Supabase → **Table Editor** → `auction_lots` → **Insert row**:

| Feld | Beispiel |
|---|---|
| title | Berlin bei Nacht – Aquarell A3 (Original) |
| description | Aquarell & Fineliner auf 300 g Papier, signiert |
| image_url | `https://smileyfoxyportraits.com/img/berlin-nacht.jpg` (Bild vorher in `img/` hochladen) |
| start_price | 40 |
| min_increment | 5 |
| ends_at | z. B. `2026-11-30 20:00:00+01` (Ende mit Zeitzone!) |

Alles andere leer lassen. Sofort sichtbar auf `labor/auktion.html`.

**Nach dem Ende:** Gewinner:in finden – SQL Editor:

```sql
select l.title, b.bidder_name, b.bidder_email, b.bidder_phone, b.bidder_address, b.bidder_doorbell, b.amount, b.created_at
from auction_bids b join auction_lots l on l.id = b.lot_id
where l.title = 'TITEL DES KUNSTWERKS'
order by b.amount desc limit 1;
```
Per E-Mail Zahlung (PayPal/Überweisung) und Versand klären. Danach beim Los `active` auf `false` setzen.

## 3. Forum moderieren

- Neue Themen/Kommentare erscheinen sofort.
- **Ausgeblendetes** (3× gemeldet): Table Editor → `hidden = true` → prüfen → löschen oder `hidden` wieder auf `false`.
- Etwas sofort entfernen: Zeile löschen (Kommentare eines Themas werden mitgelöscht).
- Rechtlich: Du musst gemeldete rechtswidrige Inhalte **zügig** entfernen (Digital Services Act).
  Schau am besten 1–2× pro Woche rein.

## Gut zu wissen

- Kein Login nötig. Eingebauter Schutz: Flut-Bremse in der Datenbank, unsichtbare Spam-Falle und
  Wartezeit zwischen Beiträgen im Browser, reservierte Namen (Aydan, SmileyFoxy, Admin, Moderator).
  Wird es trotzdem zu viel: sag Claude Bescheid, dann kommt ein Captcha oder Login dazu.
- Gebote sind **verbindlich**. Für Privatkäufer gilt trotzdem das 14-tägige Widerrufsrecht
  (Online-Auktionen sind keine „öffentliche Versteigerung“ im Sinne des Gesetzes).
