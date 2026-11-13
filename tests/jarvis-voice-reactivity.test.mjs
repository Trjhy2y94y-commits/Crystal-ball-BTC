import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../jarvis-reactive-core.js',import.meta.url),'utf8');
test('JARVIS reactor follows voice session lifecycle and interruption',()=>{
 const listeners=new Map(), reactor={dataset:{},querySelector:()=>({textContent:''})};
 const doc={head:{appendChild(){}},createElement:()=>({textContent:''}),querySelector:()=>reactor,addEventListener:(name,fn)=>listeners.set(name,fn)};
 const context={document:doc,window:{},Set,clearTimeout,CustomEvent:class{}};
 vm.runInNewContext(source,context);
 const send=type=>listeners.get('crystal:jarvis:voice')({detail:{type}});
 send('session.open');assert.equal(reactor.dataset.voiceState,'listening');
 send('response.audio.delta');assert.equal(reactor.dataset.voiceState,'speaking');
 send('input_audio_buffer.speech_started');assert.equal(reactor.dataset.voiceState,'listening');
 send('input_audio_buffer.speech_stopped');assert.equal(reactor.dataset.voiceState,'thinking');
 send('session.closed');assert.equal(reactor.dataset.voiceState,'idle');
 assert.equal(context.window.CrystalJarvisVisual.getState(),'idle');
});
test('Realtime configuration enables server VAD interruption and asset is loaded',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/interrupt_response:true/);
 assert.match(html,/create_response:true/);
 assert.match(html,/jarvis-reactive-core\.js/);
 assert.match(html,/crystal:jarvis:voice/);
});
