const { chromium } = require('playwright');

async function run() {
  console.log("Launching browser...");
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      channel: 'chrome' // Try system chrome
    });
  } catch (e) {
    console.log("Failed to launch with system Chrome, trying default Playwright Chromium...");
    try {
      browser = await chromium.launch({ headless: true });
    } catch (e2) {
      console.error("Failed to launch browser:", e2);
      process.exit(1);
    }
  }
  
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log(`[Browser Console ${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log(`[Browser Unhandled Exception] ${err.toString()}`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`[Network Error] ${response.status()} ${response.url()}`);
    }
  });

  console.log("Navigating to login page...");
  await page.goto('https://wayacloud-silk.vercel.app/login', { waitUntil: 'networkidle' });
  console.log("Current URL:", page.url());
  console.log("Page title:", await page.title());
  
  try {
    console.log("Waiting for email input...");
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    console.log("Entering credentials...");
    await page.fill('input[type="email"]', 'graphistes6ns@gmail.com');
    await page.fill('input[type="password"]', 'Polobaby 77');
    
    console.log("Submitting login form...");
    const submitBtn = page.locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Se connecter")').first();
    await submitBtn.click();
    
    console.log("Waiting for response/navigation...");
    await page.waitForTimeout(5000);
    console.log("URL after click:", page.url());
    
    await page.screenshot({ path: 'test-login-result.png' });
    console.log("Screenshot test-login-result.png saved.");
    
    if (page.url().includes('dashboard') || page.url().includes('mes-fichiers') || page.url().includes('whatsapp')) {
      console.log("SUCCESS: Login completed. Navigating to Mes Fichiers...");
      await page.goto('https://wayacloud-silk.vercel.app/mes-fichiers', { waitUntil: 'networkidle' });
      console.log("Mes Fichiers URL:", page.url());
      await page.screenshot({ path: 'test-mes-fichiers.png' });
      
      const bodyText = await page.textContent('body');
      console.log("Is storage indicator visible?", bodyText.includes('Stockage') || bodyText.includes('Go'));
    } else {
      console.log("FAILED: Did not redirect to dashboard.");
      const body = await page.textContent('body');
      console.log("Body text fragment:", body.substring(0, 500));
    }
  } catch (e) {
    console.error("Test execution error:", e);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    await browser.close();
    console.log("Browser closed.");
  }
}

run();
