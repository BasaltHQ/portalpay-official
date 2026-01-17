import os

root = "public/brands"
print(f"Listing {root}...")
for dirpath, dirnames, filenames in os.walk(root):
    # Calculate depth
    depth = dirpath.count(os.sep) - root.count(os.sep)
    if depth > 3: continue
    
    indent = "  " * depth
    print(f"{indent}[DIR] {os.path.basename(dirpath)}")
    for f in filenames:
        if f.endswith(".png") or f.endswith(".xml") or f.endswith(".zip"):
            print(f"{indent}  {f}")
