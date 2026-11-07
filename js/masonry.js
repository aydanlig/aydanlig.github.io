/* =========================================================
   masonry.js – even picture walls on the portfolio (.pf-wall)

   Puts every picture into the currently shortest column, so all columns end at about
   the same height (plain CSS columns leave big gaps at the bottom).
   Uses the width/height written on each <img>, so it works before the pictures have loaded.
   Without JavaScript the wall simply stays a CSS column layout (css/portfolio.css).
   ========================================================= */
(function () {
	function count(wall) {
		var w = wall.clientWidth;
		var max = wall.classList.contains('pf-wall--two') ? 2 : 3;
		if (w < 520) return Math.min(2, max);
		if (w < 860) return 2;
		return max;
	}

	function layout(wall) {
		var items = wall._items;
		var n = count(wall);
		if (wall._cols === n && !wall._dirty) return;
		wall._cols = n; wall._dirty = false;
		var cols = [], heights = [];
		for (var i = 0; i < n; i++) {
			var c = document.createElement('div');
			c.className = 'pf-col';
			cols.push(c); heights.push(0);
		}
		items.forEach(function (a) {
			if (a.classList.contains('more-item') && !wall.classList.contains('show-all')) {
				cols[0].appendChild(a); // stays hidden via CSS
				return;
			}
			var img = a.querySelector('img');
			var ratio = img && img.getAttribute('width') ? img.getAttribute('height') / img.getAttribute('width') : 1;
			var k = heights.indexOf(Math.min.apply(null, heights));
			cols[k].appendChild(a);
			heights[k] += ratio + 0.06; // 0.06 ≈ the gap between pictures
		});
		wall.textContent = '';
		cols.forEach(function (c) { wall.appendChild(c); });
	}

	function init() {
		var walls = Array.prototype.slice.call(document.querySelectorAll('.pf-wall'));
		walls.forEach(function (wall) {
			wall._items = Array.prototype.slice.call(wall.children);
			wall.classList.add('pf-masonry');
			layout(wall);
		});
		var t;
		addEventListener('resize', function () {
			clearTimeout(t);
			t = setTimeout(function () { walls.forEach(layout); }, 120);
		});
		// "Mehr ansehen" buttons add .show-all → lay the wall out again
		document.addEventListener('pf:more', function (e) { e.detail._dirty = true; layout(e.detail); });
	}

	// after js/gallery.js has bound the lightbox, so its order stays the original order
	document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); });
})();
