const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function run() {
  console.log("Creating a mock file to upload...");
  const tempFilePath = path.join(__dirname, 'mock-upload-test.txt');
  fs.writeFileSync(tempFilePath, 'This is a mock text file uploaded by the automated test suite. Current timestamp: ' + new Date().toISOString());

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
    console.log("Current URL:", page.url());

    console.log("Navigating to Mes Fichiers...");
    await page.goto('https://wayacloud-silk.vercel.app/mes-fichiers', { waitUntil: 'networkidle' });
    console.log("Current page URL:", page.url());

    // Take screenshot before upload
    await page.screenshot({ path: 'test-upload-1-before.png' });
    console.log("Saved test-upload-1-before.png");

    console.log("Locating file input and uploading mock file...");
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(tempFilePath);

    console.log("File selected. Waiting for upload process...");
    // The button displays "Envoi 1" or similar when uploading, and resets when done.
    // Let's wait for a few seconds to let the upload complete.
    await page.waitForTimeout(8000);

    // Let's take a screenshot after upload
    await page.screenshot({ path: 'test-upload-2-after-upload.png' });
    console.log("Saved test-upload-2-after-upload.png");

    // Check if the mock file is present in the list
    const fileRow = page.locator('tr:has-text("mock-upload-test.txt"), div:has-text("mock-upload-test.txt")').first();
    const count = await fileRow.count();
    if (count > 0) {
      console.log("SUCCESS: Mock file is visible in the UI!");

      // Now let's try to delete it
      console.log("Attempting to delete the uploaded mock file...");
      // Let's click the actions menu button (usually the last column, three dots)
      // We can locate the options button relative to the file row.
      // Looking at the screenshot, the last column contains a button with icon or class (e.g. lucide-more-vertical or similar)
      const optionsBtn = fileRow.locator('button[aria-label="Plus d\'actions"]').first();
      await optionsBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'test-upload-3-menu.png' });
      console.log("Saved test-upload-3-menu.png");

      // Click "Supprimer définitivement" in context menu
      console.log("Clicking 'Supprimer définitivement' option...");
      const deleteOption = page.locator('button:has-text("Supprimer définitivement")').first();
      await deleteOption.click();

      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'test-upload-3.5-confirm-modal.png' });
      console.log("Saved test-upload-3.5-confirm-modal.png");

      // Click delete button in confirmation modal
      console.log("Confirming deletion in modal...");
      const confirmBtn = page.locator('button:has-text("Supprimer")').first();
      await confirmBtn.click();
      
      console.log("Delete clicked. Waiting for file to be removed...");
      await page.waitForTimeout(5000);

      await page.screenshot({ path: 'test-upload-4-after-delete.png' });
      console.log("Saved test-upload-4-after-delete.png");

      // Verify it's gone
      const fileRowCheck = page.locator('tr:has-text("mock-upload-test.txt"), div:has-text("mock-upload-test.txt")').first();
      const countCheck = await fileRowCheck.count();
      if (countCheck === 0) {
        console.log("SUCCESS: File was deleted and removed from the UI!");
      } else {
        console.log("FAILED: File is still in the UI after deletion.");
      }
    } else {
      console.log("FAILED: Mock file did not appear in the UI.");
    }

  } catch (e) {
    console.error("Test execution error:", e);
    await page.screenshot({ path: 'test-upload-error.png' });
  } finally {
    try {
      fs.unlinkSync(tempFilePath);
      console.log("Cleaned up local mock file.");
    } catch {}
    await browser.close();
    console.log("Browser closed.");
  }
}

run();
