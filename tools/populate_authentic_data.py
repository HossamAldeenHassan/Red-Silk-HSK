import json
import os

# --- HSK2 AUTHENTIC DATA ---

hsk2_lessons = {
  "TOPICS": [
    {
      "n": 1,
      "h": "旅游",
      "t": "السفر والسياحة",
      "s": "Travel & Tourism",
      "tags": ["سفر", "أشهر", "مستوى 2"]
    },
    {
      "n": 2,
      "h": "运动",
      "t": "الرياضة والصحة",
      "s": "Sports & Health",
      "tags": ["رياضة", "صحة", "مستوى 2"]
    }
  ],
  "STORIES": [
    {
      "id": 1,
      "level": "medium",
      "title": "رحلة إلى بكين",
      "titleEn": "A Trip to Beijing",
      "content": [
        {"zh": "我要去北京旅游。", "py": "Wǒ yào qù Běijīng lǚyóu.", "ar": "أريد الذهاب إلى بكين للسياحة."},
        {"zh": "九月去北京旅游最好。", "py": "Jiǔyuè qù Běijīng lǚyóu zuì hǎo.", "ar": "شهر سبتمبر هو أفضل وقت لزيارة بكين."},
        {"zh": "九月的北京不冷也不热。", "py": "Jiǔyuè de Běijīng bù lěng yě bù rè.", "ar": "بكين في سبتمبر ليست باردة ولا حارة."}
      ]
    },
    {
      "id": 2,
      "level": "medium",
      "title": "ممارسة الرياضة",
      "titleEn": "Doing Sports",
      "content": [
        {"zh": "你喜欢什么运动？", "py": "Nǐ xǐhuan shénme yùndòng?", "ar": "ما هي الرياضة التي تحبها؟"},
        {"zh": "我最喜欢踢足球。", "py": "Wǒ zuì xǐhuan tī zúqiú.", "ar": "أنا أحب لعب كرة القدم أكثر شيء."},
        {"zh": "下午我们一起去踢足球吧。", "py": "Xiàwǔ wǒmen yìqǐ qù tī zúqiú ba.", "ar": "دعنا نذهب لنلعب كرة القدم معاً بعد الظهر."}
      ]
    }
  ],
  "GRAMMAR": [
    {"id": 1, "t": "التعبير عن الأفضل باستخدام (最)", "d": "تستخدم 最 قبل الصفات أو الأفعال النفسية للتعبير عن الأفضلية أو الدرجة القصوى.", "title":"أداة التفضيل 最", "desc":"تستخدم (最) قبل الفعل أو الصفة.", "ex":"我最喜欢吃米饭。 (أنا أحب أكل الأرز أكثر من أي شيء)"},
    {"id": 2, "t": "الشهور والفصول", "d": "في الصينية، تضاف كلمة 月 بعد الرقم للتعبير عن الشهر.", "title":"أشهر السنة", "desc":"رقم + 月", "ex":"九月 (شهر تسعة / سبتمبر)"}
  ],
  "pinyinExamples": {
    "旅游": "lǚ yóu",
    "觉得": "jué de",
    "最": "zuì",
    "为什么": "wèi shén me",
    "也": "yě"
  }
}

hsk2_sentences = {
  "SENTS": {
    "1": [
      ["你要去哪儿？", "Nǐ yào qù nǎr?", "إلى أين تريد الذهاب؟"],
      ["我觉得九月去北京旅游最好。", "Wǒ juéde jiǔyuè qù Běijīng lǚyóu zuì hǎo.", "أعتقد أن سبتمبر هو أفضل وقت لزيارة بكين."]
    ],
    "2": [
      ["你喜欢什么运动？", "Nǐ xǐhuan shénme yùndòng?", "ما هي الرياضة التي تحبها؟"],
      ["我们一起去踢足球吧。", "Wǒmen yìqǐ qù tī zúqiú ba.", "دعنا نذهب لنلعب كرة القدم معاً."]
    ]
  }
}

hsk2_dialogues = {
  "DIALOGUES": {
    "1": [
      {"speaker": "A", "ch": "我要去北京旅游，你觉得什么时候去最好？", "py": "Wǒ yào qù Běijīng lǚyóu, nǐ juéde shénme shíhou qù zuì hǎo?", "ar": "أريد السفر إلى بكين، متى تعتقد أنه أفضل وقت للذهاب؟"},
      {"speaker": "B", "ch": "九月去北京旅游最好。", "py": "Jiǔyuè qù Běijīng lǚyóu zuì hǎo.", "ar": "سبتمبر هو أفضل وقت لزيارة بكين."},
      {"speaker": "A", "ch": "为什么？", "py": "Wèi shénme?", "ar": "لماذا؟"},
      {"speaker": "B", "ch": "因为九月的北京，不冷也不热。", "py": "Yīnwèi jiǔyuè de Běijīng, bù lěng yě bù rè.", "ar": "لأن بكين في سبتمبر ليست باردة ولا حارة."}
    ]
  }
}

hsk2_tests = {
  "BIGEXAM": [
    {
      "q": "اختر المعنى الصحيح لكلمة '旅游'",
      "options": ["رياضة", "سفر / سياحة", "مدرسة", "مستشفى"],
      "ans": 1
    },
    {
      "q": "رتب الجملة: 去 / 我 / 最好 / 觉得 / 九月 / 北京",
      "options": ["我觉得九月去北京最好", "我九月最好去北京觉得", "觉得去北京我九月最好", "北京九月去我觉得最好"],
      "ans": 0
    }
  ]
}

# --- HSK3 AUTHENTIC DATA ---

hsk3_lessons = {
  "TOPICS": [
    {
      "n": 1,
      "h": "周末",
      "t": "عطلة نهاية الأسبوع",
      "s": "The Weekend",
      "tags": ["وقت", "خطط", "مستوى 3"]
    }
  ],
  "STORIES": [
    {
      "id": 1,
      "level": "hard",
      "title": "خطط عطلة نهاية الأسبوع",
      "titleEn": "Weekend Plans",
      "content": [
        {"zh": "周末你有什么打算？", "py": "Zhōumò nǐ yǒu shénme dǎsuàn?", "ar": "ما هي خططك لعطلة نهاية الأسبوع؟"},
        {"zh": "我早就想好了，请你吃饭、看电影、喝咖啡。", "py": "Wǒ zǎo jiù xiǎng hǎo le, qǐng nǐ chīfàn, kàn diànyǐng, hē kāfēi.", "ar": "لقد قررت منذ وقت طويل، سأعزمك على الطعام، مشاهدة فيلم، وشرب القهوة."},
        {"zh": "我已经找好饭馆了，电影票也买好了。", "py": "Wǒ yǐjīng zhǎo hǎo fànguǎn le, diànyǐng piào yě mǎi hǎo le.", "ar": "لقد وجدت المطعم بالفعل، وتذاكر الفيلم اشتريتُها أيضاً."}
      ]
    }
  ],
  "GRAMMAR": [
    {"id": 1, "title": "استخدام (早就) و (已经)", "desc": "تستخدم للتعبير عن أن الفعل قد تم أو أن الفكرة كانت موجودة منذ فترة.", "ex": "我早就知道了 (لقد عرفت ذلك منذ زمن)"}
  ],
  "pinyinExamples": {
    "周末": "zhōu mò",
    "打算": "dǎ suàn",
    "早就": "zǎo jiù",
    "已经": "yǐ jīng"
  }
}

hsk3_sentences = {
  "SENTS": {
    "1": [
      ["周末你有什么打算？", "Zhōumò nǐ yǒu shénme dǎsuàn?", "ما هي خططك لعطلة نهاية الأسبوع؟"],
      ["我早就想好了。", "Wǒ zǎo jiù xiǎng hǎo le.", "لقد خططت لذلك منذ فترة طويلة."]
    ]
  }
}

hsk3_dialogues = {
  "DIALOGUES": {
    "1": [
      {"speaker": "A", "ch": "周末你有什么打算？", "py": "Zhōumò nǐ yǒu shénme dǎsuàn?", "ar": "ما هي خططك لعطلة نهاية الأسبوع؟"},
      {"speaker": "B", "ch": "我早就想好了，请你吃饭，看电影，喝咖啡。", "py": "Wǒ zǎo jiù xiǎng hǎo le, qǐng nǐ chīfàn, kàn diànyǐng, hē kāfēi.", "ar": "لقد خططت منذ زمن، سأدعوك لتناول الطعام، فيلم، وقهوة."}
    ]
  }
}

hsk3_tests = {
  "BIGEXAM": [
    {
      "q": "ما معنى '打算'؟",
      "options": ["خطة / ينوي", "يسافر", "يشرب", "ينام"],
      "ans": 0
    }
  ]
}

# Writing HSK2
with open('data/hsk2/lessons.json', 'w', encoding='utf-8') as f:
    json.dump(hsk2_lessons, f, ensure_ascii=False, indent=2)
with open('data/hsk2/sentences.json', 'w', encoding='utf-8') as f:
    json.dump(hsk2_sentences, f, ensure_ascii=False, indent=2)
with open('data/hsk2/dialogues.json', 'w', encoding='utf-8') as f:
    json.dump(hsk2_dialogues, f, ensure_ascii=False, indent=2)
with open('data/hsk2/grammar.json', 'w', encoding='utf-8') as f:
    # Use array wrapper keeping exactly HSK1 schema
    json.dump({"GRAMMAR": hsk2_lessons["GRAMMAR"]}, f, ensure_ascii=False, indent=2)
with open('data/hsk2/tests.json', 'w', encoding='utf-8') as f:
    json.dump(hsk2_tests, f, ensure_ascii=False, indent=2)

# Writing HSK3
with open('data/hsk3/lessons.json', 'w', encoding='utf-8') as f:
    json.dump(hsk3_lessons, f, ensure_ascii=False, indent=2)
with open('data/hsk3/sentences.json', 'w', encoding='utf-8') as f:
    json.dump(hsk3_sentences, f, ensure_ascii=False, indent=2)
with open('data/hsk3/dialogues.json', 'w', encoding='utf-8') as f:
    json.dump(hsk3_dialogues, f, ensure_ascii=False, indent=2)
with open('data/hsk3/grammar.json', 'w', encoding='utf-8') as f:
    json.dump({"GRAMMAR": hsk3_lessons["GRAMMAR"]}, f, ensure_ascii=False, indent=2)
with open('data/hsk3/tests.json', 'w', encoding='utf-8') as f:
    json.dump(hsk3_tests, f, ensure_ascii=False, indent=2)

print("Authentic bilingual content inserted successfully.")
