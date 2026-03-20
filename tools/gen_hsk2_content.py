import json
import os

def load_json(filename):
    with open(f'data/hsk2/{filename}', 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(filename, data):
    with open(f'data/hsk2/{filename}', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

lessons = load_json('lessons.json')
sentences = load_json('sentences.json')
dialogues = load_json('dialogues.json')
grammar = load_json('grammar.json')
tests = load_json('tests.json')

# HSK2 New Core Content (Lessons 3 to 15)
new_topics = [
    {"n": 3, "h": "颜色", "t": "الألوان والملابس", "s": "Colors & Clothes", "tags": ["ألوان", "تسوق"]},
    {"n": 4, "h": "时间", "t": "الوقت والمواعيد", "s": "Time & Appointments", "tags": ["وقت", "ساعة"]},
    {"n": 5, "h": "天气", "t": "الطقس والفصول", "s": "Weather & Seasons", "tags": ["طقس", "مطر"]},
    {"n": 6, "h": "看病", "t": "الصحة وزيارة الطبيب", "s": "Health & Doctor", "tags": ["صحة", "مستشفى"]},
    {"n": 7, "h": "爱好", "t": "الهوايات والأنشطة", "s": "Hobbies & Activities", "tags": ["هوايات", "موسيقى"]},
    {"n": 8, "h": "工作", "t": "العمل والشركات", "s": "Work & Company", "tags": ["عمل", "مكتب"]},
    {"n": 9, "h": "方向", "t": "الاتجاهات والأماكن", "s": "Directions & Places", "tags": ["مكان", "طريق"]},
    {"n": 10, "h": "交通", "t": "المواصلات", "s": "Transportation", "tags": ["مواصلات", "سفر"]},
    {"n": 11, "h": "吃饭", "t": "المطعم والطعام", "s": "Restaurant & Food", "tags": ["طعام", "مطعم"]},
    {"n": 12, "h": "买东西", "t": "التسوق والأسعار", "s": "Shopping & Prices", "tags": ["تسوق", "نقود"]},
    {"n": 13, "h": "学习", "t": "الدراسة والامتحانات", "s": "Study & Exams", "tags": ["دراسة", "مدرسة"]},
    {"n": 14, "h": "生活", "t": "الحياة اليومية", "s": "Daily Life", "tags": ["حياة", "روتين"]},
    {"n": 15, "h": "节日", "t": "الأعياد والمناسبات", "s": "Festivals & Events", "tags": ["أعياد", "احتفال"]}
]

new_stories = [
    {"id": 3, "level": "medium", "title": "شراء الملابس", "titleEn": "Buying Clothes", "content": [{"zh": "这件红色的衣服真漂亮！", "py": "Zhè jiàn hóngsè de yīfu zhēn piàoliang!", "ar": "هذا الثوب الأحمر جميل جداً!"}, {"zh": "是的，我也觉得。", "py": "Shì de, wǒ yě juéde.", "ar": "نعم، أنا أيضاً أعتقد ذلك."}]},
    {"id": 4, "level": "medium", "title": "الساعة الان", "titleEn": "What time is it", "content": [{"zh": "现在几点？", "py": "Xiànzài jǐ diǎn?", "ar": "كم الساعة الآن؟"}, {"zh": "现在早上八点半。", "py": "Xiànzài zǎoshang bā diǎn bàn.", "ar": "الآن الثامنة والنصف صباحاً."}]},
    {"id": 5, "level": "medium", "title": "الطقس اليوم", "titleEn": "Weather Today", "content": [{"zh": "今天天气怎么样？", "py": "Jīntiān tiānqì zěnmeyàng?", "ar": "كيف هو الطقس اليوم؟"}, {"zh": "今天下雨，很冷。", "py": "Jīntiān xià yǔ, hěn lěng.", "ar": "اليوم ممطر وبارد جداً."}]},
    {"id": 6, "level": "medium", "title": "في المستشفى", "titleEn": "At the Hospital", "content": [{"zh": "你怎么了？", "py": "Nǐ zěnme le?", "ar": "ما بك؟"}, {"zh": "我生病了，肚子疼。", "py": "Wǒ shēngbìng le, dùzi téng.", "ar": "أنا مريض، معدتي تؤلمني."}]},
    {"id": 7, "level": "medium", "title": "الهوايات", "titleEn": "Hobbies", "content": [{"zh": "你会唱歌吗？", "py": "Nǐ huì chànggē ma?", "ar": "هل تجيد الغناء؟"}, {"zh": "我会，我非常喜欢唱歌。", "py": "Wǒ huì, wǒ fēicháng xǐhuan chànggē.", "ar": "أجيد ذلك، أحب الغناء كثيراً."}]},
    {"id": 8, "level": "medium", "title": "العمل", "titleEn": "Work", "content": [{"zh": "你在哪里工作？", "py": "Nǐ zài nǎlǐ gōngzuò?", "ar": "أين تعمل؟"}, {"zh": "我在一家大公司工作。", "py": "Wǒ zài yì jiā dà gōngsī gōngzuò.", "ar": "أعمل في شركة كبيرة."}]},
    {"id": 9, "level": "medium", "title": "سؤال عن الطريق", "titleEn": "Asking for Directions", "content": [{"zh": "请问，医院在前面吗？", "py": "Qǐngwèn, yīyuàn zài qiánmiàn ma?", "ar": "عذراً، هل المستشفى في الأمام؟"}, {"zh": "不在前面，在右边。", "py": "Bú zài qiánmiàn, zài yòubian.", "ar": "ليست في الأمام، بل في الجهة اليمنى."}]},
    {"id": 10, "level": "medium", "title": "المواصلات", "titleEn": "Transportation", "content": [{"zh": "你怎么去学校？", "py": "Nǐ zěnme qù xuéxiào?", "ar": "كيف تذهب إلى المدرسة؟"}, {"zh": "我坐公共汽车去学校。", "py": "Wǒ zuò gōnggòng qìchē qù xuéxiào.", "ar": "أذهب إلى المدرسة بالحافلة العامة."}]},
    {"id": 11, "level": "medium", "title": "طلب الطعام", "titleEn": "Ordering Food", "content": [{"zh": "服务员，点菜！", "py": "Fúwùyuán, diǎn cài!", "ar": "يا نادل، أريد أن أطلب الطعام!"}, {"zh": "你想吃什么？", "py": "Nǐ xiǎng chī shénme?", "ar": "ماذا تريد أن تأكل؟"}]},
    {"id": 12, "level": "medium", "title": "التسوق", "titleEn": "Shopping", "content": [{"zh": "这个手机多少钱？", "py": "Zhège shǒujī duōshao qián?", "ar": "بكم هذا الهاتف المحمول؟"}, {"zh": "这个手机五千块。", "py": "Zhège shǒujī wǔqiān kuài.", "ar": "هذا الهاتف بخمسة آلاف يوان."}]},
    {"id": 13, "level": "medium", "title": "الامتحان", "titleEn": "The Exam", "content": [{"zh": "明天的考试你准备好了吗？", "py": "Míngtiān de kǎoshì nǐ zhǔnbèi hǎo le ma?", "ar": "هل استعددت لامتحان الغد؟"}, {"zh": "准备好了。", "py": "Zhǔnbèi hǎo le.", "ar": "نعم استعددت."}]},
    {"id": 14, "level": "medium", "title": "الروتين اليومي", "titleEn": "Daily Routine", "content": [{"zh": "你每天几点起床？", "py": "Nǐ měitiān jǐ diǎn qǐchuáng?", "ar": "في أي ساعة تستيقظ كل يوم؟"}, {"zh": "我每天早上七点起床。", "py": "Wǒ měitiān zǎoshang qī diǎn qǐchuáng.", "ar": "أستيقظ كل يوم في السابعة صباحاً."}]},
    {"id": 15, "level": "medium", "title": "عيد ميلاد سعيد", "titleEn": "Happy Birthday", "content": [{"zh": "祝你生日快乐！", "py": "Zhù nǐ shēngrì kuàilè!", "ar": "أتمنى لك عيد ميلاد سعيد!"}, {"zh": "谢谢大家！", "py": "Xièxie dàjiā!", "ar": "شكراً للجميع!"}]}
]

new_grammar = [
    {"id": 3, "title": "التعبير عن التعجب بـ (真)", "desc": "تُستخدم (真) بمعنى (حقاً) قبل الصفة.", "ex": "真漂亮 (جميل حقاً)"},
    {"id": 4, "title": "الإشارة للزمن", "desc": "الزمن يوضع في بداية الجملة أو بعد الفاعل مباشرة.", "ex": "我明天去 (سأذهب غداً)"},
    {"id": 5, "title": "التعبير عن الاستمرارية", "desc": "تستخدم 在 قبل الفعل للإشارة للاستمرارية.", "ex": "她在看书 (هي تقرأ كتاباً الآن)"},
    {"id": 6, "title": "التعبير عن التغيير بـ (了)", "desc": "توضع 了 في نهاية الجملة للدلالة على حالة جديدة.", "ex": "下雨了 (بدأ المطر بالهطول)"},
    {"id": 7, "title": "السؤال المذيل بـ (吧)", "desc": "تضاف 吧 في نهاية الجملة لاقتراح أمر أو لتأكيد تخمين.", "ex": "我们走吧 (دعنا نذهب)"},
    {"id": 8, "title": "أداة المقارنة (比)", "desc": "تستخدم للمقارنة بين شيئين: A + 比 + B + صفة", "ex": "哥哥比我高 (أخي الأكبر أطول مني)"},
    {"id": 9, "title": "التعبير عن المسافة بـ (离)", "desc": "تستخدم للإشارة إلى المسافة بين مكانين.", "ex": "我家离学校很远 (منزلي بعيد عن المدرسة)"},
    {"id": 10, "title": "الفعل المساعد (可以)", "desc": "يعني (يمكن) أو (يسمح).", "ex": "我可以坐这儿吗？ (هل يمكنني الجلوس هنا؟)"},
    {"id": 11, "title": "استخدام (因为...所以...)", "desc": "لربط السبب بالنتيجة (لأن... لذلك...).", "ex": "因为下雨，所以我没去 (لأن الجو ممطر، لم أذهب)"},
    {"id": 12, "title": "الاقتران بـ (虽然...但是...)", "desc": "وتعني (على الرغم من... لكن...).", "ex": "虽然我不会说，但是听得懂 (رغم أنني لا أتحدثها، لكني أفهمها)"},
    {"id": 13, "title": "الكلمة المساعدة (得)", "desc": "تربط الفعل بالحال لوصف كيفية أداء الفعل.", "ex": "他说得很好 (هو يتحدث بشكل جيد جداً)"},
    {"id": 14, "title": "الجملة الشرطية (要是...就...)", "desc": "تعني (إذا... فـ...).", "ex": "要是你喜欢，就买吧 (إذا أعجبك، فاشتره)"},
    {"id": 15, "title": "التعبير بـ (过)", "desc": "يضاف للفعل للدلالة على تجربة سابقة.", "ex": "我去过中国 (لقد زرت الصين من قبل)"}
]

lessons["TOPICS"].extend(new_topics)
lessons["STORIES"].extend(new_stories)

# Convert grammar back to dict if needed by UI, but UI handles array
grammar_list = grammar.get("GRAMMAR", grammar)
if isinstance(grammar_list, dict):
    grammar_list = grammar_list.get("GRAMMAR", [])
grammar_list.extend(new_grammar)
grammar["GRAMMAR"] = grammar_list

for idx in range(3, 16):
    topic_id = str(idx)
    # Add dummy sentences for all topics
    sentences["SENTS"][topic_id] = [
        [new_stories[idx-3]["content"][0]["zh"], new_stories[idx-3]["content"][0]["py"], new_stories[idx-3]["content"][0]["ar"]]
    ]
    # Add dummy dialogues for all topics
    dialogues["DIALOGUES"][topic_id] = [
        {"speaker": "A", "ch": new_stories[idx-3]["content"][0]["zh"], "py": new_stories[idx-3]["content"][0]["py"], "ar": new_stories[idx-3]["content"][0]["ar"]},
        {"speaker": "B", "ch": new_stories[idx-3]["content"][1]["zh"], "py": new_stories[idx-3]["content"][1]["py"], "ar": new_stories[idx-3]["content"][1]["ar"]}
    ]

# Add test questions covering lessons 3-15 dynamically
new_tests = [
    {"q": "ما هو معنى كلمة '颜色'؟", "options": ["ألوان", "أسعار", "وقت", "مستشفى"], "ans": 0},
    {"q": "أكمل الجملة المقارنة: 哥哥 ___ 我高。", "options": ["对", "比", "在", "的"], "ans": 1},
    {"q": "كيف تعبر عن اقتراب هطول المطر؟", "options": ["下雨了", "雨下了", "下雨过", "下着雨"], "ans": 0}
]
test_list = tests.get("BIGEXAM", tests)
test_list.extend(new_tests)
tests["BIGEXAM"] = test_list

save_json('lessons.json', lessons)
save_json('sentences.json', sentences)
save_json('dialogues.json', dialogues)
save_json('grammar.json', grammar)
save_json('tests.json', tests)

print("HSK2 core content successfully appended.")
