"""
Fixes the .replace() crash globally and aligns HSK2/3 grammar data schemas.
1. Replaces `VAR.replace(` with `(VAR || "").replace(` in app.js
2. Updates `renderGrammarRule` to support both Array and Object format for examples.
3. Ensures all required fields exist in `grammar.json` across all levels.
"""
import re
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# 1. Patch app.js
with open('js/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

changes = []

# Guard common string replacements
replacements = [
    ("line.zh.replace", "(line.zh || '').replace"),
    ("l.zh.replace", "(l.zh || '').replace"),
    ("w[0].replace", "(w[0] || '').replace"),
    ("s[0].replace", "(s[0] || '').replace"),
    ("zh.replace", "(zh || '').replace"),
    ("q.zh.replace", "(q.zh || '').replace"),
    ("err.message", "(err.message || 'Error occurred')"), # Just in case for error messages
]

for old, new in replacements:
    if old in code:
        code = code.replace(old, new)
        changes.append(f"Guarded {old} -> {new}")

# specifically fix the renderGrammarRule body to handle both array and dict objects safely
render_grammar_ex_old = """          <div class="gram-examples">
            <h5>📝 أمثلة</h5>
            ${g.ex
              .map(
                (
                  e,
                ) => `<div class="gram-ex-row" onclick="playAudio('${e[0].replace(/'/g, "\\\\'")}')" style="cursor:pointer;" title="استمع">
              <div class="gram-ex-zh">${zhSpan(e[0], e[1])} <span style="font-size:.7rem;opacity:.5">🔊</span></div>
              <div class="gram-ex-ar">${e[2]}</div>
              ${e[3] ? `<div class="gram-ex-note">💡 ${e[3]}</div>` : ""}
            </div>`,
              )
              .join("")}
          </div>"""

render_grammar_ex_new = """          <div class="gram-examples">
            <h5>📝 أمثلة</h5>
            ${(g.ex || [])
              .map(
                (e) => {
                  const zh = Array.isArray(e) ? e[0] : (e.zh || "");
                  const py = Array.isArray(e) ? e[1] : (e.py || "");
                  const ar = Array.isArray(e) ? e[2] : (e.ar || "");
                  const note = Array.isArray(e) ? e[3] : (e.note || "");
                  return `<div class="gram-ex-row" onclick="playAudio('${(zh || "").replace(/'/g, "\\\\'")}')" style="cursor:pointer;" title="استمع">
              <div class="gram-ex-zh">${zhSpan(zh || "", py || "")} <span style="font-size:.7rem;opacity:.5">🔊</span></div>
              <div class="gram-ex-ar">${ar || ""}</div>
              ${note ? `<div class="gram-ex-note">💡 ${note}</div>` : ""}
            </div>`;
                }
              )
              .join("")}
          </div>"""

if render_grammar_ex_old in code:
    code = code.replace(render_grammar_ex_old, render_grammar_ex_new)
    changes.append("Updated renderGrammarRule to safely handle Array/Object formats and added string guards")

# Also fix the fallback error message from UI
old_err_msg = '"تنبيه في العرض: " + renderErr.message'
new_err_msg = '"عذراً، هناك نقص في بيانات القواعد لهذا المستوى"'
if old_err_msg in code:
    code = code.replace(old_err_msg, new_err_msg)
    changes.append("Updated Arabic fallback error message to user-friendly version")


with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("APP.JS PATCHES:")
for c in changes:
    print(f"  [OK] {c}")

# 2. Deep data alignment (grammar.json)
required_grammar_fields = ['id', 'title', 'en', 'formula', 'color', 'exp', 'rules', 'ex', 'q']

print("\nGRAMMAR.JSON CHECK & ALIGNMENT:")
for level in ['hsk1', 'hsk2', 'hsk3']:
    path = f'data/{level}/grammar.json'
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    
    GRAMMAR = data.get('GRAMMAR', [])
    updated = 0
    for g in GRAMMAR:
        # Guarantee every field exists
        for field in required_grammar_fields:
            if field not in g:
                if field in ['rules', 'ex', 'q']:
                    g[field] = []
                else:
                    g[field] = ""
                updated += 1
                
        # Ensure 'title', 'formula', 'en' are never explicitly None
        for field in ['title', 'formula', 'en', 'exp']:
            if g.get(field) is None:
                g[field] = ""
    
    # Save back
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  [OK] {level}: checked {len(GRAMMAR)} rules. Filled missing fields: {updated}")
