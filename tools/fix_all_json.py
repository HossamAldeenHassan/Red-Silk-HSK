import json

# Fix dialogues.json
with open('data/hsk1/dialogues.json', 'r', encoding='utf-8') as f:
    d_content = f.read()

# Fix kě"ài to kě'ài
d_content = d_content.replace('kě"ài', "kě'ài")

with open('data/hsk1/dialogues.json', 'w', encoding='utf-8') as f:
    f.write(d_content)

# Fix grammar.json
with open('data/hsk1/grammar.json', 'r', encoding='utf-8') as f:
    g_content = f.read()

# We have unescaped quotes like "يكون" inside strings.
# A simple way to fix is to replace `"يكون"` with `'يكون'` etc., but there are many.
# Let's replace instances of `"` that are NOT followed by `,` or `\n` or `}` or `]` or `:` 
# AND NOT preceded by `{` or `[` or `:` or `,` or `\n` or space (if the space is preceded by colon).
# Actually, the easiest is to just use a custom state machine or regex:

import re

# Find all lines that have a JSON property value. 
# It typically looks like: "q": "أيّ جملة صحيحة بمعنى "أنا أقرأ كتاباً"؟",
def fix_line(line):
    # If the line is purely structural like `    "opts": [` or `  {`, skip
    if line.strip() in ['{', '}', '[', ']', '"opts": [', '"ex": [', '"rules": [']:
        return line
    
    # Check if there are more than 4 quotes in the line (key requires 2, value requires 2, total 4)
    # This only works for simple key-value lines
    if line.strip().startswith('"') and line.count('"') > 4:
        # e.g., "q": "أيّ جملة صحيحة بمعنى "أنا أقرأ كتاباً"؟",
        # Split by the first `:`
        parts = line.split(':', 1)
        if len(parts) == 2:
            key = parts[0]
            val = parts[1]
            # Find the first quote of the value and the last quote of the value
            first_quote_idx = val.find('"')
            last_quote_idx = val.rfind('"')
            if first_quote_idx != -1 and last_quote_idx != -1 and last_quote_idx > first_quote_idx:
                inner_str = val[first_quote_idx+1:last_quote_idx]
                # Replace any `"` inside inner_str with `'`
                inner_str_fixed = inner_str.replace('"', "'")
                val = val[:first_quote_idx+1] + inner_str_fixed + val[last_quote_idx:]
                return key + ':' + val
                
    # Check arrays of strings: `        "opts": ["她是漂亮", "她很漂亮", "她是很漂亮", "她漂亮是"],`
    # Or `        "这是谁？", "这是什么人吗？", "谁是这吗？", "这有谁？"],`
    # It's easier just to manually replace the known ones if there aren't too many, 
    # but the above handles most "q" and "exp" lines.
    return line

fixed_lines = []
for line in g_content.split('\n'):
    fixed_lines.append(fix_line(line))

g_content = '\n'.join(fixed_lines)

# Manually fix edge cases that the line fixer might miss
# Let's just do bulk replaces for the known problematic Arabic/Chinese quote injections:
bad_quotes = [
    ('"يكون"', "'يكون'"),
    ('"جداً"', "'جداً'"),
    ('"أنا أقرأ كتاباً"', "'أنا أقرأ كتاباً'"),
    ('"هو يأكل أرزاً"', "'هو يأكل أرزاً'"),
    ('"أنا لست طالباً"', "'أنا لست طالباً'"),
    ('"الطقس جيد"', "'الطقس جيد'"),
    ('"أنا لست مشغولاً"', "'أنا لست مشغولاً'"),
    ('"أنا أذهب إلى المدرسة"', "'أنا أذهب إلى المدرسة'"),
    ('"هي لا تحب القهوة"', "'هي لا تحب القهوة'"),
    ('"لم أشاهد الفيلم أمس"', "'لم أشاهد الفيلم أمس'"),
    ('"هل هذا غالٍ"', "'هل هذا غالٍ'"),
    ('"من هذا؟"', "'من هذا؟'"),
    ('"هاتفه"', "'هاتفه'"),
    ('"البنت الجميلة"', "'البنت الجميلة'"),
    ('"أدرس في المدرسة"', "'أدرس في المدرسة'"),
    ('"أكتب رسالة له"', "'أكتب رسالة له'"),
    ('"هل تشرب شاياً أم ماءً؟"', "'هل تشرب شاياً أم ماءً؟'"),
    ('"للغاية"', "'للغاية'"),
    ('"هيا نفعل..."', "'هيا نفعل...'"),
    ('"أظن أن..."', "'أظن أن...'"),
    ('"هذا صعب جداً!"', "'هذا صعب جداً!'"),
    ('عشرون وخمسة"', "عشرون وخمسة'"),
    ('"عشرون وخمسة"', "'عشرون وخمسة'"),
    ('"ثلاثة أشخاص"', "'ثلاثة أشخاص'"),
    ('"كتابان"', "'كتابان'"),
    ('"جرّبه قليلاً"', "'جرّبه قليلاً'"),
    ('"جرّبه قليلاً / ألقِ نظرة سريعة"', "'جرّبه قليلاً / ألقِ نظرة سريعة'"),
    ('"أظن أنه معلم، أليس كذلك؟"', "'أظن أنه معلم، أليس كذلك؟'"),
    ('很 رابط لا تعني "جداً" هنا', "很 رابط لا تعني 'جداً' هنا"),
    ('很 هنا تعني "جداً"', "很 هنا تعني 'جداً'"),
    ('"她是漂亮"', "'她是漂亮'"),
    ('"没有"', "'没有'"),
    ('"不有"', "'不有'"),
    (' " ', " ' "),
]

for bad, good in bad_quotes:
    g_content = g_content.replace(bad, good)

# Another pass for array elements with unescaped quotes if any
import re
g_content = re.sub(r'\[([^\]]*)"([^,\]]*)"([^\]]*)\]', lambda m: '[' + m.group(1).replace('"', "'") + '"' + m.group(2).replace('"', "'") + '"' + m.group(3).replace('"', "'") + ']', g_content)

with open('data/hsk1/grammar.json', 'w', encoding='utf-8') as f:
    f.write(g_content)

# Fix BOM
with open('data/hsk1/raw_hsk1.json', 'r', encoding='utf-8-sig') as f:
    r_content = f.read()
with open('data/hsk1/raw_hsk1.json', 'w', encoding='utf-8') as f:
    f.write(r_content)

print("Fixes applied.")
