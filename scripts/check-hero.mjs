import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

fs.mkdirSync('artifacts', { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const url = process.env.PREVIEW_URL || 'http://localhost:3000';
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors=[];
page.on('pageerror', e => { errors.push(e.message); console.error(e.message); });
page.on('console', m => {if(m.type()==='error') {errors.push(m.text());console.error(m.text());}});
async function scrollToProgress(progress) {
  await page.evaluate(p=>window.scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*p),progress);
  await page.waitForTimeout(1400);
  assert(Math.abs(Number(await page.locator('[data-progress]').getAttribute('data-progress'))-progress)<.02);
}
async function chapterVisible(chapter) {
  assert(await page.locator(`[data-chapter="${chapter}"]`).evaluate(el=>!el.inert && Number(getComputedStyle(el).opacity)>.95 && getComputedStyle(el).visibility==='visible'),`${chapter} text is readable and interactive`);
  for(const other of ['opening','drift','satellite'].filter(name=>name!==chapter)) {
    assert(await page.locator(`[data-chapter="${other}"]`).evaluate(el=>el.inert),`${other} actions stay out of keyboard navigation`);
  }
}
async function fitsViewport() {
  assert(await page.evaluate(() => {
    const main=document.querySelector('main').getBoundingClientRect();
    const heading=document.querySelector('h1').getBoundingClientRect();
    const contact=[...document.querySelectorAll('a')].find(a=>a.textContent.includes('Get in touch')).getBoundingClientRect();
    return document.documentElement.scrollWidth<=innerWidth && main.height<=innerHeight+1 && heading.top>=0 && contact.bottom<innerHeight;
  }), 'Opening content must fit one viewport with no horizontal overflow');
}
try {
  await page.goto(url);
  await page.locator('[data-scene="interactive"]').waitFor({timeout:30000});
  await page.waitForTimeout(2300);
  assert.equal(await page.locator('canvas').count(),1);
  assert.equal(await page.locator('h1').count(),1);
  assert.equal(await page.locator('#work,#skills,#about,#contact').count(),0);
  assert.equal(await page.getByRole('button',{name:/Pause motion|Resume motion/}).count(),0);
  assert.equal(await page.getByText('Scroll to explore').count(),0);
  await chapterVisible('opening');
  await fitsViewport();
  const canvas=page.locator('canvas');
  const first=await canvas.screenshot();
  await page.waitForTimeout(500);
  assert(!first.equals(await canvas.screenshot()),'Earth floats/rotates');
  await page.screenshot({path:'artifacts/hero-desktop.png'});
  await page.mouse.move(250,700);
  await page.mouse.move(1150,420,{steps:24});
  await page.mouse.move(600,200,{steps:18});
  await page.screenshot({path:'artifacts/hero-cursor-wake.png'});
  await scrollToProgress(.43);
  await chapterVisible('drift');
  await page.screenshot({path:'artifacts/hero-cloud.png'});
  await scrollToProgress(1);
  await chapterVisible('satellite');
  await page.screenshot({path:'artifacts/hero-satellite.png'});
  await page.getByRole('button',{name:'Explore my work'}).click();
  assert(await page.locator('dialog').evaluate(el=>el.open));
  await page.keyboard.press('Escape');
  await scrollToProgress(.43);
  await chapterVisible('drift');
  await scrollToProgress(0);
  await chapterVisible('opening');
  assert.equal(await page.locator('[data-progress]').getAttribute('data-progress'),'0.000');
  await page.getByRole('button',{name:'Explore my work'}).click();
  assert(await page.locator('dialog').evaluate(el=>el.open));
  assert.equal(await page.getByRole('link',{name:'View my CV'}).getAttribute('href'),'/Omar-Al-Akara-CV.pdf');
  assert.equal((await page.request.get(url+'/Omar-Al-Akara-CV.pdf')).status(),200);
  await page.keyboard.press('Escape');
  assert(!(await page.locator('dialog').evaluate(el=>el.open)));
  assert(await page.getByRole('button',{name:'Explore my work'}).evaluate(el=>el===document.activeElement));
  assert.equal(await page.getByRole('link',{name:'Get in touch'}).getAttribute('href'),'mailto:omar.alakara3@gmail.com');
  for(const [width,height,name] of [[768,1024,'tablet'],[390,844,'mobile'],[320,568,'small-mobile'],[844,390,'landscape']]) {
    await page.setViewportSize({width,height});
    await page.waitForTimeout(350);
    await fitsViewport();
    await page.screenshot({path:`artifacts/hero-${name}.png`});
    await scrollToProgress(1);
    await chapterVisible('satellite');
    assert(await page.locator('[data-chapter="satellite"]').evaluate(el=>{
      const rect=el.getBoundingClientRect();
      return rect.top>65 && rect.bottom<innerHeight-35 && rect.left>=0 && rect.right<=innerWidth;
    }),'Satellite text fits the viewport');
    await page.screenshot({path:`artifacts/hero-${name}-satellite.png`});
    await scrollToProgress(0);
  }
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Menu +'}).click();
  await page.getByRole('button',{name:'Skills',exact:true}).click();
  assert(await page.locator('dialog').evaluate(el=>el.open));
  await page.keyboard.press('Escape');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('[data-scene="static"]').waitFor();
  assert.equal(await page.locator('canvas').count(),0);
  assert(await page.locator('img').evaluate(el=>el.complete && el.naturalWidth>0 && getComputedStyle(el).opacity==='1'));
  assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1),'Reduced motion has no scroll runway');
  await page.screenshot({path:'artifacts/hero-reduced-motion.png'});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.locator('[data-scene="interactive"]').waitFor();
  await page.locator('canvas').evaluate(el=>el.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.locator('[data-scene="static"]').waitFor();
  assert.equal(await page.locator('canvas').count(),0);
  assert.deepEqual(errors,[],'No runtime, shader or hydration errors');
  console.log('PASS: WebGL, rotation, cursor strokes, removed controls, reversible Earth/cloud/satellite sequence, chapter visibility/focus, CV/contact, desktop/tablet/mobile/landscape layouts, reduced motion, context loss.');

  const nojs=await browser.newContext({javaScriptEnabled:false});
  const staticPage=await nojs.newPage();await staticPage.goto(url);
  assert(await staticPage.locator('h1').isVisible());
  assert(await staticPage.locator('img').evaluate(el=>el.complete && el.naturalWidth>0));
  assert.equal(await staticPage.locator('canvas').count(),0);
  assert.equal(await staticPage.getByRole('status').count(),0);
  console.log('PASS: no-JavaScript content and globe, without a blocking loader.');

  const loadingPage=await context.newPage();
  await loadingPage.route('**/particles/earth.bin',async route=>{await new Promise(resolve=>setTimeout(resolve,3000));await route.continue().catch(()=>{});});
  await loadingPage.goto(url);
  await loadingPage.getByRole('status').waitFor();
  await loadingPage.screenshot({path:'artifacts/hero-loading.png'});
  await loadingPage.getByRole('button',{name:'Enter without animation'}).click();
  assert.equal(await loadingPage.getByRole('status').count(),0);
  assert(await loadingPage.locator('h1').isVisible());
  assert.equal(await loadingPage.locator('[data-scene]').getAttribute('data-scene'),'static');
  console.log('PASS: actual-loading screen is skippable and retains static content.');

  const unsupported=await browser.newContext();
  await unsupported.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).includes('webgl') ? null : original.call(this,type,...args);};});
  const noGl=await unsupported.newPage();await noGl.goto(url);await noGl.waitForTimeout(1500);
  assert(await noGl.locator('h1').isVisible());
  assert.equal(await noGl.locator('[data-scene]').getAttribute('data-scene'),'static');
  assert.equal(await noGl.getByRole('status').count(),0);
  console.log('PASS: unavailable WebGL leaves a static globe and dismisses the loader.');
} catch(error) {
  await page.screenshot({path:'artifacts/hero-debug.png'}).catch(()=>{});
  throw error;
} finally {await browser.close();}
