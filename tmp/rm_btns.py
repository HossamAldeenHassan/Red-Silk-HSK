import re
import os

filepath = r'e:\HSK1_Master-main22\js\app.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the specific toggle buttons
content = re.sub(r'^[ \t]*<button class="py-toggle[^>]*onclick="togglePinyin\(\)"[^>]*>.*?</button>[\r\n]*', '', content, flags=re.MULTILINE)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed redundant toggle buttons from app.js")
