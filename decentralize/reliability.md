# Reliability & Uptime

## 100% Uptime Goal
The core value proposition is that a decentralized network is harder to kill than a centralized server.

## Failure Scenarios & Mitigation

### Scenario A: Node Crash
- **Event**: Node A goes offline.
- **Detection**: Edge Router health probe fails (missed 3 heartbeats).
- **Action**:
    - Edge Router removes Node A from pool.
    - Traffic rerouted to **Platform Backup Nodes** (or Node B).
    - **Fee Implication**: Platform (or Node B) earns the 0.20% fee for transactions processed during downtime. Node A loses revenue.

### Scenario B: Database/Vault Staleness (New)
- **Event**: Node A loses connection to the Swarm and stops receiving updates (`LastSync` > 5 mins ago).
- **Impact**: Node A might serve outdated prices or inventory.
- **Detection**: 
    - Internal "Watchdog" service checks `LastSwarmSyncTimestamp` vs `Date.now()`.
    - Health Endpoint `/api/health` returns `503 Service Unavailable` (or `429 Too Early`) if stale.
- **Action**: Edge Router de-prioritizes Node A until it catches up.

### Scenario C: Malicious Node
- **Event**: Node A modifies frontend code to steal funds.
- **Detection**:
    - **Code Attestation**: Nodes must run a signed Docker Image.
    - **Remote Attestation (Future)**: TEE / SGX enclaves.
    - **Client verification**: The core payment logic is in the `ShopClient` (Client-side). The backend `route.ts` only provides config.
    - **Audit**: Periodic random "Secret Shopper" transactions by Platform to verify fee routing.

## Monitoring
- **Headless Dashboard**: Nodes report metrics (CPU, Mem, Req/sec, **Swarm Lag**) to Platform Telemetry.
- **BDS Health**: 
    - `vault_integrity`: Checksum verification.
    - `peer_count`: Must be > 0.
