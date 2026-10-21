/* =========================================================
   translate.js – the "EN" / "DE" button in the header

   Clicking "EN" opens the current page in Google Translate's website proxy
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

	document.addEventListener('DOMContentLoaded', function () {
		var onTranslatedPage = location.hostname.indexOf('translate.goog') !== -1;

		document.querySelectorAll('[data-translate]').forEach(function (link) {
			if (onTranslatedPage) {
				// Back to the German original, same page
				link.href = ORIGINAL + location.pathname + location.hash;
				link.textContent = 'DE';
				link.title = 'Zurück zur deutschen Originalseite';
				link.setAttribute('lang', 'de');
			} else {
				// Same page, translated to English
				link.href = PROXY + location.pathname + '?' + PARAMS + location.hash;
			}
		});
	});
})();
