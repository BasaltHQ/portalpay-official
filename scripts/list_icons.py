import zipfile
import os

apk_path = os.path.join("tmp", "deployed_xoinpay.apk")

try:
    with zipfile.ZipFile(apk_path, 'r') as z:
        print("Files containing 'mipmap' or 'ic_launcher':")
        for n in z.namelist():
            if "mipmap" in n or "ic_launcher" in n:
                info = z.getinfo(n)
                print(f"  {n} ({info.file_size} bytes)")
                
        print("\nFiles in res/ starting with 'mipmap':")
        for n in z.namelist():
            if n.startswith("res/mipmap"):
                info = z.getinfo(n)
                print(f"  {n} ({info.file_size} bytes)")
except Exception as e:
    print(f"Error: {e}")
