// Behavioural browser check for the story homepage (no screenshots).
// Requires `npm run dev` (or a static preview) on PREVIEW_URL and local Chrome.
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const url = process.env.PREVIEW_URL || 'http://localhost:3000';
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const sections = ['top', 'skills', 'results', 'work', 'about', 'contact'];
const scenes = ['Earth', 'satellite', 'galaxy', 'rocket', 'robot', 'Earth'];
const errors = [];
const results = [];
const step = async (name, fn) => { await fn(); results.push(`✓ ${name}`); };

async function open(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ...options });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !/context lost|favicon/i.test(message.text())) errors.push(message.text()); });
  return { context, page };
}
const noOverflow = async page => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal page overflow');
async function scrollTo(page, id, offset = 0, wait = 2200) {
  await page.evaluate(([target, extra]) => {
    const element = document.getElementById(target);
    window.scrollTo({ top: element.getBoundingClientRect().top + scrollY + extra, behavior: 'instant' });
  }, [id, offset]);
  await page.waitForTimeout(wait);
}
const story = page => page.locator('[data-active-section]').evaluate(el => Number(el.dataset.story));
const opacity = (page, selector) => page.locator(selector).evaluate(el => Number(getComputedStyle(el).opacity));
// Scroll through a pinned section with the wheel, collecting an attribute's values.
async function wheelThrough(page, id, read, steps = 14, delta = 260) {
  await scrollTo(page, id, 0, 900);
  const seen = new Set([await read()]);
  for (let i = 0; i < steps; i++) { await page.mouse.wheel(0, delta); await page.waitForTimeout(280); seen.add(await read()); }
  await page.waitForTimeout(900);
  return seen;
}

try {
  const { context, page } = await open();
  await page.goto(url);
  await step('particle scene becomes interactive', () => page.locator('[data-scene="interactive"]').waitFor({ timeout: 60000 }));
  await page.waitForTimeout(3400);
  await step('structure: one h1, six sections in order, no pause control', async () => {
    assert.equal(await page.locator('h1').count(), 1);
    assert.deepEqual(await page.locator('[data-story-section]').evaluateAll(list => list.map(el => el.id)), sections);
    assert.equal(await page.getByRole('button', { name: /pause motion|play motion/i }).count(), 0);
  });
  await step('canvas renders changing frames', async () => {
    const canvas = page.locator('canvas[data-engine]');
    const a = await canvas.screenshot(); await page.waitForTimeout(400); const b = await canvas.screenshot();
    assert(!a.equals(b), 'canvas animates');
  });
  await step('intro headline assembles and stays accessible', async () => {
    assert(await page.getByRole('heading', { level: 1, name: /Creative development\.\s*Real-world impact\./ }).isVisible());
    assert.equal(await opacity(page, '[data-intro-title] .char >> nth=0'), 1);
  });
  await noOverflow(page);

  for (const [width, height] of [[1440, 1000], [1280, 720]]) {
    await step(`every section fits one screen at ${width}×${height}; every scene sits in the right column`, async () => {
      await page.setViewportSize({ width, height }); await page.waitForTimeout(1200);
      for (const id of sections) {
        const fit = await page.locator(`#${id}`).evaluate(section => {
          const block = section.querySelector('[data-pin]') ?? section, copy = block.querySelector(':scope > [class*="copy"]');
          const slot = block.querySelector(':scope > [class*="slot"]').getBoundingClientRect();
          return { content: copy.scrollHeight + parseFloat(getComputedStyle(block).paddingTop) + parseFloat(getComputedStyle(block).paddingBottom), screen: innerHeight, slotLeft: slot.left, half: innerWidth * .45 };
        });
        assert(fit.content <= fit.screen + 2, `#${id} content ${Math.round(fit.content)}px exceeds ${fit.screen}px`);
        assert(fit.slotLeft >= fit.half, `#${id} scene column starts at ${Math.round(fit.slotLeft)}px (left half)`);
      }
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.waitForTimeout(1200);

  for (const [index, id] of sections.entries()) {
    await step(`scene ${index} (${scenes[index]}) settles at #${id}`, async () => {
      await scrollTo(page, id);
      const value = await story(page);
      assert(Math.abs(value - index) < .06, `story value at #${id} is ${value}, expected ${index}`);
    });
  }
  await step('scrolling back reverses the morph', async () => {
    await scrollTo(page, 'results');
    assert(Math.abs(await story(page) - 2) < .06);
  });

  await step('skills: chips orbit the satellite and each orbit takes its turn', async () => {
    const skills = page.locator('#skills');
    assert.equal(await skills.getAttribute('data-enhanced'), 'true');
    await scrollTo(page, 'skills', 0, 1500);
    const chip = page.locator('[data-chip]').first();
    const a = await chip.evaluate(el => el.style.transform); await page.waitForTimeout(500); const b = await chip.evaluate(el => el.style.transform);
    assert.notEqual(a, b, 'chips keep orbiting');
    const seen = await wheelThrough(page, 'skills', () => skills.getAttribute('data-group'));
    assert(['0', '1', '2', '3'].every(group => seen.has(group)), `orbits seen: ${[...seen].join(',')}`);
  });

  await step('projects: one-screen stack swaps each screen in turn; only the visible one is focusable', async () => {
    const work = page.locator('#work');
    assert.equal(await work.getAttribute('data-enhanced'), 'true');
    const seen = await wheelThrough(page, 'work', () => work.getAttribute('data-project'));
    assert(['0', '1', '2'].every(card => seen.has(card)), `screens seen: ${[...seen].join(',')}`);
    assert.equal(await page.locator('[data-project-card]:not([inert])').count(), 1);
  });

  await step('experience: year track advances role by role with its skills', async () => {
    const seen = await wheelThrough(page, 'about', () => page.locator('[data-marker][data-active]').evaluate(el => [...el.parentElement.querySelectorAll('[data-marker]')].indexOf(el)), 18, 220);
    assert([0, 1, 2, 3, 4, 5].every(role => seen.has(role)), `roles seen: ${[...seen].join(',')}`);
    assert.equal(await page.locator('[data-role]:not([inert])').count(), 1);
  });

  await step('content stays readable; only the hero headline disperses and reassembles', async () => {
    await scrollTo(page, 'top', 0, 1200);
    assert(await opacity(page, '#intro-title') > .9);
    await page.evaluate(() => scrollBy(0, 650)); await page.waitForTimeout(1500);
    assert(await opacity(page, '#intro-title') < .5, 'hero headline disperses into the stars');
    await page.evaluate(() => scrollBy(0, -650)); await page.waitForTimeout(1500);
    assert(await opacity(page, '#intro-title') > .9, 'hero headline reassembles');
    for (const id of ['skills', 'results', 'work', 'about']) {
      await scrollTo(page, id, 60, 1600);
      assert(await opacity(page, `#${id}-title`) > .9, `#${id} heading readable`);
    }
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); await page.waitForTimeout(2200);
    assert(await opacity(page, '#contact-title') > .9, 'contact heading visible at page end');
    assert.equal(await opacity(page, '[data-email-text] .char >> nth=0'), 1, 'email visible at page end');
  });

  await step('numbers count up to the real CV values', async () => {
    await scrollTo(page, 'results', 0, 2400);
    assert.deepEqual(await page.locator('[data-count]').allTextContents(), ['44', '63']);
    // Visible, not just present: gradient text with a text-shadow renders dark in Chrome.
    for (const number of await page.locator('[class*="metrics"] b').all()) {
      assert.equal(await number.evaluate(el => getComputedStyle(el).textShadow), 'none', 'numbers have no text-shadow over their gradient');
      assert(await number.evaluate(el => Number(getComputedStyle(el.parentElement).opacity)) > .9, 'numbers revealed');
      const size = await number.evaluate(el => ({ digits: parseFloat(getComputedStyle(el.querySelector('[data-count]')).fontSize), font: parseFloat(getComputedStyle(el).fontSize), height: el.getBoundingClientRect().height }));
      assert(size.digits >= 50 && size.digits === size.font, `digits render at full size (${size.digits}px)`);
      assert(size.height < size.font * 1.3, `+, digits and % sit on one line (${Math.round(size.height)}px tall)`);
    }
  });

  await step('robot waves on arrival and its head follows the cursor', async () => {
    await scrollTo(page, 'work', 0, 600);
    await scrollTo(page, 'about', 0, 900);
    assert.equal(await page.locator('#about').getAttribute('data-waving'), 'true', 'wave starts on entering Experience');
    const canvas = page.locator('canvas[data-engine]');
    await page.mouse.move(80, 500); await page.waitForTimeout(900);
    const left = Number(await canvas.getAttribute('data-robot-yaw'));
    await page.mouse.move(1420, 500); await page.waitForTimeout(900);
    const right = Number(await canvas.getAttribute('data-robot-yaw'));
    assert(left < -.2 && right - left > .3, `head yaw left ${left} → right ${right}`);
    await page.waitForTimeout(3500);
    await page.getByRole('button', { name: /Wave hello/ }).click();
    assert.equal(await page.locator('#about').getAttribute('data-waving'), 'true', 'button makes the robot wave');
  });

  await step('project details open for each screen, close with Escape, restore focus', async () => {
    const work = page.locator('#work');
    for (const [index, name] of ['Laptops King', 'Synergi BPO', 'fazeZERO'].entries()) {
      // Each screen's snap point: section start + index/(n-1) of the pin length (innerHeight × 2 × 1.05).
      await page.evaluate(i => { const top = document.getElementById('work').getBoundingClientRect().top + scrollY; window.scrollTo({ top: top + i / 2 * innerHeight * 2.1, behavior: 'instant' }); }, index);
      await page.waitForTimeout(1400);
      assert.equal(await work.getAttribute('data-project'), String(index), `screen ${index} showing`);
      const button = page.getByRole('button', { name: `Explore my work at ${name}` });
      await button.click();
      const dialog = page.getByRole('dialog');
      assert(await dialog.getByRole('heading', { name, exact: true }).isVisible());
      await page.keyboard.press('Escape');
      assert(!(await dialog.isVisible()));
      assert(await button.evaluate(el => el === document.activeElement), 'focus returns to the trigger');
    }
  });

  await step('navigation jumps directly to the start of each section', async () => {
    for (const [label, id] of [['Experience', 'about'], ['Work', 'work'], ['Skills', 'skills'], ['Results', 'results'], ['Contact', 'contact']]) {
      await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: label, exact: true }).click();
      await page.waitForTimeout(2200);
      const top = await page.locator(`#${id}`).evaluate(el => el.getBoundingClientRect().top);
      assert(top > -5 && top < 140 || id === 'contact', `#${id} top is ${top}`);
    }
    assert.equal(await page.getByRole('link', { name: 'Contact', exact: true }).getAttribute('aria-current'), 'true');
  });

  await step('CV is downloadable', async () => assert((await context.request.get(`${url}/Omar-Al-Akara-CV.pdf`)).ok()));

  for (const [width, height, label] of [[390, 844, 'mobile'], [320, 568, 'small mobile'], [844, 390, 'landscape'], [1024, 768, 'tablet landscape']]) {
    await step(`${label} (${width}×${height}): natural flow, no overflow, all roles and screens reachable`, async () => {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(1500);
      await noOverflow(page);
      if (width < 720) {
        const menu = page.locator('button[aria-controls="site-nav"]');
        await menu.click();
        assert.equal(await menu.getAttribute('aria-expanded'), 'true');
        await page.keyboard.press('Escape');
        assert.equal(await menu.getAttribute('aria-expanded'), 'false');
      }
      for (const id of sections.slice(1)) { await scrollTo(page, id, 0, 600); await noOverflow(page); }
      assert.equal(await page.locator('#work').getAttribute('data-enhanced'), null);
      assert.equal(await page.locator('[data-role][inert], [data-project-card][inert]').count(), 0);
    });
  }
  await context.close();

  await step('reduced motion: no WebGL, static artwork, all content visible', async () => {
    const { context: reduced, page: still } = await open({ reducedMotion: 'reduce' });
    await still.goto(url);
    await still.waitForTimeout(1500);
    assert.equal(await still.locator('canvas[data-engine]').count(), 0);
    assert(await still.locator('#top img').isVisible());
    assert(await still.locator('#about svg').last().isVisible(), 'static robot visible');
    assert.equal(await still.locator('[data-role]').count(), 6);
    assert.equal(await opacity(still, '#contact-title'), 1);
    await reduced.close();
  });

  await step('no JavaScript: all content and links present', async () => {
    const { context: plain, page: html } = await open({ javaScriptEnabled: false });
    await html.goto(url);
    assert.equal(await html.locator('h2').count(), 5);
    assert(await html.getByRole('link', { name: /omar\.alakara3@gmail\.com/ }).isVisible());
    await plain.close();
  });

  assert.deepEqual(errors, [], `browser errors:\n${errors.join('\n')}`);
  console.log(results.join('\n'));
  console.log(`\nAll ${results.length} checks passed.`);
} catch (error) {
  console.log(results.join('\n'));
  console.error('\n✗', error.message);
  if (errors.length) console.error('Browser errors:\n' + errors.join('\n'));
  process.exitCode = 1;
} finally {
  await browser.close();
}
