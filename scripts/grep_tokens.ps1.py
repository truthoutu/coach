import re, os

p = 'src/components/category/CategoryGrid.tsx'
s = open(p, encoding='utf-8').read()
lines = s.split('\n')

pat = re.compile(
    r'rounded-lg|shadow-\[|\\.font-serif|font-serif'
    r'|tracking-widest'
    r'|gray-100|gray-200|gray-950'
    r'|rose|amber|emerald|green|orange|purple|red-(4|5|6|7|8|9|10|11|12|50|100|200|300|400|500|600|700|800|900|950)'
    r'|shadow-(sm|md|lg|xl|2xl)'
)

hits = []
for i, line in enumerate(lines, 1):
    if pat.search(line):
        hits.append(f'{i}: {line.strip()[:180]}')

if not hits:
    print('NO_REMAINING_SaaS_HITS in CategoryGrid.tsx')
else:
    print('\n'.join(hits))
