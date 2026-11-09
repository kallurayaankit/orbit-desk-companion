"""Record real Orbit UI with Playwright. No narration or fake UI is inserted.
Run while `npm run dev` serves the site. Set PLAYWRIGHT_BROWSERS_PATH as needed.
"""
from pathlib import Path
import time, json, os
from playwright.sync_api import sync_playwright
OUT=Path(os.environ.get('ORBIT_MEDIA_DIR','/workspace/orbit-launch'))
OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('ORBIT_BASE_URL','http://localhost:3000')
shots=[];errors=[]
def hold(p,s):p.wait_for_timeout(s*1000)
def scroll(p,selector,delta=0):
 p.locator(selector).evaluate('(e,d)=>window.scrollTo({top:e.getBoundingClientRect().top+window.scrollY+d,behavior:"smooth"})',delta);hold(p,.7)
def slider(p,id,value):
 p.locator('#'+id).fill(str(value));p.locator('#'+id).dispatch_event('input')
def download(p,selector):
 with p.expect_download() as d:p.locator(selector).click()
 f=d.value;f.save_as(OUT/'downloads'/f.suggested_filename)
def drag(p,selector):
 box=p.locator(selector).bounding_box();x=box['x']+box['width']*.5;y=box['y']+box['height']*.5
 p.mouse.move(x,y);p.mouse.down();p.mouse.move(x+135,y-35,steps=32);p.mouse.up()
def scene(browser,key,url,title,action,setup=None):
 c=browser.new_context(viewport={'width':1600,'height':900},record_video_dir=str(OUT/'raw'),record_video_size={'width':1600,'height':900},accept_downloads=True)
 p=c.new_page();t0=time.monotonic();p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(BASE+url,wait_until='networkidle');hold(p,.8)
 if setup:setup(p)
 start=time.monotonic()-t0
 action(p)
 end=time.monotonic()-t0
 p.screenshot(path=str(OUT/(key+'.png')))
 c.close();path=str(p.video.path())
 shots.append(dict(id=key,title=title,path=path,source_in=start,source_out=end,duration=end-start))
 (OUT/'capture.json').write_text(json.dumps({'shots':shots,'errors':errors},indent=2))
 print(key,round(end-start,2),'seconds',flush=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'])
 def home(p):
  hold(p,3);p.locator('#warp').click();hold(p,1.4);scroll(p,'#core',240);hold(p,2);p.mouse.wheel(0,500);hold(p,2);scroll(p,'#fleet');hold(p,1.5)
 scene(browser,'01-journey','/','ORBIT / Electronics roots. A cosmic twist.',home)
 def fleet(p):
  for i in range(5):p.locator(f'#tab-{i}').click();hold(p,.65)
  slider(p,'day-scrub',1250);hold(p,1);drag(p,'#droid-zone');hold(p,1)
  p.locator('#motion-toggle').click();hold(p,.6);p.locator('#motion-toggle').click()
 scene(browser,'02-fleet','/#fleet','FIVE APPLICATIONS / 3D + time-of-day interaction',fleet,lambda p:scroll(p,'#fleet',170))
 def desk(p):
  p.locator('#interact').click();hold(p,1);slider(p,'time',1270);slider(p,'light',110);hold(p,1);p.locator('#presence').uncheck();hold(p,1);p.locator('#presence').check();p.locator('[aria-label="Plasma pink LED"]').click();p.locator('#rotate').click();hold(p,1);p.locator('#power').click();hold(p,.6);p.locator('#power').click();p.locator('#play').click();hold(p,1.8);p.locator('#play').click();download(p,'#export')
 scene(browser,'03-pathfinder','/lab.html?device=desk','PATHFINDER / Clock, simulated weather, presence and LED mood',desk,lambda p:scroll(p,'.studio',-60))
 def focus(p):p.locator('#interact').click();hold(p,3);p.locator('#interact').click();hold(p,1)
 scene(browser,'04-focus','/lab.html?device=focus','FOCUS / Real browser countdown. Start and pause.',focus,lambda p:scroll(p,'.studio',-60))
 def climate(p):slider(p,'temperature',34);slider(p,'humidity',80);hold(p,2);scroll(p,'.lower-grid',-160);hold(p,2)
 scene(browser,'05-atmos','/lab.html?device=climate','ATMOS / Explore temperature and humidity rules',climate,lambda p:scroll(p,'.studio',-60))
 def plant(p):slider(p,'light',50);hold(p,1.5);p.locator('#interact').click();hold(p,2)
 scene(browser,'06-sprout','/lab.html?device=plant','SPROUT / Light and room humidity. No soil sensor.',plant,lambda p:scroll(p,'.studio',-60))
 def echo(p):p.locator('#interact').click();hold(p,3);scroll(p,'.hardware',-150);p.locator('#specs').click();hold(p,2);p.locator('#close-details').click()
 scene(browser,'07-echo','/lab.html?device=voice','ECHO / Scripted voice concept + hardware build notes',echo,lambda p:scroll(p,'.studio',-60))
 def circuit(p):
  drag(p,'#circuit-canvas');hold(p,1);p.locator('[data-mode="exploded"]').click();hold(p,2);p.locator('#steps [data-part="sht"]').click();hold(p,2);p.locator('[data-mode="top"]').click();hold(p,2);p.locator('#show-wires').uncheck();hold(p,.5);p.locator('#show-wires').check()
 scene(browser,'08-inside','/circuit.html','CIRCUIT / Rotate, explode and inspect the internal assembly',circuit,lambda p:scroll(p,'.workbench',-60))
 def build(p):
  p.locator('#start-build').click();hold(p,1)
  for i in range(8):p.locator('#next-step').click();hold(p,.8)
 scene(browser,'09-build','/circuit.html','GUIDED BUILD / Component purpose, placement and assembly order',build,lambda p:scroll(p,'.workbench',-60))
 for key,id,title,part in [('10-focus-circuit','focus','FOCUS CIRCUIT / Button, LEDs and buzzer driver','buzzer'),('11-atmos-circuit','climate','ATMOS CIRCUIT / BME280 + light sensing','bme'),('12-sprout-circuit','plant','SPROUT CIRCUIT / Temperature, humidity and light','light'),('13-echo-circuit','voice','ECHO CIRCUIT / Microphone, amplifier and speaker','amp')]:
  def inspect(p,part=part):p.locator('[data-mode="exploded"]').click();hold(p,1.2);p.locator(f'#steps [data-part="{part}"]').click();hold(p,2.8)
  scene(browser,key,'/circuit.html?device='+id,title,inspect,lambda p:scroll(p,'.workbench',-60))
 def wiring(p):p.locator('#connection-filter').select_option('amp');hold(p,2);download(p,'#export-wires');p.locator('#connection-filter').select_option('all');hold(p,1)
 scene(browser,'14-wiring','/circuit.html?device=voice','WIRING MAP / Exact pin endpoints + downloadable CSV',wiring,lambda p:scroll(p,'#documents',-60))
 def parts(p):p.locator('[data-doc="parts"]').click();hold(p,2);download(p,'#export-bom');hold(p,1)
 scene(browser,'15-parts','/circuit.html?device=voice','PARTS LIST / Quantities, specifications and component sources',parts,lambda p:scroll(p,'#documents',-60))
 def arduino(p):p.locator('[data-doc="arduino"]').click();hold(p,3);download(p,'#export-arduino');hold(p,1)
 scene(browser,'16-arduino','/circuit.html?device=voice','ARDUINO / Setup guide + diagnostic scaffold download',arduino,lambda p:scroll(p,'#documents',-60))
 def pcb(p):p.locator('[data-doc="pcb"]').click();hold(p,3);download(p,'#export-plan');hold(p,1);scroll(p,'.power-note',-200);hold(p,2)
 scene(browser,'17-pcb','/circuit.html?device=voice','BUILD PATH / Breadboard → carrier → engineered PCB',pcb,lambda p:scroll(p,'#documents',-60))
 def close(p):hold(p,4)
 scene(browser,'18-close','/#launch','EXPLORE ORBIT / orbit-companion-dusky.vercel.app',close,lambda p:scroll(p,'#launch',60))
 browser.close()
 print('Completed',len(shots),'scenes. Page errors:',errors,flush=True)
