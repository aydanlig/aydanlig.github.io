/* =========================================================
   auction.js – art auctions (labor/auktion.html)

   HOW IT WORKS:
   - Lots (artworks) live in the Supabase table "auction_lots".
     You create them in the Supabase Table Editor (see setup/supabase-labor.md).
   - Bids go through the database function "place_bid". It checks on the
     server that the bid is high enough and the auction is still running,
     so nobody can cheat from the browser.
   - Bidder emails are stored privately – the page only shows first names.
   - A bid in the last 2 minutes extends the auction by 2 minutes (no "sniping").
   - Every bid also emails you (formsubmit.co).

   SETTINGS on <section data-auction ...> in the HTML:
     data-supabase-url, data-supabase-key, data-notify-email
   ========================================================= */
(function () {
	'use strict';

	function escapeHtml(text) {
		return String(text)
			.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
	}

	function euro(value) {
		return Number(value).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
	}

	function headers(key) {
		var h = { apikey: key, 'Content-Type': 'application/json' };
		if (key.indexOf('eyJ') === 0) h.Authorization = 'Bearer ' + key;
		return h;
	}

	function countdownText(endsAt) {
		var ms = new Date(endsAt) - new Date();
		if (ms <= 0) return 'Beendet';
		var s = Math.floor(ms / 1000);
		var d = Math.floor(s / 86400); s -= d * 86400;
		var h = Math.floor(s / 3600); s -= h * 3600;
		var m = Math.floor(s / 60); s -= m * 60;
		if (d > 0) return 'Noch ' + d + ' T ' + h + ' Std';
		if (h > 0) return 'Noch ' + h + ' Std ' + m + ' Min';
		return 'Noch ' + m + ' Min ' + s + ' Sek';
	}

	function mount(section) {
		var url = (section.getAttribute('data-supabase-url') || '').replace(/\/+$/, '');
		var key = section.getAttribute('data-supabase-key') || '';
		var notify = section.getAttribute('data-notify-email') || '';
		var list = section.querySelector('[data-lots]');
		if (!list) return;

		if (!url || !key) {
			list.innerHTML = '<p class="community-empty">Die erste Auktion startet bald. Trag dich in den Newsletter ein, dann verpasst du sie nicht.</p>';
			return;
		}

		var lots = [];

		function minBid(lot) {
			return lot.current_bid == null ? Number(lot.start_price) : Number(lot.current_bid) + Number(lot.min_increment);
		}

		function render() {
			if (!lots.length) {
				list.innerHTML = '<p class="community-empty">Gerade läuft keine Auktion. Die nächste kündige ich im Newsletter an.</p>';
				return;
			}
			list.innerHTML = lots.map(function (lot) {
				var ended = new Date(lot.ends_at) <= new Date();
				var img = lot.image_url
					? '<img src="' + escapeHtml(lot.image_url) + '" alt="' + escapeHtml(lot.title) + '" loading="lazy">'
					: '<div class="ph ph--4x5">Foto des Kunstwerks</div>';
				var bidLine = lot.current_bid == null
					? '<p class="lot-bid">' + euro(lot.start_price) + '</p><span class="hint">Startpreis – noch kein Gebot</span>'
					: '<p class="lot-bid">' + euro(lot.current_bid) + '</p><span class="hint">Höchstgebot von ' + escapeHtml(lot.current_bidder || 'Anonym') + ' · ' + lot.bid_count + ' Gebot(e)</span>';
				var form = ended
					? '<p class="hint"><strong>Auktion beendet.</strong> Die höchstbietende Person wird per E-Mail benachrichtigt.</p>'
					: '<form class="bid-form" data-lot="' + escapeHtml(lot.id) + '">' +
						'<input name="name" required maxlength="40" placeholder="Vorname (wird angezeigt)" autocomplete="given-name">' +
						'<input name="email" type="email" required placeholder="E-Mail (bleibt privat)" autocomplete="email">' +
						'<input name="amount" type="number" required step="1" min="' + minBid(lot) + '" placeholder="Mindestens ' + euro(minBid(lot)) + '">' +
						'<label class="choice"><input type="checkbox" name="agree" required> <span>Mein Gebot ist verbindlich. Ich habe die <a href="#regeln">Auktionsregeln</a> gelesen.</span></label>' +
						'<button class="btn btn--fox" type="submit">Gebot abgeben</button>' +
						'<p class="bid-status" aria-live="polite"></p>' +
					'</form>';
				return '<article class="lot' + (ended ? ' lot-ended' : '') + '">' + img +
					'<h3 style="margin:0">' + escapeHtml(lot.title) + '</h3>' +
					(lot.description ? '<p style="margin:0">' + escapeHtml(lot.description) + '</p>' : '') +
					bidLine +
					'<div class="lot-meta"><span class="lot-countdown" data-ends="' + escapeHtml(lot.ends_at) + '">' + countdownText(lot.ends_at) + '</span>' +
					'<span>Mindestschritt ' + euro(lot.min_increment) + '</span></div>' +
					form + '</article>';
			}).join('');
		}

		async function load() {
			try {
				var res = await fetch(url + '/rest/v1/auction_lots?select=*&active=eq.true&order=ends_at.asc', { headers: headers(key) });
				// 404 = database tables not set up yet (setup/supabase-labor.md)
				if (res.status === 404) {
					list.innerHTML = '<p class="community-empty">Die erste Auktion startet bald. Trag dich in den <a href="https://aydanligon.substack.com/subscribe">Newsletter</a> ein, dann verpasst du sie nicht.</p>';
					return;
				}
				if (!res.ok) throw new Error();
				lots = await res.json();
				render();
			} catch (e) {
				list.innerHTML = '<p class="community-empty">Die Auktionen konnten gerade nicht geladen werden. Bitte versuch es später noch einmal.</p>';
			}
		}

		// Place a bid
		list.addEventListener('submit', async function (e) {
			var form = e.target.closest('.bid-form');
			if (!form) return;
			e.preventDefault();
			var status = form.querySelector('.bid-status');
			var name = form.elements.name.value.trim();
			var email = form.elements.email.value.trim();
			var amount = Number(form.elements.amount.value);
			var lot = lots.filter(function (l) { return l.id === form.getAttribute('data-lot'); })[0];
			status.textContent = 'Gebot wird geprüft …';
			form.querySelector('button').disabled = true;
			try {
				var res = await fetch(url + '/rest/v1/rpc/place_bid', {
					method: 'POST',
					headers: headers(key),
					body: JSON.stringify({ p_lot: form.getAttribute('data-lot'), p_name: name, p_email: email, p_amount: amount })
				});
				var data = await res.json();
				if (!res.ok || !data || data.ok !== true) {
					status.textContent = (data && data.message) || 'Das Gebot konnte nicht angenommen werden.';
					form.querySelector('button').disabled = false;
					return;
				}
				status.textContent = 'Danke! Du bist jetzt Höchstbietende:r mit ' + euro(amount) + '.';
				if (notify) {
					fetch('https://formsubmit.co/ajax/' + encodeURIComponent(notify), {
						method: 'POST',
						headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
						body: JSON.stringify({ _subject: 'Neues Gebot: ' + (lot ? lot.title : 'Auktion') + ' – ' + euro(amount), Name: name, email: email, Gebot: euro(amount) })
					}).catch(function () { });
				}
				setTimeout(load, 1500);
			} catch (err) {
				status.textContent = 'Verbindungsproblem – bitte versuch es noch einmal.';
				form.querySelector('button').disabled = false;
			}
		});

		// Tick the countdowns every second, reload bids every 20 seconds
		setInterval(function () {
			list.querySelectorAll('[data-ends]').forEach(function (el) {
				el.textContent = countdownText(el.getAttribute('data-ends'));
			});
		}, 1000);
		setInterval(function () {
			// don't reload while someone is typing a bid
			if (!list.contains(document.activeElement)) load();
		}, 20000);

		load();
	}

	document.addEventListener('DOMContentLoaded', function () {
		document.querySelectorAll('[data-auction]').forEach(mount);
	});
})();
