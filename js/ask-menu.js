// "Anfragen" dropdown in the header (<details class="ask-menu">):
// closes when you pick an entry, click somewhere else or press Escape.
document.addEventListener('DOMContentLoaded', function () {
	var menus = document.querySelectorAll('details.ask-menu');
	if (!menus.length) return;
	menus.forEach(function (menu) {
		menu.querySelectorAll('a').forEach(function (a) {
			a.addEventListener('click', function () { menu.open = false; });
		});
	});
	document.addEventListener('click', function (e) {
		menus.forEach(function (menu) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
	});
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape') menus.forEach(function (menu) { if (menu.open) { menu.open = false; menu.querySelector('summary').focus(); } });
	});
});
