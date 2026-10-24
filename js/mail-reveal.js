/* =========================================================
   mail-reveal.js – e-mail links show the address once clicked

   Clicking any mailto: link ("E-Mail", "Schreib mir gern" …) still opens the
   mail app, but the link text turns into the address itself and gets selected,
   so people without a mail app can simply copy and paste it.
   Works for every <a href="mailto:…"> on the page, nothing to add in the HTML.
   ========================================================= */
(function () {
	document.addEventListener('click', function (e) {
		var link = e.target.closest && e.target.closest('a[href^="mailto:"]');
		if (!link) return;
		var address = decodeURIComponent(link.getAttribute('href').slice(7).split('?')[0]);
		if (link.textContent.trim() !== address) {
			// on narrow buttons the address may wrap – then right after the "@", not in the middle of a word
			var at = address.indexOf('@');
			link.textContent = '';
			link.append(address.slice(0, at + 1), document.createElement('wbr'), address.slice(at + 1));
			link.classList.add('mail-revealed');
		}
		// select the address so Ctrl+C / "Kopieren" works right away
		var range = document.createRange();
		range.selectNodeContents(link);
		var selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	});
})();
