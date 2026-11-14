/* V70 layered cinematic reactor: depth-sorted orbit paths, light arcs and particle shell. */
(()=>{'use strict';
function init(){
 const deck=document.querySelector('#vHome #homeQuant .cb-flightdeck');
 const orbit=deck?.querySelector('.hq-orbit');if(!deck||!orbit||deck.querySelector('.v70-reactor'))return;
 const canvas=document.createElement('canvas');canvas.className='v70-reactor';canvas.setAttribute('aria-hidden','true');orbit.appendChild(canvas);
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 const particles=Array.from({length:360},(_,i)=>{const y=1-2*(i+.5)/360,r=Math.sqrt(1-y*y),a=i*2.399963;return{x:r*Math.cos(a),y,z:r*Math.sin(a),seed:i}});
 let raf=0,visible=false,last=0;const obs=new IntersectionObserver(es=>{visible=!!es[0]?.isIntersecting;if(visible)request();else if(raf){cancelAnimationFrame(raf);raf=0}},{threshold:.02});obs.observe(deck);
 const project=(x,y,z,ang,R)=>{const ca=Math.cos(ang),sa=Math.sin(ang),xx=x*ca-z*sa,zz=x*sa+z*ca,scale=2.7/(3.7-zz);return [R*xx*scale,R*y*scale,zz,scale]};
 function frame(t){
  raf=0;if(!visible||document.hidden)return;
  if(!reduce.matches&&t-last<33){request();return}last=t;
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5),w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
  if(!w||!h)return;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
  ctx.clearRect(0,0,w,h);const cx=w/2,cy=h/2,R=Math.min(w,h)*.37;
  const angle=reduce.matches?.3:t*.00016;
  const drawRing=(radius,tilt,phase,color,alpha,width)=>{ctx.beginPath();for(let i=0;i<=160;i++){const a=i/160*Math.PI*2+phase,pt=project(Math.cos(a)*radius,Math.sin(a)*radius*Math.cos(tilt),Math.sin(a)*radius*Math.sin(tilt),angle,R);if(i===0)ctx.moveTo(cx+pt[0],cy+pt[1]);else ctx.lineTo(cx+pt[0],cy+pt[1])}ctx.strokeStyle=color;ctx.globalAlpha=alpha;ctx.lineWidth=width*dpr;ctx.shadowBlur=10*dpr;ctx.shadowColor=color;ctx.stroke();ctx.globalAlpha=1};
  for(let k=0;k<11;k++)drawRing(1.12+(k%4)*.09,.28+k*.26,angle*(k%2?-1:1)*1.8+k*.38,k%3===0?'#ffab4c':'#39b9ff',.18+(k%3)*.09,.7);
  const sorted=particles.map(p=>({p,xyz:project(p.x,p.y,p.z,angle,R)})).sort((a,b)=>a.xyz[2]-b.xyz[2]);
  for(const {p,xyz} of sorted){const [x,y,z,scale]=xyz;const warm=(p.seed%5)<2;ctx.fillStyle=warm?'#ffb35e':'#70d7ff';ctx.globalAlpha=(.28+.5*(z+1)/2)*Math.min(1,scale);ctx.beginPath();ctx.arc(cx+x,cy+y,Math.max(.5,scale*1.35)*dpr,0,Math.PI*2);ctx.fill()}
  ctx.globalAlpha=1;
  for(let k=0;k<24;k++){const a=k*2.39996+angle*.8,rad=.55+(k%9)*.065;ctx.beginPath();for(let j=0;j<=34;j++){const u=j/34,theta=a+u*1.9,pt=project(rad*Math.cos(theta),.75*Math.sin(theta*1.5+k*.3),rad*Math.sin(theta),angle,R);if(j===0)ctx.moveTo(cx+pt[0],cy+pt[1]);else ctx.lineTo(cx+pt[0],cy+pt[1])}ctx.strokeStyle=k%3?'#3dbaff':'#ff9139';ctx.globalAlpha=.28;ctx.lineWidth=.65*dpr;ctx.stroke()}ctx.globalAlpha=1;ctx.shadowBlur=0;
  if(!reduce.matches)request();
 }
 function request(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(frame)}
 document.addEventListener('visibilitychange',request);reduce.addEventListener?.('change',request);window.addEventListener('resize',request,{passive:true});request();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();