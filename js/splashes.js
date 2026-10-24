/* =========================================================
   splashes.js – watercolour splashes in the background

   Rule of three: splashes always come as a cluster of three (big, medium, small),
   and each cluster sits on a "thirds" spot of its section (edges, 1/3, 2/3).
   A cluster is only placed where it doesn't touch any photo or drawing,
   so the art itself always stays clean. Re-placed when the window size changes.

   Where:  .hero          – 1 cluster  (top of a page)
           .section--alt  – 1 cluster  (light bands)
           .klecker       – 3, 6 or 9 clusters (Kleckerkasten: "kleckern" = splash paint)
   The splash pictures are CSS variables in css/main.css (--splash-*, --klecks-*).
   ========================================================= */
(function () {
	var SOFT = ['--splash-fox', '--splash-mauve', '--splash-fox'];
	var KLECKS = ['--klecks-fox', '--klecks-purple', '--klecks-blue', '--klecks-pink', '--klecks-ochre', '--klecks-mauve'];
	var IMAGES = 'img, picture, video, iframe, canvas, svg, .ph, .ph-img, .band-grid, .swipe-track';
	var GAP = 18; // minimum distance between a splash and a picture, in px

	// small fixed random generator, so splashes don't jump around on every resize
	function rng(seed) { return function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }; }

	function overlaps(a, b) {
		return a.left < b.right + GAP && a.right > b.left - GAP && a.top < b.bottom + GAP && a.bottom > b.top - GAP;
	}

	function place(section, index) {
		var layer = section.querySelector(':scope > .splash-layer');
		if (!layer) {
			layer = document.createElement('div');
			layer.className = 'splash-layer';
			layer.setAttribute('aria-hidden', 'true');
			section.insertBefore(layer, section.firstChild);
		}
		layer.textContent = '';

		var box = section.getBoundingClientRect();
		var W = box.width, H = box.height;
		if (!W || !H) return;
		var klecker = section.classList.contains('klecker');
		var hero = section.classList.contains('hero');
		var random = rng(index * 7 + 3);

		// pictures in this section, relative to the section
		var pics = [].map.call(section.querySelectorAll(IMAGES), function (el) {
			var r = el.getBoundingClientRect();
			return { left: r.left - box.left, right: r.right - box.left, top: r.top - box.top, bottom: r.bottom - box.top };
		}).filter(function (r) { return r.right > r.left && r.bottom > r.top; });

		// how many clusters: always a multiple of three on the Kleckerkasten, one elsewhere
		var clusters = klecker ? 3 * Math.max(1, Math.min(3, Math.round(H / 1200))) : 1;
		var size = klecker ? Math.max(90, Math.min(200, W * 0.2)) : Math.max(160, Math.min(hero ? 380 : 300, W * (hero ? 0.32 : 0.26)));
		var colours = klecker ? KLECKS : SOFT;
		var opacity = klecker ? 0.32 : (hero ? 0.24 : 0.18);

		// "thirds" spots across the width: the two edges first (least in the way of text), then 1/3 and 2/3
		var xs = [0.06, 0.94, 0.33, 0.67];

		for (var c = 0; c < clusters; c++) {
			// each cluster gets its own third of the height (or its slice of the section)
			var band = H / clusters;
			var placed = false;
			for (var t = 0; t < xs.length * 3 && !placed; t++) {
				var fx = xs[(t + c) % xs.length];
				var fy = (c + [0.5, 1 / 3, 2 / 3][Math.floor(t / xs.length)]) / clusters;
				var cx = fx * W, cy = fy * H;
				// the three splashes of a cluster: big one on the spot, medium and small trailing off diagonally
				var dir = fx > 0.5 ? -1 : 1;
				var parts = [
					{ s: size, x: cx - size / 2, y: cy - size * 0.38 },
					{ s: size * 0.5, x: cx + dir * size * 0.55 - size * 0.25, y: cy + size * 0.35 },
					{ s: size * 0.26, x: cx + dir * size * 0.95 - size * 0.13, y: cy - size * 0.2 }
				];
				// outer box of the cluster, a bit bigger than the pictures themselves because they are rotated
				var bounds = {
					left: Math.min.apply(null, parts.map(function (p) { return p.x - p.s * 0.15; })),
					right: Math.max.apply(null, parts.map(function (p) { return p.x + p.s * 1.15; })),
					top: Math.min.apply(null, parts.map(function (p) { return p.y - p.s * 0.15; })),
					bottom: Math.max.apply(null, parts.map(function (p) { return p.y + p.s * 1.15; }))
				};
				if (bounds.top < 0 && !hero) continue;            // keep the light bands' top free for the fox ears
				if (pics.some(function (r) { return overlaps(bounds, r); })) continue;
				var first = Math.floor(random() * colours.length);
				parts.forEach(function (p, k) {
					var el = document.createElement('i');
					el.style.cssText = 'left:' + p.x.toFixed(0) + 'px;top:' + p.y.toFixed(0) + 'px;width:' + p.s.toFixed(0) + 'px;' +
						'background-image:var(' + colours[(first + k * 2) % colours.length] + ');opacity:' + opacity + ';' +
						'transform:rotate(' + Math.round(random() * 40 - 20) + 'deg)';
					layer.appendChild(el);
				});
				placed = true;
			}
		}
	}

	function all() {
		document.querySelectorAll('.hero, .section--alt, .klecker').forEach(place);
	}

	var timer;
	function soon() { clearTimeout(timer); timer = setTimeout(all, 150); }
	document.addEventListener('DOMContentLoaded', all);
	window.addEventListener('load', all);          // pictures loaded = final layout
	window.addEventListener('resize', soon);
})();
