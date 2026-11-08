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

	/* ---------- 2. "Nächste Termine": two rolling lists (concerts + live markets) from js/termine.js ---------- */
	var rolls = document.querySelectorAll('.next-dates ul[data-kind]');
	if (rolls.length && window.TERMINE) {
		var today = new Date(); today.setHours(0, 0, 0, 0);
		var days = en ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
		rolls.forEach(function (ul) {
			var list = window.TERMINE.filter(function (t) {
				return t.kind === ul.getAttribute('data-kind') && new Date(t.date + 'T23:59:59') >= today;
			});
			if (!list.length) { ul.innerHTML = '<li>' + (en ? 'None planned right now' : 'Gerade keine geplant') + '</li>'; return; }
			list.forEach(function (t) {
				var d = new Date(t.date + 'T12:00:00');
				var li = document.createElement('li');
				var a = document.createElement('span'); a.className = 't-date';
				a.textContent = days[d.getDay()] + ' ' + ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.';
				var b = document.createElement('span');
				b.textContent = ((en && t.place_en) || t.place).split(',')[0];
				li.appendChild(a); li.appendChild(b); ul.appendChild(li);
			});
			// long list: copy it once and let it roll (CSS), so it loops without a jump
			if (list.length > 3) {
				[].slice.call(ul.children).forEach(function (li) { var c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); ul.appendChild(c); });
				ul.classList.add('rolling');
				ul.style.animationDuration = (list.length * 1.6) + 's';
			}
		});
	}

	/* ---------- 3. Hover on "Karte": Google Maps preview of my spot ---------- */
	if (window.matchMedia('(hover: hover)').matches) {
		document.querySelectorAll('a[data-photoautomat]').forEach(function (a) {
			var box;
			a.addEventListener('mouseenter', function () {
				if (!box) {
					box = document.createElement('span');
					box.className = 'map-peek';
					box.innerHTML = '<iframe title="Mauerpark" loading="lazy" src="https://maps.google.com/maps?q=Photoautomat%20Mauerpark%2C%20Bernauer%20Str.%2063%2C%20Berlin&z=16&output=embed"></iframe>';
					a.parentNode.insertBefore(box, a.nextSibling);
				}
				box.classList.add('on');
			});
			a.addEventListener('mouseleave', function () { box && box.classList.remove('on'); });
		});
	}

})();
