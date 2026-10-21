/* =========================================================
   forms.js – earliest selectable date in date fields

   <input type="date" data-min-days="14">  -> earliest = today + 14 days
   <input type="date" data-min-days="0">   -> no dates in the past
   Earlier dates are greyed out in the date picker and can't be sent.

   Optional: data-express-min-days="3" + a checkbox name="Express"
   in the same form -> with Express ticked the earliest date is today + 3.
   ========================================================= */
(function () {
	// Date as YYYY-MM-DD in the visitor's local time (what <input type="date"> expects)
	function isoDate(daysFromToday) {
		var d = new Date();
		d.setDate(d.getDate() + daysFromToday);
		var month = String(d.getMonth() + 1).padStart(2, '0');
		var day = String(d.getDate()).padStart(2, '0');
		return d.getFullYear() + '-' + month + '-' + day;
	}

	document.addEventListener('DOMContentLoaded', function () {
		document.querySelectorAll('input[type="date"][data-min-days]').forEach(function (input) {
			var normalDays = parseInt(input.getAttribute('data-min-days'), 10) || 0;
			var expressDays = input.getAttribute('data-express-min-days');
			var express = input.form ? input.form.querySelector('input[name="Express"]') : null;

			function update() {
				var days = (express && express.checked && expressDays !== null)
					? parseInt(expressDays, 10)
					: normalDays;
				input.min = isoDate(days);
				// A date that is now too early gets cleared, so the visitor picks again
				if (input.value && input.value < input.min) {
					input.value = '';
				}
			}

			update();
			if (express) express.addEventListener('change', update);
		});
	});
})();
