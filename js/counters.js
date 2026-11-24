// Live counters: portraits drawn (estimate: 1,360 on 24.11.2026, +10 per week) + followers from data/followers.json
(function(){
  var base=1360, t0=Date.UTC(2026,10,24), perMs=10/(7*864e5);
  var portraits=function(){return Math.floor(base+(Date.now()-t0)*perMs)};
  var loc=document.documentElement.lang==='en'?'en-US':'de-DE';
  function countUp(el,to){
    var from=Math.max(0,to-Math.min(to,400)),d=1400,s=performance.now();
    (function f(n){var p=Math.min(1,(n-s)/d);el.textContent=Math.round(from+(to-from)*(1-Math.pow(1-p,3))).toLocaleString(loc);if(p<1)requestAnimationFrame(f)})(s);
  }
  function start(){
    document.querySelectorAll('[data-count="portraits"]').forEach(function(el){
      countUp(el,portraits());
      setInterval(function(){el.textContent=portraits().toLocaleString(loc)},60000);
    });
    var f=document.querySelectorAll('[data-count="followers"]');
    if(f.length)fetch('/data/followers.json',{cache:'no-cache'}).then(function(r){return r.json()}).then(function(j){f.forEach(function(el){countUp(el,j.total)})}).catch(function(){});
    var ev=document.querySelectorAll('[data-count="events"]');if(ev.length&&window.TERMINE){var td=new Date().toISOString().slice(0,10);var n=window.TERMINE.filter(function(e){return e.date<td}).length;ev.forEach(function(el){countUp(el,n)})}
  }
  var box=document.querySelector('.live-counters');
  if(!box)return;
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(e){if(e[0].isIntersecting){io.disconnect();start()}});io.observe(box)}else start();
})();
