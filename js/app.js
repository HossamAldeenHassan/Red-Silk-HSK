// --- SRS & Progress Tracking System ---
const STORAGE_KEY = "hsk1_progress";
let userProgress = {
  words: {},
  stats: { xp: 0, streak: 1, lastLogin: new Date().toDateString() },
};

function initProgress() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      userProgress = JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing progress", e);
    }
  }
  checkStreak();
  updateStatsUI();
  updateVocabCounts();
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userProgress));
  updateStatsUI();
}

function checkStreak() {
  const today = new Date().toDateString();
  if (userProgress.stats.lastLogin !== today) {
    const last = new Date(userProgress.stats.lastLogin);
    const now = new Date();
    const diffTime = Math.abs(now - last);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      userProgress.stats.streak += 1;
    } else {
      userProgress.stats.streak = 1;
    }
    userProgress.stats.lastLogin = today;
    saveProgress();
  }
}

function addXP(amount) {
  userProgress.stats.xp += amount;
  saveProgress();
}

function updateWordSRS(hanzi, isCorrect) {
  if (!userProgress.words[hanzi]) {
    userProgress.words[hanzi] = { level: 0, nextReview: Date.now() };
  }

  let wStats = userProgress.words[hanzi];
  if (isCorrect) {
    wStats.level += 1;
    const hours = Math.pow(2, wStats.level);
    wStats.nextReview = Date.now() + hours * 60 * 60 * 1000;
    addXP(10);
  } else {
    wStats.level = Math.max(0, wStats.level - 1);
    wStats.nextReview = Date.now() + 10 * 60 * 1000;
    addXP(2);
  }
  saveProgress();
}

function updateStatsUI() {
  const xpEl = document.getElementById("user-xp");
  const streakEl = document.getElementById("user-streak");
  if (xpEl) xpEl.innerText = userProgress.stats.xp + " XP";
  if (streakEl) streakEl.innerText = "🔥 " + userProgress.stats.streak;
}

document.addEventListener("DOMContentLoaded", initProgress);
// ------------------------------------

// --- Audio System (Cross-Browser) ---
let _ttsAudio = null;

function _gttsUrl(text, speed) {
  // Google Translate TTS endpoint (works on mobile / Firefox / Safari)
  const rate = speed < 0.8 ? "slow" : "normal";
  return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=zh-CN&ttsspeed=${rate === "slow" ? "0.24" : "1"}&client=gtx`;
}

function _tryGoogleTTS(text, speed) {
  if (_ttsAudio) {
    _ttsAudio.pause();
    _ttsAudio = null;
  }
  _ttsAudio = new Audio(_gttsUrl(text, speed));
  _ttsAudio.playbackRate = 1.0;
  _ttsAudio.play().catch(() => {
    // Last resort: open TTS in new tab (works everywhere)
    // window.open(_gttsUrl(text, speed), '_blank');
  });
}

function playAudio(text, speed = 1.0) {
  if (!text) return;
  // Try Web Speech API first
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = speed;
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(
      (v) => v.lang.startsWith("zh") || v.lang.startsWith("cmn"),
    );
    if (zhVoice) {
      utterance.voice = zhVoice;
      window.speechSynthesis.speak(utterance);
      // Fallback if it fails silently after 1s
      setTimeout(() => {
        if (!window.speechSynthesis.speaking) _tryGoogleTTS(text, speed);
      }, 1200);
      return;
    }
  }
  // No Chinese Web Speech voice found -> use Google TTS directly
  _tryGoogleTTS(text, speed);
}

// Alias used throughout the code
function speakChinese(text, isPinyin = false) {
  const slider = document.getElementById("rateSlider");
  const rate = slider ? parseFloat(slider.value) : 0.9;
  let textToSpeak = text;
  if (isPinyin) {
    // For pinyin basics, speak the character mapped to the pinyin
    const pinyinMap = window.pinyinExamples || {};
    if (pinyinMap[text]) textToSpeak = pinyinMap[text];
  }
  playAudio(textToSpeak, rate);
}
window.speakChinese = speakChinese;
window.playAudio = playAudio;

// Ensure Web Speech voices load in Chrome
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () =>
    window.speechSynthesis.getVoices();
}

// =========================================================================
// 1. البيانات الأساسية (المصفوفات والكائنات) - من ملفك القديم
// =========================================================================
// =========================================================================
// قاموس PinyinExamples (لتحسين النطق)
// =========================================================================
// =========================================================================
// المتغيرات العامة والإعدادات
// =========================================================================
let currentLang = "ar";
let showPinyin = true;
let learnedWords = new Set(
  JSON.parse(localStorage.getItem("hsk_learned") || "[]"),
);
let currentTab = "home";
let currentLesson = 1;
let currentVocabFilter = "all";
let fullLessonOpened = false;
const REVIEW_KEY = "hsk1_review";
let reviewList = [];
let fcState = { topic: 0, idx: 0, flipped: false, filtered: [] };

function toggleLang() {
  currentLang = currentLang === "ar" ? "en" : "ar";
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";
  document.getElementById("lang-btn-text").innerText =
    currentLang === "ar" ? "🌐 English" : "🌐 العربية";

  // Update Hero and Logos Texts
  let elSubtitle = document.getElementById("hero-subtitle");
  if (elSubtitle)
    elSubtitle.innerText =
      currentLang === "ar" ? "تعلم اللغة الصينية" : "Learn Chinese Language";

  let elDesc = document.getElementById("hero-desc");
  if (elDesc)
    elDesc.innerText =
      currentLang === "ar"
        ? "المستوى الأول — 500 كلمة · 15 موضوعاً · قواعد كاملة"
        : "Level 1 — 500 Words · 15 Topics · Full Grammar";

  let elGlbl = document.getElementById("glbl");
  if (elGlbl)
    elGlbl.innerText =
      currentLang === "ar"
        ? "ابدأ رحلتك! انقر على أي كلمة لتحفظها 🎯"
        : "Start your journey! Click on any word to save it 🎯";

  let elLogo = document.querySelector(".nav-logo-ar");
  if (elLogo)
    elLogo.innerText =
      currentLang === "ar"
        ? "HSK 1 — المنهج الشامل"
        : "HSK 1 Comprehensive Course";

  // Rebuild interface
  buildNav();
  buildContentFrames();
  showTab(currentTab);
}
window.toggleLang = toggleLang;

function saveProgress() {
  try {
    localStorage.setItem("hsk_learned", JSON.stringify([...learnedWords]));
  } catch (e) {}
}

function updateProgressBar() {
  const pct = Math.round((learnedWords.size / 500) * 100);
  const bar = document.getElementById("gbar");
  if (bar) bar.style.width = pct + "%";
  const glbl = document.getElementById("glbl");
  if (glbl) glbl.innerHTML = `✅ حفظت ${learnedWords.size} من 500 كلمة`;
  const learnedCount = document.getElementById("learned_count");
  if (learnedCount) learnedCount.textContent = learnedWords.size;
}

// دالة النطق المحسنة (تدعم شريط السرعة و Pinyin)
function speakChinese(text, isPinyin = false) {
  if (!text || !window.speechSynthesis) return;
  let textToSpeak =
    isPinyin && pinyinExamples[text] ? pinyinExamples[text] : text;
  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.lang = "zh-CN";
  const slider = document.getElementById("rateSlider");
  utterance.rate = slider ? parseFloat(slider.value) : 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function togglePinyin() {
  showPinyin = !showPinyin;
  // إخفاء/إظهار جميع عناصر البينيين
  document
    .querySelectorAll(
      ".py, .opt-py, .bwc-py, .fc-py, .chip-pinyin, .sent-py, .line-py",
    )
    .forEach((el) => {
      el.style.display = showPinyin ? "block" : "none";
    });

  // تحديث نصوص الأزرار التي تحمل كلاس py-toggle
  document.querySelectorAll(".py-toggle").forEach((btn) => {
    const textSpan = btn.querySelector(".pinyin-text");
    if (textSpan) {
      textSpan.innerText = showPinyin ? "إخفاء Pinyin" : "إظهار Pinyin";
    } else {
      // إذا كان الزر لا يحتوي على span (مثل الأزرار القديمة)، نغير محتواه بالكامل
      btn.innerHTML = showPinyin ? "إخفاء Pinyin 👁️" : "إظهار Pinyin 👁️";
    }
  });
}

function zhSpan(hanzi, pinyin) {
  return `<span class="zh-wrap"><span class="hanzi">${hanzi}</span>${pinyin ? '<span class="py" style="display:' + (showPinyin ? "block" : "none") + '">' + pinyin + "</span>" : ""}</span>`;
}

window.flipCard = function (cardId) {
  // cardId is like "fc_N" where N is topic number
  // We need to find the .fc-inner inside fc_card_N and toggle flipped
  const wrap = document.getElementById("fc_card_" + cardId.replace("fc_", ""));
  if (wrap) {
    const inner = wrap.querySelector(".fc-inner");
    if (inner) {
      inner.classList.toggle("flipped");
      fcState.flipped = inner.classList.contains("flipped");
      // Speak the word when flipping to show
      if (!fcState.flipped) {
        const w = fcState.filtered[fcState.idx];
        if (w) speakChinese(w[0]);
      }
    }
  }
};

// =========================================================================
// صفحة القصص (Stories)
// =========================================================================
function renderStoriesPage() {
  const isEn = currentLang === "en";

  // تقسيم القصص حسب المستوى
  const easyStories = STORIES.filter((s) => s.level === "easy");
  const mediumStories = STORIES.filter((s) => s.level === "medium");
  const advancedStories = STORIES.filter((s) => s.level === "advanced");

  return `
    <div class="stories-page">
      <div class="stories-header">
        <h3>${isEn ? "HSK1 Stories" : "📖 قصص HSK1"}</h3>
        <p>${isEn ? "Read short stories using HSK1 vocabulary" : "اقرأ قصصاً قصيرة بمفردات HSK1"}</p>
      </div>
      
      <!-- المستوى السهل -->
      <div class="story-level">
        <div class="level-title easy">
          <span class="level-badge easy">${isEn ? "Easy" : "سهل"}</span>
          <span class="level-desc">${isEn ? "Lessons 1-5" : "الدروس 1-5"}</span>
        </div>
        <div class="stories-grid">
          ${
            easyStories.length
              ? easyStories.map((story) => renderStoryCard(story)).join("")
              : `
            <div class="no-stories">${isEn ? "No stories available" : "لا توجد قصص حالياً"}</div>
          `
          }
        </div>
      </div>
      
      <!-- المستوى المتوسط -->
      <div class="story-level">
        <div class="level-title medium">
          <span class="level-badge medium">${isEn ? "Medium" : "متوسط"}</span>
          <span class="level-desc">${isEn ? "Lessons 6-10" : "الدروس 6-10"}</span>
        </div>
        <div class="stories-grid">
          ${
            mediumStories.length
              ? mediumStories.map((story) => renderStoryCard(story)).join("")
              : `
            <div class="no-stories">${isEn ? "No stories available" : "لا توجد قصص حالياً"}</div>
          `
          }
        </div>
      </div>
      
      <!-- المستوى المتقدم -->
      <div class="story-level">
        <div class="level-title advanced">
          <span class="level-badge advanced">${isEn ? "Advanced" : "متقدم"}</span>
          <span class="level-desc">${isEn ? "Lessons 11-15" : "الدروس 11-15"}</span>
        </div>
        <div class="stories-grid">
          ${
            advancedStories.length
              ? advancedStories.map((story) => renderStoryCard(story)).join("")
              : `
            <div class="no-stories">${isEn ? "No stories available" : "لا توجد قصص حالياً"}</div>
          `
          }
        </div>
      </div>
    </div>
  `;
}

function renderStoryCard(story) {
  const isEn = currentLang === "en";
  const title = isEn ? story.titleEn : story.title;
  const levelNames = {
    easy: isEn ? "Easy" : "سهل",
    medium: isEn ? "Medium" : "متوسط",
    advanced: isEn ? "Advanced" : "متقدم",
  };

  // عدد الكلمات التقريبي (للعرض)
  const wordCount = story.content.reduce(
    (acc, line) => acc + line.zh.length,
    0,
  );

  return `
    <div class="story-card" onclick="showStory(${story.id})">
      <div class="story-card-header ${story.level}">
        <span class="story-level-icon">${story.level === "easy" ? "🌱" : story.level === "medium" ? "🌿" : "🌳"}</span>
        <span class="story-level-name">${levelNames[story.level]}</span>
      </div>
      <div class="story-card-body">
        <h3 class="story-title">${title}</h3>
        <p class="story-preview">${story.content[0].ar.substring(0, 60)}...</p>
        <div class="story-meta">
          <span class="story-words">${wordCount} ${isEn ? "words" : "كلمة"}</span>
          <span class="story-read-more">${isEn ? "Read More" : "اقرأ المزيد"}</span>
        </div>
      </div>
    </div>
  `;
}
function showStory(storyId) {
  const story = STORIES.find((s) => s.id === storyId);
  if (!story) return;

  const isEn = currentLang === "en";
  const title = isEn ? story.titleEn : story.title;
  const levelNames = {
    easy: isEn ? "Easy" : "سهل",
    medium: isEn ? "Medium" : "متوسط",
    advanced: isEn ? "Advanced" : "متقدم",
  };

  // إخفاء جميع الأقسام الأخرى
  document
    .querySelectorAll(".sec")
    .forEach((sec) => sec.classList.remove("active"));

  // البحث عن قسم تفاصيل القصة أو إنشاؤه
  let detailSec = document.getElementById("sec-story-detail");
  if (!detailSec) {
    detailSec = document.createElement("div");
    detailSec.id = "sec-story-detail";
    detailSec.className = "sec";
    document.getElementById("main_area").appendChild(detailSec);
  }

  // تجميع محتوى القصة في فقرات
  const paragraphs = [];
  for (let i = 0; i < story.content.length; i += 3) {
    paragraphs.push(story.content.slice(i, i + 3));
  }

  detailSec.innerHTML = `
    <div class="story-detail-page">
      <div class="story-detail-header">
        <div class="story-nav">
          <button class="btn-back-story" onclick="showTab('stories')">
            ${isEn ? "Back to Stories" : "عودة إلى القصص"}
          </button>
        </div>
        <h1 class="story-detail-title">${title}</h1>
        <span class="story-detail-badge ${story.level}">${levelNames[story.level]}</span>
      </div>
      <div class="story-content">
        ${paragraphs
          .map(
            (para) => `
          <div class="story-paragraph">
            ${para
              .map(
                (line) => `
              <div class="story-line">
                <div class="story-line-zh" onclick="playAudio('${line.zh.replace(/'/g, "\\'")}')">
                  ${line.zh} <span class="audio-icon">🔊</span>
                </div>
                <div class="story-line-py py" style="display:${showPinyin ? "block" : "none"}">
                  ${formatPinyin(line.py)}
                </div>
                <div class="story-line-ar">${line.ar}</div>
              </div>
            `,
              )
              .join("")}
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `;

  // إظهار القسم الجديد
  detailSec.classList.add("active");
}

function showStoriesPage() {
  const detailContainer = document.getElementById("story-detail-container");
  const gridContainer = document.getElementById("stories-grid-container");
  if (detailContainer && gridContainer) {
    detailContainer.style.display = "none";
    gridContainer.style.display = "block";
  }
}

function showStoriesPage() {
  // العودة إلى صفحة القصص الرئيسية
  showTab("stories");
}

// تصدير الدوال
window.renderStoriesPage = renderStoriesPage;
window.renderStoryCard = renderStoryCard;
window.showStory = showStory;
window.showStoriesPage = showStoriesPage;

// =========================================================================
// نظام الاختبارات (Quiz Engine)
// =========================================================================
function renderQuestion(cid) {
  const state = window[cid + "_state"];
  const questions = window[cid + "_questions"];
  if (!state || !questions) return;
  const q = questions[state.idx];
  const pct = Math.round((state.idx / state.total) * 100);
  let html = `<div class="quiz-header">
        <span class="quiz-prog">${state.idx + 1} / ${state.total}</span>
        <button class="py-toggle" onclick="togglePinyin()">${showPinyin ? "إخفاء Pinyin 👁️" : "إظهار Pinyin 👁️"}</button>
        <div class="prog-bar"><div class="prog-fill" style="width:${pct}%"></div></div>
      </div>
      <div class="quiz-q">
        <p class="q-text">${q.q}</p>
        ${q.zh ? `<div class="q-zh">${zhSpan(q.zh, q.py || "")}</div>` : ""}
      </div>
      <div class="opts" id="${cid}_opts">`;

  q.opts.forEach((o, i) => {
    let optHtml = o;
    // إذا كان الخيار يحتوي على حروف صينية، نضيف البينيين تحته
    if (/[\u4e00-\u9fa5]/.test(o)) {
      const found = W.find((w) => w[0] === o);
      if (found) {
        optHtml =
          o +
          '<span class="opt-py" style="display:' +
          (showPinyin ? "block" : "none") +
          '">' +
          found[1] +
          "</span>";
      }
    }
    html += `<button class="opt-btn" onclick="answerQuiz('${cid}', ${i})">${optHtml}</button>`;
  });

  html += `</div><div id="${cid}_exp" class="quiz-exp hidden"></div>
      <div id="${cid}_nav" class="quiz-nav hidden">
        <button class="btn-next" onclick="nextQuestion('${cid}')">${state.idx + 1 < state.total ? "السؤال التالي ←" : "عرض النتيجة 🏆"}</button>
      </div>`;
  document.getElementById(cid).innerHTML = html;
}

function answerQuiz(cid, chosen) {
  const state = window[cid + "_state"];
  const questions = window[cid + "_questions"];
  if (state.answered) return;
  state.answered = true;
  const q = questions[state.idx];
  const correct = q.a;
  if (chosen === correct) state.score++;

  const btns = document.querySelectorAll(`#${cid}_opts .opt-btn`);
  btns.forEach((b, i) => {
    b.disabled = true;
    if (i === correct) b.classList.add("correct");
    else if (i === chosen) b.classList.add("wrong");
  });

  const expDiv = document.getElementById(cid + "_exp");
  expDiv.classList.remove("hidden");
  let expHtml = `<div class="exp-box">`;
  expHtml += `<p class="exp-result">${chosen === correct ? "✅ إجابة صحيحة!" : "❌ إجابة خاطئة — الصحيحة: <strong>" + q.opts[correct] + "</strong>"}</p>`;
  if (q.exp) expHtml += `<p class="exp-detail">${q.exp}</p>`;
  expHtml += `<div class="all-opts-exp"><strong>📋 شرح جميع الخيارات:</strong><ul>`;
  q.opts.forEach((o, i) => {
    const icon = i === correct ? "✅" : "❌";
    expHtml += `<li>${icon} <strong>${o}</strong>${i === correct ? " — الإجابة الصحيحة" : ""}</li>`;
  });
  expHtml += `</ul></div></div>`;
  expDiv.innerHTML = expHtml;
  document.getElementById(cid + "_nav").classList.remove("hidden");
}

function nextQuestion(cid) {
  const state = window[cid + "_state"];
  if (!state) return;
  state.answered = false;
  state.idx++;
  if (state.idx >= state.total) {
    const pct = Math.round((state.score / state.total) * 100);
    const emoji = pct >= 90 ? "🏆" : pct >= 70 ? "🌟" : pct >= 50 ? "👍" : "💪";
    const msg =
      pct >= 90
        ? "ممتاز! أنت نجم الصف!"
        : pct >= 70
          ? "جيد جداً! استمر!"
          : pct >= 50
            ? "جيد، تحتاج مراجعة قليلة"
            : "لا بأس، راجع الدرس وحاول مجدداً!";
    document.getElementById(cid).innerHTML = `<div class="result-box">
          <div class="result-emoji">${emoji}</div>
          <h3>انتهى الاختبار!</h3>
          <p class="result-score">${state.score} / ${state.total}</p>
          <p class="result-pct">${pct}%</p>
          <p class="result-msg">${msg}</p>
          <button class="btn-retry" onclick="makeQuizInto('${cid}')">إعادة الاختبار 🔄</button>
        </div>`;
  } else {
    renderQuestion(cid);
  }
}

function makeQuizInto(cid) {
  const orig = window[cid + "_orig"] || window[cid + "_questions"];
  window[cid + "_questions"] = [...orig].sort(() => Math.random() - 0.5);
  window[cid + "_state"] = {
    idx: 0,
    score: 0,
    answered: false,
    total: window[cid + "_questions"].length,
    id: cid,
  };
  renderQuestion(cid);
}
// =========================================================================
// دوال صفحة أساسيات Pinyin
// =========================================================================
function renderPinyinBasics() {
  const groups = [
    {
      title: "🔊 الحروف الصوتية البسيطة",
      items: ["a", "o", "e", "i", "u", "ü"],
    },
    {
      title: "🔊 الحروف المركبة",
      items: [
        "ai",
        "ei",
        "ao",
        "ou",
        "ia",
        "ie",
        "ua",
        "uo",
        "üe",
        "iao",
        "iou",
        "uai",
        "uei",
      ],
    },
    {
      title: "🔊 الحروف الأنفية",
      items: [
        "an",
        "en",
        "in",
        "un",
        "ün",
        "ian",
        "uan",
        "uen",
        "üan",
        "ang",
        "eng",
        "ing",
        "ong",
        "iong",
        "iang",
        "uang",
      ],
    },
    {
      title: "🔊 الحروف الساكنة",
      items: [
        "b",
        "p",
        "m",
        "f",
        "d",
        "t",
        "n",
        "l",
        "g",
        "k",
        "h",
        "j",
        "q",
        "x",
        "z",
        "c",
        "s",
        "zh",
        "ch",
        "sh",
        "r",
      ],
    },
  ];

  return `
    <div class="pinyin-page" style="padding:1.5rem; background:#f9f5f0; border-radius:12px;">
      <div style="background: linear-gradient(135deg, #1a1a2e, #c0392b); border-radius: 12px; padding: 1.5rem; color: #fff; margin-bottom: 2rem;">
        <h2 style="margin:0; font-family: 'Noto Serif SC', serif;">拼音速查</h2>
        <p style="opacity:0.9;">أساسيات النطق - انقر على أي زر لسماع الصوت بالصينية</p>
      </div>
      ${groups
        .map(
          (g) => `
        <div class="py-group" style="background:#fdf8f0; padding:1rem; border-radius:8px; margin-bottom:1rem; border-right:3px solid #c0392b;">
          <h5 style="color:#c0392b; margin-top:0;">${g.title}</h5>
          <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
            ${g.items.map((c) => `<button class="py-card" onclick="speakChinese('${c}', true)">${c}</button>`).join("")}
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  `;
}

function renderTones() {
  const tones = [
    {
      n: 1,
      name: "النغمة الأولى",
      sym: "ā",
      desc: "صوت مرتفع ثابت",
      color: "#e74c3c",
      ex: [
        { zh: "妈", py: "mā", ar: "أم" },
        { zh: "书", py: "shū", ar: "كتاب" },
      ],
    },
    {
      n: 2,
      name: "النغمة الثانية",
      sym: "á",
      desc: "صوت صاعد (كأنك تسأل)",
      color: "#f39c12",
      ex: [
        { zh: "国", py: "guó", ar: "بلد" },
        { zh: "人", py: "rén", ar: "إنسان" },
      ],
    },
    {
      n: 3,
      name: "النغمة الثالثة",
      sym: "ǎ",
      desc: "صوت هابط ثم صاعد",
      color: "#27ae60",
      ex: [
        { zh: "你", py: "nǐ", ar: "أنت" },
        { zh: "我", py: "wǒ", ar: "أنا" },
      ],
    },
    {
      n: 4,
      name: "النغمة الرابعة",
      sym: "à",
      desc: "صوت هابط قاطع",
      color: "#3498db",
      ex: [
        { zh: "是", py: "shì", ar: "يكون" },
        { zh: "去", py: "qù", ar: "يذهب" },
      ],
    },
    {
      n: 0,
      name: "النغمة المحايدة",
      sym: "a",
      desc: "صوت خفيف قصير",
      color: "#95a5a6",
      ex: [
        { zh: "吗", py: "ma", ar: "؟" },
        { zh: "吧", py: "ba", ar: "أداة" },
      ],
    },
  ];

  return `
    <div class="tones-section">
      <h2 class="tones-title">🎵 النغمات الأربع في الصينية</h2>
      <p class="tones-intro">الصينية لغة نغمية — كل نغمة تغيّر المعنى تماماً. انقر على الأمثلة لسماع النطق الصحيح.</p>
      <div class="tones-grid">
        ${tones
          .map(
            (t) => `
          <div class="tone-card" style="border-top: 5px solid ${t.color}">
            <div class="tone-header">
              <span class="tone-symbol" style="color: ${t.color}">${t.sym}</span>
              <span class="tone-name">${t.name}</span>
            </div>
            <div class="tone-desc">${t.desc}</div>
            <div class="tone-examples">
              ${t.ex
                .map(
                  (ex) => `
                <div class="tone-example" onclick="playAudio('${ex.zh}')">
                  <span class="ex-zh">${ex.zh}</span>
                  <span class="ex-py">${ex.py}</span>
                  <span class="ex-ar">${ex.ar}</span>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
      <div class="tone-tip">
        <span class="tip-icon">💡</span>
        <span class="tip-text">انقر على أي مثال لسماع النطق. حاول تقليد النغمة كما تسمعها.</span>
      </div>
    </div>
  `;
}

function renderPinyinPage() {
  return renderPinyinBasics() + renderTones();
}
// =========================================================================
// نظام الفلاش كارد (Flashcards)
// =========================================================================
function initFlashcards(topicN) {
  fcState.topic = topicN;
  fcState.idx = 0;
  fcState.flipped = false;
  fcState.filtered = topicN === 0 ? W : W.filter((w) => w[4] === topicN);
  renderFC();
}

function renderFC() {
  const n = fcState.topic;
  const card = document.getElementById(`fc_card_${n}`);
  const counter = document.getElementById(`fc_counter_${n}`);
  const learnBtn = document.getElementById(`fc_learned_btn_${n}`);
  if (!card) return;
  const w = fcState.filtered[fcState.idx];
  if (!w) return;
  const learned = learnedWords.has(w[0]);

  card.innerHTML = `
        <div class="fc-inner ${fcState.flipped ? "flipped" : ""}" onclick="flipCard('fc_${n}')">
          <div class="fc-front">
            <div class="fc-hanzi">${w[0]}</div>
            <div class="fc-py" style="display:${showPinyin ? "block" : "none"}">${w[1]}</div>
            <div class="fc-type">${w[3] || ""}</div>
            <div class="fc-hint">اضغط للترجمة 👆</div>
          </div>
          <div class="fc-back">
            <div class="fc-arabic">${w[2]}</div>
            <div class="fc-hanzi-sm">${w[0]}</div>
            <div class="fc-py-sm">${w[1]}</div>
            <div class="fc-hint">اضغط للرجوع 👆</div>
          </div>
        </div>`;

  if (counter)
    counter.textContent = `${fcState.idx + 1} / ${fcState.filtered.length}`;
  if (learnBtn) {
    learnBtn.textContent = learned ? "✅ تم الحفظ" : "🔖 احفظها";
    learnBtn.className = "btn-learned" + (learned ? " learned" : "");
  }
}

function fcPrev() {
  if (fcState.idx > 0) {
    fcState.idx--;
    fcState.flipped = false;
    renderFC();
  }
}

function fcNext() {
  if (fcState.idx < fcState.filtered.length - 1) {
    fcState.idx++;
    fcState.flipped = false;
    renderFC();
  }
}

function toggleLearned() {
  const w = fcState.filtered[fcState.idx];
  if (!w) return;
  if (learnedWords.has(w[0])) {
    learnedWords.delete(w[0]);
  } else {
    learnedWords.add(w[0]);
  }
  saveProgress();
  updateProgressBar();
  updateVocabCounts();
  renderFC();
}

function jumpToFC(topicN, word) {
  // التأكد من أن الفلتر يحتوي على كلمات الموضوع الصحيح
  if (
    fcState.topic !== topicN ||
    !fcState.filtered ||
    fcState.filtered.length === 0
  ) {
    fcState.topic = topicN;
    fcState.filtered = W.filter((w) => w[4] === topicN);
    fcState.idx = 0;
    fcState.flipped = false;
  }

  // البحث عن الكلمة المطلوبة
  const idx = fcState.filtered.findIndex((w) => w[0] === word);
  if (idx >= 0) {
    fcState.idx = idx;
    fcState.flipped = false;
  } else {
    fcState.idx = 0; // إذا لم توجد، نبدأ من أول كلمة
  }

  // إعادة رسم الفلاش كارد
  renderFC();

  // تبديل التبويب إلى "words" يدويًا دون استدعاء showSTab
  // إخفاء جميع التبويبات الأخرى وإظهار تبويب المفردات فقط
  document.querySelectorAll(`#topic_${topicN} .stab`).forEach((btn, i) => {
    const tabName = ["words", "sents", "dialog", "quiz"][i];
    btn.classList.toggle("active", tabName === "words");
  });

  ["words", "sents", "dialog", "quiz"].forEach((t) => {
    const el = document.getElementById(`stab_${topicN}_${t}`);
    if (el) el.classList.toggle("hidden", t !== "words");
  });
}

// =========================================================================
// عرض الحوارات والجمل
// =========================================================================
function renderDialogue(n) {
  const dialogs = DIALOGUES[n] || [];
  if (!dialogs.length)
    return '<p class="no-dialog">لا يوجد حوار لهذا الدرس.</p>';

  return dialogs
    .map(
      (d) => `
    <div class="dialog-box">
      <h5 class="dialog-title">💬 ${d.title}</h5>
      ${d.lines
        .map(
          (l) => `
        <div class="dialog-line" data-speaker="${l.sp}">
          <span class="spk-badge spk-${l.sp}">${d.speakers[l.sp]}</span>
          <div class="line-content">
            <div class="line-zh" onclick="playAudio('${l.zh.replace(/'/g, "\\'")}')">
              ${l.zh} <span class="audio-icon">🔊</span>
            </div>
            <div class="line-py py" style="display:${showPinyin ? "block" : "none"}">${l.py}</div>
            <div class="line-ar">${l.ar}</div>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  `,
    )
    .join("");
}

// =========================================================================
// عرض القواعد
// =========================================================================
function renderGrammarRule(g) {
  const qid = `gram_q_${g.id}`;
  let qs = g.q || [];
  let qhtml = "";
  if (qs.length) {
    window[qid + "_questions"] = [...qs];
    window[qid + "_orig"] = [...qs];
    window[qid + "_state"] = {
      idx: 0,
      score: 0,
      answered: false,
      total: qs.length,
      id: qid,
    };
    qhtml = `<div class="gram-quiz-section"><h5>🧪 اختبر نفسك</h5><div id="${qid}">`;
    const q = qs[0];
    qhtml += `<div class="quiz-header">
          <span class="quiz-prog">1 / ${qs.length}</span>
          <div class="prog-bar"><div class="prog-fill" style="width:0%"></div></div>
        </div>
        <div class="quiz-q"><p class="q-text">${q.q}</p>
        ${q.zh ? `<div class="q-zh">${zhSpan(q.zh, q.py || "")}</div>` : ""}
        </div>
        <div class="opts" id="${qid}_opts">`;
    q.opts.forEach(
      (o, i) =>
        (qhtml += `<button class="opt-btn" onclick="answerQuiz('${qid}',${i})">${o}</button>`),
    );
    qhtml += `</div><div id="${qid}_exp" class="quiz-exp hidden"></div>
        <div id="${qid}_nav" class="quiz-nav hidden"><button class="btn-next" onclick="nextQuestion('${qid}')">${qs.length > 1 ? "التالي ←" : "النتيجة 🏆"}</button></div>`;
    qhtml += `</div></div>`;
  }

  return `<div class="gram-card" id="gram_${g.id}" style="border-top:4px solid ${g.color}">
        <div class="gram-head" onclick="toggleGram(${g.id})">
          <span class="gram-num">${g.id}</span>
          <div class="gram-titles">
            <span class="gram-title-ar">${g.title}</span>
            <span class="gram-title-en">${g.en}</span>
          </div>
          <span class="gram-formula">${g.formula}</span>
          <span class="gram-arrow" id="garrow_${g.id}">▼</span>
        </div>
        <div class="gram-body hidden" id="gbody_${g.id}">
          <p class="gram-exp">${g.exp}</p>
          <div class="gram-rules"><ul>${g.rules.map((r) => `<li>${r}</li>`).join("")}</ul></div>
          <div class="gram-examples">
            <h5>📝 أمثلة</h5>
            ${g.ex
              .map(
                (
                  e,
                ) => `<div class="gram-ex-row" onclick="playAudio('${e[0].replace(/'/g, "\\'")}')" style="cursor:pointer;" title="استمع">
              <div class="gram-ex-zh">${zhSpan(e[0], e[1])} <span style="font-size:.7rem;opacity:.5">🔊</span></div>
              <div class="gram-ex-ar">${e[2]}</div>
              ${e[3] ? `<div class="gram-ex-note">💡 ${e[3]}</div>` : ""}
            </div>`,
              )
              .join("")}
          </div>
          ${qhtml}
        </div>
      </div>`;
}

function toggleGram(id) {
  const body = document.getElementById("gbody_" + id);
  const arrow = document.getElementById("garrow_" + id);
  const isOpen = !body.classList.contains("hidden");
  body.classList.toggle("hidden");
  arrow.textContent = isOpen ? "▼" : "▲";
  arrow.style.background = isOpen ? "#1a1a2e" : "#c0392b";
}

// =========================================================================
// توليد أسئلة ديناميكية لكل موضوع
// =========================================================================
function generateDynamicQuiz(topicNum) {
  const words = W.filter((w) => w[4] === topicNum);
  if (words.length === 0) return [];
  const questions = [];
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(15, words.length));
  selected.forEach((w) => {
    // سؤال عن المعنى
    let wrong = words
      .filter((x) => x[2] !== w[2])
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((x) => x[2]);
    while (wrong.length < 3) wrong.push("......");
    const opts = [w[2], ...wrong].sort(() => Math.random() - 0.5);
    questions.push({
      q: `ما معنى "${w[0]}" ؟`,
      zh: w[0],
      py: w[1],
      opts: opts,
      a: opts.indexOf(w[2]),
      exp: `الكلمة "${w[0]}" (${w[1]}) تعني "${w[2]}".`,
    });
    // سؤال عن الترجمة من العربية للصينية
    let wrongHanzi = words
      .filter((x) => x[2] !== w[2])
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((x) => x[0]);
    while (wrongHanzi.length < 3) wrongHanzi.push("？");
    const hanziOpts = [w[0], ...wrongHanzi].sort(() => Math.random() - 0.5);
    questions.push({
      q: `أي من هذه الكلمات تعني "${w[2]}" ؟`,
      zh: "",
      py: "",
      opts: hanziOpts,
      a: hanziOpts.indexOf(w[0]),
      exp: `الكلمة الصحيحة هي "${w[0]}" (${w[1]}).`,
    });
  });
  return questions.sort(() => Math.random() - 0.5).slice(0, 15);
}

// =========================================================================
// عرض صفحة الموضوع (Topic)
// =========================================================================
function renderTopic(n) {
  const t = TOPICS[n - 1];
  const words = W.filter((w) => w[4] === n);
  const sents = SENTS[n] || [];
  const quizQs = generateDynamicQuiz(n);
  const qid = `topic_q_${n}`;

  window[qid + "_questions"] = [...quizQs].sort(() => Math.random() - 0.5);
  window[qid + "_orig"] = [...quizQs];
  window[qid + "_state"] = {
    idx: 0,
    score: 0,
    answered: false,
    total: quizQs.length,
    id: qid,
  };

  let html = `<div class="topic-section" id="topic_${n}">
        <div class="topic-header" style="background:var(--r)">
          <div class="topic-header-inner">
            <span class="topic-num">${n}</span>
            <div>
              <div class="topic-zh-title">${t.h}</div>
              <div class="topic-ar-title">${t.t}</div>
              <div class="topic-en-title">${t.s}</div>
            </div>
          </div>
          <button class="py-toggle white-py" onclick="togglePinyin()">${showPinyin ? "إخفاء Pinyin 👁️" : "إظهار Pinyin 👁️"}</button>
        </div>
        
        <div class="section-tabs">
          <button class="stab active" onclick="showSTab(${n},'words')">📚 المفردات (${words.length})</button>
          <button class="stab" onclick="showSTab(${n},'sents')">📖 جمل</button>
          <button class="stab" onclick="showSTab(${n},'dialog')">💬 حوار</button>
          <button class="stab" onclick="showSTab(${n},'quiz')">🧪 اختبار</button>
        </div>
        
        <div class="stab-content" id="stab_${n}_words">
          <div class="fc-container">
            <div class="fc-controls">
              <button onclick="fcPrev()" class="fc-nav-btn">← السابق</button>
              <span id="fc_counter_${n}" class="fc-count">1 / ${words.length}</span>
              <button onclick="fcNext()" class="fc-nav-btn">التالي →</button>
            </div>
            <div id="fc_card_${n}" class="fc-card-wrap"></div>
            <div class="fc-actions">
              <button id="fc_learned_btn_${n}" class="btn-learned" onclick="toggleLearned()">🔖 احفظها (SRS)</button>
              <button class="btn-shuffle" onclick="initFlashcards(${n})">🔀 ابدأ من أول</button>
            </div>
            <div class="word-grid">
              ${words
                .map(
                  (
                    w,
                  ) => `<div class="word-card" onclick="playAudio('${w[0].replace(/'/g, "\\'")}'); jumpToFC(${n}, '${w[0].replace(/'/g, "\\'")}')">
                <div class="wc-zh">${w[0]}</div>
                <div class="wc-py py" style="display:${showPinyin ? "block" : "none"}">${w[1]}</div>
                <div class="wc-ar">${w[2]}</div>
                <div class="wc-type">${w[3] || ""}</div>
              </div>`,
                )
                .join("")}
            </div>
          </div>
        </div>
        
        <div class="stab-content hidden" id="stab_${n}_sents">
          ${sents
            .map(
              (s) => `<div class="sent-card">
            <div class="sent-zh" onclick="playAudio('${s[0].replace(/'/g, "\\'")}');" style="cursor:pointer;" title="انقر للسماع">${zhSpan(s[0], s[1])} <span style="font-size:.75rem;opacity:.45">🔊</span></div>
            <div class="sent-ar">${s[2]}</div>
            ${s[3] ? `<div class="sent-note">💡 ${s[3]}</div>` : ""}
          </div>`,
            )
            .join("")}
        </div>
        
        <div class="stab-content hidden" id="stab_${n}_dialog">
          ${renderDialogue(n)}
        </div>
        
        <div class="stab-content hidden" id="stab_${n}_quiz">
          <div id="${qid}" class="quiz-wrap">`;

  if (quizQs.length) {
    const q = window[qid + "_questions"][0];
    html += `<div class="quiz-header">
          <span class="quiz-prog">1 / ${quizQs.length}</span>
          <button class="py-toggle" onclick="togglePinyin()">${showPinyin ? "إخفاء Pinyin 👁️" : "إظهار Pinyin 👁️"}</button>
          <div class="prog-bar"><div class="prog-fill" style="width:0%"></div></div>
        </div>
        <div class="quiz-q"><p class="q-text">${q.q}</p>
        ${q.zh ? `<div class="q-zh">${zhSpan(q.zh, q.py || "")}</div>` : ""}
        </div>
        <div class="opts" id="${qid}_opts">`;
    q.opts.forEach(
      (o, i) =>
        (html += `<button class="opt-btn" onclick="answerQuiz('${qid}',${i}); updateWordSRS('${q.zh || ""}', ${i}===window['${qid}_questions'][window['${qid}_state'].idx].a);">${o}</button>`),
    );
    html += `</div><div id="${qid}_exp" class="quiz-exp hidden"></div>
        <div id="${qid}_nav" class="quiz-nav hidden"><button class="btn-next" onclick="nextQuestion('${qid}')">التالي ←</button></div>`;
  } else {
    html += `<p style="color:#999;text-align:center;padding:2rem">الاختبار قيد الإعداد...</p>`;
  }
  html += `</div></div></div></div>`;
  return html;
}

function showSTab(n, tab) {
  ["words", "sents", "dialog", "quiz"].forEach((t) => {
    const el = document.getElementById(`stab_${n}_${t}`);
    if (el) el.classList.toggle("hidden", t !== tab);
  });
  const tabs = document.querySelectorAll(`#topic_${n} .stab`);
  tabs.forEach((b, i) =>
    b.classList.toggle(
      "active",
      ["words", "sents", "dialog", "quiz"][i] === tab,
    ),
  );
  if (tab === "words") initFlashcards(n); // هذا يجب أن يكون موجوداً
}
// =========================================================================
// دوال الصفحات الرئيسية
// =========================================================================
function renderIntro() {
  let isEn = currentLang === "en";
  let html = `
        <div class="intro-page">
          <div class="intro-hero">
            <div class="intro-title-zh">汉语</div>
            <div class="intro-title-ar">${isEn ? "Learn Chinese Language" : "تعلم اللغة الصينية"}</div>
            <div class="intro-sub">${isEn ? "Level One HSK 1 — Comprehensive" : "المستوى الأول HSK 1 — المنهج الشامل"}</div>
          </div>
          
          <div style="background:#fff; padding:20px; border-radius:12px; margin:20px 0; line-height:1.8; color:#333; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
            <h3 style="color:#d32f2f; margin-top:0; margin-bottom:10px;">${isEn ? "Platform Features:" : "أقسام ومميزات المنصة:"}</h3>
            <ul style="list-style-type:none; padding:0; margin:0; ${isEn ? "text-align:left" : "text-align:right"}; direction:${isEn ? "ltr" : "rtl"};">
              <li style="margin-bottom:10px;">📚 <strong>${isEn ? "Vocabulary (500 Words):" : "المفردات (500 كلمة):"}</strong> ${isEn ? "Interactive flashcards with Spaced Repetition System (SRS) to track and master your vocabulary." : "بطاقات تفاعلية مع نظام التكرار المتباعد (SRS) المعزز بنقاط الخبرة لتسريع الحفظ وتثبيته."}</li>
              <li style="margin-bottom:10px;">📐 <strong>${isEn ? "Grammar:" : "القواعد:"}</strong> ${isEn ? "All HSK 1 rules explained simply with audio examples and interactive quizzes." : "شرح مفصل ومبسط لكل قواعد HSK 1 مع أمثلة صوتية واختبارات لضمان الفهم."}</li>
              <li style="margin-bottom:10px;">🦻 <strong>${isEn ? "Voice Shadowing:" : "الترديد الصوتي:"}</strong> ${isEn ? "Listen to native speakers and shadow them at normal or slow speed to perfect your pronunciation." : "طور نطقك من خلال الاستماع والترديد خلف المتحدث الأصلي بسرعات مختلفة (طبيعي / بطيء)."}</li>
              <li style="margin-bottom:10px;">🔊 <strong>${isEn ? "Smart Translator:" : "المترجم الذكي:"}</strong> ${isEn ? "Translate Chinese words/sentences instantly into Arabic/English with Pinyin breakdown." : "فكك الجمل الصينية المعقدة، اعرف معانيها نطقها الصحيح بنظام البينيين."}</li>
            </ul>
            <div class="tip" style="margin-top:15px; border-radius:8px;">💡 <strong>${isEn ? "Bonus Tip:" : "تلميح:"}</strong> ${isEn ? "Practice daily to keep your learning streak 🔥 and earn max XP!" : "تصفح المنصة وحل الاختبارات يومياً للحفاظ على شعلتك 🔥 وزيادة نقاطك الـ XP!"}</div>
          </div>

          <div class="stats-row">
            <div class="stat-box"><div class="stat-num">500</div><div class="stat-label">${isEn ? "Words" : "كلمة"}</div></div>
            <div class="stat-box"><div class="stat-num">15</div><div class="stat-label">${isEn ? "Topics" : "موضوعاً"}</div></div>
            <div class="stat-box"><div class="stat-num" id="learned_count">${learnedWords.size}</div><div class="stat-label">${isEn ? "Learned" : "محفوظة"}</div></div>
            <div class="stat-box"><div class="stat-num">15</div><div class="stat-label">${isEn ? "Grammar Rules" : "قاعدة نحوية"}</div></div>
          </div>
          <div class="progress-wrap">
            <div class="progress-label">${isEn ? "Your Progress:" : "تقدمك:"} ${learnedWords.size} / 500</div>
            <div class="progress-track"><div class="prog-fill" style="width:${Math.round((learnedWords.size / 500) * 100)}%"></div></div>
          </div>
          <div class="intro-topics">
            <h3>${isEn ? "Learning Modules" : "الوحدات الدراسية"}</h3>
            <div class="topic-grid">
              ${TOPICS.map(
                (
                  t,
                  i,
                ) => `<button class="topic-card-btn" onclick="showTab('t${i + 1}')">
                <span class="tcb-num">${i + 1}</span>
                <span class="tcb-ar">${isEn && t.s ? t.s : t.t.split(" (")[0]}</span>
              </button>`,
              ).join("")}
            </div>
          </div>
        </div>
      `;
  return html;
}

function renderPinyinBasics() {
  const groups = [
    {
      title: "🔊 الحروف الصوتية البسيطة",
      items: ["a", "o", "e", "i", "u", "ü"],
    },
    {
      title: "🔊 الحروف المركبة",
      items: [
        "ai",
        "ei",
        "ao",
        "ou",
        "ia",
        "ie",
        "ua",
        "uo",
        "üe",
        "iao",
        "iou",
        "uai",
        "uei",
      ],
    },
    {
      title: "🔊 الحروف الأنفية",
      items: [
        "an",
        "en",
        "in",
        "un",
        "ün",
        "ian",
        "uan",
        "uen",
        "üan",
        "ang",
        "eng",
        "ing",
        "ong",
        "iong",
        "iang",
        "uang",
      ],
    },
    {
      title: "🔊 الحروف الساكنة",
      items: [
        "b",
        "p",
        "m",
        "f",
        "d",
        "t",
        "n",
        "l",
        "g",
        "k",
        "h",
        "j",
        "q",
        "x",
        "z",
        "c",
        "s",
        "zh",
        "ch",
        "sh",
        "r",
      ],
    },
  ];
  return `
        <div class="pinyin-page" style="padding:1.5rem; background:#f9f5f0; border-radius:12px;">
          <div style="background: linear-gradient(135deg, #1a1a2e, #c0392b); border-radius: 12px; padding: 1.5rem; color: #fff; margin-bottom: 2rem;">
            <h2 style="margin:0; font-family: 'Noto Serif SC', serif;">拼音速查</h2>
            <p style="opacity:0.9;">أساسيات النطق - انقر على أي زر لسماع الصوت بالصينية</p>
          </div>
          ${groups
            .map(
              (g) => `
            <div class="py-group" style="background:#fdf8f0; padding:1rem; border-radius:8px; margin-bottom:1rem; border-right:3px solid #c0392b;">
              <h5 style="color:#c0392b; margin-top:0;">${g.title}</h5>
              <div style="display:flex; flex-wrap:wrap; gap:0.5rem;">
                ${g.items.map((c) => `<button class="py-card" onclick="speakChinese('${c}', true)">${c}</button>`).join("")}
              </div>
            </div>
          `,
            )
            .join("")}
          <div class="py-group" style="background:#fdf8f0; padding:1rem; border-radius:8px; margin-bottom:1rem; border-right:3px solid #c0392b;">
            <h5 style="color:#c0392b; margin-top:0;">🎵 النغمات (انقر لسماع مثال)</h5>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
              <button class="py-card" style="background:#e3f0ff;" onclick="speakChinese('mā', true)">mā (أم)</button>
              <button class="py-card" style="background:#fff0e0;" onclick="speakChinese('má', true)">má (قنب)</button>
              <button class="py-card" style="background:#e6f3e6;" onclick="speakChinese('mǎ', true)">mǎ (حصان)</button>
              <button class="py-card" style="background:#ffe6e6;" onclick="speakChinese('mà', true)">mà (يشتم)</button>
              <button class="py-card" style="background:#f0f0f0;" onclick="speakChinese('ma', true)">ma (أداة)</button>
            </div>
          </div>
          <div class="tip" style="margin-top:1rem;">💡 تذكر: النغمة تغير المعنى تماماً! مثلاً 妈 (mā) = أم، 马 (mǎ) = حصان.</div>
        </div>
      `;
}

function renderTones() {
  const tones = [
    {
      n: 1,
      name: "النغمة الأولى",
      sym: "ā",
      desc: "صوت مسطح ثابت ومرتفع",
      color: "#e74c3c",
      ex: [
        ["妈", "mā", "أم"],
        ["书", "shū", "كتاب"],
      ],
    },
    {
      n: 2,
      name: "النغمة الثانية",
      sym: "á",
      desc: 'صوت صاعد (كأنك تسأل "آه؟")',
      color: "#3498db",
      ex: [
        ["国", "guó", "بلد"],
        ["人", "rén", "إنسان"],
      ],
    },
    {
      n: 3,
      name: "النغمة الثالثة",
      sym: "ǎ",
      desc: "صوت هابط ثم صاعد",
      color: "#27ae60",
      ex: [
        ["你", "nǐ", "أنت"],
        ["我", "wǒ", "أنا"],
      ],
    },
    {
      n: 4,
      name: "النغمة الرابعة",
      sym: "à",
      desc: "صوت هابط قاطع",
      color: "#8e44ad",
      ex: [
        ["是", "shì", "يكون"],
        ["去", "qù", "يذهب"],
      ],
    },
    {
      n: 0,
      name: "النغمة المحايدة",
      sym: "a",
      desc: "صوت قصير خفيف",
      color: "#7f8c8d",
      ex: [
        ["吧", "ba", "أداة"],
        ["吗", "ma", "؟"],
      ],
    },
  ];
  return `
        <div class="tones-page">
          <h2>🎵 النغمات الأربع في الصينية</h2>
          <p class="tones-intro">الصينية لغة نغمية — نفس الصوت بنبرة مختلفة يعني كلمات مختلفة تماماً!</p>
          <div class="tones-grid">
            ${tones
              .map(
                (t) => `
              <div class="tone-card" style="border-top:4px solid ${t.color}">
                <div class="tone-symbol" style="color:${t.color}">${t.sym}</div>
                <div class="tone-name">${t.name}</div>
                <div class="tone-desc">${t.desc}</div>
                <div class="tone-examples">
                  ${t.ex.map((e) => `<span class="tone-ex" onclick="speakChinese('${e[0]}')">${e[0]} <em>${e[1]}</em> = ${e[2]}</span>`).join("")}
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
          <div class="tone-tip">
            <h4>💡 نصيحة:</h4>
            <p>انقر على أي مثال لسماع النطق الصحيح.</p>
          </div>
        </div>
      `;
}

function renderGrammar() {
  return `
        <div class="page-header">
          <h2>📐 القواعد الأساسية — HSK 1</h2>
          <p>15 قاعدة أساسية شاملة مع أمثلة وتمارين</p>
        </div>
        ${GRAMMAR.map((g) => renderGrammarRule(g)).join("")}
      `;
}

function renderVocab() {
  return `
        <div class="section-card" style="background:#fff; border-radius:12px; padding:1rem;">
          <div class="section-title">📖 جميع الكلمات (500)</div>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:1rem;">
            <button class="py-toggle" onclick="togglePinyin()">${showPinyin ? "إخفاء Pinyin 👁️" : "إظهار Pinyin 👁️"}</button>
            <button class="btn-sec" onclick="filterVocab('all')">الكل</button>
            <button class="btn-sec" onclick="filterVocab('learned')">المحفوظة ✅</button>
            <button class="btn-sec" onclick="filterVocab('new')">الجديدة 🆕</button>
          </div>
          <div class="big-word-grid" id="vocab-grid"></div>
        </div>
      `;
}

function filterVocab(filter) {
  const grid = document.getElementById("vocab-grid");
  if (!grid) return;
  let words =
    filter === "all"
      ? W
      : filter === "learned"
        ? W.filter((w) => learnedWords.has(w[0]))
        : W.filter((w) => !learnedWords.has(w[0]));
  grid.innerHTML = words
    .map((w) => {
      const isLearned = learnedWords.has(w[0]);
      return `
          <div class="big-wc ${isLearned ? "learned" : ""}" onclick="speakChinese('${w[0]}'); toggleWordLearned('${w[0]}', this)">
            <div class="bwc-num">${W.indexOf(w) + 1}</div>
            <div class="bwc-zh">${w[0]}</div>
            <div class="bwc-py py" style="display:${showPinyin ? "block" : "none"}">${w[1]}</div>
            <div class="bwc-type">${w[3] || ""}</div>
          </div>
        `;
    })
    .join("");
}

function toggleWordLearned(word, el) {
  if (learnedWords.has(word)) {
    learnedWords.delete(word);
    el.classList.remove("learned");
  } else {
    learnedWords.add(word);
    el.classList.add("learned");
  }
  saveProgress();
  updateProgressBar();
}

function renderSmartTranslator() {
  let isEn = currentLang === "en";
  return `
        <div class="smart-translator">
          <div class="st-title">🔊 ${isEn ? "Smart Translator" : "المترجم الذكي"}</div>
          <p style="text-align:center;color:#666;font-size:0.9rem;margin-bottom:15px;">${isEn ? "Paste Chinese text here for translation, dictionary lookups, and Pinyin breakdown" : "ضع أي نص صيني هنا ليتم تفكيكه، ترجمته، ومعرفة النطق"}</p>
          <textarea id="translator-input" class="st-input" placeholder="${isEn ? "Enter Chinese phrase (e.g. 你好)" : "أدخل نصاً صينياً... (مثال: 你好)"}">你好</textarea>
          <div class="st-buttons">
            <button class="st-btn" onclick="translateText()">🔍 ${isEn ? "Analyze" : "شرح وتحليل"}</button>
            <button class="st-btn secondary" onclick="speakChinese(document.getElementById('translator-input').value)">🔊 ${isEn ? "Speak" : "تحدث"}</button>
            <button class="st-btn secondary" onclick="clearTranslator()" style="background:#e74c3c;">✨ ${isEn ? "Clear" : "مسح"}</button>
          </div>
          <div class="speed-slider">
            <span>🐢</span>
            <input type="range" id="rateSlider" min="0.5" max="1.8" value="0.9" step="0.1" style="flex:1;">
            <span>🐇</span>
          </div>
          <div id="translation-output" class="analysis-area">
            <div class="analysis-grid" id="analysis-output"></div>
          </div>
          <div class="info-panel" style="margin-top:1rem;">
            <p>ℹ️ اضغط على أي كلمة لسماع نطقها. الترجمة العربية مأخوذة من قاعدة بيانات HSK1.</p>
          </div>
        </div>
      `;
}

// Build a combined dictionary map from FULL_DICT (HSK 1-6) + W (local words)
function buildLookupMap() {
  const map = new Map();
  // Load local HSK1 words first (they have Arabic translations)
  (W || []).forEach((w) =>
    map.set(w[0], {
      zh: w[0],
      py: w[1],
      ar: w[2],
      en: w[2],
      level: 1,
      type: w[3] || "",
    }),
  );
  // Layer on FULL_DICT (English only) for words not already known
  (typeof FULL_DICT !== "undefined" ? FULL_DICT : []).forEach((w) => {
    if (!map.has(w.zh)) {
      map.set(w.zh, {
        zh: w.zh,
        py: w.py,
        ar: w.en,
        en: w.en,
        level: w.level || 0,
      });
    }
  });
  return map;
}

function clearTranslator() {
  const input = document.getElementById("translator-input");
  if (input) input.value = "";
  const output = document.getElementById("analysis-output");
  if (output) output.innerHTML = "";
  const sentence = document.getElementById("sentence-trans");
  if (sentence) sentence.innerHTML = "";
}
window.clearTranslator = clearTranslator;

window.translateText = async function () {
  const text = document.getElementById("translator-input")?.value?.trim();
  if (!text) return;
  const isEn = currentLang === "en";

  // Find the result containers
  const output =
    document.getElementById("analysis-output") ||
    document.getElementById("trans-res");
  if (!output) return;
  output.innerHTML = `<div style="text-align:center;padding:20px;color:#888;">${isEn ? "Analyzing..." : "جارٍ التحليل..."} ⏳</div>`;

  const dictMap = buildLookupMap();
  const sortedDict = [...dictMap.keys()].sort((a, b) => b.length - a.length);

  // Build word chips
  let chipsHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;padding-bottom:15px;border-bottom:2px dashed #eee;">`;
  let i = 0;
  while (i < text.length) {
    let matched = false;
    for (let zh of sortedDict) {
      if (text.startsWith(zh, i)) {
        const entry = dictMap.get(zh);
        const levelLabel = entry.level ? `HSK${entry.level}` : "";
        const typeLabel = entry.type || "";
        const translation = isEn ? entry.en : entry.ar;
        chipsHTML += `<div class="word-chip" onclick="speakChinese('${zh.replace(/'/g, "\\'")}')" title="${isEn ? "Click to pronounce" : "انقر للنطق"}">
              <div class="chip-hanzi">${zh}</div>
              <div class="chip-pinyin">${entry.py}</div>
              <div class="chip-ar">${translation}</div>
              ${levelLabel ? `<div style="font-size:0.6rem;color:#999;">${levelLabel}</div>` : ""}
              ${typeLabel ? `<div style="font-size:0.6rem;color:#999;">${typeLabel}</div>` : ""}
            </div>`;
        i += zh.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      const char = text[i];
      if (/[\s،，。！？、；：""''（）\.,!?]/.test(char)) {
        chipsHTML += `<span class="punct">${char}</span>`;
      } else {
        chipsHTML += `<div class="word-chip unknown" onclick="speakChinese('${char}')">
              <div class="chip-hanzi">${char}</div>
              <div class="chip-pinyin">?</div>
              <div class="chip-ar">${isEn ? "Unknown" : "غير معروف"}</div>
            </div>`;
      }
      i++;
    }
  }
  chipsHTML += `</div>`;

  output.innerHTML =
    chipsHTML +
    `<div id="sentence-trans" style="margin-top:10px;">
        <div style="text-align:center;color:#888;font-size:.9rem;">${isEn ? "Loading sentence translation..." : "جارٍ تحميل ترجمة الجملة..."} ⏳</div>
      </div>`;

  // Fetch full sentence translation from MyMemory API
  const targetLang = isEn ? "en" : "ar";
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=zh|${targetLang}`;
    const res = await fetch(url);
    const data = await res.json();
    const translatedText = data?.responseData?.translatedText || "—";
    document.getElementById("sentence-trans").innerHTML = `
          <div style="background:#f0f8ff;border-right:4px solid #1a5276;padding:15px;border-radius:8px;">
            <div style="font-size:.8rem;color:#777;margin-bottom:5px;">${isEn ? "📖 Full Sentence Translation:" : "📖 ترجمة الجملة كاملة:"}</div>
            <div style="font-size:1.2rem;font-weight:bold;color:#1a5276;">${translatedText}</div>
          </div>`;
  } catch (e) {
    document.getElementById("sentence-trans").innerHTML =
      `<div style="color:#e74c3c;padding:10px;">${isEn ? "⚠️ Translation unavailable (offline?)" : "⚠️ الترجمة غير متاحة (هل أنت متصل؟)"}</div>`;
  }
};

function renderBigExam() {
  return `
        <div class="bigexam-page">
          <div class="exam-hero">
            <h2>🏆 الامتحان الشامل</h2>
            <p>100 سؤالاً يغطي جميع المواضيع والقواعد</p>
          </div>
          <div id="bigexam" class="quiz-wrap">
            <div class="exam-start">
              <p>هل أنت مستعد للاختبار الشامل؟ اضغط للبدء!</p>
              <button class="btn-start-exam" onclick="startBigExam()">🚀 ابدأ الامتحان</button>
            </div>
          </div>
        </div>
      `;
}

function startBigExam() {
  const shuffled = [...BIGEXAM].sort(() => Math.random() - 0.5);
  window["bigexam_orig"] = shuffled;
  window["bigexam_questions"] = [...shuffled];
  window["bigexam_state"] = {
    idx: 0,
    score: 0,
    answered: false,
    total: shuffled.length,
    id: "bigexam",
  };
  renderQuestion("bigexam");
}

// =========================================================================
// بناء قائمة الشريط الجانبي
// =========================================================================
function buildNav() {
  const navEl = document.getElementById("top_nav");
  if (!navEl) return;
  const isEn = currentLang === "en";

  // قائمة العناصر الرئيسية مع إضافة pinyin
  const items = [
    ["home", "🏠", isEn ? "Home" : "الرئيسية"],
    ["lessons", "📚", isEn ? "Lessons" : "الدروس"],
    ["pinyin", "🔤", isEn ? "Pinyin Basics" : "أساسيات Pinyin"], // هذا السطر الجديد
    ["vocab", "📖", isEn ? "Vocabulary" : "المفردات"],
    ["grammar", "📐", isEn ? "Grammar" : "القواعد"],
    ["dialogs", "💬", isEn ? "Dialogs" : "الحوارات"],
    ["flashcards", "🃏", isEn ? "Flashcards" : "البطاقات"],
    ["stories", "📖", isEn ? "Stories" : "قصص"],
    ["tests", "🧪", isEn ? "Tests" : "الاختبارات"],
    ["review", "📝", isEn ? "Review" : "مراجعة الكلمات"],
    ["progress", "📊", isEn ? "Progress" : "التقدم"],
    ["translator", "🔊", isEn ? "Translator" : "المترجم الذكي"],
    ["profile", "👤", isEn ? "Profile" : "الملف"],
  ];

  // بناء الأزرار
  navEl.innerHTML = items
    .map(
      ([id, icon, label]) =>
        `<button class="nav-item ${currentTab === id ? "active" : ""}" data-tab="${id}" onclick="showTab('${id}')">${icon} ${label}</button>`,
    )
    .join("");
}

// =========================================================================
// بناء إطارات المحتوى
// =========================================================================
function buildContentFrames() {
  const mainArea = document.getElementById("main_area");
  let html = "";

  html += `<div id="sec-intro" class="sec active" style="padding:.5rem">${renderIntro()}</div>`;
  html += `<div id="sec-pinyin" class="sec" style="padding:.5rem">${renderPinyinBasics()}</div>`;
  html += `<div id="sec-tones" class="sec" style="padding:.5rem">${renderTones()}</div>`;
  html += `<div id="sec-grammar" class="sec" style="padding:.5rem">${renderGrammar()}</div>`;
  html += `<div id="sec-vocab" class="sec" style="padding:.5rem">${renderVocab()}</div>`;
  html += `<div id="sec-shadowing" class="sec" style="padding:.5rem">${renderShadowing()}</div>`;
  html += `<div id="sec-stories" class="sec">${renderStoriesPage()}</div>`;
  html += `<div id="sec-translator" class="sec" style="padding:.5rem">${renderSmartTranslator()}</div>`;
  html += `<div id="sec-bigexam" class="sec" style="padding:.5rem">${renderBigExam()}</div>`;

  for (let i = 1; i <= 15; i++) {
    html += `<div id="sec-t${i}" class="sec">${renderTopic(i)}</div>`;
  }

  mainArea.innerHTML = html;
}

// =========================================================================
// عرض التبويب المحدد
// =========================================================================

function renderShadowing() {
  let isEn = currentLang === "en";
  let html = `<div class="page-header">
        <h2>🦻 ${isEn ? "Shadowing Unit" : "الترديد الصوتي"} (Shadowing)</h2>
        <p>${isEn ? "Listen to the sentence native speed and tone and try to repeat it" : "استمع للجملة بصوت أصلي ثم حاول تكرارها بنفس النغمة والسرعة لتقوية النطق"}</p>
      </div>
      <div class="tip">💡 <strong>${isEn ? "How shadowing works?" : "كيف يعمل الترديد الصوتي؟"}</strong><br>
      1- ${isEn ? "Listen to the whole module." : "استمع للمقطع كاملاً لتعويد أذنك."}<br>
      2- ${isEn ? "Change speed to 0.5 and repeat slowly." : "غيّر السرعة لـ 0.5 واستمع وردد ببطء عدة مرات."}<br>
      3- ${isEn ? "Return speed to 1.0 and shadow the speaker!" : "أعد السرعة لـ 1.0 وردد بالتزامن مع المتحدث الأصلي!"}</div>
      <div id="shadowing_content">`;

  for (let topicNum in DIALOGUES) {
    let topicTitle =
      TOPICS.find((t) => t.n == topicNum)?.t ||
      (isEn ? "Topic " : "موضوع ") + topicNum;
    if (isEn) topicTitle = TOPICS.find((t) => t.n == topicNum)?.s || topicTitle;

    html += `<div class="shadow-lesson">
          <div class="shadow-header" onclick="this.parentElement.classList.toggle('open')">
            <span>📚 ${topicTitle}</span>
            <span style="font-size:0.8rem">▼ ${isEn ? "Toggle" : "عرض/طي"}</span>
          </div>
          <div class="shadow-body">`;

    DIALOGUES[topicNum].forEach((d) => {
      html += `<h4>${isEn && typeof d.title_en !== "undefined" ? d.title_en : d.title}</h4>`;
      d.lines.forEach((l) => {
        html += `<div class="sent" style="border-right:4px solid #1a5276; background:#f4f9f9;">
                <div class="sent-zh">${l.zh}</div>
                <div class="py" style="display:${showPinyin ? "block" : "none"}; color:#1a5276; font-weight:bold; font-size:0.85rem">${l.py}</div>
                <div class="sent-ar">${isEn ? l.s || l.ar : l.ar}</div>
                <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
                    <button class="btn-sec" onclick="playAudio('${l.zh.replace(/'/g, "\\'").replace(/"/g, "&quot;")}', 1.0)">▶️ ${isEn ? "Normal Speed" : "سرعة طبيعية"}</button>
                    <button class="btn-sec" onclick="playAudio('${l.zh.replace(/'/g, "\\'").replace(/"/g, "&quot;")}', 0.5)">🐢 ${isEn ? "Slow Speed" : "سرعة بطيئة"}</button>
                </div>
              </div>`;
      });
    });
    html += `</div></div>`;
  }

  html += `</div>`;
  return html;
}

// =========================================================================
// عرض التبويب المحدد
// =========================================================================
function showTab(tabId) {
  currentTab = tabId;
  document
    .querySelectorAll(".sec")
    .forEach((sec) => sec.classList.remove("active"));
  const target = document.getElementById(`sec-${tabId}`);
  if (target) {
    target.classList.add("active");
    // Scroll content area to top on tab change
    document.getElementById("content").scrollTo(0, 0);
  }

  // Update sidebar nav
  document
    .querySelectorAll(".nav-tab")
    .forEach((tab) => tab.classList.remove("active"));
  const activeTab = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
  if (activeTab) activeTab.classList.add("active");

  if (tabId === "vocab") {
    filterVocab("all");
  } else if (tabId === "translator") {
    setTimeout(translateText, 100);
  } else if (tabId.startsWith("t")) {
    const num = parseInt(tabId.substring(1));
    initFlashcards(num);
  }
}

// =========================================================================
// التهيئة
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
  buildNav();
  buildContentFrames();
  updateProgressBar();
  showTab("intro");
});

// تصدير الدوال المطلوبة للاستخدام العام
window.showTab = showTab;
window.togglePinyin = togglePinyin;
window.fcPrev = fcPrev;
window.fcNext = fcNext;
window.toggleLearned = toggleLearned;
window.jumpToFC = jumpToFC;
window.showSTab = showSTab;
window.answerQuiz = answerQuiz;
window.nextQuestion = nextQuestion;
window.makeQuizInto = makeQuizInto;
window.startBigExam = startBigExam;
window.speakChinese = speakChinese;
window.filterVocab = filterVocab;
window.toggleWordLearned = toggleWordLearned;
window.toggleGram = toggleGram;
window.flipCard = flipCard;
window.translateText = translateText;

// =========================================================================
// Modern UI Overrides (Top Navbar + Home + Pages)
// =========================================================================

function toggleMenu() {
  const nav = document.getElementById("top_nav");
  if (nav) {
    nav.classList.toggle("active");
  }
}

// إغلاق القائمة عند النقر على أي رابط
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", function () {
    if (window.innerWidth <= 768) {
      document.getElementById("top_nav").classList.remove("active");
    }
  });
});

// إغلاق القائمة عند النقر خارجها
document.addEventListener("click", function (e) {
  const nav = document.getElementById("top_nav");
  const toggle = document.querySelector(".menu-toggle");
  if (window.innerWidth <= 768 && nav && nav.classList.contains("active")) {
    if (!nav.contains(e.target) && !toggle.contains(e.target)) {
      nav.classList.remove("active");
    }
  }
});

// إغلاق القائمة عند تغيير حجم الشاشة إلى كبيرة
window.addEventListener("resize", function () {
  if (window.innerWidth > 768) {
    const nav = document.getElementById("top_nav");
    if (nav) nav.classList.remove("active");
  }
});
window.toggleMenu = toggleMenu;

function getLessonStatus(n) {
  const learned = learnedWords.size;
  const wordsPerLesson = Math.ceil(500 / 15);
  if (learned >= n * wordsPerLesson) return "completed";
  if (n === 1 || learned >= (n - 1) * wordsPerLesson) return "unlocked";
  return "locked";
}

function renderHome() {
  const isEn = currentLang === "en";
  const pct = Math.round((learnedWords.size / 500) * 100);
  const lessons = Array.from({ length: 15 }, (_, i) => i + 1);
  const wordsPerLesson = Math.ceil(500 / 15);
  return `
    <div class="page-wrap">
      <section class="home-hero">
        <div>
          <div class="badge">${isEn ? "HSK1 Arabic-First" : "HSK1 للناطقين بالعربية"}</div>
          <h1 class="hero-title" id="hero-title">${isEn ? "Learn Chinese with Arabic" : "تعلم الصينية بالعربية"}</h1>
          <div class="hero-subtitle" id="hero-subtitle">${isEn ? "Interactive HSK1 Learning Platform" : "منصة تعلم HSK1 التفاعلية"}</div>
          <p class="hero-desc" id="hero-desc">${isEn ? "A clean, structured path for beginners with clear cards, audio, and smart practice." : "مسار واضح للمبتدئين مع بطاقات منظمة وصوت وتمارين ذكية."}</p>
          <div class="hero-actions">
            <button class="btn-primary" onclick="showTab('lessons')">${isEn ? "Start Learning" : "ابدأ التعلم"}</button>
            <button class="btn-ghost" onclick="showTab('vocab')">${isEn ? "Explore Lessons" : "استكشف الدروس"}</button>
          </div>
          <div class="hero-progress">
            <div class="progress-track-modern">
              <div id="gbar" class="progress-fill-modern" style="width:${pct}%"></div>
            </div>
            <div id="glbl" class="progress-label">${isEn ? `Progress: ${pct}%` : `التقدم: ${pct}%`}</div>
          </div>
        </div>
        <div class="hero-card">
          <div class="hanzi">你好</div>
          <div style="text-align:center;color:#666;margin-top:0.4rem;">nǐ hǎo</div>
          <div style="text-align:center;font-weight:700;color:var(--primary);margin-top:0.2rem;">مرحباً</div>
          <div style="margin-top:0.8rem;font-size:0.8rem;color:#777;text-align:center;">
            ${isEn ? "Tap to hear pronunciation" : "اضغط لسماع النطق"}
          </div>
        </div>
      </section>

      <section class="features-grid">
        ${[
          [
            isEn ? "Vocabulary" : "المفردات",
            isEn ? "Build your core HSK1 words" : "بناء المفردات الأساسية",
            "词",
          ],
          [
            isEn ? "Dialogs" : "الحوارات",
            isEn ? "Practice real conversations" : "تدريب على المحادثة",
            "话",
          ],
          [
            isEn ? "Flashcards" : "البطاقات",
            isEn ? "Spaced repetition practice" : "تكرار متباعد للتثبيت",
            "卡",
          ],
          [
            isEn ? "Quizzes" : "الاختبارات",
            isEn ? "Immediate feedback and review" : "تغذية راجعة فورية",
            "测",
          ],
        ]
          .map(
            (f) => `
          <div class="feature-card">
            <div class="feature-icon">${f[2]}</div>
            <div style="font-weight:700;margin-bottom:0.2rem;">${f[0]}</div>
            <div style="color:#666;font-size:0.85rem;">${f[1]}</div>
          </div>
        `,
          )
          .join("")}
      </section>

      <section style="margin-top:1.8rem;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.6rem;">
          <h3 style="margin:0;">${isEn ? "Learning Path" : "مسار التعلم"}</h3>
          <span style="color:#777;font-size:0.8rem;">HSK1</span>
        </div>
        <div class="learning-path">
          ${lessons
            .map((n) => {
              const status = getLessonStatus(n);
              const statusLabel =
                status === "completed"
                  ? isEn
                    ? "Completed"
                    : "مكتمل"
                  : status === "unlocked"
                    ? isEn
                      ? "Unlocked"
                      : "مفتوح"
                    : isEn
                      ? "Locked"
                      : "مغلق";
              const width =
                status === "completed" ? 100 : status === "unlocked" ? 45 : 0;
              return `
              <div class="path-card">
                <div style="font-weight:700;">${isEn ? "Lesson" : "درس"} ${n}</div>
                <div class="progress-track-modern" style="margin-top:0.4rem;">
                  <div class="progress-fill-modern" style="width:${width}%"></div>
                </div>
                <div class="path-status">${statusLabel}</div>
                <button class="btn-sec" onclick="openFullLesson(${n})">${isEn ? "View Full Lesson" : "عرض الدرس الكامل"}</button>
              </div>
            `;
            })
            .join("")}
          <div class="path-card">
            <div style="font-weight:700;">${isEn ? "Final Test" : "الاختبار النهائي"}</div>
            <div class="progress-track-modern" style="margin-top:0.4rem;">
              <div class="progress-fill-modern" style="width:${learnedWords.size >= 15 * wordsPerLesson ? 100 : 0}%"></div>
            </div>
            <div class="path-status">${learnedWords.size >= 15 * wordsPerLesson ? (isEn ? "Unlocked" : "مفتوح") : isEn ? "Locked" : "مغلق"}</div>
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderLessonDetail(n) {
  const isEn = currentLang === "en";
  const words = W.filter((w) => w[4] === n).slice(0, 6);
  const sents = (SENTS[n] || []).slice(0, 2);
  const dialogs = renderDialogue(n);
  return `
    ${fullLessonOpened ? `<button class="btn-sec" onclick="showTab('lessons'); fullLessonOpened=false;">← العودة إلى الدروس</button>` : ""}
    <div class="card">
      <div class="section-title">${isEn ? "Vocabulary" : "المفردات"}</div>
      <div class="vocab-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr));">
        ${words
          .map(
            (w) => `
          <div class="vocab-card">
            <div class="hanzi">${w[0]}</div>
            <div class="py" style="display:${showPinyin ? "block" : "none"};color:var(--primary);font-weight:700;">${formatPinyin(w[1])}</div>
            <div style="color:#444;">${w[2]}</div>
            <div class="vocab-actions">
              <button class="icon-btn primary" onclick="speakChinese('${w[0]}')">${isEn ? "Play" : "استمع"}</button>
              <button class="icon-btn" onclick="toggleWordLearned('${w[0]}', this)">${isEn ? "Save" : "احفظ"}</button>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
      <button class="btn-sec" onclick="showTab('t${n}')">${isEn ? "Open Full Lesson" : "عرض الدرس الكامل"}</button>
    </div>
    <div class="card">
      <div class="section-title">${isEn ? "Example Sentences" : "جمل المثال"}</div>
      ${sents
        .map(
          (s) => `
        <div class="sent">
          <div class="sent-zh" onclick="playAudio('${s[0].replace(/'/g, "\\'")}')" style="cursor:pointer;">${s[0]}</div>
          <div class="sent-py py" style="display:${showPinyin ? "block" : "none"}">${formatPinyin(s[1])}</div>
          <div class="sent-ar">${s[2]}</div>
        </div>
      `,
        )
        .join("")}
    </div>
    <div class="card">
      <div class="section-title">${isEn ? "Grammar" : "القواعد"}</div>
      <p style="color:#666;margin-bottom:0.6rem;">${isEn ? "Review the core rules for this lesson inside the Grammar section." : "راجع القواعد الأساسية لهذا الدرس في قسم القواعد."}</p>
      <button class="btn-sec" onclick="showTab('grammar')">${isEn ? "Go to Grammar" : "اذهب إلى القواعد"}</button>
    </div>
    <div class="card">
      <div class="section-title">${isEn ? "Dialog" : "الحوار"}</div>
      ${dialogs}
    </div>
    <div class="card">
      <div class="section-title">${isEn ? "Quiz" : "الاختبار"}</div>
      <p style="color:#666;margin-bottom:0.6rem;">${isEn ? "Test your understanding with quick questions." : "اختبر فهمك بأسئلة سريعة."}</p>
      <button class="btn-primary" onclick="openLessonQuiz(${n})">${isEn ? "Start Quiz" : "ابدأ الاختبار"}</button>
    </div>
  `;
}

function renderLessons() {
  const isEn = currentLang === "en";
  const lessons = Array.from({ length: 15 }, (_, i) => i + 1);
  return `
    <div class="page-wrap">
      <div class="lesson-layout">
        <aside class="lesson-sidebar">
          <h4 style="margin:0 0 0.6rem;">${isEn ? "Lessons" : "الدروس"}</h4>
          ${lessons
            .map(
              (n) => `
            <button class="lesson-item ${currentLesson === n ? "active" : ""}" onclick="selectLesson(${n})">
              ${isEn ? "Lesson" : "درس"} ${n}: ${isEn ? TOPICS[n - 1].s : TOPICS[n - 1].t}
            </button>
          `,
            )
            .join("")}
          <button class="lesson-item" onclick="showTab('tests')">${isEn ? "Final Test" : "الاختبار النهائي"}</button>
        </aside>
        <div class="lesson-content" id="lesson-detail">
          ${renderLessonDetail(currentLesson)}
        </div>
      </div>
    </div>
  `;
}

function selectLesson(n) {
  currentLesson = n;
  const items = document.querySelectorAll(".lesson-item");
  items.forEach((btn, idx) => {
    const lessonIndex = idx + 1;
    if (lessonIndex <= 15) {
      btn.classList.toggle("active", lessonIndex === n);
    }
  });
  const detail = document.getElementById("lesson-detail");
  if (detail) detail.innerHTML = renderLessonDetail(n);
}
window.selectLesson = selectLesson;

function openLessonQuiz(n) {
  showTab("t" + n);
  setTimeout(() => showSTab(n, "quiz"), 50);
}
window.openLessonQuiz = openLessonQuiz;

function openFullLesson(n) {
  fullLessonOpened = true;
  showTab("lessons");
  selectLesson(n);
}
window.openFullLesson = openFullLesson;

function formatPinyin(pinyin) {
  if (!pinyin) return "";
  const toneMap = {
    ā: 1,
    á: 2,
    ǎ: 3,
    à: 4,
    ē: 1,
    é: 2,
    ě: 3,
    è: 4,
    ī: 1,
    í: 2,
    ǐ: 3,
    ì: 4,
    ō: 1,
    ó: 2,
    ǒ: 3,
    ò: 4,
    ū: 1,
    ú: 2,
    ǔ: 3,
    ù: 4,
    ǖ: 1,
    ǘ: 2,
    ǚ: 3,
    ǜ: 4,
  };
  const toneClass = (syllable) => {
    for (const ch of syllable) {
      if (toneMap[ch]) return toneMap[ch];
    }
    return 0;
  };
  return pinyin
    .split(" ")
    .map((syl) => `<span class="tone-${toneClass(syl)}">${syl}</span>`)
    .join(" ");
}

function zhSpan(hanzi, pinyin) {
  return `<span class="zh-wrap"><span class="hanzi">${hanzi}</span>${pinyin ? '<span class="py" style="display:' + (showPinyin ? "block" : "none") + '">' + formatPinyin(pinyin) + "</span>" : ""}</span>`;
}

function renderDialogue(n) {
  const dialogs = DIALOGUES[n] || [];
  if (!dialogs.length)
    return '<p class="no-dialog">لا يوجد حوار لهذا الدرس.</p>';
  let html = "";
  dialogs.forEach((d) => {
    html += `<div class="dialog-box"><h4 class="dialog-title">${d.title}</h4>`;
    d.lines.forEach((l) => {
      html += `<div class="dialog-line spk-line-${l.sp}">
        <span class="spk-badge spk-${l.sp}">${d.speakers[l.sp].split(" ")[0]}</span>
        <div class="line-content">
          <div class="line-zh">${l.zh}</div>
          <div class="line-py py" style="display:${showPinyin ? "block" : "none"}">${formatPinyin(l.py)}</div>
          <div class="line-ar">${l.ar}</div>
          <div style="margin-top:0.4rem;">
            <button class="icon-btn primary" onclick="playAudio('${l.zh.replace(/'/g, "\\'")}')">استمع</button>
          </div>
        </div>
      </div>`;
    });
    html += `</div>`;
  });
  return html;
}

function generateDynamicQuiz(topicNum) {
  const words = W.filter((w) => w[4] === topicNum);
  if (words.length === 0) return [];
  const questions = [];
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(10, words.length));
  selected.forEach((w) => {
    let wrong = words
      .filter((x) => x[2] !== w[2])
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((x) => x[2]);
    while (wrong.length < 3) wrong.push("...");
    const opts = [w[2], ...wrong].sort(() => Math.random() - 0.5);
    questions.push({
      q: `ما معنى "${w[0]}"؟`,
      zh: w[0],
      py: w[1],
      opts,
      a: opts.indexOf(w[2]),
      exp: `الكلمة "${w[0]}" تعني "${w[2]}".`,
      type: "meaning",
    });
    let wrongHanzi = words
      .filter((x) => x[2] !== w[2])
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((x) => x[0]);
    while (wrongHanzi.length < 3) wrongHanzi.push("？");
    const hanziOpts = [w[0], ...wrongHanzi].sort(() => Math.random() - 0.5);
    questions.push({
      q: `اختر الترجمة الصينية لـ "${w[2]}"`,
      zh: "",
      py: "",
      opts: hanziOpts,
      a: hanziOpts.indexOf(w[0]),
      exp: `الترجمة الصحيحة هي "${w[0]}".`,
      type: "translation",
    });
    questions.push({
      q: "استمع واختر المعنى الصحيح",
      zh: w[0],
      py: w[1],
      opts,
      a: opts.indexOf(w[2]),
      exp: `الكلمة "${w[0]}" تعني "${w[2]}".`,
      type: "listening",
      listen: true,
    });
  });

  const sents = SENTS[topicNum] || [];
  sents.slice(0, 5).forEach((s) => {
    const correct = s[0];
    const makeWrong = () =>
      correct
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("");
    const opts = [correct, makeWrong(), makeWrong(), makeWrong()].sort(
      () => Math.random() - 0.5,
    );
    questions.push({
      q: "اختر ترتيب الجملة الصحيح",
      zh: "",
      py: "",
      opts,
      a: opts.indexOf(correct),
      exp: `الجملة الصحيحة: ${correct}`,
      type: "order",
    });
  });
  return questions.sort(() => Math.random() - 0.5).slice(0, 20);
}

function renderQuestion(cid) {
  const state = window[cid + "_state"];
  const questions = window[cid + "_questions"];
  if (!state || !questions) return;
  const q = questions[state.idx];
  const pct = Math.round((state.idx / state.total) * 100);
  let html = `<div class="quiz-header">
    <span class="quiz-prog">${state.idx + 1} / ${state.total}</span>
    <button class="py-toggle" onclick="togglePinyin()">${showPinyin ? "إخفاء Pinyin" : "إظهار Pinyin"}</button>
    <div class="prog-bar"><div class="prog-fill" style="width:${pct}%"></div></div>
  </div>
  <div class="quiz-q">
    <p class="q-text">${q.q}</p>
    ${q.zh ? `<div class="q-zh">${zhSpan(q.zh, q.py || "")}</div>` : ""}
    ${q.listen ? `<button class="icon-btn primary" onclick="playAudio('${q.zh.replace(/'/g, "\\'")}')">استمع</button>` : ""}
  </div>
  <div class="opts" id="${cid}_opts">`;

  q.opts.forEach((o, i) => {
    let optHtml = o;
    if (/[\u4e00-\u9fa5]/.test(o)) {
      const found = W.find((w) => w[0] === o);
      if (found) {
        optHtml =
          o +
          '<span class="opt-py" style="display:' +
          (showPinyin ? "block" : "none") +
          '">' +
          formatPinyin(found[1]) +
          "</span>";
      }
    }
    html += `<button class="opt-btn" onclick="answerQuiz('${cid}', ${i})">${optHtml}</button>`;
  });

  html += `</div><div id="${cid}_exp" class="quiz-exp hidden"></div>
  <div id="${cid}_nav" class="quiz-nav hidden">
    <button class="btn-next" onclick="nextQuestion('${cid}')">${state.idx + 1 < state.total ? "السؤال التالي" : "عرض النتيجة"}</button>
  </div>`;
  document.getElementById(cid).innerHTML = html;
}

function findExamplesForWord(hanzi, limit = 3) {
  const results = [];
  for (const key in SENTS) {
    const list = SENTS[key] || [];
    for (const s of list) {
      if (s[0] && s[0].includes(hanzi)) {
        results.push({ zh: s[0], py: s[1], ar: s[2] });
        if (results.length >= limit) return results;
      }
    }
  }
  return results;
}

function renderVocabPage() {
  const isEn = currentLang === "en";
  const total = W.length;
  const learned = learnedWords.size;
  const newCount = total - learned;

  return `
    <div class="page-wrap">
      <div class="card" style="margin-bottom:1rem;">
        <div class="section-title">${isEn ? "Vocabulary Search" : "بحث المفردات"}</div>
        <div class="vocab-search">
          <input id="vocab-search" type="text" placeholder="${isEn ? "Search by Hanzi, Pinyin, or Arabic..." : "ابحث بالصينية أو البينيين أو العربية..."}" oninput="filterVocabBySearch(this.value)" />
          <button class="btn-sec" id="vocab-filter-all" onclick="filterVocab('all')">${isEn ? "All" : "الكل"} (${total})</button>
          <button class="btn-sec" id="vocab-filter-learned" onclick="filterVocab('learned')">${isEn ? "Saved" : "المحفوظة"} (${learned})</button>
          <button class="btn-sec" id="vocab-filter-new" onclick="filterVocab('new')">${isEn ? "New" : "الجديدة"} (${newCount})</button>
        </div>
        <div class="card vocab-example-panel" id="vocab-examples-panel" style="display:none;"></div>
        <div class="vocab-grid" id="vocab-grid"></div>
      </div>
    </div>
  `;
}

function updateVocabCounts() {
  const total = W.length;
  const learned = learnedWords.size;
  const newCount = total - learned;

  const allBtn = document.getElementById("vocab-filter-all");
  const learnedBtn = document.getElementById("vocab-filter-learned");
  const newBtn = document.getElementById("vocab-filter-new");

  if (allBtn) {
    allBtn.innerText = `${currentLang === "en" ? "All" : "الكل"} (${total})`;
  }
  if (learnedBtn) {
    learnedBtn.innerText = `${currentLang === "en" ? "Saved" : "المحفوظة"} (${learned})`;
  }
  if (newBtn) {
    newBtn.innerText = `${currentLang === "en" ? "New" : "الجديدة"} (${newCount})`;
  }
}

function filterVocab(filter) {
  currentVocabFilter = filter;
  const input = document.getElementById("vocab-search");
  filterVocabBySearch(input ? input.value : "");
}
window.filterVocab = filterVocab;

function filterVocabBySearch(query) {
  const grid = document.getElementById("vocab-grid");
  if (!grid) return;
  const panel = document.getElementById("vocab-examples-panel");
  if (panel) panel.style.display = "none";
  const q = (query || "").trim().toLowerCase();
  let words = W;
  if (currentVocabFilter === "learned") {
    words = words.filter((w) => learnedWords.has(w[0]));
  } else if (currentVocabFilter === "new") {
    words = words.filter((w) => !learnedWords.has(w[0]));
  }
  if (q) {
    words = words.filter((w) => {
      const zh = (w[0] || "").toLowerCase();
      const py = (w[1] || "").toLowerCase();
      const ar = (w[2] || "").toLowerCase();
      return zh.includes(q) || py.includes(q) || ar.includes(q);
    });
  }
  grid.innerHTML = words
    .map((w) => {
      return `
      <div class="vocab-card ${learnedWords.has(w[0]) ? "learned" : ""}">
        <div class="hanzi">${w[0]}</div>
        <div class="py" style="display:${showPinyin ? "block" : "none"};color:var(--primary);font-weight:700;">${formatPinyin(w[1])}</div>
        <div style="color:#444;">${w[2]}</div>
        <div class="word-type">${w[3] || ""}</div>
        <div class="vocab-actions">
          <button class="icon-btn primary" onclick="speakChinese('${w[0]}')">${currentLang === "en" ? "Play" : "استمع"}</button>
          <button class="icon-btn" onclick="toggleWordLearned('${w[0]}', this)">${currentLang === "en" ? "Save" : "احفظ"}</button>
          <button class="icon-btn" onclick="showWordExamples('${w[0]}')">${currentLang === "en" ? "Examples" : "الأمثلة"}</button>
        </div>
      </div>
    `;
    })
    .join("");
}
window.filterVocabBySearch = filterVocabBySearch;

function formatWordType(raw) {
  const val = (raw || "").toLowerCase();
  if (val.includes("v")) return currentLang === "en" ? "Verb" : "فعل";
  if (val.includes("p")) return currentLang === "en" ? "Particle" : "أداة";
  if (val.includes("n")) return currentLang === "en" ? "Noun" : "اسم";
  return currentLang === "en" ? "Noun" : "اسم";
}

function showWordExamples(word) {
  const panel = document.getElementById("vocab-examples-panel");
  if (!panel) return;
  const examples = findExamplesForWord(word, 3);
  const w = W.find((x) => x[0] === word);
  panel.style.display = "block";
  panel.innerHTML = `
    <div class="section-title">${currentLang === "en" ? "Examples" : "الأمثلة"} - ${w ? w[0] : word}</div>
    ${
      examples.length
        ? examples
            .map(
              (ex) => `
      <div class="vocab-example">
        <div class="ex-zh">${ex.zh}</div>
        <div class="ex-py py" style="display:${showPinyin ? "block" : "none"}">${formatPinyin(ex.py)}</div>
        <div class="ex-ar">${ex.ar}</div>
      </div>
    `,
            )
            .join("")
        : `<p style="color:#777;">${currentLang === "en" ? "No examples found." : "لا توجد أمثلة."}</p>`
    }
  `;
  panel.scrollIntoView({ behavior: "smooth", block: "center" });
}
window.showWordExamples = showWordExamples;

function renderFlashcardsPage() {
  const isEn = currentLang === "en";
  return `
    <div class="page-wrap">
      <div class="card">
        <div class="section-title">${isEn ? "Flashcards" : "البطاقات"}</div>
        <div style="display:flex;gap:0.6rem;align-items:center;flex-wrap:wrap;margin-bottom:1rem;">
          <label style="font-size:0.85rem;color:#666;">${isEn ? "Lesson" : "الدرس"}</label>
          <select id="flash-lesson" onchange="setFlashLesson(this.value)" style="padding:0.4rem 0.6rem;border-radius:10px;border:1px solid var(--border);">
            <option value="1">${isEn ? "Lesson" : "درس"} 1</option>
            <option value="2">${isEn ? "Lesson" : "درس"} 2</option>
            <option value="3">${isEn ? "Lesson" : "درس"} 3</option>
            <option value="4">${isEn ? "Lesson" : "درس"} 4</option>
            <option value="5">${isEn ? "Lesson" : "درس"} 5</option>
            <option value="6">${isEn ? "Lesson" : "درس"} 6</option>
            <option value="7">${isEn ? "Lesson" : "درس"} 7</option>
            <option value="8">${isEn ? "Lesson" : "درس"} 8</option>
            <option value="9">${isEn ? "Lesson" : "درس"} 9</option>
            <option value="10">${isEn ? "Lesson" : "درس"} 10</option>
            <option value="11">${isEn ? "Lesson" : "درس"} 11</option>
            <option value="12">${isEn ? "Lesson" : "درس"} 12</option>
            <option value="13">${isEn ? "Lesson" : "درس"} 13</option>
            <option value="14">${isEn ? "Lesson" : "درس"} 14</option>
            <option value="15">${isEn ? "Lesson" : "درس"} 15</option>
          </select>
        </div>
        <div id="flashcard-shell"></div>
      </div>
    </div>
  `;
}

function setFlashLesson(n) {
  const lesson = parseInt(n, 10) || 1;
  const shell = document.getElementById("flashcard-shell");
  if (!shell) return;
  shell.innerHTML = `
    <div class="fc-container">
      <div class="fc-controls">
        <button onclick="fcPrev()" class="fc-nav-btn">← السابق</button>
        <span id="fc_counter_${lesson}" class="fc-count">1 / 1</span>
        <button onclick="fcNext()" class="fc-nav-btn">التالي →</button>
      </div>
      <div id="fc_card_${lesson}" class="fc-card-wrap"></div>
      <div class="fc-actions">
        <button class="btn-learned" onclick="fcMark(true)">${currentLang === "en" ? "I Know" : "أعرف"}</button>
        <button class="btn-shuffle" onclick="fcMark(false)">${currentLang === "en" ? "Don't Know" : "لا أعرف"}</button>
      </div>
    </div>
  `;
  initFlashcards(lesson);
}
window.setFlashLesson = setFlashLesson;

// تخزين حالة النقرات المؤقتة
let pendingReview = null;
let timeoutId = null;

function handleReviewClick(word, known, btn) {
  // إلغاء أي طلب سابق معلق
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }

  // إذا كان هناك طلب معلق لنفس الكلمة ونفس الإجراء
  if (
    pendingReview &&
    pendingReview.word === word &&
    pendingReview.known === known
  ) {
    // تأكيد الإجراء
    updateReviewWord(word, known);
    pendingReview = null;

    // رسالة نجاح
    showPanda(known ? "✅ تم تأكيد الحفظ!" : "🔄 ستُعاد المراجعة لاحقاً");
  } else {
    // طلب جديد: سجل النية وأظهر التأكيد
    pendingReview = { word, known };

    // تأثير وميض على الزر
    btn.classList.add("pulse-animation");

    // رسالة توجيهية
    showPanda(
      known
        ? "⚠️ اضغط مرة أخرى لتأكيد الحفظ"
        : "⚠️ اضغط مرة أخرى لتأكيد عدم المعرفة",
    );

    // إزالة تأثير الوميض بعد ثانية
    timeoutId = setTimeout(() => {
      btn.classList.remove("pulse-animation");
      timeoutId = null;
    }, 1000);

    // إلغاء الطلب المعلق إذا لم يتم التأكيد خلال 3 ثوان
    timeoutId = setTimeout(() => {
      pendingReview = null;
      btn.classList.remove("pulse-animation");
      showPanda("⌛ تم إلغاء الطلب");
    }, 3000);
  }
}
function fcMark(known) {
  const w = fcState.filtered[fcState.idx];
  if (!w) return;
  updateWordSRS(w[0], known);

  // إدارة قائمة المراجعة
  const entry = reviewList.find((r) => r.word === w[0]);
  if (known) {
    // إذا كانت الكلمة موجودة في المراجعة، حدّث حالتها (قد تُحذف)
    if (entry) updateReviewWord(w[0], true);
  } else {
    // إذا كانت الإجابة خاطئة، أضفها أو أعد جدولتها
    if (entry) {
      updateReviewWord(w[0], false);
    } else {
      addReviewWord(w[0]);
    }
  }

  // إعادة ترتيب البطاقات (تأخير الكلمات الخاطئة)
  if (!known) {
    const missed = fcState.filtered.splice(fcState.idx, 1)[0];
    fcState.filtered.push(missed);
  }

  // الانتقال إلى البطاقة التالية
  if (fcState.idx < fcState.filtered.length - 1) {
    fcState.idx++;
  } else {
    fcState.idx = 0;
  }
  fcState.flipped = false;
  renderFC();
}
window.fcMark = fcMark;

function renderFC() {
  const n = fcState.topic;
  const card = document.getElementById(`fc_card_${n}`);
  const counter = document.getElementById(`fc_counter_${n}`);
  if (!card) return;
  const w = fcState.filtered[fcState.idx];
  if (!w) return;
  const ex = findExamplesForWord(w[0], 1)[0];
  card.innerHTML = `
    <div class="fc-inner ${fcState.flipped ? "flipped" : ""}" onclick="flipCard('fc_${n}')">
      <div class="fc-front">
        <div class="fc-hanzi">${w[0]}</div>
      </div>
      <div class="fc-back">
        <div class="fc-arabic">${w[2]}</div>
        <div class="fc-py-sm">${formatPinyin(w[1])}</div>
        ${ex ? `<div class="fcex">${ex.zh}</div><div class="fcex">${formatPinyin(ex.py)}</div><div class="fcex">${ex.ar}</div>` : ""}
      </div>
    </div>`;
  if (counter)
    counter.textContent = `${fcState.idx + 1} / ${fcState.filtered.length}`;
}

function loadReviewList() {
  try {
    const stored = localStorage.getItem(REVIEW_KEY);
    reviewList = stored ? JSON.parse(stored) : [];
  } catch {
    reviewList = [];
  }
}

function saveReviewList() {
  localStorage.setItem(REVIEW_KEY, JSON.stringify(reviewList));
}

function addReviewWord(word) {
  const existing = reviewList.find((r) => r.word === word);
  const nextReview = Date.now() + 24 * 60 * 60 * 1000;
  if (existing) {
    existing.intervalIndex = 0;
    existing.nextReview = nextReview;
  } else {
    reviewList.push({ word, intervalIndex: 0, nextReview });
  }
  saveReviewList();
}

function updateReviewWord(word, known) {
  const intervals = [1, 3, 7, 14];
  const entry = reviewList.find((r) => r.word === word);
  if (!entry) return;

  if (!known) {
    entry.intervalIndex = 0;
    entry.nextReview = Date.now() + intervals[0] * 24 * 60 * 60 * 1000;
  } else {
    entry.intervalIndex += 1;
    if (entry.intervalIndex >= intervals.length) {
      reviewList = reviewList.filter((r) => r.word !== word);
    } else {
      entry.nextReview =
        Date.now() + intervals[entry.intervalIndex] * 24 * 60 * 60 * 1000;
    }
  }

  saveReviewList();

  // إعادة رسم صفحة المراجعة
  const reviewSec = document.getElementById("sec-review");
  if (reviewSec) {
    reviewSec.innerHTML = renderReviewPage();
  }

  // ✅ إضافة الكود الجديد هنا
  setTimeout(() => {
    document.querySelectorAll(".vocab-actions .icon-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => e.stopPropagation());
    });
  }, 100);
}

function getDueReviewWords() {
  const now = Date.now();
  return reviewList.filter((r) => r.nextReview <= now);
}

function renderReviewPage() {
  const isEn = currentLang === "en";
  const due = getDueReviewWords(); // الكلمات المستحقة الآن
  const list = due.length ? due : reviewList; // إذا لم يوجد مستحق، اعرض الكل (أو عدل حسب رغبتك)

  let html = `
    <div class="page-wrap">
      <div class="card">
        <div class="section-title">${isEn ? "Review Words" : "مراجعة الكلمات"}</div>
        <p style="color:#666; margin-bottom:1rem;">
          ${
            isEn
              ? "Words you marked as difficult will reappear using spaced repetition intervals."
              : "الكلمات الصعبة تظهر مجدداً وفقاً لجدول المراجعة."
          }
        </p>
  `;

  // إذا كانت القائمة فارغة
  if (list.length === 0) {
    html += `<p style="text-align:center; color:#888; padding:2rem;">${isEn ? "No words to review today! 🎉" : "لا توجد كلمات للمراجعة اليوم! 🎉"}</p>`;
  } else {
    html += `<div class="vocab-grid">`;

    list.forEach((r) => {
      const w = W.find((x) => x[0] === r.word);
      if (!w) return;

      const ex = findExamplesForWord(w[0], 1)[0];

      html += `
        <div class="vocab-card ${learnedWords.has(w[0]) ? "learned" : ""}">
          <div class="hanzi">${w[0]}</div>
          <div class="py" style="display:${showPinyin ? "block" : "none"}; color:var(--primary); font-weight:700;">
            ${formatPinyin(w[1])}
          </div>
          <div style="color:#444;">${w[2]}</div>
          <div class="word-type">${w[3] || ""}</div>
      `;

      if (ex) {
        html += `
          <div class="vocab-example" style="margin-top:0.5rem; background:#f9f9f9; padding:0.5rem; border-radius:8px;">
            <div class="ex-zh">${ex.zh}</div>
            <div class="ex-py py" style="display:${showPinyin ? "block" : "none"};">${formatPinyin(ex.py)}</div>
            <div class="ex-ar" style="font-size:0.85rem;">${ex.ar}</div>
          </div>
        `;
      }

      html += `
          <div class="vocab-actions">
            <button class="icon-btn primary" onclick="playAudio('${w[0]}')">${isEn ? "Play" : "استمع"}</button>
            <button class="icon-btn" onclick="handleReviewClick('${w[0]}', true, this)">${isEn ? "I Know" : "أعرف"}</button>
            <button class="icon-btn" onclick="handleReviewClick('${w[0]}', false, this)">${isEn ? "I Don't Know" : "لا أعرف"}</button>
          </div>
        </div>
      `;
    });

    html += `</div>`;
  }

  html += `
      </div>
    </div>
  `;

  return html;
}

function renderDialogsPage() {
  const isEn = currentLang === "en";
  const topics = Array.from({ length: 15 }, (_, i) => i + 1);

  // حالة الطي/الفتح - نستخدم كائن لتخزين حالة كل درس
  // القيم الافتراضية: الدرس 1 مفتوح، الباقي مغلق
  if (!window.dialogCollapsedState) {
    window.dialogCollapsedState = {};
    topics.forEach((n) => {
      window.dialogCollapsedState[n] = n === 1 ? false : true; // الدرس الأول مفتوح
    });
  }

  return `
    <div class="page-wrap">
      <div class="card">
        <div class="section-title">${isEn ? "Dialogs" : "الحوارات"}</div>
        <div style="display:flex; gap:1rem; align-items:center; margin-bottom:1.5rem;">
          <button class="btn-practice" onclick="togglePracticeMode()">
            ${isEn ? "Practice Mode" : "وضع التدريب"}
          </button>
          <span class="practice-hint" style="color:#666; font-size:0.9rem;">
            ${isEn ? "Click on any sentence to practice speaking" : "اضغط على أي جملة للتدرب على النطق"}
          </span>
        </div>
        
        <div class="dialog-wrap mode-show" id="dialog-wrap">
          ${topics
            .map((n) => {
              const isCollapsed = window.dialogCollapsedState[n];
              const topicTitle = TOPICS.find((t) => t.n === n)?.t || `درس ${n}`;

              return `
              <div class="dialog-section" id="dialog-section-${n}">
                <div class="dialog-section-header ${!isCollapsed ? "active" : ""}" 
                     onclick="toggleDialogLesson(${n})">
                  <div class="dialog-section-title">
                    <span class="dialog-section-icon">📘</span>
                    <span>${isEn ? "Lesson" : "درس"} ${n}: ${topicTitle}</span>
                  </div>
                  <div class="dialog-section-toggle ${!isCollapsed ? "open" : ""}">▼</div>
                </div>
                <div class="dialog-section-content ${isCollapsed ? "collapsed" : ""}" 
                     id="dialog-content-${n}">
                  <div style="display:flex; justify-content:flex-end; margin-bottom:1rem;">
                    <button class="btn-complete" onclick="markDialogCompleted(${n}, this)">
                      ${isEn ? "Mark Completed" : "تم الانتهاء"}
                    </button>
                  </div>
                  ${renderDialogue(n)}
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    </div>
  `;
}

// دالة لتبديل حالة الدرس (فتح/غلق)
function toggleDialogLesson(lessonNum) {
  if (!window.dialogCollapsedState) window.dialogCollapsedState = {};
  window.dialogCollapsedState[lessonNum] =
    !window.dialogCollapsedState[lessonNum];

  // تحديث واجهة المستخدم مباشرة
  const content = document.getElementById(`dialog-content-${lessonNum}`);
  const header = document.querySelector(
    `#dialog-section-${lessonNum} .dialog-section-header`,
  );
  const toggle = document.querySelector(
    `#dialog-section-${lessonNum} .dialog-section-toggle`,
  );

  if (content) {
    if (window.dialogCollapsedState[lessonNum]) {
      content.classList.add("collapsed");
      header?.classList.remove("active");
      toggle?.classList.remove("open");
    } else {
      content.classList.remove("collapsed");
      header?.classList.add("active");
      toggle?.classList.add("open");
    }
  }
}

// تحديث دالة markDialogCompleted لدعم الحالة الجديدة
function markDialogCompleted(lesson, btnElement) {
  const list = userProgress.stats.completedDialogs || [];
  if (!list.includes(lesson)) {
    list.push(lesson);
    userProgress.stats.completedDialogs = list;
    userProgress.stats.dialogsCompleted = list.length;
    addXP(20);
    saveProgress();

    // تغيير شكل الزر
    if (btnElement) {
      btnElement.classList.add("completed");
      btnElement.disabled = true;
    }
  }

  const sec = document.getElementById(`dialog-section-${lesson}`);
  if (sec) sec.classList.add("completed");
}

// تصدير الدوال الجديدة
window.toggleDialogLesson = toggleDialogLesson;
window.markDialogCompleted = markDialogCompleted;
window.togglePracticeMode =
  window.togglePracticeMode ||
  function () {
    const wrap = document.getElementById("dialog-wrap");
    if (wrap) wrap.classList.toggle("mode-practice");
  };

// دالة لتبديل حالة الدرس (فتح/غلق)
function toggleDialogLesson(lessonNum) {
  if (!window.dialogCollapsedState) window.dialogCollapsedState = {};
  window.dialogCollapsedState[lessonNum] =
    !window.dialogCollapsedState[lessonNum];

  // تحديث واجهة المستخدم مباشرة
  const content = document.getElementById(`dialog-content-${lessonNum}`);
  const header = document.querySelector(
    `#dialog-section-${lessonNum} .dialog-section-header`,
  );
  const toggle = document.querySelector(
    `#dialog-section-${lessonNum} .dialog-section-toggle`,
  );

  if (content) {
    if (window.dialogCollapsedState[lessonNum]) {
      content.classList.add("collapsed");
      header?.classList.remove("active");
      toggle?.classList.remove("open");
    } else {
      content.classList.remove("collapsed");
      header?.classList.add("active");
      toggle?.classList.add("open");
    }
  }
}

// تحديث دالة markDialogCompleted لدعم الحالة الجديدة
function markDialogCompleted(lesson, btnElement) {
  const list = userProgress.stats.completedDialogs || [];
  if (!list.includes(lesson)) {
    list.push(lesson);
    userProgress.stats.completedDialogs = list;
    userProgress.stats.dialogsCompleted = list.length;
    addXP(20);
    saveProgress();

    // تغيير شكل الزر
    if (btnElement) {
      btnElement.classList.add("completed");
      btnElement.disabled = true;
    }
  }

  const sec = document.getElementById(`dialog-section-${lesson}`);
  if (sec) sec.classList.add("completed");
}

// تصدير الدوال الجديدة
window.toggleDialogLesson = toggleDialogLesson;
window.markDialogCompleted = markDialogCompleted;
window.togglePracticeMode =
  window.togglePracticeMode ||
  function () {
    const wrap = document.getElementById("dialog-wrap");
    if (wrap) wrap.classList.toggle("mode-practice");
  };

function togglePracticeMode() {
  const wrap = document.getElementById("dialog-wrap");
  if (!wrap) return;
  wrap.classList.toggle("mode-practice");
}
window.togglePracticeMode = togglePracticeMode;

function markDialogCompleted(lesson) {
  const list = userProgress.stats.completedDialogs || [];
  if (!list.includes(lesson)) {
    list.push(lesson);
    userProgress.stats.completedDialogs = list;
    userProgress.stats.dialogsCompleted = list.length;
    addXP(20);
    saveProgress();
  }
  const sec = document.getElementById(`dialog-section-${lesson}`);
  if (sec) sec.classList.add("completed");
}
window.markDialogCompleted = markDialogCompleted;

function renderProgress() {
  const isEn = currentLang === "en";
  const pct = Math.round((learnedWords.size / 500) * 100);
  return `
    <div class="page-wrap">
      <div class="card">
        <div class="section-title">${isEn ? "HSK1 Progress" : "تقدم HSK1"}</div>
        <div class="progress-track-modern">
          <div class="progress-fill-modern" id="progress_bar" style="width:${pct}%"></div>
        </div>
        <div class="progress-label" id="progress_pct">${pct}%</div>
        <div class="progress-grid">
          <div class="stat-card">
            <div style="font-size:0.8rem;color:#777;">${isEn ? "Words Learned" : "كلمات محفوظة"}</div>
            <div id="progress_words" style="font-size:1.6rem;font-weight:800;color:var(--primary);">${learnedWords.size}</div>
          </div>
          <div class="stat-card">
            <div style="font-size:0.8rem;color:#777;">${isEn ? "Lessons Completed" : "الدروس المكتملة"}</div>
            <div id="progress_lessons" style="font-size:1.6rem;font-weight:800;color:var(--primary);">${Math.min(15, Math.floor(learnedWords.size / Math.ceil(500 / 15)))}</div>
          </div>
          <div class="stat-card">
            <div style="font-size:0.8rem;color:#777;">${isEn ? "Quizzes Passed" : "الاختبارات المجتازة"}</div>
            <div id="progress_quizzes" style="font-size:1.6rem;font-weight:800;color:var(--primary);">${userProgress.stats.quizzesPassed || 0}</div>
          </div>
          <div class="stat-card">
            <div style="font-size:0.8rem;color:#777;">${isEn ? "Dialogs Completed" : "حوارات مكتملة"}</div>
            <div id="progress_dialogs" style="font-size:1.6rem;font-weight:800;color:var(--primary);">${userProgress.stats.dialogsCompleted || 0}</div>
          </div>
          <div class="stat-card">
            <div style="font-size:0.8rem;color:#777;">${isEn ? "Study Time (min)" : "وقت الدراسة (دقيقة)"}</div>
            <div id="progress_time" style="font-size:1.6rem;font-weight:800;color:var(--primary);">${userProgress.stats.studyMinutes || 0}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderProfile() {
  const isEn = currentLang === "en";
  return `
    <div class="page-wrap">
      <div class="card">
        <div class="section-title">${isEn ? "Profile" : "الملف الشخصي"}</div>
        <p style="color:#666;">${isEn ? "Track your learning streak and adjust preferences." : "تابع سلسلة التعلم واضبط تفضيلاتك."}</p>
        <div class="progress-grid">
          <div class="stat-card">
            <div style="font-size:0.8rem;color:#777;">${isEn ? "XP" : "النقاط"}</div>
            <div style="font-size:1.6rem;font-weight:800;color:var(--primary);">${userProgress.stats.xp}</div>
          </div>
          <div class="stat-card">
            <div style="font-size:0.8rem;color:#777;">${isEn ? "Streak" : "السلسلة"}</div>
            <div style="font-size:1.6rem;font-weight:800;color:var(--primary);">${userProgress.stats.streak}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildContentFrames() {
  const mainArea = document.getElementById("main_area");
  if (!mainArea) return;
  let html = "";
  html += `<div id="sec-home" class="sec active">${renderHome()}</div>`;
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

  for (let i = 1; i <= 15; i++) {
    html += `<div id="sec-t${i}" class="sec">${renderTopic(i)}</div>`;
  }
  mainArea.innerHTML = html;
}

function updateProgressBar() {
  const pct = Math.round((learnedWords.size / 500) * 100);
  const wordsPerLesson = Math.ceil(500 / 15);
  for (let i = 1; i <= 15; i++) {
    if (
      learnedWords.size >= i * wordsPerLesson &&
      !userProgress.stats.completedLessons.includes(i)
    ) {
      userProgress.stats.completedLessons.push(i);
      addXP(20);
      showPanda(
        currentLang === "en"
          ? `Lesson ${i} completed!`
          : `أحسنت! أنهيت الدرس ${i}`,
      );
    }
  }
  const bar = document.getElementById("gbar");
  if (bar) bar.style.width = pct + "%";
  const glbl = document.getElementById("glbl");
  if (glbl)
    glbl.innerHTML =
      currentLang === "en" ? `Progress: ${pct}%` : `التقدم: ${pct}%`;
  const learnedCount = document.getElementById("learned_count");
  if (learnedCount) learnedCount.textContent = learnedWords.size;
  const progressPct = document.getElementById("progress_pct");
  if (progressPct) progressPct.textContent = pct + "%";
  const progressBar = document.getElementById("progress_bar");
  if (progressBar) progressBar.style.width = pct + "%";
  const progressWords = document.getElementById("progress_words");
  if (progressWords) progressWords.textContent = learnedWords.size;
  const progressDialogs = document.getElementById("progress_dialogs");
  if (progressDialogs)
    progressDialogs.textContent = userProgress.stats.dialogsCompleted || 0;
  const progressTime = document.getElementById("progress_time");
  if (progressTime)
    progressTime.textContent = userProgress.stats.studyMinutes || 0;
}

function toggleLang() {
  currentLang = currentLang === "ar" ? "en" : "ar";
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";
  const langBtn = document.getElementById("lang-btn-text");
  if (langBtn) langBtn.innerText = currentLang === "ar" ? "English" : "العربية";
  const brandTitle = document.getElementById("brand-title");
  if (brandTitle)
    brandTitle.innerText =
      currentLang === "ar" ? "تعلم الصينية" : "Learn Chinese";
  buildNav();
  buildContentFrames();
  updateStatsUI();
  setTheme(document.body.classList.contains("dark") ? "dark" : "light");
  showTab(currentTab);
}
window.toggleLang = toggleLang;

function setTheme(theme) {
  const body = document.body;
  if (!body) return;
  body.classList.toggle("dark", theme === "dark");
  localStorage.setItem("hsk1_theme", theme);
  const btn = document.getElementById("theme-btn");
  if (btn) {
    const label =
      theme === "dark"
        ? currentLang === "en"
          ? "Dark"
          : "داكن"
        : currentLang === "en"
          ? "Light"
          : "فاتح";
    btn.textContent = label;
  }
}

function toggleTheme() {
  const isDark = document.body.classList.contains("dark");
  setTheme(isDark ? "light" : "dark");
}
window.toggleTheme = toggleTheme;

function showPanda(message) {
  let panda = document.getElementById("panda-toast");
  if (!panda) {
    panda = document.createElement("div");
    panda.id = "panda-toast";
    panda.innerHTML = `<div class="panda-face">🐼</div><div class="panda-msg"></div>`;
    document.body.appendChild(panda);
  }
  const msg = panda.querySelector(".panda-msg");
  if (msg) msg.textContent = message;
  panda.classList.add("show");
  setTimeout(() => panda.classList.remove("show"), 2500);
}
window.showPanda = showPanda;

function showTab(tabId) {
  const targetId = tabId === "intro" ? "home" : tabId;
  currentTab = targetId;
  if (targetId !== "lessons") fullLessonOpened = false;
  document
    .querySelectorAll(".sec")
    .forEach((sec) => sec.classList.remove("active"));
  const target = document.getElementById(`sec-${targetId}`);
  if (target) {
    target.classList.add("active");
    const content = document.getElementById("content");
    if (content) content.scrollTo(0, 0);
  }
  document
    .querySelectorAll(".nav-item")
    .forEach((tab) => tab.classList.remove("active"));
  const activeTab = document.querySelector(`.nav-item[data-tab="${targetId}"]`);
  if (activeTab) activeTab.classList.add("active");

  if (targetId === "vocab") {
    filterVocabBySearch("");
  } else if (targetId === "flashcards") {
    setTimeout(() => {
      const select = document.getElementById("flash-lesson");
      if (select) select.value = String(currentLesson);
      setFlashLesson(currentLesson);
    }, 0);
  } else if (targetId === "review") {
    const reviewSec = document.getElementById("sec-review");
    if (reviewSec) reviewSec.innerHTML = renderReviewPage();
  } else if (targetId === "translator") {
    setTimeout(translateText, 100);
  } else if (targetId.startsWith("t")) {
    const num = parseInt(targetId.substring(1), 10);
    if (!Number.isNaN(num)) currentLesson = num;
    initFlashcards(num);
  }
}
window.showTab = showTab;

function updateStatsUI() {
  const xpEl = document.getElementById("user-xp");
  const streakEl = document.getElementById("user-streak");
  if (xpEl) xpEl.innerText = userProgress.stats.xp + " XP";
  if (streakEl)
    streakEl.innerText =
      currentLang === "en"
        ? `Streak ${userProgress.stats.streak} days`
        : `سلسلة ${userProgress.stats.streak} أيام`;
}

function updateWordSRS(hanzi, isCorrect) {
  if (!userProgress.words[hanzi]) {
    userProgress.words[hanzi] = { level: 0, nextReview: Date.now() };
  }
  let wStats = userProgress.words[hanzi];
  if (isCorrect) {
    wStats.level += 1;
    const hours = Math.pow(2, wStats.level);
    wStats.nextReview = Date.now() + hours * 60 * 60 * 1000;
    addXP(5);
  } else {
    wStats.level = Math.max(0, wStats.level - 1);
    wStats.nextReview = Date.now() + 10 * 60 * 1000;
  }
  saveProgress();
}

function ensureStatsDefaults() {
  if (typeof userProgress.stats.quizzesPassed !== "number")
    userProgress.stats.quizzesPassed = 0;
  if (typeof userProgress.stats.dialogsCompleted !== "number")
    userProgress.stats.dialogsCompleted = 0;
  if (typeof userProgress.stats.studyMinutes !== "number")
    userProgress.stats.studyMinutes = 0;
  if (!Array.isArray(userProgress.stats.completedLessons))
    userProgress.stats.completedLessons = [];
  if (!Array.isArray(userProgress.stats.completedDialogs))
    userProgress.stats.completedDialogs = [];
}

function startStudyTimer() {
  setInterval(() => {
    userProgress.stats.studyMinutes += 1;
    saveProgress();
  }, 60000);
}

document.addEventListener("DOMContentLoaded", () => {
  ensureStatsDefaults();
  loadReviewList();
  const storedTheme = localStorage.getItem("hsk1_theme");
  if (storedTheme) {
    setTheme(storedTheme);
  } else if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    setTheme("dark");
  } else {
    setTheme("light");
  }
  updateStatsUI();
  startStudyTimer();
});

const _nextQuestion = window.nextQuestion;
if (typeof _nextQuestion === "function") {
  window.nextQuestion = function (cid) {
    const state = window[cid + "_state"];
    if (state && state.idx + 1 >= state.total) {
      userProgress.stats.quizzesPassed =
        (userProgress.stats.quizzesPassed || 0) + 1;
      addXP(50);
      saveProgress();
    }
    _nextQuestion(cid);
  };
}

function toggleWordLearned(word, el) {
  // تحديث حالة الحفظ
  if (learnedWords.has(word)) {
    learnedWords.delete(word);
    if (el && el.classList) el.classList.remove("learned");
  } else {
    learnedWords.add(word);
    if (el && el.classList) el.classList.add("learned");
  }

  // حفظ التغييرات وتحديث الواجهة
  saveProgress();
  updateProgressBar();
  updateVocabCounts();
  renderFC(); // تحديث الفلاش كارد إذا كان ظاهراً

  // إذا كنا في صفحة المفردات، أعد تطبيق الفلتر الحالي
  if (currentTab === "vocab") {
    const searchInput = document.getElementById("vocab-search");
    const query = searchInput ? searchInput.value : "";
    filterVocabBySearch(query);
  }
}
window.updateReviewWord = updateReviewWord;
window.addReviewWord = addReviewWord;
window.renderReviewPage = renderReviewPage;
window.toggleWordLearned = toggleWordLearned;
