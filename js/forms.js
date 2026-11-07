/* =========================================================
   forms.js – helpers for all forms
   1. "Einen Moment bitte" popup while a form is being sent (see below)
   2. Date picker (DD.MM.YYYY) for all date fields – German, or English on the /en/ pages

   Uses flatpickr (self-hosted in /js/vendor, MIT license), so every visitor
   sees German dates, no matter which language their browser is set to.

   <input type="text" data-date-field data-min-days="14">  -> earliest = today + 14 days
   <input type="text" data-date-field data-min-days="0">   -> no dates in the past
   Earlier dates are greyed out and can't be picked.

   Optional: data-express-min-days="3" + a checkbox name="Express"
   in the same form -> with Express ticked the earliest date is today + 3.
   ========================================================= */
(function () {
	// English pages (<html lang="en">, the /en/ folder) get English texts and an English date picker
	var EN = (document.documentElement.lang || '').indexOf('en') === 0;

	function daysFromToday(days) {
		var d = new Date();
		d.setHours(0, 0, 0, 0);
		d.setDate(d.getDate() + days);
		return d;
	}

	/* ---------- "Einen Moment bitte" popup while a form is being sent ----------
	   formsubmit.co needs ~15 seconds before it shows the thank-you page.
	   The popup tells visitors to wait and the button is locked against double-sending.
	   Styles are inside this script, so it also works on the old store page. */
	function showWaitPopup() {
		if (document.getElementById('wait-popup')) return;
		var box = document.createElement('div');
		box.id = 'wait-popup';
		box.setAttribute('role', 'alert');
		box.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;' +
			'padding:20px;background:rgba(15,12,17,0.65);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
		box.innerHTML =
			'<div style="max-width:360px;width:100%;background:#FBF7F3;color:#1A1615;border-radius:18px;padding:28px 24px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,0.3)">' +
			'<div class="wait-spinner" style="width:42px;height:42px;margin:0 auto 16px;border:4px solid #E2D6CE;border-top-color:#FF6B35;border-radius:50%"></div>' +
			'<strong style="display:block;font-size:1.15rem;margin-bottom:8px">' + (EN ? 'One moment please …' : 'Einen Moment bitte …') + '</strong>' +
			'<span style="color:#6B5560;line-height:1.5">' + (EN ? 'Your message is being sent. This can take up to 15 seconds – please don’t close the page.'
				: 'Deine Nachricht wird gesendet. Das kann bis zu 15 Sekunden dauern – bitte schließe die Seite nicht.') + '</span></div>';
		var style = document.createElement('style');
		style.textContent = '@keyframes wait-spin{to{transform:rotate(360deg)}}#wait-popup .wait-spinner{animation:wait-spin 0.9s linear infinite}';
		box.appendChild(style);
		document.body.appendChild(box);
	}

	function hideWaitPopup() {
		var box = document.getElementById('wait-popup');
		if (box) box.remove();
		document.querySelectorAll('form[data-sending] [type="submit"]').forEach(function (b) { b.disabled = false; });
	}

	// formsubmit.co is sometimes down and then redirects to its own timeout page.
	// So forms are sent in the background (formsubmit's AJAX endpoint): success -> our thank-you page (_next),
	// error or no answer -> a popup with the e-mail address instead of the timeout page.
	// Forms with file uploads keep the normal sending (attachments), but get the popup after a long wait.
	var MAIL = '<a href="mailto:aydan@smileyfoxyportraits.com">aydan@smileyfoxyportraits.com</a>';
	function showFailPopup() {
		showWaitPopup();
		var box = document.getElementById('wait-popup');
		var spin = box.querySelector('.wait-spinner'); if (spin) spin.remove();
		box.querySelector('strong').textContent = EN ? 'Form not working?' : 'Formular klappt nicht?';
		box.querySelector('span').innerHTML = (EN
			? 'Our form service is sometimes down – just e-mail me instead: '
			: 'Der Formular-Dienst ist manchmal kurz gestört – schreib mir einfach eine E-Mail: ') + MAIL +
			'<button type="button" data-wait-close style="margin-top:14px;display:block;width:100%;padding:10px;border-radius:12px;border:2px solid #1A1615;background:#fff;color:#1A1615;font:inherit;cursor:pointer">' +
			(EN ? 'Back to the form' : 'Zurück zum Formular') + '</button>';
		box.querySelector('[data-wait-close]').addEventListener('click', hideWaitPopup);
	}
	// listening on the document: runs after the forms' own checks (e.g. the date check), so e.defaultPrevented is final
	document.addEventListener('submit', function (e) {
		var form = e.target;
		if (e.defaultPrevented || !form.matches || !form.matches('form[action*="formsubmit.co"]')) return;
		form.setAttribute('data-sending', '');
		var useAjax = !form.querySelector('input[type="file"]') && window.fetch && window.FormData;
		var data = useAjax ? new FormData(form) : null;   // read before the buttons get disabled
		if (useAjax && e.submitter && e.submitter.name) data.append(e.submitter.name, e.submitter.value);
		form.querySelectorAll('[type="submit"]').forEach(function (b) { b.disabled = true; });
		showWaitPopup();
		if (!useAjax) {
			setTimeout(function () { if (document.getElementById('wait-popup')) showFailPopup(); }, 45000);
			return;
		}
		e.preventDefault();
		var url = form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/').replace('/ajax/ajax/', '/ajax/');
		var next = data.get('_next');
		var done = false;
		var timer = setTimeout(function () { if (!done) { done = true; showFailPopup(); } }, 25000);
		fetch(url, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
			.then(function (r) { return r.ok ? r.json() : { success: 'false' }; })
			.then(function (j) {
				if (done) return; done = true; clearTimeout(timer);
				if (String(j.success) !== 'true') return showFailPopup();
				if (next) location.href = next;
				else { hideWaitPopup(); form.reset(); alert(EN ? 'Thank you – your message has been sent!' : 'Danke – deine Nachricht ist angekommen!'); }
			})
			.catch(function () { if (!done) { done = true; clearTimeout(timer); showFailPopup(); } });
	});
	// Coming back with the browser's back button: remove the popup again
	window.addEventListener('pageshow', hideWaitPopup);

	document.addEventListener('DOMContentLoaded', function () {
		if (!window.flatpickr) return; // without the picker the field stays a normal text field

		document.querySelectorAll('input[data-date-field]').forEach(function (input) {
			var normalDays = parseInt(input.getAttribute('data-min-days'), 10) || 0;
			var expressDays = input.getAttribute('data-express-min-days');
			var form = input.form;
			var express = form ? form.querySelector('input[name="Express"]') : null;

			var picker = window.flatpickr(input, {
				locale: EN ? 'default' : 'de',   // 'default' = flatpickr's built-in English
				dateFormat: 'd.m.Y',      // what the visitor sees AND what arrives in your email
				minDate: daysFromToday(normalDays),
				disableMobile: true,      // same German calendar on phones
				allowInput: true   // every date can be picked OR typed (TT.MM.JJJJ, digits only is enough)
			});

			// Typing a date: phone number pads often have no "." key, so only digits are needed –
			// the dots are added automatically (12122026 -> 12.12.2026) and a full date is handed to the calendar.
			input.setAttribute('inputmode', 'numeric');
			{
				input.addEventListener('input', function (e) {
					if (e.inputType && e.inputType.indexOf('delete') === 0) return;   // let backspace work normally
					var d = input.value.replace(/\D/g, '').slice(0, 8);
					var out = d.slice(0, 2) + (d.length > 2 ? '.' + d.slice(2, 4) : '') + (d.length > 4 ? '.' + d.slice(4) : '');
					if (d.length === 2 || d.length === 4) out += '.';
					input.value = out;
					if (d.length === 8) picker.setDate(out, true, 'd.m.Y');
				});
			}

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
						input.setCustomValidity(EN ? 'Please pick a date.' : 'Bitte wähle ein Datum.');
						input.reportValidity();
						picker.open();
					}
				});
				input.addEventListener('change', function () { input.setCustomValidity(''); });
			}
		});
	});

	// Express orders: show Aydan's phone number only when "Express" is ticked.
	// The number is put together here (not written in the HTML) so simple spam bots don't find it.
	// HTML: <p data-express-phone hidden></p> in the same form as the Express checkbox.
	document.addEventListener('DOMContentLoaded', function () {
		document.querySelectorAll('[data-express-phone]').forEach(function (box) {
			var express = box.form || box.closest('form');
			express = express ? express.querySelector('input[name="Express"]') : null;
			if (!express) return;
			var num = ['+49', '152', '24171137'];
			var link = '<a href="tel:' + num.join('') + '">' + num.join(' ') + '</a>';
			box.innerHTML = EN
				? '<strong>Express:</strong> Please send the request and also give me a quick call or message: ' + link + '. I don’t see e-mails right away, so this way your express order won’t get lost.'
				: '<strong>Express:</strong> Bitte schick die Anfrage ab und melde dich zusätzlich kurz per Anruf oder Nachricht: ' + link +
				'. E-Mails sehe ich nicht sofort, so geht dein Express-Auftrag nicht unter.';
			function toggle() { box.hidden = !express.checked; }
			express.addEventListener('change', toggle);
			toggle();
		});
	});

	// Dropdown with several checkboxes (<details data-multi-select>): the closed box lists what is ticked,
	// a click outside closes it
	document.addEventListener('DOMContentLoaded', function () {
		document.querySelectorAll('[data-multi-select]').forEach(function (box) {
			var summary = box.querySelector('summary');
			var boxes = box.querySelectorAll('input[type="checkbox"]');
			function update() {
				var names = [];
				boxes.forEach(function (b) { if (b.checked) names.push(b.closest('label').querySelector('strong').textContent); });
				summary.textContent = names.length ? names.join(', ') : summary.getAttribute('data-empty');
			}
			boxes.forEach(function (b) { b.addEventListener('change', update); });
			document.addEventListener('click', function (e) { if (box.open && !box.contains(e.target)) box.open = false; });
			document.addEventListener('keydown', function (e) { if (e.key === 'Escape') box.open = false; });
			update();
		});
	});
})();

/* A link to a folded FAQ question (e.g. "#bildrechte") opens it */
(function () {
	function openTarget() {
		var el = location.hash && document.getElementById(location.hash.slice(1));
		if (el && el.tagName === 'DETAILS') el.open = true;
	}
	window.addEventListener('hashchange', openTarget);
	document.addEventListener('DOMContentLoaded', openTarget);
})();
