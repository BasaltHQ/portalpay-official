import subprocess
import os

apk_path = os.path.join("tmp", "master.apk")

# Try to use aapt2 dump to get network security config
# aapt2 is typically in Android SDK build-tools
# Alternatively, we can use apktool or just look for text patterns

# For now, let's just grep for domain patterns in the raw binary
with open(apk_path, "rb") as f:
    content = f.read()
    
# Search for common domain patterns
domains = [
    b"paynex",
    b"xoinpay", 
    b"azurewebsites.net",
    b"*.azurewebsites.net",
    b"cleartextTrafficPermitted",
    b"domain-config",
]

print("Searching for domain patterns in APK binary:")
for d in domains:
    if d in content:
        # Find position and print context
        pos = content.find(d)
        context = content[max(0, pos-20):min(len(content), pos+len(d)+20)]
        print(f"  Found '{d.decode('latin-1', 'ignore')}' at position {pos}")
        # Print readable parts
        readable = ''.join(chr(b) if 32 <= b < 127 else '.' for b in context)
        print(f"    Context: {readable}")
    else:
        print(f"  NOT found: '{d.decode('latin-1', 'ignore')}'")
