/* =========================================================
   nav.js – header extras on every page
   1. "Über mich ▾" dropdown: opens on hover (desktop) and on tap of the arrow (phone)
   2. Thin bar above the header: fills in the next appearance from js/termine.js
   3. Lists with data-termine: renders the upcoming appearances (about + where-i-draw)
   ========================================================= */
(function () {
	var EN = (document.documentElement.lang || "").toLowerCase().indexOf("en") === 0;

	/* ---------- 1. Dropdown ---------- */
	function closeAll(except) {
		document.querySelectorAll(".nav-more.open").forEach(function (el) {
			if (el === except) return;
			el.classList.remove("open");
			var b = el.querySelector(".nav-more-toggle");
			if (b) b.setAttribute("aria-expanded", "false");
		});
	}
	document.querySelectorAll(".nav-more").forEach(function (wrap) {
		var btn = wrap.querySelector(".nav-more-toggle");
		if (!btn) return;
		btn.addEventListener("click", function (e) {
			e.stopPropagation();
			var open = !wrap.classList.contains("open");
			closeAll(wrap);
			wrap.classList.toggle("open", open);
			btn.setAttribute("aria-expanded", open ? "true" : "false");
		});
	});
	document.addEventListener("click", function (e) {
		if (!e.target.closest || !e.target.closest(".nav-more")) closeAll();
	});
	document.addEventListener("keydown", function (e) {
		if (e.key === "Escape") closeAll();
	});

	/* ---------- 2 + 3. Upcoming appearances ---------- */
	var list = window.TERMINE || [];
	var now = new Date();
	var today = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
	var upcoming = list.filter(function (t) { return t.date >= today; })
		.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });

	var DAYS = EN ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
	var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	var KIND = EN
		? { markt: "Market", konzert: "Band live", event: "Event" }
		: { markt: "Markt", konzert: "Band live", event: "Event" };

	function parts(t) {
		var p = t.date.split("-");
		var d = new Date(+p[0], +p[1] - 1, +p[2]);
		return {
			day: DAYS[d.getDay()],
			short: EN ? (+p[2]) + " " + MONTHS[+p[1] - 1] : (+p[2]) + "." + (+p[1]) + ".",
			year: +p[0]
		};
	}
	function pick(t, key) { return (EN && t[key + "_en"]) || t[key] || ""; }
	function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

	// Bar above the header
	var next = upcoming[0];
	document.querySelectorAll("[data-next-gig]").forEach(function (el) {
		if (!next) return; // keep the static text
		var p = parts(next);
		el.innerHTML = "<strong>" + (EN ? "Next:" : "Nächster Termin:") + "</strong> " +
			esc(p.day + " " + p.short) + " · " + esc(pick(next, "title")) +
			'<span class="live-bar-place"> · ' + esc(pick(next, "place")) + "</span>";
	});

	// Full lists
	document.querySelectorAll("[data-termine]").forEach(function (box) {
		if (!upcoming.length) return; // keep the fallback text inside the box
		var limit = parseInt(box.getAttribute("data-limit"), 10) || upcoming.length;
		var html = '<ol class="termin-rows">';
		upcoming.slice(0, limit).forEach(function (t) {
			var p = parts(t);
			var time = pick(t, "time");
			var place = esc(pick(t, "place"));
			if (t.map) place = '<a href="' + esc(t.map) + '" target="_blank" rel="noopener">' + place + " ↗</a>";
			html += '<li class="termin termin--' + esc(t.kind || "event") + '">' +
				'<span class="termin-date"><span class="termin-day">' + esc(p.day) + "</span> " + esc(p.short) +
				(p.year !== now.getFullYear() ? " " + p.year : "") + "</span>" +
				'<span class="termin-what"><strong>' + esc(pick(t, "title")) + "</strong>" +
				'<span class="termin-where">' + (time ? esc(time) + " · " : "") + place + "</span></span>" +
				'<span class="termin-kind">' + esc(KIND[t.kind] || KIND.event) + "</span></li>";
		});
		html += "</ol>";
		if (upcoming.length > limit) {
			html += '<p class="hint"><a href="' + (EN ? "/en/where-i-draw/#termine" : "/where-i-draw/#termine") + '">' +
				(EN ? "All " + upcoming.length + " dates →" : "Alle " + upcoming.length + " Termine →") + "</a></p>";
		}
		box.innerHTML = html;
	});
})();
