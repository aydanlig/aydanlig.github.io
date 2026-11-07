/* =========================================================
   crop.js – frame every picture right on the page (secret "Zuschnitt-Modus")

   Visitors: only the saved framings from js/crop-data.js are applied (loaded on every page by js/nav.js).

   Aydan – turn it on:
     – computer: just type   fuchsschere   anywhere on the page (no text field focused)
     – phone:    tap the dark footer 7× quickly
   It stays on while you click through pages, until you press "Beenden".

   In the mode, on any picture:
     – drag the picture              = move what's visible
     – mouse wheel / pinch / slider  = zoom
     – drag the orange bar at the top or bottom edge = make the frame shorter / taller (crop)
     – "Unschärfe-Rand"              = show the whole picture, the empty space left/right (or top/bottom)
                                       is filled with a blurred copy of the picture itself
     – "Zurück" / double-click       = original look
   Desktop and phone are saved separately (window narrower than 700 px = phone).
   "Speichern" writes js/crop-data.js straight to GitHub (needs your GitHub token once, kept only
   in this browser) – or "Datei" downloads it to replace by hand / send to Claude.

   Data per picture: "page|file": { x, y, z, r, b }  x/y = focus in %, z = zoom, r = frame width/height, b = blur fill
   ========================================================= */
(function () {
	if (window.SFP_CROP_JS) return; window.SFP_CROP_JS = 1;
	var CODE = 'fuchsschere', PHONE = 700, REPO = 'aydanlig/aydanlig.github.io', FILE = 'js/crop-data.js';
	var data = window.SFP_CROPS || {}; data.desktop = data.desktop || {}; data.phone = data.phone || {};
	var editing = false, bar, info, tools, active;

	function view() { return window.innerWidth < PHONE ? 'phone' : 'desktop'; }
	function file(img) { return (img.currentSrc || img.src || '').split('?')[0].split('/').pop(); }
	// lightbox pictures share one framing on every page; the English page (/en/…) shares the German one
	function key(img) {
		var p = img.closest('.lightbox') ? '*' : location.pathname.replace(/index\.html$/, '').replace(/^\/en(?=\/)/, '');
		return p + '|' + file(img);
	}
	function norm(c) { return !c ? null : Array.isArray(c) ? { x: c[0], y: c[1], z: c[2] || 1 } : c; }   // old format [x, y, zoom]
	function current(img) {
		var k = key(img), v = view();
		return norm(data[v][k] || data[v === 'phone' ? 'desktop' : 'phone'][k]);
	}
	function ok(img) {
		return img.closest('main, .lightbox') && !img.closest('.site-header, .logo, [data-no-crop]') && !/\.svg$/i.test(file(img));
	}

	// tiny copy of the picture (24 px) – stretched as background it looks like a soft blur of itself
	var stamps = {};
	function stamp(img) {
		var f = file(img);
		if (stamps[f]) return stamps[f];
		try {
			var c = document.createElement('canvas'), w = 24, h = Math.max(1, Math.round(24 * img.naturalHeight / img.naturalWidth));
			c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h);
			return (stamps[f] = c.toDataURL('image/jpeg', 0.7));
		} catch (e) { return ''; }
	}

	function apply(img, c) {
		if (img.dataset.cropDefault === undefined) img.dataset.cropDefault = img.getAttribute('style') || '';
		img.setAttribute('style', img.dataset.cropDefault);
		img.classList.toggle('is-cropped', !!c);
		if (!c) return;
		var s = img.style, z = c.z || 1, x = c.x == null ? 50 : c.x, y = c.y == null ? 50 : c.y;
		if (c.r) { s.setProperty('aspect-ratio', String(c.r), 'important'); s.setProperty('height', 'auto', 'important'); s.setProperty('max-height', 'none', 'important'); }
		if (c.b) {
			s.setProperty('object-fit', 'contain', 'important');
			var bg = img.complete && img.naturalWidth ? stamp(img) : '';
			if (bg) { s.backgroundImage = 'url("' + bg + '")'; s.backgroundSize = 'cover'; s.backgroundPosition = 'center'; }
		} else s.setProperty('object-fit', 'cover', 'important');
		s.objectPosition = x + '% ' + y + '%';
		if (z > 1) {   // zoom: scale up, then clip back to the original box (no wrapper element needed)
			var k = (1 - 1 / z) * 100;
			s.transformOrigin = x + '% ' + y + '%';
			s.transform = 'scale(' + z + ')';
			s.clipPath = 'inset(' + (y * k / 100) + '% ' + ((100 - x) * k / 100) + '% ' + ((100 - y) * k / 100) + '% ' + (x * k / 100) + '%)';
		}
	}
	function applyOne(img) { if (ok(img)) apply(img, current(img)); }
	function applyAll() { document.querySelectorAll('main img, .lightbox img').forEach(applyOne); }

	function init() {
		applyAll();
		// lazy pictures, lightbox, sliders: (re)apply whenever a picture finishes loading
		document.addEventListener('load', function (e) { if (e.target.tagName === 'IMG') { applyOne(e.target); if (editing) makeEditable(e.target); } }, true);
		var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(function () { applyAll(); if (editing) refreshBar(); }, 150); });
		try { if (sessionStorage.getItem('sfp-crop') === '1') startEditing(); } catch (e) {}
		// secret: type the code
		var typed = '';
		document.addEventListener('keydown', function (e) {
			if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
			typed = (typed + (e.key || '')).slice(-CODE.length).toLowerCase();
			if (typed === CODE && !editing) startEditing();
		});
		// secret on the phone: 7 quick taps on the footer
		var taps = [];
		document.addEventListener('click', function (e) {
			if (!e.target.closest || !e.target.closest('.site-footer') || e.target.closest('a, button, input')) return;
			var now = Date.now(); taps = taps.filter(function (t) { return now - t < 2500; }); taps.push(now);
			if (taps.length >= 7 && !editing) { taps = []; startEditing(); }
		});
	}
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

	// ---------------------------------------------------------- edit mode
	function startEditing() {
		editing = true;
		try { sessionStorage.setItem('sfp-crop', '1'); } catch (e) {}
		document.documentElement.classList.add('crop-edit');   // also pauses js/fade.js
		document.querySelectorAll('main img').forEach(makeEditable);
		document.querySelectorAll('.art-grid .fade-stack, .swipe-track').forEach(addSwitcher);
		bar = document.createElement('div');
		bar.className = 'crop-bar';
		bar.innerHTML = '<strong>✂ Zuschnitt</strong> <span class="crop-view"></span>' +
			'<span class="crop-help">Bild antippen → ziehen = verschieben · Rad/Finger = zoomen · orange Kante ziehen = kürzer/länger</span>' +
			'<button type="button" data-act="save">Speichern</button>' +
			'<button type="button" data-act="download">Datei</button>' +
			'<button type="button" data-act="end">Beenden</button><span class="crop-info" aria-live="polite"></span>';
		document.body.appendChild(bar);
		info = bar.querySelector('.crop-info');
		bar.addEventListener('click', function (e) {
			var act = e.target.getAttribute('data-act');
			if (act === 'save') saveGitHub();
			if (act === 'download') download();
			if (act === 'end') { try { sessionStorage.removeItem('sfp-crop'); } catch (er) {} location.reload(); }
		});
		// small toolbar that sits on the selected picture
		tools = document.createElement('div');
		tools.className = 'crop-tools';
		tools.innerHTML = '<span class="crop-edge crop-edge--top" data-edge="top"></span><span class="crop-edge crop-edge--bottom" data-edge="bottom"></span>' +
			'<div class="crop-mini"><input type="range" min="1" max="4" step="0.02" aria-label="Zoom">' +
			'<button type="button" data-t="blur">Unschärfe-Rand</button><button type="button" data-t="reset">Zurück</button></div>';
		document.body.appendChild(tools);
		tools.querySelector('input').addEventListener('input', function () { if (active) set(active, { z: +this.value }); });
		tools.addEventListener('click', function (e) {
			var t = e.target.getAttribute('data-t'); if (!active || !t) return;
			if (t === 'blur') { var c = current(active) || {}; set(active, { b: c.b ? 0 : 1 }); say(c.b ? 'Unschärfe-Rand aus' : 'Unschärfe-Rand an'); }
			if (t === 'reset') { save(active, null); say('Zurückgesetzt'); }
		});
		tools.querySelectorAll('.crop-edge').forEach(edgeDrag);
		window.addEventListener('scroll', place, { passive: true });
		window.addEventListener('resize', place);
		refreshBar();
		say('Zuschnitt-Modus an – tippe ein Bild an.');
	}
	function refreshBar() { if (bar) bar.querySelector('.crop-view').textContent = view() === 'phone' ? '📱 Handy-Ansicht' : '🖥 Computer-Ansicht'; }
	function say(text) { if (!info) return; info.textContent = text; clearTimeout(say.t); say.t = setTimeout(function () { info.textContent = ''; }, 4000); }

	function save(img, c) {
		var k = key(img), v = view();
		if (c) data[v][k] = c; else { delete data.desktop[k]; delete data.phone[k]; }
		document.querySelectorAll('main img, .lightbox img').forEach(function (o) { if (ok(o) && key(o) === k) apply(o, c); });
		place();
	}
	function set(img, patch) {
		var c = Object.assign({ x: 50, y: 50, z: 1 }, current(img) || {}, patch);
		Object.keys(c).forEach(function (n) { c[n] = Math.round(c[n] * 1000) / 1000; if (!c[n] && n !== 'x' && n !== 'y') delete c[n]; });
		save(img, c);
	}

	function select(img) {
		if (active) active.classList.remove('crop-active');
		active = img; img.classList.add('crop-active');
		var c = current(img) || {};
		tools.querySelector('input').value = c.z || 1;
		tools.querySelector('[data-t="blur"]').classList.toggle('on', !!c.b);
		tools.classList.add('show'); place();
	}
	function place() {
		if (!active || !tools) return;
		var r = active.getBoundingClientRect(), s = tools.style;
		s.left = r.left + 'px'; s.top = r.top + 'px'; s.width = r.width + 'px'; s.height = r.height + 'px';
	}

	// drag the top / bottom edge: changes the frame's height (its width stays as the layout wants)
	function edgeDrag(h) {
		h.addEventListener('pointerdown', function (e) {
			if (!active) return;
			e.preventDefault(); h.setPointerCapture(e.pointerId);
			var r = active.getBoundingClientRect(), y0 = e.clientY, top = h.dataset.edge === 'top';
			function move(ev) {
				var hNew = Math.max(40, r.height + (top ? y0 - ev.clientY : ev.clientY - y0));
				set(active, { r: r.width / hNew });
			}
			function up() { h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', up); say('Höhe gespeichert (noch nicht online – „Speichern“)'); }
			h.addEventListener('pointermove', move); h.addEventListener('pointerup', up);
		});
	}

	function makeEditable(img) {
		if (img.dataset.cropEdit || !ok(img)) return;
		img.dataset.cropEdit = '1';
		img.classList.add('crop-target');
		img.draggable = false;
		var pointers = {}, start = null;
		function dist() {
			var p = Object.keys(pointers).map(function (k) { return pointers[k]; });
			return p.length < 2 ? 0 : Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
		}
		img.addEventListener('pointerdown', function (e) {
			if (active !== img) select(img);
			e.preventDefault(); img.setPointerCapture(e.pointerId);
			pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
			start = { c: Object.assign({ x: 50, y: 50, z: 1 }, current(img) || {}), pts: JSON.parse(JSON.stringify(pointers)), dist: dist() };
		});
		img.addEventListener('pointermove', function (e) {
			if (!pointers[e.pointerId] || !start) return;
			pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
			var r = img.getBoundingClientRect(), id = Object.keys(pointers)[0], p0 = start.pts[id], p = pointers[id];
			if (!p0) return;
			var z = start.c.z;
			if (start.dist && dist()) z = clamp(start.c.z * dist() / start.dist, 1, 4);
			// moving right shows more of the left side, like dragging a photo under a window
			set(img, { x: clamp(start.c.x - (p.x - p0.x) / r.width * 100 / z, 0, 100), y: clamp(start.c.y - (p.y - p0.y) / r.height * 100 / z, 0, 100), z: z });
			tools.querySelector('input').value = z;
		});
		function up(e) { delete pointers[e.pointerId]; start = null; }
		img.addEventListener('pointerup', up); img.addEventListener('pointercancel', up);
		img.addEventListener('wheel', function (e) {
			e.preventDefault(); if (active !== img) select(img);
			var c = Object.assign({ z: 1 }, current(img) || {});
			var z = clamp(c.z * (e.deltaY < 0 ? 1.08 : 1 / 1.08), 1, 4);
			set(img, { z: z }); tools.querySelector('input').value = z;
		}, { passive: false });
		img.addEventListener('dblclick', function (e) { e.preventDefault(); save(img, null); say('Zurückgesetzt'); });
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

	// links and the big-picture view stay off while framing (so a tap selects the picture instead)
	document.addEventListener('click', function (e) {
		if (editing && e.target.closest && e.target.closest('main img') && !e.target.closest('.crop-switch')) { e.preventDefault(); e.stopPropagation(); }
	}, true);

	// ---------------------------------------------------------- saving
	function fileText() {
		var head = '/* crop-data.js – written by the secret crop mode (js/crop.js). Don\'t edit by hand.\n' +
			'   "page|picture": { x, y = focus %, z = zoom, r = frame width/height, b = blurred fill }, per view (phone = narrower than 700 px) */\n';
		return head + 'window.SFP_CROPS = ' + JSON.stringify(data, null, '\t') + ';\n';
	}
	function download() {
		var a = document.createElement('a');
		a.href = URL.createObjectURL(new Blob([fileText()], { type: 'text/javascript' }));
		a.download = 'crop-data.js'; a.click();
		say('Heruntergeladen – damit js/crop-data.js ersetzen (oder Claude schicken).');
	}
	// commit js/crop-data.js via the GitHub API. The token is typed by Aydan once and kept only in this browser.
	function saveGitHub() {
		var token;
		try { token = localStorage.getItem('sfp-gh-token'); } catch (e) {}
		if (!token) {
			token = window.prompt('Einmalig: GitHub-Token einfügen (fine-grained, nur dieses Repo, Contents: Read & Write). Bleibt nur in diesem Browser gespeichert.');
			if (!token) return;
			try { localStorage.setItem('sfp-gh-token', token.trim()); } catch (e) {}
		}
		var url = 'https://api.github.com/repos/' + REPO + '/contents/' + FILE, h = { Authorization: 'Bearer ' + token.trim(), Accept: 'application/vnd.github+json' };
		say('Speichere …');
		fetch(url + '?ref=master', { headers: h }).then(function (r) { return r.json(); }).then(function (cur) {
			return fetch(url, { method: 'PUT', headers: h, body: JSON.stringify({
				message: 'Crop mode: new picture framing (' + location.pathname + ')',
				content: btoa(unescape(encodeURIComponent(fileText()))), sha: cur.sha, branch: 'master' }) });
		}).then(function (r) {
			if (r.ok) say('✓ Gespeichert – in ~1 Minute online.');
			else { if (r.status === 401) try { localStorage.removeItem('sfp-gh-token'); } catch (e) {} say('✗ Speichern ging nicht (' + r.status + '). „Datei“ nutzen.'); }
		}).catch(function () { say('✗ Keine Verbindung. „Datei“ nutzen.'); });
	}

	function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }
})();
