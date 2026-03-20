import json
import os

# 1. Load full_dict.js
with open('data/full_dict.js', 'r', encoding='utf-8') as f:
    content = f.read()
    json_str = content.replace('const FULL_DICT = ', '').strip()
    if json_str.endswith(';'):
        json_str = json_str[:-1]
    
    full_dict = json.loads(json_str)

# 2. Extract Vocab
hsk2_vocab = []
hsk3_vocab = []

for item in full_dict:
    if item.get('level') == 2:
        hsk2_vocab.append([item.get('zh', ''), item.get('py', ''), item.get('en', '')])
    elif item.get('level') == 3:
        hsk3_vocab.append([item.get('zh', ''), item.get('py', ''), item.get('en', '')])

with open('data/hsk2/vocab.json', 'w', encoding='utf-8') as f:
    json.dump({"W": hsk2_vocab}, f, ensure_ascii=False, indent=2)

with open('data/hsk3/vocab.json', 'w', encoding='utf-8') as f:
    json.dump({"W": hsk3_vocab}, f, ensure_ascii=False, indent=2)

# 3. Create Sample templates for others (Lessons, Sentences, Dialogues, Grammar, Tests)
def create_samples(level, vocab):
    hsk_num = str(level)
    path = f"data/hsk{hsk_num}/"
    
    # 3.1 Lessons
    lessons = {
        "TOPICS": [
            {
              "n": 1,
              "h": f"HSK{hsk_num} 词汇 1",
              "t": f"الوحدة الأولى - مستوى {hsk_num}",
              "s": f"HSK{hsk_num} Lesson 1",
              "tags": ["أساسيات", f"مستوى {hsk_num}"]
            },
            {
              "n": 2,
              "h": f"HSK{hsk_num} 词汇 2",
              "t": f"الوحدة الثانية - مستوى {hsk_num}",
              "s": f"HSK{hsk_num} Lesson 2",
              "tags": ["أساسيات", f"مستوى {hsk_num}"]
            }
        ],
        "STORIES": [
            {
              "id": 1,
              "level": "medium",
              "title": f"قصة {hsk_num} الأولى",
              "titleEn": f"HSK{hsk_num} Story 1",
              "content": [
                {
                  "zh": f"这是 HSK{hsk_num} 的第一段课文。",
                  "py": f"zhè shì HSK{hsk_num} de dì yī duàn kè wén.",
                  "ar": "هذا هو النص الأول."
                }
              ]
            }
        ],
        "GRAMMAR": [
            {"id": 1, "t": "Sample Grammar 1", "d": "توضيح القاعدة الأولى هنا."},
            {"id": 2, "t": "Sample Grammar 2", "d": "توضيح القاعدة الثانية هنا."}
        ],
        "pinyinExamples": {
            v[0]: v[1] for v in vocab[:10]
        }
    }
    with open(path + 'lessons.json', 'w', encoding='utf-8') as f:
        json.dump(lessons, f, ensure_ascii=False, indent=2)
        
    # 3.2 Sentences
    sentences = {
        "SENTS": {
            "1": [
                ["你好吗？", "nǐ hǎo ma?", "كيف حالك؟"],
                ["我很好。", "wǒ hěn hǎo.", "أنا بخير."]
            ],
            "2": [
                ["你叫什么名字？", "nǐ jiào shén me míng zi?", "ما اسمك؟"]
            ]
        }
    }
    with open(path + 'sentences.json', 'w', encoding='utf-8') as f:
        json.dump(sentences, f, ensure_ascii=False, indent=2)
        
    # 3.3 Dialogues
    dialogues = {
        "DIALOGUES": {
            "1": [
                {"speaker": "A", "ch": "你好！", "py": "nǐ hǎo!", "ar": "مرحباً!"},
                {"speaker": "B", "ch": "你好！很高兴认识你。", "py": "nǐ hǎo! hěn gāo xìng rèn shi nǐ.", "ar": "مرحباً! سعيد بلقائك."}
            ]
        }
    }
    with open(path + 'dialogues.json', 'w', encoding='utf-8') as f:
        json.dump(dialogues, f, ensure_ascii=False, indent=2)
        
    # 3.4 Grammar
    grammar = {
        "GRAMMAR": [
            {"id": 1, "title": f"قاعدة {hsk_num}.1", "desc": "شرح مبسط.", "ex": "例子 Lìzi (مثال)"}
        ]
    }
    with open(path + 'grammar.json', 'w', encoding='utf-8') as f:
        json.dump(grammar, f, ensure_ascii=False, indent=2)
        
    # 3.5 Tests
    tests = {
        "BIGEXAM": [
            {
                "type": "mcq",
                "q": "What does '你好' mean?",
                "options": ["Goodbye", "Hello", "Thanks", "Sorry"],
                "ans": 1
            }
        ]
    }
    with open(path + 'tests.json', 'w', encoding='utf-8') as f:
        json.dump(tests, f, ensure_ascii=False, indent=2)

create_samples(2, hsk2_vocab)
create_samples(3, hsk3_vocab)

print("HSK2 and HSK3 JSON files populated successfully!")
