/* =========================================================
   gallery.js – click a thumbnail to see it large (lightbox)

   HTML:  <div data-lightbox> <a href="large.jpg"><img src="small.jpg" alt="…"></a> … </div>
   - ← / → keys, the arrow buttons or swiping on phones go to the previous/next image
   - Esc, the ✕ button or a click on the dark background closes it
   - Without JavaScript the links simply open the large image
   ========================================================= */
(function () {
	'use strict';

	document.addEventListener('DOMContentLoaded', function () {
		var galleries = document.querySelectorAll('[data-lightbox]');
		if (!galleries.length) return;

		var box = document.createElement('div');
		box.className = 'lightbox';
		box.setAttribute('role', 'dialog');
		box.setAttribute('aria-modal', 'true');
		box.hidden = true;
		box.innerHTML =
			'<button type="button" class="lb-close" aria-label="Schließen">✕</button>' +
			'<button type="button" class="lb-prev" aria-label="Vorheriges Bild">‹</button>' +
			'<figure><img alt=""><figcaption></figcaption></figure>' +
			'<button type="button" class="lb-next" aria-label="Nächstes Bild">›</button>';
		document.body.appendChild(box);

		var img = box.querySelector('img'), cap = box.querySelector('figcaption');
		var links = [], index = 0, lastFocus = null;

		function show(i) {
			index = (i + links.length) % links.length;
			var a = links[index], thumb = a.querySelector('img');
			img.src = a.getAttribute('href');
			img.alt = thumb ? thumb.alt : '';
			cap.textContent = (thumb ? thumb.alt : '') + '  (' + (index + 1) + ' / ' + links.length + ')';
		}

		function open(list, i) {
			links = list; lastFocus = document.activeElement;
			show(i);
			box.hidden = false;
			document.body.style.overflow = 'hidden';
			box.querySelector('.lb-close').focus();
		}

		function close() {
			box.hidden = true;
			img.removeAttribute('src');
			document.body.style.overflow = '';
			if (lastFocus) lastFocus.focus();
		}

		galleries.forEach(function (g) {
			var list = Array.prototype.slice.call(g.querySelectorAll('a[href]'));
			list.forEach(function (a, i) {
				a.addEventListener('click', function (e) { e.preventDefault(); open(list, i); });
			});
		});

		box.querySelector('.lb-close').addEventListener('click', close);
		box.querySelector('.lb-prev').addEventListener('click', function () { show(index - 1); });
		box.querySelector('.lb-next').addEventListener('click', function () { show(index + 1); });
		box.addEventListener('click', function (e) { if (e.target === box) close(); });
		document.addEventListener('keydown', function (e) {
			if (box.hidden) return;
			if (e.key === 'Escape') close();
			if (e.key === 'ArrowLeft') show(index - 1);
			if (e.key === 'ArrowRight') show(index + 1);
		});

		// swipe on phones
		var startX = null;
		box.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
		box.addEventListener('touchend', function (e) {
			if (startX === null) return;
			var dx = e.changedTouches[0].clientX - startX;
			if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
			startX = null;
		});
	});
})();
