/* =========================================================
   crop.js – frame the pictures right on the page ("Zuschnitt-Modus")

   For visitors: applies the saved framings from js/crop-data.js (nothing else happens).

   For Aydan: open the page with  #zuschnitt  at the end of the address, e.g.
   https://smileyfoxyportraits.com/#zuschnitt
     – drag a picture        = move it inside its frame
     – mouse wheel / pinch   = zoom in or out
     – double-click          = back to the default (whole picture)
     – ⇄ on a tile           = next picture of a fading tile / slider
   Desktop and phone are saved separately: make the window narrow (or Ctrl+Shift+M in the
   browser tools) to frame the phone view. When done: "Datei herunterladen" and replace
   js/crop-data.js with it (or "Werte kopieren" and send it to Claude).

   Which pictures can be framed: homepage tiles (.art-grid), the 1 € slider and the review photos.
   ========================================================= */
(function () {
	var TARGETS = '.art-grid img, .swipe-track img, .quote-photos img';
	var PHONE = 700;
	var data = window.SFP_CROPS || { desktop: {}, phone: {} };
	data.desktop = data.desktop || {}; data.phone = data.phone || {};

	function view() { return window.innerWidth < PHONE ? 'phone' : 'desktop'; }
	// the English page (/en/…) shares the framings of its German page
	function key(img) { return location.pathname.replace(/index\.html$/, '').replace(/^\/en(?=\/)/, '') + '|' + img.getAttribute('src').split('/').pop(); }
	function round(n) { return Math.round(n * 10) / 10; }

	// remember how each picture looked before, so "reset" can go back to it
	function rememberDefault(img) {
		if (img.dataset.cropDefault === undefined) img.dataset.cropDefault = img.getAttribute('style') || '';
	}
	function apply(img, c) {
		rememberDefault(img);
		img.setAttribute('style', img.dataset.cropDefault);
		img.classList.toggle('is-cropped', !!c);
		if (!c) return;
		img.style.objectFit = 'cover';
		img.style.objectPosition = c[0] + '% ' + c[1] + '%';
		img.style.transformOrigin = c[0] + '% ' + c[1] + '%';
		img.style.transform = c[2] > 1 ? 'scale(' + c[2] + ')' : '';
	}
	function current(img) {
		var k = key(img), v = view(), other = v === 'phone' ? 'desktop' : 'phone';
		return data[v][k] || data[other][k] || null;   // phone falls back to the desktop framing and vice versa
	}
	function applyAll() { document.querySelectorAll(TARGETS).forEach(function (img) { apply(img, current(img)); }); }

	document.addEventListener('DOMContentLoaded', function () {
		applyAll();
		var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { if (!editing) applyAll(); else refreshBar(); }, 150); });
		if (/zuschnitt/.test(location.hash)) startEditing();
		window.addEventListener('hashchange', function () { if (/zuschnitt/.test(location.hash) && !editing) startEditing(); });
	});

	// ---------------------------------------------------------- edit mode
	var editing = false, bar, info;

	function startEditing() {
		editing = true;
		document.documentElement.classList.add('crop-edit');   // also pauses js/fade.js and the lightbox
		document.querySelectorAll(TARGETS).forEach(makeEditable);
		document.querySelectorAll('.art-grid .fade-stack, .swipe-track').forEach(addSwitcher);
		bar = document.createElement('div');
		bar.className = 'crop-bar';
		bar.innerHTML = '<strong>Zuschnitt-Modus</strong> <span class="crop-view"></span>' +
			'<span class="crop-help">Ziehen = verschieben · Mausrad/Zwei Finger = zoomen · Doppelklick = zurücksetzen</span>' +
			'<button type="button" data-act="copy">Werte kopieren</button>' +
			'<button type="button" data-act="download">Datei herunterladen</button>' +
			'<button type="button" data-act="end">Beenden</button><span class="crop-info" aria-live="polite"></span>';
		document.body.appendChild(bar);
		info = bar.querySelector('.crop-info');
		bar.addEventListener('click', function (e) {
			var act = e.target.getAttribute('data-act');
			if (act === 'copy') copy();
			if (act === 'download') download();
			if (act === 'end') { location.hash = ''; location.reload(); }
		});
		refreshBar();
	}

	function refreshBar() {
		if (!bar) return;
		var n = Object.keys(data[view()]).length;
		bar.querySelector('.crop-view').textContent = 'Ansicht: ' + (view() === 'phone' ? 'Handy' : 'Desktop') + ' · ' + n + ' gerahmt';
	}
	function say(text) { info.textContent = text; clearTimeout(say.t); say.t = setTimeout(function () { info.textContent = ''; }, 3500); }

	function fileText() {
		var src = '/* crop-data.js – written by the crop mode (js/crop.js), ' + new Date().toLocaleString('de-DE') + '.\n' +
			'   Format: "page|picture file": [x %, y %, zoom] per view (phone = narrower than 700 px). */\n';
		return src + 'window.SFP_CROPS = ' + JSON.stringify(data, null, '\t') + ';\n';
	}
	function copy() {
		var text = fileText();
		(navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(
			function () { say('✓ Kopiert – in js/crop-data.js einfügen oder Claude schicken.'); },
			function () { window.prompt('Kopieren mit Strg+C:', text); });
	}
	function download() {
		var a = document.createElement('a');
		a.href = URL.createObjectURL(new Blob([fileText()], { type: 'text/javascript' }));
		a.download = 'crop-data.js';
		document.body.appendChild(a); a.click(); a.remove();
		say('✓ Heruntergeladen – damit js/crop-data.js ersetzen.');
	}

	function save(img, c) {
		var k = key(img), v = view();
		if (c) data[v][k] = [round(c[0]), round(c[1]), round(c[2])];
		else delete data[v][k];
		apply(img, c);
		refreshBar();
	}

	function makeEditable(img) {
		rememberDefault(img);
		img.classList.add('crop-target');
		img.draggable = false;
		var pointers = {}, start = null;

		function state() { return (current(img) || [50, 50, 1]).slice(); }

		img.addEventListener('pointerdown', function (e) {
			if (!isTop(img)) return;
			e.preventDefault();
			img.setPointerCapture(e.pointerId);
			pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
			start = { c: state(), pts: JSON.parse(JSON.stringify(pointers)), dist: dist() };
		});
		img.addEventListener('pointermove', function (e) {
			if (!pointers[e.pointerId] || !start) return;
			pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
			var c = start.c.slice();
			var ids = Object.keys(pointers);
			if (ids.length >= 2 && start.dist) {
				c[2] = clamp(start.c[2] * dist() / start.dist, 1, 5);     // pinch = zoom
			} else {
				// how far the picture can move: the part that sticks out of the frame (cover) plus the zoom
				var p0 = start.pts[e.pointerId] || pointers[e.pointerId], z = c[2];
				var bw = img.offsetWidth, bh = img.offsetHeight, nw = img.naturalWidth || bw, nh = img.naturalHeight || bh;
				var s = Math.max(bw / nw, bh / nh);
				var rangeX = (nw * s - bw) * z + bw * (z - 1), rangeY = (nh * s - bh) * z + bh * (z - 1);
				if (rangeX > 1) c[0] = clamp(start.c[0] - (e.clientX - p0.x) / rangeX * 100, 0, 100);
				if (rangeY > 1) c[1] = clamp(start.c[1] - (e.clientY - p0.y) / rangeY * 100, 0, 100);
			}
			save(img, c);
		});
		function up(e) { delete pointers[e.pointerId]; start = Object.keys(pointers).length ? { c: state(), pts: JSON.parse(JSON.stringify(pointers)), dist: dist() } : null; }
		img.addEventListener('pointerup', up);
		img.addEventListener('pointercancel', up);
		img.addEventListener('wheel', function (e) {
			if (!isTop(img)) return;
			e.preventDefault();
			var c = state();
			c[2] = clamp(c[2] * (e.deltaY < 0 ? 1.08 : 1 / 1.08), 1, 5);
			save(img, c);
		}, { passive: false });
		img.addEventListener('dblclick', function (e) { e.preventDefault(); save(img, null); say('Zurückgesetzt'); });

		function dist() {
			var p = Object.keys(pointers).map(function (k) { return pointers[k]; });
			return p.length < 2 ? 0 : Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
		}
	}

	// in a fading tile only the picture that is showing can be framed
	function isTop(img) {
		var stack = img.closest('.fade-stack');
		return !stack || !stack.classList.contains('js') || img.classList.contains('on');
	}

	// ⇄ button: show the next picture of a fading tile / slide of the slider, so each one can be framed
	function addSwitcher(el) {
		var b = document.createElement('button');
		b.type = 'button'; b.className = 'crop-switch'; b.textContent = '⇄'; b.title = 'Nächstes Bild';
		b.addEventListener('click', function (e) {
			e.preventDefault(); e.stopPropagation();
			if (el.classList.contains('swipe-track')) { el.scrollBy({ left: el.clientWidth }); if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) el.scrollTo({ left: 0 }); return; }
			var imgs = el.querySelectorAll('img'), i = [].indexOf.call(imgs, el.querySelector('img.on'));
			if (!el.classList.contains('js')) { el.classList.add('js'); i = 0; imgs[0].classList.add('on'); }
			imgs[i].classList.remove('on'); imgs[(i + 1) % imgs.length].classList.add('on');
		});
		(el.classList.contains('swipe-track') ? el.parentNode : el.closest('a') || el.parentNode).appendChild(b);
	}

	// links and the big-picture view stay off while framing
	document.addEventListener('click', function (e) {
		if (editing && e.target.closest && e.target.closest('.art-grid a, .swipe-track a, .quote-photos') && !e.target.closest('.crop-switch')) {
			e.preventDefault(); e.stopPropagation();
		}
	}, true);

	function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }
})();
