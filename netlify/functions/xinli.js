/**
 * Red Silk HSK — Xīnlì AI Assistant (心力)
 * Netlify Function: /.netlify/functions/xinli
 *
 * Secure Gemini API proxy.
 * GEMINI_API_KEY is read ONLY from Netlify environment variables.
 * It never appears in any frontend code or response body.
 *
 * FIX: The frontend includes the assistant welcome message at index 0.
 * Gemini requires conversations to start with role:'user', so we strip
 * any leading model/assistant messages before forwarding to Gemini.
 */

exports.handler = async function (event) {

  const CORS = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    console.error('[Xinli] GEMINI_API_KEY not set in Netlify environment variables.');
    return {
      statusCode: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'خطأ في إعداد المساعد. يرجى التواصل مع الدعم الفني.' }),
    };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'طلب غير صالح' }) };
  }

  const { messages = [], context = {} } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'لا توجد رسائل' }) };
  }

  function buildCtx(ctx) {
    const TAB = {
      home: 'الصفحة الرئيسية', vocab: 'المفردات', grammar: 'القواعد',
      sentences: 'الجمل والحوارات', bigexam: 'الاختبار الشامل',
      flashcards: 'البطاقات التعليمية', stories: 'القصص',
      tones: 'النغمات', review: 'المراجعة', translator: 'المترجم',
    };
    const lines = [];
    if (ctx.tab)          lines.push('الصفحة: ' + (TAB[ctx.tab] || ctx.tab));
    if (ctx.lesson)       lines.push('الدرس رقم: ' + ctx.lesson);
    if (ctx.lessonTopic)  lines.push('موضوع الدرس: ' + ctx.lessonTopic);
    if (ctx.learnedCount) lines.push('كلمات محفوظة: ' + ctx.learnedCount);
    if (ctx.xp)           lines.push('نقاط XP: ' + ctx.xp);
    if (ctx.lang)         lines.push('لغة الواجهة: ' + (ctx.lang === 'ar' ? 'العربية' : 'English'));
    if (Array.isArray(ctx.visibleWords) && ctx.visibleWords.length)
      lines.push('كلمات ظاهرة: ' + ctx.visibleWords.slice(0, 10).join('، '));
    return lines.join('\n') || 'لا معلومات إضافية';
  }

  const SYSTEM = 'أنتِ شينلي (Xīnlì · 心力)، المساعدة الذكية لتطبيق Red Silk HSK.\n\n'
    + 'هويتك:\n'
    + '- اسمك شينلي Xīnlì — يعني "قوة القلب والعقل" (心力)\n'
    + '- شخصيتك: دافئة، صبورة، حماسية، تُحبّ التعليم\n'
    + '- تعيشين داخل تطبيق Red Silk HSK لتعليم الصينية للناطقين بالعربية\n'
    + '- لا تذكري Gemini أو Google أو أي تقنية خارجية — أنتِ شينلي فقط\n\n'
    + 'مهامك:\n'
    + '١. شرح المفردات: 汉字 (Pinyin) = المعنى بالعربية\n'
    + '٢. تفسير القواعد النحوية بأمثلة\n'
    + '٣. تصحيح الأخطاء برفق مع تشجيع\n'
    + '٤. الإجابة عن أسئلة الدروس والمنهج\n'
    + '٥. تقديم طرق حفظ ممتعة\n'
    + '٦. ربط الكلمات بالثقافة الصينية\n\n'
    + 'قواعد الأسلوب:\n'
    + '- العربية لغة أساسية، أضيفي الصينية عند الشرح\n'
    + '- ردود مختصرة وواضحة — لا إطالة دون داعٍ\n'
    + '- إيجابية ومشجّعة دائماً\n'
    + '- لا تذكري أنكِ Gemini أو AI خارجي\n\n'
    + 'المنهج: HSK 1 — 500 كلمة · 15 موضوعاً — للناطقين بالعربية\n\n'
    + 'السياق الحالي للمستخدم:\n'
    + buildCtx(context)
    + '\n\nابدئي مباشرة بالإجابة المفيدة!';

  // ── Build Gemini contents array ─────────────────────────────────────────
  // Rules: role must be 'user' or 'model', must start with 'user', must alternate.
  //
  // The frontend sends full history including the assistant welcome bubble at
  // index 0 (role:'assistant'). We must strip any leading model messages so
  // the array always starts with a user turn — that is the core fix.
  const contents = [];

  for (const msg of messages) {
    if (!msg.content || !msg.role) continue;
    const role = msg.role === 'assistant' ? 'model' : 'user';
    // Merge consecutive same-role entries to maintain strict alternation
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += '\n' + String(msg.content);
    } else {
      contents.push({ role: role, parts: [{ text: String(msg.content) }] });
    }
  }

  // Drop any leading model entries until we reach the first user message
  while (contents.length > 0 && contents[0].role === 'model') {
    contents.shift();
  }

  if (contents.length === 0) {
    return {
      statusCode: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'لم يُرسَل أي سؤال. اكتب سؤالك وأرسله!' }),
    };
  }
  // ────────────────────────────────────────────────────────────────────────

  const GEMINI_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + API_KEY;

  let rawRes;
  try {
    rawRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM }] },
        contents: contents,
        generationConfig: { temperature: 0.75, maxOutputTokens: 700, topP: 0.92 },
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
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'تعذّر الوصول إلى الخادم. يرجى المحاولة مجدداً.' }),
    };
  }

  if (!rawRes.ok) {
    const errBody = await rawRes.text().catch(function() { return ''; });
    console.error('[Xinli] Gemini error', rawRes.status, errBody.slice(0, 400));
    const errMsg =
      rawRes.status === 429 ? 'شينلي مشغولة قليلاً! انتظر ثانية ثم حاول مجدداً 😊' :
      rawRes.status === 400 ? 'حدث خطأ في المعالجة. يرجى تحديث الصفحة والمحاولة.' :
      'حدث خطأ مؤقت. يرجى المحاولة مجدداً.';
    return {
      statusCode: rawRes.status >= 500 ? 502 : rawRes.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: errMsg }),
    };
  }

  let data;
  try { data = await rawRes.json(); }
  catch {
    return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'استجابة غير متوقعة.' }) };
  }

  const reply =
    (data && data.candidates && data.candidates[0] &&
     data.candidates[0].content && data.candidates[0].content.parts &&
     data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text)
    ? data.candidates[0].content.parts[0].text.trim()
    : 'عذراً، لم أتمكن من الرد الآن. حاول مجدداً!';

  return {
    statusCode: 200,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ reply: reply }),
  };
};
