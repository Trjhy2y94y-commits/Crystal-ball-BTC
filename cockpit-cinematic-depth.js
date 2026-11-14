/* Cinematic depth for the user's exact cockpit artwork. Original JPG remains untouched. */
(()=>{'use strict';
const start=()=>{
 const deck=document.querySelector('#vHome #homeQuant .cb-flightdeck');
 if(!deck||deck.querySelector('.cb-cinema-particles'))return;
 const canvas=document.createElement('canvas');canvas.className='cb-cinema-particles';canvas.setAttribute('aria-hidden','true');deck.appendChild(canvas);
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const particles=Array.from({length:45},(_,i)=>({x:((i*73.73)%101)/101,y:((i*43.31)%97)/97,depth:.3+((i*17)%13)/13,phase:i*2.3}));
 let w=0,h=0,raf=0,visible=false,active=true,dx=0,dy=0,targetX=0,targetY=0,last=0;
 const resize=()=>{const b=deck.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.4);w=b.width;h=b.height;const cw=Math.round(w*dpr),ch=Math.round(h*dpr);if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw;canvas.height=ch;ctx.setTransform(dpr,0,0,dpr,0,0)}};
 const draw=now=>{
 raf=0;if(!visible||document.hidden||!active)return;
 if(now-last<33){raf=requestAnimationFrame(draw);return}last=now;resize();
 dx+=(targetX-dx)*.045;dy+=(targetY-dy)*.045;
 deck.style.setProperty('--cinema-x',dx.toFixed(3));deck.style.setProperty('--cinema-y',dy.toFixed(3));deck.style.setProperty('--cinema-shift-bg-x',(-dx*4).toFixed(2)+'px');deck.style.setProperty('--cinema-shift-bg-y',(-dy*3).toFixed(2)+'px');deck.style.setProperty('--cinema-shift-hud-x',(dx*2).toFixed(2)+'px');deck.style.setProperty('--cinema-shift-hud-y',(dy*1.5).toFixed(2)+'px');
 ctx.clearRect(0,0,w,h);
 const t=now*.001;
 for(const p of particles){const y=((p.y-t*.006*p.depth)%1+1)%1,x=p.x+dx*.006*p.depth,r=.35+p.depth*.75;const alpha=(.16+.22*Math.sin(t*.8+p.phase)**2)*Math.min(1,y*7)*Math.min(1,(1-y)*7);
 ctx.beginPath();ctx.fillStyle='rgba(93,172,255,'+alpha.toFixed(3)+')';ctx.shadowBlur=7;ctx.shadowColor='#358fff';ctx.arc(x*w,y*h,r,0,Math.PI*2);ctx.fill();}
 ctx.shadowBlur=0;
 if(!reduce.matches)raf=requestAnimationFrame(draw);
 };
 const request=()=>{if(visible&&!raf&&!document.hidden)raf=requestAnimationFrame(draw)};
 const observer=new IntersectionObserver(e=>{visible=!!e[0]?.isIntersecting;if(visible)request();else if(raf){cancelAnimationFrame(raf);raf=0}},{threshold:.02});observer.observe(deck);
 deck.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=deck.getBoundingClientRect();targetX=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1));targetY=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1));request()},{passive:true});
 deck.addEventListener('pointerleave',()=>{targetX=0;targetY=0;request()},{passive:true});
 // Touch-controlled parallax works on iPhone without gyroscope permission.
 let touchOrigin=null;
 deck.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;const p=e.touches[0];touchOrigin={x:p.clientX,y:p.clientY}},{passive:true});
 deck.addEventListener('touchmove',e=>{if(!touchOrigin||e.touches.length!==1)return;const p=e.touches[0];targetX=Math.max(-1,Math.min(1,(p.clientX-touchOrigin.x)/90));targetY=Math.max(-1,Math.min(1,(p.clientY-touchOrigin.y)/110));request()},{passive:true});
 deck.addEventListener('touchend',()=>{touchOrigin=null;targetX=0;targetY=0;request()},{passive:true});
 if(window.DeviceOrientationEvent){window.addEventListener('deviceorientation',e=>{if(!visible||e.gamma==null)return;targetX=Math.max(-1,Math.min(1,e.gamma/28));targetY=Math.max(-1,Math.min(1,(e.beta||0)/55));request()},{passive:true})}
 document.addEventListener('visibilitychange',request);window.addEventListener('resize',request,{passive:true});
 const media=()=>{if(raf)cancelAnimationFrame(raf);raf=0;request()};reduce.addEventListener?.('change',media);
 request();
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();