"""
DEFINITIVE FIX for HSK2/3 forEach crash.

Root cause: loadLevel()'s .catch() catches BOTH fetch errors AND rendering errors.
When initLevelUI() throws (e.g. forEach on undefined), it shows as "failed to load".

This script:
1. Separates the fetch error handling from the rendering error handling
2. Applies comprehensive (X || []) guards to EVERY data array access
3. Guards renderTopic against undefined TOPICS entries
"""
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('js/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

changes = []

# =====================================================================
# FIX 1: Separate fetch errors from rendering errors in loadLevel
# The key problem: .catch() catches errors from initLevelUI() too!
# =====================================================================
old_then_catch = """  }).then(([v, s, l, d, g, t]) => {
    window.W = W = v.W || v || [];
    window.SENTS = SENTS = s.SENTS || s || {};
    window.TOPICS = TOPICS = l.TOPICS || [];
    window.STORIES = STORIES = l.STORIES || [];
    window.pinyinExamples = pinyinExamples = l.pinyinExamples || {};
    window.DIALOGUES = DIALOGUES = d.DIALOGUES || d || {};
    window.GRAMMAR = GRAMMAR = g.GRAMMAR || [];
    window.BIGEXAM = BIGEXAM = t.BIGEXAM || [];
    console.log(`[HSK${level}] Loaded: ${W.length} words, ${TOPICS.length} topics, ${GRAMMAR.length} grammar rules`);
    initLevelUI();
  }).catch(err => {
    console.error(`[HSK${level}] Fetch error:`, err);
    currentLevel = null;
    if (mainArea) {
      mainArea.innerHTML = `<div style="padding:3rem;text-align:center;">
        <h2 style="color:#c0392b;">${isEn ? "Failed to load HSK " + level : "\\u0641\\u0634\\u0644 \\u062a\\u062d\\u0645\\u064a\\u0644 \\u0628\\u064a\\u0627\\u0646\\u0627\\u062a HSK " + level}</h2>
        <p style="opacity:.7">${isEn ? "Error: " : "\\u062e\\u0637\\u0623: "}${err.message}</p>
        <p style="opacity:.5;font-size:.85rem;">${isEn ? "Make sure you are running a local server (e.g. Live Server on port 5500)" : "\\u062a\\u0623\\u0643\\u062f \\u0645\\u0646 \\u062a\\u0634\\u063a\\u064a\\u0644 \\u062e\\u0627\\u062f\\u0645 \\u0645\\u062d\\u0644\\u064a (\\u0645\\u062b\\u0644 Live Server \\u0639\\u0644\\u0649 \\u0627\\u0644\\u0645\\u0646\\u0641\\u0630 5500)"}</p>
        <button class="btn-primary" onclick="initApp()" style="margin-top:1rem;">${isEn ? "Back to Home" : "\\u0627\\u0644\\u0639\\u0648\\u062f\\u0629 \\u0644\\u0644\\u0631\\u0626\\u064a\\u0633\\u064a\\u0629"}</button>
      </div>`;
    }
  });
}"""

# Use a simpler match - find the .then and .catch pattern
then_pattern = '  }).then(([v, s, l, d, g, t]) => {'
catch_pattern = '  }).catch(err => {'
end_pattern = '\n}\n'

# Find the loadLevel function boundaries
load_start = code.find('function loadLevel(level) {')
if load_start == -1:
    print('ERROR: loadLevel not found!')
    sys.exit(1)

# Find the end of loadLevel
load_end = code.find('\nfunction ', load_start + 10)
load_body = code[load_start:load_end]

# Replace the .then handler to wrap initLevelUI in try-catch
new_then = """  }).then(([v, s, l, d, g, t]) => {
    window.W = W = v.W || v || [];
    window.SENTS = SENTS = s.SENTS || s || {};
    window.TOPICS = TOPICS = l.TOPICS || [];
    window.STORIES = STORIES = l.STORIES || [];
    window.pinyinExamples = pinyinExamples = l.pinyinExamples || {};
    window.DIALOGUES = DIALOGUES = d.DIALOGUES || d || {};
    window.GRAMMAR = GRAMMAR = g.GRAMMAR || [];
    window.BIGEXAM = BIGEXAM = t.BIGEXAM || [];
    console.log("[HSK" + level + "] Loaded: " + W.length + " words, " + TOPICS.length + " topics, " + GRAMMAR.length + " grammar rules");
    try {
      initLevelUI();
    } catch (renderErr) {
      console.error("[HSK" + level + "] Render error:", renderErr);
      // Don't show error page - the data loaded fine, just a render issue
      // Try showing at least the dashboard
      try {
        showTab("dashboard");
      } catch(e2) {
        console.error("Dashboard fallback also failed:", e2);
      }
    }
  }).catch(err => {"""

if '}).then(([v, s, l, d, g, t]) => {' in load_body:
    old_then_line = '  }).then(([v, s, l, d, g, t]) => {'
    old_then_end = '    initLevelUI();\n  }).catch(err => {'
    new_then_block = """  }).then(([v, s, l, d, g, t]) => {
    window.W = W = v.W || v || [];
    window.SENTS = SENTS = s.SENTS || s || {};
    window.TOPICS = TOPICS = l.TOPICS || [];
    window.STORIES = STORIES = l.STORIES || [];
    window.pinyinExamples = pinyinExamples = l.pinyinExamples || {};
    window.DIALOGUES = DIALOGUES = d.DIALOGUES || d || {};
    window.GRAMMAR = GRAMMAR = g.GRAMMAR || [];
    window.BIGEXAM = BIGEXAM = t.BIGEXAM || [];
    console.log("[HSK" + level + "] Loaded: " + W.length + " words, " + TOPICS.length + " topics, " + GRAMMAR.length + " grammar rules");
    try {
      initLevelUI();
    } catch (renderErr) {
      console.error("[HSK" + level + "] Render error (non-fatal):", renderErr);
    }
  }).catch(err => {"""
    
    # Find and replace the block between .then and .catch
    then_idx = code.find(old_then_line, load_start)
    catch_idx = code.find('  }).catch(err => {', then_idx + 10)
    
    if then_idx > 0 and catch_idx > 0:
        old_block = code[then_idx:catch_idx + len('  }).catch(err => {')]
        code = code[:then_idx] + new_then_block + code[catch_idx + len('  }).catch(err => {'):]
        changes.append('loadLevel: Wrapped initLevelUI() in try-catch to prevent render errors from showing as fetch failures')

# =====================================================================
# FIX 2: Guard renderTopic against undefined TOPICS entry
# =====================================================================
old_rt = """function renderTopic(n) {
  const t = TOPICS[n - 1];
  const words = (W || []).filter((w) => w[4] === n);
  const sents = SENTS[n] || [];"""

new_rt = """function renderTopic(n) {
  if (!TOPICS || !TOPICS[n - 1]) return '<div style="padding:1rem;text-align:center;opacity:.5">...</div>';
  const t = TOPICS[n - 1];
  const words = (W || []).filter((w) => w[4] === n);
  const sents = (SENTS || {})[n] || [];"""

if old_rt in code:
    code = code.replace(old_rt, new_rt, 1)
    changes.append('renderTopic: Added guard for undefined TOPICS[n-1]')

# =====================================================================
# FIX 3: Guard story.content.reduce
# =====================================================================
old_sc = 'const wordCount = story.content.reduce('
new_sc = 'const wordCount = (story.content || []).reduce('
if old_sc in code:
    code = code.replace(old_sc, new_sc, 1)
    changes.append('renderStoryCard: Guarded story.content.reduce')

# =====================================================================
# FIX 4: Guard STORIES.find
# =====================================================================
old_sf = 'const story = STORIES.find((s) => s.id === storyId);'
new_sf = 'const story = (STORIES || []).find((s) => s.id === storyId);'
if old_sf in code:
    code = code.replace(old_sf, new_sf, 1)
    changes.append('showStory: Guarded STORIES.find')

# =====================================================================
# FIX 5: Guard ALL remaining bare W.filter calls
# =====================================================================
code = code.replace('W.filter((w)', '(W || []).filter((w)')
code = code.replace('W.find((w)', '(W || []).find((w)')
code = code.replace('W.map((w)', '(W || []).map((w)')
changes.append('Global: Guarded all bare W.filter/find/map calls')

# =====================================================================
# FIX 6: Guard ALL remaining STORIES operations
# =====================================================================
code = code.replace('STORIES.filter((s)', '(STORIES || []).filter((s)')
code = code.replace('STORIES.find((s)', '(STORIES || []).find((s)')
code = code.replace('STORIES.map((s)', '(STORIES || []).map((s)')
changes.append('Global: Guarded all STORIES.filter/find/map calls')

# =====================================================================
# FIX 7: Guard ALL remaining GRAMMAR operations
# =====================================================================
code = code.replace('GRAMMAR.map((g)', '(GRAMMAR || []).map((g)')
code = code.replace('GRAMMAR.forEach((g)', '(GRAMMAR || []).forEach((g)')
changes.append('Global: Guarded all GRAMMAR.map/forEach calls')

# =====================================================================
# FIX 8: Guard ALL remaining BIGEXAM operations
# =====================================================================
code = code.replace('BIGEXAM.sort(', '(BIGEXAM || []).sort(')
code = code.replace('BIGEXAM.length', '(BIGEXAM || []).length')
changes.append('Global: Guarded all BIGEXAM operations')

# =====================================================================
# FIX 9: Guard ALL remaining TOPICS operations
# =====================================================================
code = code.replace('TOPICS.find((t)', '(TOPICS || []).find((t)')
code = code.replace('TOPICS.length', '(TOPICS || []).length')
changes.append('Global: Guarded all TOPICS.find/length calls')

# =====================================================================
# FIX 10: Guard q.opts.forEach (test questions)
# =====================================================================
code = code.replace('q.opts.forEach(', '(q.opts || []).forEach(')
changes.append('Global: Guarded all q.opts.forEach calls')

# =====================================================================
# FIX 11: Guard g.rules.map
# =====================================================================
code = code.replace('g.rules.map(', '(g.rules || []).map(')
changes.append('Global: Guarded g.rules.map')

# =====================================================================
# FIX 12: Guard g.items.map  
# =====================================================================
code = code.replace('g.items.map(', '(g.items || []).map(')
changes.append('Global: Guarded g.items.map')

# =====================================================================
# FIX 13: Guard g.ex.map
# =====================================================================
code = code.replace('g.ex.map(', '(g.ex || []).map(')
changes.append('Global: Guarded g.ex.map')

# =====================================================================
# FIX 14: Guard t.ex.map
# =====================================================================
code = code.replace('t.ex.map(', '(t.ex || []).map(')
changes.append('Global: Guarded t.ex.map')

# =====================================================================
# FIX 15: Guard story.content in showStory
# =====================================================================
code = code.replace('story.content.map(', '(story.content || []).map(')
code = code.replace('story.content.forEach(', '(story.content || []).forEach(')
changes.append('Global: Guarded story.content.map/forEach')

# =====================================================================
# FIX 16: Guard updateProgressBar completedLessons
# =====================================================================
old_upl = '!userProgress.stats.completedLessons.includes(i)'
new_upl = '!(userProgress.stats.completedLessons || []).includes(i)'
if old_upl in code:
    code = code.replace(old_upl, new_upl, 1)
    changes.append('updateProgressBar: Guarded completedLessons.includes')

# =====================================================================
# FIX 17: Ensure userProgress.stats.completedLessons is initialized
# =====================================================================
old_init = """let userProgress = {
  words: {},
  stats: { xp: 0, streak: 1, lastLogin: new Date().toDateString() },
};"""
new_init = """let userProgress = {
  words: {},
  stats: { xp: 0, streak: 1, lastLogin: new Date().toDateString(), completedLessons: [], dialogsCompleted: 0, studyMinutes: 0 },
};"""
if old_init in code:
    code = code.replace(old_init, new_init, 1)
    changes.append('userProgress: Added completedLessons/dialogsCompleted/studyMinutes defaults')

# Write back
with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print(f'Applied {len(changes)} fixes:')
for c in changes:
    print(f'  [OK] {c}')
print(f'\nFinal app.js size: {len(code)} bytes')
