/* termine-list.js – fills the homepage date grid (ul.termine-list[data-auto]) from js/termine.js.
   Past dates drop out by themselves. More than 10 → the rest folds away behind a blurred row + button. */
(function () {
	var ul = document.querySelector('.termine-list[data-auto]');
	if (!ul || !window.TERMINE) return;
	var en = (document.documentElement.lang || '').indexOf('en') === 0;
	var DAYS = en ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] : ['So','Mo','Di','Mi','Do','Fr','Sa'];
	var today = new Date(); today.setHours(0, 0, 0, 0);
	var pad = function (n) { return (n < 10 ? '0' : '') + n; };
	var esc = function (s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
	var list = window.TERMINE.filter(function (t) { return new Date(t.date + 'T23:59:59') >= today; })
		.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
	list.forEach(function (t, i) {
		var d = new Date(t.date + 'T12:00:00');
		var day = DAYS[d.getDay()] + ' ' + (en ? pad(d.getDate()) + '/' + pad(d.getMonth() + 1) : pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.');
		var place = (t.place || '').split(',')[0];
		var time = en ? t.time_en : t.time;
		var li = document.createElement('li');
		li.innerHTML = '<span class="t-date">' + day + '</span><span class="t-what"><strong>' + esc(place) + '</strong> · ' +
			esc(en ? (t.title_en || t.title) : t.title) + (time ? ', ' + esc(time) : '') + '</span>';
		if (i >= 10) li.className = 't-extra';
		else if (i >= 8) li.className = 't-fade';
		ul.appendChild(li);
	});
	if (list.length <= 10) return;
	ul.classList.add('is-collapsed');
	var btn = document.createElement('button');
	btn.type = 'button'; btn.className = 'btn btn--small termine-more';
	btn.textContent = (en ? 'Show all ' : 'Alle ') + list.length + (en ? ' dates' : ' Termine anzeigen');
	btn.addEventListener('click', function () { ul.classList.remove('is-collapsed'); btn.remove(); var mc = document.querySelector('.mini-cal.is-locked .mc-toggle'); if (mc) mc.click(); });
	ul.insertAdjacentElement('afterend', btn);
})();
