import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
const elements=new Map();
function element(){return {innerHTML:'',textContent:'',value:'',checked:false,disabled:false,children:[],events:{},style:{setProperty(){}},classList:{toggle(){},add(){},remove(){}},setAttribute(){},append(child){this.children.push(child)},addEventListener(name,handler){this.events[name]=handler},showModal(){this.open=true},close(){this.open=false},setPointerCapture(){},click(){}}}
const document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)},createElement:element,documentElement:element(),querySelectorAll(selector){return elements.get(selector==='.device-card'?'device-list':'colors')?.children||[]}};
const checks=`
assert.equal(devices.length,5);
for(let i=0;i<5;i++){selectDevice(i);assert.equal($('model-name').textContent,devices[i].title);assert.ok($('screen-content').innerHTML);}
selectDevice(2);$('interact').events.click();assert.equal(state.temperature,31);assert.equal($('comfort').textContent,'Warm');
state.presence=false;render();assert.equal($('state-metric').textContent,'Sleeping');assert.equal($('led-metric').textContent,'Off');assert.equal($('interact').disabled,true);
state.presence=true;state.temperature=23.5;selectDevice(1);$('interact').events.click();assert.equal(state.focusRunning,true);assert.equal(focusText(),'25:00');
state.focusEnd=Date.now()-100;animate(1000);assert.equal(state.focusRemaining,0);assert.equal(state.focusRunning,false);
state.focusRemaining=1500;$('interact').events.click();$('power').events.click();assert.equal(state.power,false);assert.equal(state.focusRunning,false);assert.equal($('interact').disabled,true);
$('power').events.click();selectDevice(3);state.light=800;$('interact').events.click();assert.equal(state.light,120);assert.match(getInsight()[0],/more light/);
selectDevice(4);$('interact').events.click();assert.match($('insight-text').textContent,/Scripted response/);
state.time=1439;state.playing=true;lastFrame=1000;animate(1200);assert.ok(state.time<10);assert.ok(state.light>=0&&state.light<=1000);
$('time').events.input({target:{value:'600'}});assert.equal(state.playing,false);assert.equal(timeText(state.time),'10:00');
$('specs').events.click();assert.equal($('details').open,true);$('close-details').events.click();assert.equal($('details').open,false);
`;
runInNewContext(readFileSync('dist/app.js','utf8')+'\n'+checks,{document,matchMedia:()=>({matches:false}),requestAnimationFrame(){},setTimeout(){},clearTimeout(){},Date,console,assert,Blob,URL});
console.log('Passed: five profiles, climate alert, presence, power, focus timer expiry, plant response, voice simulation, day rollover, time control, and build notes. DOM-stub checks; browser layout not verified.');
