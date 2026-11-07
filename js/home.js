/* =========================================================
   home.js – small extras on the homepage (DE + EN)

   1. "Karte" links with data-photoautomat: first a little popup
      ("I'm right next to the photo booth"), then the map opens by itself after 3 seconds.
   2. Fox ears on top of the coloured bands: wiggle on hover, wiggle harder on click.
   ========================================================= */
(function () {
	var en = document.documentElement.lang === 'en';

	/* ---------- 1. Photoautomat popup before the map ---------- */
	document.addEventListener('click', function (e) {
		var a = e.target.closest && e.target.closest('a[data-photoautomat]');
		if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
		e.preventDefault();
		var old = document.querySelector('.pa-pop');
		if (old) old.remove();
		var pop = document.createElement('div');
		pop.className = 'pa-pop';
		pop.setAttribute('role', 'dialog');
		pop.setAttribute('aria-live', 'polite');
		pop.innerHTML = en
			? '<strong>I’m right next to the photo booth!</strong><span>Mauerpark, Bernauer Str. 53 – the map opens in a moment …</span><span class="pa-row"><a class="btn btn--small" href="' + a.href + '">Open map now</a><button type="button" class="pa-x">Cancel</button></span><i class="pa-bar"></i>'
			: '<strong>Ich bin direkt neben dem Photoautomaten!</strong><span>Mauerpark, Bernauer Str. 53 – die Karte öffnet sich gleich …</span><span class="pa-row"><a class="btn btn--small" href="' + a.href + '">Karte jetzt öffnen</a><button type="button" class="pa-x">Abbrechen</button></span><i class="pa-bar"></i>';
		document.body.appendChild(pop);
		var timer = setTimeout(function () { window.location.href = a.href; }, 3000);
		pop.querySelector('.pa-x').addEventListener('click', function () { clearTimeout(timer); pop.remove(); });
	});

	/* ---------- 2. Wiggling fox ears ----------
	   The ears are drawn with CSS (::before / ::after of .section--alt, .section--dark, .site-footer).
	   Pseudo-elements can't be hovered, so an invisible button is laid exactly over each pair. */
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
				band.classList.remove('ears-wiggle-hard');
				void band.offsetWidth;   // restart the animation on every click
				band.classList.add('ears-wiggle-hard');
			});
			band.addEventListener('animationend', function (ev) {
				if (ev.animationName === 'ears-hard') band.classList.remove('ears-wiggle-hard');
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
