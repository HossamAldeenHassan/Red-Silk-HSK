"""
Normalizes HSK2 and HSK3 dialogues.json to match HSK1's structure.
HSK1 schema: DIALOGUES = { "1": [{ title, speakers: ["A","B"], lines: [{sp: 0, zh, py, ar}] }] }
HSK2/3 flat schema: DIALOGUES = { "1": [{ speaker: "A", ch, py, ar }] }
"""
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

for level in ['hsk2', 'hsk3']:
    path = f'data/{level}/dialogues.json'
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    
    DIALOGUES = data.get('DIALOGUES', {})
    normalized_dialogues = {}
    
    # In HSK2/3, some datasets use keys 1..20, or have gaps. 
    # The topic mapping is fine, but the arrays need conversion.
    for k, lines_list in DIALOGUES.items():
        if not lines_list:
            continue
            
        # Check if already normalized
        if isinstance(lines_list[0], dict) and 'lines' in lines_list[0]:
            normalized_dialogues[str(k)] = lines_list
            continue
            
        # Group flat lines into a single dialogue entry for the topic
        speakers_set = set()
        for l in lines_list:
            if 'speaker' in l: speakers_set.add(l['speaker'])
            elif 's' in l: speakers_set.add(l['s'])
        
        speakers_list = sorted(list(speakers_set)) or ['A', 'B']
        
        nested_lines = []
        for l in lines_list:
            sp_raw = l.get('speaker', l.get('s', 'A'))
            sp_idx = speakers_list.index(sp_raw) if sp_raw in speakers_list else 0
            
            nested_lines.append({
                'sp': sp_idx,
                'zh': l.get('ch', l.get('zh', '')),
                'py': l.get('py', ''),
                'ar': l.get('ar', l.get('en', ''))
            })
            
        topic_num = int(k) if str(k).isdigit() else 1
        
        normalized_dialogues[str(k)] = [{
            'title': f'حوار الدرس {topic_num}',
            'speakers': speakers_list,
            'lines': nested_lines
        }]
        
    data['DIALOGUES'] = normalized_dialogues
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f'Normalized {len(normalized_dialogues)} topics for {level}')
