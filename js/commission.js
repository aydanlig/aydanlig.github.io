/* =========================================================
   commission.js – small helpers for the commission form (DE + EN)
   1. data-feel-chips="input-id": clicking a word adds/removes it in the feeling field
   2. a[data-open-style-guide]: opens the style guide box before jumping to it
   ========================================================= */
document.addEventListener('DOMContentLoaded', function () {
	document.querySelectorAll('[data-feel-chips]').forEach(function (box) {
		var input = document.getElementById(box.getAttribute('data-feel-chips'));
		if (!input) return;
		function words() { return input.value.split(',').map(function (w) { return w.trim(); }).filter(Boolean); }
		function sync() {
			var list = words().map(function (w) { return w.toLowerCase(); });
			box.querySelectorAll('button').forEach(function (b) {
				b.setAttribute('aria-pressed', list.indexOf(b.textContent.toLowerCase()) > -1 ? 'true' : 'false');
			});
		}
		box.addEventListener('click', function (e) {
			var b = e.target.closest('button');
			if (!b) return;
			var w = b.textContent, list = words();
			var i = list.map(function (x) { return x.toLowerCase(); }).indexOf(w.toLowerCase());
			if (i > -1) list.splice(i, 1); else list.push(w);
			input.value = list.join(', ');
			sync();
		});
		input.addEventListener('input', sync);
		sync();
	});

	document.querySelectorAll('a[data-open-style-guide]').forEach(function (a) {
		a.addEventListener('click', function (e) {
			var guide = document.querySelector('.style-guide');
			if (!guide) return;
			e.preventDefault();
			guide.open = true;
			guide.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	});
});
