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
	{ date: "2026-11-10", kind: "konzert", title: "¡YUMNUT!WORLDWIDE! live gezeichnet", title_en: "Drawing ¡YUMNUT!WORLDWIDE! live", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin", img: ["band-41", "band-42", "band-43", "band-44", "band-45", "band-46"] },
	{ date: "2026-11-11", kind: "konzert", title: "Mad Kittens & Beraudechange live gezeichnet", title_en: "Drawing Mad Kittens & Beraudechange live", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin", img: ["band-47", "band-48", "band-49", "band-50", "band-51", "band-52"] },
	{ date: "2026-11-12", kind: "konzert", title: "Pat and the Pissers live gezeichnet", title_en: "Drawing Pat and the Pissers live", place: "K19", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", img: ["band-57", "band-58", "band-59", "band-60", "band-53", "band-54", "band-55", "band-56"] },
	{ date: "2026-11-13", kind: "konzert", title: "Soul Syndicate live gezeichnet", title_en: "Drawing Soul Syndicate live", place: "Junction Bar, Gneisenaustr. 18, Kreuzberg", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", map: "https://maps.google.com/?q=Junction+Bar+Gneisenaustra%C3%9Fe+18+Berlin", img: ["band-61", "band-62"] },
	{ date: "2026-11-21", kind: "konzert", title: "Buster Beat live gezeichnet (Mauerpark an dem Tag kürzer)", title_en: "Drawing Buster Beat live (shorter Mauerpark day)", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin" },
	{ date: "2026-11-22", time: "12–20 Uhr", time_en: "12–8 pm", kind: "markt", title: "Live-Porträts beim Heissa Holzmarkt (Wintermarkt)", title_en: "Live portraits at the Heissa Holzmarkt winter market", place: "Holzmarkt 25, Friedrichshain", map: "https://maps.google.com/?q=Holzmarkt+25+Berlin" },
	{ date: "2026-11-25", time: "ab 17 Uhr", time_en: "from 5 pm", kind: "markt", title: "Live-Porträts auf dem Weihnachtsmarkt", title_en: "Live portraits at the Christmas market", place: "Schloss Charlottenburg · Pagodenzelt", place_en: "Charlottenburg Palace · pagoda tent", map: "https://maps.google.com/?q=Weihnachtsmarkt+Schloss+Charlottenburg" },
	{ date: "2026-11-25", time: "ab 20:30 Uhr", time_en: "from 8:30 pm", kind: "konzert", title: "Samt Martin & deadPEASNTS live gezeichnet", title_en: "Drawing Samt Martin & deadPEASNTS live", place: "Junction Bar, Gneisenaustr. 18, Kreuzberg", map: "https://maps.google.com/?q=Junction+Bar+Gneisenaustra%C3%9Fe+18+Berlin" },
	{ date: "2026-11-26", time: "12–19 Uhr", time_en: "12–7 pm", kind: "markt", title: "Live-Porträts auf dem Ökomarkt", title_en: "Live portraits at the organic market", place: "Kollwitzplatz, Prenzlauer Berg", map: "https://maps.google.com/?q=%C3%96komarkt+Kollwitzplatz+Berlin" },
	{ date: "2026-11-27", time: "ab 14 Uhr", time_en: "from 2 pm", kind: "event", title: "Live-Porträts im Café Mokka Milch", title_en: "Live portraits at Café Mokka Milch", place: "Mokka Milch, Berlin", map: "https://maps.google.com/?q=Mokka+Milch+Berlin" },
	{ date: "2026-11-30", time: "ab 17 Uhr", time_en: "from 5 pm", kind: "markt", title: "Live-Porträts auf dem Weihnachtsmarkt", title_en: "Live portraits at the Christmas market", place: "Schloss Charlottenburg · Pagodenzelt", place_en: "Charlottenburg Palace · pagoda tent", map: "https://maps.google.com/?q=Weihnachtsmarkt+Schloss+Charlottenburg" },
	{ date: "2026-12-03", time: "ab 20 Uhr", time_en: "from 8 pm", kind: "konzert", title: "DOSIS & Marmor live gezeichnet", title_en: "Drawing DOSIS & Marmor live", place: "Junction Bar, Gneisenaustr. 18, Kreuzberg", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", map: "https://maps.google.com/?q=Junction+Bar+Gneisenaustra%C3%9Fe+18+Berlin" },
	{ date: "2026-12-05", time: "10–16 Uhr", time_en: "10 am–4 pm", kind: "markt", title: "Live-Porträts beim Weihnachts-Kunstmarkt der Buchkantine", title_en: "Live portraits at the Buchkantine Christmas art market", place: "Buchkantine · Terrasse", place_en: "Buchkantine · terrace", map: "https://maps.google.com/?q=Buchkantine+Berlin" },
	{ date: "2026-12-06", time: "Uhrzeit folgt", time_en: "time tba", kind: "markt", title: "Live-Porträts beim Winterbasar der Regenbogenfabrik", title_en: "Live portraits at the Regenbogenfabrik winter bazaar", place: "Regenbogenfabrik, Lausitzer Str. 21a, Kreuzberg", map: "https://maps.google.com/?q=Regenbogenfabrik+Lausitzer+Stra%C3%9Fe+21a+Berlin" },
	{ date: "2026-12-09", time: "ab 17 Uhr", time_en: "from 5 pm", kind: "markt", title: "Live-Porträts auf dem Weihnachtsmarkt", title_en: "Live portraits at the Christmas market", place: "Schloss Charlottenburg · Pagodenzelt", place_en: "Charlottenburg Palace · pagoda tent", map: "https://maps.google.com/?q=Weihnachtsmarkt+Schloss+Charlottenburg" },
	{ date: "2026-12-10", time: "ab 20 Uhr", time_en: "from 8 pm", kind: "konzert", title: "Erection live gezeichnet", title_en: "Drawing Erection live", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin" },
	{ date: "2026-12-11", time: "ab 20:30 Uhr", time_en: "from 8:30 pm", kind: "konzert", title: "Funkverband live gezeichnet", title_en: "Drawing Funkverband live", place: "Junction Bar, Gneisenaustr. 18, Kreuzberg", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", map: "https://maps.google.com/?q=Junction+Bar+Gneisenaustra%C3%9Fe+18+Berlin" },
	{ date: "2026-12-13", time: "ca. 13–18 Uhr", time_en: "approx. 1–6 pm", kind: "markt", title: "Live-Porträts beim Gütermarkt – Winterweihnachtsedition", title_en: "Live portraits at the Gütermarkt winter Christmas edition", place: "ZK/U, Siemensstr. 27, Moabit", map: "https://maps.google.com/?q=ZK%2FU+Siemensstra%C3%9Fe+27+Berlin" },
	{ date: "2026-12-14", time: "ab 17 Uhr", time_en: "from 5 pm", kind: "markt", title: "Live-Porträts auf dem Weihnachtsmarkt", title_en: "Live portraits at the Christmas market", place: "Schloss Charlottenburg · Pagodenzelt", place_en: "Charlottenburg Palace · pagoda tent", map: "https://maps.google.com/?q=Weihnachtsmarkt+Schloss+Charlottenburg" },
	{ date: "2026-12-20", time: "12–19 Uhr", time_en: "12–7 pm", kind: "markt", title: "Live-Porträts auf dem Advents-Ökomarkt", title_en: "Live portraits at the Advent organic market", place: "Kollwitzplatz, Prenzlauer Berg", map: "https://maps.google.com/?q=%C3%96komarkt+Kollwitzplatz+Berlin" },
	{ date: "2026-12-21", time: "ab 17 Uhr", time_en: "from 5 pm", kind: "markt", title: "Live-Porträts auf dem Weihnachtsmarkt", title_en: "Live portraits at the Christmas market", place: "Schloss Charlottenburg · Pagodenzelt", place_en: "Charlottenburg Palace · pagoda tent", map: "https://maps.google.com/?q=Weihnachtsmarkt+Schloss+Charlottenburg" },
	{ date: "2027-01-09", time: "ab 20 Uhr", time_en: "from 8 pm", kind: "konzert", title: "Rat Hole & Not The Ones live gezeichnet", title_en: "Drawing Rat Hole & Not The Ones live", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin" },
	{ date: "2027-01-25", kind: "konzert", title: "Knitting live gezeichnet", title_en: "Drawing Knitting live", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin" },
	{ date: "2027-01-27", kind: "konzert", title: "Euroteuro live gezeichnet", title_en: "Drawing Euroteuro live", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", links: [["Bandcamp", "https://euroteuro.bandcamp.com/"], ["Instagram", "https://www.instagram.com/euroteuro/"]], map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin" },
	{ date: "2027-01-29", kind: "konzert", title: "BE NOISE Live Battle – Bands live gezeichnet (Abend 1)", title_en: "BE NOISE Live Battle – drawing bands live (night 1)", place: "BE NOISE, Berlin", map: "" },
	{ date: "2027-01-30", kind: "konzert", title: "BE NOISE Live Battle – Bands live gezeichnet (Abend 2)", title_en: "BE NOISE Live Battle – drawing bands live (night 2)", place: "BE NOISE, Berlin", map: "" },
	{ date: "2027-02-09", time: "ab 20 Uhr", time_en: "from 8 pm", kind: "konzert", title: "Johnny Dynamite live gezeichnet", title_en: "Drawing Johnny Dynamite live", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin" },
	{ date: "2027-02-17", time: "ab 20 Uhr", time_en: "from 8 pm", kind: "konzert", title: "Alien Chicks live gezeichnet", title_en: "Drawing Alien Chicks live", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin" },
	{ date: "2027-02-22", time: "ab 20 Uhr", time_en: "from 8 pm", kind: "konzert", title: "Honig live gezeichnet", title_en: "Drawing Honig live", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin" },
	{ date: "2027-03-01", time: "ab 20 Uhr", time_en: "from 8 pm", kind: "konzert", title: "The Overjoyed live gezeichnet", title_en: "Drawing The Overjoyed live", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin" },
	{ date: "2027-03-11", kind: "konzert", title: "Death By Horse live gezeichnet", title_en: "Drawing Death By Horse live", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", links: [["Bandcamp", "https://deathbyhorse.bandcamp.com/"]], map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin" }
];

/* TODAY POPUP – big flashy popup when a date above is today (Berlin time). Once per visit. */
(function () {
	var today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });
	var hits = window.TERMINE.filter(function (t) { return t.date === today; });
	if (!hits.length) return;
	try { if (sessionStorage.getItem("todayPopup") === today) return; sessionStorage.setItem("todayPopup", today); } catch (e) {}
	var en = (document.documentElement.lang || "").indexOf("en") === 0;
	var esc = function (s) { return String(s || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
	var items = hits.map(function (t) {
		var time = en ? (t.time_en || t.time) : t.time, place = en ? (t.place_en || t.place) : t.place;
		return "<li><strong>" + esc(en ? (t.title_en || t.title) : t.title) + "</strong><br>" + (time ? esc(time) + " · " : "") +
			(t.map ? '<a href="' + esc(t.map) + '" target="_blank" rel="noopener">' + esc(place) + "</a>" : esc(place)) + "</li>";
	}).join("");
	var css = "#tp{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:rgba(0,0,0,.6);padding:16px;animation:tpIn .3s}" +
		"#tp .b{position:relative;max-width:440px;width:100%;padding:28px 24px;border-radius:24px;color:#fff;text-align:center;font:inherit;" +
		"background:linear-gradient(135deg,#ff2d75,#ff9f0a,#ffd60a,#30d158,#0a84ff,#bf5af2);background-size:400% 400%;animation:tpBg 4s ease infinite,tpPop .5s cubic-bezier(.2,1.6,.4,1);box-shadow:0 0 40px #ff2d75,0 0 80px #ffd60a}" +
		"#tp h2{margin:0 0 8px;font-size:2rem;line-height:1.1;text-shadow:0 2px 8px rgba(0,0,0,.4);animation:tpPulse 1s ease-in-out infinite}" +
		"#tp ul{list-style:none;margin:12px 0 0;padding:0;text-shadow:0 1px 4px rgba(0,0,0,.5)}#tp li{margin:10px 0}#tp a{color:#fff;text-decoration:underline}" +
		"#tp .x{position:absolute;top:10px;right:14px;background:none;border:0;color:#fff;font-size:1.8rem;cursor:pointer;line-height:1}" +
		"@keyframes tpBg{0%,100%{background-position:0 50%}50%{background-position:100% 50%}}@keyframes tpPop{from{transform:scale(.3);opacity:0}}" +
		"@keyframes tpPulse{50%{transform:scale(1.08)}}@keyframes tpIn{from{opacity:0}}" +
		"@media (prefers-reduced-motion:reduce){#tp,#tp *{animation:none!important}}";
	function show() {
		var s = document.createElement("style"); s.textContent = css; document.head.appendChild(s);
		var d = document.createElement("div"); d.id = "tp"; d.setAttribute("role", "dialog"); d.setAttribute("aria-modal", "true");
		d.innerHTML = '<div class="b"><button class="x" aria-label="' + (en ? "Close" : "Schließen") + '">×</button><h2>' +
			(en ? "🎨 I'm drawing live TODAY!" : "🎨 HEUTE zeichne ich live!") + "</h2><p>" + (en ? "Come by and say hi:" : "Komm vorbei:") + "</p><ul>" + items + "</ul></div>";
		document.body.appendChild(d);
		var close = function () { d.remove(); };
		d.addEventListener("click", function (e) { if (e.target === d || e.target.className === "x") close(); });
		document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
	}
	if (document.body) show(); else document.addEventListener("DOMContentLoaded", show);
})();
