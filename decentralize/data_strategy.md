# Basalt Distributed Storage (BDS)

To achieve **sovereign, gasless, and specialized** storage, we are building **Basalt Distributed Storage (BDS)**.
- **Protocol**: Custom P2P Gossip Protocol (similar to Scuttlebutt or Git).
- **Network**: The Basalt Nodes *are* the Storage Nodes.
- **Cost**: **Free / Gasless**. Security is guaranteed by cryptographic signatures, not blockchain consensus.

## 1. Core Concepts
### The "Vault" (Data Unit)
Every Merchant has a **Vault**.
- A Vault is a cryptographically verifiable changelog of JSON documents (Config, Inventory, Orders).
- **ID**: `vault_<MerchantPublicKey>`
- **Verification**: Every update must be signed by `MerchantPrivateKey`.

### The "Swarm" (Replication)
- **Home Node**: The Node currently serving the Merchant is the *Primary replicator*.
- **Neighbor Nodes**: Other Nodes in the cluster *passively replicate* the Vault for redundancy.
- **Sync Protocol**:
    1.  Merchant Client (Browser) signs update: `{"price": 10, "sig": "0x..."}`.
    2.  Pushes to **Home Node** via HTTP/WebSocket.
    3.  Home Node verifies signature.
    4.  Home Node broadcasts "New Head" to the Swarm (Gossip).
    5.  Neighbors pull the new data.

## 2. Architecture: "The Basalt Mesh"
We will implement a lightweight Sidecar Service (`basalt-mesh`) running in every Node container.
- **Tech Stack**: [libp2p](https://libp2p.io/) (used by IPFS/Eth2) or a simple HTTP-based mesh.
- **Function**:
    - **Discovery**: Finds other Basalt Nodes (via Diamond Registry).
    - **Gossip**: "I have update #55 for Store A."
    - **Replication**: "Please send me update #55."

## 3. Why this is better than IPFS?
1.  **Gasless & Fast**: No Blockchain transactions. No "Pinning Services" to pay.
2.  **Specialized**: Optimized specifically for *small, frequent JSON updates* (Inventory/Price changes), which IPFS handles poorly (IPNS is slow).
3.  **Data Sovereignty**: The Merchant holds the keys. The Nodes hold the encrypted (or signed) data. The Platform cannot "delete" a shop.
4.  **Instant Propagation**: Updates hit the Serving Node immediately (ms latency), then propagate to background nodes.

## 4. Conflict Resolution (CRDTs)
*Future Enhancement*: Conflict-Free Replicated Data Types.
- If a Merchant edits offline and pushes later, or edits from two devices, CRDTs merge the changes mathematically without conflicts.

## 5. Implementation Plan (MVP)
### Phase 1: "The Signed Log"
1.  **Client**: `ShopClient` generates a keypair for the Merchant.
2.  **Format**: Updates are simple Signed JSON Objects.
3.  **Storage**: Nodes store these objects in a local SQLite/LevelDB.
4.  **Persistence**: The Storage Directory must be mounted as a **Docker Volume** (e.g., `-v /data:/app/data`) to survive container restarts.
5.  **Sync**: Nodes poll/push to a list of known peers (e.g., The Platform + 2 Neighbors).

### Phase 2: Full P2P Mesh
- Integrate `libp2p`.
- True DHT (Distributed Hash Table) for finding which Node hosts which Vault.
