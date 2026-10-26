/* =========================================================
   auction.js – art auctions (labor/auktion.html)

   HOW IT WORKS:
   - Lots (artworks) live in the Supabase table "auction_lots".
     You create them in the Supabase Table Editor (see setup/supabase-labor.md).
   - Bids go through the database function "place_bid". It checks on the
     server that the bid is high enough and the auction is still running,
     so nobody can cheat from the browser.
   - The last bids are shown with first names only ("get_bids") – emails stay private.
   - A bid in the last 2 minutes extends the auction by 2 minutes (no "sniping").
   - When the countdown hits zero the bid form closes right away.
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

	function shortTime(ts) {
		return new Date(ts).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
	}

	function headers(key) {
		var h = { apikey: key, 'Content-Type': 'application/json' };
		if (key.indexOf('eyJ') === 0) h.Authorization = 'Bearer ' + key;
		return h;
	}

	function isOver(endsAt) { return new Date(endsAt) <= new Date(); }

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

	// The bidder's name/contact details are remembered in THIS browser only, for the next bid
	function remembered() { try { return JSON.parse(localStorage.getItem('auction-bidder') || '{}'); } catch (e) { return {}; } }
	function remember(me) { try { localStorage.setItem('auction-bidder', JSON.stringify(me)); } catch (e) { } }

	function mount(section) {
		var url = (section.getAttribute('data-supabase-url') || '').replace(/\/+$/, '');
		var key = section.getAttribute('data-supabase-key') || '';
		var notify = section.getAttribute('data-notify-email') || '';
		var list = section.querySelector('[data-lots]');
		if (!list) return;

		var SOON = '<p class="community-empty">Die erste Auktion startet bald. Trag dich in meine ' +
			'<a href="https://aydanligon.substack.com/subscribe">E-Mail-Liste</a> ein, dann verpasst du sie nicht.</p>';
		if (!url || !key) { list.innerHTML = SOON; return; }

		var lots = [];
		var history = {};   // lot id -> last bids (first names only)

		function minBid(lot) {
			return lot.current_bid == null ? Number(lot.start_price) : Number(lot.current_bid) + Number(lot.min_increment);
		}

		function historyHtml(lot) {
			var bids = history[lot.id];
			if (!bids || !bids.length) return '';
			return '<details class="schedule"><summary>Letzte Gebote</summary><ul>' +
				bids.slice(0, 5).map(function (b) {
					return '<li>' + escapeHtml(b.bidder_name) + ' – ' + euro(b.amount) + ' <span class="hint">(' + shortTime(b.created_at) + ')</span></li>';
				}).join('') + '</ul></details>';
		}

		function formHtml(lot) {
			if (isOver(lot.ends_at)) {
				return '<p class="hint"><strong>Auktion beendet.</strong> Die höchstbietende Person bekommt innerhalb von 48 Stunden eine E-Mail.</p>';
			}
			var me = remembered();
			var id = escapeHtml(lot.id);
			return '<form class="bid-form" data-lot="' + id + '">' +
				'<label class="hint" for="bn-' + id + '">Vorname (wird angezeigt)</label>' +
				'<input id="bn-' + id + '" name="name" required maxlength="40" autocomplete="given-name" value="' + escapeHtml(me.name || '') + '">' +
				'<fieldset class="bid-contact"><legend class="hint">So erreiche ich dich, wenn du gewinnst – mindestens eins davon (bleibt privat):</legend>' +
				'<label class="hint" for="be-' + id + '">E-Mail</label>' +
				'<input id="be-' + id + '" name="email" type="email" autocomplete="email" value="' + escapeHtml(me.email || '') + '">' +
				'<label class="hint" for="bp-' + id + '">oder Telefon</label>' +
				'<input id="bp-' + id + '" name="phone" type="tel" autocomplete="tel" value="' + escapeHtml(me.phone || '') + '">' +
				'<label class="hint" for="bad-' + id + '">oder Lieferadresse für die direkte Übergabe (Straße, Nr., PLZ, Ort)</label>' +
				'<textarea id="bad-' + id + '" name="address" rows="2" autocomplete="street-address">' + escapeHtml(me.address || '') + '</textarea>' +
				'<label class="hint" for="bd-' + id + '">Name an der Klingel (bei Lieferadresse)</label>' +
				'<input id="bd-' + id + '" name="doorbell" value="' + escapeHtml(me.doorbell || '') + '">' +
				'</fieldset>' +
				'<label class="hint" for="ba-' + id + '">Dein Gebot in €' + (lot.current_bid == null ? ' – biete, was es dir wert ist' : ' (mehr als ' + euro(lot.current_bid) + ')') + '</label>' +
				'<input id="ba-' + id + '" name="amount" type="number" inputmode="decimal" required step="0.01" min="' + minBid(lot) + '" placeholder="z. B. 30">' +
				'<label class="choice"><input type="checkbox" name="agree" required> <span>Mein Gebot ist ein verbindliches, kostenpflichtiges Kaufangebot. Ich habe die <a href="#regeln">Auktionsregeln</a> und die <a href="/labor/widerruf.html">Widerrufsbelehrung</a> gelesen.</span></label>' +
				'<button class="btn btn--fox" type="submit">Kostenpflichtig bieten</button>' +
				'<p class="bid-status" aria-live="polite"></p>' +
				'</form>';
		}

		function lotHtml(lot) {
			var ended = isOver(lot.ends_at);
			var img = lot.image_url
				? '<img src="' + escapeHtml(lot.image_url) + '" alt="' + escapeHtml(lot.title) + '" loading="lazy">'
				: '<div class="ph ph--4x5">Foto des Kunstwerks</div>';
			var bidLine = lot.current_bid == null
				? '<p class="lot-bid">Noch kein Gebot</p><span class="hint">Kein Startpreis – du bestimmst, was es wert ist.</span>'
				: '<p class="lot-bid">' + euro(lot.current_bid) + '</p><span class="hint">Höchstgebot von ' + escapeHtml(lot.current_bidder || 'Anonym') + ' · ' + lot.bid_count + ' Gebot' + (lot.bid_count === 1 ? '' : 'e') + '</span>';
			return '<article class="lot' + (ended ? ' lot-ended' : '') + '" data-lot-card="' + escapeHtml(lot.id) + '">' + img +
				'<h3 style="margin:0">' + escapeHtml(lot.title) + '</h3>' +
				(lot.description ? '<p style="margin:0">' + escapeHtml(lot.description) + '</p>' : '') +
				bidLine +
				'<div class="lot-meta"><span class="lot-countdown" data-ends="' + escapeHtml(lot.ends_at) + '">' + countdownText(lot.ends_at) + '</span>' +
				(Number(lot.min_increment) >= 1 ? '<span>Mindestschritt ' + euro(lot.min_increment) + '</span>' : '<span>Jedes höhere Gebot zählt</span>') + '</div>' +
				historyHtml(lot) + formHtml(lot) + '</article>';
		}

		function render() {
			list.innerHTML = lots.length
				? lots.map(lotHtml).join('')
				: '<p class="community-empty">Gerade läuft keine Auktion. Die nächste kündige ich über meine <a href="https://aydanligon.substack.com/subscribe">E-Mail-Liste</a> an.</p>';
		}

		async function loadHistory() {
			// optional: works once "get_bids" exists in the database; otherwise simply nothing is shown
			await Promise.all(lots.map(async function (lot) {
				try {
					var res = await fetch(url + '/rest/v1/rpc/get_bids', { method: 'POST', headers: headers(key), body: JSON.stringify({ p_lot: lot.id }) });
					history[lot.id] = res.ok ? await res.json() : [];
				} catch (e) { history[lot.id] = []; }
			}));
		}

		async function load() {
			try {
				var res = await fetch(url + '/rest/v1/auction_lots?select=*&active=eq.true&order=ends_at.asc', { headers: headers(key) });
				if (res.status === 404) { list.innerHTML = SOON; return; }   // tables not set up yet
				if (!res.ok) throw new Error();
				lots = await res.json();
				await loadHistory();
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
			var button = form.querySelector('button');
			var name = form.elements.name.value.trim();
			var email = form.elements.email.value.trim();
			var phone = form.elements.phone.value.trim();
			var address = form.elements.address.value.trim();
			var doorbell = form.elements.doorbell.value.trim();
			if (!email && !phone && !address) {
				form.querySelector('.bid-status').textContent = 'Bitte hinterlass eine Kontaktmöglichkeit: E-Mail, Telefon oder Lieferadresse.';
				return;
			}
			if (address && !doorbell) {
				form.querySelector('.bid-status').textContent = 'Bitte gib bei Lieferung auch den Namen an der Klingel an.';
				return;
			}
			var amount = Number(form.elements.amount.value);
			var lotId = form.getAttribute('data-lot');
			var lot = lots.filter(function (l) { return l.id === lotId; })[0];
			status.textContent = 'Gebot wird geprüft …';
			button.disabled = true;
			try {
				var res = await fetch(url + '/rest/v1/rpc/place_bid', {
					method: 'POST', headers: headers(key),
					body: JSON.stringify({ p_lot: lotId, p_name: name, p_email: email, p_phone: phone, p_address: address, p_doorbell: doorbell, p_amount: amount })
				});
				var data = await res.json();
				if (!res.ok || !data || data.ok !== true) {
					status.textContent = (data && data.message) || 'Das Gebot konnte nicht angenommen werden.';
					button.disabled = false;
					return;
				}
				remember({ name: name, email: email, phone: phone, address: address, doorbell: doorbell });
				status.textContent = 'Danke! Du bist jetzt Höchstbietende:r mit ' + euro(amount) + '.';
				if (notify) {
					fetch('https://formsubmit.co/ajax/' + encodeURIComponent(notify), {
						method: 'POST',
						headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
						body: JSON.stringify({ _subject: 'Neues Gebot: ' + (lot ? lot.title : 'Auktion') + ' – ' + euro(amount), Name: name, email: email || '–', Telefon: phone || '–', Lieferadresse: address ? address + ' (Klingel: ' + doorbell + ')' : '–', Gebot: euro(amount) })
					}).catch(function () { });
				}
				setTimeout(load, 1500);
			} catch (err) {
				status.textContent = 'Verbindungsproblem – bitte versuch es noch einmal.';
				button.disabled = false;
			}
		});

		// Every second: update countdowns; close the form the moment an auction ends
		setInterval(function () {
			list.querySelectorAll('[data-ends]').forEach(function (el) {
				el.textContent = countdownText(el.getAttribute('data-ends'));
				var card = el.closest('[data-lot-card]');
				if (isOver(el.getAttribute('data-ends')) && card && !card.classList.contains('lot-ended')) {
					var lot = lots.filter(function (l) { return l.id === card.getAttribute('data-lot-card'); })[0];
					if (lot) card.outerHTML = lotHtml(lot);
				}
			});
		}, 1000);
		// Every 20 seconds: fetch new bids (not while someone is typing)
		setInterval(function () { if (!list.contains(document.activeElement)) load(); }, 20000);

		load();
	}

	document.addEventListener('DOMContentLoaded', function () {
		document.querySelectorAll('[data-auction]').forEach(mount);
	});
})();
