/* =========================================================
   ab-test.js – "Welche Kunst gefällt dir am besten?" (labor/ab-test.html)

   Every answer is sent to Google Analytics as event "ab_test" (parameter ab_path) –
   only for visitors who accepted the cookie banner (js/consent.js).
   RESULTS: GA4 → Reports → Engagement → Events → ab_test (register ab_path as a custom dimension).
     ab/duell/gezeigt/<bild>   how often a picture was shown in a duel
     ab/duell/gewinnt/<bild>   how often it won  → win rate = gewinnt / gezeigt (fair, even if shown less)
     ab/aufhaengen/ja|vielleicht|nein/<bild>   "Würdest du es aufhängen?"
     ab/blick/<bild>           first-glance test: picked out of 6 shown for 3 seconds
     ab/favorit/<bild>         overall favourite out of all pictures
     ab/frage/<frage>/<antwort>   style, feeling, subject, price, use, how they found me
     ab/start, ab/fertig       how many start / finish (completion rate)
   To add a picture: copy a line in ART (id = file name without .jpg).
   ========================================================= */
(function () {
	'use strict';
	var ART = [
	{ id: "aquarell-fineliner-detail-4x5", src: "/img/fotos/aquarell-fineliner-detail-4x5.jpg", alt: "Porträt in Tusche und Aquarell: Mann mit Brille und Bart" },
	{ id: "kunst-09a", src: "/img/portfolio/kunst-09a.jpg", alt: "Aquarell-Porträt in Orange und Blau: Paar unter Wimpelketten" },
	{ id: "insta-3", src: "/img/portfolio/insta-3.jpg", alt: "Oranges Aquarell mit Tusche: Gitarrist von Revolte Tanzbein" },
	{ id: "kunst-01", src: "/img/portfolio/kunst-01.jpg", alt: "Tusche-Porträt mit blauen Aquarell-Klecksen" },
	{ id: "kunst-09b", src: "/img/portfolio/kunst-09b.jpg", alt: "Aquarell-Porträt in Pink und Orange: Frau mit Pony" },
	{ id: "insta-5", src: "/img/portfolio/insta-5.jpg", alt: "Tusche und Aquarell: rotes Gesicht mit gelbem Leuchten" },
	{ id: "aquarell-gitarre-papier", src: "/img/portfolio/aquarell-gitarre-papier.jpg", alt: "Blaues Aquarell mit Fineliner: Gitarrist im Skizzenbuch" },
	{ id: "galerie-07", src: "/img/portfolio/galerie-07.jpg", alt: "A5-Aquarell von meinem Stand: Mann im orangen Pulli" },
	{ id: "insta-2", src: "/img/portfolio/insta-2.jpg", alt: "Tusche und blaues Aquarell: Bassist im Skizzenbuch" },
	{ id: "galerie-04", src: "/img/portfolio/galerie-04.jpg", alt: "A5-Skizze in Fineliner und Aquarell: Frau mit lila Haaren" },
	{ id: "galerie-10", src: "/img/portfolio/galerie-10.jpg", alt: "A5-Porträt in Fineliner, Aquarell und Marker: Person mit Mütze" },
	{ id: "tusche-portraet-4x5", src: "/img/portfolio/tusche-portraet-4x5.jpg", alt: "Ausdrucksstarkes Porträt in schwarzer Tusche" },
	{ id: "gruppe-tusche-4x5", src: "/img/portfolio/gruppe-tusche-4x5.jpg", alt: "Gruppenporträt in Tusche mit blauem Aquarell" },
	{ id: "tusche-portraet-2", src: "/img/portfolio/tusche-portraet-2.jpg", alt: "Ernstes Tusche-Porträt im Skizzenbuch" },
	{ id: "skizze-07", src: "/img/portfolio/skizze-07.jpg", alt: "Tusche und Marker: „Pavel the vampire“ mit roter Fliege" },
	{ id: "goldig-tusche-1x1", src: "/img/portfolio/goldig-tusche-1x1.jpg", alt: "Tusche-Zeichnung einer Band auf der Bühne" },
	{ id: "band-3", src: "/img/portfolio/band-3.jpg", alt: "Live-Skizze der Band CEVIL im pinken Bühnenlicht" },
	{ id: "band-29", src: "/img/portfolio/band-29.jpg", alt: "Tusche und Aquarell: Bassist mit Schlagzeug im Hintergrund" },
	{ id: "band-7", src: "/img/portfolio/band-7.jpg", alt: "Aquarell-Skizze, von CEVIL geteilt: „this is the coolest thing ever“" },
	{ id: "band-14", src: "/img/portfolio/band-14.jpg", alt: "Blaues Aquarell einer Musikerin" },
	{ id: "band-25", src: "/img/portfolio/band-25.jpg", alt: "Tusche-Skizze: Gitarrist mit Brille" },
	{ id: "band-17", src: "/img/portfolio/band-17.jpg", alt: "Tusche-Skizze einer Sängerin mit langen Haaren" },
	{ id: "band-34", src: "/img/portfolio/band-34.jpg", alt: "Tusche auf rotem Aquarell: Gitarrist im Gegenlicht" },
	{ id: "band-24", src: "/img/portfolio/band-24.jpg", alt: "Rotbraune Pinselskizze einer Band" },
	{ id: "band-39", src: "/img/portfolio/band-39.jpg", alt: "Tusche im pinken Bühnenlicht: Musiker mit Brille" },
	{ id: "band-36", src: "/img/portfolio/band-36.jpg", alt: "Tusche-Skizze eines Bassisten mit Hut" },
	{ id: "band-10", src: "/img/portfolio/band-10.jpg", alt: "Blaues Aquarell einer ganzen Band" },
	{ id: "band-20", src: "/img/portfolio/band-20.jpg", alt: "Drei Aquarelle im orangen Bühnenlicht" },
	{ id: "band-38", src: "/img/portfolio/band-38.jpg", alt: "Tusche im blauen Bühnenlicht" },
	{ id: "band-26", src: "/img/portfolio/band-26.jpg", alt: "Rotbraune Pinselskizze: Schlagzeuger" },
	{ id: "band-33", src: "/img/portfolio/band-33.jpg", alt: "Tusche-Skizze eines Sängers" },
	{ id: "band-40", src: "/img/portfolio/band-40.jpg", alt: "Tusche auf blauem Aquarell: Musiker im Scheinwerferlicht" },
	{ id: "band-9", src: "/img/portfolio/band-9.jpg", alt: "Tusche-Lettering „Ich bin da“ mit blauen Figuren" },
	{ id: "band-11", src: "/img/portfolio/band-11.jpg", alt: "Zwei blaue Aquarell-Skizzen von Musikern" },
	{ id: "band-19", src: "/img/portfolio/band-19.jpg", alt: "Aquarell-Skizzen von Musikern im Skizzenbuch" },
	{ id: "band-21", src: "/img/portfolio/band-21.jpg", alt: "Viele Konzert-Skizzen auf einem Tisch ausgebreitet" },
	{ id: "band-27", src: "/img/portfolio/band-27.jpg", alt: "Expressive Tusche-Skizze einer Band" },
	{ id: "band-32", src: "/img/portfolio/band-32.jpg", alt: "Tusche-Skizze einer Band auf der Bühne" },
	{ id: "band-37", src: "/img/portfolio/band-37.jpg", alt: "Blaues Aquarell eines Gitarristen" },
	{ id: "band-6", src: "/img/portfolio/band-6.jpg", alt: "Drei Aquarell-Skizzen von Musikern nebeneinander" },
	{ id: "galerie-09", src: "/img/portfolio/galerie-09.jpg", alt: "A5-Skizze in Fineliner, Tusche und gelbem Marker: Mann im Profil" },
	{ id: "galerie-01", src: "/img/portfolio/galerie-01.jpg", alt: "A4-Porträt in Tusche: junge Frau mit Locken" },
	{ id: "ein-euro-portraet-kuss", src: "/img/portfolio/ein-euro-portraet-kuss.jpg", alt: "Schnellskizze in schwarzem Marker: zwei Frauen küssen sich" },
	{ id: "galerie-08", src: "/img/portfolio/galerie-08.jpg", alt: "A5-Skizze in orangem Marker: sitzende Person" },
	{ id: "skizze-05", src: "/img/portfolio/skizze-05.jpg", alt: "Wachsmalkreide-Porträt: Maxim im Profil" },
	{ id: "galerie-06", src: "/img/portfolio/galerie-06.jpg", alt: "A5-Skizze in Fineliner und Marker: Frau mit Brille im Profil" },
	{ id: "ein-euro-portraet", src: "/img/portfolio/ein-euro-portraet.jpg", alt: "Schnellskizze in schwarzem Marker: ein Paar, sie lehnt den Kopf an seine Schulter" },
	{ id: "galerie-05", src: "/img/portfolio/galerie-05.jpg", alt: "A5-Skizze in Tusche und rotem Fineliner: Person am Tisch" },
	{ id: "aquarell-gitarre-2-papier", src: "/img/portfolio/aquarell-gitarre-2-papier.jpg", alt: "Fineliner-Skizze: Gitarrist mit zwei Gitarren" },
	{ id: "skizze-03", src: "/img/portfolio/skizze-03.jpg", alt: "Tusche-Skizze: Person mit Brille und lockigem Haar im Profil" },
	{ id: "galerie-03", src: "/img/portfolio/galerie-03.jpg", alt: "Fineliner-Skizzen von Menschen beim Konzert" },
	{ id: "skizze-01", src: "/img/portfolio/skizze-01.jpg", alt: "Blauer Fineliner mit gelbem Marker: Mann mit Schnurrbart" },
	{ id: "skizze-08", src: "/img/portfolio/skizze-08.jpg", alt: "Skizzenbuchseite mit mehreren schnellen Tusche-Porträts" },
	{ id: "ein-euro-portraet-skizzen", src: "/img/portfolio/ein-euro-portraet-skizzen.jpg", alt: "Drei Schnellskizzen in Tusche auf Skizzenbuchseiten" },
	{ id: "skizze-06", src: "/img/portfolio/skizze-06.jpg", alt: "Fineliner-Skizze: Person mit Handy, sitzend" },
	{ id: "skizze-04", src: "/img/portfolio/skizze-04.jpg", alt: "Tusche-Skizze: Person mit langen Haaren von hinten" },
	{ id: "spaghettaria-1a", src: "/img/portfolio/spaghettaria-1a.jpg", alt: "Gerahmtes Mitarbeiter-Porträt in blauer Tusche" },
	{ id: "spaghettaria-1b", src: "/img/portfolio/spaghettaria-1b.jpg", alt: "Gerahmtes Porträt in blauem Aquarell: Mann mit Locken und Bart" },
	{ id: "auftrag-familie-3x2", src: "/img/portfolio/auftrag-familie-3x2.jpg", alt: "Familien-Porträt in Tusche und blauem Aquarell" },
	{ id: "spaghettaria-3", src: "/img/portfolio/spaghettaria-3.jpg", alt: "Gerahmtes Porträt: junger Mann mit blauem Haar" },
	{ id: "spaghettaria-2", src: "/img/portfolio/spaghettaria-2.jpg", alt: "Gerahmtes Porträt einer Person mit Locken" },
	];

	var root = document.querySelector('[data-abtest]');
	if (!root) return;

	// ---------- counting: Google Analytics events, only if the visitor accepted the cookie banner ----------
	function count(path) {
		if (window.gtag) { try { window.gtag('event', 'ab_test', { ab_path: path }); } catch (e) { } }
	}

	function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
	function img(a) { return '<img src="' + a.src + '" alt="' + a.alt.replace(/"/g, '&quot;') + '" loading="lazy" decoding="async">'; }
	function $(s) { return root.querySelector(s); }

	var steps = [], cur = 0;
	var stage = $('[data-ab-stage]'), bar = $('[data-ab-progress]');

	function show(i) {
		cur = i;
		bar.style.width = Math.round(100 * i / steps.length) + '%';
		if (i >= steps.length) { done(); return; }
		steps[i]();
		var top = root.getBoundingClientRect().top + window.pageYOffset - 90;
		if (window.pageYOffset > top) window.scrollTo({ top: top, behavior: 'smooth' });
	}
	function next() { show(cur + 1); }

	// 1. DUELS: 10 rounds, two random pictures, tap your favourite
	var DUELS = 10, duel = 0, pool = shuffle(ART);
	function duelStep() {
		if (pool.length < 2) pool = shuffle(ART);
		var a = pool.pop(), b = pool.pop();
		stage.innerHTML = '<h2>Duell ' + (duel + 1) + ' von ' + DUELS + '</h2><p class="hint">Welches Bild gefällt dir besser? Einfach antippen – aus dem Bauch heraus.</p>' +
			'<div class="ab-duel"><button type="button" data-pick="a">' + img(a) + '</button><span class="ab-vs" aria-hidden="true">oder</span><button type="button" data-pick="b">' + img(b) + '</button></div>' +
			'<p class="center"><button type="button" class="btn btn--ghost btn--small" data-skip>Kann mich nicht entscheiden</button></p>';
		count('ab/duell/gezeigt/' + a.id); count('ab/duell/gezeigt/' + b.id);
		stage.onclick = function (e) {
			var p = e.target.closest('[data-pick]'), s = e.target.closest('[data-skip]');
			if (!p && !s) return;
			if (p) count('ab/duell/gewinnt/' + (p.getAttribute('data-pick') === 'a' ? a.id : b.id));
			duel++;
			if (duel < DUELS) duelStep(); else next();
		};
	}

	// 2. WOULD YOU HANG IT UP? 5 single pictures
	var HANG = 5, hang = 0, hangPool = null;
	function hangStep() {
		if (!hangPool) hangPool = shuffle(ART).slice(0, HANG);
		var a = hangPool[hang];
		stage.innerHTML = '<h2>Würdest du es bei dir aufhängen? (' + (hang + 1) + '/' + HANG + ')</h2>' +
			'<div class="ab-single">' + img(a) + '</div>' +
			'<div class="ab-answers"><button type="button" class="btn btn--fox" data-a="ja">Ja, sofort</button><button type="button" class="btn" data-a="vielleicht">Vielleicht</button><button type="button" class="btn btn--ghost" data-a="nein">Eher nicht</button></div>';
		stage.onclick = function (e) {
			var b = e.target.closest('[data-a]'); if (!b) return;
			count('ab/aufhaengen/' + b.getAttribute('data-a') + '/' + a.id);
			hang++;
			if (hang < HANG) hangStep(); else next();
		};
	}

	// 3. FIRST GLANCE: 6 pictures for 3 seconds, then: which one caught your eye first?
	function glanceStep() {
		var six = shuffle(ART).slice(0, 6);
		var grid = '<div class="ab-grid ab-grid--6">' + six.map(function (a, i) { return '<button type="button" data-i="' + i + '">' + img(a) + '</button>'; }).join('') + '</div>';
		stage.innerHTML = '<h2>Erster Blick</h2><p class="hint">Gleich siehst du 6 Bilder für 3 Sekunden. Achte darauf, welches dir zuerst ins Auge springt.</p>' +
			'<p class="center"><button type="button" class="btn btn--fox" data-go>Los geht’s</button></p>';
		stage.onclick = function (e) {
			if (!e.target.closest('[data-go]')) return;
			stage.innerHTML = '<h2>Schau hin …</h2>' + grid;
			stage.onclick = null;
			setTimeout(function () {
				stage.innerHTML = '<h2>Welches ist dir zuerst ins Auge gesprungen?</h2>' + grid;
				stage.onclick = function (ev) {
					var b = ev.target.closest('[data-i]'); if (!b) return;
					count('ab/blick/' + six[+b.getAttribute('data-i')].id);
					next();
				};
			}, 3000);
		};
	}

	// 4. QUESTIONS
	var QUESTIONS = [
		{ key: 'stil', q: 'Welcher Stil spricht dich am meisten an?', a: [['fineliner', 'Feiner Fineliner mit Farbakzent'], ['tusche', 'Kräftige schwarze Tusche'], ['aquarell', 'Buntes, fließendes Aquarell'], ['mix', 'Aquarell + Tusche gemischt']] },
		{ key: 'gefuehl', q: 'Was soll ein Porträt von dir ausstrahlen?', a: [['froehlich', 'Fröhlich & verspielt'], ['ruhig', 'Ruhig & zart'], ['intensiv', 'Stark & intensiv'], ['ehrlich', 'Ehrlich, so wie ich bin']] },
		{ key: 'motiv', q: 'Was würdest du am liebsten an der Wand sehen?', a: [['ich', 'Mich selbst'], ['liebste', 'Partner:in, Familie oder Freund:innen'], ['band', 'Eine Band / einen Konzertmoment'], ['tier', 'Mein Haustier']] },
		{ key: 'preis', q: 'Was wäre dir ein handgemaltes A5-Original wert?', a: [['bis-20', 'bis 20 €'], ['20-40', '20–40 €'], ['40-80', '40–80 €'], ['80-plus', 'mehr als 80 €']] },
		{ key: 'wofuer', q: 'Wofür würdest du dir ein Bild von mir holen?', a: [['fuer-mich', 'Für mich selbst'], ['geschenk', 'Als Geschenk'], ['buero', 'Fürs Büro / Team'], ['event', 'Live auf einem Event'], ['noch-nicht', 'Gerade gar nicht']] },
		{ key: 'woher', q: 'Wie bist du auf mich gestoßen?', a: [['instagram', 'Instagram'], ['mauerpark', 'Mauerpark / draußen'], ['konzert', 'Auf einem Konzert'], ['freunde', 'Über Freund:innen'], ['google', 'Google'], ['anders', 'Anders']] }
	];
	var qi = 0;
	function questionStep() {
		var q = QUESTIONS[qi];
		stage.innerHTML = '<h2>' + q.q + '</h2><p class="hint">Frage ' + (qi + 1) + ' von ' + QUESTIONS.length + '</p><div class="ab-choices">' +
			q.a.map(function (x) { return '<button type="button" class="ab-choice" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
		stage.onclick = function (e) {
			var b = e.target.closest('[data-v]'); if (!b) return;
			count('ab/frage/' + q.key + '/' + b.getAttribute('data-v'));
			qi++;
			if (qi < QUESTIONS.length) questionStep(); else next();
		};
	}

	// 5. OVERALL FAVOURITE out of everything
	function favStep() {
		stage.innerHTML = '<h2>Und dein absoluter Favorit?</h2><p class="hint">Alle ' + ART.length + ' Bilder – tipp das eine an, das du am liebsten hättest.</p>' +
			'<div class="ab-grid">' + shuffle(ART).map(function (a) { return '<button type="button" data-id="' + a.id + '">' + img(a) + '</button>'; }).join('') + '</div>';
		stage.onclick = function (e) {
			var b = e.target.closest('[data-id]'); if (!b) return;
			count('ab/favorit/' + b.getAttribute('data-id'));
			next();
		};
	}

	function done() {
		count('ab/fertig');
		bar.style.width = '100%';
		stage.innerHTML = '<h2>Danke dir!</h2><p>Deine Antworten zeigen mir, welche Kunst wirklich ankommt – und was ich mehr malen sollte. Alles ist anonym.</p>' +
			'<div class="btn-row"><button type="button" class="btn btn--fox" data-again>Noch eine Runde Duelle</button><a class="btn btn--ghost" href="/portfolio.html">Ganzes Portfolio ansehen</a><a class="btn btn--ghost" href="/support-free/">Weitere Wege zu helfen</a></div>';
		stage.onclick = function (e) {
			if (!e.target.closest('[data-again]')) return;
			duel = 0; steps = [duelStep]; show(0);
		};
	}

	steps = [duelStep, hangStep, glanceStep, questionStep, favStep];
	$('[data-ab-start]').addEventListener('click', function () {
		count('ab/start');
		$('[data-ab-intro]').hidden = true;
		show(0);
	});
})();
