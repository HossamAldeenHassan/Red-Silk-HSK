import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('js/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

changes = []

# Step 1: Remove the try-catch wrapper we injected for debugging.
if code.lstrip().startswith('try {'):
    code = re.sub(r'^\s*try \{\n', '', code)
    code = re.sub(
        r'\n\} catch \(e\) \{.*?document\.body\.appendChild\(errDiv\);\n\}\n?$',
        '',
        code,
        flags=re.DOTALL
    )
    changes.append("Removed try-catch debug wrapper from app.js")

# Step 2: Guard updateVocabCounts against undefined W
orig = 'function updateVocabCounts() {\n  const total = W.length;'
fixed = 'function updateVocabCounts() {\n  if (!W || !W.length) return;\n  const total = W.length;'
if orig in code:
    code = code.replace(orig, fixed, 1)
    changes.append("Added W guard in updateVocabCounts")

# Step 3: Sync local globals with window.* assignments in loadLevel
replacements_src = [
    ("    window.W = v.W || [];",              "    window.W = W = v.W || [];"),
    ("    window.SENTS = s.SENTS || {};",       "    window.SENTS = SENTS = s.SENTS || {};"),
    ("    window.TOPICS = l.TOPICS || [];",     "    window.TOPICS = TOPICS = l.TOPICS || [];"),
    ("    window.STORIES = l.STORIES || [];",   "    window.STORIES = STORIES = l.STORIES || [];"),
    ("    window.pinyinExamples = l.pinyinExamples || {};", "    window.pinyinExamples = pinyinExamples = l.pinyinExamples || {};"),
    ("    window.DIALOGUES = d.DIALOGUES || {};","    window.DIALOGUES = DIALOGUES = d.DIALOGUES || {};"),
    ("    window.GRAMMAR = g.GRAMMAR || [];",   "    window.GRAMMAR = GRAMMAR = g.GRAMMAR || [];"),
    ("    window.BIGEXAM = t.BIGEXAM || [];",   "    window.BIGEXAM = BIGEXAM = t.BIGEXAM || [];"),
]
for old, new in replacements_src:
    if old in code:
        code = code.replace(old, new, 1)

changes.append("Synced local globals with window.* assignments in loadLevel")

# Write the final version back
with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(code)

for c in changes:
    print(f"[OK] {c}")

print(f"\nFinal app.js size: {len(code)} bytes")
