/* =========================================================
   fade.js – picture slots that slowly fade between several pictures

   HTML: <span class="fade-stack" data-fade="5000"> <img …> <img …> </span>
   All stacks in the same section change TOGETHER (in sync). They only start
   once the section is on screen, and then wait 5 seconds first, so people can
   look at the first pictures in peace. After that they change every 5 seconds
   (or data-fade on the first stack of the section, in milliseconds).
   Inside a homepage tile with class="fit" the tile's --bg follows the picture that is showing.
   While the mouse (or keyboard focus) is on a tile, that tile holds still, and a click
   opens the big view of exactly the picture you are looking at (js/gallery.js uses the link).
   People who prefer reduced motion only see the first picture.
   ========================================================= */
(function () {
	if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	var FIRST_WAIT = 5000;   // ms before the first change, once the section is visible

	document.addEventListener('DOMContentLoaded', function () {
		var groups = new Map();
		document.querySelectorAll('.fade-stack').forEach(function (stack) {
			var imgs = stack.querySelectorAll('img');
			if (imgs.length < 2) return;
			stack.classList.add('js');   // from now on only the picture with class "on" is visible
			imgs[0].classList.add('on');
			var box = stack.closest('section') || document.body;
			if (!groups.has(box)) groups.set(box, []);
			var s = { imgs: imgs, i: 0, tile: stack.closest('.fit'), link: stack.closest('[data-lightbox] a'), paused: false, wait: parseInt(stack.getAttribute('data-fade'), 10) || 5000 };
			if (s.link) {   // hold still while someone is looking at it
				s.link.addEventListener('mouseenter', function () { s.paused = true; });
				s.link.addEventListener('mouseleave', function () { s.paused = false; });
				s.link.addEventListener('focus', function () { s.paused = true; });
				s.link.addEventListener('blur', function () { s.paused = false; });
			}
			groups.get(box).push(s);
		});

		function step(list) {
			if (document.documentElement.classList.contains('crop-edit')) return;   // paused while framing (js/crop.js)
			list.forEach(function (s) {
				if (s.paused) return;
				s.imgs[s.i].classList.remove('on');
				s.i = (s.i + 1) % s.imgs.length;
				s.imgs[s.i].classList.add('on');
				if (s.tile) s.tile.style.setProperty('--bg', 'url("' + s.imgs[s.i].getAttribute('src') + '")');
				if (s.link) s.link.setAttribute('href', s.imgs[s.i].getAttribute('src'));
			});
		}

		function start(box) {
			var list = groups.get(box);
			if (!list || list.started) return;
			list.started = true;
			setTimeout(function () {
				step(list);
				setInterval(function () { step(list); }, list[0].wait);
			}, FIRST_WAIT);
		}

		if (!('IntersectionObserver' in window)) { groups.forEach(function (_, box) { start(box); }); return; }
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (e) {
				if (e.isIntersecting) { start(e.target); io.unobserve(e.target); }
			});
		}, { rootMargin: '0px 0px -25% 0px' });
		groups.forEach(function (_, box) { io.observe(box); });
	});
})();
