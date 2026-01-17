import zipfile
import sys
import os

apk_path = os.path.join("tmp", "master.apk")
dest_path = os.path.join("tmp", "extracted_wrap.html")

print(f"Opening {apk_path}...")
try:
    with zipfile.ZipFile(apk_path, 'r') as z:
        try:
            info = z.getinfo("assets/wrap.html")
            print(f"Found wrap.html: {info.file_size} bytes")
            with z.open("assets/wrap.html") as f:
                content = f.read()
                with open(dest_path, "wb") as out:
                    out.write(content)
            print("Success")
        except KeyError:
            print("assets/wrap.html not found in APK")
            # List assets
            for n in z.namelist():
                if n.startswith("assets/"):
                    print(n)
except Exception as e:
    print(f"Error: {e}")

# Separate check for structure
try:
    with zipfile.ZipFile(apk_path, 'r') as z:
        print("\nListing mipmap folders:")
        printed_folders = set()
        for n in z.namelist():
            if "mipmap" in n and "ic_launcher.png" in n:
                folder = n.split("/")[1]
                if folder not in printed_folders:
                    print(f" - {n}")
                    printed_folders.add(folder)
except:
    pass
