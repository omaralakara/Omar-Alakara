import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

fs.mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const url=process.env.PREVIEW_URL || 'http://localhost:3000';
const context=await browser.newContext({viewport:{width:1440,height:900}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error') errors.push(m.text());});
const chapters=['origin','ignition','orbit','connections','horizon'];
async function progress(p) {
  await page.evaluate(value=>window.scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*value),p);
  await page.waitForFunction(value=>Math.abs(Number(document.querySelector('[data-progress]').dataset.progress)-value)<.002,p);
  await page.waitForTimeout(180);
}
async function pixels() {
  return page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>{
    const gl=document.querySelector('[data-scene] canvas').getContext('webgl2');
    const data=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);
    gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,data);
    let varied=0;
    for(let i=4;i<data.length;i+=4) if(Math.abs(data[i]-data[0])+Math.abs(data[i+1]-data[1])+Math.abs(data[i+2]-data[2])>3) varied++;
    resolve(varied);
  })));
}
async function chapterFits(index) {
  const result=await page.locator('[data-chapter="'+chapters[index]+'"]').evaluate(el=>{
    const copy=el.querySelector('h1,h2').parentElement.getBoundingClientRect(),heading=el.querySelector('h1,h2').getBoundingClientRect(),style=getComputedStyle(el);
    return {inert:el.inert,opacity:Number(style.opacity),visible:style.visibility==='visible',left:copy.left,right:copy.right,top:heading.top,bottom:copy.bottom,width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  assert(!result.inert && result.opacity>.99 && result.visible,'Chapter must be visible and accessible');
  assert(!result.overflow && result.left>=0 && result.right<=result.width+1 && result.top>55 && result.bottom<result.height-24,'Chapter content fits the viewport: '+JSON.stringify(result));
}
try {
  await page.goto(url);
  await page.locator('[data-scene="interactive"]').waitFor({timeout:40000});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(2300);
  assert.equal(await page.locator('[data-scene] canvas').count(),1);
  assert.equal(await page.locator('h1').count(),1);
  assert.equal(await page.locator('main section').count(),5);
  assert.equal(await page.locator('footer,[data-interlude]').count(),0,'No footer or interlude screens');
  assert.equal(await page.locator('dialog,a[href^="mailto:"],a[href$=".pdf"]').count(),0);
  assert.equal(await page.getByRole('button',{name:/Explore|Get in touch|talk|CV/i}).count(),0);
  for(let i=0;i<5;i++) {
    await progress(i/4);await chapterFits(i);
    assert((await pixels())>1000,'Each chapter has a visible particle sculpture');
    await page.screenshot({path:'artifacts/story-desktop-'+chapters[i]+'.png'});
    if(i<4) {
      for(const phase of [.35,.53,.75]) {
        await progress((i+phase)/4);
        assert((await pixels())>3000,'Continuous visual transition, without an empty interlude');
      }
    }
  }
  for(let i=3;i>=0;i--) {await progress(i/4);await chapterFits(i);}
  await page.mouse.move(700,600);await page.mouse.move(1120,350,{steps:28});await page.mouse.move(1250,500,{steps:20});
  await page.screenshot({path:'artifacts/story-cursor-wake.png'});
  await page.mouse.click(1100,430);
  assert(await page.locator('[data-cursor-effects] canvas').count()>0,'React Bits click burst appears');
  await page.waitForTimeout(100);await page.screenshot({path:'artifacts/story-click-burst.png'});
  await page.waitForTimeout(1400);
  assert.equal(await page.locator('[data-cursor-effects] canvas').count(),0,'Spark canvases are cleaned up after the burst');
  await page.getByRole('link',{name:'Go to Systems chapter'}).click();
  await page.waitForFunction(()=>document.querySelector('[data-progress]').dataset.progress==='0.750');
  await chapterFits(3);
  await page.getByRole('link',{name:'Go to Origin chapter'}).click();
  await page.waitForFunction(()=>document.querySelector('[data-progress]').dataset.progress==='0.000');
  console.log('PASS: five chapters, removed CTAs, continuous transitions without interludes, React Bits bursts with cleanup, reverse navigation, chapter links and accessibility.');
  for(const [width,height,name] of [[768,1024,'tablet'],[390,844,'mobile'],[320,568,'small-mobile'],[844,390,'landscape']]) {
    await page.setViewportSize({width,height});await page.waitForTimeout(500);
    for(let i=0;i<5;i++) {
      await progress(i/4);await chapterFits(i);
      await page.screenshot({path:'artifacts/story-'+name+'-'+chapters[i]+'.png'});
    }
  }
  console.log('PASS: all five chapters fit tablet, mobile, small mobile, and landscape.');
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('[data-scene="static"]').waitFor({state:'attached'});
  assert.equal(await page.locator('[data-scene] canvas').count(),0);
  assert.equal(await page.locator('[data-cursor-effects]').count(),0,'No cursor animation in static mode');
  for(const id of chapters) {
    const section=page.locator('#'+id);
    await section.scrollIntoViewIfNeeded();
    assert(await section.evaluate(el=>!el.inert && getComputedStyle(el).visibility==='visible' && Number(getComputedStyle(el).opacity)===1),'Static chapters remain readable');
  }
  await page.getByRole('link',{name:'Go to Origin chapter'}).click();
  await page.screenshot({path:'artifacts/story-reduced-motion.png'});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.locator('[data-scene="interactive"]').waitFor();
  await page.locator('[data-scene] canvas').evaluate(el=>el.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.locator('[data-scene="static"]').waitFor({state:'attached'});
  assert.equal(await page.locator('[data-scene] canvas').count(),0);
  assert(await page.locator('#horizon').evaluate(el=>!el.inert),'Context loss preserves the entire story');
  assert.deepEqual(errors,[],'No shader, runtime, or hydration errors');
  console.log('PASS: reduced motion and context loss preserve every section.');
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:1440,height:900}});
  const staticPage=await nojs.newPage();await staticPage.goto(url);
  assert.equal(await staticPage.locator('main section').count(),5);
  assert.equal(await staticPage.locator('canvas').count(),0);
  assert.equal(await staticPage.getByRole('status').count(),0);
  await staticPage.getByRole('link',{name:'Go to Beyond chapter'}).click();
  assert(await staticPage.locator('#horizon').evaluate(el=>el.getBoundingClientRect().top<innerHeight),'Navigation works without JavaScript');
  console.log('PASS: full story and anchor navigation work without JavaScript.');
  const loading=await context.newPage();
  await loading.route('**/particles/earth.bin',async route=>{await new Promise(resolve=>setTimeout(resolve,2500));await route.continue().catch(()=>{});});
  await loading.goto(url);await loading.getByRole('status').waitFor();
  await loading.getByRole('button',{name:'Enter without animation'}).click();
  assert.equal(await loading.getByRole('status').count(),0);
  assert.equal(await loading.locator('main section').count(),5);
  console.log('PASS: loader can be skipped into the complete static story.');
} finally {await browser.close();}
