/* =========================================================
   bestellt.js – pay page after a portrait order (/bestellt.html, /en/bestellt.html)
   Reads ?nr=SFP-…&sum=63.90 from the link (the order form and the confirmation e-mail put it there).
   PayPal opens with amount + order number filled in. SumUp links can't take an amount,
   so there the amount is copied on tap.
   ========================================================= */
(function () {
	var EN = (document.documentElement.lang || '').indexOf('en') === 0;
	var q = new URLSearchParams(location.search);
	var nr = (q.get('nr') || '').replace(/[^A-Z0-9-]/gi, '').slice(0, 24);
	var sum = parseFloat(q.get('sum'));
	if (!(sum > 0 && sum < 5000)) sum = null;

	var money = function (n) { return EN ? '€' + n.toFixed(2) : n.toFixed(2).replace('.', ',') + ' €'; };
	document.querySelectorAll('[data-order-nr]').forEach(function (el) { if (nr) el.textContent = nr; });
	document.querySelectorAll('[data-order-nr-plain]').forEach(function (el) { el.textContent = nr ? '(' + nr + ')' : ''; });
	document.querySelectorAll('[data-order-sum]').forEach(function (el) { if (sum) el.textContent = money(sum); });

	var paypal = document.querySelector('[data-pay-paypal]');
	if (paypal && sum) {
		paypal.addEventListener('click', function (e) {
			e.preventDefault();
			location.href = 'https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=' + encodeURIComponent(paypal.getAttribute('data-paypal')) +
				'&item_name=' + encodeURIComponent((EN ? 'Portrait order ' : 'Porträt-Bestellung ') + (nr || 'SmileyFoxyPortraits')) +
				(nr ? '&item_number=' + encodeURIComponent(nr) : '') +
				'&amount=' + sum.toFixed(2) + '&currency_code=EUR&no_shipping=1&lc=' + (EN ? 'GB' : 'DE');
		});
	}

	var card = document.querySelector('[data-pay-card]');
	var copied = document.querySelector('[data-pay-copied]');
	if (card && sum && navigator.clipboard) {
		card.addEventListener('click', function (e) {
			e.preventDefault();
			var go = function () { location.href = card.href; };
			navigator.clipboard.writeText(sum.toFixed(2)).then(function () {
				copied.textContent = EN ? '✓ ' + sum.toFixed(2) + ' copied – just paste it into the amount field in the next window.'
					: '✓ ' + sum.toFixed(2) + ' € kopiert – im nächsten Fenster einfach ins Betragsfeld einfügen.';
				copied.hidden = false;
				setTimeout(go, 1200);
			}, go);
		});
	}
})();
