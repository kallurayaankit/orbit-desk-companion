'use strict';
const $ = id => document.getElementById(id);
const devices = [
 {id:'desk',name:'Desk companion',sub:'A friend for your everyday',icon:'◉',edition:'01 — THE EVERYDAY ORIGINAL',title:'Hello, Orbit.',color:'#243c62',action:'✧ Say hello to Orbit',description:'A clock, a simulated weather glance, and a friendly presence-aware face for your desk.',parts:[['ESP32-S3','Wi-Fi + Bluetooth controller'],['1.3″ OLED','Clock, weather and expressions'],['SHT40','Temperature + humidity'],['WS2812','Ambient RGB feedback'],['PIR sensor','Presence events']]},
 {id:'focus',name:'Focus buddy',sub:'Find your flow state',icon:'◷',edition:'02 — A LITTLE ROOM TO FOCUS',title:'Make space to focus.',color:'#713e32',action:'▶ Start a 25-minute focus',description:'A real browser-based 25-minute focus timer with a calm ambient LED. The timer continues when you explore other devices.',parts:[['ESP32-S3','Controller'],['1.3″ OLED','Focus countdown'],['WS2812','Progress and break cues'],['Buzzer','Optional gentle end tone'],['PIR sensor','Desk occupancy']]},
 {id:'climate',name:'Climate sense',sub:'Get to know your space',icon:'≋',edition:'03 — YOUR ROOM, IN BALANCE',title:'A feel for your space.',color:'#164960',action:'↗ Simulate a warm room',description:'Explore how temperature, humidity and light can drive local comfort rules. This concept does not measure air quality or CO₂.',parts:[['ESP32-S3','Controller'],['BME280','Temperature + humidity + pressure'],['BH1750','Ambient light sensing'],['1.3″ OLED','Room readings'],['WS2812','Comfort indication']]},
 {id:'plant',name:'Plant pal',sub:'A greener kind of company',icon:'♧',edition:'04 — GROW SOMETHING GOOD',title:'Small steps. New leaves.',color:'#285249',action:'☀ Simulate a sunny spot',description:'An illustrative light and room-humidity companion for houseplants. Care needs vary by species. Soil moisture is not measured in this concept.',parts:[['ESP32-S3','Controller'],['BH1750','Light measurement'],['SHT40','Room temperature + humidity'],['1.3″ OLED','Illustrative care cues'],['WS2812','Plant status indication']]},
 {id:'voice',name:'Voice companion',sub:'An idea worth talking to',icon:'⌁',edition:'05 — START A CONVERSATION',title:'Your ideas, out loud.',color:'#503268',action:'⌁ Simulate “How’s my room?”',description:'A scripted voice interaction concept. No microphone access, speech recognition, or AI model is enabled. A physical version would need an audio pipeline and model connection.',parts:[['ESP32-S3 + PSRAM','Audio-capable controller'],['INMP441','I²S microphone'],['MAX98357A','I²S amplifier + speaker'],['1.3″ OLED','Response display'],['SHT40','Room context']]}
];
const colors=[{name:'Ion cyan',hex:'#00e5ff'},{name:'Plasma pink',hex:'#ff43dc'},{name:'Laser lime',hex:'#b5ff3a'},{name:'Reactor orange',hex:'#ff9c36'}];
const state={device:0,time:581,temperature:23.5,humidity:48,light:650,presence:true,power:true,color:0,playing:false,rotating:false,x:-12,y:-23,greetingUntil:0,voiceUntil:0,focusEnd:0,focusRemaining:1500,focusRunning:false};
let toastTimer,drag=null,lastFrame=0,lastRender=0;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function timeText(minutes){const m=Math.floor(minutes)%1440;return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4200);}
function selectDevice(index){state.device=index;state.greetingUntil=0;state.voiceUntil=0;render();}
devices.forEach((device,index)=>{const button=document.createElement('button');button.className='device-card';button.innerHTML=`<span class="device-icon">${device.icon}</span><span><strong>${device.name}</strong><small>${device.sub}</small></span><span class="arrow">↗</span>`;button.addEventListener('click',()=>selectDevice(index));$('device-list').append(button);});
colors.forEach((color,index)=>{const button=document.createElement('button');button.className='swatch';button.style.setProperty('--swatch',color.hex);button.setAttribute('aria-label',`${color.name} LED`);button.title=color.name;button.addEventListener('click',()=>{state.color=index;render();});$('colors').append(button);});
function getInsight(){
 if(!state.power)return ['Taking a little rest.','The device is powered off. Turn it on to resume the simulation.'];
 if(!state.presence)return ['See you in a little while.','No presence detected. The display dims and the LEDs switch off to simulate a low-power state.'];
 if(state.device===3){if(state.light<300)return ['A little more light, please.','This example plant profile prefers brighter indirect light. Move the light slider to explore its response.'];if(state.humidity<35)return ['It’s a little dry in here.','Low room humidity can affect some houseplants. Check your plant’s needs; this is not a soil-moisture reading.'];return ['A happy little corner to grow.','Light and room humidity suit this illustrative plant profile. Actual care depends on species and soil.'];}
 if(state.temperature>=28)return ['Your room is warming up.','The temperature crossed the demo’s 28 °C threshold. A warm amber LED makes the change easy to notice.'];
 if(state.temperature<18)return ['A little on the cool side.','The room is below the demo’s 18 °C comfort threshold. The device shifts to a cool blue indicator.'];
 if(state.humidity>65)return ['The air feels a little humid.','Humidity is above this demo’s 65% threshold. Consider ventilation if suitable for your space.'];
 if(state.humidity<30)return ['The air is getting dry.','Humidity is below this demo’s 30% threshold. The display surfaces a gentle room-comfort cue.'];
 if(state.device===1)return state.focusRunning?['One thing at a time.','Your 25-minute timer is running in real time. A calmer desk, a clearer next step.']:['A fresh start is a small thing.','Start a 25-minute focus session. Pause whenever you need; the day simulation does not speed up this timer.'];
 if(state.device===4)return ['A little context for your next idea.','Tap the voice simulation to hear a scripted room report visually. No audio is recorded or sent anywhere.'];
 if(state.light<100)return ['A softer glow for a quiet moment.','Low ambient light dims the display and LED. Try playing a day to see the companion settle into evening.'];
 return ['Your desk feels just right.','A comfortable room, soft light, and a little company. Ready when you are.'];
}
function focusText(){const total=Math.max(0,Math.ceil(state.focusRemaining));return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;}
function screenHTML(){
 if(!state.presence)return '<div class="screen-time">z z</div><div class="screen-sub">SEE YOU SOON</div>';
 if(Date.now()<state.greetingUntil)return '<div class="eyes"><i></i><i></i></div><div class="smile"></div><div class="screen-sub">HEY, NICE TO SEE YOU.</div>';
 if(state.device===0)return `<div class="screen-time">${timeText(state.time)}</div><div class="screen-sub">☀ 22° · SUNNY · DEMO WEATHER</div>`;
 if(state.device===1)return `<div class="screen-time">${focusText()}</div><div class="screen-sub">${state.focusRunning?'ONE THING AT A TIME':state.focusRemaining===0?'NICE WORK. TAKE A BREAK.':'YOUR NEXT GOOD IDEA'}</div>`;
 if(state.device===2)return `<div class="screen-time">${state.temperature.toFixed(1)}<span style="font-size:20px">°</span></div><div class="screen-sub">${state.humidity}% RH · ${state.light} LX</div>`;
 if(state.device===3)return `<div class="screen-time">♧</div><div class="screen-sub">${state.light<300?'A LITTLE MORE LIGHT?':state.humidity<35?'ROOM AIR IS DRY':'GROW AT YOUR OWN PACE'}</div>`;
 if(Date.now()<state.voiceUntil)return '<div class="wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="screen-sub">SCRIPTED RESPONSE</div>';
 return '<div class="eyes"><i></i><i></i></div><div class="smile"></div><div class="screen-sub">LET’S THINK OF SOMETHING.</div>';
}
function render(){
 const device=devices[state.device],color=colors[state.color],now=Date.now();
 $('circuit-link').href=`circuit.html?device=${device.id}`;$('hardware-circuit-link').href=`circuit.html?device=${device.id}`;
 document.querySelectorAll('.device-card').forEach((button,i)=>{button.classList.toggle('selected',i===state.device);button.setAttribute('aria-pressed',String(i===state.device));});
 document.querySelectorAll('.swatch').forEach((button,i)=>{button.classList.toggle('selected',i===state.color);button.setAttribute('aria-pressed',String(i===state.color));});
 document.documentElement.style.setProperty('--shell',device.color);
 let effectiveColor=color.hex,ledLabel=color.name;
 if(state.temperature>=28){effectiveColor='#ff9c36';ledLabel='Heat alert';}else if(state.temperature<18){effectiveColor='#00e5ff';ledLabel='Cool alert';}
 document.documentElement.style.setProperty('--accent',effectiveColor);
 const brightness=Math.round(Math.max(10,Math.min(100,state.light/10)));
 $('led-strip').style.opacity=state.presence?brightness/100:0;
 $('viewport').classList.toggle('night',state.time<360||state.time>1140);
 $('model').classList.toggle('off',!state.power);$('model').classList.toggle('sleeping',!state.presence);
 const screen=screenHTML();if($('screen-content').innerHTML!==screen)$('screen-content').innerHTML=screen;$('screen-temp').textContent=`${state.temperature.toFixed(1)}°`;
 $('screen-message').textContent=state.light<100?'A quieter kind of light.':'A good day to make things.';
 $('model-name').textContent=device.title;$('edition').textContent=device.edition;$('preview-label').textContent=device.name.toUpperCase();
 $('time-value').textContent=timeText(state.time);$('time').value=Math.floor(state.time);
 for(const [id,suffix] of [['temperature',' °C'],['humidity',' %'],['light',' lx']]){$(`${id}-value`).textContent=state[id]+suffix;$(id).value=state[id];}
 $('presence').checked=state.presence;
 $('power').setAttribute('aria-label',state.power?'Power off device':'Power on device');$('power').setAttribute('aria-pressed',String(state.power));
 $('interact').textContent=state.device===1?(state.focusRunning?'Ⅱ Pause focus session':state.focusRemaining<1500&&state.focusRemaining>0?'▶ Resume focus session':device.action):device.action;
 $('interact').disabled=!state.power||!state.presence;
 const insight=getInsight();$('insight-title').textContent=insight[0];$('insight-text').textContent=insight[1];
 if(state.device===4&&now<state.voiceUntil){$('insight-title').textContent='“Here’s a little room check.”';$('insight-text').textContent=`Scripted response: It’s ${state.temperature.toFixed(1)} °C with ${state.humidity}% humidity and ${state.light} lux at your desk. ${getInsight()[0]}`;}
 const status=!state.power?'Powered off':!state.presence?'Sleeping':state.device===1&&state.focusRunning?'Focusing':state.device===4&&now<state.voiceUntil?'Responding':'Active';
 $('device-status').textContent=status==='Active'?'Awake & ready':status;$('state-metric').textContent=status;
 $('comfort').textContent=!state.power?'—':state.temperature>=28?'Warm':state.temperature<18?'Cool':state.humidity>65?'Humid':state.humidity<30?'Dry':'Comfortable';
 $('led-metric').textContent=state.power&&state.presence?`${ledLabel} · ${brightness}%`:'Off';
 $('parts').innerHTML=device.parts.slice(0,4).map(([name])=>`<span class="part">${name}</span>`).join('');
 $('play').innerHTML=`<span>${state.playing?'Ⅱ':'▶'}</span> ${state.playing?'Pause day':'Play a day'} <span class="muted">24h in 48s</span>`;$('play').setAttribute('aria-pressed',String(state.playing));
 $('rotate').setAttribute('aria-pressed',String(state.rotating));$('rotate').textContent=state.rotating?'Ⅱ Stop rotation':'↻ Auto rotate';
}
for(const id of ['time','temperature','humidity','light'])$(id).addEventListener('input',e=>{state[id]=Number(e.target.value);if(id==='time'||id==='light')state.playing=false;render();});
$('presence').addEventListener('change',e=>{state.presence=e.target.checked;render();});
$('power').addEventListener('click',()=>{state.power=!state.power;if(!state.power&&state.focusRunning){state.focusRemaining=Math.max(0,(state.focusEnd-Date.now())/1000);state.focusRunning=false;}render();});
$('play').addEventListener('click',()=>{state.playing=!state.playing;render();});
$('rotate').addEventListener('click',()=>{state.rotating=!state.rotating;render();});
$('reset-view').addEventListener('click',()=>{state.x=-12;state.y=-23;state.rotating=false;updateTransform();render();});
$('interact').addEventListener('click',()=>{
 if(!state.power||!state.presence)return;
 if(state.device===0){state.greetingUntil=Date.now()+5000;toast('Hello, you. Nice to have you here.');}
 if(state.device===1){if(state.focusRunning){state.focusRemaining=Math.max(0,(state.focusEnd-Date.now())/1000);state.focusRunning=false;}else{if(state.focusRemaining<=0)state.focusRemaining=1500;state.focusEnd=Date.now()+state.focusRemaining*1000;state.focusRunning=true;}}
 if(state.device===2){state.temperature=state.temperature>=28?23.5:31;toast(state.temperature>=28?'Warm-room scenario: temperature alert activated.':'Room restored to 23.5 °C.');}
 if(state.device===3){state.playing=false;state.light=state.light>=700?120:800;toast(state.light>=700?'A brighter spot. Plant pal responds to the light.':'A shady spot. Plant pal asks for more light.');}
 if(state.device===4){state.voiceUntil=Date.now()+7000;toast('Simulated voice event. See the scripted response below.');}
 render();
});
function updateTransform(){$('model').style.transform=`rotateX(${state.x}deg) rotateY(${state.y}deg)`;}
$('scene').addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,rx:state.x,ry:state.y};state.rotating=false;$('scene').setPointerCapture(e.pointerId);render();});
$('scene').addEventListener('pointermove',e=>{if(!drag)return;state.y=drag.ry+(e.clientX-drag.x)*.5;state.x=Math.max(-65,Math.min(65,drag.rx-(e.clientY-drag.y)*.35));updateTransform();});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('scene').addEventListener(event,()=>drag=null);
$('scene').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();state.rotating=false;if(e.key==='ArrowLeft')state.y-=10;if(e.key==='ArrowRight')state.y+=10;if(e.key==='ArrowUp')state.x=Math.max(-65,state.x-10);if(e.key==='ArrowDown')state.x=Math.min(65,state.x+10);updateTransform();render();});
$('specs').addEventListener('click',()=>{const device=devices[state.device];$('details-title').textContent=device.name;$('details-description').textContent=device.description;$('parts-detail').innerHTML=device.parts.map(([name,role])=>`<div class="part-detail"><strong>${name}</strong><span>${role}</span></div>`).join('');$('details').showModal();});
$('close-details').addEventListener('click',()=>$('details').close());
$('details').addEventListener('click',e=>{if(e.target===$('details')){const r=$('details').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('details').close();}});
$('export').addEventListener('click',()=>{const data={schemaVersion:1,prototype:'Orbit',simulationOnly:true,device:devices[state.device].id,time:timeText(state.time),temperatureC:state.temperature,humidityPercent:state.humidity,lightLux:state.light,presence:state.presence,power:state.power,led:colors[state.color],parts:devices[state.device].parts.map(([name,role])=>({name,role})),notes:'Concept configuration only. No physical wiring, firmware, weather API or AI model connected.'};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=`orbit-${data.device}-config.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Your prototype configuration has been exported.');});
function animate(timestamp){const dt=lastFrame?Math.min((timestamp-lastFrame)/1000,.2):0;lastFrame=timestamp;if(state.playing){state.time=(state.time+dt*30)%1440;state.light=Math.round(Math.max(0,Math.sin((state.time-360)/720*Math.PI))*100)*10;}
 if(state.rotating){state.y+=dt*(reducedMotion?8:18);updateTransform();}
 if(state.focusRunning){state.focusRemaining=Math.max(0,(state.focusEnd-Date.now())/1000);if(state.focusRemaining<=0){state.focusRunning=false;toast('Focus complete. Time for a little break.');}}
 if(timestamp-lastRender>250){render();lastRender=timestamp;}requestAnimationFrame(animate);}
const requestedDevice = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('device') : null;
const requestedIndex = devices.findIndex(device => device.id === requestedDevice);
if (requestedIndex >= 0) state.device = requestedIndex;
render();requestAnimationFrame(animate);
