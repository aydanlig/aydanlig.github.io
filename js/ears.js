/* =========================================================
   ears.js – fox ears on every page (DE + EN)
   The ears are CSS (::before / ::after of .section--alt, .section--dark, .site-footer).
   Pseudo-elements can't be hovered, so an invisible target sits over each pair.
   Hover: quick ear twitch. Click/tap: ears squash, hop up stretched, tilt, land (a different move).
   Styles: "fox ears" block at the end of css/main.css.
   ========================================================= */
(function () {
	document.addEventListener('DOMContentLoaded', function () {
		var bands = document.querySelectorAll('.section--alt, .section--dark, .site-footer');
		var hits = [];
		bands.forEach(function (band) {
			if (getComputedStyle(band).display === 'none') return;
			var hit = document.createElement('span');
			hit.className = 'ear-hit';
			hit.setAttribute('aria-hidden', 'true');
			band.appendChild(hit);
			hit.addEventListener('mouseenter', function () { band.classList.add('ears-wiggle'); });
			hit.addEventListener('mouseleave', function () { band.classList.remove('ears-wiggle'); });
			hit.addEventListener('click', function () {
				band.classList.remove('ears-wiggle', 'ears-wiggle-hard');
				void band.offsetWidth;   // restart the animation on every click
				band.classList.add('ears-wiggle-hard');
			});
			band.addEventListener('animationend', function (ev) {
				if (ev.animationName === 'ears-perk') band.classList.remove('ears-wiggle-hard');
			});
			hits.push([band, hit]);
		});
		function place() {
			hits.forEach(function (pair) {
				var cs = getComputedStyle(pair[0], '::before');
				var s = pair[1].style;
				s.width = cs.width; s.height = cs.height;
				s.left = cs.left; s.right = cs.right;
			});
		}
		place();
		window.addEventListener('resize', place);
	});
})();
