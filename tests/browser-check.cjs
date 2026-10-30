const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const base=process.env.REWARDS_URL||'https://zikunow.github.io/ogame-orion-rewards-calculator/';
 try{for(const width of [1440,768,390,320]){
  const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  assert.equal((await page.goto(new URL('?lang=en',base).href)).status(),200);
  assert.equal(await page.locator('#threshold').inputValue(),'28.4');assert.match(await page.locator('#cashbackHelp').textContent(),/8.06/);
  assert.equal(await page.locator('#results .stat').count(),4);assert.match(await page.locator('#results').textContent(),/Per calendar day/);
  await page.locator('#lithium').fill('18');assert.match(await page.locator('#cashbackHelp').textContent(),/8.24/);
  await page.locator('#planets').fill('0');assert.equal(await page.locator('#results .stat').count(),0);assert.equal(await page.locator('#validation').isVisible(),true);
  await page.locator('#reset').click();await page.locator('#threshold').fill('1000');assert.match(await page.locator('#results').textContent(),/No sample missions/);
  await page.locator('#threshold').fill('0');await page.locator('#playerClass').selectOption('collector');assert.equal(await page.locator('#t18').isDisabled(),true);
  const old=Number(await page.locator('#metal').inputValue());await page.locator('#autoFit').click();assert.ok(Number(await page.locator('#metal').inputValue())>=old);
  await page.locator('#reset').click();await page.locator('#langRu').click();assert.match(await page.locator('#results').textContent(),/В календарный день/);
  for(const theme of ['minimal','cosmic']){await page.locator('#theme').selectOption(theme);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Full overflow '+width+' '+theme);}
  await page.goto(new URL('?resourceLevel=17&lithiumLevel=17&availableSlots=6&t18=0',base).href);assert.equal(await page.locator('#metal').inputValue(),'17');assert.match(await page.locator('#results').textContent(),/162 \/ 1998/);
  if(process.env.SCREENSHOT_DIR){fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});await page.screenshot({path:process.env.SCREENSHOT_DIR+'/full-'+width+'.png',fullPage:true});}
  await page.goto(new URL('ias_for-dummies/?budget=100&waves=6',base).href);
  assert.equal(await page.locator('#waves').count(),0);assert.equal(await page.locator('#budget').inputValue(),'100');assert.equal(await page.locator('#output .forecast-stat').count(),4);assert.ok(!new URL(page.url()).searchParams.has('waves'));
  const income=await page.locator('.forecast-stat strong').first().textContent();
  const fullLink=await page.locator('.result-link').getAttribute('href');await page.goto(fullLink);
  const fullIncome=await page.locator('#results .stat strong').first().textContent();assert.equal(fullIncome.replace(/\s/g,''),income.replace(/\s/g,''));
  await page.goto(new URL('ias_for-dummies/?budget=100',base).href);
  await page.locator('#budget').fill('200');assert.equal(await page.locator('#output .forecast-stat').count(),0);await page.locator('#calculate').click();assert.equal(await page.locator('#output .forecast-stat').count(),4);
  await page.reload();assert.equal(await page.locator('#budget').inputValue(),'200');
  await page.locator('#budget').fill('0');await page.locator('#calculate').click();assert.equal(await page.locator('#error').isVisible(),true);assert.equal(await page.locator('#output .forecast-stat').count(),0);
  await page.locator('#budget').fill('100');await page.locator('#calculate').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Simple overflow '+width);
  if(process.env.SCREENSHOT_DIR)await page.screenshot({path:process.env.SCREENSHOT_DIR+'/simple-'+width+'.png',fullPage:true});
  assert.deepEqual(errors,[]);console.log('PASS full + simple '+width+'px');await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
