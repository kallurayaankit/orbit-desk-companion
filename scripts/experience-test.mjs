import * as RealThree from '../dist/vendor/three.module.min.js';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
const html=readFileSync('dist/index.html','utf8');
const source=readFileSync('dist/experience.js','utf8').replace(/^import .*?;\n/,'');
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'unique home IDs');
for(const [,id] of source.matchAll(/byId\('([^']+)'\)/g))assert.ok(ids.includes(id),`HTML contains ${id}`);
for(const [,path] of html.matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g))assert.ok(existsSync('dist/'+path),`local asset exists: ${path}`);
const rects={home:{top:0,height:900,left:0,width:1440},core:{top:1600,height:1530,left:0,width:1440},fleet:{top:3130,height:1000,left:0,width:1440},'droid-zone':{top:3440,height:560,left:115,width:550},launch:{top:4130,height:800,left:0,width:1440}};
const drawing=new Proxy({}, {get:()=>()=>{},set:()=>true});
function element(id=''){const classes=new Set();return {id,style:{setProperty(){}},children:[],dataset:{},events:{},attributes:{},classList:{add(x){classes.add(x)},remove(x){classes.delete(x)},toggle(x,value){if(value)classes.add(x);else classes.delete(x)},contains:x=>classes.has(x)},addEventListener(n,h){this.events[n]=h},setAttribute(n,v){this.attributes[n]=v},replaceChildren(...children){this.children=children},getBoundingClientRect:()=>rects[id]||{top:0,left:0,width:100,height:100},getContext:()=>drawing,setPointerCapture(){},focus(){this.focused=true}};}
class FakeRenderer{setPixelRatio(){}setSize(){}render(scene,camera){scene.updateMatrixWorld();camera.updateMatrixWorld();}}
for(const phone of [false,true]){
 const nodes=Object.fromEntries(ids.map(id=>[id,element(id)]));
 const tabs=Array.from({length:5},(_,i)=>{const e=nodes[`tab-${i}`];e.dataset.device=String(i);return e});
 const rails=Array.from({length:4},()=>element());
 const document={getElementById:id=>nodes[id],createElement:tag=>element(tag),querySelectorAll:s=>s==='[data-device]'?tabs:rails,documentElement:element(),body:element(),fonts:{ready:Promise.resolve()},addEventListener(){},hidden:false};document.documentElement.scrollHeight=5000;
 const context={THREE:{...RealThree,WebGLRenderer:FakeRenderer},document,matchMedia:()=>({matches:false,addEventListener(){}}),innerWidth:phone?390:1440,innerHeight:phone?844:900,scrollY:0,addEventListener(){},devicePixelRatio:1,requestAnimationFrame(){},setTimeout(){},clearTimeout(){},performance:{now:()=>100},console,window:{},assert};
 runInNewContext(source+`\n
 assert.equal(geometryReady,true,'scene constructs');
 assert.ok(robot.children.length>7);
 for(let i=0;i<5;i++){select(i);assert.equal(byId('fleet-lab-link').href,'lab.html?device='+profiles[i].id);assert.equal(tabs[i].attributes['aria-selected'],'true');assert.equal(byId('fleet-features').children.length,3);drawScreen(0,false);}
 selected=4;tabs[4].events.keydown({key:'ArrowRight',preventDefault(){}});assert.equal(selected,0);
 tabs[0].events.keydown({key:'End',preventDefault(){}});assert.equal(selected,4);
 byId('day-scrub').events.input({target:{value:'1330'}});assert.equal(byId('day-output').textContent,'22:10');assert.match(byId('day-story').textContent,/Night mode/);
 byId('motion-toggle').events.click();assert.equal(paused,true);assert.equal(byId('motion-toggle').attributes['aria-pressed'],'true');
 for(const y of [0,900,1600,2200,2800,3500,4200]){pageY=y;frame(1000+y);assert.ok(Number.isFinite(robot.position.x)&&Number.isFinite(robot.position.y));assert.ok(robot.scale.x>0);assert.ok(screenGroup.position.z>=0);}
 robot.traverse(object=>{if(object.geometry){object.geometry.computeBoundingBox();assert.ok(Number.isFinite(object.geometry.boundingBox.min.x));}});
 zone.events.keydown({key:'ArrowRight',preventDefault(){}});assert.ok(spin>0);
 `,context);
}
console.log('Passed: complete scene construction with real Three.js geometry, finite transforms across seven scroll positions, desktop/mobile branches, five fleet profiles, keyboard tabs, lab links, day/night control, pause control, and drag keyboard input. Rendering still requires browser verification.');
