const fs = require('node:fs'); const path = require('node:path'); const assert = require('node:assert/strict'); const ts = require('typescript');
function load(file, mocks = {}) {
 file = path.resolve(file); const module = { exports: {} };
 const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
 const req = name => name in mocks ? mocks[name] : name === 'server-only' ? {} : name.startsWith('@/') ? load('src/' + name.slice(2) + '.ts', mocks) : name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts'), mocks) : require(name);
 new Function('require', 'module', 'exports', code)(req, module, module.exports); return module.exports;
}
(async () => {
 const m = load('src/lib/crm/import.ts');
 assert.deepEqual(m.parseCsv('\uFEFFa,b\r\n"one, two","line\nnext"\r\n"a""b",c'), [['a','b'],['one, two','line\nnext'],['a"b','c']]);
 for (const bad of ['a,b\n"unclosed,x', 'a,b\n"closed"junk,x', 'a,b\nx"q,y']) assert.throws(() => m.parseCsv(bad));
 const header = m.importTemplate('households');
 const csv = header + 'fixture-1,"Fictional, import household",prospect,Core,Taylor,Example,taylor@example.invalid,\r\n';
 assert.equal(m.prepareImport('households', csv)[0].name, 'Fictional, import household');
 assert.throws(() => m.prepareImport('households', csv + csv.split('\r\n')[1]), /duplicate external ID/);
 assert.throws(() => m.prepareImport('households', csv.replace('taylor@example.invalid','invalid-email')), /email/);
 assert.throws(() => m.prepareImport('households', header.replace('external_id','name')+'x,x,prospect,Core,,,,\n'), /template/);
 assert.throws(() => m.prepareImport('households', header+Array.from({length:201},(_,i)=>`id${i},Household ${i},prospect,Core,,,,`).join('\n')), /200/);
 const uid='11111111-1111-4111-8111-111111111111';
 const a = m.importTemplate('accounts') + `acct-fixture,${uid},Fictional Bank,TFSA,1234,CAD,12345.67,2026-10-30`;
 assert.equal(m.prepareImport('accounts', a)[0].currency,'CAD');
 for (const [from,to] of [['2026-10-30','2026-02-31'],['1234,CAD','12345678,CAD'],['12345.67','1e5'],['2026-10-30','']]) assert.throws(() => m.prepareImport('accounts',a.replace(from,to)));
 let calls=[];
 const server=load('src/lib/crm/server.ts',{'@/lib/kyp-review/store':{reviewSession:async()=>({user:{id:uid}})},'@/lib/kyp-simulation/store':{simulationWriter:()=>({rpc:async(name,args)=>{calls.push({name,args});return {data:{},error:null};}})}});
 const route=load('src/app/api/crm/import/route.ts',{'@/lib/crm/server':server});
 const body={firmId:uid,requestId:uid,kind:'households',csv,leadId:uid,commit:false,p_actor:'attacker'};
 const request=(value,origin='http://localhost:3000')=>new Request('http://localhost:3000/api/crm/import',{method:'POST',headers:{origin},body:JSON.stringify(value)});
 assert.equal((await route.POST(request(body,'https://evil.test'))).status,403);
 assert.equal(calls.length,0);
 assert.equal((await route.POST(request({...body,commit:true}))).status,400);
 assert.equal((await route.POST(request(body))).status,200);
 assert.equal(calls[0].args.p_actor,uid); assert.equal(calls[0].name,'crm_import'); assert.equal(calls[0].args.p_commit,false);
 assert.equal((await route.POST(request({...body,csv:'not,a,template'}))).status,400);
 console.log('CSV import checks passed: quoted CSV, strict headers, row limits, duplicate keys, dates, balance formats, masked digits, origin and actor binding, mandatory preview.');
})().catch(e=>{console.error(e);process.exit(1);});
