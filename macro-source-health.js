/* Crystal Ball BTC — independent macro source diagnostics.
   This does NOT claim that the existing Fed/ECB composite is Global M2. */
(()=>{'use strict';
const DEFAULT='https://m2liquidity.js2ptr5kdt.workers.dev';
const SERIES=[['WM2NS','M2 existante'],['WALCL','Bilan Fed'],['WTREGEN','Trésor US'],['RRPONTSYD','Reverse repo'],['ECBASSETSW','Bilan BCE'],['DEXUSEU','EUR/USD']];
function create(){
 if(document.getElementById('cbMacroHealth'))return;
 const input=document.getElementById('lUrl');if(!input)return;
 const panel=document.createElement('section');panel.id='cbMacroHealth';panel.setAttribute('aria-label','État des sources macro');
 panel.innerHTML='<div class="cb-macro-title"><strong>DIAGNOSTIC SOURCES M2</strong><button type="button" id="cbMacroRefresh">Vérifier</button></div><p id="cbMacroState" role="status">Connexion non vérifiée</p><div id="cbMacroRows"></div><p class="cb-macro-global"><strong>Global M2 (US + Europe + Chine + Japon)</strong> : non connectée. Le composite Fed/BCE existant n’est pas une Global M2.</p>';
 input.closest('label')?.insertAdjacentElement('afterend',panel);
 const state=panel.querySelector('#cbMacroState'),rows=panel.querySelector('#cbMacroRows'),button=panel.querySelector('#cbMacroRefresh');
 const fmt=d=>{const x=Date.parse(d);return Number.isFinite(x)?new Date(x).toLocaleDateString('fr-FR'):'date inconnue'};
 async function check(){
  button.disabled=true;state.textContent='Vérification en cours…';rows.replaceChildren();
  let url=input.value.trim()||DEFAULT;
  try{
   const parsed=new URL(url);if(parsed.protocol!=='https:')throw Error('URL HTTPS requise');
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
   let response;try{response=await fetch(parsed.href,{cache:'no-store',signal:controller.signal})}finally{clearTimeout(timer)}
   if(!response.ok)throw Error('HTTP '+response.status);
   const j=await response.json();if(j.error)throw Error(String(j.error));
   let valid=0,stale=0;
   for(const [key,label] of SERIES){
    const data=j[key],arr=Array.isArray(data)?data:[],last=arr[arr.length-1];
    const date=Array.isArray(last)?last[0]:null,ms=date?Date.parse(date):NaN;
    const age=Number.isFinite(ms)?Math.floor((Date.now()-ms)/864e5):null;
    const maxAge=key==='WM2NS'?90:key==='DEXUSEU'?14:45;
    const good=arr.length>0&&age!==null&&age>=0&&age<=maxAge;
    if(good)valid++;else stale++;
    const line=document.createElement('div');line.className='cb-macro-line';
    const name=document.createElement('span');name.textContent=label+' ('+key+')';
    const value=document.createElement('span');value.textContent=arr.length?(fmt(date)+' · '+(age===null?'âge inconnu':age+' j')+(good?' ✓':' ⚠')):'ABSENTE';
    value.className=good?'cb-macro-ok':'cb-macro-warn';line.append(name,value);rows.append(line);
   }
   state.textContent='Worker accessible · '+valid+'/'+SERIES.length+' séries récentes'+(stale?' · '+stale+' absentes ou anciennes':'');
  }catch(e){state.textContent='Worker indisponible : '+(e.name==='AbortError'?'délai dépassé':String(e.message||e));}
  finally{button.disabled=false}
 }
 button.addEventListener('click',check);
 const observer=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){observer.disconnect();check()}},{threshold:0});observer.observe(panel);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',create,{once:true});else create();
})();