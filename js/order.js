/* =========================================================
   order.js – self-serve portrait order (commission.html + /en/commission.html)

   The customer goes through 4 steps, sees the live price the whole time,
   uploads reference photos and gives every detail I need. On "Zahlungspflichtig bestellen"
   the order is e-mailed to me via formsubmit.co, the customer gets a confirmation e-mail
   (with order number, price and pay link), and lands on /bestellt.html to pay right away.

   PRICES live in the HTML (data-price="…" on the inputs), not here:
   - size/style:   <input name="Stil" data-a5="20" data-a4="40">
   - frame:        <input name="Rahmen" data-price="10">
   - extras:       <input type="checkbox" data-price="10">  (data-only="a5" = only for A5)
   - extra people: <input name="Personen pro Bild" data-a5="10" data-a4="20">
   - delivery:     <option data-price="4.90" data-price-framed="6.90">
   - discount:     <input name="Rabattkarte" data-price="-5">
   Change the number in the HTML AND in the visible text next to it.

   Without JavaScript the form still works: all steps are shown at once and it sends normally.
   ========================================================= */
(function () {
	var form = document.querySelector('[data-order]');
	if (!form) return;

	var EN = (document.documentElement.lang || '').indexOf('en') === 0;
	var T = EN ? {
		next: 'Next', back: 'Back', step: 'Step', of: 'of',
		pickSize: 'Please pick a size and style first.',
		needPhoto: 'Please add at least one photo – I paint from it.',
		tooMany: 'Up to 3 photos – the rest were left out.',
		remove: 'Remove',
		photoBusy: 'Preparing photo …',
		base: 'Portrait', people: 'extra person/pet', peopleN: 'extra people/pets',
		ship: 'Shipping', pickup: 'Pick-up in Berlin', digital: 'Digital only (scan)',
		discount: 'Discount card', total: 'Total', none: '–',
		subject: 'New ORDER',
		auto: function (nr, sum, link) {
			return 'Thank you for your order! Order number: ' + nr + ' · Total: ' + sum +
				'\n\nIf you haven’t paid yet, you can do it here: ' + link +
				'\n\nI start painting as soon as the payment is in. Before I send the portrait, you get a photo of it by e-mail. ' +
				'Questions? Just reply to this e-mail.\n\nAydan · SmileyFoxyPortraits';
		},
		thanks: '/en/bestellt.html', money: function (n) { return '€' + n.toFixed(2); }
	} : {
		next: 'Weiter', back: 'Zurück', step: 'Schritt', of: 'von',
		pickSize: 'Bitte wähle zuerst Größe und Stil.',
		needPhoto: 'Bitte lade mindestens ein Foto hoch – danach male ich.',
		tooMany: 'Höchstens 3 Fotos – die übrigen wurden weggelassen.',
		remove: 'Entfernen',
		photoBusy: 'Foto wird vorbereitet …',
		base: 'Porträt', people: 'weitere Person/Tier', peopleN: 'weitere Personen/Tiere',
		ship: 'Versand', pickup: 'Abholung in Berlin', digital: 'Nur digital (Scan)',
		discount: 'Rabattkarte', total: 'Gesamt', none: '–',
		subject: 'Neue BESTELLUNG',
		auto: function (nr, sum, link) {
			return 'Danke für deine Bestellung! Bestellnummer: ' + nr + ' · Gesamt: ' + sum +
				'\n\nFalls du noch nicht bezahlt hast, geht das hier: ' + link +
				'\n\nSobald die Zahlung da ist, fange ich an zu malen. Bevor ich das Porträt verschicke, bekommst du ein Foto davon per E-Mail. ' +
				'Fragen? Antworte einfach auf diese E-Mail.\n\nAydan · SmileyFoxyPortraits';
		},
		thanks: '/bestellt.html',
		money: function (n) { return n.toFixed(2).replace('.', ',') + ' €'; }
	};

	var $ = function (sel, root) { return (root || form).querySelector(sel); };
	var $$ = function (sel, root) { return Array.prototype.slice.call((root || form).querySelectorAll(sel)); };
	var num = function (v) { return parseFloat(v) || 0; };

	/* ---------------- price ---------------- */
	function state() {
		var size = ($('[name="Größe"]:checked') || {}).value === 'A5' ? 'a5' : ($('[name="Größe"]:checked') ? 'a4' : null);
		var style = $('[name="Stil"]:checked');
		var lines = [], total = 0;
		if (!size || !style) return { size: size, ready: false, lines: [], total: 0 };

		var base = num(style.getAttribute('data-' + size));
		lines.push([T.base + ' ' + size.toUpperCase() + ' · ' + style.getAttribute('data-label'), base]);
		total += base;

		var people = Math.max(1, parseInt($('[name="Personen pro Bild"]').value, 10) || 1) - 1;
		if (people) {
			var pp = num($('[name="Personen pro Bild"]').getAttribute('data-' + size)) * people;
			lines.push(['+ ' + people + ' ' + (people === 1 ? T.people : T.peopleN), pp]);
			total += pp;
		}

		var frame = $('[name="Rahmen"]:checked');
		var framed = frame && num(frame.getAttribute('data-price')) > 0;
		if (framed) {
			var colour = $('[name="Rahmenfarbe"]:checked');
			lines.push([frame.getAttribute('data-label') + (colour ? ' (' + colour.getAttribute('data-label') + ')' : ''), num(frame.getAttribute('data-price'))]);
			total += num(frame.getAttribute('data-price'));
		}

		$$('[data-extra]').forEach(function (box) {
			if (!box.checked || box.disabled) return;
			lines.push([box.getAttribute('data-label'), num(box.getAttribute('data-price'))]);
			total += num(box.getAttribute('data-price'));
		});

		var del = $('[name="Lieferung"]');
		var opt = del.options[del.selectedIndex];
		var ship = num(framed && opt.getAttribute('data-price-framed') ? opt.getAttribute('data-price-framed') : opt.getAttribute('data-price'));
		lines.push([opt.getAttribute('data-label'), ship]);
		total += ship;

		var card = $('[name="Rabattkarte"]');
		if (card && card.checked) {
			lines.push([T.discount, num(card.getAttribute('data-price'))]);
			total += num(card.getAttribute('data-price'));
		}
		return { size: size, ready: true, lines: lines, total: Math.max(0, total), framed: framed, shipping: opt.hasAttribute('data-address') };
	}

	var summaries = $$('[data-order-summary]', document);
	var totals = $$('[data-order-total]', document);
	function render() {
		var s = state();

		// A5-only extras (marker highlights) switch off for A4
		$$('[data-only]').forEach(function (box) {
			var ok = !s.size || box.getAttribute('data-only') === s.size;
			box.disabled = !ok;
			if (!ok) box.checked = false;
			box.closest('label').classList.toggle('is-off', !ok);
		});
		// style price labels follow the size
		$$('[name="Stil"]').forEach(function (r) {
			var tag = r.closest('label').querySelector('[data-style-price]');
			if (tag) tag.textContent = s.size ? T.money(num(r.getAttribute('data-' + s.size))).replace(/[.,]00/, '') : '';
		});
		// extra-person price follows the size
		var pp = $('[data-people-price]');
		if (pp) pp.textContent = T.money(num($('[name="Personen pro Bild"]').getAttribute('data-' + (s.size || 'a4')))).replace(/[.,]00/, '');
		// frame colour only with a frame
		var colours = $('[data-frame-colours]');
		if (colours) {
			colours.hidden = !s.framed;
			$$('input', colours).forEach(function (i) { i.disabled = !s.framed; });   // no colour in the e-mail without a frame
		}
		// address only when it gets shipped
		var addr = $('[data-address-fields]');
		if (addr) {
			addr.hidden = !s.shipping;
			$$('input[data-needed]', addr).forEach(function (i) { i.required = !!s.shipping; });
		}

		var html = s.ready ? s.lines.map(function (l) {
			return '<li><span>' + esc(l[0]) + '</span><strong>' + (l[1] < 0 ? '− ' + T.money(-l[1]) : T.money(l[1])) + '</strong></li>';
		}).join('') : '<li class="hint">' + T.pickSize + '</li>';
		summaries.forEach(function (el) { el.innerHTML = html; });
		totals.forEach(function (el) { el.textContent = s.ready ? T.money(s.total) : T.none; });
		return s;
	}
	function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

	form.addEventListener('change', render);
	form.addEventListener('input', render);

	// "Bestellen" buttons on the price cards pre-pick the size: <a href="#bestellen" data-order-size="A5">
	$$('[data-order-size]', document).forEach(function (a) {
		a.addEventListener('click', function () {
			var r = $('[name="Größe"][value="' + a.getAttribute('data-order-size') + '"]');
			if (r) { r.checked = true; go(0); render(); }
		});
	});

	/* ---------------- steps ---------------- */
	var steps = $$('[data-step]');
	var dots = $$('[data-step-dot]');
	var current = 0;
	form.classList.add('order--steps');
	form.noValidate = true;   // the steps check themselves (the browser can't point at fields in hidden steps)

	steps.forEach(function (step, i) {
		var nav = document.createElement('div');
		nav.className = 'order-nav';
		if (i > 0) nav.innerHTML += '<button type="button" class="btn btn--ghost" data-back>← ' + T.back + '</button>';
		if (i < steps.length - 1) nav.innerHTML += '<button type="button" class="btn" data-next>' + T.next + ' →</button>';
		if (nav.innerHTML) {
			var submitRow = $('.order-submit', step);
			if (submitRow) submitRow.insertBefore(nav.firstChild, submitRow.firstChild);
			else step.appendChild(nav);
		}
	});
	form.addEventListener('click', function (e) {
		if (e.target.closest('[data-next]')) { if (valid(steps[current])) go(current + 1, true); }
		if (e.target.closest('[data-back]')) go(current - 1, true);
	});
	dots.forEach(function (dot, i) {
		dot.addEventListener('click', function () {
			// jump back freely, forward only through valid steps
			for (var k = current; k < i; k++) { if (!valid(steps[k])) { go(k, true); return; } }
			go(i, true);
		});
	});

	function go(i, scroll) {
		current = Math.max(0, Math.min(steps.length - 1, i));
		steps.forEach(function (s, k) { s.hidden = k !== current; });
		dots.forEach(function (d, k) {
			d.classList.toggle('is-on', k === current);
			d.classList.toggle('is-done', k < current);
			d.setAttribute('aria-current', k === current ? 'step' : 'false');
		});
		if (scroll) {
			var top = form.getBoundingClientRect().top + window.pageYOffset - 90;
			if (window.pageYOffset > top) window.scrollTo({ top: top, behavior: 'smooth' });
			var h = steps[current].querySelector('legend, h3');
			if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
		}
	}

	function valid(step, quiet) {
		var fields = $$('input, select, textarea', step).filter(function (f) { return !f.closest('[hidden]:not([data-step])') && f.willValidate; });
		for (var k = 0; k < fields.length; k++) {
			if (!fields[k].checkValidity()) { if (!quiet) fields[k].reportValidity(); return false; }
		}
		if (step.hasAttribute('data-photo-step') && !photos.length && hasDataTransfer) {
			if (quiet) return false;
			drop.setCustomValidity(T.needPhoto); drop.reportValidity();
			drop.addEventListener('change', function () { drop.setCustomValidity(''); }, { once: true });
			return false;
		}
		return true;
	}

	/* ---------------- photos ----------------
	   One friendly drop zone (no name = not sent itself). Photos are shrunk in the browser
	   (max 1800 px, JPEG) so even big phone photos upload fast, then put into the hidden
	   inputs Foto 1–3, which formsubmit sends as attachments. */
	var drop = $('[data-photo-drop]');
	var slots = $$('[data-photo-slot]');
	var list = $('[data-photo-list]');
	var note = $('[data-photo-note]');
	var photos = [];
	var hasDataTransfer = (function () { try { return !!new DataTransfer(); } catch (e) { return false; } })();

	if (drop && hasDataTransfer) {
		form.classList.add('order--js-photos');   // CSS: hide the plain slots, show the drop zone
		var zone = drop.closest('.photo-drop');
		drop.addEventListener('change', function () { add(drop.files); drop.value = ''; });
		['dragenter', 'dragover'].forEach(function (ev) { zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add('is-over'); }); });
		['dragleave', 'drop'].forEach(function (ev) { zone.addEventListener(ev, function () { zone.classList.remove('is-over'); }); });
		zone.addEventListener('drop', function (e) { e.preventDefault(); add(e.dataTransfer.files); });
	}

	function add(files) {
		var incoming = Array.prototype.filter.call(files, function (f) { return /^image\//.test(f.type) || /\.(heic|heif)$/i.test(f.name); });
		var room = slots.length - photos.length;
		note.textContent = incoming.length > room ? T.tooMany : '';
		incoming.slice(0, room).forEach(function (f) {
			var item = { file: f, ready: shrink(f).then(function (small) { item.file = small; sync(); }) };
			photos.push(item);
		});
		sync();
	}

	function shrink(file) {
		return new Promise(function (resolve) {
			if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 700 * 1024) return resolve(file);
			var img = new Image(), url = URL.createObjectURL(file);
			img.onload = function () {
				var max = 1800, w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, max / Math.max(w, h));
				var c = document.createElement('canvas');
				c.width = Math.round(w * k); c.height = Math.round(h * k);
				c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
				URL.revokeObjectURL(url);
				c.toBlob(function (blob) {
					if (!blob || blob.size >= file.size) return resolve(file);
					resolve(new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }));
				}, 'image/jpeg', 0.86);
			};
			img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };
			img.src = url;
		});
	}

	function sync() {
		slots.forEach(function (slot, i) {
			var dt = new DataTransfer();
			if (photos[i]) dt.items.add(photos[i].file);
			slot.files = dt.files;
		});
		list.innerHTML = '';
		photos.forEach(function (p, i) {
			var li = document.createElement('li');
			var img = document.createElement('img');
			img.alt = p.file.name;
			img.src = URL.createObjectURL(p.file);
			img.onload = function () { URL.revokeObjectURL(img.src); };
			var del = document.createElement('button');
			del.type = 'button';
			del.className = 'photo-remove';
			del.setAttribute('aria-label', T.remove + ': ' + p.file.name);
			del.textContent = '×';
			del.addEventListener('click', function () { photos.splice(i, 1); note.textContent = ''; sync(); });
			li.appendChild(img); li.appendChild(del);
			list.appendChild(li);
		});
		var zone = drop && drop.closest('.photo-drop');
		if (zone) zone.hidden = photos.length >= slots.length;
		if (photos.length) drop.setCustomValidity('');
	}

	/* ---------------- sending ---------------- */
	form.addEventListener('submit', function (e) {
		for (var k = 0; k < steps.length; k++) {
			if (!valid(steps[k], true)) { e.preventDefault(); go(k, true); valid(steps[k]); return; }
		}
		var s = render();
		var d = new Date();
		var nr = 'SFP-' + String(d.getFullYear()).slice(2) + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) +
			'-' + Math.random().toString(36).slice(2, 6).toUpperCase();
		var sum = T.money(s.total);
		var payLink = location.origin + T.thanks + '?nr=' + encodeURIComponent(nr) + '&sum=' + s.total.toFixed(2);
		set('Bestellnummer', nr);
		set('Gesamtpreis', sum);
		set('Preisaufstellung', s.lines.map(function (l) { return l[0] + ': ' + T.money(l[1]); }).join(' | '));
		set('_subject', T.subject + ' ' + nr + ' – ' + sum);
		set('_next', payLink);
		set('_autoresponse', T.auto(nr, sum, payLink));
		set('_replyto', ($('[name="email"]') || {}).value || '');
		try { sessionStorage.setItem('sfp-order', JSON.stringify({ nr: nr, sum: s.total, lines: s.lines })); } catch (err) { /* private mode: page still works from the link */ }
	});
	function set(name, value) {
		var f = $('input[name="' + name + '"]');
		if (!f) { f = document.createElement('input'); f.type = 'hidden'; f.name = name; form.appendChild(f); }
		f.value = value;
	}

	// phones: price bar starts folded (tap to see the breakdown)
	if (window.matchMedia && window.matchMedia('(max-width: 860px)').matches) {
		$$('.order-sum').forEach(function (d) { d.open = false; });
	}
	go(0);
	render();
})();
