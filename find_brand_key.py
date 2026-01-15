import json
import sys

wallet = "0x6c28067a2D4F10013FbBb8534aCd76Ab43A4fF9f".lower()
file_path = "u:\\BasaltSurge\\portalpay-official\\cosmos_graph.json"

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Search in nodes
    print("Scanning for shop_config nodes...")
    count = 0
    for node in data.get('nodes', []):
        node_type = node.get('type')
        node_label = node.get('label')
        
        if node_type == 'shop_config' or node_label == 'site_config' or node_type == 'site_config':
            count += 1
            print(f"--- Config Node {count} ---")
            print(f"ID: {node.get('id')}")
            print(f"Wallet: {node.get('data', {}).get('wallet')}")
            print(f"BrandKey: {node.get('data', {}).get('brandKey')}")
            print(f"Theme: {json.dumps(node.get('data', {}).get('theme', {}), indent=2)}")
            
            # Check if this resembles our target wallet
            w = str(node.get('data', {}).get('wallet', '')).lower()
            if wallet in w:
                print("!!! MATCH FOUND FOR TARGET WALLET !!!")

    print(f"Total config nodes found: {count}")

except Exception as e:
    print(f"Error: {e}")
