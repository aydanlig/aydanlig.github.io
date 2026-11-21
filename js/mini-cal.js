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
			if (d < today && !(t.img && t.img.length)) return; // past: only with drawings
			(byDay[t.date] = byDay[t.date] || []).push(t);
			if (d > last) last = d;
		});
		// show from this month up to the last date, at most 3 months
		var months = [], m = new Date(today.getFullYear(), today.getMonth(), 1);
		var prev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
		if (Object.keys(byDay).some(function (k) { return new Date(k + 'T00:00:00') >= prev && new Date(k + 'T00:00:00') < m; })) months.push(new Date(prev));
		while (m <= last && months.length < 6) { months.push(new Date(m)); m.setMonth(m.getMonth() + 1); }
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
				if (byDay[k]) cls += past ? ' has-img' : ' has-event';
				else if (!past && d.getDay() === 6) cls += ' is-sat';
				var hit = byDay[k] || (!past && d.getDay() === 6);
				html += hit ? '<button type="button" class="' + cls + '" data-day="' + k + '">' + d.getDate() + '</button>'
					: '<span class="' + cls + '">' + d.getDate() + '</span>';
				d.setDate(d.getDate() + 1);
			}
			html += '</div></div>';
		});
		html += '</div><div class="mc-snip" aria-live="polite">' + T.hint + '</div></div>';
		box.className = 'mini-cal';
		box.innerHTML = html;

		var snip = box.querySelector('.mc-snip');
		function show(k) {
			var d = new Date(k + 'T00:00:00');
			var head = d.toLocaleDateString(EN ? 'en-GB' : 'de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
			var items = (byDay[k] || []).map(function (t) {
				var title = EN && t.title_en ? t.title_en : t.title, place = EN && t.place_en ? t.place_en : t.place;
				var time = EN && t.time_en ? t.time_en : t.time;
				var pics = (t.img || []).slice(0, 4).map(function (n) { return '<img src="/img/musik/' + esc(n) + '-klein.jpg" alt="" loading="lazy">'; }).join('');
				return '<li>' + (pics ? '<span class="mc-pics">' + pics + '</span>' : '') + '<strong>' + esc(title) + '</strong><br>' + esc(place) + (time ? ' · ' + esc(time) : '') +
					(t.map ? ' · <a href="' + esc(t.map) + '" target="_blank" rel="noopener">Map ↗</a>' : '') + '</li>';
			});
			if (!items.length || (d.getDay() === 6 && d >= today)) items.push('<li>' + esc(T.sat) + '</li>');
			snip.innerHTML = '<span class="mc-snip-date">' + head + '</span><ul>' + items.join('') + '</ul>';
			box.querySelectorAll('.mc-day.is-active').forEach(function (b) { b.classList.remove('is-active'); });
			var b = box.querySelector('[data-day="' + k + '"]'); if (b) b.classList.add('is-active');
		}
		box.querySelectorAll('[data-day]').forEach(function (b) {
			b.addEventListener('mouseenter', function () { stop(); show(b.getAttribute('data-day')); });
			b.addEventListener('focus', function () { stop(); show(b.getAttribute('data-day')); });
			b.addEventListener('click', function () { stop(); show(b.getAttribute('data-day')); });
		});
		// autoplay: drawings from past dates first, then upcoming dates; stops once the visitor hovers or taps a day
		var seq = Object.keys(byDay).sort().filter(function (k) { var b = box.querySelector('[data-day="' + k + '"]'); return b && getComputedStyle(b.closest('.mc-month')).pointerEvents !== 'none'; }), i = 0, timer = null;
		function stop() { clearInterval(timer); timer = null; }
		if (seq.length) { show(seq[0]); timer = setInterval(function () { i = (i + 1) % seq.length; show(seq[i]); }, 2200); }
	});
})();
