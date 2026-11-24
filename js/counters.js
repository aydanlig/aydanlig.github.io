// Live counters as split-flap cards: portraits (estimate 1,360 on 24.11.2026, +10/week), followers (data/followers.json), past events (js/termine.js)
(function(){
  var base=1360, t0=Date.UTC(2026,10,24), perMs=10/(7*864e5);
  var portraits=function(){return Math.floor(base+(Date.now()-t0)*perMs)};
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function set(el,v){
    var pad=+el.dataset.pad||String(v).length, s=String(v).padStart(pad,'0');
    if(el.dataset.v===s)return; el.dataset.v=s;
    while(el.children.length<s.length){var c=document.createElement('span');c.className='fd';c.textContent='0';el.appendChild(c)}
    el.setAttribute('aria-label',v);
    [].forEach.call(el.children,function(c,i){
      var d=s[i]; if(c.textContent===d)return;
      if(reduce){c.textContent=d;return}
      setTimeout(function(){c.classList.remove('flip');void c.offsetWidth;c.classList.add('flip');setTimeout(function(){c.textContent=d},200)},i*90);
    });
  }
  function init(el){var pad=+el.dataset.pad||1;el.textContent='';set(el,0);el.dataset.v=''.padStart(pad,'0')}
  function followers(f){fetch('/data/followers.json',{cache:'no-cache'}).then(function(r){return r.json()}).then(function(j){f.forEach(function(el){set(el,j.total)});var p=j.platforms||{},b=document.querySelector('#sechs-jahre .ib');if(b){var en=b.dataset.en==='1';b.dataset.tip='Instagram '+p.instagram+' + YouTube '+p.youtube+' + Substack '+p.substack+(en?'. Updates automatically.':'. Aktualisiert sich automatisch.')}}).catch(function(){})}
  function start(){
    document.querySelectorAll('[data-count="portraits"]').forEach(function(el){set(el,portraits());setInterval(function(){set(el,portraits())},60000)});
    var f=document.querySelectorAll('[data-count="followers"]');
    if(f.length){followers(f);setInterval(function(){followers(f)},120000)}
    var ev=document.querySelectorAll('[data-count="events"]');
    if(ev.length&&window.TERMINE){var td=new Date().toISOString().slice(0,10);var n=window.TERMINE.filter(function(e){return e.date<td}).length;ev.forEach(function(el){set(el,n)})}
  }
  document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#sechs-jahre .ib'))e.preventDefault()});
  var box=document.querySelector('.live-counters');
  if(!box)return;
  box.querySelectorAll('[data-count]').forEach(init);
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(e){if(e[0].isIntersecting){io.disconnect();setTimeout(start,250)}});io.observe(box)}else start();
})();
