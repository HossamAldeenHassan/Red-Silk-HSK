import glob
import re
import json

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if valid JSON first
    try:
        json.loads(content)
        return True # It's valid
    except json.JSONDecodeError:
        pass # Needs fixing
        
    # Fix unquoted integer keys: e.g. `  1: [` or `"1": [` (Wait, if it's unquoted, it's `1: `)
    fixed_content = re.sub(r'(?m)^(\s*)(\d+):', r'\1"\2":', content)
    
    try:
        json.loads(fixed_content)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        print(f"Fixed syntax in {filepath}")
        return True
    except Exception as e:
        print(f"Still broken after fix: {filepath} - {e}")
        return False

files = glob.glob('data/**/*.json', recursive=True)
all_good = True
for file in files:
    if not fix_file(file):
        all_good = False

if all_good:
    print("All JSON files are now strictly valid!")
