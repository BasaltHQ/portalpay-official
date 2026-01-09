# Scalability & Routing Strategy

## Global Load Balancing (GLB)
We utilize a Global Edge Router (e.g., Azure Front Door, Cloudflare, or a Custom Nginx Mesh) to ingest all traffic to `surge.basalthq.com`.

### Routing Logic
1.  **Geo-DNS**: Initial resolution points to the nearest Edge POP.
2.  **Health Probing**: The Edge Router periodically pings registered Nodes (`/api/health`). Unhealthy nodes are removed from rotation immediately.
3.  **Affinity Strategy**:
    - **Stateless Requests** (Landing page): Round-robin to nearest Nodes.
    - **Stateful Requests** (Shop Checkout): Sticky sessions are preferred but not strictly required due to idempotent API design.
    - **Merchant Affinity**: A Merchant can be "pinned" to a high-performance Node Provider who explicitly recruited them (Partnership model).

## Scaling the Node Network
- **Vertical Scaling**: Node Providers can increase their container resources (CPU/RAM).
- **Horizontal Scaling**:
    - **Node Pools**: Multiple Node Containers can sit behind a single "Node Identity" (sharing the same Private Key/Address) if they share a database or sync state, acting as a cluster.
    - **Registry Sharding**: The Diamond Proxy Registry can handle thousands of Nodes. The Edge Router caches this registry off-chain (Redis) for millisecond routing decisions.

## Database & State
- **Problem**: How do decentralized nodes access the "global" shop data?
- **Solution A (Central DB with Whitelist)**: Current Plan. Nodes connect to a central Azure Cosmos DB.
    - *Pros*: Simple, consistent.
    - *Cons*: DB is single point of failure (SPOF).
- **Solution B (Read Replicas)**: Distributors/Nodes get read-replicas.
- **Solution C (EdgeDB / Turso)**: Future migration to decentralized web database.
