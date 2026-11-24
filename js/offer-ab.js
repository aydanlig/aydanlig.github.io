/* A/B test of the offer carousel buttons (homepage + where-i-draw, DE/EN).
   A = thumbnail grid on desktop, B = small chips everywhere. Phones always see chips.
   Variant is random, kept per visitor (localStorage). GA events (only after consent):
     offer_ab_view   {variant}           carousel shown
     offer_ab_tab    {variant, offer}    offer button clicked
     offer_ab_click  {variant, link}     a link inside a slide clicked (= conversion)
   GA4 → Explore → events, breakdown by parameter "variant" (register it as custom dimension). */
(function () {
	var g = document.querySelector('.stand-gallery'); if (!g) return;
	var v; try { v = localStorage.getItem('offerAB'); } catch (e) { }
	if (v !== 'A' && v !== 'B') { v = Math.random() < .5 ? 'A' : 'B'; try { localStorage.setItem('offerAB', v); } catch (e) { } }
	if (v === 'B') g.classList.add('sg-b');
	var seen = 0;
	function ev(n, p) { if (!window.gtag) return; if (!seen) { seen = 1; try { gtag('event', 'offer_ab_view', { variant: v }); } catch (e) { } } if (n) try { p.variant = v; gtag('event', n, p); } catch (e) { } }
	var t = setInterval(function () { if (window.gtag) { ev(); clearInterval(t); } }, 1000); setTimeout(function () { clearInterval(t); }, 60000);
	g.addEventListener('click', function (e) {
		var b = e.target.closest('.sg-tabs button'); if (b) return ev('offer_ab_tab', { offer: b.textContent.trim().slice(0, 40) });
		var a = e.target.closest('.sg-slide a'); if (a) ev('offer_ab_click', { link: a.getAttribute('href') });
	});
})();
