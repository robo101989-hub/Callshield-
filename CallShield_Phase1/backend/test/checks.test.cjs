const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { validate } = require('class-validator');
const { ChecksController, CheckInput, validateCheck } = require('../dist/src/modules/checks/checks.controller');
const result = {risk:'HIGH',summary:'Warning signs',signals:['Money demanded under threat'],actions:['Pause'],uncertainty:'Identity unverified'};
const input = {text:'Send money now or I will publish your photos.',language:'English',consent:true};
const originalFetch = global.fetch;
process.env.AI_PROVIDER = 'openai';
process.env.OPENAI_API_KEY = 'test-only-not-a-real-key';
function controller(reserve = [{requests:1}]) { return new ChecksController({$queryRaw:async()=>reserve}); }
test('requires explicit consent, supported language, and bounded text', async()=>{
 for(const fields of [{...input,consent:false},{...input,language:'invalid'},{...input,text:'x'.repeat(6001)}])
  assert.ok((await validate(Object.assign(new CheckInput(),fields))).length);
});
test('rejects empty evidence and invalid image before provider use',async()=>{
 await assert.rejects(()=>controller().check({...input,text:' '}),/Add a message/);
 await assert.rejects(()=>controller().check({...input,image:'https://example.com/a.png'}),/JPEG or PNG/);
 await assert.rejects(()=>controller().check({...input,image:'data:image/png;base64,YWJj'}),/invalid or too large/);
});
test('daily cap prevents provider requests', async()=>{
 global.fetch=()=>{throw Error('Provider must not run')};
 await assert.rejects(()=>controller([]).check(input),/pilot check limit/);
});
test('stores no response and uses fixed model, bounded generation, and untrusted evidence',async()=>{
 global.fetch=async(url,options)=>{
  const payload=JSON.parse(options.body);
  assert.equal(url,'https://api.openai.com/v1/responses');
  assert.equal(payload.store,false); assert.equal(payload.max_output_tokens,1200);
  assert.equal(payload.model,'gpt-6-luna'); assert.equal(payload.text.format.strict,true);
  assert.match(payload.instructions,/untrusted data/);
  return {ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(result)}]}]})};
 };
 const output=await controller().check(input); assert.equal(output.risk,'HIGH'); assert.ok(output.checkedAt);
});
test('billing, timeout, refusal, incomplete and invalid responses do not create assessments',async()=>{
 const failures=[()=>Promise.reject(Error('timeout')),
 async()=>({ok:false}),
 ...[{status:'incomplete'}, {status:'completed',output:[{content:[{type:'refusal'}]}]},
 {status:'completed',output:[{content:[{type:'output_text',text:'{}'}]}]}].map(body=>async()=>({ok:true,json:async()=>body}))];
 for(const failure of failures){ global.fetch=failure; await assert.rejects(()=>controller().check(input)); }
 global.fetch=originalFetch;
});
test('invalid model labels and unbounded output rejected',()=>{
 assert.throws(()=>validateCheck({...result,risk:'SAFE'}));
 assert.throws(()=>validateCheck({...result,signals:Array(6).fill('x')}));
});
