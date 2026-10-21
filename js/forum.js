/* =========================================================
   forum.js – Urban-Artist-Forum (labor/forum.html)

   HOW IT WORKS:
   - Threads and comments are stored in Supabase ("forum_threads",
     "forum_comments", see setup/supabase-labor.md).
   - Posts appear immediately (it's a conversation). Protection:
     profanity filter, a "Melden" (report) button on everything, and
     anything reported 3 times is hidden automatically by the database.
     You can delete posts any time in the Supabase Table Editor.

   SETTINGS on <section data-forum ...>:
     data-supabase-url, data-supabase-key
   ========================================================= */
(function () {
	'use strict';

	var CATEGORIES = ['Spots & Genehmigungen', 'Material & Technik', 'Kooperationen', 'Events & Märkte', 'Feedback zu Arbeiten', 'Off-Topic'];
	var PROFANITY = ['fuck', 'shit', 'bitch', 'asshole', 'cunt', 'nigger', 'faggot', 'whore', 'hurensohn', 'fotze', 'wichser', 'missgeburt', 'schlampe'];

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

	function headers(key, extra) {
		var h = { apikey: key, 'Content-Type': 'application/json' };
		if (key.indexOf('eyJ') === 0) h.Authorization = 'Bearer ' + key;
		for (var k in (extra || {})) h[k] = extra[k];
		return h;
	}

	function mount(section) {
		var url = (section.getAttribute('data-supabase-url') || '').replace(/\/+$/, '');
		var key = section.getAttribute('data-supabase-key') || '';
		var list = section.querySelector('[data-threads]');
		var bar = section.querySelector('[data-categories]');
		var newForm = section.querySelector('[data-new-thread]');
		var status = section.querySelector('[data-forum-status]');
		var current = 'Alle';

		if (!url || !key) {
			list.innerHTML = '<p class="community-empty">Das Forum öffnet bald.</p>';
			if (newForm) newForm.hidden = true;
			return;
		}

		// Category filter buttons + category select in the "new thread" form
		bar.innerHTML = ['Alle'].concat(CATEGORIES).map(function (c) {
			return '<button type="button" data-cat="' + escapeHtml(c) + '"' + (c === 'Alle' ? ' class="active"' : '') + '>' + escapeHtml(c) + '</button>';
		}).join('');
		newForm.elements.category.innerHTML = CATEGORIES.map(function (c) { return '<option>' + escapeHtml(c) + '</option>'; }).join('');

		bar.addEventListener('click', function (e) {
			var b = e.target.closest('[data-cat]');
			if (!b) return;
			current = b.getAttribute('data-cat');
			bar.querySelectorAll('button').forEach(function (x) { x.classList.toggle('active', x === b); });
			loadThreads();
		});

		async function api(path, options) {
			var res = await fetch(url + '/rest/v1/' + path, options || { headers: headers(key) });
			if (!res.ok) throw new Error(res.status);
			return res.status === 204 || res.status === 201 ? null : res.json();
		}

		function reportedBefore(id) {
			try { return (JSON.parse(localStorage.getItem('forum-reported') || '[]')).indexOf(id) !== -1; } catch (e) { return false; }
		}
		function rememberReport(id) {
			try {
				var l = JSON.parse(localStorage.getItem('forum-reported') || '[]'); l.push(id);
				localStorage.setItem('forum-reported', JSON.stringify(l));
			} catch (e) { }
		}

		function threadHtml(t) {
			return '<article class="thread" data-thread="' + escapeHtml(t.id) + '">' +
				'<div class="thread-meta"><span class="cat-chip">' + escapeHtml(t.category) + '</span>' +
				'<span>' + escapeHtml(t.author) + ' · ' + when(t.created_at) + '</span></div>' +
				'<h3>' + escapeHtml(t.title) + '</h3>' +
				'<div class="thread-body">' + escapeHtml(t.body) + '</div>' +
				'<div class="thread-actions">' +
				'<button class="link-btn" type="button" data-open>💬 ' + t.comment_count + ' Kommentar' + (t.comment_count === 1 ? '' : 'e') + ' anzeigen / antworten</button>' +
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
				// 404 = database tables not set up yet (setup/supabase-labor.md)
				if (e.message === '404') {
					list.innerHTML = '<p class="community-empty">Das Forum öffnet bald.</p>';
					newForm.hidden = true; bar.hidden = true;
					return;
				}
				list.innerHTML = '<p class="community-empty">Das Forum konnte gerade nicht geladen werden.</p>';
			}
		}

		async function openThread(article) {
			var box = article.querySelector('[data-comments]');
			var id = article.getAttribute('data-thread');
			box.hidden = false;
			box.innerHTML = '<p class="hint">Lädt …</p>';
			try {
				var comments = await api('forum_comments?select=*&thread_id=eq.' + id + '&order=created_at.asc');
				box.innerHTML = '<div class="comments">' +
					(comments.length ? comments.map(function (c) {
						return '<div class="comment"><div class="thread-meta"><span>' + escapeHtml(c.author) + ' · ' + when(c.created_at) + '</span>' +
							'<button class="link-btn" type="button" data-report="comment" data-id="' + escapeHtml(c.id) + '">Melden</button></div>' +
							'<div class="comment-body">' + escapeHtml(c.body) + '</div></div>';
					}).join('') : '<p class="hint">Noch keine Kommentare.</p>') +
					'<form class="comment-form" data-reply="' + escapeHtml(id) + '">' +
					'<input name="author" maxlength="40" placeholder="Name oder Künstlername" required>' +
					'<textarea name="body" maxlength="2000" placeholder="Deine Antwort …" required></textarea>' +
					'<button class="btn btn--small" type="submit">Antworten</button></form></div>';
			} catch (e) {
				box.innerHTML = '<p class="hint">Kommentare konnten nicht geladen werden.</p>';
			}
		}

		list.addEventListener('click', async function (e) {
			var open = e.target.closest('[data-open]');
			if (open) { openThread(open.closest('.thread')); return; }
			var rep = e.target.closest('[data-report]');
			if (rep) {
				var id = rep.getAttribute('data-id');
				if (reportedBefore(id)) { rep.textContent = 'Bereits gemeldet'; return; }
				if (!confirm('Diesen Beitrag melden? Nach 3 Meldungen wird er automatisch ausgeblendet.')) return;
				try {
					await api('rpc/report_content', { method: 'POST', headers: headers(key), body: JSON.stringify({ p_kind: rep.getAttribute('data-report'), p_id: id }) });
					rememberReport(id);
					rep.textContent = 'Gemeldet – danke!';
				} catch (err) { rep.textContent = 'Melden fehlgeschlagen'; }
			}
		});

		// Reply to a thread
		list.addEventListener('submit', async function (e) {
			var form = e.target.closest('[data-reply]');
			if (!form) return;
			e.preventDefault();
			var author = form.elements.author.value.trim(), body = form.elements.body.value.trim();
			if (hasProfanity(author) || hasProfanity(body)) { alert('Bitte ohne Beleidigungen.'); return; }
			form.querySelector('button').disabled = true;
			try {
				await api('forum_comments', { method: 'POST', headers: headers(key, { Prefer: 'return=minimal' }),
					body: JSON.stringify({ thread_id: form.getAttribute('data-reply'), author: author.slice(0, 40), body: body.slice(0, 2000) }) });
				openThread(form.closest('.thread'));
			} catch (err) {
				alert('Antwort konnte nicht gespeichert werden.');
				form.querySelector('button').disabled = false;
			}
		});

		// New thread
		newForm.addEventListener('submit', async function (e) {
			e.preventDefault();
			var f = newForm.elements;
			var data = { category: f.category.value, title: f.title.value.trim().slice(0, 120), body: f.body.value.trim().slice(0, 4000), author: f.author.value.trim().slice(0, 40) };
			if (hasProfanity(data.title) || hasProfanity(data.body) || hasProfanity(data.author)) { status.textContent = 'Bitte ohne Beleidigungen.'; return; }
			status.textContent = 'Wird veröffentlicht …';
			try {
				await api('forum_threads', { method: 'POST', headers: headers(key, { Prefer: 'return=minimal' }), body: JSON.stringify(data) });
				newForm.reset();
				status.textContent = 'Dein Thema ist online!';
				loadThreads();
			} catch (err) {
				status.textContent = 'Konnte nicht veröffentlicht werden. Bitte später noch einmal versuchen.';
			}
		});

		loadThreads();
	}

	document.addEventListener('DOMContentLoaded', function () {
		document.querySelectorAll('[data-forum]').forEach(mount);
	});
})();
