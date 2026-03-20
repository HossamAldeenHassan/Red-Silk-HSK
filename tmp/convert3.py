import re, json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def repair_and_parse(js_str):
    js_str = re.sub(r'//.*?\n', '\n', js_str)
    # Wrap keys in double quotes, supporting unicode
    js_str = re.sub(r'([{,]\s*)([^\s:,{}"]+)\s*:', r'\1"\2":', js_str)
    js_str = re.sub(r',\s*([}\]])', r'\1', js_str)
    
    try:
        return json.loads(js_str)
    except json.JSONDecodeError:
        # replace single quoted strings with double quotes
        def repl(match):
            inner = match.group(1).replace('"', '\\"')
            return '"' + inner + '"'
        js_str = re.sub(r"(?<!\\)'(.*?[^\\])'", repl, js_str)
        return json.loads(js_str)

blocks = {}
with open(r"e:\HSK1_Master-main22\data\data.js", "r", encoding="utf-8") as f:
    text = f.read()

for name in ["W", "TOPICS", "SENTS", "STORIES", "pinyinExamples"]:
    m = re.search(r'(?:const|let)\s+' + name + r'\s*=\s*(\[.*?\]|{.*?});', text, re.DOTALL)
    if m:
        blocks[name] = repair_and_parse(m.group(1))

hsk1_lessons = {
    "TOPICS": blocks.get("TOPICS", []),
    "STORIES": blocks.get("STORIES", []),
    "pinyinExamples": blocks.get("pinyinExamples", {})
}
with open(r"e:\HSK1_Master-main22\data\hsk1_lessons.json", "w", encoding="utf-8") as f:
    json.dump(hsk1_lessons, f, ensure_ascii=False, indent=2)

print("done")
