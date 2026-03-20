with open('js/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

changes = []

# -----------------------------------------------------------------------
# Fix 1: renderLessons() — guard against empty TOPICS
# -----------------------------------------------------------------------
old = """function renderLessons() {
  const isEn = currentLang === "en";
  const lessons = Array.from({ length: 15 }, (_, i) => i + 1);"""

new = """function renderLessons() {
  const isEn = currentLang === "en";
  if (!TOPICS || !TOPICS.length) {
    return `<div style="padding:3rem;text-align:center;opacity:.6;">
      <p>${isEn ? 'Please select a level first.' : 'اختر المستوى أولاً.'}</p></div>`;
  }
  const lessons = Array.from({ length: TOPICS.length }, (_, i) => i + 1);"""

if old in code:
    code = code.replace(old, new, 1)
    changes.append("renderLessons: Added TOPICS guard + dynamic length")
else:
    changes.append("WARN: renderLessons pattern not found!")

# -----------------------------------------------------------------------
# Fix 2: renderLessons() inner map — use TOPICS safely
# -----------------------------------------------------------------------
old2 = '              ${isEn ? "Lesson" : "درس"} ${n}: ${isEn ? TOPICS[n - 1].s : TOPICS[n - 1].t}'
new2 = '              ${isEn ? "Lesson" : "درس"} ${n}: ${(isEn ? (TOPICS[n-1] && TOPICS[n-1].s) : (TOPICS[n-1] && TOPICS[n-1].t)) || n}'

if old2 in code:
    code = code.replace(old2, new2, 1)
    changes.append("renderLessons map: Safe TOPICS[n-1] access")
else:
    changes.append("WARN: renderLessons map pattern not found!")

# -----------------------------------------------------------------------
# Fix 3: The SECOND buildContentFrames (line 3133) - gate sections on currentLevel
# -----------------------------------------------------------------------
old3 = '''  html += `<div id="sec-home" class="sec active">${renderHome()}</div>`;
  html += `<div id="sec-pinyin" class="sec">${renderPinyinPage()}</div>`;
  html += `<div id="sec-lessons" class="sec">${renderLessons()}</div>`;
  html += `<div id="sec-vocab" class="sec">${renderVocabPage()}</div>`;
  html += `<div id="sec-grammar" class="sec">${renderGrammar()}</div>`;
  html += `<div id="sec-dialogs" class="sec">${renderDialogsPage()}</div>`;
  html += `<div id="sec-stories" class="sec">${renderStoriesPage()}</div>`;
  html += `<div id="sec-flashcards" class="sec">${renderFlashcardsPage()}</div>`;
  html += `<div id="sec-tests" class="sec">${renderBigExam()}</div>`;
  html += `<div id="sec-review" class="sec">${renderReviewPage()}</div>`;
  html += `<div id="sec-progress" class="sec">${renderProgress()}</div>`;
  html += `<div id="sec-profile" class="sec">${renderProfile()}</div>`;
  html += `<div id="sec-translator" class="sec">${renderSmartTranslator()}</div>`;

  const totalLessons = (typeof TOPICS !== "undefined" && TOPICS.length > 0) ? TOPICS.length : 15;
  for (let i = 1; i <= totalLessons; i++) {
    html += `<div id="sec-t${i}" class="sec">${renderTopic(i)}</div>`;
  }
  mainArea.innerHTML = html;
}'''

new3 = '''  // Always render the home screen
  html += `<div id="sec-home" class="sec active">${renderHome()}</div>`;

  // Only render level content sections if a level is loaded
  if (currentLevel) {
    html += `<div id="sec-dashboard" class="sec">${typeof renderDashboard === "function" ? renderDashboard() : ""}</div>`;
    html += `<div id="sec-pinyin" class="sec">${renderPinyinPage()}</div>`;
    html += `<div id="sec-lessons" class="sec">${renderLessons()}</div>`;
    html += `<div id="sec-vocab" class="sec">${renderVocabPage()}</div>`;
    html += `<div id="sec-grammar" class="sec">${renderGrammar()}</div>`;
    html += `<div id="sec-dialogs" class="sec">${renderDialogsPage()}</div>`;
    html += `<div id="sec-stories" class="sec">${renderStoriesPage()}</div>`;
    html += `<div id="sec-flashcards" class="sec">${renderFlashcardsPage()}</div>`;
    html += `<div id="sec-tests" class="sec">${renderBigExam()}</div>`;
    html += `<div id="sec-review" class="sec">${renderReviewPage()}</div>`;
    html += `<div id="sec-progress" class="sec">${renderProgress()}</div>`;
    html += `<div id="sec-profile" class="sec">${renderProfile()}</div>`;
    html += `<div id="sec-translator" class="sec">${renderSmartTranslator()}</div>`;

    const totalLessons = TOPICS.length || 15;
    for (let i = 1; i <= totalLessons; i++) {
      html += `<div id="sec-t${i}" class="sec">${renderTopic(i)}</div>`;
    }
  }

  mainArea.innerHTML = html;
}'''

if old3 in code:
    code = code.replace(old3, new3, 1)
    changes.append("buildContentFrames (second): Gated level sections on currentLevel")
else:
    changes.append("WARN: second buildContentFrames inner block not found!")

# -----------------------------------------------------------------------
# Fix 4: initApp — skip heavy rendering if no level loaded, just show home
# -----------------------------------------------------------------------
old4 = """function initApp() {
  buildNav();
  buildContentFrames();
  updateProgressBar();
  showTab("home");
}"""

new4 = """function initApp() {
  buildNav();
  buildContentFrames();
  if (typeof updateProgressBar === "function") updateProgressBar();
  showTab("home");
}"""

if old4 in code:
    code = code.replace(old4, new4, 1)
    changes.append("initApp: Wrapped updateProgressBar in safety check")

# -----------------------------------------------------------------------
# Fix 5: renderGrammar guard
# -----------------------------------------------------------------------
old5 = 'function renderGrammar() {'
new5 = '''function renderGrammar() {
  const isEn = currentLang === "en";
  if (!GRAMMAR || !GRAMMAR.length) {
    return `<div style="padding:3rem;text-align:center;opacity:.6;"><p>${isEn ? "Select a level to view grammar." : "اختر المستوى لعرض القواعد."}</p></div>`;
  }'''

if old5 in code and new5 not in code:
    code = code.replace(old5, new5, 1)
    changes.append("renderGrammar: Added GRAMMAR empty guard")

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Patch results:")
for c in changes:
    print(f"  {c}")
print(f"\nFinal app.js size: {len(code)} bytes")
