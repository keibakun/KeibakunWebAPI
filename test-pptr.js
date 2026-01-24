// test-pptr.js
// ローカル環境で Puppeteer の起動確認を行う簡易スクリプト
// 実行例:
// PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node test-pptr.js

const puppeteer = require('puppeteer');

(async () => {
  try {
    const execPath = process.env.PUPPETEER_EXECUTABLE_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    console.log('using executablePath:', execPath);
    const browser = await puppeteer.launch({
      executablePath: execPath,
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('opened page title:', await page.title());
    await browser.close();
    console.log('success');
  } catch (e) {
    console.error('launch failed:', e);
    process.exit(1);
  }
})();
