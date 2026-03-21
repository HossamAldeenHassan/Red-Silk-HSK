/**
 * Red Silk HSK — Xīnlì AI Assistant (心力)
 * Netlify Serverless Function: /.netlify/functions/xinli
 *
 * Secure proxy between the app and the Gemini API.
 * The GEMINI_API_KEY is read ONLY from Netlify environment variables.
 * It is never returned to the client, never logged, never embedded in HTML.
 */

exports.handler = async function (event) {
  /* ── CORS headers (allow same-origin Netlify requests) ── */
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'X-Content-Type-Options': 'nosniff',
  };

  /* Preflight */
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }

  /* Only allow POST */
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  /* ── API key guard ── */
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    console.error('[Xinli] GEMINI_API_KEY is not set in Netlify environment variables.');
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: 'خطأ في إعداد المساعد. يرجى التواصل مع الدعم.' }),
    };
  }

  /* ── Parse request ── */
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'طلب غير صالح' }) };
  }

  const { messages = [], context = {} } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'لا توجد رسائل' }) };
  }

  /* ── Build context block for the system prompt ── */
  function buildContext(ctx) {
    const TAB_NAMES = {
      home:       'الصفحة الرئيسية',
      vocab:      'صفحة المفردات',
      grammar:    'صفحة القواعد',
      sentences:  'صفحة الجمل والحوارات',
      bigexam:    'صفحة الاختبار الشامل',
      flashcards: 'صفحة البطاقات التعليمية',
      stories:    'صفحة القصص',
      tones:      'صفحة النغمات',
      review:     'صفحة المراجعة',
      translator: 'صفحة المترجم',
    };

    const lines = [];
    if (ctx.tab)          lines.push(`الصفحة الحالية: ${TAB_NAMES[ctx.tab] || ctx.tab}`);
    if (ctx.lesson)       lines.push(`الدرس الحالي: الدرس رقم ${ctx.lesson}`);
    if (ctx.lessonTopic)  lines.push(`موضوع الدرس: ${ctx.lessonTopic}`);
    if (ctx.learnedCount) lines.push(`كلمات تعلّمها المستخدم: ${ctx.learnedCount} كلمة`);
    if (ctx.xp)           lines.push(`نقاط XP للمستخدم: ${ctx.xp}`);
    if (ctx.lang)         lines.push(`لغة الواجهة: ${ctx.lang === 'ar' ? 'العربية' : 'English'}`);
    if (ctx.visibleWords?.length) {
      lines.push(`كلمات ظاهرة على الشاشة حالياً: ${ctx.visibleWords.slice(0, 12).join('، ')}`);
    }
    return lines.length ? lines.join('\n') : 'لا معلومات إضافية عن الصفحة الحالية';
  }

  /* ── System prompt — Xīnlì's identity ── */
  const SYSTEM = `أنتِ "شينلي" (Xīnlì / 心力)، المساعدة الذكية الودودة لتطبيق Red Silk HSK.

هويتك الكاملة:
• اسمك شينلي Xīnlì (心力) — ويعني "قوة القلب والعقل"
• فتاة بشخصية دافئة، حماسية، صبورة، وتُحبّ التعليم
• تعيشين داخل تطبيق Red Silk HSK لتعليم اللغة الصينية للناطقين بالعربية
• لا تُشيري أبداً إلى Gemini أو Google أو أي تقنية خارجية — أنتِ شينلي فقط، من داخل التطبيق

مهامك:
١. شرح المفردات الصينية: الحرف (汉字)، النطق (Pinyin)، المعنى بالعربية
٢. تفسير قواعد اللغة الصينية بأسلوب بسيط مع أمثلة
٣. تصحيح الأخطاء برفق وتشجيع
٤. الإجابة على أسئلة المستخدم عن محتوى الصفحة الحالية
٥. تقديم جمل توضيحية وطرق حفظ ممتعة
٦. ربط الكلمات بالسياق اليومي والثقافة الصينية

أسلوب ردودك:
• تكلّمي بالعربية دائماً كلغة أساسية
• أضيفي الصينية (汉字 + Pinyin) عند شرح أي كلمة أو جملة
• اجعلي ردودك مختصرة وواضحة ومفيدة — لا تطيلي دون حاجة
• استخدمي التنسيق: 汉字 (Pinyin) = المعنى
• كوني إيجابية ومشجّعة دائماً
• إذا سُئلتِ عن شيء خارج نطاق الصينية أو التطبيق، أجيبي باختصار وأعيدي التوجيه للتعلم
• لا تكتبي قوائم طويلة — الوضوح والبساطة أولاً

معلومات المنهج:
• المستوى: HSK 1 (المستوى الأول الأساسي)
• عدد الكلمات: 500 كلمة
• عدد المواضيع: 15 موضوعاً
• الجمهور: ناطقون بالعربية يتعلمون الصينية

السياق الحالي:
${buildContext(context)}

ابدئي مباشرة بالإجابة المفيدة!`;

  /* ── Convert messages to Gemini format ── */
  // Gemini requires alternating user / model roles, starting with user
  const contents = [];
  for (const msg of messages) {
    if (!msg.content || !msg.role) continue;
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(msg.content) }],
    });
  }

  if (contents.length === 0 || contents[0].role !== 'user') {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'تنسيق الرسائل غير صحيح' }) };
  }

  /* ── Call Gemini ── */
  const MODEL = 'gemini-2.0-flash';
  const URL   = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  let raw;
  try {
    raw = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM }] },
        contents,
        generationConfig: {
          temperature:      0.75,
          maxOutputTokens:  700,
          topP:             0.92,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
    });
  } catch (netErr) {
    console.error('[Xinli] Network error:', netErr.message);
    return {
      statusCode: 502,
      headers: cors,
      body: JSON.stringify({ error: 'تعذّر الاتصال بالمساعد. يرجى المحاولة مجدداً.' }),
    };
  }

  /* Handle non-200 from Gemini */
  if (!raw.ok) {
    const errText = await raw.text().catch(() => '');
    console.error(`[Xinli] Gemini API ${raw.status}:`, errText.slice(0, 300));
    const msg = raw.status === 429
      ? 'شينلي مشغولة قليلاً! يرجى الانتظار ثانية ثم المحاولة. 😊'
      : 'حدث خطأ مؤقت. يرجى المحاولة مجدداً.';
    return { statusCode: raw.status, headers: cors, body: JSON.stringify({ error: msg }) };
  }

  /* Parse response */
  let data;
  try { data = await raw.json(); }
  catch {
    return { statusCode: 502, headers: cors, body: JSON.stringify({ error: 'استجابة غير متوقعة.' }) };
  }

  const reply =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
    'عذراً، لم أتمكن من الرد الآن. حاول مجدداً!';

  return {
    statusCode: 200,
    headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ reply }),
  };
};
