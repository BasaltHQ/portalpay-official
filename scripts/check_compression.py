import zipfile
import os

# Check a signed output APK if it exists
# Otherwise check the master
candidates = [
    "tmp/xoinpay-touchpoint-signed.apk",  # If downloaded
    "tmp/master.apk",
]

apk_path = None
for c in candidates:
    if os.path.exists(c):
        apk_path = c
        break

if not apk_path:
    print("No APK found to check")
    exit(1)

print(f"Checking compression in {apk_path}:")

try:
    with zipfile.ZipFile(apk_path, 'r') as z:
        # Check .so files and resources.arsc
        targets = [
            "resources.arsc",
            "lib/arm64-v8a/libxul.so",
            "lib/armeabi-v7a/libxul.so",
        ]
        
        for t in targets:
            try:
                info = z.getinfo(t)
                method = "STORED (uncompressed)" if info.compress_type == zipfile.ZIP_STORED else f"DEFLATED ({info.compress_type})"
                print(f"  {t}: {method}")
            except KeyError:
                print(f"  {t}: NOT FOUND")
        
        # Count total .so files and their compression
        so_count = 0
        so_stored = 0
        for name in z.namelist():
            if name.endswith(".so"):
                so_count += 1
                info = z.getinfo(name)
                if info.compress_type == zipfile.ZIP_STORED:
                    so_stored += 1
        
        print(f"\nSummary: {so_stored}/{so_count} .so files are uncompressed")
        if so_stored != so_count:
            print("WARNING: Some .so files are still compressed! GeckoView may fail to load.")
        else:
            print("OK: All .so files are uncompressed.")
            
except Exception as e:
    print(f"Error: {e}")
