import re, json

def clean_js_to_json(js_str):
    # Remove single line comments
    js_str = re.sub(r'//.*?\n', '\n', js_str)
    # Add quotes around keys
    js_str = re.sub(r'(?<!")([a-zA-Z0-9_]+)(?=\s*:)', r'"\1"', js_str)
    # Remove trailing commas
    js_str = re.sub(r',\s*([}\]])', r'\1', js_str)
    return js_str

try:
    with open(r"e:\HSK1_Master-main22\data\data.js", "r", encoding="utf-8") as f:
        text = f.read()

    blocks = {}
    for name in ["W", "TOPICS", "SENTS", "STORIES", "pinyinExamples"]:
        m = re.search(r'(?:const|let)\s+' + name + r'\s*=\s*(\[.*?\]|{.*?});', text, re.DOTALL)
        if m:
            raw = m.group(1)
            cleaned = clean_js_to_json(raw)
            try:
                blocks[name] = json.loads(cleaned)
            except Exception as e:
                print(f"Error parsing {name}: {e}")
                # Print snippet around error
                import traceback
                print(traceback.format_exc())

    with open(r"e:\HSK1_Master-main22\data\hsk1_vocab.json", "w", encoding="utf-8") as f:
        json.dump({"W": blocks.get("W", [])}, f, ensure_ascii=False, indent=2)

    with open(r"e:\HSK1_Master-main22\data\hsk1_sentences.json", "w", encoding="utf-8") as f:
        json.dump({"SENTS": blocks.get("SENTS", {})}, f, ensure_ascii=False, indent=2)

    hsk1_lessons = {
        "TOPICS": blocks.get("TOPICS", []),
        "STORIES": blocks.get("STORIES", []),
        "pinyinExamples": blocks.get("pinyinExamples", {})
    }
    with open(r"e:\HSK1_Master-main22\data\hsk1_lessons.json", "w", encoding="utf-8") as f:
        json.dump(hsk1_lessons, f, ensure_ascii=False, indent=2)

    print("Success")

except Exception as e:
    print("Fatal:", e)
