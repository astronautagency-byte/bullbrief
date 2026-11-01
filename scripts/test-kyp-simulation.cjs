const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path'); const ts = require('typescript');
function load(filename, mocks = {}) {
  filename = path.resolve(filename);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  const localRequire = name => {
    if (name in mocks) return mocks[name];
    if (name === 'server-only') return {};
    if (name.startsWith('@/')) return load('src/' + name.slice(2) + '.ts', mocks);
    if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), name + '.ts'), mocks);
    return require(name);
  };
  new Function('require', 'module', 'exports', source)(localRequire, module, module.exports); return module.exports;
}
(async () => {
  const { TOP_HOLDINGS } = load('src/lib/kyp-top-holdings.ts');
  const model = load('src/lib/kyp-simulation/model.ts');
  const templates = load('src/lib/kyp-simulation/templates.ts');
  const rows = TOP_HOLDINGS.map(templates.baseSimulationRow);
  assert.equal(rows.length, 20);
  assert.equal(rows.reduce((n, r) => n + Object.keys(r.notes).length, 0), 220);
  assert.equal(rows[0].candidateSymbol, 'GOOG');
  assert.equal(rows[18].candidateSymbol, 'MSFT.NE');
  assert.notEqual(rows[18].candidateSymbol, 'MSFT');
  assert.equal(rows.find(r => r.holding.portfolioHolding.identifier === 'DYN3361').identity, 'unresolved');
  assert.equal(rows.find(r => r.holding.portfolioHolding.identifier === 'MIP809').pattern, 'savings');
  assert.equal(rows.find(r => r.holding.portfolioHolding.identifier === 'NPP1017').pattern, 'private-credit');
  for (const row of rows) {
    assert.ok(model.notesSchema.safeParse(row.notes).success);
    assert.match(row.notes.evidenceSources, /currency is unspecified/i);
    assert.match(row.notes.rationale, /not an individual client's allocation/);
    assert.match(row.notes.conflicts, /review pending/);
    assert.equal(row.generation, 'template');
    assert.ok(!/I reviewed|I recommend|suitable for the client/i.test(Object.values(row.notes).join(' ')));
  }
  const equity = rows[0];
  equity.research = { symbol: 'GOOG', type: 'equity', name: 'Alphabet Class C', currency: 'USD', expenseRatio: .0999, beta: 999, retrievedAt: '2026-10-30T00:00:00Z', sourceUrl: 'https://example.invalid/GOOG' };
  const provisional = templates.buildTemplateNotes(equity);
  assert.ok(!JSON.stringify(provisional).includes('9.99%'), 'Candidate facts must not flow into source notes.');
  assert.ok(!provisional.risk.includes('999'), 'Candidate beta must be excluded.');
  equity.identity = 'matched';
  const matched = templates.buildTemplateNotes(equity);
  assert.match(matched.structure, /Alphabet Class C/);
  assert.match(matched.costs, /fund expense ratio is not applicable/);
  const quality = load('src/lib/kyp-simulation/quality.ts');
  const unsafe = { ...equity.notes, rationale: 'Alphabet offers a high-growth technology exposure with strong cash flow.', costs: 'The fee is 5.55%.', conflicts: 'We reviewed all conflicts and will confirm the details.' };
  const checked = quality.guardAiNotes(equity, unsafe);
  assert.ok(checked.fallback.includes('rationale')); assert.ok(checked.fallback.includes('costs')); assert.ok(checked.fallback.includes('conflicts'));
  assert.equal(checked.notes.rationale, equity.templateNotes.rationale);
  const relativeCost = quality.guardAiNotes({ ...equity, research: { ...equity.research, expenseRatio: null } }, { ...equity.notes, rationale: 'The stock provides growth exposure compared with lower-cost index alternatives.' });
  assert.ok(relativeCost.fallback.includes('rationale'));
  const safe = quality.guardAiNotes(equity, { ...equity.notes, risk: 'Review whether the issuer has strong cash flow using dated financial statements.' });
  assert.ok(safe.fallback.includes('risk'), 'Without issuer risk disclosure, preserve the source-based risk checklist.');
  const unresolved = { ...equity, identity: 'candidate' };
  const clientClaim = quality.guardAiNotes(unresolved, { ...equity.notes, rationale: 'Its suitability hinges on whether the client seeks direct stock exposure.' });
  assert.ok(clientClaim.fallback.includes('rationale'));
  const sourceOnlyRecheck = quality.guardAiNotes({ ...equity, sectionOrigins: Object.fromEntries(model.sectionKeys.map(k => [k, 'template'])) }, equity.templateNotes, true);
  assert.equal(sourceOnlyRecheck.fallback.length, 0, 'Source templates must not be reclassified as AI claims.');
  const profile = { id: '33333333-3333-4333-8333-333333333333', name: 'QA style', version: 1, rules: ['Use concise source-aware product notes.'], examples: [{ assetType: 'fund', note: 'Fund-only style example must be excluded for direct equity.' }, { assetType: 'equity', note: 'Keep issuer evidence separate from the proposed monitoring plan.' }], approved: true };
  let sent;
  const ai = load('src/lib/kyp-simulation/ai.ts', { '@/lib/providers/groq/client': { groqDraftSimulationNotes: async context => { sent = context; return Object.fromEntries(model.sectionKeys.map(k => [k, 'QA draft: product evidence requires advisor review before a recommendation.'])); } } });
  const context = ai.publicDraftContext(equity, profile);
  assert.equal(context.examples.length, 1);
  const serialized = JSON.stringify(context);
  for (const key of ['marketValue', 'clientCount', 'assetsPercent', 'tradeQuantity', 'portfolioHolding']) assert.ok(!serialized.includes(key), `Private field excluded: ${key}`);
  assert.ok(!serialized.includes('5883571'));
  equity.identity = 'candidate';
  assert.equal(ai.publicDraftContext(equity, null).productEvidence, null);
  await ai.draftSimulationRow(equity, profile);
  assert.equal(equity.generation, 'ai');
  assert.equal(equity.aiProfile.id, profile.id);
  assert.equal(sent.identity, 'candidate');
  assert.match(equity.notes.evidenceSources, /not a completed or approved KYP/);
  assert.ok(!model.patternInputSchema.safeParse({ name: 'QA', rules: ['Concise writing.'], examples: [], approved: false }).success);
  const bridge = load('src/lib/kyp-simulation/bridge.ts');
  const initial = { id: 'qa-run', rows };
  const imported = bridge.planKypDraftFill(initial, [], {});
  assert.equal(imported.holdings.length, 20); assert.equal(imported.filled, 220);
  const first = rows[0].holding.id;
  imported.drafts[first].risk = 'Human risk assessment: preserve this manual judgment.';
  const regenerated = bridge.planKypDraftFill(initial, imported.holdings, imported.drafts);
  assert.equal(regenerated.drafts[first].risk, 'Human risk assessment: preserve this manual judgment.');
  assert.equal(regenerated.holdings.length, 20); assert.equal(regenerated.filled, 0); assert.equal(regenerated.refreshed, 219);
  imported.drafts[first].completed = true;
  const protectedReview = bridge.planKypDraftFill(initial, imported.holdings, imported.drafts);
  assert.equal(protectedReview.skippedCompleted, 1); assert.equal(protectedReview.drafts[first].completed, true);
  const runId = '11111111-1111-4111-8111-111111111111';
  const run = { id: runId, version: 2, rows };
  let writes = 0;
  const patch = load('src/app/api/kyp/simulation/[id]/route.ts', {
    '@/lib/kyp-review/store': { reviewSession: async () => ({ client: {}, user: { id: 'qa' } }) },
    '@/lib/kyp-simulation/store': { getRun: async () => run, saveRun: async () => { writes++; } },
  });
  const contextArgs = { params: Promise.resolve({ id: runId }) };
  const stale = await patch.PATCH(new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({ holdingId: equity.holding.id, version: 1, notes: equity.notes }) }), contextArgs);
  assert.equal(stale.status, 409); assert.equal(writes, 0);
  const current = await patch.PATCH(new Request('http://localhost', { method: 'PATCH', body: JSON.stringify({ holdingId: equity.holding.id, version: 2, notes: equity.notes }) }), contextArgs);
  assert.equal(current.status, 200); assert.equal(writes, 1); assert.equal(equity.generation, 'advisor');
  const denied = load('src/app/api/kyp/simulation/[id]/route.ts', { '@/lib/kyp-review/store': { reviewSession: async () => { throw Error('AUTH_REQUIRED'); } } });
  assert.equal((await denied.PATCH(new Request('http://localhost', { method: 'PATCH', body: '{}' }), contextArgs)).status, 401);
  const patternRequest = { name: 'QA pattern', rules: ['Use concise, dated product evidence.'], examples: [], approved: true };
  let savedPattern;
  const patternRoute = load('src/app/api/kyp/note-patterns/route.ts', {
    '@/lib/kyp-review/store': { reviewSession: async () => ({ client: {}, user: { id: 'qa-owner' } }) },
    '@/lib/kyp-simulation/store': {
      getPatterns: async () => [{ name: 'QA pattern', version: 1 }],
      simulationWriter: () => ({ from: () => ({ insert: value => { savedPattern = value; return { select: () => ({ single: async () => ({ data: { created_at: '2026-10-30T00:00:00Z' }, error: null }) }) }; } }) }),
    },
  });
  assert.equal((await patternRoute.POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ ...patternRequest, approved: false }) }))).status, 400);
  assert.equal((await patternRoute.POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify(patternRequest) }))).status, 201);
  assert.equal(savedPattern.owner_id, 'qa-owner'); assert.equal(savedPattern.version, 2);
  let learns = 0;
  const learnRoute = load('src/app/api/kyp/note-patterns/learn/route.ts', {
    '@/lib/kyp-review/store': { reviewSession: async () => ({}) },
    '@/lib/providers/groq/client': { groqLearnNoteStyle: async () => { learns++; return { rules: ['Use plain language.', 'Name dated sources.', 'Separate evidence from judgment.', 'Record missing facts clearly.'] }; } },
  });
  const example = { examples: [{ assetType: 'any', note: 'QA synthetic example: cite product evidence and list unresolved questions separately.' }], approvedForAi: true };
  assert.equal((await learnRoute.POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ ...example, approvedForAi: false }) }))).status, 400);
  const learned = await learnRoute.POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify(example) }));
  assert.equal(learned.status, 200); assert.equal(learns, 1);
  assert.equal((await learned.json()).status, 'suggested_rules_require_approval');
  console.log('Simulation checks passed: 20 holdings/220 sections, exact GOOG/CDR candidates, fund gaps, source separation, AI data minimization, approved patterns, optimistic locking and authenticated editing.');
})().catch(e => { console.error(e); process.exit(1); });
