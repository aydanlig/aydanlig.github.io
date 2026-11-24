/* =========================================================
   NÄCHSTE TERMINE – the one list of upcoming appearances
   (markets, Christmas markets, bands drawn live …)

   Shown automatically on:
   - the thin bar above the header on every page ("Nächster Termin")
   - /about/#termine and /where-i-draw/#termine (+ the English pages)
   Past dates leave the upcoming list by themselves the day after – no need to delete them.

   TO ADD ONE: copy a line { … }, change it, keep the comma at the end.
   date:  "JJJJ-MM-TT" (year-month-day)
   time:  free text, e.g. "ab 17 Uhr" (optional)
   kind:  "markt" | "konzert" | "event"
   title / place: what people see (German); title_en / place_en: English (optional)
   map:   Google-Maps link (optional)
   info / info_en: extra line after the place, e.g. "ich zeichne Konzert-Skizzen" (optional)
   links: band pages, e.g. [["Bandcamp", "https://…"], ["Instagram", "https://…"]] (optional) – promote the bands who invite me
   img:   past dates only – drawings from that night, e.g. ["band-41", "band-42"] (files img/musik/NAME.jpg + NAME-klein.jpg)
   Done dates move to "Vergangene Termine" (folded, under the list on Wo & wann) by themselves.
   ========================================================= */
window.TERMINE = [
	{ date: "2026-10-02", time: "Fr bis So, 3 Tage", time_en: "Fri to Sun, 3 days", kind: "markt", title: "Live-Porträts auf dem Saunasplash-Festival", title_en: "Live portraits at the Saunasplash festival", place: "Saunasplash-Festival, Berlin", info: "50+ Aquarell- und Tusche-Porträts", info_en: "50+ watercolour and ink portraits", links: [["Mehr dazu", "/referenzen/#saunasplash"]] },
	{ date: "2026-11-10", kind: "konzert", title: "¡YUMNUT!WORLDWIDE! live gezeichnet", title_en: "Drawing ¡YUMNUT!WORLDWIDE! live", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin", img: ["band-41", "band-42", "band-43", "band-44", "band-45", "band-46"] },
	{ date: "2026-11-11", kind: "konzert", title: "Mad Kittens & Beraudechange live gezeichnet", title_en: "Drawing Mad Kittens & Beraudechange live", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin", img: ["band-47", "band-48", "band-49", "band-50", "band-51", "band-52"] },
	{ date: "2026-11-12", kind: "konzert", title: "Pat and the Pissers live gezeichnet", title_en: "Drawing Pat and the Pissers live", place: "K19", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", img: ["band-57", "band-58", "band-59", "band-60", "band-53", "band-54", "band-55", "band-56"] },
	{ date: "2026-11-13", kind: "konzert", title: "Soul Syndicate live gezeichnet", title_en: "Drawing Soul Syndicate live", place: "Junction Bar, Gneisenaustr. 18, Kreuzberg", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", map: "https://maps.google.com/?q=Junction+Bar+Gneisenaustra%C3%9Fe+18+Berlin", img: ["band-61", "band-62"] },
	{ date: "2026-11-16", time: "ab 19 Uhr", time_en: "from 7 pm", kind: "konzert", title: "I Love You Honey Bunny & ILA live gezeichnet", title_en: "Drawing I Love You Honey Bunny & ILA live", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", links: [["Bandcamp", "https://iloveyouhoneybunny.bandcamp.com/"], ["Instagram", "https://www.instagram.com/iloveyouhoneybunnyband/"]], map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin" },
	{ date: "2026-11-21", kind: "konzert", title: "Buster Beat live gezeichnet (Mauerpark an dem Tag kürzer)", title_en: "Drawing Buster Beat live (shorter Mauerpark day)", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin" },
	{ date: "2026-11-30", time: "ab 17 Uhr", time_en: "from 5 pm", kind: "markt", title: "Live-Porträts auf dem Weihnachtsmarkt", title_en: "Live portraits at the Christmas market", place: "Schloss Charlottenburg · Pagodenzelt", place_en: "Charlottenburg Palace · pagoda tent", map: "https://maps.google.com/?q=Weihnachtsmarkt+Schloss+Charlottenburg" },
	{ date: "2026-12-06", time: "Uhrzeit folgt", time_en: "time tba", kind: "markt", title: "Live-Porträts beim Winterbasar der Regenbogenfabrik", title_en: "Live portraits at the Regenbogenfabrik winter bazaar", place: "Regenbogenfabrik, Lausitzer Str. 21a, Kreuzberg", map: "https://maps.google.com/?q=Regenbogenfabrik+Lausitzer+Stra%C3%9Fe+21a+Berlin" },
	{ date: "2026-12-09", time: "ab 17 Uhr", time_en: "from 5 pm", kind: "markt", title: "Live-Porträts auf dem Weihnachtsmarkt", title_en: "Live portraits at the Christmas market", place: "Schloss Charlottenburg · Pagodenzelt", place_en: "Charlottenburg Palace · pagoda tent", map: "https://maps.google.com/?q=Weihnachtsmarkt+Schloss+Charlottenburg" },
	{ date: "2026-12-13", time: "ca. 13–18 Uhr", time_en: "approx. 1–6 pm", kind: "markt", title: "Live-Porträts beim Gütermarkt – Winterweihnachtsedition", title_en: "Live portraits at the Gütermarkt winter Christmas edition", place: "ZK/U, Siemensstr. 27, Moabit", map: "https://maps.google.com/?q=ZK%2FU+Siemensstra%C3%9Fe+27+Berlin" },
	{ date: "2026-12-14", time: "ab 17 Uhr", time_en: "from 5 pm", kind: "markt", title: "Live-Porträts auf dem Weihnachtsmarkt", title_en: "Live portraits at the Christmas market", place: "Schloss Charlottenburg · Pagodenzelt", place_en: "Charlottenburg Palace · pagoda tent", map: "https://maps.google.com/?q=Weihnachtsmarkt+Schloss+Charlottenburg" },
	{ date: "2026-12-20", time: "12–19 Uhr", time_en: "12–7 pm", kind: "markt", title: "Live-Porträts auf dem Advents-Ökomarkt", title_en: "Live portraits at the Advent organic market", place: "Kollwitzplatz, Prenzlauer Berg", map: "https://maps.google.com/?q=%C3%96komarkt+Kollwitzplatz+Berlin" },
	{ date: "2026-12-21", time: "ab 17 Uhr", time_en: "from 5 pm", kind: "markt", title: "Live-Porträts auf dem Weihnachtsmarkt", title_en: "Live portraits at the Christmas market", place: "Schloss Charlottenburg · Pagodenzelt", place_en: "Charlottenburg Palace · pagoda tent", map: "https://maps.google.com/?q=Weihnachtsmarkt+Schloss+Charlottenburg" },
	{ date: "2027-01-25", kind: "konzert", title: "Knitting live gezeichnet", title_en: "Drawing Knitting live", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin" },
	{ date: "2027-01-27", kind: "konzert", title: "Euroteuro live gezeichnet", title_en: "Drawing Euroteuro live", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", links: [["Bandcamp", "https://euroteuro.bandcamp.com/"], ["Instagram", "https://www.instagram.com/euroteuro/"]], map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin" },
	{ date: "2027-01-29", kind: "konzert", title: "BE NOISE Live Battle – Bands live gezeichnet (Abend 1)", title_en: "BE NOISE Live Battle – drawing bands live (night 1)", place: "BE NOISE, Berlin", map: "" },
	{ date: "2027-01-30", kind: "konzert", title: "BE NOISE Live Battle – Bands live gezeichnet (Abend 2)", title_en: "BE NOISE Live Battle – drawing bands live (night 2)", place: "BE NOISE, Berlin", map: "" },
	{ date: "2027-03-11", kind: "konzert", title: "Death By Horse live gezeichnet", title_en: "Drawing Death By Horse live", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", links: [["Bandcamp", "https://deathbyhorse.bandcamp.com/"]], map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin" }
];

/* TODAY BANNER – slim rainbow strip at the top of the page when a date above is today (Berlin time). Never blocks the page; × hides it for this visit. */
(function () {
	var today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });
	var hits = window.TERMINE.filter(function (t) { return t.date === today; });
	if (!hits.length) return;
	try { if (sessionStorage.getItem("todayBannerHidden") === today) return; } catch (e) {}
	var en = (document.documentElement.lang || "").indexOf("en") === 0;
	var esc = function (s) { return String(s || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
	var items = hits.map(function (t) {
		var time = en ? (t.time_en || t.time) : t.time, place = en ? (t.place_en || t.place) : t.place;
		var where = t.map ? '<a href="' + esc(t.map) + '" target="_blank" rel="noopener">' + esc(place) + "</a>" : esc(place);
		return "<span><strong>" + esc(en ? (t.title_en || t.title) : t.title) + "</strong> · " + (time ? esc(time) + " · " : "") + where + "</span>";
	}).join("");
	var css = "#tb{position:relative;z-index:50;display:flex;align-items:center;justify-content:center;gap:4px 14px;flex-wrap:wrap;padding:8px 44px;color:#fff;font:inherit;font-size:.95rem;line-height:1.35;text-align:center;" +
		"background:linear-gradient(90deg,#ff2d75,#ff9f0a,#e6b800,#30d158,#0a84ff,#bf5af2,#ff2d75);background-size:300% 100%;animation:tbBg 18s linear infinite;text-shadow:0 1px 3px rgba(0,0,0,.45)}" +
		"#tb b{font-weight:800}#tb span{white-space:normal}#tb a{color:#fff;text-decoration:underline;text-underline-offset:2px}" +
		"#tb .x{position:absolute;top:50%;right:8px;transform:translateY(-50%);width:32px;height:32px;border:0;border-radius:50%;background:rgba(0,0,0,.18);color:#fff;font-size:1.2rem;line-height:1;cursor:pointer}" +
		"#tb .x:hover{background:rgba(0,0,0,.32)}@keyframes tbBg{to{background-position:300% 0}}" +
		"@media (prefers-reduced-motion:reduce){#tb{animation:none}}";
	function show() {
		var s = document.createElement("style"); s.textContent = css; document.head.appendChild(s);
		var d = document.createElement("div"); d.id = "tb"; d.setAttribute("role", "region"); d.setAttribute("aria-label", en ? "Live today" : "Heute live");
		d.innerHTML = "<b>" + (en ? "🎨 Drawing live today:" : "🎨 Heute zeichne ich live:") + "</b>" + items +
			'<button class="x" aria-label="' + (en ? "Hide" : "Ausblenden") + '">×</button>';
		document.body.insertBefore(d, document.body.firstChild);
		d.querySelector(".x").addEventListener("click", function () {
			d.remove(); try { sessionStorage.setItem("todayBannerHidden", today); } catch (e) {}
		});
	}
	if (document.body) show(); else document.addEventListener("DOMContentLoaded", show);
})();
