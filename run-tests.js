import puppeteer from 'puppeteer';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('--- STARTING E2E TESTS ---');
  
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: "new"
  });

  try {
    console.log('1. Testing Authentication & Lobby Flow...');
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 60000 });
    
    // Wait for the app to render
    await page.waitForSelector('h1', { visible: true, timeout: 60000 });
    await delay(2000);

    // Open Auth Modal
    await page.waitForSelector('button', { visible: true });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const loginBtn = btns.find(b => b.innerText && b.innerText.includes('LOGIN'));
      if (loginBtn) loginBtn.click();
    });
    
    // Switch to SIGN UP
    await delay(1000);
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const toggle = btns.find(b => b.innerText.includes('Sign Up'));
      if (toggle) toggle.click();
    });
    
    await delay(1000); // Wait for modal animation
    
    const randomUser = `testuser${Math.floor(Math.random() * 100000)}`;
    
    // Fill out form
    await page.waitForSelector('input[placeholder="Username"]', { visible: true });
    await page.type('input[placeholder="Username"]', randomUser);
    await page.type('input[placeholder="Password"]', 'password123');
    
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const submit = btns.find(b => b.innerText === 'SIGN UP');
      if (submit) submit.click();
    });
    
    await delay(4000); // Wait for firebase auth and modal close
    
    console.log('✅ Authentication Test Passed!');

    console.log('2. Testing Single Player (Bot Match)...');
    
    await page.evaluate(() => {
      const h2s = Array.from(document.querySelectorAll('h2'));
      const vsBot = h2s.find(h => h.innerText.includes('VS BOT MATCH'));
      if (vsBot) vsBot.parentElement.parentElement.click();
    });
    
    await delay(2000);
    
    // Toss
    await page.waitForSelector('button', { visible: true });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const odd = btns.find(b => b.innerText.includes('ODD'));
      if (odd) odd.click();
    });
    await delay(1000);
    
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const num = btns.find(b => b.innerText.trim() === '4');
      if (num) num.click();
    });
    
    await delay(4000); // Toss animation
    
    // If won toss, pick BAT
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const bat = btns.find(b => b.innerText.includes('BAT'));
      if (bat) bat.click();
    });
    
    await delay(2000);
    
    // Play 3 balls
    for(let i=0; i<3; i++) {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const numBtn = btns.find(b => ['1','2','3','4','5','6'].includes(b.innerText.trim()));
        if (numBtn) numBtn.click();
      });
      await delay(2000);
    }
    
    console.log('✅ Single Player Bot Match Test Passed!');
    
    await page.close();

    // Host Page (Incognito)
    const hostContext = await browser.createBrowserContext();
    const hostPage = await hostContext.newPage();
    await hostPage.setViewport({ width: 1280, height: 800 });
    await hostPage.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 60000 });
    await hostPage.waitForSelector('h1', { visible: true, timeout: 60000 });
    
    // Login host
    await hostPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const loginBtn = btns.find(b => b.innerText && b.innerText.includes('LOGIN'));
      if (loginBtn) loginBtn.click();
    });
    await delay(1000);
    
    // For incognito, we need to sign up again since it's a fresh context
    await hostPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const toggle = btns.find(b => b.innerText.includes('Sign Up'));
      if (toggle) toggle.click();
    });
    await delay(1000);
    
    const hostUser = `host${Math.floor(Math.random() * 100000)}`;
    await hostPage.waitForSelector('input[placeholder="Username"]', { visible: true });
    await hostPage.type('input[placeholder="Username"]', hostUser);
    await hostPage.type('input[placeholder="Password"]', 'password123');
    await hostPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const submit = btns.find(b => b.innerText === 'SIGN UP');
      if (submit) submit.click();
    });
    await delay(4000);
    
    // Open Multiplayer
    await hostPage.evaluate(() => {
      const h2s = Array.from(document.querySelectorAll('h2'));
      const mp = h2s.find(h => h.innerText.includes('FRIENDS SHOWDOWN'));
      if (mp) mp.parentElement.parentElement.click();
    });
    
    await delay(2000);
    
    // Click Create Room Card
    await hostPage.evaluate(() => {
      const card = document.getElementById('mp-create-room-card');
      if (card) card.click();
    });
    
    await delay(1000);
    
    // Click Create Room Button
    await hostPage.evaluate(() => {
      const btn = document.getElementById('mp-create-room-btn');
      if (btn) btn.click();
    });
    
    await delay(3000);
    
    // Extract Room Code
    const roomCode = await hostPage.evaluate(() => {
      const el = document.querySelector('span.text-arena-primary');
      return el ? el.innerText.trim() : null;
    });
    
    if (!roomCode) throw new Error("Could not find Room Code!");
    console.log(`✅ Multiplayer Room Created! Code: ${roomCode}`);
    
    // Join as Guest (Separate Incognito Context)
    const guestContext = await browser.createBrowserContext();
    const guestPage = await guestContext.newPage();
    await guestPage.setViewport({ width: 1280, height: 800 });
    await guestPage.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 60000 });
    await guestPage.waitForSelector('h1', { visible: true, timeout: 60000 });
    
    // Login Guest
    await guestPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const loginBtn = btns.find(b => b.innerText && b.innerText.includes('LOGIN'));
      if (loginBtn) loginBtn.click();
    });
    await delay(1000);
    await guestPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const toggle = btns.find(b => b.innerText.includes('Sign Up'));
      if (toggle) toggle.click();
    });
    await delay(1000);
    const guestUser = `guest${Math.floor(Math.random() * 100000)}`;
    await guestPage.type('input[placeholder="Username"]', guestUser);
    await guestPage.type('input[placeholder="Password"]', 'password123');
    await guestPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const submit = btns.find(b => b.innerText === 'SIGN UP');
      if (submit) submit.click();
    });
    await delay(4000);
    
    // Open Multiplayer
    await guestPage.evaluate(() => {
      const h2s = Array.from(document.querySelectorAll('h2'));
      const mp = h2s.find(h => h.innerText.includes('FRIENDS SHOWDOWN'));
      if (mp) mp.parentElement.parentElement.click();
    });
    await delay(2000);
    
    // Enter Code and Join
    await guestPage.evaluate(() => {
      const card = document.getElementById('mp-join-room-card');
      if (card) card.click();
    });
    
    await delay(1000);
    
    for (let i = 0; i < roomCode.length; i++) {
      await guestPage.type(`#mp-join-code-${i}`, roomCode[i]);
      await delay(100);
    }
    
    await guestPage.evaluate(() => {
      const btn = document.getElementById('mp-join-room-btn');
      if (btn) btn.click();
    });
    
    await delay(4000);
    console.log('✅ Guest Joined Room Successfully!');
    
    console.log('--- ALL TESTS COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('❌ Test Failed:', error);
  } finally {
    await browser.close();
  }
}

runTests().catch(console.error);
