import zipfile
import os

apk_path = os.path.join("tmp", "master.apk")
dest_path = os.path.join("tmp", "apk_files.txt")

try:
    with zipfile.ZipFile(apk_path, 'r') as z:
        with open(dest_path, "w") as f:
            for n in z.namelist():
                f.write(n + "\n")
    print(f"Saved file list to {dest_path}")
except Exception as e:
    print(f"Error: {e}")
