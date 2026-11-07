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
		tooBig: 'This photo is too big to send (max. 3 MB, e.g. HEIC from an iPhone). Please pick a JPEG or a screenshot of it.',
		remove: 'Remove',
		photoBusy: 'Preparing photo …',
		base: 'Portrait', people: 'extra person/pet', peopleN: 'extra people/pets',
		ship: 'Shipping', pickup: 'Pick-up in Berlin', digital: 'Digital only (scan)',
		discount: 'Discount card', total: 'Total', none: '–',
		subject: 'New ORDER',
		now: 'now', afterSketch: 'after the sketch', afterLines: 'after the linework', payNow: 'Due now',
		auto: function (nr, sum, plan) {
			return 'Thank you for your order! Order number: ' + nr + ' · Total: ' + sum +
				'\n\nYour payments:\n' + plan +
				'\n\nI start painting as soon as the first payment is in. Before each next payment you get a photo of the sketch or linework, ' +
				'and before I send the portrait, a photo of the finished piece. ' +
				'Questions? Just reply to this e-mail.\n\nAydan · SmileyFoxyPortraits';
		},
		thanks: '/en/bestellt.html', money: function (n) { return '€' + n.toFixed(2); }
	} : {
		next: 'Weiter', back: 'Zurück', step: 'Schritt', of: 'von',
		pickSize: 'Bitte wähle zuerst Größe und Stil.',
		needPhoto: 'Bitte lade mindestens ein Foto hoch – danach male ich.',
		tooMany: 'Höchstens 3 Fotos – die übrigen wurden weggelassen.',
		tooBig: 'Dieses Foto ist zu groß zum Senden (max. 3 MB, z. B. HEIC vom iPhone). Bitte wähle ein JPEG oder einen Screenshot davon.',
		remove: 'Entfernen',
		photoBusy: 'Foto wird vorbereitet …',
		base: 'Porträt', people: 'weitere Person/Tier', peopleN: 'weitere Personen/Tiere',
		ship: 'Versand', pickup: 'Abholung in Berlin', digital: 'Nur digital (Scan)',
		discount: 'Rabattkarte', total: 'Gesamt', none: '–',
		subject: 'Neue BESTELLUNG',
		now: 'jetzt', afterSketch: 'nach der Skizze', afterLines: 'nach der Linework', payNow: 'Jetzt zu zahlen',
		auto: function (nr, sum, plan) {
			return 'Danke für deine Bestellung! Bestellnummer: ' + nr + ' · Gesamt: ' + sum +
				'\n\nDeine Zahlungen:\n' + plan +
				'\n\nSobald die erste Zahlung da ist, fange ich an zu malen. Vor jeder weiteren Zahlung bekommst du ein Foto von der Skizze bzw. der Linework, ' +
				'und bevor ich das Porträt verschicke, ein Foto vom fertigen Bild. ' +
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
		if (!size) return { size: size, ready: false, lines: [], total: 0 };

		// the price shows as soon as a size is picked: without a style yet, the cheapest style counts
		var base;
		if (style) {
			base = num(style.getAttribute('data-' + size));
			lines.push([T.base + ' ' + size.toUpperCase() + ' · ' + style.getAttribute('data-label'), base]);
		} else {
			base = Math.min.apply(null, $$('[name="Stil"]').map(function (r) { return num(r.getAttribute('data-' + size)); }));
			lines.push([T.base + ' ' + size.toUpperCase(), base]);
		}
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
			var colour = frame.hasAttribute('data-frame-custom') ? null : $('[name="Rahmenfarbe"]:checked');
			lines.push([frame.getAttribute('data-label') + (colour ? ' (' + colour.getAttribute('data-label') + ')' : ''), num(frame.getAttribute('data-price'))]);
			total += num(frame.getAttribute('data-price'));
		}

		$$('[data-extra]').forEach(function (box) {
			if (!box.checked || box.disabled) return;
			lines.push([box.getAttribute('data-label'), num(box.getAttribute('data-price'))]);
			total += num(box.getAttribute('data-price'));
		});

		// delivery only counts once it is chosen (pick-up is free)
		var del = $('[name="Lieferung"]');
		var opt = del.selectedIndex > -1 ? del.options[del.selectedIndex] : null;
		if (opt && opt.value) {
			var ship = num(framed && opt.getAttribute('data-price-framed') ? opt.getAttribute('data-price-framed') : opt.getAttribute('data-price'));
			lines.push([opt.getAttribute('data-label'), ship]);
			total += ship;
		}

		var card = $('[name="Rabattkarte"]');
		if (card && card.checked) {
			lines.push([T.discount, num(card.getAttribute('data-price'))]);
			total += num(card.getAttribute('data-price'));
		}
		return { size: size, ready: true, lines: lines, total: Math.max(0, total), framed: framed, frame: frame,
			shipping: !!(opt && opt.hasAttribute('data-address')), scanOnly: !!(opt && /Scan/.test(opt.value)) };
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
		var custom = !!(s.frame && s.frame.hasAttribute('data-frame-custom'));   // grandpa's frame: wishes instead of a colour
		if (colours) {
			var showC = s.framed && !custom;
			colours.hidden = !showC;
			$$('input', colours).forEach(function (i) { i.disabled = !showC; });   // no colour in the e-mail without a frame
		}
		var wish = $('[data-frame-wish]');
		if (wish) { wish.hidden = !custom; $$('textarea', wish).forEach(function (t) { t.disabled = !custom; }); }
		// scan only + a frame: ask whether the frame should stay
		var sf = $('[data-scan-frame]');
		if (sf) sf.hidden = !(s.scanOnly && s.framed && !keepFrame);
		// tier: show what's included once one is picked
		var tier = $('[name="Rundum-Behandlung"]:checked'), tbox = $('[data-tier-box]');
		if (tbox) {
			var info = tier && tier.getAttribute('data-tier-info');
			tbox.hidden = !info;
			tbox.textContent = info || '';
		}
		// quick extras under the price box mirror the real checkboxes in step 2
		$$('[data-mirror]', document).forEach(function (m) {
			var real = $('input[name="' + m.getAttribute('data-mirror') + '"]');
			if (real) m.checked = real.checked;
		});
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

		// payment plan: each card shows its own amounts, the price box shows what is due now
		s.parts = parts(s.total, planShare());
		$$('[name="Zahlungsweise"]').forEach(function (r) {
			var out = r.closest('label').querySelector('[data-plan-amount]');
			if (out) out.textContent = s.ready ? parts(s.total, num(r.getAttribute('data-share'))).map(function (p) { return T.money(p[0]) + ' ' + p[1]; }).join(' · ') : '';
		});
		$$('[data-order-now]', document).forEach(function (el) {
			el.textContent = s.ready ? T.money(s.parts[0][0]) : T.none;
			var row = el.closest('[data-order-now-row]');
			if (row) row.hidden = !s.ready || s.parts.length === 1;
		});
		return s;
	}
	/* Payment plan (radio name="Zahlungsweise" data-share="100|50|20"):
	   100 % now · or 50 % now + 50 % after the linework · or 20 % now + 30 % after the sketch + 50 % after the linework */
	function planShare() {
		var r = $('[name="Zahlungsweise"]:checked');
		return r ? num(r.getAttribute('data-share')) : 100;
	}
	function parts(total, share) {
		var cents = Math.round(total * 100), at = function (p) { return Math.round(cents * p / 100); };
		if (share === 20) return [[at(20) / 100, T.now], [(at(50) - at(20)) / 100, T.afterSketch], [(cents - at(50)) / 100, T.afterLines]];
		if (share === 50) return [[at(50) / 100, T.now], [(cents - at(50)) / 100, T.afterLines]];
		return [[cents / 100, T.now]];
	}

	function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

	var keepFrame = false;
	form.addEventListener('change', function (e) {
		var m = e.target.closest('[data-mirror]');
		if (m) {
			var real = $('input[name="' + m.getAttribute('data-mirror') + '"]');
			if (real) { real.checked = m.checked; real.dispatchEvent(new Event('change', { bubbles: true })); return; }
		}
		if (e.target.name === 'Lieferung' || e.target.name === 'Rahmen') keepFrame = false;
		render();
	});
	form.addEventListener('input', function (e) { if (!e.target.closest('[data-mirror]')) render(); });   // mirrors are handled on change
	form.addEventListener('click', function (e) {
		if (e.target.closest('[data-keep-frame]')) { keepFrame = true; render(); }
		if (e.target.closest('[data-drop-frame]')) {
			var none = $('[name="Rahmen"][data-price="0"]');
			if (none) { none.checked = true; render(); }
		}
	});

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
			if (!fields[k].checkValidity()) { if (!quiet) flag(fields[k], step); return false; }
		}
		if (step.hasAttribute('data-photo-step') && !photos.length && hasDataTransfer) {
			if (quiet) return false;
			drop.setCustomValidity(T.needPhoto); drop.reportValidity();
			drop.addEventListener('change', function () { drop.setCustomValidity(''); }, { once: true });
			return false;
		}
		return true;
	}

	// A missing field: turn it (and every other empty required field in this step) red and scroll it to the middle of the screen
	function flag(field, step) {
		$$('input, select, textarea', step).forEach(function (f) {
			if (f.willValidate && !f.checkValidity()) mark(f, true);
		});
		var box = field.closest('label, .order-card') || field;
		var r = box.getBoundingClientRect();
		window.scrollTo({ top: Math.max(0, r.top + window.pageYOffset - window.innerHeight / 2 + r.height / 2), behavior: 'smooth' });
		setTimeout(function () { field.focus({ preventScroll: true }); field.reportValidity(); }, 350);
	}
	function mark(f, on) {
		var group = f.type === 'radio' ? $$('[name="' + f.name + '"]', form) : [f];
		group.forEach(function (g) {
			g.classList.toggle('is-missing', on);
			var l = g.closest('label');
			if (l) l.classList.toggle('is-missing', on);
		});
	}
	function unmark(e) {
		var t = e.target;
		if (t.classList && t.classList.contains('is-missing') && t.checkValidity()) mark(t, false);
	}
	form.addEventListener('change', unmark);
	form.addEventListener('input', unmark);

	/* ---------------- photos ----------------
	   One friendly drop zone (no name = not sent itself). Photos are shrunk in the browser
	   (max 1800 px, JPEG) so even big phone photos upload fast, then put into the hidden
	   inputs Foto 1–3, which formsubmit sends as attachments. */
	var drop = $('[data-photo-drop]');
	var slots = $$('[data-photo-slot]');
	var list = $('[data-photo-list]');
	var note = $('[data-photo-note]');
	var photos = [];
	var MAX_PHOTO = 3 * 1024 * 1024;   // 3 photos x 3 MB stays under formsubmit's 10 MB limit
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
			var item = { file: f, ready: shrink(f).then(function (small) {
				item.file = small; item.done = true;
				// formsubmit takes max. 10 MB per submission – a photo that couldn't be shrunk (HEIC etc.) is dropped
				if (small.size > MAX_PHOTO) { photos.splice(photos.indexOf(item), 1); note.textContent = T.tooBig; }
				sync();
			}) };
			photos.push(item);
		});
		sync();
	}

	function shrink(file) {
		return new Promise(function (resolve) {
			if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 400 * 1024) return resolve(file);
			var img = new Image(), url = URL.createObjectURL(file);
			img.onload = function () {
				var max = 1600, w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, max / Math.max(w, h));
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
			if (!valid(steps[k], true)) { e.preventDefault(); go(k, false); valid(steps[k]); return; }
		}
		// photos still being shrunk: wait for them, otherwise the full-size originals get uploaded
		var pending = photos.filter(function (p) { return !p.done; });
		if (pending.length) {
			e.preventDefault();
			Promise.all(photos.map(function (p) { return p.ready; })).then(function () {
				if (form.requestSubmit) form.requestSubmit(); else form.submit();
			});
			return;
		}
		var s = render();
		var d = new Date();
		var nr = 'SFP-' + String(d.getFullYear()).slice(2) + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2) +
			'-' + Math.random().toString(36).slice(2, 6).toUpperCase();
		var sum = T.money(s.total);
		// one pay link per instalment (same pay page, part number + amount in the link)
		var links = s.parts.map(function (p, i) {
			return location.origin + T.thanks + '?nr=' + encodeURIComponent(nr) + '&sum=' + p[0].toFixed(2) +
				(s.parts.length > 1 ? '&part=' + (i + 1) + '&of=' + s.parts.length + '&total=' + s.total.toFixed(2) : '');
		});
		var plan = s.parts.map(function (p, i) { return (i + 1) + '. ' + T.money(p[0]) + ' ' + p[1] + ': ' + links[i]; }).join('\n');
		set('Bestellnummer', nr);
		set('Gesamtpreis', sum);
		set('Jetzt zu zahlen', T.money(s.parts[0][0]));
		set('Zahlungsplan', plan.replace(/\n/g, ' | '));
		set('Preisaufstellung', s.lines.map(function (l) { return l[0] + ': ' + T.money(l[1]); }).join(' | '));
		set('_subject', T.subject + ' ' + nr + ' – ' + sum + (s.parts.length > 1 ? ' (' + planShare() + ' % vorab)' : ''));
		set('_next', links[0]);
		set('_autoresponse', T.auto(nr, sum, plan));
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
