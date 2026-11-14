/* JARVIS voice launch: explicit user gesture required by iOS Safari. */
(()=>{
'use strict';
function ready(){
 if(document.getElementById('cbVoiceLaunch'))return;
 const b=document.createElement('button');
 b.id='cbVoiceLaunch';b.type='button';b.setAttribute('aria-label','Parler à JARVIS');
 b.innerHTML='<span class="cb-voice-icon" aria-hidden="true">◉</span><span class="cb-voice-label">PARLER À JARVIS</span>';
 document.body.appendChild(b);
 const status=document.createElement('span');status.id='cbVoiceLaunchStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');document.body.appendChild(status);
 b.addEventListener('click',()=>{
  const mic=document.getElementById('jvMic');
  const nav=document.querySelector('.tabbar button[data-tab="jarvis"]');
  if(!mic){status.textContent='Module JARVIS indisponible';return;}
  if(nav && !nav.classList.contains('on'))nav.click();
  // Preserve user activation: microphone is opened synchronously by JARVIS's existing capture handler.
  mic.click();
  b.classList.add('cb-voice-engaged');
  status.textContent='Autorise le microphone si Safari le demande';
 });
 document.addEventListener('crystal:jarvis:voice',e=>{
  const t=e.detail?.type||'';
  const live=/session.open|speech_started|response.audio.delta|response.output_audio.delta/.test(t);
  if(t==='session.closed'){b.classList.remove('cb-voice-engaged');status.textContent='JARVIS en veille';}
  else if(live){b.classList.add('cb-voice-engaged');status.textContent=t.includes('speech_started')?'JARVIS écoute':t.includes('delta')?'JARVIS répond':'JARVIS connecté';}
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();