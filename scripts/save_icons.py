import zipfile
import os

apk_path = os.path.join("tmp", "deployed_xoinpay.apk")
out_path = os.path.join("tmp", "deployed_icons.txt")

try:
    with zipfile.ZipFile(apk_path, 'r') as z:
        with open(out_path, 'w') as f:
            f.write("Files containing 'mipmap' or 'ic_launcher':\n")
            for n in z.namelist():
                if "mipmap" in n or "ic_launcher" in n:
                    info = z.getinfo(n)
                    f.write(f"  {n} ({info.file_size} bytes)\n")
    print(f"Saved to {out_path}")
except Exception as e:
    print(f"Error: {e}")
