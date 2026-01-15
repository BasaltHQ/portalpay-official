# Security & Trust Model

## Node Identity
- **Private Key**: Each Node is identified by a private key (`NODE_PRIVATE_KEY`).
- **Address**: The public address derived from this key is the "Node Owner".
- **Registration**:
    1.  Node starts up.
    2.  Calls Diamond Proxy `register(ip, metadata)`.
    3.  Platform Indexer hears event -> Verifies Node Version/Compliance -> Adds to Routing Table.

## Data Security
- **DB Protocol**: TLS 1.3 only.
- **Access Control**:
    - **IP Whitelisting**: Automated. When a Node registers, its IP is temporarily provisionally allowed. Platform automated scanner checks for vulnerabilities before fully whitelisting DB access.
    - **Least Privilege**: Node DB Credentials (injected via Env or fetched via Auth) have "Merchant Data Scope" only. They cannot access Admin/Platform tables. *Requires Row-Level Security (RLS) implementation in DB layer.*

## Key Management
- **Node Provider Responsibility**: Must keep `NODE_PRIVATE_KEY` secure.
    - If compromised: Attacker can redirect fees (0.20%) or deploy malicious splits.
    - **Mitigation**: Platform can "Ban" a Node Address at the Edge Router level, cutting off traffic instantly.

## Split Security (On-Chain)
- **Immutable Logic**: The Split Contract is standard Thirdweb/OpenZeppelin code.
- **Verification**: The Shop Client (Frontend) independently verifies the proposed Split Address matches the expected recipients (Merchant + Node + Platform) before submitting a tx.
- **Gas Sponsorship**: Authenticated via `THIRDWEB_CLIENT_ID` restricted to the specific Node Domain/Origin.
