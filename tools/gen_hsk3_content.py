import json
import os

def load_json(filename):
    with open(f'data/hsk3/{filename}', 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(filename, data):
    with open(f'data/hsk3/{filename}', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

lessons = load_json('lessons.json')
sentences = load_json('sentences.json')
dialogues = load_json('dialogues.json')
grammar = load_json('grammar.json')
tests = load_json('tests.json')

# HSK3 New Core Content (Lessons 2 to 20)
new_topics = [
    {"n": 2, "h": "找东西", "t": "أين أشيائي؟", "s": "Where are my things?", "tags": ["أشياء", "بحث"]},
    {"n": 3, "h": "去还是不去", "t": "الذهاب أم لا", "s": "To go or not to go", "tags": ["قرارات", "سفر"]},
    {"n": 4, "h": "她总是笑着跟客人说话", "t": "هي تتحدث دائما بابتسامة", "s": "Smiling constantly", "tags": ["عمل", "شخصية"]},
    {"n": 5, "h": "我最近越来越胖了", "t": "لقد أصبحت سميناً أكثر فأكثر", "s": "Getting fatter", "tags": ["صحة", "تغيير"]},
    {"n": 6, "h": "我想看长城", "t": "أريد رؤية السور العظيم", "s": "I want to see the Great Wall", "tags": ["سياحة", "أماكن"]},
    {"n": 7, "h": "银行", "t": "في البنك", "s": "At the Bank", "tags": ["مال", "بنك"]},
    {"n": 8, "h": "我的眼镜呢", "t": "أين نظاراتي", "s": "Where are my glasses", "tags": ["أشياء", "فقدان"]},
    {"n": 9, "h": "她长得很像妈妈", "t": "هي تشبه أمها كثيراً", "s": "She looks like her mom", "tags": ["شبه", "أسرة"]},
    {"n": 10, "h": "学习", "t": "الرياضيات صعبة", "s": "Math is hard", "tags": ["دراسة", "صعوبة"]},
    {"n": 11, "h": "鸟", "t": "الطيور والبيئة", "s": "Birds & Environment", "tags": ["طبيعة", "طيور"]},
    {"n": 12, "h": "把门关上", "t": "أغلق الباب!", "s": "Close the door!", "tags": ["أوامر", "أفعال"]},
    {"n": 13, "h": "打扫房间", "t": "تنظيف الغرفة", "s": "Cleaning the room", "tags": ["نظافة", "منزل"]},
    {"n": 14, "h": "他买了很多苹果", "t": "لقد اشترى الكثير من التفاح", "s": "He bought apples", "tags": ["تسوق", "فواكه"]},
    {"n": 15, "h": "其他", "t": "الآخرون", "s": "Others", "tags": ["أشخاص", "علاقات"]},
    {"n": 16, "h": "现在我累了", "t": "الآن أنا متعب", "s": "Now I am tired", "tags": ["تعب", "مشاعر"]},
    {"n": 17, "h": "谁的", "t": "لمن هذا؟", "s": "Whose is this?", "tags": ["ملكية", "أشياء"]},
    {"n": 18, "h": "相信自己", "t": "ثق بنفسك", "s": "Believe in yourself", "tags": ["ثقة", "نجاح"]},
    {"n": 19, "h": "看清楚没有", "t": "هل رأيت بوضوح؟", "s": "Did you see clearly?", "tags": ["رؤية", "وضوح"]},
    {"n": 20, "h": "爱好和习惯", "t": "الهوايات والعادات", "s": "Hobbies & Habits", "tags": ["عادات", "هوايات"]}
]

new_stories = [
    {"id": 2, "level": "medium", "title": "البحث", "titleEn": "Searching", "content": [{"zh": "你看见我的手机了吗？", "py": "Nǐ kànjiàn wǒ de shǒujī le ma?", "ar": "هل رأيت هاتفي المحمول؟"}, {"zh": "在桌子上。", "py": "Zài zhuōzi shàng.", "ar": "إنه على الطاولة."}]},
    {"id": 3, "level": "medium", "title": "السفر", "titleEn": "Travel", "content": [{"zh": "你去还是不去？", "py": "Nǐ qù háishì bú qù?", "ar": "هل ستذهب أم لا؟"}, {"zh": "我还是不去吧。", "py": "Wǒ háishì bú qù ba.", "ar": "من الأفضل ألا أذهب."}]},
    {"id": 4, "level": "medium", "title": "الابتسامة", "titleEn": "Smile", "content": [{"zh": "她总是笑着说话。", "py": "Tā zǒngshì xiàozhe shuōhuà.", "ar": "هي تتحدث دائماً مبتسمة."}, {"zh": "客人都很喜欢她。", "py": "Kèrén dōu hěn xǐhuan tā.", "ar": "العملاء جميعهم يحبونها جداً."}]},
    {"id": 5, "level": "medium", "title": "يتغير", "titleEn": "Change", "content": [{"zh": "我最近越来越胖了。", "py": "Wǒ zuìjìn yuè lái yuè pàng le.", "ar": "لقد أصبحت سميناً أكثر فأكثر في الآونة الأخيرة."}, {"zh": "你应该多运动。", "py": "Nǐ yīnggāi duō yùndòng.", "ar": "يجب أن تمارس الرياضة أكثر."}]},
    {"id": 6, "level": "medium", "title": "السور العظيم", "titleEn": "The Great Wall", "content": [{"zh": "我想去北京看长城。", "py": "Wǒ xiǎng qù Běijīng kàn Chángchéng.", "ar": "أريد الذهاب إلى بكين لرؤية السور العظيم."}, {"zh": "什么时候去？", "py": "Shénme shíhou qù?", "ar": "متى ستذهب؟"}]},
    {"id": 7, "level": "medium", "title": "البنك", "titleEn": "The Bank", "content": [{"zh": "银行几点开门？", "py": "Yínháng jǐ diǎn kāimén?", "ar": "في أي ساعة يفتح البنك أبوابه؟"}, {"zh": "早上九点。", "py": "Zǎoshang jiǔ diǎn.", "ar": "في التاسعة صباحاً."}]},
    {"id": 8, "level": "medium", "title": "النظارات", "titleEn": "Glasses", "content": [{"zh": "我的眼镜去哪儿了？", "py": "Wǒ de yǎnjìng qù nǎr le?", "ar": "أين ذهبت نظاراتي؟"}, {"zh": "我没看到。", "py": "Wǒ méi kàndào.", "ar": "لم أرها."}]},
    {"id": 9, "level": "medium", "title": "شبه", "titleEn": "Similarity", "content": [{"zh": "她长得像谁？", "py": "Tā zhǎng de xiàng shéi?", "ar": "من تشبه؟"}, {"zh": "她长得很像妈妈。", "py": "Tā zhǎng de hěn xiàng māma.", "ar": "هي تشبه أمها كثيراً."}]},
    {"id": 10, "level": "medium", "title": "الرياضيات", "titleEn": "Math", "content": [{"zh": "你觉得数学难吗？", "py": "Nǐ juéde shùxué nán ma?", "ar": "هل تعتقد أن الرياضيات صعبة؟"}, {"zh": "太难了！", "py": "Tài nán le!", "ar": "صعبة جداً!"}]},
    {"id": 11, "level": "medium", "title": "الطيور", "titleEn": "Birds", "content": [{"zh": "树上有很多鸟。", "py": "Shù shàng yǒu hěnduō niǎo.", "ar": "على الشجرة يوجد الكثير من الطيور."}, {"zh": "它们在唱歌吗？", "py": "Tāmen zài chànggē ma?", "ar": "هل يغنون؟"}]},
    {"id": 12, "level": "medium", "title": "الباب", "titleEn": "The Door", "content": [{"zh": "请把门关上。", "py": "Qǐng bǎ mén guān shàng.", "ar": "من فضلك أغلق الباب."}, {"zh": "好的，马上。", "py": "Hǎo de, mǎshàng.", "ar": "حسناً، فوراً."}]},
    {"id": 13, "level": "medium", "title": "التنظيف", "titleEn": "Cleaning", "content": [{"zh": "房间打扫干净了吗？", "py": "Fángjiān dǎsǎo gānjìng le ma?", "ar": "هل نُظفت الغرفة بشكل نظيف؟"}, {"zh": "已经打扫得干干净净了。", "py": "Yǐjīng dǎsǎo de gān gān jìng jìng le.", "ar": "نظفتها وأصبحت نظيفة تماماً."}]},
    {"id": 14, "level": "medium", "title": "التفاح", "titleEn": "Apples", "content": [{"zh": "他买了几斤苹果？", "py": "Tā mǎi le jǐ jīn píngguǒ?", "ar": "كم جيناً من التفاح اشترى؟"}, {"zh": "他买了五斤。", "py": "Tā mǎi le wǔ jīn.", "ar": "اشترى خمسة جينات (حوالي 2.5 كغ)."}]},
    {"id": 15, "level": "medium", "title": "الآخرون", "titleEn": "Others", "content": [{"zh": "其他人在哪儿？", "py": "Qítā rén zài nǎr?", "ar": "أين هم الأشخاص الآخرون؟"}, {"zh": "他们都在会议室。", "py": "Tāmen dōu zài huìyìshì.", "ar": "هم جميعاً في غرفة الاجتماعات."}]},
    {"id": 16, "level": "medium", "title": "التعب", "titleEn": "Tiredness", "content": [{"zh": "现在我累了，想休息。", "py": "Xiànzài wǒ lèi le, xiǎng xiūxi.", "ar": "الآن أنا متعب، أريد أن أرتاح."}, {"zh": "你喝杯茶吧。", "py": "Nǐ hē bēi chá ba.", "ar": "اشرب كوباً من الشاي."}]},
    {"id": 17, "level": "medium", "title": "ملك من", "titleEn": "Whose", "content": [{"zh": "这辆车是谁的？", "py": "Zhè liàng chē shì shéi de?", "ar": "لمن هذه السيارة؟"}, {"zh": "是我哥哥的。", "py": "Shì wǒ gēge de.", "ar": "هي لأخي الأكبر."}]},
    {"id": 18, "level": "medium", "title": "الثقة", "titleEn": "Confidence", "content": [{"zh": "你要相信自己！", "py": "Nǐ yào xiāngxìn zìjǐ!", "ar": "يجب أن تثق بنفسك!"}, {"zh": "我会努力的。", "py": "Wǒ huì nǔlì de.", "ar": "سوف أبذل جهدي."}]},
    {"id": 19, "level": "medium", "title": "الوضوح", "titleEn": "Clarity", "content": [{"zh": "你看清楚了吗？", "py": "Nǐ kàn qīngchu le ma?", "ar": "هل رأيت بوضوح؟"}, {"zh": "没看清楚，太远了。", "py": "Méi kàn qīngchu, tài yuǎn le.", "ar": "لم أر بوضوح، المسافة بعيدة جداً."}]},
    {"id": 20, "level": "medium", "title": "الهوايات", "titleEn": "Hobbies", "content": [{"zh": "你的爱好是什么？", "py": "Nǐ de àihào shì shénme?", "ar": "ما هي هوايتك؟"}, {"zh": "我的习惯是每天早上跑步。", "py": "Wǒ de xíguàn shì měitiān zǎoshang pǎobù.", "ar": "عادتي هي الركض كل صباح."}]}
]

new_grammar = [
    {"id": 2, "title": "التعبير عن الاختيار (还是/或者)", "desc": "تستخدم 还是 للاختيار في الأسئلة، بينما تستخدم 或者 في الجمل الخبرية.", "ex": "你喝茶还是喝咖啡？ (هل تشرب الشاي أم القهوة؟)"},
    {"id": 3, "title": "الفعل المستمر مع (着)", "desc": "توضع 着 بعد الفعل للدلالة على حالة مستمرة أو مصاحبة.", "ex": "门开着 (الباب مفتوح)"},
    {"id": 4, "title": "التعبير عن التزايد بـ (越来越)", "desc": "تعني (أكثر فأكثر)، وتوضع قبل الصفات.", "ex": "天气越来越冷 (الطقس يصبح أبرد فأبرد)"},
    {"id": 5, "title": "تكملة النتيجة المتوقعة (好 / 完)", "desc": "تضاف بعد الفعل للإشارة لإتمامه بنجاح أو انتهاءه.", "ex": "我准备好了 (لقد استعددت تماماً)"},
    {"id": 6, "title": "جمل المفعول به المتقدم مع (把)", "desc": "تُستخدم 把 لتقديم المفعول به قبل الفعل. الصيغة: الفاعل + 把 + المفعول به + الفعل + تكملة", "ex": "请把门关上 (من فضلك أغلق الباب)"},
    {"id": 7, "title": "المفعول المطلق أو المصدر (被)", "desc": "تستخدم للمبني للمجهول: المفعول + 被 + الفاعل + الفعل", "ex": "苹果被猫吃了 (التفاحة أُكلت بواسطة القط)"},
    {"id": 8, "title": "التعبير عن الاتجاهات (来 / 去)", "desc": "توضع بعد الأفعال لتحديد اتجاه الحركة نحو المتحدث أو بعيداً عنه.", "ex": "你上来吧 (اصعد إلى هنا)"},
    {"id": 9, "title": "جملة السؤال المنفي (没有)", "desc": "تستخدم للتحقق من حدوث فعل ما في الماضي.", "ex": "你看清楚没看看清楚？ (هل رأيت بوضوح أم لا؟)"},
    {"id": 10, "title": "المقدار (一点儿 / 极了)", "desc": "تستخدم الأولى للتقليل، والثانية للمبالغة.", "ex": "好吃极了 (لذيذ جدااً)"}
]

lessons["TOPICS"].extend(new_topics)
lessons["STORIES"].extend(new_stories)

grammar_list = grammar.get("GRAMMAR", grammar)
if isinstance(grammar_list, dict):
    grammar_list = grammar_list.get("GRAMMAR", [])
grammar_list.extend(new_grammar)
grammar["GRAMMAR"] = grammar_list

for idx in range(2, 21):
    topic_id = str(idx)
    sentences["SENTS"][topic_id] = [
        [new_stories[idx-2]["content"][0]["zh"], new_stories[idx-2]["content"][0]["py"], new_stories[idx-2]["content"][0]["ar"]]
    ]
    dialogues["DIALOGUES"][topic_id] = [
        {"speaker": "A", "ch": new_stories[idx-2]["content"][0]["zh"], "py": new_stories[idx-2]["content"][0]["py"], "ar": new_stories[idx-2]["content"][0]["ar"]},
        {"speaker": "B", "ch": new_stories[idx-2]["content"][1]["zh"], "py": new_stories[idx-2]["content"][1]["py"], "ar": new_stories[idx-2]["content"][1]["ar"]}
    ]

new_tests = [
    {"q": "أين يجب أن تضع (把) في الجملة؟", "options": ["قبل المفعول به", "بعد الفعل", "في نهاية الجملة", "قبل الفاعل"], "ans": 0},
    {"q": "ترجم: 'لقد أصبح الجو حاراً أكثر فأكثر'", "options": ["天气越来越热", "天气热极了", "天气真热", "天气比热大"], "ans": 0},
    {"q": "كيف تقول 'هل تشرب الشاي أم القهوة؟'", "options": ["你喝茶或者想咖啡", "你喝茶还是喝咖啡？", "你喝着咖啡？", "你要茶要咖啡吗？"], "ans": 1}
]
test_list = tests.get("BIGEXAM", tests)
test_list.extend(new_tests)
tests["BIGEXAM"] = test_list

save_json('lessons.json', lessons)
save_json('sentences.json', sentences)
save_json('dialogues.json', dialogues)
save_json('grammar.json', grammar)
save_json('tests.json', tests)

print("HSK3 core content successfully appended.")
