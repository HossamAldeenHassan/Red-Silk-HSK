import re, json

def repair_and_parse(js_str):
    # Remove single-line comments
    js_str = re.sub(r'//.*?\n', '\n', js_str)
    
    # This regex looks for word characters before a colon, not inside quotes, and wraps them in quotes
    # A bit tricky, let's just find: \s+([a-zA-Z0-9_]+)\s*:
    js_str = re.sub(r'([{,]\s*)([a-zA-Z0-9_]+)\s*:', r'\1"\2":', js_str)
    
    # Handle single quotes instead of double quotes for strings
    # This might break if there's an escaped single quote inside
    # Let's replace 'string' with "string" carefully
    # Luckily, most strings in data.js are probably double-quoted. If there are single quotes, json.loads will fail.
    # Let's replace \' with an escaped quote, then replace '...' with "..."
    # Actually, let's just try to remove trailing commas first
    js_str = re.sub(r',\s*([}\]])', r'\1', js_str)
    
    # Now, let's see if we can parse it
    try:
        return json.loads(js_str)
    except json.JSONDecodeError as e:
        # If it fails due to single quotes:
        print("Failed, trying single-quote fix...", e)
        # Attempt to replace 'x' with "x"
        def repl(match):
            inner = match.group(1)
            inner = inner.replace('"', '\\"') # escape double quotes inside
            return '"' + inner + '"'
        
        js_str_fixed = re.sub(r"(?<!\\)'(.*?[^\\])'", repl, js_str)
        try:
            return json.loads(js_str_fixed)
        except Exception as e2:
            print("Still failed:", e2)
            # Find the error location
            err_line = e2.lineno if hasattr(e2, 'lineno') else 0
            lines = js_str_fixed.split('\n')
            start = max(0, err_line - 3)
            end = min(len(lines), err_line + 3)
            print("Context around error:")
            for i in range(start, end):
                print(f"{i+1}: {lines[i]}")
            return None

with open(r"e:\HSK1_Master-main22\data\data.js", "r", encoding="utf-8") as f:
    text = f.read()

blocks = {}
for name in ["W", "TOPICS", "SENTS", "STORIES", "pinyinExamples"]:
    m = re.search(r'(?:const|let)\s+' + name + r'\s*=\s*(\[.*?\]|{.*?});', text, re.DOTALL)
    if m:
        raw = m.group(1)
        print(f"Parsing {name}...")
        blocks[name] = repair_and_parse(raw)

if blocks.get("STORIES") and blocks.get("pinyinExamples"):
    hsk1_lessons = {
        "TOPICS": blocks.get("TOPICS", []),
        "STORIES": blocks.get("STORIES", []),
        "pinyinExamples": blocks.get("pinyinExamples", {})
    }
    with open(r"e:\HSK1_Master-main22\data\hsk1_lessons.json", "w", encoding="utf-8") as f:
        json.dump(hsk1_lessons, f, ensure_ascii=False, indent=2)
    print("Successfully wrote hsk1_lessons.json")
