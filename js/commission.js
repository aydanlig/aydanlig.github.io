/* =========================================================
   commission.js – small helpers for the commission form (DE + EN)
   1. data-show-when="Name=Value": a field is only shown while the radio "Name" has that value
      (photo upload vs. live appointment)
   2. data-feel-chips="input-id": clicking a word adds/removes it in the feeling field
   3. a[data-open-style-guide]: opens the style guide box before jumping to it
   ========================================================= */
document.addEventListener('DOMContentLoaded', function () {
	document.querySelectorAll('form').forEach(function (form) {
		var parts = form.querySelectorAll('[data-show-when]');
		if (!parts.length) return;
		function update() {
			parts.forEach(function (el) {
				var rule = el.getAttribute('data-show-when').split('=');
				var checked = form.querySelector('input[name="' + rule[0] + '"]:checked');
				var show = !!checked && checked.value === rule.slice(1).join('=');
				el.hidden = !show;
				// hidden fields are not sent along, so the email only shows what applies
				el.querySelectorAll('input, select, textarea').forEach(function (f) { f.disabled = !show; });
			});
		}
		form.addEventListener('change', update);
		update();
	});

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
