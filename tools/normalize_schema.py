"""
Normalizes HSK2 and HSK3 JSON files to match HSK1's exact schema.
Fixes:
  - vocab.json: Ensure W items are [hanzi, pinyin, arabic, type, topicNum]
  - grammar.json: Normalize keys to {id, title, en, formula, color, exp, rules, ex, q}
  - tests.json: Normalize keys to {q, zh, opts, a, exp}
"""
import json
import sys
import os
import math

sys.stdout.reconfigure(encoding='utf-8')

def fix_vocab(level):
    """Ensure vocab items have 5 elements: [hanzi, pinyin, arabic, type, topicNum]"""
    path = f'data/{level}/vocab.json'
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    
    W = data.get('W', [])
    fixed = []
    topics_count = 15 if level == 'hsk2' else 20
    words_per_topic = max(1, math.ceil(len(W) / topics_count))
    
    for i, w in enumerate(W):
        if len(w) >= 5:
            fixed.append(w)  # already correct
        else:
            hanzi = w[0] if len(w) > 0 else ''
            pinyin = w[1] if len(w) > 1 else ''
            arabic = w[2] if len(w) > 2 else ''
            word_type = w[3] if len(w) > 3 else ''
            topic_num = w[4] if len(w) > 4 else (i // words_per_topic) + 1
            # Cap topic_num to available topics
            topic_num = min(topic_num, topics_count)
            fixed.append([hanzi, pinyin, arabic, word_type, topic_num])
    
    data['W'] = fixed
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'  [{level}] vocab.json: Fixed {len(fixed)} words to 5-element arrays')

def fix_grammar(level):
    """Normalize grammar keys to match HSK1 schema"""
    path = f'data/{level}/grammar.json'
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    
    GRAMMAR = data.get('GRAMMAR', [])
    fixed = []
    colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e']
    
    for i, g in enumerate(GRAMMAR):
        normalized = {
            'id': g.get('id', i + 1),
            'title': g.get('title', g.get('t', '')),
            'en': g.get('en', g.get('d', g.get('desc', ''))),
            'formula': g.get('formula', g.get('title', g.get('t', ''))),
            'color': g.get('color', colors[i % len(colors)]),
            'exp': g.get('exp', g.get('desc', g.get('d', ''))),
            'rules': g.get('rules', []),
            'ex': g.get('ex', []),
            'q': g.get('q', [])
        }
        # If rules is empty, generate from desc
        if not normalized['rules'] and normalized['exp']:
            normalized['rules'] = [normalized['exp']]
        # If ex is list of strings, convert to proper format
        if normalized['ex'] and isinstance(normalized['ex'][0], str):
            normalized['ex'] = [{'zh': e, 'py': '', 'ar': ''} for e in normalized['ex']]
        elif normalized['ex'] and isinstance(normalized['ex'][0], dict):
            # Ensure dict format matches HSK1: {zh, py, ar}
            new_ex = []
            for e in normalized['ex']:
                new_ex.append({
                    'zh': e.get('zh', e.get('cn', '')),
                    'py': e.get('py', e.get('pinyin', '')),
                    'ar': e.get('ar', e.get('meaning', ''))
                })
            normalized['ex'] = new_ex
        fixed.append(normalized)
    
    data['GRAMMAR'] = fixed
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'  [{level}] grammar.json: Normalized {len(fixed)} grammar rules')

def fix_tests(level):
    """Normalize test keys to match HSK1 schema: {q, zh, opts, a, exp}"""
    path = f'data/{level}/tests.json'
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    
    BIGEXAM = data.get('BIGEXAM', [])
    fixed = []
    
    for t in BIGEXAM:
        normalized = {
            'q': t.get('q', ''),
            'zh': t.get('zh', ''),
            'opts': t.get('opts', t.get('options', [])),
            'a': t.get('a', t.get('ans', 0)),
            'exp': t.get('exp', '')
        }
        fixed.append(normalized)
    
    data['BIGEXAM'] = fixed
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'  [{level}] tests.json: Normalized {len(fixed)} test questions')

def fix_dialogues(level):
    """Ensure DIALOGUES dict keys match expected topic numbers"""
    path = f'data/{level}/dialogues.json'
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    
    DIALOGUES = data.get('DIALOGUES', {})
    # Convert string keys to ensure consistency
    fixed = {}
    for k, v in DIALOGUES.items():
        fixed[str(k)] = v
    
    data['DIALOGUES'] = fixed
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'  [{level}] dialogues.json: {len(fixed)} dialogue topics')

def fix_sentences(level):
    """Ensure SENTS dict values are arrays of sentence arrays"""
    path = f'data/{level}/sentences.json'
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    
    SENTS = data.get('SENTS', {})
    # Ensure keys are string numbers
    fixed = {}
    for k, v in SENTS.items():
        if isinstance(v, list):
            # Ensure each sentence has at least 3 elements: [zh, pinyin, arabic]
            normalized = []
            for s in v:
                if isinstance(s, list) and len(s) >= 3:
                    normalized.append(s)
                elif isinstance(s, list) and len(s) == 2:
                    normalized.append(s + [''])
                elif isinstance(s, list) and len(s) == 1:
                    normalized.append(s + ['', ''])
            fixed[str(k)] = normalized
        else:
            fixed[str(k)] = v
    
    data['SENTS'] = fixed
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'  [{level}] sentences.json: {len(fixed)} sentence groups')

# Run for HSK2 and HSK3
for level in ['hsk2', 'hsk3']:
    print(f'\nNormalizing {level.upper()}...')
    fix_vocab(level)
    fix_grammar(level)
    fix_tests(level)
    fix_dialogues(level)
    fix_sentences(level)

print('\nAll HSK2/3 JSON schemas normalized to match HSK1!')
