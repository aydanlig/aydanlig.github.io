/* Upcoming dates on /where-i-draw/ (DE + EN).
   Each row carries data-until="YYYY-MM-DD" (its last day). Rows whose day has passed
   are removed; if none are left, the whole "next dates" block hides itself.
   To add a date: copy a <div class="st-row" data-until="…"> row in both pages. */
(function () {
	var box = document.getElementById('termine');
	if (!box) return;
	var now = new Date();
	var today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
	box.querySelectorAll('[data-until]').forEach(function (row) {
		if (row.getAttribute('data-until') < today) row.remove();
	});
	var rows = box.querySelectorAll('[data-until]');
	if (!rows.length) { box.hidden = true; return; }
	// Less is more: show the next 5, the rest behind one button.
	var SHOW = 5;
	if (rows.length > SHOW) {
		for (var i = SHOW; i < rows.length; i++) rows[i].hidden = true;
		var en = document.documentElement.lang === 'en';
		var btn = document.createElement('button');
		btn.type = 'button';
		btn.className = 'btn btn--ghost btn--small';
		btn.textContent = (en ? 'Show all ' : 'Alle ') + rows.length + (en ? ' dates' : ' Termine anzeigen');
		btn.addEventListener('click', function () {
			rows.forEach(function (r) { r.hidden = false; });
			btn.remove();
		});
		box.appendChild(btn);
	}
})();
