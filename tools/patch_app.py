import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Step 1: Remove the try { ... } catch block we injected for debugging.
# The match looks like: "\ntry {\n<code>\n} catch (e) { ... }"
code = re.sub(r'^\n?try \{\n', '', code)
code = re.sub(
    r'\n\} catch \(e\) \{[^}]*document\.body\.appendChild\(errDiv\);\s*\}\n?$',
    '',
    code,
    flags=re.DOTALL
)

# Also handle if it wasn't wrapped properly
# Remove try at start of file, just in case
if code.startswith('try {'):
    code = code[6:]

# Find the last catch block we added
catch_marker = "} catch (e) {"
last_idx = code.rfind(catch_marker)
if last_idx > 0:
    # If it's near the very end (within 1000 chars), remove it
    if last_idx > len(code) - 1200:
        code = code[:last_idx]

print(f"File size after cleanup: {len(code)}")

# Step 2: Find the global variables section and inject declarations there
# We'll add currentLevel, W, and the other data globals right after the existing globals block
insert_marker = 'let fcState = { topic: 0, idx: 0, flipped: false, filtered: [] };'
globals_injection = """let fcState = { topic: 0, idx: 0, flipped: false, filtered: [] };

// == Data globals — populated by loadLevel() via fetch ==
let currentLevel = null;
let W = [];
let SENTS = {};
let TOPICS = [];
let STORIES = [];
let pinyinExamples = {};
let DIALOGUES = {};
let GRAMMAR = [];
let BIGEXAM = [];"""

if insert_marker in code:
    code = code.replace(insert_marker, globals_injection, 1)
    print("Injected global declarations after fcState.")
else:
    print("Marker not found! Looking for alternative insertion point...")
    # Try inserting after the let currentTab line
    alt_marker = 'let currentTab = "home";'
    if alt_marker in code:
        code = code.replace(alt_marker, alt_marker + """

// == Data globals -- populated by loadLevel() via fetch ==
let currentLevel = null;
let W = [];
let SENTS = {};
let TOPICS = [];
let STORIES = [];
let pinyinExamples = {};
let DIALOGUES = {};
let GRAMMAR = [];
let BIGEXAM = [];""", 1)
        print("Injected via fallback marker.")
    else:
        print("Could not find insertion point!")

# Step 3: Fix updateVocabCounts to guard W
old_update = 'function updateVocabCounts() {\n  const total = W.length;'
new_update = 'function updateVocabCounts() {\n  if (!W || !W.length) return;\n  const total = W.length;'
if old_update in code:
    code = code.replace(old_update, new_update, 1)
    print("✅ Added W guard in updateVocabCounts.")
else:
    print("⚠️  updateVocabCounts pattern not exactly matched — trying regex...")
    code = re.sub(
        r'(function updateVocabCounts\(\) \{)\s*\n(\s*const total = W\.length;)',
        r'\1\n  if (!W || !W.length) return;\n\2',
        code
    )
    print("✅ Applied regex guard to updateVocabCounts.")

# Step 4: In loadLevel's Promise.all handler, update the global variables (not just window.*)
# Ensure window.W and the global W are both set.
old_set = "    window.W = v.W || [];"
new_set = "    window.W = W = v.W || [];"
if old_set in code:
    code = code.replace(old_set, new_set, 1)

old_sents = "    window.SENTS = s.SENTS || {};"
new_sents = "    window.SENTS = SENTS = s.SENTS || {};"
if old_sents in code:
    code = code.replace(old_sents, new_sents, 1)

old_topics = "    window.TOPICS = l.TOPICS || [];"
new_topics = "    window.TOPICS = TOPICS = l.TOPICS || [];"
if old_topics in code:
    code = code.replace(old_topics, new_topics, 1)

old_stories = "    window.STORIES = l.STORIES || [];"
new_stories = "    window.STORIES = STORIES = l.STORIES || [];"
if old_stories in code:
    code = code.replace(old_stories, new_stories, 1)

old_pinyin = "    window.pinyinExamples = l.pinyinExamples || {};"
new_pinyin = "    window.pinyinExamples = pinyinExamples = l.pinyinExamples || {};"
if old_pinyin in code:
    code = code.replace(old_pinyin, new_pinyin, 1)

old_dialogues = "    window.DIALOGUES = d.DIALOGUES || {};"
new_dialogues = "    window.DIALOGUES = DIALOGUES = d.DIALOGUES || {};"
if old_dialogues in code:
    code = code.replace(old_dialogues, new_dialogues, 1)

old_grammar = "    window.GRAMMAR = g.GRAMMAR || [];"
new_grammar = "    window.GRAMMAR = GRAMMAR = g.GRAMMAR || [];"
if old_grammar in code:
    code = code.replace(old_grammar, new_grammar, 1)

old_bigexam = "    window.BIGEXAM = t.BIGEXAM || [];"
new_bigexam = "    window.BIGEXAM = BIGEXAM = t.BIGEXAM || [];"
if old_bigexam in code:
    code = code.replace(old_bigexam, new_bigexam, 1)

print("✅ Synced local globals with window.* assignments.")

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print(f"\n✅ app.js patched successfully! Final size: {len(code)} bytes")
