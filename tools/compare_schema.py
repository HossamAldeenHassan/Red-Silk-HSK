import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

for level in ['hsk1', 'hsk2', 'hsk3']:
    print(f'\n=== {level.upper()} ===')
    for fname in ['vocab.json', 'sentences.json', 'lessons.json', 'dialogues.json', 'grammar.json', 'tests.json']:
        with open(f'data/{level}/{fname}', encoding='utf-8') as f:
            data = json.load(f)
        if isinstance(data, dict):
            for k, v in data.items():
                if isinstance(v, list):
                    sample_keys = ''
                    if v and isinstance(v[0], dict):
                        sample_keys = str(list(v[0].keys()))
                    elif v and isinstance(v[0], list):
                        sample_keys = f'array[{len(v[0])}]'
                    print(f'  {fname} -> {k}: list[{len(v)}] item_type={type(v[0]).__name__ if v else "EMPTY"} {sample_keys}')
                elif isinstance(v, dict):
                    keys = list(v.keys())[:5]
                    # Check if values are arrays or dicts
                    first_val = list(v.values())[0] if v else None
                    val_type = type(first_val).__name__ if first_val else 'EMPTY'
                    print(f'  {fname} -> {k}: dict[{len(v)} keys] val_type={val_type}')
                else:
                    print(f'  {fname} -> {k}: {type(v).__name__}')
        elif isinstance(data, list):
            print(f'  {fname}: raw array[{len(data)}]')
