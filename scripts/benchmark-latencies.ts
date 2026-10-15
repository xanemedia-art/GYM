import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "gym-saas-development-secret-jwt-key-2026-very-secure-32chars"
);

async function createAuthCookie() {
  const token = await new SignJWT({
    id: "ben-owner-live-id",
    email: "ben@befreefitness.in",
    role: "GYM_OWNER",
    tenantId: "dhalpur-kullu-branch-live",
    fullName: "Ben (Mahender Chauhan)",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);

  return `gms_session=${token}`;
}

async function measureEndpoint(url: string, cookie: string, iterations = 4) {
  const latencies: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const res = await fetch(url, {
      headers: {
        Cookie: cookie,
      },
    });
    await res.json();
    const duration = performance.now() - start;
    latencies.push(duration);
  }

  return {
    cold: latencies[0].toFixed(2),
    cachedAvg: (
      latencies.slice(1).reduce((sum, v) => sum + v, 0) / (latencies.length - 1)
    ).toFixed(2),
    min: Math.min(...latencies.slice(1)).toFixed(2),
    max: Math.max(...latencies.slice(1)).toFixed(2),
    all: latencies.map((l) => `${l.toFixed(1)}ms`).join(", "),
  };
}

async function runBenchmark() {
  console.log("=================================================");
  console.log("   BE FREE FITNESS API LATENCY BENCHMARK        ");
  console.log("   Target: < 50ms for cached responses          ");
  console.log("=================================================");

  const cookie = await createAuthCookie();
  const baseUrl = "http://localhost:3000";

  const endpoints = [
    { name: "Dashboard Metrics (/api/v1/dashboard/stats)", url: `${baseUrl}/api/v1/dashboard/stats` },
    { name: "Members Table List (/api/v1/members?limit=20)", url: `${baseUrl}/api/v1/members?limit=20` },
    { name: "Today Attendance Feed (/api/v1/attendance/today)", url: `${baseUrl}/api/v1/attendance/today` },
  ];

  for (const ep of endpoints) {
    console.log(`\nTesting: ${ep.name}...`);
    const result = await measureEndpoint(ep.url, cookie, 5);
    console.log(`  Runs: [${result.all}]`);
    console.log(`  Cold Latency: ${result.cold} ms`);
    console.log(`  Cached Avg:   ${result.cachedAvg} ms  <-- TARGET: < 50ms`);
    console.log(`  Fastest Cached: ${result.min} ms`);
    const passed = Number(result.cachedAvg) < 50;
    console.log(`  Status: ${passed ? "✅ PASSED (< 50ms)" : "⚠️ EXCEEDS 50ms"}`);
  }

  console.log("\n=================================================");
  console.log("Benchmark complete.");
}

runBenchmark().catch(console.error);
