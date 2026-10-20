import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveAssetUrl,embedLocalImage} from '@alabuga/framework/assets';
test('asset base is operation-local and legacy paths are portable',()=>{
 assert.equal(resolveAssetUrl('../assets/brand/a.webp',{assetsBaseUrl:'https://example.org/custom/assets/'}),'https://example.org/custom/assets/brand/a.webp');
 for(const value of ['https://example.org/user.png','data:image/png;base64,eA==','photo.png','asset:'+'a'.repeat(64)])assert.equal(resolveAssetUrl(value),value);
 assert.throws(()=>resolveAssetUrl('../assets/brand/../secret',{assetsBaseUrl:'https://example.org/'}));
});
test('external HTTP images and data remain unchanged for export',async()=>{for(const src of ['https://example.org/user.png','data:image/png;base64,eA=='])assert.equal(await embedLocalImage(src),src)});
