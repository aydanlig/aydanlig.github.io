/* =========================================================
   forms.js – German date picker (TT.MM.JJJJ) for all date fields

   Uses flatpickr (self-hosted in /js/vendor, MIT license), so every visitor
   sees German dates, no matter which language their browser is set to.

   <input type="text" data-date-field data-min-days="14">  -> earliest = today + 14 days
   <input type="text" data-date-field data-min-days="0">   -> no dates in the past
   Earlier dates are greyed out and can't be picked.

   Optional: data-express-min-days="3" + a checkbox name="Express"
   in the same form -> with Express ticked the earliest date is today + 3.
   ========================================================= */
(function () {
	function daysFromToday(days) {
		var d = new Date();
		d.setHours(0, 0, 0, 0);
		d.setDate(d.getDate() + days);
		return d;
	}

	document.addEventListener('DOMContentLoaded', function () {
		if (!window.flatpickr) return; // without the picker the field stays a normal text field

		document.querySelectorAll('input[data-date-field]').forEach(function (input) {
			var normalDays = parseInt(input.getAttribute('data-min-days'), 10) || 0;
			var expressDays = input.getAttribute('data-express-min-days');
			var form = input.form;
			var express = form ? form.querySelector('input[name="Express"]') : null;

			var picker = window.flatpickr(input, {
				locale: 'de',
				dateFormat: 'd.m.Y',      // what the visitor sees AND what arrives in your email
				minDate: daysFromToday(normalDays),
				disableMobile: true       // same German calendar on phones
			});

			function updateMinDate() {
				var days = (express && express.checked && expressDays !== null)
					? parseInt(expressDays, 10)
					: normalDays;
				var min = daysFromToday(days);
				picker.set('minDate', min);
				// A date that is now too early gets cleared, so the visitor picks again
				if (picker.selectedDates[0] && picker.selectedDates[0] < min) {
					picker.clear();
				}
			}
			if (express) express.addEventListener('change', updateMinDate);

			// "required" check (the browser can't check read-only picker fields itself)
			if (input.hasAttribute('required') && form) {
				form.addEventListener('submit', function (e) {
					if (!input.value) {
						e.preventDefault();
						input.setCustomValidity('Bitte wähle ein Datum.');
						input.reportValidity();
						picker.open();
					}
				});
				input.addEventListener('change', function () { input.setCustomValidity(''); });
			}
		});
	});
})();
