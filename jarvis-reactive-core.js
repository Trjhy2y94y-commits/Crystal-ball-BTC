/* JARVIS reactive core — visual layer only; no microphone permission requested. */
(()=>{'use strict';
const css=`
.jarvis-reactive-core{position:relative;width:min(64vw,280px);aspect-ratio:1;margin:16px auto;isolation:isolate;display:grid;place-items:center;filter:drop-shadow(0 0 22px #1561cc88)}
.jarvis-reactive-core .jr-ring{position:absolute;inset:8%;border:2px solid #368aff;border-radius:50%;box-shadow:inset 0 0 16px #1756b866,0 0 20px #1561c866;animation:jr-spin 13s linear infinite}
.jarvis-reactive-core .jr-ring:nth-child(2){inset:18%;border:2px dashed #d9a949;animation-duration:9s;animation-direction:reverse}
.jarvis-reactive-core .jr-ring:nth-child(3){inset:29%;border:3px solid #5ea9ff;animation-duration:5s}
.jarvis-reactive-core .jr-core{width:32%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#c4dfff 0%,#2467c7 30%,#08152c 72%);box-shadow:0 0 25px #3389ff,0 0 65px #1451bd88;animation:jr-pulse 2.5s ease-in-out infinite}
.jarvis-reactive-core[data-state="speaking"] .jr-core{animation-duration:.55s}
.jarvis-reactive-core[data-state="listening"] .jr-ring{animation-duration:3s}
.jarvis-reactive-core[data-state="thinking"] .jr-ring:nth-child(2){animation-duration:1.6s}
.jarvis-reactive-core[data-state="alert"] .jr-ring{border-color:#eac26b;box-shadow:0 0 25px #eac26b}
@keyframes jr-spin{to{transform:rotate(360deg)}}@keyframes jr-pulse{50%{transform:scale(1.13);filter:brightness(1.5)}}
@media(prefers-reduced-motion:reduce){.jarvis-reactive-core *{animation:none!important}}
`;
const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
function mount(){
  const candidates=[...document.querySelectorAll('[id],[class]')].filter(el=>/jarvis/i.test(String(el.id)+' '+String(el.className))&&el.getBoundingClientRect().width>100);
  const host=candidates.find(el=>/panel|view|page|screen|section/i.test(String(el.id)+' '+String(el.className)));
  if(!host||host.querySelector('.jarvis-reactive-core'))return;
  const core=document.createElement('div');core.className='jarvis-reactive-core';core.dataset.state='idle';core.setAttribute('role','img');core.setAttribute('aria-label','Noyau holographique JARVIS');
  core.innerHTML='<span class="jr-ring"></span><span class="jr-ring"></span><span class="jr-ring"></span><span class="jr-core"></span>';
  host.prepend(core);
}
const observer=new MutationObserver(()=>{if(!document.querySelector('.jarvis-reactive-core'))mount()});
function start(){mount();observer.observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.CrystalJarvisVisual={setState(state){const core=document.querySelector('.jarvis-reactive-core');if(core&&['idle','listening','thinking','speaking','alert'].includes(state))core.dataset.state=state}};
})();