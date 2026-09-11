import re, os

files = [
    'src/app/checkout/page.tsx',
    'src/components/category/CategoryGrid.tsx',
]

# Per-spec rationale for allowed tokens:
#  rounded-full  -> filter pills + circular color swatches (PER SPEC: "pill-shaped filter controls",
#                  "small circular color swatches")
#  ring-offset-2 -> selected swatch ring (whoever wrote spec wants a clear selected indicator)
#  text-rose-600 -> ALERT text — this is a SaaS-ism to replace with text-alert token
#  shadow-[...]  -> heavy popover shadows are SaaS-ish; allow only if subtle/design-intentional

bad = re.compile(
    r"rounded-(lg|md|xl|2xl|3xl)"
    r"|emerald|amber|orange|purple|green"
    r"|rose-(4|5|6|7|8|9|10|11|12|50|100|200|300|400|500|600|700|800|900|950)"
    r"|gray-(100|200|300|400|500|600|700|800|900|950)"
    r"|tracking-widest"
    r"|font-(serif|mono)"
    r"|shadow-(sm|md|lg|xl|2xl)"
    r"|box-(sm|lg)"
    r"|bg-gray-50"
    r"|ring-gray-400"
    r"|text-rose-600"
)

for f in files:
    if not os.path.exists(f):
        print("MISSING", f); continue
    for i, line in enumerate(open(f, encoding='utf-8').read().splitlines(), 1):
        m = bad.search(line)
        if m:
            print(f"{f}:{i}: {line.strip()[:180]}")
