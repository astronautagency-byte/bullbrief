"""Run the transactional CRM checks against the configured BullBrief project; all test rows roll back."""
import json, os, pathlib, subprocess, urllib.request, urllib.error
root = pathlib.Path(__file__).resolve().parents[1]
token = os.environ.get('SUPABASE_ACCESS_TOKEN')
if not token:
    token = subprocess.check_output(['security', 'find-generic-password', '-s', 'Supabase CLI', '-w'], text=True).strip()
project = os.environ.get('BULLBRIEF_SUPABASE_PROJECT', 'jcuszkstydfddmxvaxjo')
query = (root / os.environ.get('CRM_QA_SQL', 'tests/crm-database.sql')).read_text()
request = urllib.request.Request(f'https://api.supabase.com/v1/projects/{project}/database/query', headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}, data=json.dumps({'query': query}).encode(), method='POST')
try:
    with urllib.request.urlopen(request, timeout=60) as response:
        result = json.load(response)
        assert any(row.get('status') == 'passed' for row in result), result
        print('CRM database checks passed; all test users and records rolled back.')
except urllib.error.HTTPError as error:
    print('CRM database checks failed:', error.code, error.read().decode()[:1800])
    raise SystemExit(1)
