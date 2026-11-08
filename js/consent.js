/* =========================================================
   consent.js – Google Analytics only after consent.

   1. Cookie banner on the first visit: "Akzeptieren" loads Google Analytics,
      "Ablehnen" keeps the site cookie-free. Both buttons look the same (DSGVO).
      The choice is remembered in the browser (localStorage, no cookie).
      Any element with  data-consent-toggle  is an on/off switch (Datenschutz page).

   2. Click-to-load embeds: a button with  data-embed-src="https://..."
      is replaced by that iframe only when clicked (e.g. the Bandcamp player).
   ========================================================= */
(function () {
	var GA_ID = 'G-XDZB2DQ1KV';
	var KEY = 'sfp-analytics';
	var EN = (document.documentElement.lang || '').indexOf('en') === 0;
	var PRIVATE = location.pathname.indexOf('/our-days') === 0; // private page: never tracked, no banner

	function getChoice() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
	function setChoice(v) { try { localStorage.setItem(KEY, v); } catch (e) { } }

	function loadAnalytics() {
		if (window.__sfpGaLoaded || PRIVATE) return;
		window.__sfpGaLoaded = true;
		var s = document.createElement('script');
		s.async = true;
		s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
		document.head.appendChild(s);
		window.dataLayer = window.dataLayer || [];
		window.gtag = function () { window.dataLayer.push(arguments); };
		window.gtag('js', new Date());
		window.gtag('config', GA_ID, { anonymize_ip: true });
	}

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

	function showBanner() {
		var css = document.createElement('style');
		css.textContent = '.cookie-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:520px;margin:0 auto;padding:16px 18px;border-radius:16px;background:#1d1a1f;color:#f2eae4;box-shadow:0 10px 30px rgba(0,0,0,.25);font-size:.95rem;line-height:1.45}'
			+ '.cookie-banner a{color:#ffb38a}.cookie-banner .cb-row{display:flex;gap:10px;margin-top:12px}'
			+ '.cookie-banner button{flex:1;padding:.6em 1em;border-radius:999px;border:2px solid #f2eae4;background:transparent;color:#f2eae4;font:inherit;font-weight:700;cursor:pointer}'
			+ '.cookie-banner button:hover{background:#f2eae4;color:#1d1a1f}';
		document.head.appendChild(css);
		var b = document.createElement('div');
		b.className = 'cookie-banner';
		b.setAttribute('role', 'dialog');
		b.setAttribute('aria-label', EN ? 'Cookie settings' : 'Cookie-Einstellungen');
		b.innerHTML = (EN
			? 'May I count visits with Google Analytics? It helps me see which pages people like. Only with your OK. <a href="/ImpressumUndDatenschutz/Datenschutz.html#m134">Privacy</a>'
			: 'Darf ich Besuche mit Google Analytics zählen? So sehe ich, welche Seiten gut ankommen. Nur mit deinem OK. <a href="/ImpressumUndDatenschutz/Datenschutz.html#m134">Datenschutz</a>')
			+ '<div class="cb-row"><button type="button" data-cb="no">' + (EN ? 'Decline' : 'Ablehnen') + '</button>'
			+ '<button type="button" data-cb="yes">' + (EN ? 'Accept' : 'Akzeptieren') + '</button></div>';
		b.addEventListener('click', function (e) {
			var v = e.target.getAttribute && e.target.getAttribute('data-cb');
			if (!v) return;
			setChoice(v);
			if (v === 'yes') loadAnalytics();
			b.remove();
		});
		document.body.appendChild(b);
	}

	if (getChoice() === 'yes') loadAnalytics();

	document.addEventListener('DOMContentLoaded', function () {
		if (!PRIVATE && getChoice() === null) showBanner();

		document.querySelectorAll('[data-consent-toggle]').forEach(function (el) {
			function render() {
				el.textContent = getChoice() === 'yes'
					? (EN ? 'Statistics cookies: on (click to turn off)' : 'Statistik-Cookies: an (klicken zum Ausschalten)')
					: (EN ? 'Statistics cookies: off (click to allow)' : 'Statistik-Cookies: aus (klicken zum Erlauben)');
			}
			render();
			el.addEventListener('click', function (e) {
				e.preventDefault();
				if (getChoice() === 'yes') { setChoice('no'); deleteAnalyticsCookies(); location.reload(); }
				else { setChoice('yes'); loadAnalytics(); render(); }
			});
		});
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
