/* =========================================================
   fade.js – a picture slot that slowly fades between several pictures

   HTML: <span class="fade-stack" data-fade="5000"> <img …> <img …> </span>
   (data-fade = milliseconds per picture, optional). Inside a homepage tile with class="fit"
   the blurred background (--bg on the tile) follows the picture that is showing.
   People who prefer reduced motion only see the first picture.
   ========================================================= */
(function () {
	if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	document.addEventListener('DOMContentLoaded', function () {
		document.querySelectorAll('.fade-stack').forEach(function (stack, n) {
			var imgs = stack.querySelectorAll('img');
			if (imgs.length < 2) return;
			var tile = stack.closest('.fit');
			var i = 0, wait = parseInt(stack.getAttribute('data-fade'), 10) || 5000;
			stack.classList.add('js');   // from now on only the picture with class "on" is visible
			imgs[0].classList.add('on');
			// start the stacks a little apart, so they don't all change at the same moment
			setTimeout(function () {
				setInterval(function () {
					imgs[i].classList.remove('on');
					i = (i + 1) % imgs.length;
					imgs[i].classList.add('on');
					if (tile) tile.style.setProperty('--bg', 'url("' + imgs[i].getAttribute('src') + '")');
				}, wait);
			}, n * 900);
		});
	});
})();
