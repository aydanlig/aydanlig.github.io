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
   Done dates move to "Vergangene Termine" (folded, under the list on Wo & wann) by themselves.
   ========================================================= */
window.TERMINE = [
	{ date: "2026-11-10", kind: "konzert", title: "¡YUMNUT!WORLDWIDE! live gezeichnet", title_en: "Drawing ¡YUMNUT!WORLDWIDE! live", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin" },
	{ date: "2026-11-11", kind: "konzert", title: "Mad Kittens & Beraudechange live gezeichnet", title_en: "Drawing Mad Kittens & Beraudechange live", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin" },
	{ date: "2026-11-12", kind: "konzert", title: "Pat and the Pissers live gezeichnet", title_en: "Drawing Pat and the Pissers live", place: "K19", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches" },
	{ date: "2026-11-16", time: "ab 19 Uhr", time_en: "from 7 pm", kind: "konzert", title: "I Love You Honey Bunny & ILA live gezeichnet", title_en: "Drawing I Love You Honey Bunny & ILA live", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", links: [["Bandcamp", "https://iloveyouhoneybunny.bandcamp.com/"], ["Instagram", "https://www.instagram.com/iloveyouhoneybunnyband/"]], map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin" },
	{ date: "2026-11-21", kind: "konzert", title: "Buster Beat live gezeichnet (Mauerpark an dem Tag kürzer)", title_en: "Drawing Buster Beat live (shorter Mauerpark day)", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin" },
	{ date: "2026-11-25", time: "ab 17 Uhr", time_en: "from 5 pm", kind: "markt", title: "Live-Porträts auf dem Weihnachtsmarkt", title_en: "Live portraits at the Christmas market", place: "Schloss Charlottenburg · Pagodenzelt", place_en: "Charlottenburg Palace · pagoda tent", map: "https://maps.google.com/?q=Weihnachtsmarkt+Schloss+Charlottenburg" },
	{ date: "2026-11-25", time: "ab 20:30 Uhr", time_en: "from 8:30 pm", kind: "konzert", title: "Samt Martin & deadPEASNTS live gezeichnet", title_en: "Drawing Samt Martin & deadPEASNTS live", place: "Junction Bar, Gneisenaustr. 18, Kreuzberg", map: "https://maps.google.com/?q=Junction+Bar+Gneisenaustra%C3%9Fe+18+Berlin" },
	{ date: "2026-11-26", time: "12–19 Uhr", time_en: "12–7 pm", kind: "markt", title: "Live-Porträts auf dem Ökomarkt", title_en: "Live portraits at the organic market", place: "Kollwitzplatz, Prenzlauer Berg", map: "https://maps.google.com/?q=%C3%96komarkt+Kollwitzplatz+Berlin" },
	{ date: "2026-11-30", time: "ab 17 Uhr", time_en: "from 5 pm", kind: "markt", title: "Live-Porträts auf dem Weihnachtsmarkt", title_en: "Live portraits at the Christmas market", place: "Schloss Charlottenburg · Pagodenzelt", place_en: "Charlottenburg Palace · pagoda tent", map: "https://maps.google.com/?q=Weihnachtsmarkt+Schloss+Charlottenburg" },
	{ date: "2026-12-06", time: "Uhrzeit folgt", time_en: "time tba", kind: "markt", title: "Live-Porträts beim Winterbasar der Regenbogenfabrik", title_en: "Live portraits at the Regenbogenfabrik winter bazaar", place: "Regenbogenfabrik, Lausitzer Str. 21a, Kreuzberg", map: "https://maps.google.com/?q=Regenbogenfabrik+Lausitzer+Stra%C3%9Fe+21a+Berlin" },
	{ date: "2026-12-09", time: "ab 17 Uhr", time_en: "from 5 pm", kind: "markt", title: "Live-Porträts auf dem Weihnachtsmarkt", title_en: "Live portraits at the Christmas market", place: "Schloss Charlottenburg · Pagodenzelt", place_en: "Charlottenburg Palace · pagoda tent", map: "https://maps.google.com/?q=Weihnachtsmarkt+Schloss+Charlottenburg" },
	{ date: "2026-12-13", time: "ca. 13–18 Uhr", time_en: "approx. 1–6 pm", kind: "markt", title: "Live-Porträts beim Gütermarkt – Winterweihnachtsedition", title_en: "Live portraits at the Gütermarkt winter Christmas edition", place: "ZK/U, Siemensstr. 27, Moabit", map: "https://maps.google.com/?q=ZK%2FU+Siemensstra%C3%9Fe+27+Berlin" },
	{ date: "2026-12-14", time: "ab 17 Uhr", time_en: "from 5 pm", kind: "markt", title: "Live-Porträts auf dem Weihnachtsmarkt", title_en: "Live portraits at the Christmas market", place: "Schloss Charlottenburg · Pagodenzelt", place_en: "Charlottenburg Palace · pagoda tent", map: "https://maps.google.com/?q=Weihnachtsmarkt+Schloss+Charlottenburg" },
	{ date: "2026-12-20", time: "12–19 Uhr", time_en: "12–7 pm", kind: "markt", title: "Live-Porträts auf dem Advents-Ökomarkt", title_en: "Live portraits at the Advent organic market", place: "Kollwitzplatz, Prenzlauer Berg", map: "https://maps.google.com/?q=%C3%96komarkt+Kollwitzplatz+Berlin" },
	{ date: "2026-12-21", time: "ab 17 Uhr", time_en: "from 5 pm", kind: "markt", title: "Live-Porträts auf dem Weihnachtsmarkt", title_en: "Live portraits at the Christmas market", place: "Schloss Charlottenburg · Pagodenzelt", place_en: "Charlottenburg Palace · pagoda tent", map: "https://maps.google.com/?q=Weihnachtsmarkt+Schloss+Charlottenburg" },
	{ date: "2027-01-27", kind: "konzert", title: "Euroteuro live gezeichnet", title_en: "Drawing Euroteuro live", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", links: [["Bandcamp", "https://euroteuro.bandcamp.com/"], ["Instagram", "https://www.instagram.com/euroteuro/"]], map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin" },
	{ date: "2027-01-29", kind: "konzert", title: "BE NOISE Live Battle – Bands live gezeichnet (Abend 1)", title_en: "BE NOISE Live Battle – drawing bands live (night 1)", place: "BE NOISE, Berlin", map: "" },
	{ date: "2027-01-30", kind: "konzert", title: "BE NOISE Live Battle – Bands live gezeichnet (Abend 2)", title_en: "BE NOISE Live Battle – drawing bands live (night 2)", place: "BE NOISE, Berlin", map: "" },
	{ date: "2027-03-11", kind: "konzert", title: "Death By Horse live gezeichnet", title_en: "Drawing Death By Horse live", place: "Schokoladen, Ackerstr. 169", info: "ich zeichne Konzert-Skizzen", info_en: "drawing concert sketches", links: [["Bandcamp", "https://deathbyhorse.bandcamp.com/"]], map: "https://maps.google.com/?q=Schokoladen+Ackerstra%C3%9Fe+169+Berlin" }
];
