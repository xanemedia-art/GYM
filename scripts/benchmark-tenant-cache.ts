import { prisma } from "../src/lib/prisma";
import { getCachedTenant } from "../src/lib/tenant-cache";

async function runBenchmark() {
  console.log("=== High-Speed Database Latency Elimination Benchmark ===\n");

  const tenant = await prisma.tenant.findFirst({ select: { id: true, businessName: true } });
  if (!tenant) {
    console.log("No tenant found for benchmarking.");
    return;
  }

  console.log(`Testing with tenant: ${tenant.businessName} (${tenant.id})`);

  // 1. Measure direct uncached Prisma query
  const startUncached = performance.now();
  const directTenant = await prisma.tenant.findUnique({
    where: { id: tenant.id },
    select: {
      id: true,
      businessName: true,
      slug: true,
      currency: true,
      phone: true,
      email: true,
      address: true,
      isActive: true,
    },
  });
  const endUncached = performance.now();
  const uncachedDuration = endUncached - startUncached;
  console.log(`Uncached Prisma Database Query: ${uncachedDuration.toFixed(2)} ms`);

  // Prime cache
  await getCachedTenant(tenant.id);

  // 2. Measure cached in-memory retrieval (average over 1000 calls)
  const iterations = 1000;
  const startCached = performance.now();
  for (let i = 0; i < iterations; i++) {
    await getCachedTenant(tenant.id);
  }
  const endCached = performance.now();
  const cachedAvg = (endCached - startCached) / iterations;
  console.log(`Cached In-Memory Retrieval (Avg of ${iterations}): ${cachedAvg.toFixed(4)} ms`);

  const speedup = uncachedDuration / cachedAvg;
  console.log(`\n🚀 Speedup Factor: ${speedup.toFixed(0)}x faster!`);
  console.log(`Saved latency per page transition: ~${(uncachedDuration - cachedAvg).toFixed(2)} ms`);

  await prisma.$disconnect();
}

runBenchmark();
