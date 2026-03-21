/**
 * Red Silk HSK — Xīnlì AI Assistant (心力)
 * Netlify Function: /.netlify/functions/xinli
 *
 * Secure Gemini API proxy.
 * GEMINI_API_KEY is read ONLY from Netlify environment variables.
 *
 * v3 — fixes:
 *  1. Model switched to gemini-1.5-flash (best free-tier quota availability)
 *  2. Full Gemini error body is logged to Netlify function logs
 *  3. Real Gemini error detail is surfaced in the chat response for debugging
 *  4. Leading assistant messages stripped before sending to Gemini (previous fix)
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

  // ── API Key guard ──────────────────────────────────────────────────────
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    console.error('[Xinli] GEMINI_API_KEY is not set in Netlify environment variables.');
    return {
      statusCode: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'خطأ في إعداد المساعد — GEMINI_API_KEY غير موجود.' }),
    };
  }

  // ── Parse request ──────────────────────────────────────────────────────
  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'طلب غير صالح' }) };
  }

  const { messages = [], context = {} } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'لا توجد رسائل' }) };
  }

  // ── Context description ────────────────────────────────────────────────
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

  // ── System prompt ──────────────────────────────────────────────────────
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
    + '- إيجابية ومشجّعة دائماً\n\n'
    + 'المنهج: HSK 1 — 500 كلمة · 15 موضوعاً — للناطقين بالعربية\n\n'
    + 'السياق الحالي:\n'
    + buildCtx(context)
    + '\n\nابدئي مباشرة بالإجابة المفيدة!';

  // ── Build Gemini contents (must start with user, must alternate) ────────
  const contents = [];
  for (const msg of messages) {
    if (!msg.content || !msg.role) continue;
    const role = msg.role === 'assistant' ? 'model' : 'user';
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += '\n' + String(msg.content);
    } else {
      contents.push({ role: role, parts: [{ text: String(msg.content) }] });
    }
  }
  // Strip any leading model/assistant messages — Gemini must start with user
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

  // ── Call Gemini API ────────────────────────────────────────────────────
  // Using gemini-2.0-flash-lite: fully supported on v1beta, highest free-tier QPM.
  // If you want to try other models, options are:
  //   gemini-2.0-flash-lite   ← CURRENT: highest free quota, v1beta supported
  //   gemini-1.5-flash-8b     ← even higher quota limits
  //   gemini-1.5-pro          ← better quality, lower quota
  //   gemini-2.0-flash        ← newest, but lower free quota
  const MODEL = 'gemini-2.0-flash-lite';
  const GEMINI_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent?key=' + API_KEY;

  console.log('[Xinli] Calling Gemini model:', MODEL, '| turns in contents:', contents.length);

  let rawRes;
  try {
    rawRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM }] },
        contents: contents,
        generationConfig: {
          temperature:     0.75,
          maxOutputTokens: 700,
          topP:            0.92,
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
    console.error('[Xinli] Network error reaching Gemini:', netErr.message);
    return {
      statusCode: 502,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'تعذّر الاتصال بالخادم. يرجى المحاولة مجدداً.' }),
    };
  }

  // ── Handle Gemini error responses ──────────────────────────────────────
  if (!rawRes.ok) {
    // Always read and log the full error body — visible in Netlify function logs
    const errBody = await rawRes.text().catch(function() { return '(empty)'; });
    console.error('[Xinli] Gemini HTTP error | status:', rawRes.status, '| model:', MODEL, '| body:', errBody);

    // Parse the Gemini error message if possible
    let geminiErrDetail = '';
    try {
      const parsed = JSON.parse(errBody);
      geminiErrDetail = (parsed && parsed.error && parsed.error.message) ? parsed.error.message : '';
    } catch (_) {}

    // Map status codes to user-friendly Arabic messages
    let userMsg;
    if (rawRes.status === 429) {
      userMsg = 'وصلنا للحد الأقصى من الطلبات. انتظر دقيقة ثم حاول مجدداً. 😊';
    } else if (rawRes.status === 403) {
      userMsg = 'مفتاح API غير مصرح له. يرجى التحقق من إعدادات Netlify.';
    } else if (rawRes.status === 400) {
      userMsg = 'خطأ في صيغة الطلب. يرجى تحديث الصفحة والمحاولة.';
    } else if (rawRes.status === 404) {
      userMsg = 'النموذج غير متاح. يرجى التواصل مع الدعم.';
    } else {
      userMsg = 'حدث خطأ مؤقت (HTTP ' + rawRes.status + '). يرجى المحاولة مجدداً.';
    }

    // Append Gemini's own error detail if we have one (helps with debugging)
    if (geminiErrDetail) {
      userMsg += ' [' + geminiErrDetail.slice(0, 120) + ']';
    }

    return {
      statusCode: rawRes.status >= 500 ? 502 : rawRes.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: userMsg }),
    };
  }

  // ── Parse successful Gemini response ───────────────────────────────────
  let data;
  try {
    data = await rawRes.json();
  } catch (parseErr) {
    console.error('[Xinli] Failed to parse Gemini JSON response:', parseErr.message);
    return {
      statusCode: 502,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'استجابة غير متوقعة من الخادم.' }),
    };
  }

  // Log the raw response structure for debugging (only the shape, not full text)
  console.log('[Xinli] Gemini response | candidates:', data && data.candidates ? data.candidates.length : 0,
    '| finishReason:', data && data.candidates && data.candidates[0] ? data.candidates[0].finishReason : 'n/a');

  // Extract reply text
  const reply =
    (data && data.candidates && data.candidates[0] &&
     data.candidates[0].content && data.candidates[0].content.parts &&
     data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text)
      ? data.candidates[0].content.parts[0].text.trim()
      : null;

  if (!reply) {
    // Log the full response so we can see why text extraction failed
    console.error('[Xinli] Could not extract text from Gemini response:', JSON.stringify(data).slice(0, 600));
    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'لم أتمكن من توليد رد. يرجى المحاولة مجدداً.' }),
    };
  }

  console.log('[Xinli] Success | reply length:', reply.length, 'chars');

  return {
    statusCode: 200,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ reply: reply }),
  };
};
