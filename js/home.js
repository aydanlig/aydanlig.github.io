/* =========================================================
   home.js – small extras on the homepage (DE + EN)

   1. "Karte" links with data-photoautomat: first a little popup
      ("I'm right next to the photo booth"), then the map opens by itself after 3 seconds.
   (Fox ears moved to js/ears.js – loaded on every page.)
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
		pop.querySelector('.pa-x').addEventListener('click', function () {
			clearTimeout(timer);
			// leave the way it came: slide back down, then remove
			pop.classList.add('pa-out');
			setTimeout(function () { pop.remove(); }, 220);
		});
	});

})();
