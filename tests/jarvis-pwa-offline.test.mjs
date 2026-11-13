import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sw=readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../jarvis-reactive-core.js',import.meta.url),'utf8');
test('PWA shell precaches the JARVIS module referenced by the application',()=>{
 assert.match(html,/<script defer src="\.\/jarvis-reactive-core\.js"><\/script>/);
 assert.match(sw,/"\.\/jarvis-reactive-core\.js"/);
 assert.match(sw,/cristal-btc-v60-cockpit-refresh/);
 assert.match(sw,/cache\.addAll\(SHELL/);
});
test('JARVIS voice bridge handles interruption and close',()=>{
 for(const event of ['session.open','session.closed','input_audio_buffer.speech_started','input_audio_buffer.speech_stopped','response.audio.delta','response.done']){
  assert.ok(js.includes(event),event+' must be handled');
 }
 assert.match(html,/interrupt_response:true/);
 assert.match(html,/crystal:jarvis:voice/);
});
