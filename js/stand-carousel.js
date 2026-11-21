/* stand-carousel.js – homepage hero: comic-panel slideshow of my stand.
   Slowly fades to the next photo every 7 s; arrows, tap on photo, swipe, arrow keys.
   Pauses while hovered / focused / tab hidden; no auto-play with "reduce motion". */
(function () {
	var DELAY = 7000;
	document.addEventListener('DOMContentLoaded', function () {
		document.querySelectorAll('.stand-carousel').forEach(function (box) {
			var slides = box.querySelectorAll('.sc-slide'), count = box.querySelector('.sc-count');
			var i = 0, timer = null, paused = false;
			var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
			function show(n) {
				slides[i].classList.remove('is-on');
				i = (n + slides.length) % slides.length;
				slides[i].classList.add('is-on');
				count.textContent = (i + 1) + ' / ' + slides.length;
				var nx = slides[(i + 1) % slides.length].querySelector('img'); if (nx) nx.loading = 'eager';
			}
			function go(d) { show(i + d); restart(); }
			function restart() { clearInterval(timer); if (!still && !paused) timer = setInterval(function () { if (!document.hidden) show(i + 1); }, DELAY); }
			box.querySelector('.sc-prev').addEventListener('click', function () { go(-1); });
			box.querySelector('.sc-next').addEventListener('click', function () { go(1); });
			slides.forEach(function (s) { s.addEventListener('click', function () { go(1); }); });
			box.addEventListener('mouseenter', function () { paused = true; restart(); });
			box.addEventListener('mouseleave', function () { paused = false; restart(); });
			box.tabIndex = 0;
			box.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); });
			var x0 = null;
			box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
			box.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); x0 = null; });
			restart();
		});
	});
})();
