import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

code = open('js/app.js', 'r', encoding='utf-8').read()

print("=== JS Guards Check ===")
checks = [
    ('try {\n      initLevelUI();\n    } catch (renderErr)', 'initLevelUI try-catch wrapper'),
    ('(W || []).filter', 'W.filter guard'),
    ('(TOPICS || []).find', 'TOPICS.find guard'),
    ('(GRAMMAR || []).map', 'GRAMMAR.map guard'),
    ('(BIGEXAM || []).sort', 'BIGEXAM.sort guard'),
    ('(q.opts || []).forEach', 'q.opts.forEach guard'),
    ('(g.rules || []).map', 'g.rules.map guard'),
    ('(STORIES || []).filter', 'STORIES.filter guard'),
    ("if (!TOPICS || !TOPICS[n - 1])", 'renderTopic TOPICS guard'),
    ('completedLessons: []', 'completedLessons initialized'),
]
all_ok = True
for pattern, label in checks:
    found = pattern in code
    all_ok = all_ok and found
    print(f'  {"[OK]" if found else "[FAIL]"} {label}')

print(f'\n=== JSON Schema Check ===')
for level in ['hsk1', 'hsk2', 'hsk3']:
    v = json.load(open(f'data/{level}/vocab.json', encoding='utf-8'))
    g = json.load(open(f'data/{level}/grammar.json', encoding='utf-8'))
    t = json.load(open(f'data/{level}/tests.json', encoding='utf-8'))
    
    w_len = len(v.get('W', []))
    w_item_len = len(v['W'][0]) if v.get('W') else 0
    g_keys = sorted(g['GRAMMAR'][0].keys()) if g.get('GRAMMAR') else []
    t_keys = sorted(t['BIGEXAM'][0].keys()) if t.get('BIGEXAM') else []
    
    w_ok = w_item_len == 5
    g_ok = 'rules' in g_keys and 'formula' in g_keys
    t_ok = 'opts' in t_keys and 'a' in t_keys
    
    status = '[OK]' if (w_ok and g_ok and t_ok) else '[FAIL]'
    print(f'  {status} {level}: W[{w_len}] items={w_item_len}elem, grammar has rules/formula: {g_ok}, tests has opts/a: {t_ok}')
    all_ok = all_ok and w_ok and g_ok and t_ok

print(f'\n{"ALL CHECKS PASSED" if all_ok else "SOME CHECKS FAILED"}')
