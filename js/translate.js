/* =========================================================
   translate.js – the "EN" / "DE" button in the header

   Clicking "EN" opens the real English version (/en/…) if the page has one, otherwise the page in Google Translate's website proxy
   (smileyfoxyportraits-com.translate.goog). Nothing from Google loads on our
   site before that click, so the site stays cookie-free.
   On the translated page the same button shows "DE" and leads back here.

   HTML (already in every header):
   <a class="lang-switch" data-translate href="...">EN</a>
   ========================================================= */
(function () {
	var ORIGINAL = 'https://smileyfoxyportraits.com';
	var PROXY = 'https://smileyfoxyportraits-com.translate.goog';
	var PARAMS = '_x_tr_sl=de&_x_tr_tl=en&_x_tr_hl=en';

	// Pages that have a real English version in the /en/ folder (same path, "/en" in front).
	// When adding an English page: copy the German one to /en/…, translate it, add its path here.
	var EN_PAGES = ['/', '/events.html', '/commission.html', '/about/', '/contact/', '/where-i-draw/',
		'/bezahlen.html', '/referenzen/', '/hallo/', '/danke.html', '/spenden/', '/portfolio.html', '/shop/'];

	function clean(path) { return path.replace(/index\.html$/, ''); }

	document.addEventListener('DOMContentLoaded', function () {
		var onTranslatedPage = location.hostname.indexOf('translate.goog') !== -1;
		var path = clean(location.pathname);
		var onEnglishPage = path.indexOf('/en/') === 0 || path === '/en';

		document.querySelectorAll('[data-translate]').forEach(function (link) {
			if (onEnglishPage) {
				// English page -> the same page in German
				link.href = clean(path.replace(/^\/en/, '') || '/');
				link.textContent = 'DE';
				link.title = 'Deutsche Version dieser Seite';
				link.setAttribute('lang', 'de');
			} else if (onTranslatedPage) {
				// Back to the German original, same page – without the #section, so it opens at the top instead of jumping down
				link.href = ORIGINAL + location.pathname;
				link.textContent = 'DE';
				link.title = 'Zurück zur deutschen Originalseite';
				link.setAttribute('lang', 'de');
			} else if (EN_PAGES.indexOf(path) !== -1) {
				// German page with a real English version: forms work there too
				link.href = '/en' + path;
				link.title = 'English version of this page';
			} else {
				// No English version yet: Google Translate – without the #section (e.g. #kleckerkasten from the menu), so it opens at the top
				link.href = PROXY + location.pathname + '?' + PARAMS;
			}
		});

		// Forms on the translated page: Google's proxy breaks sending them (and would route personal data
		// through Google). So each form gets a note + button that opens the same form on the original site.
		if (!onTranslatedPage) return;
		document.querySelectorAll('form').forEach(function (form) {
			var anchor = form.closest('[id]');
			var target = ORIGINAL + location.pathname + (anchor ? '#' + anchor.id : '');
			var note = document.createElement('div');
			note.className = 'translate-form-note notranslate';
			note.setAttribute('translate', 'no');
			note.innerHTML = '<strong>Please note:</strong> forms can\'t be sent from the translated page (privacy &amp; technical reasons). ' +
				'<a class="btn btn--fox btn--small" href="' + target + '">Open this form on the original site</a>' +
				'<br><small>Tip: you can still type your message in English.</small>';
			form.parentNode.insertBefore(note, form);
			form.addEventListener('submit', function (e) {
				e.preventDefault();
				location.href = target;
			});
		});
	});
})();
