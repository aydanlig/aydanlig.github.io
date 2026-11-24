/* =========================================================
   gallery.js – click a thumbnail to see it large (lightbox)

   HTML:  <div data-lightbox> <a href="large.jpg"><img src="small.jpg" alt="…"></a> … </div>
   Series: <div data-set> <a href="1.jpg"><img …></a> <a href="2.jpg" data-alt="…" data-caption="…" hidden></a> </div>
   - ← / → keys, the arrow buttons or swiping on phones go to the previous/next image
   - Esc, the ✕ button or a click on the dark background closes it
   - Zoom: click the picture / 🔍 button / mouse wheel / + − keys on a computer,
     pinch or double-tap on phones; drag to look around while zoomed
   - Without JavaScript the links simply open the large image
   ========================================================= */
(function () {
	'use strict';

	document.addEventListener('DOMContentLoaded', function () {
		// "Collapse" buttons at the bottom of an opened <details> fold it again and jump back to where it started
		document.querySelectorAll('[data-collapse]').forEach(function (btn) {
			btn.addEventListener('click', function () {
				var d = btn.closest('details');
				if (!d) return;
				d.open = false;
				var top = d.getBoundingClientRect().top + window.pageYOffset - 120;
				window.scrollTo({ top: top, behavior: 'smooth' });
			});
		});

		var galleries = document.querySelectorAll('[data-lightbox]');
		if (!galleries.length) return;

		var box = document.createElement('div');
		box.className = 'lightbox';
		box.setAttribute('role', 'dialog');
		box.setAttribute('aria-modal', 'true');
		box.hidden = true;
		box.innerHTML =
			'<button type="button" class="lb-back">' + (/^\/en\//.test(location.pathname) ? '← Back' : '← Zurück') + '</button>' +
			'<button type="button" class="lb-close" aria-label="Schließen">✕</button>' +
			'<button type="button" class="lb-zoom" aria-label="' + (/^\/en\//.test(location.pathname) ? 'Zoom' : 'Vergrößern') + '">🔍</button>' +
			'<button type="button" class="lb-prev" aria-label="Vorheriges Bild">‹</button>' +
			'<figure><img alt=""><figcaption></figcaption></figure>' +
			'<button type="button" class="lb-next" aria-label="Nächstes Bild">›</button>';
		document.body.appendChild(box);

		var img = box.querySelector('img'), cap = box.querySelector('figcaption');
		img.draggable = false;
		var links = [], index = 0, lastFocus = null;

		function show(i) {
			index = (i + links.length) % links.length;
			var a = links[index], thumb = a.querySelector('img');
			var alt = a.getAttribute('data-alt') || (thumb ? thumb.alt : '');
			img.src = a.getAttribute('href');
			img.alt = alt;
			cap.textContent = (a.getAttribute('data-caption') || alt) + (links.length > 1 ? '  (' + (index + 1) + ' / ' + links.length + ')' : '');
			box.classList.toggle('lb-single', links.length < 2);
			resetZoom();
		}

		// ---------- zoom (transform on the <img>; the <figure> keeps doing the swipe) ----------
		var Z = { s: 1, x: 0, y: 0, base: null }, MAXZ = 5, DZ = 2.5;
		function baseRect() {
			// size/position of the picture when not zoomed (transform removed for the measurement)
			var t = img.style.transform; img.style.transform = 'none';
			var r = img.getBoundingClientRect(); img.style.transform = t;
			return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height };
		}
		function clampAxis(t, c, size, view) {
			if (size <= view) return 0;   // smaller than the screen: stay centred
			return Math.min(size / 2 - c, Math.max(view - c - size / 2, t));
		}
		function applyZoom(anim) {
			var b = Z.base;
			if (Z.s <= 1.001) { Z.s = 1; Z.x = Z.y = 0; }
			else if (b) { Z.x = clampAxis(Z.x, b.cx, b.w * Z.s, innerWidth); Z.y = clampAxis(Z.y, b.cy, b.h * Z.s, innerHeight); }
			img.style.transition = anim ? 'transform .25s cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
			img.style.transform = Z.s === 1 ? '' : 'translate(' + Z.x + 'px,' + Z.y + 'px) scale(' + Z.s + ')';
			box.classList.toggle('lb-zoomed', Z.s > 1);
		}
		// zoom to scale s, keeping the screen point (px, py) under the same spot of the picture
		function zoomAt(s, px, py, anim) {
			if (Z.s === 1 || !Z.base) Z.base = baseRect();
			var b = Z.base; s = Math.min(MAXZ, Math.max(1, s));
			if (px == null) { px = b.cx; py = b.cy; }
			var ux = (px - b.cx - Z.x) / Z.s, uy = (py - b.cy - Z.y) / Z.s;
			Z.x = px - b.cx - s * ux; Z.y = py - b.cy - s * uy; Z.s = s;
			applyZoom(anim);
		}
		function toggleZoom(px, py) { if (Z.s > 1) { Z.s = 1; applyZoom(true); } else zoomAt(DZ, px, py, true); }
		function resetZoom() { Z.s = 1; Z.base = null; applyZoom(false); }

		// the big picture grows out of the thumbnail you tapped and shrinks back into it on close
		var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
		var ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
		function fromThumb() {
			var t = links[index] && (links[index].querySelector('img') || links[index]);
			var r = t && t.getBoundingClientRect();
			if (!r || !r.width || r.bottom < 0 || r.top > innerHeight) return 'scale(0.92)';
			return 'translate(' + (r.left + r.width / 2 - innerWidth / 2) + 'px,' + (r.top + r.height / 2 - innerHeight / 2) + 'px) scale(0.25)';
		}
		function open(list, i) {
			links = list; lastFocus = document.activeElement;
			show(i);
			box.hidden = false;
			document.body.style.overflow = 'hidden';
			box.querySelector('.lb-close').focus();
			// phone back button / back gesture closes the picture instead of leaving the page
			try { history.pushState({ lb: 1 }, ''); } catch (e) {}
			if (calm || !box.animate) return;
			box.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
			fig.animate([{ transform: fromThumb(), opacity: 0.4 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: ease });
		}

		function close(fromHistory) {
			if (fromHistory !== true && history.state && history.state.lb) { history.back(); return; }
			resetZoom();
			function done() {
				box.hidden = true;
				img.removeAttribute('src');
				document.body.style.overflow = '';
				if (lastFocus) lastFocus.focus();
			}
			if (calm || !box.animate) return done();
			box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-in', fill: 'forwards' }).onfinish = function (ev) { ev.target.cancel(); done(); };
			fig.animate([{ transform: getComputedStyle(fig).transform === 'none' ? 'none' : getComputedStyle(fig).transform }, { transform: fromThumb(), opacity: 0.4 }], { duration: 260, easing: ease, fill: 'forwards' }).onfinish = function (ev) { ev.target.cancel(); };
		}

		// Each [data-set] inside a gallery is its own little carousel (first link visible, the rest hidden);
		// all other links of the gallery are clicked through together
		function bind(list) {
			list.forEach(function (a, i) {
				a.addEventListener('click', function (e) {
					e.preventDefault();
					// skip placeholder tiles whose picture file doesn't exist yet (homepage Galerie)
					var ok = list.filter(function (l) { return !l.classList.contains('is-empty'); });
					open(ok, Math.max(0, ok.indexOf(a)));
				});
			});
		}
		galleries.forEach(function (g) {
			var all = Array.prototype.slice.call(g.querySelectorAll('a[href]'));
			bind(all.filter(function (a) { return !a.closest('[data-set]'); }));
			g.querySelectorAll('[data-set]').forEach(function (set) {
				bind(Array.prototype.slice.call(set.querySelectorAll('a[href]')));
			});
		});

		box.querySelector('.lb-close').addEventListener('click', close);
		box.querySelector('.lb-back').addEventListener('click', close);
		window.addEventListener('popstate', function () { if (!box.hidden) close(true); });
		box.querySelector('.lb-prev').addEventListener('click', function () { show(index - 1); });
		box.querySelector('.lb-next').addEventListener('click', function () { show(index + 1); });
		box.addEventListener('click', function (e) {
			if (e.target !== box || dragged) return;
			if (Z.s > 1) { Z.s = 1; applyZoom(true); } else close();   // zoomed: first tap outside zooms back out
		});
		window.addEventListener('resize', function () { if (!box.hidden && Z.s > 1) resetZoom(); });
		box.querySelector('.lb-zoom').addEventListener('click', function () { toggleZoom(); });
		document.addEventListener('keydown', function (e) {
			if (box.hidden) return;
			if (e.key === 'Escape') close();
			if (e.key === 'ArrowLeft' && Z.s === 1) show(index - 1);
			if (e.key === 'ArrowRight' && Z.s === 1) show(index + 1);
			if (e.key === '+' || e.key === '=') zoomAt(Z.s * 1.5, null, null, true);
			if (e.key === '-') zoomAt(Z.s / 1.5, null, null, true);
			if (e.key === '0') { Z.s = 1; applyZoom(true); }
		});

		// swipe on phones: the picture follows the finger 1:1; a flick sideways = next/previous,
		// pulling down = close; anything shorter springs back. Direction is locked after ~10 px.
		var startX = null, startY = 0, startT = 0, dir = null, fig = box.querySelector('figure');
		// Samsung-gallery style: neighbours wait just off-screen, follow the finger and slide into place
		var peekP = document.createElement('img'), peekN = document.createElement('img');
		peekP.className = peekN.className = 'lb-peek'; peekP.alt = peekN.alt = '';
		box.appendChild(peekP); box.appendChild(peekN);
		var GAP = 16;
		function setPeeks() {
			if (links.length < 2) { peekP.removeAttribute('src'); peekN.removeAttribute('src'); return; }
			peekP.src = links[(index - 1 + links.length) % links.length].getAttribute('href');
			peekN.src = links[(index + 1) % links.length].getAttribute('href');
		}
		function place(dx, anim) {
			var w = innerWidth + GAP, t = anim ? 'transform .3s cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
			fig.style.transition = peekP.style.transition = peekN.style.transition = t;
			fig.style.transform = dx ? 'translateX(' + dx + 'px)' : '';
			peekP.style.transform = 'translate(-50%, -50%) translateX(' + (dx - w) + 'px)';
			peekN.style.transform = 'translate(-50%, -50%) translateX(' + (dx + w) + 'px)';
		}
		// ----- computer: click the picture = zoom in/out there, wheel = zoom, drag = look around -----
		var dragged = false, lastTouch = 0, mDown = null;
		img.addEventListener('click', function (e) {
			if (Date.now() - lastTouch < 800 || dragged) return;   // phones use double-tap instead
			toggleZoom(e.clientX, e.clientY);
		});
		box.addEventListener('wheel', function (e) {
			if (box.hidden) return;
			e.preventDefault();
			zoomAt(Z.s * Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.002)), e.clientX, e.clientY, false);
		}, { passive: false });
		img.addEventListener('mousedown', function (e) {
			if (e.button !== 0 || Z.s === 1) return;
			e.preventDefault();
			mDown = { x: e.clientX, y: e.clientY, tx: Z.x, ty: Z.y }; dragged = false;
			box.classList.add('lb-dragging');
		});
		window.addEventListener('mousemove', function (e) {
			if (!mDown) return;
			var dx = e.clientX - mDown.x, dy = e.clientY - mDown.y;
			if (Math.abs(dx) + Math.abs(dy) > 4) dragged = true;
			Z.x = mDown.tx + dx; Z.y = mDown.ty + dy; applyZoom(false);
		});
		window.addEventListener('mouseup', function () {
			if (!mDown) return;
			mDown = null; box.classList.remove('lb-dragging');
			setTimeout(function () { dragged = false; }, 0);   // let the click that follows see it first
		});

		// ----- phones: pinch = zoom, double-tap = zoom in/out, one finger moves the zoomed picture -----
		var pinch = null, pan = null, tap = { t: 0, x: 0, y: 0 }, moved = false;
		function dist(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); }
		function mid(t) { return { x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2 }; }
		function cancelSwipe() {
			startX = null; dir = null; place(0, false); fig.style.transform = '';
			box.style.transition = ''; box.style.opacity = '';
		}
		box.addEventListener('touchstart', function (e) {
			lastTouch = Date.now();
			if (e.target.closest('button')) return;
			moved = e.touches.length > 1;
			if (e.touches.length === 2) {
				cancelSwipe(); pan = null;
				if (Z.s === 1 || !Z.base) Z.base = baseRect();
				var m = mid(e.touches);
				pinch = { d: dist(e.touches) || 1, s: Z.s, ux: (m.x - Z.base.cx - Z.x) / Z.s, uy: (m.y - Z.base.cy - Z.y) / Z.s };
				return;
			}
			if (Z.s > 1 && e.touches.length === 1) {
				pan = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: Z.x, ty: Z.y };
			}
		}, { passive: true });
		box.addEventListener('touchmove', function (e) {
			if (pinch && e.touches.length >= 2) {
				var m = mid(e.touches), b = Z.base;
				Z.s = Math.min(MAXZ, Math.max(1, pinch.s * dist(e.touches) / pinch.d));
				Z.x = m.x - b.cx - Z.s * pinch.ux; Z.y = m.y - b.cy - Z.s * pinch.uy;
				applyZoom(false);
			} else if (pan && e.touches.length === 1) {
				var dx = e.touches[0].clientX - pan.x, dy = e.touches[0].clientY - pan.y;
				if (Math.abs(dx) + Math.abs(dy) > 8) moved = true;
				Z.x = pan.tx + dx; Z.y = pan.ty + dy; applyZoom(false);
			} else if (e.touches.length === 1 && startX !== null) {
				if (Math.abs(e.touches[0].clientX - startX) + Math.abs(e.touches[0].clientY - startY) > 8) moved = true;
			}
		}, { passive: true });
		box.addEventListener('touchend', function (e) {
			if (pinch && e.touches.length < 2) {
				pinch = null;
				if (Z.s < 1.05) { Z.s = 1; applyZoom(true); }
				// the finger still down carries on moving the picture
				if (e.touches.length === 1 && Z.s > 1) pan = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: Z.x, ty: Z.y };
				return;
			}
			if (e.touches.length) return;
			pan = null;
			if (moved || e.target.closest('button')) return;
			// double-tap: two short taps close together
			var t = e.changedTouches[0], now = Date.now();
			if (now - tap.t < 320 && Math.abs(t.clientX - tap.x) < 40 && Math.abs(t.clientY - tap.y) < 40) {
				tap.t = 0; cancelSwipe(); toggleZoom(t.clientX, t.clientY);
			} else tap = { t: now, x: t.clientX, y: t.clientY };
		});
		// iPhone: stop Safari from zooming the whole page behind the picture
		box.addEventListener('gesturestart', function (e) { e.preventDefault(); });

		box.addEventListener('touchstart', function (e) {
			if (e.touches.length > 1 || Z.s > 1 || e.target.closest('button')) { startX = null; return; }
			startX = e.touches[0].clientX; startY = e.touches[0].clientY; startT = Date.now(); dir = null;
			setPeeks(); place(0, false);
		}, { passive: true });
		box.addEventListener('touchmove', function (e) {
			if (startX === null) return;
			var dx = e.touches[0].clientX - startX, dy = e.touches[0].clientY - startY;
			if (!dir && Math.max(Math.abs(dx), Math.abs(dy)) > 10) dir = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
			if (dir === 'x') place(links.length < 2 ? dx / 3 : dx, false);
			if (dir === 'y' && dy > 0) { fig.style.transform = 'translateY(' + dy + 'px) scale(' + Math.max(0.85, 1 - dy / 1500) + ')'; box.style.opacity = Math.max(0.4, 1 - dy / 500); }
		}, { passive: true });
		box.addEventListener('touchend', function (e) {
			if (startX === null) return;
			var dx = e.changedTouches[0].clientX - startX, dy = e.changedTouches[0].clientY - startY;
			var v = (dir === 'x' ? Math.abs(dx) : dy) / Math.max(1, Date.now() - startT);   // px per ms
			startX = null;
			box.style.transition = 'opacity .32s ease'; box.style.opacity = '';
			if (dir === 'x' && links.length > 1 && (Math.abs(dx) > 60 || v > 0.5)) {
				var step = dx < 0 ? 1 : -1;
				place(-step * (innerWidth + GAP), true);   // slide the neighbour fully in
				setTimeout(function () { show(index + step); place(0, false); setPeeks(); }, 300);
				return;
			}
			if (dir === 'y' && (dy > 120 || v > 0.6)) { fig.style.transform = ''; close(); return; }
			place(0, true);   // spring back
		});
	});
})();
