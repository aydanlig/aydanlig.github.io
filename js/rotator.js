/* =========================================================
   rotator.js – front-page slider (idea from wimpykid.com)

   HTML: <div class="rotator" data-rotator> <div class="rot-track"> <article class="rot-slide">…</article> … </div> </div>
   - changes every 6 seconds, pauses while the mouse is on it or a link inside has focus
   - dots + arrows are added here; swiping works on phones
   - people who prefer reduced motion get no automatic changes
   ========================================================= */
(function () {
	'use strict';
	document.querySelectorAll('[data-rotator]').forEach(function (box) {
		var slides = box.querySelectorAll('.rot-slide');
		if (slides.length < 2) return;
		box.classList.add('js');
		var i = 0, timer = null;
		var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		var de = document.documentElement.lang !== 'en';

		var dots = document.createElement('div');
		dots.className = 'rot-dots';
		slides.forEach(function (s, k) {
			var b = document.createElement('button');
			b.type = 'button';
			b.setAttribute('aria-label', (de ? 'Folie ' : 'Slide ') + (k + 1));
			b.addEventListener('click', function () { show(k); restart(); });
			dots.appendChild(b);
		});
		box.appendChild(dots);
		[['‹', -1, de ? 'Vorherige Folie' : 'Previous slide', 'prev'], ['›', 1, de ? 'Nächste Folie' : 'Next slide', 'next']].forEach(function (a) {
			var b = document.createElement('button');
			b.type = 'button'; b.className = 'rot-nav rot-nav--' + a[3]; b.textContent = a[0]; b.setAttribute('aria-label', a[2]);
			b.addEventListener('click', function () { show(i + a[1]); restart(); });
			box.appendChild(b);
		});

		function show(k) {
			i = (k + slides.length) % slides.length;
			slides.forEach(function (s, n) { s.classList.toggle('on', n === i); s.setAttribute('aria-hidden', n === i ? 'false' : 'true'); });
			[].forEach.call(dots.children, function (d, n) { d.classList.toggle('on', n === i); });
		}
		function restart() {
			clearInterval(timer);
			if (!still) timer = setInterval(function () { show(i + 1); }, 6000);
		}
		box.addEventListener('mouseenter', function () { clearInterval(timer); });
		box.addEventListener('mouseleave', restart);
		box.addEventListener('focusin', function () { clearInterval(timer); });
		var x0 = null;
		box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
		box.addEventListener('touchend', function (e) {
			if (x0 === null) return;
			var dx = e.changedTouches[0].clientX - x0;
			if (Math.abs(dx) > 40) { show(i + (dx < 0 ? 1 : -1)); restart(); }
			x0 = null;
		});
		show(0); restart();
	});
})();
