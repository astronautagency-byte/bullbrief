const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const path = require('node:path');
function load(file) {
 const mod={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const req=name=>name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts')):require(name);
 new Function('require','module','exports',code)(req,mod,mod.exports);
 return mod.exports;
}
(async()=>{
 const originalWindow=global.window,originalFetch=global.fetch;
 const originalGate=process.env.BULLBRIEF_EXTERNAL_AI_ENABLED,originalKey=process.env.GROQ_API_KEY;
 try {
  const drafts=load('src/lib/privacy/transient-drafts.ts');
  delete global.window;
  drafts.transientDraftStorage.setItem('draft','server');
  assert.equal(drafts.transientDraftStorage.getItem('draft'),null);
  global.window={localStorage:{getItem(){throw Error('Persistent storage accessed');},setItem(){throw Error('Persistent storage accessed');}}};
  drafts.setDraftOwner('advisor-a');drafts.transientDraftStorage.setItem('draft','fictional');
  assert.equal(drafts.transientDraftStorage.getItem('draft'),'fictional');
  drafts.setDraftOwner('advisor-a');assert.equal(drafts.transientDraftStorage.getItem('draft'),'fictional');
  drafts.setDraftOwner('advisor-b');assert.equal(drafts.transientDraftStorage.getItem('draft'),null);
  drafts.transientDraftStorage.setItem('draft','other');drafts.clearTransientDrafts();assert.equal(drafts.transientDraftStorage.getItem('draft'),null);
  const groq=load('src/lib/providers/groq/client.ts');
  const {GeminiProvider}=load('src/lib/providers/gemini/client.ts');const gemini=new GeminiProvider('synthetic');let calls=0;
  global.fetch=async()=>{calls++;throw Error('Unexpected external call');};
  process.env.GROQ_API_KEY='synthetic-test-key';
  for(const value of [undefined,'false','TRUE','1']) {
   if(value===undefined)delete process.env.BULLBRIEF_EXTERNAL_AI_ENABLED;else process.env.BULLBRIEF_EXTERNAL_AI_ENABLED=value;
   await assert.rejects(()=>groq.groqExtractFundFactsheet('fictional PDF'),e=>e.code==='POLICY_DISABLED');
   await assert.rejects(()=>groq.groqExtractFundFactsheetImages(['synthetic']),e=>e.code==='POLICY_DISABLED');
   await assert.rejects(()=>gemini.chat('fictional'),e=>e.code==='POLICY_DISABLED');
   await assert.rejects(()=>gemini.generateBriefSummary([],[],[]),e=>e.code==='POLICY_DISABLED');
   await assert.rejects(()=>gemini.analyzeArticle({title:'fictional'}),e=>e.code==='POLICY_DISABLED');
  }
  assert.equal(calls,0);
  process.env.BULLBRIEF_EXTERNAL_AI_ENABLED='true';delete process.env.GROQ_API_KEY;
  await assert.rejects(()=>groq.groqExtractFundFactsheet('fictional'),e=>e.code==='API_KEY_MISSING');
  console.log('Privacy guards passed: no persistent draft access, account/logout isolation, SSR safety, and zero AI network calls while disabled.');
 } finally {
  if(originalWindow===undefined)delete global.window;else global.window=originalWindow;
  global.fetch=originalFetch;
  for(const [name,value] of [['BULLBRIEF_EXTERNAL_AI_ENABLED',originalGate],['GROQ_API_KEY',originalKey]]){if(value===undefined)delete process.env[name];else process.env[name]=value;}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
