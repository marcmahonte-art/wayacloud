const { chromium } = require('playwright');

async function run() {
  console.log("Launching browser...");
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      channel: 'chrome'
    });
  } catch (e) {
    console.log("Failed to launch with system Chrome, trying default Playwright Chromium...");
    browser = await chromium.launch({ headless: true });
  }

  const page = await browser.newPage();
  
  const networkErrors = [];
  const jsErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[Browser Console Error] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`[Browser JS Error] ${err.toString()}`);
    jsErrors.push(err.toString());
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`[Network Error] ${response.status()} ${response.url()}`);
      networkErrors.push(`${response.status()} ${response.url()}`);
    }
  });

  console.log("Navigating to login page...");
  await page.goto('https://wayacloud-silk.vercel.app/login', { waitUntil: 'networkidle' });

  try {
    console.log("Entering credentials...");
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'graphistes6ns@gmail.com');
    await page.fill('input[type="password"]', 'Polobaby 77');

    console.log("Submitting login form...");
    const submitBtn = page.locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Se connecter")').first();
    await submitBtn.click();

    console.log("Waiting for redirection...");
    await page.waitForTimeout(5000);
    console.log("Logged in. Current URL:", page.url());

    const routes = [
      '/dashboard',
      '/mes-fichiers',
      '/whatsapp',
      '/albums',
      '/partages',
      '/documents',
      '/corbeille',
      '/referral',
      '/gift',
      '/parametres',
      '/abonnement'
    ];

    for (const route of routes) {
      console.log(`\n--- Testing route: ${route} ---`);
      await page.goto(`https://wayacloud-silk.vercel.app${route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      console.log(`Loaded ${route}. URL: ${page.url()}`);
      await page.screenshot({ path: `test-route-${route.replace('/', '')}.png` });
    }

  } catch (e) {
    console.error("Test execution error:", e);
  } finally {
    await browser.close();
    console.log("\n--- TEST SUMMARY ---");
    console.log(`JS Errors found: ${jsErrors.length}`);
    console.log(`Network Errors (>=400) found: ${networkErrors.length}`);
    console.log("Browser closed.");
  }
}

run();
