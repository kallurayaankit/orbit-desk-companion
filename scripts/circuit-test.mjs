import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import * as RealThree from '../dist/vendor/three.module.min.js';
import {parts,profiles,sources,getProfile,connections,bom,pinAssignments,arduinoSketch,plan} from '../dist/circuit-data.js';
const allowedPins=new Set([4,5,6,7,8,9,15,16,17,18,21,47]);
for(const profile of profiles){
 const pins=pinAssignments(profile).map(x=>x[1]);assert.equal(new Set(pins).size,pins.length,profile.name+' pin collision');pins.forEach(pin=>assert.ok(allowedPins.has(pin)));
 assert.ok(profile.parts.includes('driver')&&profile.parts.includes('power'),'each LED build has level shifting and power');
 assert.equal(plan(profile).assembly.length,profile.parts.length);assert.ok(bom(profile).some(x=>x.item.includes('1000 µF')));assert.ok(arduinoSketch(profile).includes('Wire.begin(I2C_SDA, I2C_SCL, 100000)'));
 for(const id of profile.parts){assert.ok(parts[id].assembly&&parts[id].check&&parts[id].placement);parts[id].sources.forEach(s=>assert.ok(sources[s]));}
 const audio=connections(profile).filter(w=>w.component==='speaker');audio.forEach(w=>assert.ok(!/GND/.test(w.from+w.to),'BTL speaker must not go to GND'));
 const claims=new Map();for(const id of profile.parts)for(const pin of parts[id].pins){if(![8,9].includes(pin))assert.ok(!claims.has(pin),`Shared non-bus GPIO ${pin}`);claims.set(pin,id);}
}
const html=readFileSync('dist/circuit.html','utf8');const ids=[...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size);
const code=readFileSync('dist/circuit.js','utf8').replace(/^import .*;\n/gm,'');
for(const [,id] of code.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.includes(id),'missing DOM id '+id);
for(const [,file] of html.matchAll(/(?:src|href)="((?!https:|#)[^"?]+)(?:\?[^" ]*)?"/g))assert.ok(existsSync('dist/'+file),'missing file '+file);
function runUI(width,failGL=false){
 const elements=new Map(),events={};let capturedScene;
 const draw=new Proxy({}, {get:()=>()=>{},set:()=>true});
 function el(tag='div',id=''){const classes=new Set();return {tag,id,children:[],attributes:{},dataset:{},events:{},style:{setProperty(){}},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),toggle(x,v){if(v)classes.add(x);else classes.delete(x)}},setAttribute(k,v){this.attributes[k]=v},append(...kids){this.children.push(...kids)},replaceChildren(...kids){this.children=kids;if(tag==='select')this.value=kids[0]?.value||'';},addEventListener(n,f){this.events[n]=f},getBoundingClientRect:()=>({width,height:520,left:0,top:0}),getContext:()=>draw,focus(){},setPointerCapture(){},click(){}};}
 for(const id of ids)elements.set(id,el(id==='connection-filter'?'select':'div',id));
 const modes=['assembled','exploded','top'].map(x=>{const e=el();e.dataset.mode=x;return e});const docs=['wiring','parts','arduino','pcb'].map(x=>{const e=el();e.dataset.doc=x;return e});
 const document={getElementById:id=>elements.get(id),createElement:tag=>el(tag),createTextNode:text=>({textContent:text}),querySelectorAll:q=>q==='[data-mode]'?modes:q==='[data-doc]'?docs:q==='.step'?elements.get('steps').children:q==='.part-label'?elements.get('part-labels').children:[],documentElement:el(),hidden:false};
 class Renderer{constructor(){if(failGL)throw Error('No GL')}setPixelRatio(){}setSize(){}render(scene){capturedScene=scene;}}
 class Observer{constructor(cb){this.cb=cb}observe(){this.cb()}}
 const frames=[];const context={THREE:{...RealThree,WebGLRenderer:Renderer},parts,profiles,sources,getProfile,connections,bom,pinAssignments,arduinoSketch,plan,document,location:{search:'?device=voice'},history:{replaceState(){}},Option:function(text,value){return {textContent:text,value}},URLSearchParams,URL,Blob,matchMedia:()=>({matches:false}),devicePixelRatio:1,ResizeObserver:Observer,requestAnimationFrame:cb=>frames.push(cb),setTimeout(){},clearTimeout(){},console:{warn(){}},assert};
 runInNewContext(code+`\n
 assert.equal(profile.id,'voice');assert.equal($('arduino-code').textContent.includes('AMP_DATA = 47'),true);
 for(const p of profiles){chooseProfile(p.id);assert.equal($('steps').children.length,p.parts.length);start();assert.equal(step,0);for(let i=1;i<p.parts.length;i++)$('next-step').events.click();assert.equal(selected,p.parts.at(-1));$('next-step').events.click();assert.equal(step,-1);}
 chooseProfile('focus');inspect('buzzer');assert.equal($('part-name').textContent,parts.buzzer.name);$('connection-filter').value='buzzer';renderWiring();assert.equal($('wiring-body').children.length,parts.buzzer.wires.length);
 selectDoc('arduino');assert.equal($('doc-arduino').hidden,false);assert.equal($('doc-wiring').hidden,true);selectDoc('pcb');assert.equal($('doc-pcb').hidden,false);
 mode='exploded';syncModes();mode='top';syncModes();
 `,context);
 if(!failGL){for(const frame of frames.slice(0,2))frame(1000);assert.ok(capturedScene);capturedScene.traverse(o=>{assert.ok(Number.isFinite(o.position.x));if(o.geometry){o.geometry.computeBoundingBox();assert.ok(Number.isFinite(o.geometry.boundingBox.min.x));}});}
 else assert.equal(elements.get('no-render').hidden,false);
}
runUI(650);runUI(360);runUI(360,true);
console.log('Passed circuit checks: five complete build sequences, GPIO allocation, driver/power coverage, differential speaker wiring, exports, app switching, component filters, document tabs, scene construction at two sizes, and no-WebGL fallback. Hardware and rendered pixels are not validated by these tests.');
