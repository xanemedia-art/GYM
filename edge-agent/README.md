# GymSync Edge Connector Agent for ESSL Hardware

`GymSync` is the lightweight local background daemon that bridges on-premise ESSL / ZKTeco biometric terminals with the Cloud Gym Management SaaS platform.

## Architecture

```text
[ ESSL Biometric Terminal ] (LAN IP: 192.168.1.201:4370)
           │
           │  ZK Protocol (TCP/UDP Port 4370)
           ▼
[ GymSync Windows Service ] (Runs on Gym Front-Desk PC)
   ├── Local Offline Buffer (In-memory / SQLite)
   ├── Biometric Attendance Ingestion
   └── Heartbeat Health Monitor (Every 60s)
           │
           │  HTTPS Batch Sync + Backoff (mTLS / API Key)
           ▼
[ Cloud SaaS Platform ] (/api/v1/integrations/essl/punches)
```

## Running as a Windows Service

1. Package into a standalone binary using `pkg`:
   ```bash
   npx pkg edge-agent/gymsync.ts --targets node18-win-x64 --output GymSync.exe
   ```
2. Install as a Windows Service using **NSSM** (Non-Sucking Service Manager):
   ```cmd
   nSSM install GymSync "C:\GymSync\GymSync.exe"
   nssm set GymSync AppEnvironmentExtra CLOUD_API_URL=https://app.gymsaas.in DEVICE_SERIAL=ESSL-DELHI-01 DEVICE_API_KEY=your_secret_key
   nssm start GymSync
   ```
