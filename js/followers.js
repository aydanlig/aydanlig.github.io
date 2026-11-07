/* =========================================================
   followers.js – live follower count in the big footer

   The footer line <p class="follow-count"> already holds a number written into
   the HTML (works without JavaScript). This script swaps in the newest total
   from /data/followers.json, which follower_stats.py (Desktop\Work\follower-stats)
   writes: Instagram + YouTube + Substack subscribers, numbers only.
   ========================================================= */
(function () {
	var lines = document.querySelectorAll('.follow-count [data-followers]');
	if (!lines.length) return;
	fetch('/data/followers.json', { cache: 'no-cache' })
		.then(function (r) { return r.ok ? r.json() : null; })
		.then(function (data) {
			if (!data || !data.total) return;
			var lang = document.documentElement.lang === 'en' ? 'en-GB' : 'de-DE';
			lines.forEach(function (el) { el.textContent = data.total.toLocaleString(lang); });
		})
		.catch(function () { /* keep the number from the HTML */ });
})();
