import os, re, json

translations_path = os.path.join('src', 'constants', 'translations.js')
public_paths = []
for root, dirs, files in os.walk(os.path.join('src', 'pages', 'public')):
    for file in files:
        if file.endswith(('.jsx', '.js')):
            public_paths.append(os.path.join(root, file))
for root, dirs, files in os.walk(os.path.join('src', 'components', 'public')):
    for file in files:
        if file.endswith(('.jsx', '.js')):
            public_paths.append(os.path.join(root, file))

with open(translations_path, encoding='utf-8') as f:
    data = f.read()

# extract English translation values from en: { ... }
match = re.search(r'en:\s*\{(.*)\}\s*,\s*ne:', data, re.S)
if not match:
    match = re.search(r'en:\s*\{(.*)\}\s*\}', data, re.S)
english_body = match.group(1) if match else ''
english_values = set(re.findall(r':\s*"([^"]+)"', english_body))
english_values.update(re.findall(r':\s*`([^`]+)`', english_body))

literal_strings = {}
for path in public_paths:
    with open(path, encoding='utf-8') as f:
        lines = f.readlines()
    for i,line in enumerate(lines,1):
        # string literals in JSX or props
        for m in re.finditer(r'>([^<>{}][^<>{]+?)<', line):
            s = m.group(1).strip()
            if len(s) > 3 and re.search(r'[A-Za-z]', s):
                literal_strings.setdefault(s, []).append((path, i))
        for m in re.finditer(r'([a-zA-Z0-9_]+)\s*=\s*"([^"]{4,})"', line):
            attr, s = m.group(1), m.group(2).strip()
            if len(s) > 3 and re.search(r'[A-Za-z]', s):
                literal_strings.setdefault(s, []).append((path, i))
        for m in re.finditer(r"([a-zA-Z0-9_]+)\s*=\s*'([^']{4,})'", line):
            attr, s = m.group(1), m.group(2).strip()
            if len(s) > 3 and re.search(r'[A-Za-z]', s):
                literal_strings.setdefault(s, []).append((path, i))

missing = []
for s, locs in literal_strings.items():
    if s not in english_values:
        # skip obvious react expressions and links
        if s.startswith('http') or s in {'Facebook', 'Twitter', 'YouTube', 'Bal Bodh', 'Secondary School', 'SCHOOL_INFO'}:
            continue
        missing.append((s, locs[:3]))

missing.sort(key=lambda x: (len(x[0]), x[0]))
for s, locs in missing[:200]:
    print(f'{s!r}')
    for p,i in locs:
        print('  ', p, i)
    print()
