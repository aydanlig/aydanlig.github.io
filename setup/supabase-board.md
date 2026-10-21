# Setting up the free board database (Supabase)

The "Advice and ideas board" on `/support-free/` stores posts in **Supabase**, a free hosted database.
You don't need your own computer or server. Takes about 10 minutes.

Until you finish this, the board still works: every post is **emailed** to you, but nothing shows on the page.

---

## 1. Create a free Supabase project

1. Go to <https://supabase.com> → **Start your project** → sign up (GitHub login is easiest).
2. **New project**:
   - Name: `smileyfoxy-board`
   - Database password: generate one and save it in your password manager (you rarely need it)
   - **Region: Central EU (Frankfurt)** ← important for German data protection
   - Plan: **Free**
3. Wait ~2 minutes until the project is ready.

## 2. Create the table (copy & paste)

1. Left menu → **SQL Editor** → **New query**.
2. Paste everything below and click **Run**:

```sql
-- Table for board posts
create table public.board_posts (
  id uuid primary key default gen_random_uuid(),
  board text not null default 'support-free',
  alias text not null default 'Anonymous' check (char_length(alias) <= 40),
  message text not null check (char_length(message) between 1 and 600),
  image_data text check (image_data is null or char_length(image_data) <= 400000),
  upvotes integer not null default 0,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Security: visitors may only do exactly what the website needs
alter table public.board_posts enable row level security;

-- Everyone can READ posts, but only approved ones
create policy "read approved posts" on public.board_posts
  for select to anon using (approved = true);

-- Everyone can SEND a post, but it always starts hidden (approved = false)
create policy "send posts (hidden until approved)" on public.board_posts
  for insert to anon with check (approved = false and upvotes = 0);

-- Upvotes only through this function (+1 on approved posts, nothing else)
create or replace function public.upvote_post(post_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.board_posts set upvotes = upvotes + 1
  where id = post_id and approved = true;
$$;
revoke all on function public.upvote_post(uuid) from public;
grant execute on function public.upvote_post(uuid) to anon;
```

You should see "Success. No rows returned".

## 3. Connect the website

1. Left menu → **Project Settings** → **API** (or **API Keys**).
2. Copy:
   - **Project URL** (looks like `https://abcd1234.supabase.co`)
   - The **public** key: called **anon / public** or **publishable**.
     ⚠️ Never use the **service_role** / **secret** key on the website.
3. Open `support-free/index.html`, find `data-supabase-url=""` and `data-supabase-key=""` and paste them between the quotes:

```html
<section class="community-board" data-community-board="support-free"
	data-supabase-url="https://abcd1234.supabase.co"
	data-supabase-key="your-public-key"
	data-notify-email="aydan@smileyfoxyportraits.com">
```

4. Commit & push. Done. (The public key is meant to be visible; the security rules from step 2 protect the data.)

## 4. Approving posts (your daily routine)

1. You get an email "New board post … waiting for approval".
2. Supabase → **Table Editor** → `board_posts`.
3. Tick **approved** on the post → it appears on the website.
   Spam or nasty stuff: right-click the row → **Delete row**.

## Good to know

- **Free plan limits:** 500 MB database (thousands of posts). Images are shrunk to ~100 KB each.
- **Pausing:** free projects get paused after about a week without any activity. If that
  happens, Supabase emails you and you click **Restore** in the dashboard. Regular visits
  to the board keep it awake.
- **First email:** the very first board post may trigger an activation email from
  formsubmit.co ("Confirm your email"). Click it once; after that, notifications arrive normally.
- **Privacy policy:** Supabase is already listed in the Datenschutzerklärung.
