import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('accessibility overrides and panel spacing survive token extraction',()=>{
 const layers=JSON.parse(readFileSync('design/token-layers.json','utf8'));
 const effective=Object.assign({},...Object.values(layers));
 assert.equal(effective['--af-panel-gap'],'16px');
 assert.equal(effective['--af-action-clear-text-default'],'#0956bb');
 assert.equal(effective['--af-feedback-info-text'],'#0956bb');
 assert.equal(effective['--af-text-tertiary'],'#606a73');
});
