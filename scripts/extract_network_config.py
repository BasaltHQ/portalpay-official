import zipfile
import os

apk_path = os.path.join("tmp", "master.apk")
dest_path = os.path.join("tmp", "network_security_config.xml")

try:
    with zipfile.ZipFile(apk_path, 'r') as z:
        try:
            with z.open("res/xml/network_security_config.xml") as f:
                content = f.read()
                with open(dest_path, "wb") as out:
                    out.write(content)
            print(f"Saved to {dest_path}")
        except KeyError:
            print("network_security_config.xml not found")
except Exception as e:
    print(f"Error: {e}")
