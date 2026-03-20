import os
import glob
import json

base_dir = 'data'
json_files = glob.glob(os.path.join(base_dir, '**', '*.json'), recursive=True)

# Delete raw_hsk1.json if it exists to keep it pristine
if 'data\\hsk1\\raw_hsk1.json' in json_files:
    json_files.remove('data\\hsk1\\raw_hsk1.json')

for filepath in json_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read().strip()
        
    if not content:
        continue
        
    # Example: data\hsk1\vocab.json -> hsk1_vocab
    # We will use this as a property mapped under window
    parts = filepath.split(os.sep)
    if len(parts) >= 3:
        level_folder = parts[-2]
        filename = parts[-1].replace('.json', '')
        prop_name = f"{level_folder}_{filename}"
        
        js_content = f"window.HSK_DATA = window.HSK_DATA || {{}};\nwindow.HSK_DATA['{prop_name}'] = {content};\n"
        
        js_filepath = filepath.replace('.json', '.js')
        with open(js_filepath, 'w', encoding='utf-8') as js_file:
            js_file.write(js_content)

print(f"Successfully converted {len(json_files)} JSON datasets to cross-origin safe JS modules.")
