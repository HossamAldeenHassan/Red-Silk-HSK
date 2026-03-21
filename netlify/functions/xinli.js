/**
 * Red Silk HSK — Xīnlì AI Assistant (心力)
 * Netlify Function: /.netlify/functions/xinli
 *
 * Secure Gemini API proxy.
 * GEMINI_API_KEY is read ONLY from Netlify environment variables.
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
    console.error('[Xinli] GEMINI_API_KEY not set.');
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
    + '- إيجابية ومشجّعة دائماً\n\n'
    + 'المنهج: HSK 1 — 500 كلمة · 15 موضوعاً — للناطقين بالعربية\n\n'
    + 'السياق الحالي:\n'
    + buildCtx(context)
    + '\n\nابدئي مباشرة بالإجابة المفيدة!';

  // Build Gemini contents — must start with user, must alternate roles
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
  // Strip leading model messages — Gemini requires conversation to start with user
  while (contents.length > 0 && contents[0].role === 'model') {
    contents.shift();
  }
  if (contents.length === 0) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'لم يُرسَل أي سؤال. اكتب سؤالك وأرسله!' }) };
  }

  const MODEL = 'gemini-2.0-flash-lite';
  const GEMINI_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent?key=' + API_KEY;

  console.log('[Xinli] model:', MODEL, 'turns:', contents.length);

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
      body: JSON.stringify({ error: 'تعذّر الاتصال بالخادم. يرجى المحاولة مجدداً.' }),
    };
  }

  if (!rawRes.ok) {
    const errBody = await rawRes.text().catch(() => '');
    console.error('[Xinli] Gemini error', rawRes.status, errBody.slice(0, 500));

    // Return a special "rateLimited" flag on 429 so the frontend can start a cooldown
    if (rawRes.status === 429) {
      return {
        statusCode: 429,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'rate_limited' }),
      };
    }

    const userMsg =
      rawRes.status === 403 ? 'مفتاح الوصول غير مصرح له. يرجى مراجعة إعدادات المساعد.' :
      rawRes.status === 400 ? 'حدث خطأ في الطلب. يرجى تحديث الصفحة والمحاولة.' :
      rawRes.status === 404 ? 'النموذج غير متاح حالياً. يرجى المحاولة لاحقاً.' :
      'حدث خطأ مؤقت. يرجى المحاولة مجدداً.';

    return {
      statusCode: rawRes.status >= 500 ? 502 : rawRes.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: userMsg }),
    };
  }

  let data;
  try { data = await rawRes.json(); }
  catch {
    return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'استجابة غير متوقعة.' }) };
  }

  const reply =
    (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();

  if (!reply) {
    console.error('[Xinli] Empty reply from Gemini:', JSON.stringify(data).slice(0, 400));
    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'لم أتمكن من توليد رد. يرجى المحاولة مجدداً.' }),
    };
  }

  console.log('[Xinli] OK — reply length:', reply.length);
  return {
    statusCode: 200,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ reply }),
  };
};
