import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('artifacts/design-review-2026-10-07',{recursive:true});
const browser=await chromium.launch({headless:true});const results=[];
for(const [name,url] of [['local','http://127.0.0.1:8787/'],['production','https://ilyakav.com/'],['sakori','https://sakori.pl/en/'],['prox','https://proxdigital.pl/'],['brix','https://brixagency.com/'],['dennis','https://dennissnellenberg.com/']]){
 const page=await browser.newPage({viewport:{width:1440,height:900},locale:'en',reducedMotion:'reduce'});
 try{await page.goto(url,{waitUntil:'domcontentloaded',timeout:25000});await page.waitForTimeout(2200);await page.screenshot({path:`artifacts/design-review-2026-10-07/${name}-top.png`});
 results.push({name,url:page.url(),title:await page.title(),headings:await page.locator('h1,h2,h3').allTextContents(),scripts:await page.locator('script[src]').evaluateAll(es=>es.map(e=>e.src)),text:(await page.locator('body').innerText()).slice(0,16000)});
 if(name==='local'||name==='production') {for(const y of [800,1600,2400]){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(600);await page.screenshot({path:`artifacts/design-review-2026-10-07/${name}-${y}.png`})}}
 }catch(e){results.push({name,error:e.message})}finally{await page.close()}
 console.log('Viewed',name);
}
await writeFile('artifacts/design-review-2026-10-07/research.json',JSON.stringify(results,null,2));await browser.close();
