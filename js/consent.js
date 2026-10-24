/* =========================================================
   consent.js – cookie-free, NO popup, nothing to agree to.

   1. Visitor counter: GoatCounter (goatcounter.com) – counts page views without cookies,
      without local storage and without storing IP addresses, so no consent switch is needed.
      Stats: https://smileyfoxyportraits.goatcounter.com
      Your own visits: open any page once with #toggle-goatcounter at the end of the address
      to stop counting yourself in that browser (same again to switch it back on).

   2. Click-to-load embeds: a button with  data-embed-src="https://..."
      is replaced by that iframe only when clicked (e.g. the Bandcamp player),
      so nothing from that service loads before the visitor wants it.
   ========================================================= */
(function () {
	var COUNTER = 'https://smileyfoxyportraits.goatcounter.com/count';

	// the private, unlisted page is never counted
	if (location.pathname.indexOf('/our-days') !== 0) {
		var s = document.createElement('script');
		s.async = true;
		s.src = 'https://gc.zgo.at/count.js';
		s.setAttribute('data-goatcounter', COUNTER);
		document.head.appendChild(s);
	}

	// Clean-up from the old Google Analytics switch: forget the saved choice and remove old _ga cookies
	try { localStorage.removeItem('sfp-analytics'); } catch (e) { }
	var domain = location.hostname.replace(/^www\./, '');
	document.cookie.split(';').forEach(function (c) {
		var name = c.split('=')[0].trim();
		if (name.indexOf('_ga') === 0) {
			document.cookie = name + '=; Max-Age=0; path=/';
			document.cookie = name + '=; Max-Age=0; path=/; domain=.' + domain;
		}
	});

	document.addEventListener('DOMContentLoaded', function () {
		// Click-to-load embeds
		document.querySelectorAll('[data-embed-src]').forEach(function (btn) {
			btn.addEventListener('click', function () {
				var frame = document.createElement('iframe');
				frame.src = btn.getAttribute('data-embed-src');
				frame.title = btn.getAttribute('data-embed-title') || '';
				frame.style.cssText = btn.getAttribute('data-embed-style') || 'width:100%;height:42px;border:0';
				btn.replaceWith(frame);
			});
		});
	});
})();
