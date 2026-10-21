/* =========================================================
   consent.js – cookie-free by default, NO popup.

   1. Google Analytics only loads if the visitor switched it on.
      Any link/button with  data-consent-toggle  becomes that switch
      (it's in every footer and on the Datenschutz page).
      The choice is remembered in the browser (localStorage, no cookie).

   2. Click-to-load embeds: a button with  data-embed-src="https://..."
      is replaced by that iframe only when clicked (e.g. the Bandcamp player),
      so nothing from that service loads before the visitor wants it.
   ========================================================= */
(function () {
	var GA_ID = 'G-XDZB2DQ1KV';
	var KEY = 'sfp-analytics';

	function getChoice() {
		try { return localStorage.getItem(KEY); } catch (e) { return null; }
	}

	function setChoice(value) {
		try { localStorage.setItem(KEY, value); } catch (e) { }
	}

	function loadAnalytics() {
		if (window.__sfpGaLoaded) return;
		window.__sfpGaLoaded = true;
		var s = document.createElement('script');
		s.async = true;
		s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
		document.head.appendChild(s);
		window.dataLayer = window.dataLayer || [];
		window.gtag = function () { window.dataLayer.push(arguments); };
		window.gtag('js', new Date());
		window.gtag('config', GA_ID);
	}

	// Remove Google Analytics cookies when the visitor switches it off again
	function deleteAnalyticsCookies() {
		var domain = location.hostname.replace(/^www\./, '');
		document.cookie.split(';').forEach(function (c) {
			var name = c.split('=')[0].trim();
			if (name.indexOf('_ga') === 0) {
				document.cookie = name + '=; Max-Age=0; path=/';
				document.cookie = name + '=; Max-Age=0; path=/; domain=.' + domain;
			}
		});
	}

	if (getChoice() === 'yes') loadAnalytics();

	document.addEventListener('DOMContentLoaded', function () {
		// The on/off switch
		document.querySelectorAll('[data-consent-toggle]').forEach(function (el) {
			function render() {
				el.textContent = getChoice() === 'yes'
					? 'Statistik-Cookies: an (ausschalten)'
					: 'Statistik-Cookies: aus (erlauben)';
			}
			render();
			el.addEventListener('click', function (e) {
				e.preventDefault();
				if (getChoice() === 'yes') {
					setChoice('no');
					deleteAnalyticsCookies();
					location.reload(); // reload so Google Analytics is fully gone
				} else {
					setChoice('yes');
					loadAnalytics();
					render();
				}
			});
		});

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
