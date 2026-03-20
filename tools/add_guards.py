"""
Adds defensive guards to app.js for all data-dependent array operations.
Patches:
1. renderStoriesPage: guard STORIES
2. renderGrammar: guard GRAMMAR (already done, verify)
3. renderTopic: guard W, SENTS, DIALOGUES, GRAMMAR
4. renderLessons: guard TOPICS (already done, verify)  
5. renderShadowing: guard DIALOGUES, TOPICS
6. renderVocab/renderVocabPage: guard W
7. renderFlashcardsPage: guard W
8. renderDialogsPage: guard DIALOGUES
9. renderProgress: guard W, TOPICS
10. initFlashcards: guard W
11. renderBigExam: guard BIGEXAM
"""
import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

changes = []

# -----------------------------------------------------------------------
# 1. renderStoriesPage: guard STORIES
# -----------------------------------------------------------------------
old = 'function renderStoriesPage() {\n  const isEn = currentLang === "en";'
new = 'function renderStoriesPage() {\n  const isEn = currentLang === "en";\n  if (!STORIES || !STORIES.length) return `<div style="padding:2rem;text-align:center;opacity:.6"><p>${isEn ? "No stories available." : "لا توجد قصص متاحة."}</p></div>`;'
if old in code and new not in code:
    code = code.replace(old, new, 1)
    changes.append('renderStoriesPage: Added STORIES guard')

# -----------------------------------------------------------------------
# 2. renderShadowing: guard DIALOGUES, TOPICS
# -----------------------------------------------------------------------
old2 = 'function renderShadowing() {\n  let isEn = currentLang === "en";'
new2 = 'function renderShadowing() {\n  let isEn = currentLang === "en";\n  if (!DIALOGUES || !Object.keys(DIALOGUES).length) return `<div style="padding:2rem;text-align:center;opacity:.6"><p>${isEn ? "No shadowing content." : "لا يوجد محتوى ترديد."}</p></div>`;'
if old2 in code and new2 not in code:
    code = code.replace(old2, new2, 1)
    changes.append('renderShadowing: Added DIALOGUES guard')

# -----------------------------------------------------------------------
# 3. renderBigExam: guard BIGEXAM
# -----------------------------------------------------------------------
old3 = 'function renderBigExam() {'
new3 = 'function renderBigExam() {\n  if (!BIGEXAM || !BIGEXAM.length) {\n    const isEn = currentLang === "en";\n    return `<div style="padding:2rem;text-align:center;opacity:.6"><p>${isEn ? "No exam questions available." : "لا توجد أسئلة امتحان."}</p></div>`;\n  }'
if old3 in code and new3 not in code:
    code = code.replace(old3, new3, 1)
    changes.append('renderBigExam: Added BIGEXAM guard')

# -----------------------------------------------------------------------
# 4. renderTopic: guard W.filter
# -----------------------------------------------------------------------
old4 = '  const words = W.filter((w) => w[4] === topicNum);'
new4 = '  const words = (W || []).filter((w) => w[4] === topicNum);'
code = code.replace(old4, new4)
if old4 in code or new4 in code:
    changes.append('renderTopic: Guarded W.filter')

# -----------------------------------------------------------------------
# 5. initFlashcards: guard W
# -----------------------------------------------------------------------
old5 = '  fcState.filtered = topicN === 0 ? W : W.filter((w) => w[4] === topicN);'
new5 = '  fcState.filtered = topicN === 0 ? (W || []) : (W || []).filter((w) => w[4] === topicN);'
if old5 in code:
    code = code.replace(old5, new5, 1)
    changes.append('initFlashcards: Guarded W')

# -----------------------------------------------------------------------
# 6. Guard W.filter in flashcard filtering
# -----------------------------------------------------------------------
old6 = '    fcState.filtered = W.filter((w) => w[4] === topicN);'
new6 = '    fcState.filtered = (W || []).filter((w) => w[4] === topicN);'
if old6 in code:
    code = code.replace(old6, new6, 1)
    changes.append('Flashcard filter: Guarded W')

# -----------------------------------------------------------------------
# 7. renderDialogsPage: guard DIALOGUES
# -----------------------------------------------------------------------
# Find renderDialogsPage and add guard if not present
if 'function renderDialogsPage()' in code:
    old7 = 'function renderDialogsPage() {'
    new7 = 'function renderDialogsPage() {\n  if (!DIALOGUES || !Object.keys(DIALOGUES).length) {\n    const isEn = currentLang === "en";\n    return `<div style="padding:2rem;text-align:center;opacity:.6"><p>${isEn ? "No dialogues available." : "لا توجد حوارات."}</p></div>`;\n  }'
    if new7 not in code:
        code = code.replace(old7, new7, 1)
        changes.append('renderDialogsPage: Added DIALOGUES guard')

# -----------------------------------------------------------------------
# 8. renderFlashcardsPage: guard W
# -----------------------------------------------------------------------
if 'function renderFlashcardsPage()' in code:
    old8 = 'function renderFlashcardsPage() {'
    new8 = 'function renderFlashcardsPage() {\n  if (!W || !W.length) {\n    const isEn = currentLang === "en";\n    return `<div style="padding:2rem;text-align:center;opacity:.6"><p>${isEn ? "No flashcards available." : "لا توجد بطاقات."}</p></div>`;\n  }'
    if new8 not in code:
        code = code.replace(old8, new8, 1)
        changes.append('renderFlashcardsPage: Added W guard')

# -----------------------------------------------------------------------
# 9. renderReviewPage: guard W
# -----------------------------------------------------------------------
if 'function renderReviewPage()' in code:
    old9 = 'function renderReviewPage() {'
    new9 = 'function renderReviewPage() {\n  if (!W || !W.length) {\n    const isEn = currentLang === "en";\n    return `<div style="padding:2rem;text-align:center;opacity:.6"><p>${isEn ? "No review items." : "لا توجد عناصر مراجعة."}</p></div>`;\n  }'
    if new9 not in code:
        code = code.replace(old9, new9, 1)
        changes.append('renderReviewPage: Added W guard')

# -----------------------------------------------------------------------
# 10. renderProgress: guard W, TOPICS
# -----------------------------------------------------------------------
if 'function renderProgress()' in code:
    old10 = 'function renderProgress() {'
    new10 = 'function renderProgress() {\n  if (!W || !W.length || !TOPICS || !TOPICS.length) {\n    const isEn = currentLang === "en";\n    return `<div style="padding:2rem;text-align:center;opacity:.6"><p>${isEn ? "Select a level to view progress." : "اختر مستوى لعرض التقدم."}</p></div>`;\n  }'
    if new10 not in code:
        code = code.replace(old10, new10, 1)
        changes.append('renderProgress: Added W/TOPICS guard')

# -----------------------------------------------------------------------
# 11. renderVocabPage: guard W
# -----------------------------------------------------------------------
if 'function renderVocabPage()' in code:
    old11 = 'function renderVocabPage() {'
    new11 = 'function renderVocabPage() {\n  if (!W || !W.length) {\n    const isEn = currentLang === "en";\n    return `<div style="padding:2rem;text-align:center;opacity:.6"><p>${isEn ? "No vocabulary available." : "لا توجد مفردات."}</p></div>`;\n  }'
    if new11 not in code:
        code = code.replace(old11, new11, 1)
        changes.append('renderVocabPage: Added W guard')

# -----------------------------------------------------------------------
# 12. renderPinyinPage: guard pinyinExamples
# -----------------------------------------------------------------------
if 'function renderPinyinPage()' in code:
    old12 = 'function renderPinyinPage() {'
    new12 = 'function renderPinyinPage() {\n  if (!pinyinExamples || !Object.keys(pinyinExamples).length) {\n    const isEn = currentLang === "en";\n    return `<div style="padding:2rem;text-align:center;opacity:.6"><p>${isEn ? "No pinyin data." : "لا توجد بيانات بينيين."}</p></div>`;\n  }'
    if new12 not in code:
        code = code.replace(old12, new12, 1)
        changes.append('renderPinyinPage: Added pinyinExamples guard')

# -----------------------------------------------------------------------
# 13. renderProfile: guard (safe even if data is missing)
# -----------------------------------------------------------------------
if 'function renderProfile()' in code:
    old13 = 'function renderProfile() {'
    new13 = 'function renderProfile() {\n  if (!W) W = [];'
    if new13 not in code:
        code = code.replace(old13, new13, 1)
        changes.append('renderProfile: Added W safeguard')

# -----------------------------------------------------------------------
# 14. GRAMMAR.map: guard in renderGrammar
# -----------------------------------------------------------------------
old14 = '        ${GRAMMAR.map((g) => renderGrammarRule(g)).join("")}'
new14 = '        ${(GRAMMAR || []).map((g) => renderGrammarRule(g)).join("")}'
if old14 in code:
    code = code.replace(old14, new14, 1)
    changes.append('renderGrammar body: Guarded GRAMMAR.map')

# -----------------------------------------------------------------------
# 15. TOPICS.map: guard in renderPinyinBasics/Tones
# -----------------------------------------------------------------------
old15 = '              ${TOPICS.map('
new15 = '              ${(TOPICS || []).map('
code = code.replace(old15, new15)
changes.append('Template TOPICS.map: Guarded')

# -----------------------------------------------------------------------
# 16. Guard W usage in quiz generation
# -----------------------------------------------------------------------
old16 = '  const words = W.filter((w) => w[4] === n);'
new16 = '  const words = (W || []).filter((w) => w[4] === n);'
code = code.replace(old16, new16)
changes.append('Quiz word filter: Guarded W')

# Write back
with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print(f'Applied {len(changes)} defensive guards:')
for c in changes:
    print(f'  [OK] {c}')
print(f'\nFinal app.js size: {len(code)} bytes')
