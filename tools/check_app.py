import re

with open('js/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Remove JS line comments
code = re.sub(r'//.*', '', code)
# Remove block comments
code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
# Remove strings
code = re.sub(r'"(?:[^"\\]|\\.)*"', '""', code)
code = re.sub(r"'(?:[^'\\]|\\.)*'", "''", code)
code = re.sub(r'`(?:[^`\\]|\\.)*`', '``', code)

stack = []
for i, line in enumerate(code.split('\n'), 1):
    for c in line:
        if c in '{[(':
            stack.append((c, i))
        elif c in '}])':
            if not stack:
                print(f"Unmatched {c} at line {i}")
                exit(1)
            t = stack.pop()[0]
            if (t == '{' and c != '}') or (t == '[' and c != ']') or (t == '(' and c != ')'):
                print(f"Mismatched pair: Opened {t} but closed with {c} at line {i}")
                exit(1)

if stack:
    t, i = stack[-1]
    print(f"Unclosed {t} starting at line {i}")
    exit(1)

print("Brackets syntax OK!")
