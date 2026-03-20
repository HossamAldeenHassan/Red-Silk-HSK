code = open('js/app.js', 'r', encoding='utf-8').read()
checks = [
    ('function fetchJSON(url)', True, 'fetchJSON helper exists'),
    ('if (!r.ok) throw new Error', True, 'HTTP status check'),
    ('_data.js', False, 'Broken JS fallback REMOVED'),
    ('let currentLevel = null;', True, 'currentLevel global'),
    ('let W = [];', True, 'W global'),
    ('if (currentLevel) {', True, 'buildContentFrames guard'),
    ('if (!TOPICS || !TOPICS.length)', True, 'TOPICS guard in renderLessons'),
    ('if (!W || !W.length) return;', True, 'W guard in updateVocabCounts'),
    ('function toggleLang() {', True, 'toggleLang function present'),
]
ok = True
for pattern, expected, label in checks:
    found = pattern in code
    passed = found == expected
    ok = ok and passed
    print(('[OK] ' if passed else '[FAIL] ') + label)
print()
print('ALL CHECKS: ' + ('PASSED' if ok else 'FAILED'))
