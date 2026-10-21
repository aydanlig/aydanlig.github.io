/* =========================================================
   forum.js – Urban-Artist-Forum (labor/forum.html)

   HOW IT WORKS:
   - Threads and comments are stored in Supabase ("forum_threads",
     "forum_comments", see setup/supabase-labor.md).
   - Posts appear immediately (it's a conversation). Protection:
     * profanity filter + reserved names (Aydan, SmileyFoxy, Admin …)
     * invisible spam trap for bots + 30 s wait between posts
     * the database itself limits how many posts per minute are possible
     * "Melden" (report) on everything – 3 reports hide a post automatically
   - You can delete posts any time in the Supabase Table Editor.

   SETTINGS on <section data-forum ...>:
     data-supabase-url, data-supabase-key
   ========================================================= */
(function () {
	'use strict';

	var CATEGORIES = ['Spots & Genehmigungen', 'Material & Technik', 'Kooperationen', 'Events & Märkte', 'Feedback zu Arbeiten', 'Off-Topic'];
	var PROFANITY = ['fuck', 'shit', 'bitch', 'asshole', 'cunt', 'nigger', 'faggot', 'whore', 'hurensohn', 'fotze', 'wichser', 'missgeburt', 'schlampe'];
	var RESERVED = /(aydan|smiley ?foxy|admin|moderator)/i;   // same rule as in the database
	var COOLDOWN_SECONDS = 30;
	var PREVIEW_CHARS = 400;                                     // longer posts get "weiterlesen"

	function escapeHtml(text) {
		return String(text)
			.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
	}

	function hasProfanity(text) {
		var lower = String(text || '').toLowerCase();
		return PROFANITY.some(function (w) { return lower.indexOf(w) !== -1; });
	}

	function when(ts) {
		return new Date(ts).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

	function headers(key, extra) {
		var h = { apikey: key, 'Content-Type': 'application/json' };
		if (key.indexOf('eyJ') === 0) h.Authorization = 'Bearer ' + key;
		for (var k in (extra || {})) h[k] = extra[k];
		return h;
	}

	// Remember things in this browser only (cooldown, own reports)
	function store(name, value) { try { localStorage.setItem(name, JSON.stringify(value)); } catch (e) { } }
	function load(name, fallback) { try { var v = localStorage.getItem(name); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } }

	function secondsUntilAllowed() {
		var last = load('forum-last-post', 0);
		return Math.max(0, Math.ceil(COOLDOWN_SECONDS - (Date.now() - last) / 1000));
	}

	// Checks shared by "new thread" and "reply"; returns an error text or ""
	function validate(author, texts, honeypot) {
		if (honeypot) return 'Fehler beim Senden.';                    // bots fill the hidden field
		if (RESERVED.test(author)) return 'Dieser Name ist reserviert. Bitte wähle einen anderen.';
		if ([author].concat(texts).some(hasProfanity)) return 'Bitte ohne Beleidigungen.';
		var wait = secondsUntilAllowed();
		if (wait > 0) return 'Bitte warte noch ' + wait + ' Sekunden, bevor du wieder postest.';
		return '';
	}

	function mount(section) {
		var url = (section.getAttribute('data-supabase-url') || '').replace(/\/+$/, '');
		var key = section.getAttribute('data-supabase-key') || '';
		var list = section.querySelector('[data-threads]');
		var bar = section.querySelector('[data-categories]');
		var newForm = section.querySelector('[data-new-thread]');
		var status = section.querySelector('[data-forum-status]');
		var current = 'Alle';

		function closed(text) {
			list.innerHTML = '<p class="community-empty">' + text + '</p>';
			if (newForm) newForm.closest('.community-board').hidden = true;
			if (bar) bar.hidden = true;
		}

		if (!url || !key) { closed('Das Forum öffnet bald.'); return; }

		// Category filter + category select for new threads
		bar.innerHTML = ['Alle'].concat(CATEGORIES).map(function (c) {
			return '<button type="button" data-cat="' + escapeHtml(c) + '" aria-pressed="' + (c === 'Alle') + '"' +
				(c === 'Alle' ? ' class="active"' : '') + '>' + escapeHtml(c) + '</button>';
		}).join('');
		newForm.elements.category.innerHTML = CATEGORIES.map(function (c) { return '<option>' + escapeHtml(c) + '</option>'; }).join('');

		bar.addEventListener('click', function (e) {
			var b = e.target.closest('[data-cat]');
			if (!b) return;
			current = b.getAttribute('data-cat');
			bar.querySelectorAll('button').forEach(function (x) {
				x.classList.toggle('active', x === b);
				x.setAttribute('aria-pressed', x === b);
			});
			loadThreads();
		});

		// Talk to Supabase; errors carry the database's message (e.g. "Dieser Name ist reserviert")
		async function api(path, options) {
			var res = await fetch(url + '/rest/v1/' + path, options || { headers: headers(key) });
			if (!res.ok) {
				var msg = '';
				try { msg = (await res.json()).message || ''; } catch (e) { }
				var err = new Error(msg); err.status = res.status; throw err;
			}
			return (res.status === 204 || res.status === 201) ? null : res.json();
		}

		function friendly(err) {
			if (err.message && !/^\d+$/.test(err.message) && err.message.length < 140 && !/violates|constraint|policy/i.test(err.message)) return err.message;
			return 'Das hat nicht geklappt. Bitte prüfe deine Eingaben und versuch es noch einmal.';
		}

		function bodyHtml(text) {
			if (text.length <= PREVIEW_CHARS) return '<div class="thread-body">' + escapeHtml(text) + '</div>';
			return '<div class="thread-body">' + escapeHtml(text.slice(0, PREVIEW_CHARS)) + '<span data-more hidden>' +
				escapeHtml(text.slice(PREVIEW_CHARS)) + '</span><span data-dots>…</span></div>' +
				'<button class="link-btn" type="button" data-expand>weiterlesen</button>';
		}

		function threadHtml(t) {
			return '<article class="thread" data-thread="' + escapeHtml(t.id) + '" data-count="' + t.comment_count + '">' +
				'<div class="thread-meta"><span class="cat-chip">' + escapeHtml(t.category) + '</span>' +
				'<span>' + escapeHtml(t.author) + ' · ' + when(t.created_at) + '</span></div>' +
				'<h3>' + escapeHtml(t.title) + '</h3>' + bodyHtml(t.body) +
				'<div class="thread-actions">' +
				'<button class="link-btn" type="button" data-open aria-expanded="false">💬 ' + plural(t.comment_count, 'Kommentar', 'Kommentare') + ' · antworten</button>' +
				'<button class="link-btn" type="button" data-report="thread" data-id="' + escapeHtml(t.id) + '">Melden</button>' +
				'</div><div data-comments hidden></div></article>';
		}

		async function loadThreads() {
			var filter = current === 'Alle' ? '' : '&category=eq.' + encodeURIComponent(current);
			try {
				var threads = await api('forum_threads?select=*&order=last_activity.desc&limit=50' + filter);
				list.innerHTML = threads.length
					? threads.map(threadHtml).join('')
					: '<p class="community-empty">Noch keine Themen hier. Starte das erste!</p>';
			} catch (e) {
				if (e.status === 404) { closed('Das Forum öffnet bald.'); return; }   // tables not set up yet
				list.innerHTML = '<p class="community-empty">Das Forum konnte gerade nicht geladen werden.</p>';
			}
		}

		async function openThread(article) {
			var box = article.querySelector('[data-comments]');
			var id = article.getAttribute('data-thread');
			box.hidden = false;
			article.querySelector('[data-open]').setAttribute('aria-expanded', 'true');
			box.innerHTML = '<p class="hint">Lädt …</p>';
			try {
				var comments = await api('forum_comments?select=*&thread_id=eq.' + id + '&order=created_at.asc');
				box.innerHTML = '<div class="comments">' +
					(comments.length ? comments.map(function (c) {
						return '<div class="comment"><div class="thread-meta"><span>' + escapeHtml(c.author) + ' · ' + when(c.created_at) + '</span>' +
							'<button class="link-btn" type="button" data-report="comment" data-id="' + escapeHtml(c.id) + '">Melden</button></div>' +
							'<div class="comment-body">' + escapeHtml(c.body) + '</div></div>';
					}).join('') : '<p class="hint">Noch keine Kommentare – schreib den ersten.</p>') +
					'<form class="comment-form" data-reply="' + escapeHtml(id) + '">' +
					'<input name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">' +
					'<input name="author" maxlength="40" placeholder="Name oder Künstlername" aria-label="Name oder Künstlername" required>' +
					'<textarea name="body" maxlength="2000" placeholder="Deine Antwort …" aria-label="Deine Antwort" required></textarea>' +
					'<button class="btn btn--small" type="submit">Antworten</button>' +
					'<p class="community-status" aria-live="polite"></p></form></div>';
			} catch (e) {
				box.innerHTML = '<p class="hint">Kommentare konnten nicht geladen werden.</p>';
			}
		}

		list.addEventListener('click', async function (e) {
			var more = e.target.closest('[data-expand]');
			if (more) {
				var body = more.previousElementSibling;
				body.querySelector('[data-more]').hidden = false;
				body.querySelector('[data-dots]').hidden = true;
				more.remove();
				return;
			}
			var open = e.target.closest('[data-open]');
			if (open) { openThread(open.closest('.thread')); return; }
			var rep = e.target.closest('[data-report]');
			if (rep) {
				var id = rep.getAttribute('data-id');
				var reported = load('forum-reported', []);
				if (reported.indexOf(id) !== -1) { rep.textContent = 'Bereits gemeldet'; return; }
				if (!confirm('Diesen Beitrag melden? Nach 3 Meldungen wird er automatisch ausgeblendet und von Aydan geprüft.')) return;
				try {
					await api('rpc/report_content', { method: 'POST', headers: headers(key), body: JSON.stringify({ p_kind: rep.getAttribute('data-report'), p_id: id }) });
					reported.push(id); store('forum-reported', reported);
					rep.textContent = 'Gemeldet – danke!';
				} catch (err) { rep.textContent = 'Melden fehlgeschlagen'; }
			}
		});

		// Reply to a thread
		list.addEventListener('submit', async function (e) {
			var form = e.target.closest('[data-reply]');
			if (!form) return;
			e.preventDefault();
			var msg = form.querySelector('.community-status');
			var author = form.elements.author.value.trim(), body = form.elements.body.value.trim();
			var problem = validate(author, [body], form.elements.website.value);
			if (problem) { msg.textContent = problem; return; }
			form.querySelector('button').disabled = true;
			try {
				await api('forum_comments', { method: 'POST', headers: headers(key, { Prefer: 'return=minimal' }),
					body: JSON.stringify({ thread_id: form.getAttribute('data-reply'), author: author.slice(0, 40), body: body.slice(0, 2000) }) });
				store('forum-last-post', Date.now());
				var article = form.closest('.thread');
				var count = Number(article.getAttribute('data-count')) + 1;     // keep the counter in sync
				article.setAttribute('data-count', count);
				article.querySelector('[data-open]').textContent = '💬 ' + plural(count, 'Kommentar', 'Kommentare') + ' · antworten';
				openThread(article);
			} catch (err) {
				msg.textContent = friendly(err);
				form.querySelector('button').disabled = false;
			}
		});

		// New thread
		newForm.addEventListener('submit', async function (e) {
			e.preventDefault();
			var f = newForm.elements;
			var data = { category: f.category.value, title: f.title.value.trim().slice(0, 120), body: f.body.value.trim().slice(0, 4000), author: f.author.value.trim().slice(0, 40) };
			var problem = validate(data.author, [data.title, data.body], f.website.value);
			if (problem) { status.textContent = problem; return; }
			status.textContent = 'Wird veröffentlicht …';
			newForm.querySelector('button').disabled = true;
			try {
				await api('forum_threads', { method: 'POST', headers: headers(key, { Prefer: 'return=minimal' }), body: JSON.stringify(data) });
				store('forum-last-post', Date.now());
				newForm.reset();
				status.textContent = 'Dein Thema ist online!';
				loadThreads();
			} catch (err) {
				status.textContent = friendly(err);
			}
			newForm.querySelector('button').disabled = false;
		});

		loadThreads();
	}

	document.addEventListener('DOMContentLoaded', function () {
		document.querySelectorAll('[data-forum]').forEach(mount);
	});
})();
