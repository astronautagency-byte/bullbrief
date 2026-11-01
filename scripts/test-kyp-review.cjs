const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { PDFDocument } = require('pdf-lib');
function load(relative, mocks = {}) {
  const filename = path.resolve(relative);
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  const localRequire = name => {
    if (name in mocks) return mocks[name];
    if (name === 'server-only') return {};
    if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), name + '.ts'), mocks);
    return require(name);
  };
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  return module.exports;
}
(async () => {
  const model = load('src/lib/kyp-review/model.ts');
  assert.equal(model.normalizeTicker('xiu', 'CA', 'etf'), 'XIU.TO');
  assert.equal(model.normalizeTicker('GOOG', 'US', 'equity'), 'GOOG');
  assert.equal(model.normalizeTicker('ABC.NE', 'CA', 'equity'), 'ABC.NE');
  assert.equal(model.normalizeTicker('EXACT-FUND', 'CA', 'mutual-fund'), 'EXACT-FUND');
  assert.throws(() => model.normalizeTicker('https://evil.test', 'CA', 'etf'));
  assert.equal(model.metric(null, true), 'Not available');
  assert.equal(model.metric(0, true), '0.00%');
  assert.equal(model.metric(.002, true), '0.20%');
  const researchId = '11111111-1111-4111-8111-111111111111';
  const requestId = '22222222-2222-4222-8222-222222222222';
  const input = { requestId, researchId, advisorName: 'QA Advisor', firmName: 'QA Test Firm', regulatorId: '', presetIds: ['C1'], evidence: { C1: 'QA evidence only: source fee disclosure reviewed on 2026-10-30.' }, customNotes: 'QA fixture only, no investment recommendation or real client.', alternativesReason: 'QA fixture: alternatives were compared for the same test mandate.', evidenceSources: 'QA fixture evidence, not investment research.', confirmed: true };
  assert.ok(model.archiveInputSchema.safeParse(input).success);
  assert.equal(model.archiveInputSchema.safeParse({ ...input, confirmed: false }).success, false);
  assert.equal(model.archiveInputSchema.safeParse({ ...input, evidence: {} }).success, false);
  assert.equal(model.archiveInputSchema.safeParse({ ...input, presetIds: ['C1', 'C1'] }).success, false);
  assert.equal(model.archiveInputSchema.safeParse({ ...input, customNotes: '' }).success, false);
  assert.match(model.compileRationale(['C1'], input.evidence, input.customNotes), /QA evidence only/);
  const originalFetch = global.fetch;
  global.fetch = async url => {
    if (String(url).includes('fc.yahoo.com')) return new Response('', { status: 404, headers: { 'Set-Cookie': 'QA=session; Path=/' } });
    if (String(url).includes('getcrumb')) return new Response('qa-crumb');
    if (String(url).includes('quoteSummary')) return new Response('', { status: 401 });
    const symbol = decodeURIComponent(String(url).split('/chart/')[1].split('?')[0]);
    return Response.json({ chart: { result: [{ meta: { symbol, instrumentType: 'ETF', longName: 'QA fund ' + symbol, currency: 'CAD', exchangeName: 'TOR', regularMarketPrice: 42, regularMarketTime: 1793400000 } }] } });
  };
  const yahoo = load('src/lib/kyp-review/yahoo.ts');
  const research = await yahoo.researchProduct({ symbol: 'XIU', assetType: 'etf', market: 'CA' });
  assert.deepEqual(research.alternatives.map(p => p.symbol), ['XIC.TO', 'VCN.TO']);
  assert.equal(research.target.expenseRatio, null);
  assert.ok(research.target.warnings.length);
  await assert.rejects(() => yahoo.researchProduct({ symbol: 'XIU', assetType: 'equity', market: 'CA' }), /not equity/);
  await assert.rejects(() => yahoo.researchProduct({ symbol: 'XIU', assetType: 'etf', market: 'CA', alternatives: ['XIU.TO', 'XIC.TO'] }), /distinct/);
  const unavailableFetch = global.fetch;
  global.fetch = async url => String(url).includes('quoteSummary') ? Response.json({ quoteSummary: { result: [{ defaultKeyStatistics: { beta3Year: { raw: .96 } }, fundProfile: { feesExpensesInvestment: { annualReportExpenseRatio: { raw: .0018 } } }, fundPerformance: { trailingReturns: { threeYear: { raw: .2419 } } }, summaryDetail: { trailingAnnualDividendYield: { raw: 0 } } }] } }) : unavailableFetch(url);
  const completeResearch = await yahoo.researchProduct({ symbol: 'XIU', assetType: 'etf', market: 'CA' });
  assert.equal(completeResearch.target.expenseRatio, .0018);
  assert.equal(completeResearch.target.beta, .96);
  assert.equal(completeResearch.target.return3Y, .2419);
  assert.equal(completeResearch.target.dividendYield, 0, 'Reported zero must be preserved.');
  global.fetch = originalFetch;
  const { renderReviewPdf } = load('src/lib/kyp-review/pdf.ts');
  const document = JSON.stringify({ generatedAt: '2026-10-31T02:00:00.000Z', research: completeResearch, advisor: { name: 'QA Advisor', firm: 'QA Test Firm', regulatorId: '', email: 'qa@example.invalid' }, alternativesReason: input.alternativesReason, rationale: model.compileRationale(input.presetIds, input.evidence, input.customNotes) + '\n' + 'Long evidence paragraph. '.repeat(400), evidenceSources: 'https://example.invalid/' + 'x'.repeat(400) });
  const sha256 = require('node:crypto').createHash('sha256').update(document).digest('hex');
  const row = { id: requestId, owner_id: researchId, kind: 'audit', document, sha256, created_at: '2026-10-31T02:00:00Z' };
  const store = load('src/lib/kyp-review/store.ts', { '@/lib/supabase/server': {} });
  const fakeReader = documentValue => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { ...row, document: documentValue }, error: null }) }) }) }) });
  assert.equal((await store.readArchive(fakeReader(document), requestId)).id, requestId);
  await assert.rejects(() => store.readArchive(fakeReader(document + ' '), requestId), /integrity verification failed/);
  const bytes = await renderReviewPdf(row);
  const pdf = await PDFDocument.load(bytes);
  assert.ok(pdf.getPageCount() >= 3, 'Long notes should paginate.');
  assert.equal(pdf.getForm().getFields().length, 0);
  fs.mkdirSync('output/pdf', { recursive: true });
  fs.writeFileSync('output/pdf/kyp-review-qa.pdf', bytes);
  let writes = 0;
  const source = { ...row, id: researchId, kind: 'research', document: JSON.stringify({ research }) };
  const route = load('src/app/api/kyp/review/archive/route.ts', {
    '@/lib/kyp-review/model': model,
    '@/lib/kyp-review/store': {
      reviewSession: async () => ({ client: {}, user: { id: researchId, email: 'qa@example.invalid' } }),
      readArchive: async (_client, id) => id === researchId ? source : null,
      appendArchive: async (_session, id, kind, payload) => { writes++; assert.equal(kind, 'audit'); assert.equal(payload.research.target.price, 42); assert.equal(payload.advisorConfirmed, true); return { ...row, id }; },
    },
  });
  const response = await route.POST(new Request('http://localhost/api/kyp/review/archive', { method: 'POST', body: JSON.stringify({ ...input, research: { target: { price: 999 } } }) }));
  assert.equal(response.status, 201);
  assert.equal(writes, 1, 'Server must use saved evidence, ignoring injected client metrics.');
  const invalid = await route.POST(new Request('http://localhost/api/kyp/review/archive', { method: 'POST', body: JSON.stringify({ ...input, confirmed: false }) }));
  assert.equal(invalid.status, 400);
  assert.equal(writes, 1);
  const idempotent = load('src/app/api/kyp/review/archive/route.ts', {
    '@/lib/kyp-review/model': model,
    '@/lib/kyp-review/store': {
      reviewSession: async () => ({ client: {}, user: { id: researchId } }),
      readArchive: async () => row,
      appendArchive: async () => { throw Error('Repeated requests must not write another record.'); },
    },
  });
  assert.equal((await idempotent.POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify(input) }))).status, 200);
  const exportRoute = load('src/app/api/kyp/review/archive/[id]/route.ts', {
    '@/lib/kyp-review/store': { reviewSession: async () => ({ client: {} }), readArchive: async () => row },
    '@/lib/kyp-review/pdf': { renderReviewPdf },
  });
  const exported = await exportRoute.GET(new Request('http://localhost/api/kyp/review/archive/' + requestId), { params: Promise.resolve({ id: requestId }) });
  assert.equal(exported.status, 200);
  assert.equal(exported.headers.get('Content-Type'), 'application/pdf');
  assert.equal(exported.headers.get('X-Archive-SHA256'), sha256);
  assert.ok((await exported.arrayBuffer()).byteLength > 1000);
  const snapshot = await exportRoute.GET(new Request('http://localhost/api/kyp/review/archive/' + requestId + '?format=json'), { params: Promise.resolve({ id: requestId }) });
  assert.equal((await snapshot.json()).integrity, 'verified');
  const unauthorized = load('src/app/api/kyp/review/archive/route.ts', { '@/lib/kyp-review/model': model, '@/lib/kyp-review/store': { reviewSession: async () => { throw Error('AUTH_REQUIRED'); } } });
  assert.equal((await unauthorized.POST(new Request('http://localhost', { method: 'POST', body: '{}' }))).status, 401);
  console.log('KYP checks passed: normalization, missing data, peer selection, instrument mismatch, rationale evidence, server snapshot authority, unauthenticated writes, PDF pagination and no form fields.');
})().catch(e => { console.error(e); process.exit(1); });
