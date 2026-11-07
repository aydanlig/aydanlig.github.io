/* =========================================================
   mini-cal.js – small month calendar on the homepage (#termine)
   Starts blurred; a button unfolds it. Days with a date from js/termine.js
   are marked; hovering or clicking a day shows a short snippet.
   Saturdays = Mauerpark (weekly). HTML: <div data-mini-cal></div>
   ========================================================= */
(function () {
	var EN = (document.documentElement.lang || '').indexOf('en') === 0;
	var T = EN ? {
		open: 'Show calendar', close: 'Hide calendar', hint: 'Hover over or tap a marked day',
		days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
		months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		sat: 'Mauerpark · 2–10 pm, next to the photo booth · €1 sketches', more: 'All dates & places →', link: '/en/where-i-draw/'
	} : {
		open: 'Kalender ausklappen', close: 'Kalender einklappen', hint: 'Fahr über einen markierten Tag oder tipp ihn an',
		days: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
		months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
		sat: 'Mauerpark · 14–22 Uhr, neben dem Photoautomaten · 1-€-Skizzen', more: 'Alle Orte & Zeiten →', link: '/where-i-draw/'
	};
	function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
	function key(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }

	document.addEventListener('DOMContentLoaded', function () {
		var box = document.querySelector('[data-mini-cal]');
		if (!box) return;
		var today = new Date(); today.setHours(0, 0, 0, 0);
		var byDay = {}, last = today;
		(window.TERMINE || []).forEach(function (t) {
			var d = new Date(t.date + 'T00:00:00');
			if (d < today) return;
			(byDay[t.date] = byDay[t.date] || []).push(t);
			if (d > last) last = d;
		});
		// show from this month up to the last date, at most 3 months
		var months = [], m = new Date(today.getFullYear(), today.getMonth(), 1);
		while (m <= last && months.length < 3) { months.push(new Date(m)); m.setMonth(m.getMonth() + 1); }
		if (!months.length) months.push(new Date(today.getFullYear(), today.getMonth(), 1));

		var html = '<div class="mc-inner"><div class="mc-months">';
		months.forEach(function (first) {
			html += '<div class="mc-month"><strong class="mc-title">' + T.months[first.getMonth()] + ' ' + first.getFullYear() + '</strong><div class="mc-grid">';
			T.days.forEach(function (d) { html += '<span class="mc-dow">' + d + '</span>'; });
			var pad = (first.getDay() + 6) % 7;
			for (var i = 0; i < pad; i++) html += '<span></span>';
			var d = new Date(first);
			while (d.getMonth() === first.getMonth()) {
				var k = key(d), cls = 'mc-day', past = d < today;
				if (past) cls += ' is-past';
				if (+d === +today) cls += ' is-today';
				if (!past && byDay[k]) cls += ' has-event';
				else if (!past && d.getDay() === 6) cls += ' is-sat';
				var hit = !past && (byDay[k] || d.getDay() === 6);
				html += hit ? '<button type="button" class="' + cls + '" data-day="' + k + '">' + d.getDate() + '</button>'
					: '<span class="' + cls + '">' + d.getDate() + '</span>';
				d.setDate(d.getDate() + 1);
			}
			html += '</div></div>';
		});
		html += '</div><div class="mc-snip" aria-live="polite">' + T.hint + '</div>' +
			'<p class="mc-more"><a href="' + T.link + '">' + T.more + '</a></p></div>' +
			'<button type="button" class="btn btn--small mc-toggle" aria-expanded="false">' + T.open + '</button>';
		box.className = 'mini-cal is-locked';
		box.innerHTML = html;

		var snip = box.querySelector('.mc-snip'), toggle = box.querySelector('.mc-toggle');
		function show(k) {
			var d = new Date(k + 'T00:00:00');
			var head = d.toLocaleDateString(EN ? 'en-GB' : 'de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
			var items = (byDay[k] || []).map(function (t) {
				var title = EN && t.title_en ? t.title_en : t.title, place = EN && t.place_en ? t.place_en : t.place;
				var time = EN && t.time_en ? t.time_en : t.time;
				return '<li><strong>' + esc(title) + '</strong><br>' + esc(place) + (time ? ' · ' + esc(time) : '') +
					(t.map ? ' · <a href="' + esc(t.map) + '" target="_blank" rel="noopener">Map ↗</a>' : '') + '</li>';
			});
			if (!items.length || d.getDay() === 6) items.push('<li>' + esc(T.sat) + '</li>');
			snip.innerHTML = '<span class="mc-snip-date">' + head + '</span><ul>' + items.join('') + '</ul>';
			box.querySelectorAll('.mc-day.is-active').forEach(function (b) { b.classList.remove('is-active'); });
			var b = box.querySelector('[data-day="' + k + '"]'); if (b) b.classList.add('is-active');
		}
		box.querySelectorAll('[data-day]').forEach(function (b) {
			b.addEventListener('mouseenter', function () { if (!box.classList.contains('is-locked')) show(b.getAttribute('data-day')); });
			b.addEventListener('focus', function () { show(b.getAttribute('data-day')); });
			b.addEventListener('click', function () { show(b.getAttribute('data-day')); });
		});
		function setOpen(open) {
			box.classList.toggle('is-locked', !open);
			toggle.textContent = open ? T.close : T.open;
			toggle.setAttribute('aria-expanded', open);
			box.querySelectorAll('[data-day]').forEach(function (b) { b.tabIndex = open ? 0 : -1; });
		}
		toggle.addEventListener('click', function () { setOpen(box.classList.contains('is-locked')); });
		setOpen(false);
	});
})();
