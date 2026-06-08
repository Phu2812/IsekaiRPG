const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set up console listener to catch errors
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:3000');
  console.log('Title screen loaded');
  await page.screenshot({ path: 'v2_title.png' });

  // Click start
  await page.click('button:has-text("BẮT ĐẦU")');
  console.log('Clicked start');

  // Input name
  await page.fill('#player-name-input', 'Hero');
  await page.click('button:has-text("XÁC NHẬN")');
  console.log('Confirmed name');

  // Select Rogue for combo testing
  await page.click('.class-card:has-text("Rogue")');
  console.log('Selected Rogue');
  await page.screenshot({ path: 'v2_world.png' });

  // Start battle
  await page.click('button:has-text("THÁM HIỂM / CHIẾN ĐẤU")');
  console.log('Started battle');
  await page.screenshot({ path: 'v2_battle_start.png' });

  // Check if skills are rendered
  const skills = await page.$$('.skill-btn');
  console.log(`Found ${skills.length} skills`);

  // Use Combo skill (index 2 for Rogue: stab, poison, combo)
  await skills[2].click();
  console.log('Used Combo skill');

  // Wait a bit for logs
  await page.waitForTimeout(1000);
  const logs = await page.innerText('#battle-log');
  console.log('Battle Log After Combo:\n', logs);
  await page.screenshot({ path: 'v2_after_combo.png' });

  // Now test Mage for Blizzard
  await page.reload();
  await page.click('button:has-text("BẮT ĐẦU")');
  await page.fill('#player-name-input', 'MageUser');
  await page.click('button:has-text("XÁC NHẬN")');
  await page.click('.class-card:has-text("Mage")');
  await page.click('button:has-text("THÁM HIỂM / CHIẾN ĐẤU")');

  const mageSkills = await page.$$('.skill-btn');
  // Blizzard is index 1
  await mageSkills[1].click();
  console.log('Used Blizzard');
  await page.waitForTimeout(1500); // Wait for enemy turn
  const mageLogs = await page.innerText('#battle-log');
  console.log('Battle Log After Blizzard:\n', mageLogs);
  await page.screenshot({ path: 'v2_after_blizzard.png' });

  await browser.close();
})();
