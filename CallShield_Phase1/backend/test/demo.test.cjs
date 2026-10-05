const {test}=require('node:test');
const assert=require('node:assert/strict');
require('reflect-metadata');
const {ValidationPipe}=require('@nestjs/common');
const {DemoController,DemoInput,examples}=require('../dist/src/modules/checks/demo.controller');
const {ChecksController}=require('../dist/src/modules/checks/checks.controller');
const input={scenario:'payment',language:'English',consent:true};
const validation=new ValidationPipe({whitelist:true,forbidNonWhitelisted:true,transform:true});
const validate=x=>validation.transform(x,{type:'body',metatype:DemoInput});
process.env.GEMINI_API_KEY='testing-placeholder';
const create=(rows=[{requests:1}])=>new DemoController({$queryRaw:async()=>rows});
test('free route rejects private text, images, unknown scenarios, languages and missing consent',async()=>{
 for(const x of [{...input,text:'Private message'},{...input,image:'private-image'},{...input,scenario:'unknown'},{...input,language:'inject'}, {...input,consent:false}]) await assert.rejects(()=>validate(x));
 assert.equal((await validate(input)).scenario,'payment');
});
test('private analysis remains disabled even if an OpenAI key exists',async()=>{
 delete process.env.AI_PROVIDER;
 process.env.OPENAI_API_KEY='testing-placeholder';
 await assert.rejects(()=>new ChecksController({}).check({text:'hello',consent:true,language:'English'}),/disabled/);
});
test('free provider receives only fixed scenario and no OpenAI authorization',async()=>{
 global.fetch=async(url,options)=>{
  const b=JSON.parse(options.body);
  assert.match(url,/gemini-3.5-flash-lite:generateContent$/);
  assert.equal(options.headers.Authorization,undefined);
  assert.equal(b.contents[0].parts[0].text,`Response language: English\nFictional scenario:\n${examples.payment.text}`);
  return {ok:true,status:200,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({risk:'HIGH',summary:'Pressure',signals:['Urgency'],actions:['Verify'],uncertainty:'Fictional example'})}]}}]})};
 };
 const r=await create().analyze(input);assert.equal(r.demo,true);assert.equal(r.provider,'Gemini');
});
test('free quota exhaustion and provider errors do not produce a fake assessment',async()=>{
 global.fetch=async()=>({ok:false,status:429});await assert.rejects(()=>create().analyze(input),/quota/);
 global.fetch=async()=>({ok:true,json:async()=>({candidates:[{finishReason:'MAX_TOKENS'}]})});await assert.rejects(()=>create().analyze(input),/reliably/);
 global.fetch=async()=>{throw Error('must not call')};await assert.rejects(()=>create([]).analyze(input),/demo limit/);
});
