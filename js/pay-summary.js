/* =========================================================
   pay-summary.js – checkout-style summary on /bezahlen.html (+ /en/)
   Lists what was picked (size, style, packaging, donation) as receipt lines
   above the total. Reads the chips/inputs only; the totals themselves come
   from the inline script on the page (#pay-sum).
   ========================================================= */
(function () {
	var EN = (document.documentElement.lang || '').indexOf('en') === 0;
	function eur(n) {
		var v = n.toLocaleString(EN ? 'en-GB' : 'de-DE', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
		return EN ? '€' + v : v + ' €';
	}
	function num(s) { return parseFloat(String(s).replace(',', '.')) || 0; }
	document.addEventListener('DOMContentLoaded', function () {
		var list = document.getElementById('pay-lines');
		var sum = document.getElementById('pay-sum');
		if (!list || !sum) return;
		function typed(g) { var i = document.querySelector('[data-custom="' + g + '"]'); return i && i.value !== '' ? num(i.value) : null; }
		function on(g) { return document.querySelector('[data-group="' + g + '"] .chip.on'); }
		function render() {
			var lines = [], base = 0;
			var t = typed('size'), s = on('size');
			if (t !== null) { base = t; lines.push([EN ? 'Portrait (as agreed)' : 'Porträt (wie abgesprochen)', t]); }
			else if (s) { base = num(s.getAttribute('data-price')); lines.push([(EN ? 'Portrait ' : 'Porträt ') + s.textContent.split('·')[0].trim(), base]); }
			var st = on('style'), stepHidden = document.querySelector('[data-style-step]');
			if (st && !(stepHidden && stepHidden.hidden)) { var p = num(st.getAttribute('data-price')); base += p; lines.push([st.getAttribute('data-name'), p]); }
			var pack = document.getElementById('pay-pack');
			if (pack && pack.checked) lines.push([EN ? 'Packaging' : 'Verpackung', num(pack.getAttribute('data-price'))]);
			var tt = typed('tip'), tip = on('tip'), tv = 0;
			if (tt !== null) tv = tt; else if (tip) tv = Math.round(base * num(tip.getAttribute('data-pct'))) / 100;
			if (tv > 0) lines.push([EN ? 'Donation ♥' : 'Spende ♥', tv]);
			list.innerHTML = lines.map(function (l) { return '<li><span>' + l[0] + '</span><span>' + eur(l[1]) + '</span></li>'; }).join('');
			list.hidden = !lines.length;
		}
		new MutationObserver(render).observe(sum, { childList: true, characterData: true, subtree: true });
		document.addEventListener('click', function () { setTimeout(render, 0); });
		document.addEventListener('input', function () { setTimeout(render, 0); });
		render();
	});
})();
