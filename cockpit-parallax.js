/* GPU-friendly parallax for the panoramic cockpit; no market-data changes. */
(()=>{
 const init=()=>{
  const deck=document.querySelector('#vHome #homeQuant .cb-flightdeck');
  if(!deck)return;
  const city=deck.querySelector('.cb-depth-city'),world=deck.querySelector('.cb-depth-world'),glass=deck.querySelector('.cb-depth-glass');
  if(!city||!world)return;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  let x=0,y=0,tx=0,ty=0,raf=0,visible=true;
  const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;if(visible&&!raf&&!reduce.matches)raf=requestAnimationFrame(tick)},{threshold:.02});
  observer.observe(deck);
  function tick(){
   raf=0;if(!visible||reduce.matches)return;
   x+=(tx-x)*.075;y+=(ty-y)*.075;
   world.style.setProperty('--cb-parallax-x',x.toFixed(2)+'px');
   world.style.setProperty('--cb-parallax-y',y.toFixed(2)+'px');
   city.style.setProperty('--cb-city-shift',(-x*.4).toFixed(2)+'px');
   if(glass)glass.style.setProperty('--cb-glass-shift',(x*.18).toFixed(2)+'px');
   if(Math.abs(tx-x)>.08||Math.abs(ty-y)>.08)raf=requestAnimationFrame(tick);
  }
  function target(px,py){tx=Math.max(-12,Math.min(12,px));ty=Math.max(-8,Math.min(8,py));if(!raf&&!reduce.matches)raf=requestAnimationFrame(tick)}
  deck.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=deck.getBoundingClientRect();target(((e.clientX-r.left)/r.width-.5)*24,((e.clientY-r.top)/r.height-.5)*16)},{passive:true});
  deck.addEventListener('pointerleave',()=>target(0,0),{passive:true});
  // Motion sensors require a separate iOS permission gesture; never request it silently.
  document.addEventListener('visibilitychange',()=>{if(document.hidden){visible=false;if(raf)cancelAnimationFrame(raf);raf=0}else{visible=true;target(0,0)}});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();