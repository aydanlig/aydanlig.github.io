/* =========================================================
   smiley.js – the 😄 that spins faster and faster

   While the mouse is over a .spinning-smiley it spins forever and its speed
   keeps growing exponentially (it doubles roughly every second).
   On phones: tap to start, tap again to stop.
   Visitors who turned on "reduce motion" in their system don't get the spin.
   ========================================================= */
(function () {
	var START_SPEED = 90;     // degrees per second at the beginning (a quarter turn)
	var GROWTH = 2;           // speed multiplies by this every second -> exponential
	var MAX_SPEED = 20000;    // safety cap so the browser never gets absurd numbers

	if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	document.addEventListener('DOMContentLoaded', function () {
		document.querySelectorAll('.spinning-smiley').forEach(function (el) {
			var angle = 0, frame = null, startTime = 0, lastTime = 0;

			function tick(now) {
				var seconds = (now - startTime) / 1000;
				var speed = Math.min(START_SPEED * Math.pow(GROWTH, seconds), MAX_SPEED);
				angle = (angle + speed * (now - lastTime) / 1000) % 360;
				lastTime = now;
				el.style.transform = 'rotate(' + angle + 'deg)';
				frame = requestAnimationFrame(tick);
			}

			function start() {
				if (frame) return;
				startTime = lastTime = performance.now();
				frame = requestAnimationFrame(tick);
			}

			function stop() {
				cancelAnimationFrame(frame);
				frame = null;
				angle = 0;
				el.style.transform = '';
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
