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
  
  // Emulate iPhone 13
  await page.setViewport({
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true
  });

  console.log('Navigating to app...');
  await page.goto('https://hand-cricket-f9e44.web.app', { waitUntil: 'networkidle0' });

  // Wait a bit for animations
  await delay(2000);

  // Take Main Menu screenshot
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_main_menu.png') });
  console.log('Screenshot 1: Main Menu saved.');

  // Check if "AUTHENTICATION REQUIRED" is present
  const bodyText = await page.evaluate(() => document.body.innerText);
  
  if (bodyText.includes('AUTHENTICATION REQUIRED')) {
    console.log('Needs authentication. Opening Auth Modal...');
    // Find the login button in navbar. Usually it's in the top right.
    // Let's click the user icon button.
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const loginBtn = btns.find(b => b.innerText.includes('LOGIN') || b.querySelector('svg'));
      if (loginBtn) loginBtn.click();
    });

    await delay(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_auth_modal.png') });
    console.log('Screenshot 2: Auth Modal saved.');

    // Switch to SIGN UP
    await page.evaluate(() => {
      const toggle = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Sign Up'));
      if (toggle) toggle.click();
    });
    
    await delay(500);

    console.log('Filling out sign up form...');
    const randomSuffix = Math.floor(Math.random() * 100000);
    const email = `testuser${randomSuffix}@example.com`;
    const password = 'password123';
    
    await page.type('input[placeholder="Player Name"]', 'Test Player');
    await page.type('input[placeholder="Email"]', email);
    await page.type('input[placeholder="Password"]', password);

    // Click SIGN UP submit button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const submitBtn = btns.find(b => b.innerText === 'SIGN UP');
      if (submitBtn) submitBtn.click();
    });

    // Wait for login to complete and modal to close
    await delay(3000);
    
    console.log('Taking screenshot after login...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_main_menu_logged_in.png') });
    console.log('Screenshot 3: Logged in Main Menu saved.');

    // Click VS BOT MATCH
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('h2'));
      const vsBotCard = cards.find(h => h.innerText.includes('VS BOT MATCH'));
      if (vsBotCard) vsBotCard.parentElement.parentElement.click();
    });

    await delay(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_toss.png') });
    console.log('Screenshot 4: Toss screen saved.');
  }

  await browser.close();
  console.log('Done!');
}

runTest().catch(console.error);
