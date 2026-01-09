# Node Architecture: Hybrid Decentralization

## Top-Level Summary
BasaltSurge employs a **Hybrid Decentralized Architecture**.
- **Frontend/Entry**: Centralized domain (`https://surge.basalthq.com`) provides a unified, trusted entry point and SSL termination.
- **Backend/Execution**: Decentralized **Nodes** (Containers) perform the actual compute, logic, and payment processing.
- **Routing**: A "Smart Router" at the edge directs user sessions to the optimal Node (based on Geo, Load, or Merchant affinity).

## Diagram
```mermaid
graph TD
    User[User / Shopper] -->|https://surge.basalthq.com| Edge[Global Edge Router]
    Edge -->|Geo-Locate / LB| NodeSelector{Node Selection}
    
    subgraph "Decentralized Node Layer"
        NodeA[Node A (US-East)]
        NodeB[Node B (EU-West)]
        NodeC[Node C (Asia)]
    end
    
    NodeSelector -->|Route Request| NodeA
    NodeSelector -->|Route Request| NodeB
    NodeSelector -->|Failover| NodeC
    
    subgraph "On-Chain Settlement"
        SplitA[Split Contract A]
        SplitB[Split Contract B]
        Diamond[Diamond Proxy (Registry + Loyalty)]
    end
    
    NodeA -->|Deploy/Execute| SplitA
    NodeB -->|Deploy/Execute| SplitB
    NodeA -->|Register| Diamond
```

## Setup & Roles
- **Merchant**: Creates a store. Assigned a "Region" or "Home Node Pool".
- **Node Provider**: runs a Docker container.
    - **Inputs**: `NODE_PRIVATE_KEY` (Signer), `THIRDWEB_CLIENT_ID` (Gas).
    - **Function**: Processes requests, hosts shop sessions.
    - **Reward**: 0.20% of volume processed.
- **Platform**:
    - **Function**: Governance, UI Hosting, Global Routing, Gas Sponsorship.
    - **Reward**: 0.25% of volume.

## Request Flow
1.  User visits `shop/cool-store`.
2.  Edge Router looks up `cool-store` routing config.
3.  Routing Config says `cool-store` is pinned to `US-East-Pool`.
4.  Edge Router sends request to `Node A` (US-East).
5.  `Node A` serves the page.
6.  Customer pays. `Node A` ensures the Split Contract used includes `Node A`'s address.
