/* =========================================================
   smiley.js – the 😄 that spins faster and faster

   While the mouse is over a .spinning-smiley it spins forever and its speed
   keeps growing (it triples every second) up to a top speed, and then
   it stays at that top speed.
   Why a fairly low top speed: a screen only draws ~60 pictures a second. Above
   ~1800°/s the smiley turns almost a full circle between two pictures, so the
   eye sees it slow down or even spin backwards (the "wagon wheel" effect).
   A little speech bubble ("hover over me!") invites people to try it.
   On phones: tap to start, tap again to stop.
   Visitors who turned on "reduce motion" in their system don't get the spin.
   ========================================================= */
(function () {
	var START_SPEED = 240;    // degrees per second at the beginning (two thirds of a turn)
	var GROWTH = 3;           // speed triples every second -> exponential
	var MAX_SPEED = 6000;     // top speed (~16 turns a second, ~100° per screen picture) – a motion blur sells the speed

	if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	var noHover = window.matchMedia && window.matchMedia('(hover: none)').matches;

	document.addEventListener('DOMContentLoaded', function () {
		document.querySelectorAll('.spinning-smiley').forEach(function (el) {
			var angle = 0, frame = null, startTime = 0, lastTime = 0;

			// speech bubble: wrap the smiley so the bubble can sit right above it
			var wrap = document.createElement('span');
			wrap.className = 'smiley-wrap';
			el.parentNode.insertBefore(wrap, el);
			wrap.appendChild(el);
			var bubble = document.createElement('span');
			bubble.className = 'smiley-bubble';
			bubble.setAttribute('aria-hidden', 'true');
			bubble.textContent = noHover ? 'tap me!' : 'hover over me!';
			wrap.appendChild(bubble);

			function tick(now) {
				var seconds = (now - startTime) / 1000;
				var speed = Math.min(START_SPEED * Math.pow(GROWTH, seconds), MAX_SPEED);
				angle = (angle + speed * (now - lastTime) / 1000) % 360;
				lastTime = now;
				el.style.transform = 'rotate(' + angle + 'deg)';
				// the faster it spins, the more it blurs (like a real spinning wheel)
				el.style.filter = speed > 1500 ? 'blur(' + Math.min((speed - 1500) / 1500, 2.5).toFixed(2) + 'px)' : '';
				frame = requestAnimationFrame(tick);
			}

			function start() {
				if (frame) return;
				wrap.classList.add('is-spinning', 'was-spun');
				startTime = lastTime = performance.now();
				frame = requestAnimationFrame(tick);
			}

			function stop() {
				cancelAnimationFrame(frame);
				frame = null;
				wrap.classList.remove('is-spinning');
				angle = 0;
				el.style.transform = '';
				el.style.filter = '';
			}

			el.addEventListener('mouseenter', start);
			el.addEventListener('mouseleave', stop);
			// phones have no hover: tap toggles the spin
			el.addEventListener('touchstart', function (e) {
				e.preventDefault();
				if (frame) { stop(); } else { start(); }
			}, { passive: false });
		});
	});
})();
