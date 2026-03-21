/**
 * Red Silk HSK — Xīnlì AI Assistant (心力)
 * Netlify Function: /.netlify/functions/xinli
 *
 * Secure Gemini API proxy.
 * GEMINI_API_KEY is read ONLY from Netlify environment variables.
 * It never appears in any frontend code or response body.
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
    if (ctx.tab)          lines.push(`الصفحة: ${TAB[ctx.tab] || ctx.tab}`);
    if (ctx.lesson)       lines.push(`الدرس رقم: ${ctx.lesson}`);
    if (ctx.lessonTopic)  lines.push(`موضوع الدرس: ${ctx.lessonTopic}`);
    if (ctx.learnedCount) lines.push(`كلمات محفوظة: ${ctx.learnedCount}`);
    if (ctx.xp)           lines.push(`نقاط XP: ${ctx.xp}`);
    if (ctx.lang)         lines.push(`لغة الواجهة: ${ctx.lang === 'ar' ? 'العربية' : 'English'}`);
    if (Array.isArray(ctx.visibleWords) && ctx.visibleWords.length)
      lines.push(`كلمات ظاهرة: ${ctx.visibleWords.slice(0, 10).join('، ')}`);
    return lines.join('\n') || 'لا معلومات إضافية';
  }

  const SYSTEM = `أنتِ شينلي (Xīnlì · 心力)، المساعدة الذكية لتطبيق Red Silk HSK.

هويتك:
- اسمك شينلي Xīnlì — يعني "قوة القلب والعقل" (心力)
- شخصيتك: دافئة، صبورة، حماسية، تُحبّ التعليم
- تعيشين داخل تطبيق Red Silk HSK لتعليم الصينية للناطقين بالعربية
- لا تذكري Gemini أو Google أو أي تقنية خارجية — أنتِ شينلي فقط

مهامك:
١. شرح المفردات: 汉字 (Pinyin) = المعنى بالعربية
٢. تفسير القواعد النحوية بأمثلة
٣. تصحيح الأخطاء برفق مع تشجيع
٤. الإجابة عن أسئلة الدروس والمنهج
٥. تقديم طرق حفظ ممتعة
٦. ربط الكلمات بالثقافة الصينية

قواعد الأسلوب:
- العربية لغة أساسية، أضيفي الصينية عند الشرح
- ردود مختصرة وواضحة — لا إطالة دون داعٍ
- إيجابية ومشجّعة دائماً
- لا تذكري أنكِ Gemini أو AI خارجي

المنهج: HSK 1 — 500 كلمة · 15 موضوعاً — للناطقين بالعربية

السياق:
${buildCtx(context)}

ابدئي مباشرة بالإجابة المفيدة!`;

  // Build Gemini contents — must alternate user/model, start with user
  const contents = [];
  for (const msg of messages) {
    if (!msg.content || !msg.role) continue;
    const role = msg.role === 'assistant' ? 'model' : 'user';
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += '\n' + String(msg.content);
    } else {
      contents.push({ role, parts: [{ text: String(msg.content) }] });
    }
  }

  if (!contents.length || contents[0].role !== 'user') {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'تنسيق الرسائل غير صحيح' }) };
  }

  const GEMINI_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + API_KEY;

  let rawRes;
  try {
    rawRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM }] },
        contents,
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
    const errBody = await rawRes.text().catch(() => '');
    console.error('[Xinli] Gemini error', rawRes.status, errBody.slice(0, 400));
    const msg =
      rawRes.status === 429 ? 'شينلي مشغولة قليلاً! انتظر ثانية ثم حاول مجدداً 😊' :
      rawRes.status === 400 ? 'طلب غير صالح. يرجى تحديث الصفحة والمحاولة.' :
      'حدث خطأ مؤقت. يرجى المحاولة مجدداً.';
    return {
      statusCode: rawRes.status >= 500 ? 502 : rawRes.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: msg }),
    };
  }

  let data;
  try { data = await rawRes.json(); }
  catch {
    return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'استجابة غير متوقعة.' }) };
  }

  const reply =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
    'عذراً، لم أتمكن من الرد الآن. حاول مجدداً!';

  return {
    statusCode: 200,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ reply }),
  };
};
