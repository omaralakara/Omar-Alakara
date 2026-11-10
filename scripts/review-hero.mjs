import { chromium } from '@playwright/test';
import fs from 'node:fs';
fs.mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
page.on('pageerror',error=>console.error(error.message));
try {
  await page.goto(process.env.PREVIEW_URL || 'http://localhost:3000');
  await page.locator('[data-scene="interactive"]').waitFor({timeout:40000});
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(2400);
  for(const [width,height,layout] of [[1440,900,'desktop'],[390,844,'mobile']]) {
    await page.setViewportSize({width,height});await page.waitForTimeout(400);
    for(const [progress,name] of [[0,'earth'],[.125,'transition'],[.25,'launch'],[.5,'orbit'],[.75,'core'],[1,'horizon']]) {
      await page.evaluate(p=>scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*p),progress);
      await page.waitForTimeout(1600);
      await page.screenshot({path:'artifacts/review-'+layout+'-'+name+'.png'});
    }
  }
  console.log('Captured the five scenes and continuous transition on desktop and mobile.');
} finally {await browser.close();}
