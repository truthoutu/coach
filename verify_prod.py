import subprocess, os, time, urllib.request, sys

root = r"e:\coach-main (2)\coach-main"
os.chdir(root)
os.environ["PORT"] = "3105"
os.environ["NODE_ENV"] = "production"

# kill stale nodes
try:
    subprocess.run(["powershell", "-Command",
                    "Stop-Process -Name node -Force -ErrorAction SilentlyContinue"],
                   capture_output=True, timeout=10)
except Exception:
    pass
time.sleep(1)

cmd = ["cmd", "/c",
       os.path.join(root, "node_modules", ".bin", "next.cmd"),
       "start", "-p", "3105"]
print("STARTING:", " ".join(cmd), flush=True)
p = subprocess.Popen(cmd, cwd=root, stdout=subprocess.PIPE,
                     stderr=subprocess.STDOUT, text=True)

started = False
for i in range(40):
    time.sleep(1.5)
    try:
        r = urllib.request.urlopen("http://localhost:3105/", timeout=3)
        if r.status == 200:
            started = True
            break
    except Exception:
        pass

print("SERVER_UP:", started, flush=True)

def get(path):
    try:
        r = urllib.request.urlopen("http://localhost:3105" + path, timeout=8)
        return r.status, len(r.read())
    except Exception as e:
        return None, str(e)[:80]

routes = ["/", "/cart", "/checkout", "/admin",
          "/api/products", "/api/campaigns",
          "/category/new-arrivals", "/terms",
          "/product/does-not-exist"]
for rt in routes:
    s, l = get(rt)
    print(f"{rt:28} -> {s}  ({l})")

try:
    r = urllib.request.urlopen("http://localhost:3105/", timeout=8)
    html = r.read().decode("utf-8", "ignore")
    markers = ["Just In", "New Arrivals", "COACH", "Shop",
               "Tabby", "Sale", "Feedback"]
    print("\n=== HOME MARKERS ===")
    for m in markers:
        print(f"  {m:14}: {'FOUND' if m.lower() in html.lower() else 'missing'}")
    print("\nhtml length:", len(html))
except Exception as e:
    print("HOME_FETCH_FAILED:", e)

# detect console errors would need browser; here we just ensure no 500s
print("\nDONE")
