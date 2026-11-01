const fs = require('node:fs'); const path = require('node:path'); const assert = require('node:assert/strict'); const ts = require('typescript');
function load(file, mocks = {}) {
 file = path.resolve(file); const module = { exports: {} };
 const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
 const req = name => name in mocks ? mocks[name] : name === 'server-only' ? {} : name.startsWith('@/') ? load('src/' + name.slice(2) + '.ts', mocks) : name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts'), mocks) : require(name);
 new Function('require', 'module', 'exports', code)(req, module, module.exports); return module.exports;
}
(async()=>{
 const cal=load('src/lib/crm/calendar.ts');
 const m=load('src/lib/crm/schedule.ts'),uid='11111111-1111-4111-8111-111111111111';
 const data={household_id:uid,owner_id:uid,title:'Fictional meeting',meeting_type:'annual_review',starts_at:'2026-10-31T14:00:00Z',ends_at:'2026-10-31T14:45:00Z',location:'Demo boardroom',join_url:'',agenda:'Fictional agenda'};
 const body={firmId:uid,requestId:uid,action:'appointment.create',data};
 assert(m.scheduleActionSchema.safeParse(body).success);
 for(const bad of [{ends_at:data.starts_at},{ends_at:'2026-11-01T14:00:00Z'},{join_url:'javascript:alert(1)'},{join_url:'https://user:pass@example.com'}])assert(!m.scheduleActionSchema.safeParse({...body,data:{...data,...bad}}).success);
 assert.equal(m.torontoDate('2026-11-01T03:30:00Z'),'2026-10-31');
 assert.equal(cal.calendarDays('2026-11-15','month').length,42);assert.equal(cal.calendarDays('2026-10-31','week')[0],'2026-10-25');assert.equal(cal.monthShift('2026-01-31',1),'2026-02-28');assert.equal(cal.monthShift('2028-01-31',1),'2028-02-29');
 const ranges=cal.calendarRequests('2026-11-15','month');assert.equal(ranges.length,2);assert.equal(ranges[0].to,ranges[1].from);assert(ranges.every(r=>Date.parse(r.to)-Date.parse(r.from)<=32*86400000));
 assert.equal(cal.torontoInstant('2026-11-02T11:00'),'2026-11-02T16:00:00.000Z');assert.equal(cal.torontoInstant('2026-07-02T11:00'),'2026-07-02T15:00:00.000Z');assert.throws(()=>cal.torontoInstant('2026-03-08T02:30'),/does not exist/);assert.equal(cal.torontoInstant('2026-11-01T01:30'),'2026-11-01T05:30:00.000Z');assert.throws(()=>cal.torontoInstant('2026-02-30T11:00'));
 const cross={...data,id:uid,status:'scheduled',starts_at:'2026-11-03T04:30:00Z',ends_at:'2026-11-03T05:30:00Z'};assert.equal(cal.dayEvents([cross],'2026-11-02').length,1);assert.equal(cal.dayEvents([cross],'2026-11-03').length,1);const layout=cal.eventLayout([cross,{...cross,id:'other'}],'2026-11-02');assert.equal(layout[0].lanes,2);assert.notEqual(layout[0].lane,layout[1].lane);

 const ics=m.calendarText({...data,id:uid,status:'scheduled',title:'Fictional\nBEGIN:BAD',agenda:'É'.repeat(100)});
 assert(ics.includes('SUMMARY:Fictional\\nBEGIN:BAD'));assert(!ics.includes('\r\nBEGIN:BAD'));
 assert(ics.split('\r\n').every(line=>Buffer.byteLength(line,'utf8')<=75));
 let calls=[];const server=load('src/lib/crm/server.ts',{'@/lib/kyp-review/store':{reviewSession:async()=>({user:{id:uid}})},'@/lib/kyp-simulation/store':{simulationWriter:()=>({rpc:async(name,args)=>{calls.push({name,args});return{data:{id:uid},error:null}}})}});
 const route=load('src/app/api/crm/schedule/route.ts',{'@/lib/crm/server':server});
 const req=(v,origin='http://localhost:3000')=>new Request('http://localhost:3000/api/crm/schedule',{method:'POST',headers:{origin},body:JSON.stringify(v)});
 assert.equal((await route.POST(req(body,'https://evil.test'))).status,403);assert.equal(calls.length,0);
 assert.equal((await route.POST(req({...body,p_actor:'attacker'}))).status,200);assert.equal(calls[0].args.p_actor,uid);
 const filters=[];const client={from:table=>{const query={select:()=>query,eq:(key,value)=>{filters.push({table,key,value});return query;},gte:()=>query,lt:()=>query,order:()=>query,limit:()=>query,maybeSingle:async()=>({data:{role:'advisor'},error:null}),then:resolve=>resolve({data:[],count:0,error:null})};return query;}};
 const reader=load('src/app/api/crm/schedule/route.ts',{'@/lib/crm/server':{...server,crmSession:async()=>({user:{id:uid},client})}});
 const query=`firmId=${uid}&householdId=${uid}&from=2026-10-31T00:00:00Z&to=2026-11-30T00:00:00Z`;
 assert.equal((await reader.GET(new Request('http://localhost:3000/api/crm/schedule?'+query))).status,200);assert(filters.some(f=>f.table==='crm_appointments'&&f.key==='household_id'&&f.value===uid));assert(filters.some(f=>f.table==='crm_members'&&f.key==='user_id'&&f.value===uid));
 assert.equal((await reader.GET(new Request('http://localhost:3000/api/crm/schedule?'+query.replace('householdId='+uid,'householdId=invalid')))).status,400);
 console.log('Schedule checks passed: durations, safe meeting URLs, Toronto dates, ICS escaping and byte folding, origin checks and authenticated actor binding.');
})().catch(e=>{console.error(e);process.exit(1)});
