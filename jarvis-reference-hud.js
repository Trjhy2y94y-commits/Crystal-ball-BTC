/* Reference-inspired cinematic JARVIS overlay, linked to real app navigation. */
(()=>{
const mount=()=>{
 const deck=document.querySelector('#vHome .cb-flightdeck');if(!deck||deck.querySelector('.jarvis-reference-hud'))return;
 const hud=document.createElement('div');hud.className='jarvis-reference-hud';
 hud.innerHTML=`
 <div class="jrh-top"><span class="jrh-voice">◉ <span>VOICE COMMAND<br><b>ACTIVE ON TAP</b></span></span><strong>J.A.R.V.I.S.</strong><span class="jrh-signal">● SYSTEM ONLINE<br><small>CRYSTAL INTELLIGENCE</small></span></div>
 <div class="jrh-clock"><strong id="jrhClock">--:--</strong><small>BITCOIN INTELLIGENCE</small></div>
 <div class="jrh-side jrh-left">
 <section class="jrh-panel"><header>SYSTEM STATUS <span>✕</span></header><div class="jrh-meter">MARKET DATA<i><b style="width:100%"></b></i></div><div class="jrh-meter">ANALYTICS<i><b style="width:100%"></b></i></div><div class="jrh-meter">VOICE CHANNEL<i><b style="width:0%" id="jrhVoiceMeter"></b></i></div></section>
 <section class="jrh-panel"><header>ENVIRONMENT <span>⌁</span></header><div class="jrh-mini-grid"><span>◉<b>LIVE</b><small>MARKET</small></span><span>⌁<b>BTC</b><small>USD</small></span><span>◇<b>24/7</b><small>SCAN</small></span><span>✧<b>AI</b><small>JARVIS</small></span></div></section>
 </div>
 <div class="jrh-side jrh-right">
 <section class="jrh-panel jrh-map"><header>MARKET RADAR <span>✕</span></header><div class="jrh-radar"><span class="jrh-radar-sweep"></span><span class="jrh-radar-core">₿</span></div><small>GLOBAL MARKET MONITORING</small></section>
 <section class="jrh-panel"><header>MISSION <span>✕</span></header><div class="jrh-check">▣ LIVE BTC ANALYSIS</div><div class="jrh-check">▣ CYCLE PROJECTIONS</div><div class="jrh-check">▣ JARVIS ASSISTANT</div></section>
 </div>
 <div class="jrh-center-caption">TARGET ANALYSIS <span>●</span> HOLOGRAPHIC SCAN</div>
 <div class="jrh-bottom"><button type="button" data-go="home"><span>⌖</span>CRYSTAL</button><button type="button" data-go="chart"><span>◎</span>ANALYSE</button><button type="button" data-go="cal"><span>▦</span>CYCLE</button><button type="button" data-go="jarvis"><span>◉</span>JARVIS</button><button type="button" data-go="stats"><span>⚙</span>FIABILITÉ</button></div>
 <button class="jrh-voice-launch" type="button" aria-label="Démarrer JARVIS">🎙 <span>PARLER À JARVIS</span></button>
 `;
 deck.appendChild(hud);
 hud.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.matches('.jrh-voice-launch')){document.getElementById('cbVoiceLaunch')?.click();return;}const tab=b.dataset.go;if(tab){const nav=document.querySelector('.tabbar button[data-tab="'+tab+'"]');nav?.click();}});
 const syncLive=()=>{const root=document.querySelector('#vHome');if(!root)return;const panel=hud.querySelector('.jrh-signal');if(!panel)return;const liveText=(root.innerText||'').slice(0,12000);const hasMarket=/BTC\s*[/\-]?\s*USD|\$\s*\d[\d,.]+|\d[\d,.]+\s*\$/i.test(liveText);panel.querySelector('small').textContent=hasMarket?'MARKET VIEW ACTIVE':'MARKET VIEW WAITING';};syncLive();const marketTimer=setInterval(()=>{if(!document.hidden)syncLive()},10000);window.addEventListener('pagehide',()=>clearInterval(marketTimer),{once:true});
 const clock=()=>{const d=new Date();const e=document.getElementById('jrhClock');if(e)e.textContent=d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})};clock();setInterval(clock,30000);
 document.addEventListener('crystal:jarvis:voice',e=>{const type=e.detail?.type||'';hud.classList.toggle('jrh-listening',type==='input_audio_buffer.speech_started'||type==='session.open');hud.classList.toggle('jrh-speaking',type==='response.audio.delta'||type==='response.output_audio.delta');const meter=document.getElementById('jrhVoiceMeter');if(meter)meter.style.width=(type==='session.open'||type==='input_audio_buffer.speech_started'||type==='response.audio.delta'||type==='response.output_audio.delta')?'100%':'0%';if(type==='session.closed')hud.classList.remove('jrh-listening','jrh-speaking')});
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();