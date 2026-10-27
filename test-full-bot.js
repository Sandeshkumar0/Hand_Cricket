import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACT_DIR = '/home/aarzoo/.gemini/antigravity-cli/brain/9c8891f9-487c-4a7e-9a39-e01fa122895b';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Navigating to app...');
  await page.goto('https://hand-cricket-f9e44.web.app', { waitUntil: 'networkidle0' });
  await delay(2000);

  console.log('Opening Login...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const loginBtn = btns.find(b => b.innerText.includes('LOGIN') || b.querySelector('svg'));
    if (loginBtn) loginBtn.click();
  });
  await delay(1000);

  console.log('Signing Up...');
  const email = `testuser${Math.floor(Math.random() * 100000)}`;
  await page.type('input[placeholder="Username"]', email);
  await page.type('input[placeholder="Password"]', 'password123');

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const submitBtn = btns.find(b => b.innerText === 'SIGN UP');
    if (submitBtn) submitBtn.click();
  });
  await delay(3000); // Wait for auth to complete

  console.log('Navigating to Bot Match...');
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('h2'));
    const vsBotCard = cards.find(h => h.innerText.includes('VS BOT MATCH'));
    if (vsBotCard) vsBotCard.parentElement.parentElement.click();
  });
  await delay(2000);

  console.log('Doing Toss...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_01_toss.png') });
  
  // Click ODD or EVEN
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const oddBtn = btns.find(b => b.innerText.includes('ODD'));
    if (oddBtn) oddBtn.click();
  });
  await delay(1000);
  
  // Click a number for toss
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const numBtn = btns.find(b => b.innerText === '3' || b.innerText === '4');
    if (numBtn) numBtn.click();
  });
  await delay(3000); // Wait for toss animation

  // In case we won toss, pick Batting
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const batBtn = btns.find(b => b.innerText.includes('BAT'));
    if (batBtn) batBtn.click();
  });
  await delay(2000);

  console.log('Playing the match...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_02_match_start.png') });

  // Play a few balls
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      // Find a random number button between 1 and 6
      const numBtn = btns.find(b => ['1','2','3','4','5','6'].includes(b.innerText.trim()));
      if (numBtn) numBtn.click();
    });
    await delay(2500); // Wait for ball animation
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_03_mid_match.png') });

  await browser.close();
  console.log('Test complete!');
}

runTest().catch(console.error);
