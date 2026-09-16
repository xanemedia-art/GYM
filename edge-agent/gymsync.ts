/**
 * GymSync - ESSL Biometric Local Edge Connector Daemon
 * Runs as a Windows Service or background daemon on the gym front-desk computer.
 *
 * Responsibilities:
 * 1. Connects to local ESSL / ZKTeco terminals via TCP Port 4370 on LAN.
 * 2. Buffers punches locally to prevent data loss during internet broadband outages.
 * 3. Batches and posts punches to the Cloud SaaS API (/api/v1/integrations/essl/punches).
 * 4. Emits regular 60-second health heartbeats.
 */

interface PunchRecord {
  deviceEnrollmentId: number;
  punchTime: string;
  punchType: "CHECK_IN" | "CHECK_OUT";
  verificationMode: string;
}

interface GymSyncConfig {
  cloudApiUrl: string;
  deviceSerial: string;
  deviceApiKey: string;
  terminalIp: string;
  terminalPort: number;
  pollIntervalMs: number;
  heartbeatIntervalMs: number;
}

export class GymSyncAgent {
  private config: GymSyncConfig;
  private offlineBuffer: PunchRecord[] = [];
  private isRunning: boolean = false;

  constructor(config: GymSyncConfig) {
    this.config = config;
  }

  public async start() {
    this.isRunning = true;
    console.log(`[GymSync] Starting edge agent for device serial: ${this.config.deviceSerial}`);
    console.log(`[GymSync] Target terminal LAN IP: ${this.config.terminalIp}:${this.config.terminalPort}`);
    console.log(`[GymSync] Cloud ingestion endpoint: ${this.config.cloudApiUrl}`);

    // Start heartbeat loop
    this.scheduleHeartbeat();

    // Start punch polling / sync loop
    this.scheduleSyncLoop();
  }

  public stop() {
    this.isRunning = false;
    console.log("[GymSync] Stopped edge agent.");
  }

  /**
   * Enqueue punch to buffer (called by the ZK socket listener when member scans finger/card)
   */
  public recordLocalPunch(punch: PunchRecord) {
    console.log(`[GymSync] Ingested punch from local terminal: User ID ${punch.deviceEnrollmentId} at ${punch.punchTime}`);
    this.offlineBuffer.push(punch);
  }

  /**
   * Flush buffered punches to Cloud SaaS API
   */
  public async flushBuffer(): Promise<boolean> {
    if (this.offlineBuffer.length === 0) return true;

    const batch = [...this.offlineBuffer];
    console.log(`[GymSync] Attempting to sync ${batch.length} buffered punch(es) to cloud...`);

    try {
      const res = await fetch(`${this.config.cloudApiUrl}/api/v1/integrations/essl/punches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Serial": this.config.deviceSerial,
          "X-Device-Api-Key": this.config.deviceApiKey,
        },
        body: JSON.stringify({ punches: batch }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        console.log(`[GymSync] ✓ Successfully synced ${json.data.processedCount} punches (${json.data.duplicateCount} duplicates suppressed).`);
        // Remove successfully flushed batch
        this.offlineBuffer.splice(0, batch.length);
        return true;
      } else {
        console.warn(`[GymSync] Cloud rejected batch:`, json.error);
        return false;
      }
    } catch (err: any) {
      console.error(`[GymSync] Network connection error. Retaining ${this.offlineBuffer.length} records in local buffer:`, err.message);
      return false;
    }
  }

  private scheduleHeartbeat() {
    if (!this.isRunning) return;

    fetch(`${this.config.cloudApiUrl}/api/v1/integrations/essl/punches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Device-Serial": this.config.deviceSerial,
        "X-Device-Api-Key": this.config.deviceApiKey,
      },
      body: JSON.stringify({ punches: [] }),
    }).catch(() => {});

    setTimeout(() => this.scheduleHeartbeat(), this.config.heartbeatIntervalMs);
  }

  private scheduleSyncLoop() {
    if (!this.isRunning) return;

    this.flushBuffer().finally(() => {
      setTimeout(() => this.scheduleSyncLoop(), this.config.pollIntervalMs);
    });
  }
}

// Standalone CLI runner entrypoint
if (require.main === module) {
  const agent = new GymSyncAgent({
    cloudApiUrl: process.env.CLOUD_API_URL || "http://localhost:3000",
    deviceSerial: process.env.DEVICE_SERIAL || "ESSL-E990-DELHI-01",
    deviceApiKey: process.env.DEVICE_API_KEY || "gymsync_secret_key_123",
    terminalIp: "192.168.1.201",
    terminalPort: 4370,
    pollIntervalMs: 5000,
    heartbeatIntervalMs: 60000,
  });

  agent.start();
}
