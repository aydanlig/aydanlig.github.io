/* =========================================================
   fade.js – picture slots that slowly fade between several pictures

   HTML: <span class="fade-stack" data-fade="5000"> <img …> <img …> </span>
   All stacks in the same section change TOGETHER (in sync). They only start
   once the section is on screen, and then wait 5 seconds first, so people can
   look at the first pictures in peace. After that they change every 5 seconds
   (or data-fade on the first stack of the section, in milliseconds).
   Inside a homepage tile with class="fit" the tile's --bg follows the picture that is showing.
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
			groups.get(box).push({ imgs: imgs, i: 0, tile: stack.closest('.fit'), wait: parseInt(stack.getAttribute('data-fade'), 10) || 5000 });
			// pause the whole group while a mouse rests on / a finger touches one of its pictures
			var list = groups.get(box), hold = stack.closest('.fit') || stack;
			hold.addEventListener('pointerenter', function () { list.held = true; });
			hold.addEventListener('pointerleave', function () { list.held = false; });
			hold.addEventListener('pointercancel', function () { list.held = false; });
		});

		function step(list) {
			if (document.documentElement.classList.contains('crop-edit')) return;   // paused while framing (js/crop.js)
			if (list.held) return;
			list.forEach(function (s) {
				s.imgs[s.i].classList.remove('on');
				s.i = (s.i + 1) % s.imgs.length;
				s.imgs[s.i].classList.add('on');
				if (s.tile) s.tile.style.setProperty('--bg', 'url("' + s.imgs[s.i].getAttribute('src') + '")');
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
