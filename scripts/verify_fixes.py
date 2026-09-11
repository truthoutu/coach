import re, os
root = os.getcwd()
for f in ['src/app/checkout/page.tsx', 'src/context/CartContext.tsx']:
    path = os.path.join(root, f)
    if not os.path.exists(path):
        print(f, 'MISSING')
        continue
    s = open(path, encoding='utf-8').read()
    print(f)
    print('  variantId:selectedVariantId in checkout:', 'variantId' in s and 'selectedVariantId' in s)
    print('  cart bootstrap guard present:', 'if (cart.length > 0)' in s)
    print()
