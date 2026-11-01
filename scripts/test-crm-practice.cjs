const fs = require('node:fs'); const path = require('node:path'); const assert = require('node:assert/strict'); const ts = require('typescript');
function load(file, mocks = {}) {
 file = path.resolve(file); const module = { exports: {} };
 const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
 const req = name => name in mocks ? mocks[name] : name === 'server-only' ? {} : name.startsWith('@/') ? load('src/' + name.slice(2) + '.ts', mocks) : name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts'), mocks) : require(name);
 new Function('require', 'module', 'exports', code)(req, module, module.exports); return module.exports;
}
(async()=>{
 const {practiceActionSchema:s}=load('src/lib/crm/practice.ts');
 const uid='11111111-1111-4111-8111-111111111111';
 const envelope={firmId:uid,requestId:uid};
 const template={name:'QA workflow',description:'Synthetic only',steps:[{title:'Step one',details:'Verify source',days:0},{title:'Step two',details:'Record outcome',days:3}]};
 assert(s.safeParse({...envelope,action:'template.create',data:template}).success);
 assert(!s.safeParse({...envelope,action:'template.create',data:{...template,steps:[{...template.steps[0],days:4},template.steps[1]]}}).success);
 const opportunity={household_id:uid,title:'QA estimate',stage:'proposal',owner_id:uid,potential_assets:25000,currency:'CAD',expected_close:'2026-11-30',notes:'Fictional fixture'};
 assert(s.safeParse({...envelope,action:'opportunity.create',data:opportunity}).success);
 for(const change of [{currency:'AUD'},{potential_assets:-1},{expected_close:'2026-02-31'},{stage:'funded'}])assert(!s.safeParse({...envelope,action:'opportunity.create',data:{...opportunity,...change}}).success);
 let calls=[];
 const server=load('src/lib/crm/server.ts',{'@/lib/kyp-review/store':{reviewSession:async()=>({user:{id:uid}})},'@/lib/kyp-simulation/store':{simulationWriter:()=>({rpc:async(name,args)=>{calls.push({name,args});return{data:{id:uid},error:null};}})}});
 const route=load('src/app/api/crm/practice/route.ts',{'@/lib/crm/server':server});
 const request=(body,origin='http://localhost:3000')=>new Request('http://localhost:3000/api/crm/practice',{method:'POST',headers:{origin},body:JSON.stringify(body)});
 const body={...envelope,action:'opportunity.create',data:opportunity,p_actor:'attacker'};
 assert.equal((await route.POST(request(body,'https://evil.test'))).status,403);assert.equal(calls.length,0);
 assert.equal((await route.POST(request(body))).status,200);assert.equal(calls[0].args.p_actor,uid);assert.equal(calls[0].name,'crm_practice_dispatch');
 console.log('Practice checks passed: ordered templates, bounded estimates, currency, valid dates, authenticated actor binding and origin checks.');
})().catch(e=>{console.error(e);process.exit(1)});
