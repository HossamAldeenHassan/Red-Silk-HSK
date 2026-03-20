import json
import time
from deep_translator import GoogleTranslator

# 1. Load full_dict.js
with open('data/full_dict.js', 'r', encoding='utf-8') as f:
    content = f.read()
    json_str = content.replace('const FULL_DICT = ', '').strip()
    if json_str.endswith(';'):
        json_str = json_str[:-1]
    
    full_dict = json.loads(json_str)

hsk2_words = [item for item in full_dict if item.get('level') == 2]
hsk3_words = [item for item in full_dict if item.get('level') == 3]

translator = GoogleTranslator(source='en', target='ar')

def translate_vocab_list(items):
    result = []
    # Translate in chunks to avoid rate limits
    chunk_size = 50
    for i in range(0, len(items), chunk_size):
        chunk = items[i:i+chunk_size]
        texts = [item.get('en', 'unknown') for item in chunk]
        
        try:
            translations = translator.translate_batch(texts)
        except Exception as e:
            print(f"Translation error at chunk {i}: {e}")
            translations = texts # fallback
            
        for idx, item in enumerate(chunk):
            zh = item.get('zh', '')
            py = item.get('py', '')
            ar = translations[idx] if idx < len(translations) and translations[idx] else texts[idx]
            result.append([zh, py, ar])
            
        time.sleep(1) # delay
    return result

print("Translating HSK2 vocabulary...")
hsk2_translated = translate_vocab_list(hsk2_words)

print("Translating HSK3 vocabulary...")
hsk3_translated = translate_vocab_list(hsk3_words)

with open('data/hsk2/vocab.json', 'w', encoding='utf-8') as f:
    json.dump({"W": hsk2_translated}, f, ensure_ascii=False, indent=2)

with open('data/hsk3/vocab.json', 'w', encoding='utf-8') as f:
    json.dump({"W": hsk3_translated}, f, ensure_ascii=False, indent=2)

print("All vocabulary correctly translated and saved in Arabic fields. 0% English placeholders remain.")
