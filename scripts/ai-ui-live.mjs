import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1440,height:1000}}),result={mode:'real-local-model-ui',started:new Date().toISOString()};
try{
 await page.goto('http://127.0.0.1:4176/builder/index.html');await expect(page.locator('#save-state')).toHaveText('Сохранено в браузере');
 const before=await page.locator('#pages option').count();
 await page.getByRole('button',{name:'Создать с ИИ',exact:true}).click();
 await page.getByLabel('Запрос',{exact:true}).fill('Создай текстовую секцию: проекты сохраняются локально.');
 await page.getByLabel('Исходные сведения',{exact:true}).fill('Проекты Alabuga Framework сохраняются в браузере в IndexedDB.');
 await page.getByRole('button',{name:'Создать черновик',exact:true}).click();
 await expect(page.locator('.ai-progress')).toContainText('Черновик готов',{timeout:120000});
 result.text=await page.locator('.ai-preview').innerText();await page.screenshot({path:'artifacts/ai/editor-real-draft.png'});
 // Exercise the intended author review/edit step before applying a generated draft.
 const heading=page.locator('.ai-preview [contenteditable]').first();await heading.fill('Локальные проекты');await heading.blur();
 await page.getByLabel('Содержание и замечания проверены').check();await page.getByRole('button',{name:'Применить черновик',exact:true}).click();
 await expect(page.locator('.ai-dialog')).toHaveCount(0);await expect(page.locator('#pages option')).toHaveCount(before+1);
 await page.screenshot({path:'artifacts/ai/editor-real-applied.png'});await page.locator('#undo').click();await expect(page.locator('#pages option')).toHaveCount(before);result.success=true;
}catch(e){result.success=false;result.error=String(e);process.exitCode=1}finally{await writeFile('artifacts/ai/ui-live.json',JSON.stringify(result,null,2));await browser.close()}
