/* Dark mode: follow the device setting (add ?dark or ?light to a URL to test) */
(function () {
	var q = location.search, mq = window.matchMedia && matchMedia('(prefers-color-scheme: dark)');
	function apply() {
		var dark = /[?&]dark\b/.test(q) || (!/[?&]light\b/.test(q) && mq && mq.matches);
		document.documentElement.classList.toggle('theme-dark', !!dark);
	}
	apply();
	if (mq && mq.addEventListener) mq.addEventListener('change', apply);
})();


/* =========================================================
   nav.js – header extras on every page
   1. "Über mich ▾" dropdown: opens on hover (desktop) and on tap of the arrow (phone)
   2. Thin bar above the header: fills in the next appearance from js/termine.js
   3. Lists with data-termine: renders the upcoming appearances (about + where-i-draw)
   ========================================================= */
(function () {
	var EN = (document.documentElement.lang || "").toLowerCase().indexOf("en") === 0;


	/* ---------- 1b. "Anfragen" header button = dropdown: a click only opens the list of enquiry pages ---------- */
	(function () {
		var a = document.querySelector(".site-header .wrap > a.btn--small");
		if (!a) return;
		var P = EN ? "/en" : "";
		var items = EN
			? [["Book live portraits for an event", P + "/events.html#anfrage-event"], ["Kleckerkasten team workshop", P + "/events.html#anfrage-kleckerkasten"], ["Commission a portrait", P + "/commission.html"], ["Concert or festival venue? Invite me", P + "/events.html#venues"], ["A website for you", "/en/websites/"], ["Other questions: contact", P + "/contact/"]]
			: [["Live-Porträts fürs Event", "/events.html#anfrage-event"], ["Kleckerkasten-Workshop fürs Team", "/events.html#anfrage-kleckerkasten"], ["Porträt-Auftrag", "/commission.html"], ["Du bist eine Konzert- oder Festival-Location? Lad mich ein", "/events.html#venues"], ["Website für dich", "/websites/"], ["Sonstiges: Kontakt", "/contact/"]];
		var wrap = document.createElement("div");
		wrap.className = "nav-more enq-more";
		var btn = document.createElement("button");
		btn.type = "button";
		btn.className = a.className + " nav-more-toggle enq-toggle";
		btn.setAttribute("aria-expanded", "false");
		btn.setAttribute("aria-haspopup", "true");
		btn.innerHTML = a.innerHTML + ' <span aria-hidden="true">▾</span>';
		var menu = document.createElement("div");
		menu.className = "nav-more-menu enq-menu";
		items.forEach(function (it) { var l = document.createElement("a"); l.href = it[1]; l.textContent = it[0]; menu.appendChild(l); });
		wrap.appendChild(btn); wrap.appendChild(menu);
		a.parentNode.replaceChild(wrap, a);
	})();

	/* ---------- 1c. Phone menu: burger button opens the main menu as a list (Apple style) ---------- */
	(function () {
		var head = document.querySelector(".site-header"), nav = head && head.querySelector(".main-nav");
		if (!nav) return;
		var b = document.createElement("button");
		b.type = "button"; b.className = "nav-burger";
		b.setAttribute("aria-expanded", "false");
		b.setAttribute("aria-label", EN ? "Menu" : "Menü");
		b.innerHTML = "<span></span><span></span>";
		nav.parentNode.insertBefore(b, nav);
		b.addEventListener("click", function () {
			var on = head.classList.toggle("nav-open");
			b.setAttribute("aria-expanded", on ? "true" : "false");
		});
		nav.addEventListener("click", function (e) {
			if (e.target.closest("a")) { head.classList.remove("nav-open"); b.setAttribute("aria-expanded", "false"); }
		});
	})();

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
	list.forEach(function (t, i) { t._id = "termin-" + t.date + "-" + i; });   // anchor for links straight to one date
	var byDate = function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; };
	var upcoming = list.filter(function (t) { return t.date >= today; }).sort(byDate);
	// done dates move to "Vergangene Termine" by themselves (newest first)
	var past = list.filter(function (t) { return t.date < today; }).sort(byDate).reverse();

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
			'<span class="live-bar-place"> · ' + esc(pick(next, "place")) + (pick(next, "info") ? " · " + esc(pick(next, "info")) : "") + "</span>";
		// the bar jumps straight to that date on the where-&-when page
		var a = el.closest("a");
		if (a) a.setAttribute("href", (EN ? "/en/where-i-draw/#" : "/where-i-draw/#") + next._id);
	});
	function row(t) {
		var p = parts(t);
		var time = pick(t, "time");
		var info = pick(t, "info");
		var place = esc(pick(t, "place"));
		if (t.map) place = '<a href="' + esc(t.map) + '" target="_blank" rel="noopener">' + place + " ↗</a>";
		return '<li class="termin termin--' + esc(t.kind || "event") + '" id="' + t._id + '">' +
			'<span class="termin-date"><span class="termin-day">' + esc(p.day) + "</span> " + esc(p.short) +
			(p.year !== now.getFullYear() ? " " + p.year : "") + "</span>" +
			'<span class="termin-what"><strong>' + esc(pick(t, "title")) + "</strong>" +
			'<span class="termin-where">' + (time ? esc(time) + " · " : "") + place + (info ? " · " + esc(info) : "") + (t.links || []).map(function (l) { return ' · <a href="' + esc(l[1]) + '" target="_blank" rel="noopener">' + esc(l[0]) + " ↗</a>"; }).join("") + "</span></span>" +
			'<span class="termin-kind">' + esc(KIND[t.kind] || KIND.event) + "</span></li>";
	}

	// sort buttons above the list (date / event / type); a second click flips the order
	function sortBar() {
		var h = EN ? ["Sort:", "Date", "Event", "Type"] : ["Sortieren:", "Datum", "Event", "Art"];
		return '<div class="termin-sort" role="group" aria-label="' + h[0] + '"><span>' + h[0] + "</span>" +
			["date", "title", "kind"].map(function (k, i) { return '<button type="button" data-sort="' + k + '" aria-pressed="' + (i ? "false" : "true") + '">' + h[i + 1] + "</button>"; }).join("") + "</div>";
	}
	document.addEventListener("click", function (e) {
		var btn = e.target.closest && e.target.closest(".termin-sort button");
		if (!btn) return;
		var bar = btn.parentNode, list = bar.nextElementSibling, key = btn.getAttribute("data-sort");
		var dir = btn.getAttribute("aria-pressed") === "true" && btn.dataset.dir !== "desc" ? -1 : 1;
		bar.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", "false"); delete b.dataset.dir; });
		btn.setAttribute("aria-pressed", "true"); btn.dataset.dir = dir === 1 ? "asc" : "desc";
		var val = function (li) { var d = li.id.slice(7, 17);
			return key === "date" ? d : key === "kind" ? li.querySelector(".termin-kind").textContent + d : li.querySelector("strong").textContent.toLowerCase(); };
		Array.prototype.slice.call(list.children).sort(function (a, b) { return val(a) < val(b) ? -dir : val(a) > val(b) ? dir : 0; })
			.forEach(function (li) { list.appendChild(li); });
	});

	// Full lists
	document.querySelectorAll("[data-termine]").forEach(function (box) {
		var limited = box.hasAttribute("data-limit");
		if (!upcoming.length && (limited || !past.length)) return; // keep the fallback text inside the box
		var limit = parseInt(box.getAttribute("data-limit"), 10) || upcoming.length;
		var html = upcoming.length ? sortBar() + '<ol class="termin-rows">' + upcoming.slice(0, limit).map(row).join("") + "</ol>" : "";
		// full list only: past dates folded away underneath
		if (!limited && past.length) {
			html += '<details class="termine-past"><summary>' + (EN ? "Previous dates" : "Vergangene Termine") + " (" + past.length + ")</summary>" +
				'<ol class="termin-rows">' + past.map(row).join("") + "</ol></details>";
		}
		if (upcoming.length > limit) {
			html += '<p class="hint"><a href="' + (EN ? "/en/where-i-draw/#termine" : "/where-i-draw/#termine") + '">' +
				(EN ? "All " + upcoming.length + " dates →" : "Alle " + upcoming.length + " Termine →") + "</a></p>";
		}
		box.innerHTML = html;
	});
	// the list is built after the page loaded, so jump to a #termin-… link by hand
	if (/^#termin-/.test(location.hash)) {
		var target = document.getElementById(location.hash.slice(1));
		if (target) { target.classList.add("termin--target"); target.scrollIntoView({ block: "center" }); }
	}
})();

/* Info bubbles ("?"): on phones a tap opens them, a second tap or a tap anywhere else closes them */
(function () {
	var open = null;
	document.addEventListener('pointerdown', function (e) {
		var t = e.target.closest && e.target.closest('.info, .info-tip');
		open = t && t === document.activeElement ? t : null;
	});
	document.addEventListener('click', function (e) {
		var t = e.target.closest && e.target.closest('.info, .info-tip');
		var act = document.activeElement;
		if (t) { if (open === t) t.blur(); else t.focus(); return; }
		if (act && act.matches && act.matches('.info, .info-tip')) act.blur();
	});
})();

/* Pictures fade in softly once loaded instead of popping in (only pictures still loading get hidden) */
(function () {
	if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	function watch(img) {
		if (img.complete) return;
		img.classList.add('img-wait');
		var done = function () { img.classList.remove('img-wait'); };
		img.addEventListener('load', done, { once: true });
		img.addEventListener('error', done, { once: true });
	}
	document.addEventListener('DOMContentLoaded', function () { document.querySelectorAll('main img').forEach(watch); });
})();

/* Wayfinding: the menu shows which page you are on */
(function () {
	document.addEventListener('DOMContentLoaded', function () {
		var here = location.pathname.replace(/index\.html$/, '');
		document.querySelectorAll('.main-nav a[href], .nav-more-menu a[href]').forEach(function (a) {
			var u = new URL(a.getAttribute('href'), location.href);
			if (!u.hash && u.pathname.replace(/index\.html$/, '') === here) a.setAttribute('aria-current', 'page');
		});
	});
})();

/* Forms: optional fields stay folded behind "Mehr Details (optional)" until someone wants them */
(function () {
	document.addEventListener('click', function (e) {
		var b = e.target.closest && e.target.closest('[data-opt-toggle]');
		if (!b) return;
		var grid = b.closest('.form-grid');
		var on = grid.classList.toggle('show-opt');
		b.setAttribute('aria-expanded', on ? 'true' : 'false');
		b.textContent = b.textContent.replace(on ? '▾' : '▴', on ? '▴' : '▾');
	});
})();

/* Expandable sections: a "collapse" button at the bottom when open (the top toggle then steps back),
   folds the section and jumps back to where it started. Sections that already have one ([data-collapse]) are skipped. */
(function () {
	var EN = document.documentElement.lang === 'en';
	document.addEventListener('DOMContentLoaded', function () {
		document.querySelectorAll('details.curious-more, details.examples, details.archive, details.terms, details.schedule, details#bildrechte').forEach(function (d) {
			if (d.querySelector('[data-collapse]')) return;
			var b = document.createElement('button');
			b.type = 'button';
			b.className = 'auto-collapse';
			b.textContent = EN ? 'Collapse ▴' : 'Einklappen ▴';
			b.addEventListener('click', function () {
				d.open = false;
				var s = d.querySelector('summary');
				var top = (s || d).getBoundingClientRect().top + window.pageYOffset - 120;
				if (top < window.pageYOffset) window.scrollTo({ top: top, behavior: 'smooth' });
				if (s) s.focus({ preventScroll: true });
			});
			d.appendChild(b);
			d.classList.add('has-bottom-close');
		});
	});
})();

/* Picture framing on every page: saved crops (js/crop-data.js), then the crop tool (js/crop.js, secret edit mode inside) */
(function () {
	function load(src, done) { var s = document.createElement('script'); s.src = src; s.onload = s.onerror = done || null; document.head.appendChild(s); }
	load('/js/crop-data.js?v=' + Date.now().toString(36).slice(0, -4), function () { load('/js/crop.js'); });
})();
