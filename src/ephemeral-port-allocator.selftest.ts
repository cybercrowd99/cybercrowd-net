// src/ephemeral-port-allocator.selftest.ts
// allocator / selftest
//
// Self-test for Ephemeral Port Allocator working model.
// No HTML. No framework. No UI.
//
// Run with:
//   npx tsx src/ephemeral-port-allocator.selftest.ts
//
// Or compile with TypeScript and run with Node.

import { EphemeralPortAllocator } from "./ephemeral-port-allocator";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error("SELFTEST_FAILED: " + message);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testAllocateWrapExhaustRelease(): Promise<void> {
  const allocator = new EphemeralPortAllocator({
    PORT_MIN: 5000,
    PORT_MAX: 5002,
    LEASE_TTL_MS: 10000,
    HEARTBEAT_GRACE_MS: 1000,
    MAX_RETRIES_PER_REQUEST: 3
  });

  const a = allocator.allocate("tenant-a");
  const b = allocator.allocate("tenant-b");
  const c = allocator.allocate("tenant-c");

  assert(a.ok === true, "tenant-a should allocate");
  assert(b.ok === true, "tenant-b should allocate");
  assert(c.ok === true, "tenant-c should allocate");

  assert(a.port === 5000, "first allocation should be 5000");
  assert(b.port === 5001, "second allocation should be 5001");
  assert(c.port === 5002, "third allocation should be 5002");

  const exhausted = allocator.allocate("tenant-d");

  assert(exhausted.ok === false, "fourth allocation should exhaust");
  assert(exhausted.reason === "exhausted", "exhaust reason should be exhausted");

  const releaseB = allocator.release("tenant-b", b.lease_id as string, b.port as number);

  assert(releaseB.ok === true, "tenant-b should release");

  const d = allocator.allocate("tenant-d");

  assert(d.ok === true, "tenant-d should allocate after release");
  assert(d.port === 5001, "tenant-d should receive released port 5001");
}

async function testTenantIsolation(): Promise<void> {
  const allocator = new EphemeralPortAllocator({
    PORT_MIN: 5100,
    PORT_MAX: 5102,
    LEASE_TTL_MS: 10000,
    HEARTBEAT_GRACE_MS: 1000,
    MAX_RETRIES_PER_REQUEST: 3
  });

  const lease = allocator.allocate("tenant-owner");

  assert(lease.ok === true, "owner should allocate");

  const wrongRelease = allocator.release(
    "tenant-attacker",
    lease.lease_id as string,
    lease.port as number
  );

  assert(wrongRelease.ok === false, "wrong tenant release should fail");
  assert(
    wrongRelease.reason === "tenant-mismatch",
    "wrong tenant release should return tenant-mismatch"
  );

  const wrongHeartbeat = allocator.heartbeat(
    "tenant-attacker",
    lease.lease_id as string,
    lease.port as number
  );

  assert(wrongHeartbeat.ok === false, "wrong tenant heartbeat should fail");
  assert(
    wrongHeartbeat.reason === "tenant-mismatch",
    "wrong tenant heartbeat should return tenant-mismatch"
  );

  const staleHeartbeat = allocator.heartbeat(
    "tenant-owner",
    "fake-lease-id",
    lease.port as number
  );

  assert(staleHeartbeat.ok === false, "wrong lease id heartbeat should fail");
  assert(staleHeartbeat.reason === "not-found", "wrong lease id should return not-found");
}

async function testHeartbeatKeepsLeaseAlive(): Promise<void> {
  const allocator = new EphemeralPortAllocator({
    PORT_MIN: 5200,
    PORT_MAX: 5202,
    LEASE_TTL_MS: 10000,
    HEARTBEAT_GRACE_MS: 1000,
    MAX_RETRIES_PER_REQUEST: 3
  });

  const lease = allocator.allocate("tenant-heartbeat");

  assert(lease.ok === true, "tenant-heartbeat should allocate");

  const heartbeat = allocator.heartbeat(
    "tenant-heartbeat",
    lease.lease_id as string,
    lease.port as number
  );

  assert(heartbeat.ok === true, "heartbeat should succeed");
  assert(heartbeat.reason === null, "heartbeat reason should be null");

  const leases = allocator.getTenantLeases("tenant-heartbeat");

  assert(leases.length === 1, "tenant-heartbeat should have one active lease");
  assert(leases[0].port === lease.port, "heartbeat lease port should match");
}

async function testExpiredReclaimSweep(): Promise<void> {
  const allocator = new EphemeralPortAllocator({
    PORT_MIN: 5300,
    PORT_MAX: 5302,
    LEASE_TTL_MS: 5,
    HEARTBEAT_GRACE_MS: 5,
    MAX_RETRIES_PER_REQUEST: 3
  });

  const lease = allocator.allocate("tenant-expire");

  assert(lease.ok === true, "tenant-expire should allocate");

  await sleep(20);

  const heartbeat = allocator.heartbeat(
    "tenant-expire",
    lease.lease_id as string,
    lease.port as number
  );

  assert(heartbeat.ok === false, "expired heartbeat should fail");
  assert(heartbeat.reason === "expired", "expired heartbeat should return expired");

  const reclaimed = allocator.reclaimExpired();

  assert(reclaimed === 1, "reclaimExpired should reclaim one expired lease");

  const leases = allocator.getTenantLeases("tenant-expire");

  assert(leases.length === 0, "tenant-expire should have no active leases after reclaim");
}

async function testInlineReclaimDuringAllocate(): Promise<void> {
  const allocator = new EphemeralPortAllocator({
    PORT_MIN: 5400,
    PORT_MAX: 5401,
    LEASE_TTL_MS: 5,
    HEARTBEAT_GRACE_MS: 5,
    MAX_RETRIES_PER_REQUEST: 2
  });

  const a = allocator.allocate("tenant-a");
  const b = allocator.allocate("tenant-b");

  assert(a.ok === true, "tenant-a should allocate");
  assert(b.ok === true, "tenant-b should allocate");

  const exhaustedBeforeExpire = allocator.allocate("tenant-c");

  assert(exhaustedBeforeExpire.ok === false, "tenant-c should exhaust before expiration");
  assert(
    exhaustedBeforeExpire.reason === "exhausted",
    "tenant-c should receive exhausted before expiration"
  );

  await sleep(20);

  const c = allocator.allocate("tenant-c");

  assert(c.ok === true, "tenant-c should allocate after inline reclaim");
  assert(c.port !== null, "tenant-c should receive a reclaimed port");
}

async function testActiveSummary(): Promise<void> {
  const allocator = new EphemeralPortAllocator({
    PORT_MIN: 5500,
    PORT_MAX: 5504,
    LEASE_TTL_MS: 10000,
    HEARTBEAT_GRACE_MS: 1000,
    MAX_RETRIES_PER_REQUEST: 5
  });

  allocator.allocate("tenant-a");
  allocator.allocate("tenant-a");
  allocator.allocate("tenant-b");

  const summary = allocator.getActiveSummary();

  assert(summary.total_capacity === 5, "summary capacity should be 5");
  assert(summary.active_count === 3, "summary active count should be 3");
  assert(summary.expired_count === 0, "summary expired count should be 0");

  const tenantA = summary.by_tenant.find((item) => item.tenant_id === "tenant-a");
  const tenantB = summary.by_tenant.find((item) => item.tenant_id === "tenant-b");

  assert(tenantA?.active_count === 2, "tenant-a should have 2 active leases");
  assert(tenantB?.active_count === 1, "tenant-b should have 1 active lease");
}

async function runSelfTest(): Promise<void> {
  await testAllocateWrapExhaustRelease();
  await testTenantIsolation();
  await testHeartbeatKeepsLeaseAlive();
  await testExpiredReclaimSweep();
  await testInlineReclaimDuringAllocate();
  await testActiveSummary();

  console.log("allocator selftest passed");
}

runSelfTest().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
