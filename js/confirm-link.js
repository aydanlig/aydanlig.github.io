/* =========================================================
   confirm-link.js – asks before opening a link that is outdated

   HTML:  <a href="https://…" data-confirm="Text of the question">…</a>
   "OK" opens the link, "Abbrechen" stays on the page.
   ========================================================= */
(function () {
	'use strict';

	document.addEventListener('click', function (e) {
		var link = e.target.closest ? e.target.closest('a[data-confirm]') : null;
		if (link && !window.confirm(link.getAttribute('data-confirm'))) e.preventDefault();
	});
})();
