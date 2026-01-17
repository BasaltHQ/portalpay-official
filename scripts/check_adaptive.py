import zipfile
import os

apk_path = os.path.join("tmp", "deployed_xoinpay.apk")

try:
    with zipfile.ZipFile(apk_path, 'r') as z:
        print("Checking for adaptive icon XMLs:")
        adaptive_patterns = [
            "mipmap-anydpi",
            "ic_launcher.xml",
            "ic_launcher_round.xml",
            "ic_launcher_foreground",
            "ic_launcher_background",
        ]
        
        for n in z.namelist():
            for p in adaptive_patterns:
                if p in n:
                    info = z.getinfo(n)
                    print(f"  {n} ({info.file_size} bytes)")
                    break
except Exception as e:
    print(f"Error: {e}")
