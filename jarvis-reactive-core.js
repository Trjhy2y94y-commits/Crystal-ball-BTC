/* Bridge existing JARVIS Realtime events to the already-installed cinematic reactor. */
(()=>{'use strict';
const allowed=new Set(['idle','listening','thinking','speaking','alert','connecting','error']);
let state='idle',reset;
function setState(next){
 if(!allowed.has(next))return;
 state=next;
 const reactor=document.querySelector('#vJarvis .jarvis-reactor-v3');
 if(reactor){reactor.dataset.mode=next;reactor.dataset.voiceState=next;
 const label=reactor.querySelector('.jr-label');
 if(label)label.textContent=({idle:'JARVIS · EN VEILLE',listening:'JARVIS · ÉCOUTE ACTIVE',thinking:'JARVIS · ANALYSE',speaking:'JARVIS · RÉPONSE VOCALE',alert:'JARVIS · ALERTE',connecting:'JARVIS · CONNEXION',error:'JARVIS · ERREUR'})[next];}
}
const style=document.createElement('style');style.textContent=`
#vJarvis .jarvis-reactor-v3[data-voice-state="speaking"] .jr-core{animation-duration:.45s!important;filter:brightness(1.4)}
#vJarvis .jarvis-reactor-v3[data-voice-state="listening"] .jr-ring.outer{animation-duration:5s!important}
#vJarvis .jarvis-reactor-v3[data-voice-state="thinking"] .jr-ring.mid{animation-duration:2s!important}
#vJarvis .jarvis-reactor-v3[data-voice-state="alert"] .jr-ring{border-color:#f4c66e!important}
@media(prefers-reduced-motion:reduce){#vJarvis .jarvis-reactor-v3 *{animation:none!important}}
`;document.head.appendChild(style);
document.addEventListener('crystal:jarvis:voice',e=>{const type=e.detail?.type||'';
 clearTimeout(reset);
 if(type==='session.open')setState('listening');
 else if(type==='session.closed')setState('idle');
 else if(type==='input_audio_buffer.speech_started')setState('listening');
 else if(type==='input_audio_buffer.speech_stopped')setState('thinking');
 else if(type==='response.created')setState('thinking');
 else if(type==='response.audio.delta'||type==='response.output_audio.delta')setState('speaking');
 else if(type==='response.done'||type==='response.audio.done'||type==='response.output_audio.done'){setState('listening');}
 else if(type==='error')setState('error');
});
window.CrystalJarvisVisual={setState,getState:()=>state};
})();