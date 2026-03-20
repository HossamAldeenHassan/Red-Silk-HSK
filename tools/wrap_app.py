import os

with open('js/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

wrapped = f"""
try {{
{code}
}} catch (e) {{
  const errDiv = document.createElement('div');
  errDiv.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#111;color:#ff5555;z-index:9999999;padding:2rem;font-size:1.5rem;overflow:auto;';
  errDiv.innerHTML = '<h1>CRASH TRACE / SYNTAX ERROR PROOF:</h1><pre style="white-space:pre-wrap;">' + (e.stack || e) + '</pre>';
  document.body.appendChild(errDiv);
}}
"""

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(wrapped)

print("Safely injected try/catch into app.js")
