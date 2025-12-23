import json
import os

files = {
    "portalpay-starter": "infra/policies/product-portalpay-starter-policy-body.json",
    "portalpay-pro": "infra/policies/product-portalpay-pro-policy-body.json",
    "portalpay-enterprise": "infra/policies/product-portalpay-enterprise-policy-body.json"
}

os.makedirs("tmp", exist_ok=True)

for product, path in files.items():
    if os.path.exists(path):
        with open(path, "r") as f:
            data = json.load(f)
            xml_content = data["properties"]["value"]
            
        out_path = f"tmp/{product}-policy.xml"
        with open(out_path, "w") as f:
            f.write(xml_content)
        print(f"Extracted {out_path}")
    else:
        print(f"Skipping {product}, file not found")
