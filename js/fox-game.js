/* Mini game on the Dankbarkeitswand: the fox catches paint and the portrait in the background gets painted.
   Catch ink (+10), watercolour (+15), gold ink (+100) and supporter names (+50); dodge rain and Mauerpark pigeons.
   1000 points = portrait finished = prize (free 1-€ sketch). Supporter names come from .supporters-list. */
(function () {
	var canvas = document.getElementById('fox-game-canvas');
	if (!canvas || !canvas.getContext) return;
	var ctx = canvas.getContext('2d');
	var stage = canvas.parentNode;
	var overlay = document.getElementById('fox-game-overlay');
	var overlayTitle = document.getElementById('fox-game-overlay-title');
	var overlayText = document.getElementById('fox-game-overlay-text');
	var startBtn = document.getElementById('fox-game-start');
	var statusEl = document.getElementById('fox-game-status');
	var hud = {
		score: document.getElementById('fox-game-score'),
		combo: document.getElementById('fox-game-combo'),
		lives: document.getElementById('fox-game-lives'),
		time: document.getElementById('fox-game-time'),
		best: document.getElementById('fox-game-best')
	};
	var prize = document.getElementById('prize-popup-backdrop');
	var prizeScore = document.getElementById('prize-popup-score');
	var prizeClose = document.getElementById('close-prize-popup');

	var WIN = 1000, ROUND = 60, MAX_LIVES = 5;
	var PAINTS = ['#FF6B35', '#3B82F6', '#EC4899', '#22C55E', '#FACC15', '#A855F7'];
	var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	function supporters() {
		return Array.prototype.map.call(document.querySelectorAll('.supporters-list li'), function (li) {
			return li.textContent.trim();
		}).filter(Boolean);
	}

	function loadBest() { try { return parseInt(localStorage.getItem('foxGameBest'), 10) || 0; } catch (e) { return 0; } }
	function saveBest(v) { try { localStorage.setItem('foxGameBest', String(v)); } catch (e) { /* private mode */ } }

	// ---------- sizing ----------
	var W = 0, H = 0, dpr = 1, portrait = null;
	function resize() {
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		W = stage.clientWidth;
		H = Math.round(Math.max(320, Math.min(420, W * 0.62)));
		canvas.style.height = H + 'px';
		canvas.width = Math.round(W * dpr);
		canvas.height = Math.round(H * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		portrait = buildPortrait();
		if (fox) fox.x = Math.min(Math.max(fox.x, 30), W - 30);
		if (!running) draw();
	}

	// The background portrait: a smiley fox face drawn stroke by stroke as the score grows.
	function buildPortrait() {
		var cx = W / 2, cy = H * 0.42, R = Math.min(W, H) * 0.24, paths = [];
		function add(len, fn) { var p = new Path2D(); fn(p); paths.push({ p: p, len: len }); }
		add(2 * Math.PI * R, function (p) { p.arc(cx, cy, R, -Math.PI / 2, Math.PI * 1.5); });
		add(R * 1.6, function (p) { p.moveTo(cx - R * 0.72, cy - R * 0.68); p.lineTo(cx - R * 0.98, cy - R * 1.38); p.lineTo(cx - R * 0.28, cy - R * 0.96); });
		add(R * 1.6, function (p) { p.moveTo(cx + R * 0.72, cy - R * 0.68); p.lineTo(cx + R * 0.98, cy - R * 1.38); p.lineTo(cx + R * 0.28, cy - R * 0.96); });
		add(R * 0.45, function (p) { p.arc(cx - R * 0.36, cy - R * 0.08, R * 0.15, Math.PI * 1.1, Math.PI * 1.9); });
		add(R * 0.45, function (p) { p.arc(cx + R * 0.36, cy - R * 0.08, R * 0.15, Math.PI * 1.1, Math.PI * 1.9); });
		add(R * 1.15, function (p) { p.arc(cx, cy + R * 0.08, R * 0.5, Math.PI * 0.15, Math.PI * 0.85); });
		add(R * 0.5, function (p) { p.moveTo(cx - R * 0.25, cy - R * 0.98); p.quadraticCurveTo(cx, cy - R * 0.7, cx + R * 0.22, cy - R * 0.99); });
		var total = paths.reduce(function (s, x) { return s + x.len; }, 0);
		return { cx: cx, cy: cy, R: R, paths: paths, total: total };
	}

	// ---------- state ----------
	var running = false, paused = false, won = false;
	var score, lives, combo, timeLeft, elapsed, items, particles, splashes, spawnIn, livesSpawned, shake, lastTs, best = loadBest();
	var fox = { x: 0, target: 0 }, keyDir = 0, names = supporters();

	function reset() {
		score = 0; lives = 3; combo = 0; timeLeft = ROUND; elapsed = 0; won = false;
		items = []; particles = []; splashes = []; spawnIn = 0.4; livesSpawned = 0; shake = 0; lastTs = 0;
		fox.x = fox.target = W / 2;
		names = supporters();
	}

	function multiplier() { return Math.min(5, 1 + Math.floor(combo / 5)); }

	function updateHud() {
		hud.score.textContent = score;
		hud.combo.textContent = 'x' + multiplier();
		hud.lives.textContent = lives > 0 ? new Array(lives + 1).join('❤️') : '–';
		hud.time.textContent = Math.ceil(timeLeft);
		hud.best.textContent = best;
	}

	function say(text) { statusEl.textContent = text; }

	// ---------- spawning ----------
	function pick() {
		var d = Math.min(1, elapsed / ROUND);
		var table = [
			['ink', 30], ['paint', 30], ['gold', 5],
			['name', names.length ? 8 : 0],
			['life', livesSpawned < 2 && lives < MAX_LIVES ? 1.6 : 0],
			['rain', 9 + 9 * d], ['pigeon', 4 + 6 * d]
		];
		var sum = table.reduce(function (s, t) { return s + t[1]; }, 0), r = Math.random() * sum;
		for (var i = 0; i < table.length; i++) { r -= table[i][1]; if (r <= 0) return table[i][0]; }
		return 'ink';
	}

	function spawn() {
		var type = pick(), d = Math.min(1, elapsed / ROUND);
		var it = { type: type, x: 24 + Math.random() * (W - 48), y: -30, r: 11, vy: (H * 0.42) * (1 + d * 1.1) * (0.8 + Math.random() * 0.45), phase: Math.random() * 6 };
		if (type === 'paint') it.color = PAINTS[Math.floor(Math.random() * PAINTS.length)];
		if (type === 'gold') it.vy *= 1.5;
		if (type === 'name') {
			it.text = names[Math.floor(Math.random() * names.length)];
			ctx.font = '700 13px system-ui, sans-serif';
			it.w = ctx.measureText('💛 ' + it.text).width + 18;
			it.r = 12; it.vy *= 0.85;
		}
		if (type === 'life') livesSpawned++;
		if (type === 'rain' || type === 'pigeon') it.r = 15;
		items.push(it);
	}

	// ---------- effects ----------
	function burst(x, y, color, n) {
		for (var i = 0; i < n; i++) {
			var a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 160;
			particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80, life: 0.7, color: color, size: 2 + Math.random() * 3 });
		}
	}
	function floater(x, y, text, color) { particles.push({ x: x, y: y, vy: -50, life: 0.9, text: text, color: color }); }
	function splashOnPortrait(color) {
		var P = portrait, a = Math.random() * Math.PI * 2, dist = Math.random() * P.R * 1.15;
		splashes.push({ x: P.cx + Math.cos(a) * dist, y: P.cy + Math.sin(a) * dist, r: P.R * (0.18 + Math.random() * 0.22), color: color });
		if (splashes.length > 60) splashes.shift();
	}

	// ---------- catching ----------
	function caught(it) {
		var pts = 0, mult;
		if (it.type === 'rain' || it.type === 'pigeon') {
			lives--; combo = 0; shake = reduceMotion ? 0 : 0.35;
			burst(it.x, it.y, it.type === 'rain' ? '#60A5FA' : '#94A3B8', 14);
			say(it.type === 'rain' ? 'Regen! Die Aquarellfarbe verläuft … −1 Leben.' : 'Eine freche Mauerpark-Taube hat deinen Pinsel geklaut! −1 Leben.');
			floater(it.x, it.y - 10, '−1 ❤️', '#B91C1C');
			if (lives <= 0) end();
			return;
		}
		if (it.type === 'life') {
			lives = Math.min(MAX_LIVES, lives + 1);
			burst(it.x, it.y, '#3B82F6', 16); floater(it.x, it.y - 10, '+1 💙', '#1D4ED8');
			say('Blaues Herz! +1 Leben.');
			return;
		}
		combo++;
		mult = multiplier();
		if (it.type === 'ink') { pts = 10; burst(it.x, it.y, '#1A1615', 10); splashOnPortrait('#1A1615'); }
		if (it.type === 'paint') { pts = 15; burst(it.x, it.y, it.color, 14); splashOnPortrait(it.color); }
		if (it.type === 'gold') { pts = 100; burst(it.x, it.y, '#D4A017', 26); splashOnPortrait('#D4A017'); say('Goldtusche! +' + 100 * mult); }
		if (it.type === 'name') { pts = 50; burst(it.x, it.y, '#F472B6', 20); say('Danke, ' + it.text + '! 💛'); }
		score += pts * mult;
		floater(it.x, it.y - 12, '+' + pts * mult, it.type === 'paint' ? it.color : '#7A5400');
		if (combo > 0 && combo % 5 === 0 && mult > 1) say('Combo x' + mult + '! Weiter so – nichts fallen lassen.');
		if (!won && score >= WIN) {
			won = true;
			for (var i = 0; i < 6; i++) burst(portrait.cx, portrait.cy, PAINTS[i], 14);
			say('Porträt fertig! 🎉 Du hast den Preis gewonnen – spiel weiter für deinen Rekord.');
		}
	}

	// ---------- loop ----------
	function step(dt) {
		elapsed += dt; timeLeft -= dt;
		if (timeLeft <= 0) { timeLeft = 0; end(); return; }

		spawnIn -= dt;
		if (spawnIn <= 0) { spawn(); spawnIn = 0.62 - 0.34 * Math.min(1, elapsed / ROUND) + Math.random() * 0.15; }

		if (keyDir) fox.target = fox.x + keyDir * 60;
		fox.target = Math.min(Math.max(fox.target, 30), W - 30);
		fox.x += (fox.target - fox.x) * Math.min(1, dt * (keyDir ? 9 : 16));

		var catchTop = H - 62, catchBottom = H - 14;
		for (var i = items.length - 1; i >= 0; i--) {
			var it = items[i];
			it.y += it.vy * dt;
			if (it.type === 'pigeon') it.x += Math.sin(elapsed * 3 + it.phase) * 90 * dt;
			var half = it.w ? it.w / 2 : it.r;
			if (it.y + it.r >= catchTop && it.y - it.r <= catchBottom && Math.abs(it.x - fox.x) < 34 + half * 0.6) {
				items.splice(i, 1); caught(it);
				if (!running) return;
				continue;
			}
			if (it.y - it.r > H) {
				items.splice(i, 1);
				if (it.type !== 'rain' && it.type !== 'pigeon' && it.type !== 'life' && combo > 0) { combo = 0; say('Combo verloren – fang die nächste Farbe!'); }
			}
		}
		for (var j = particles.length - 1; j >= 0; j--) {
			var p = particles[j];
			p.life -= dt;
			if (p.life <= 0) { particles.splice(j, 1); continue; }
			if (p.text) { p.y += p.vy * dt; continue; }
			p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
		}
		if (shake > 0) shake -= dt;
		updateHud();
	}

	function frame() {
		var ts = performance.now();
		if (!running) return;
		if (paused) { lastTs = 0; requestAnimationFrame(frame); return; }
		var dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0;
		lastTs = ts;
		step(dt);
		draw();
		if (running) requestAnimationFrame(frame);
	}

	// ---------- drawing ----------
	function drop(x, y, r, color) {
		ctx.beginPath();
		ctx.moveTo(x, y - r * 1.7);
		ctx.bezierCurveTo(x + r * 1.15, y - r * 0.4, x + r, y + r, x, y + r);
		ctx.bezierCurveTo(x - r, y + r, x - r * 1.15, y - r * 0.4, x, y - r * 1.7);
		ctx.fillStyle = color; ctx.fill();
		ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.1, r * 0.25, 0, Math.PI * 2);
		ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fill();
	}

	// gold ink: a drop with a small brushed sparkle
	function goldDrop(x, y, r) {
		var t = (elapsed || 0) * 6;
		drop(x, y, r, '#D4A017');
		ctx.strokeStyle = '#8A6A00'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
		ctx.beginPath(); ctx.moveTo(x + r * 1.5, y - r * 1.6); ctx.lineTo(x + r * 1.5, y - r * 1.6 + 7 + Math.sin(t) * 2);
		ctx.moveTo(x + r * 1.5 - 4, y - r * 1.6 + 4); ctx.lineTo(x + r * 1.5 + 4, y - r * 1.6 + 4); ctx.stroke();
	}

	// blue watercolour heart with an ink outline
	function heart(x, y, s) {
		ctx.beginPath();
		ctx.moveTo(x, y + s * 0.9);
		ctx.bezierCurveTo(x - s * 1.5, y - s * 0.1, x - s * 0.7, y - s * 1.2, x, y - s * 0.45);
		ctx.bezierCurveTo(x + s * 0.7, y - s * 1.2, x + s * 1.5, y - s * 0.1, x, y + s * 0.9);
		ctx.fillStyle = 'rgba(59,130,246,.55)'; ctx.fill();
		ctx.strokeStyle = '#1A1615'; ctx.lineWidth = 1.6; ctx.stroke();
	}

	// grey watercolour cloud with blue brush-stroke rain
	function rainCloud(x, y) {
		ctx.fillStyle = 'rgba(100,116,139,.55)';
		[[-9, 2, 9], [0, -4, 11], [10, 2, 8], [2, 5, 9]].forEach(function (c) {
			ctx.beginPath(); ctx.arc(x + c[0], y + c[1], c[2], 0, Math.PI * 2); ctx.fill();
		});
		ctx.strokeStyle = '#1A1615'; ctx.lineWidth = 1.4;
		ctx.beginPath(); ctx.moveTo(x - 17, y + 9); ctx.quadraticCurveTo(x - 20, y - 10, x - 4, y - 14);
		ctx.quadraticCurveTo(x + 14, y - 16, x + 18, y + 2); ctx.stroke();
		ctx.strokeStyle = 'rgba(37,99,235,.8)'; ctx.lineWidth = 2;
		for (var i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * 8, y + 15); ctx.lineTo(x + i * 8 - 3, y + 24); ctx.stroke(); }
	}

	// ink-sketched Mauerpark pigeon
	function pigeon(x, y, dir) {
		ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
		ctx.fillStyle = 'rgba(148,163,184,.7)';
		ctx.beginPath(); ctx.ellipse(0, 3, 14, 9, -0.15, 0, Math.PI * 2); ctx.fill();
		ctx.fillStyle = 'rgba(129,140,248,.45)';
		ctx.beginPath(); ctx.arc(10, -6, 7, 0, Math.PI * 2); ctx.fill();
		ctx.strokeStyle = '#1A1615'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
		ctx.beginPath(); ctx.ellipse(0, 3, 14, 9, -0.15, Math.PI * 0.1, Math.PI * 1.7); ctx.stroke();
		ctx.beginPath(); ctx.arc(10, -6, 7, Math.PI * 0.9, Math.PI * 2.4); ctx.stroke();
		ctx.beginPath(); ctx.moveTo(-3, 0); ctx.quadraticCurveTo(2, -4, 6, 3); ctx.stroke();
		ctx.fillStyle = '#E8622C'; ctx.beginPath(); ctx.moveTo(16, -7); ctx.lineTo(21, -5); ctx.lineTo(16, -3); ctx.fill();
		ctx.fillStyle = '#1A1615'; ctx.beginPath(); ctx.arc(12, -8, 1.4, 0, Math.PI * 2); ctx.fill();
		ctx.restore();
	}

	function pill(x, y, w, h, rad) {
		ctx.beginPath();
		if (ctx.roundRect) ctx.roundRect(x, y, w, h, rad); else ctx.rect(x, y, w, h);
	}

	function emoji(ch, x, y, size) {
		ctx.font = size + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
		ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
		ctx.fillText(ch, x, y);
	}

	function drawPortrait() {
		var P = portrait, prog = Math.min(1, (score || 0) / WIN);
		// watercolour splashes from everything caught
		for (var i = 0; i < splashes.length; i++) {
			var s = splashes[i];
			ctx.globalAlpha = s.color === '#1A1615' ? 0.06 : 0.2;
			ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fillStyle = s.color; ctx.fill();
		}
		ctx.globalAlpha = 1;
		ctx.lineCap = 'round'; ctx.lineJoin = 'round';
		// faint guide so you can see what you're painting
		ctx.strokeStyle = 'rgba(26,22,21,.08)'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]);
		P.paths.forEach(function (x) { ctx.stroke(x.p); });
		// ink lines, drawn stroke by stroke with the score
		var left = P.total * prog;
		ctx.strokeStyle = '#1A1615'; ctx.lineWidth = 3.2;
		for (var k = 0; k < P.paths.length && left > 0; k++) {
			var seg = P.paths[k], n = Math.min(seg.len, left);
			ctx.setLineDash([n, seg.len + 10]); ctx.stroke(seg.p);
			left -= n;
		}
		ctx.setLineDash([]);
		if (prog >= 1) {
			// blush + golden frame when finished
			ctx.globalAlpha = 0.45; ctx.fillStyle = '#F472B6';
			ctx.beginPath(); ctx.arc(P.cx - P.R * 0.55, P.cy + P.R * 0.22, P.R * 0.15, 0, Math.PI * 2); ctx.fill();
			ctx.beginPath(); ctx.arc(P.cx + P.R * 0.55, P.cy + P.R * 0.22, P.R * 0.15, 0, Math.PI * 2); ctx.fill();
			ctx.globalAlpha = 1;
			ctx.strokeStyle = '#D4A017'; ctx.lineWidth = 5;
			pill(P.cx - P.R * 1.45, P.cy - P.R * 1.6, P.R * 2.9, P.R * 2.85, 8); ctx.stroke();
		}
	}

	function draw() {
		if (!W) return;
		ctx.save();
		ctx.clearRect(0, 0, W, H);
		if (shake > 0) ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6);
		var g = ctx.createLinearGradient(0, 0, 0, H);
		g.addColorStop(0, '#FFFDF8'); g.addColorStop(1, '#F5ECE2');
		ctx.fillStyle = g; ctx.fillRect(-10, -10, W + 20, H + 20);
		// soft watercolour washes on the paper
		ctx.globalAlpha = 0.07;
		ctx.fillStyle = '#FF6B35'; ctx.beginPath(); ctx.arc(W * 0.1, H * 0.2, H * 0.3, 0, Math.PI * 2); ctx.fill();
		ctx.fillStyle = '#3B82F6'; ctx.beginPath(); ctx.arc(W * 0.92, H * 0.75, H * 0.35, 0, Math.PI * 2); ctx.fill();
		ctx.globalAlpha = 1;
		drawPortrait();
		// Mauerpark lawn as a loose green brush stroke
		ctx.fillStyle = 'rgba(74,160,90,.35)'; ctx.fillRect(-10, H - 12, W + 20, 22);
		ctx.strokeStyle = 'rgba(26,22,21,.5)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, H - 12);
		for (var gx = 0; gx <= W; gx += 24) ctx.quadraticCurveTo(gx + 12, H - 15, gx + 24, H - 12);
		ctx.stroke();

		(items || []).forEach(function (it) {
			if (it.type === 'ink') drop(it.x, it.y, it.r, '#1A1615');
			else if (it.type === 'paint') drop(it.x, it.y, it.r, it.color);
			else if (it.type === 'gold') goldDrop(it.x, it.y, it.r + 1);
			else if (it.type === 'life') heart(it.x, it.y, 13);
			else if (it.type === 'rain') rainCloud(it.x, it.y);
			else if (it.type === 'pigeon') pigeon(it.x, it.y, Math.cos(elapsed * 3 + it.phase) >= 0 ? 1 : -1);
			else if (it.type === 'name') {
				pill(it.x - it.w / 2, it.y - 13, it.w, 26, 13);
				ctx.fillStyle = '#FFF0FB'; ctx.fill(); ctx.strokeStyle = '#FF95DF'; ctx.lineWidth = 1.5; ctx.stroke();
				ctx.fillStyle = '#9D1075'; ctx.font = '700 13px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
				ctx.fillText('💛 ' + it.text, it.x, it.y + 1);
			}
		});

		// the fox with its palette
		ctx.beginPath(); ctx.ellipse(fox.x, H - 22, 38, 11, 0, 0, Math.PI * 2);
		ctx.fillStyle = '#E9C9A0'; ctx.fill(); ctx.strokeStyle = '#A0764A'; ctx.lineWidth = 1.5; ctx.stroke();
		for (var c = 0; c < 5; c++) {
			ctx.beginPath(); ctx.arc(fox.x - 24 + c * 12, H - 22, 3.6, 0, Math.PI * 2); ctx.fillStyle = PAINTS[c]; ctx.fill();
		}
		emoji('🦊', fox.x, H - 46, 34);

		(particles || []).forEach(function (p) {
			ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 0.5));
			if (p.text) {
				ctx.font = '800 15px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y);
			} else {
				ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.fill();
			}
		});
		ctx.globalAlpha = 1;
		ctx.restore();
	}

	// ---------- start / end ----------
	function start() {
		resize(); reset(); updateHud();
		running = true; paused = false;
		overlay.hidden = true;
		stage.classList.add('is-playing');
		say('Los geht\'s! ' + names.length + ' Namen von der Dankbarkeitswand fallen mit. Fang Farben, weich Regen & Tauben aus.');
		canvas.focus({ preventScroll: true });
		requestAnimationFrame(frame);
	}

	function end() {
		running = false;
		stage.classList.remove('is-playing');
		var newBest = score > best;
		if (newBest) { best = score; saveBest(best); }
		updateHud(); draw();
		overlayTitle.textContent = won ? 'Porträt fertig! 🎉' : (lives <= 0 ? 'Oh nein, keine Leben mehr' : 'Zeit um!');
		overlayText.textContent = score + ' Punkte' + (newBest ? ' – neuer Rekord!' : ' · Rekord: ' + best) +
			(won ? '' : ' · Noch ' + Math.max(0, WIN - score) + ' bis zum fertigen Porträt.');
		startBtn.textContent = 'Nochmal spielen';
		overlay.hidden = false;
		say(won ? 'Gewonnen mit ' + score + ' Punkten!' : 'Runde vorbei: ' + score + ' Punkte.');
		if (won) {
			var d = new Date();
			prizeScore.innerHTML = 'Punkte: <strong>' + score + '</strong> · ' + d.toLocaleDateString('de-DE') + ', ' +
				d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
			prize.classList.add('show');
		}
	}

	// ---------- controls ----------
	function pointerX(e) { var r = canvas.getBoundingClientRect(); return e.clientX - r.left; }
	canvas.addEventListener('pointermove', function (e) { if (running) fox.target = pointerX(e); });
	canvas.addEventListener('pointerdown', function (e) { if (running) { fox.target = pointerX(e); e.preventDefault(); } });
	document.addEventListener('keydown', function (e) {
		if (!running) return;
		var k = e.key;
		if (k === 'ArrowLeft' || k === 'a' || k === 'A') { keyDir = -1; e.preventDefault(); }
		if (k === 'ArrowRight' || k === 'd' || k === 'D') { keyDir = 1; e.preventDefault(); }
	});
	document.addEventListener('keyup', function (e) {
		if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && keyDir < 0) keyDir = 0;
		if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && keyDir > 0) keyDir = 0;
	});
	document.addEventListener('visibilitychange', function () {
		paused = document.hidden;
		if (paused && running) say('Pause – komm zurück, das Porträt wartet.');
	});
	startBtn.addEventListener('click', start);
	prizeClose.addEventListener('click', function () { prize.classList.remove('show'); });
	prize.addEventListener('click', function (e) { if (e.target === prize) prize.classList.remove('show'); });
	window.addEventListener('resize', resize);

	reset(); resize(); updateHud();
	say('Bereit! ' + names.length + ' Namen von der Dankbarkeitswand sind im Spiel.');
})();
