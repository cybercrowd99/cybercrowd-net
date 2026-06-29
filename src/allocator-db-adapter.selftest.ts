// src/allocator-db-adapter.selftest.ts
// allocator / db-adapter-selftest
//
// No framework. No HTML. No UI.
//
// Run with:
//   npx tsx src/allocator-db-adapter.selftest.ts

import {
  KvAllocatorDbAdapter,
  type KvNamespaceLike,
  type PortLeaseRecord
} from "./allocator-db-adapter";

class MockKv implements KvNamespaceLike {
  private readonly store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async put(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

type TestFn = () => Promise<void> | void;

interface TestCase {
  name: string;
  run: TestFn;
}

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error("SELFTEST_FAILED: " + message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(
      `SELFTEST_FAILED: ${message}. Expected ${String(expected)}, got ${String(actual)}`
    );
  }
}

function makeAdapter(): KvAllocatorDbAdapter {
  return new KvAllocatorDbAdapter(new MockKv());
}

function makeLease(
  port: number,
  tenant_id: string,
  lease_id: string,
  now = Date.now()
): PortLeaseRecord {
  return {
    port,
    tenant_id,
    lease_id,
    created_at_ms: now,
    last_heartbeat_ms: now,
    status: "active"
  };
}

async function testClaimPortAndLookup(): Promise<void> {
  const adapter = makeAdapter();
  const lease = makeLease(8000, "tenant-a", "lease-a");

  const claimed = await adapter.claimPortIfFree(lease);

  assertEqual(claimed.ok, true, "claim should succeed");
  assertEqual(claimed.reason, null, "claim reason should be null");
  assert(claimed.lease, "claim should return lease");
  assertEqual(claimed.lease?.port, 8000, "claimed port should match");

  const byPort = await adapter.getLeaseByPort(8000);
  const byId = await adapter.getLeaseById("lease-a");

  assert(byPort, "lease should be found by port");
  assert(byId, "lease should be found by id");

  assertEqual(byPort?.tenant_id, "tenant-a", "port lookup tenant should match");
  assertEqual(byId?.port, 8000, "id lookup port should match");
}

async function testRejectBusyPort(): Promise<void> {
  const adapter = makeAdapter();

  const first = await adapter.claimPortIfFree(
    makeLease(8100, "tenant-a", "lease-a")
  );

  const second = await adapter.claimPortIfFree(
    makeLease(8100, "tenant-b", "lease-b")
  );

  assertEqual(first.ok, true, "first claim should succeed");
  assertEqual(second.ok, false, "second claim on busy port should fail");
  assertEqual(second.reason, "port-busy", "busy port reason should match");

  const current = await adapter.getLeaseByPort(8100);

  assertEqual(current?.tenant_id, "tenant-a", "original tenant should still own port");
  assertEqual(current?.lease_id, "lease-a", "original lease should still own port");
}

async function testExpiredPortCanBeReclaimed(): Promise<void> {
  const adapter = makeAdapter();

  const first = await adapter.claimPortIfFree(
    makeLease(8200, "tenant-a", "lease-a")
  );

  assertEqual(first.ok, true, "first claim should succeed");

  const expired = await adapter.markLeaseExpiredIfCurrent(
    "lease-a",
    8200,
    Date.now() + 10
  );

  assertEqual(expired.ok, true, "mark expired should succeed");
  assertEqual(expired.lease?.status, "expired", "lease should be expired");

  const second = await adapter.claimPortIfFree(
    makeLease(8200, "tenant-b", "lease-b", Date.now() + 20)
  );

  assertEqual(second.ok, true, "expired port should be claimable");
  assertEqual(second.lease?.tenant_id, "tenant-b", "new tenant should own reclaimed port");

  const oldLease = await adapter.getLeaseById("lease-a");
  const newLease = await adapter.getLeaseById("lease-b");

  assertEqual(oldLease, null, "old lease id lookup should be removed");
  assert(newLease, "new lease id lookup should exist");
}

async function testHeartbeatOwnerOnly(): Promise<void> {
  const adapter = makeAdapter();
  const now = Date.now();

  await adapter.claimPortIfFree(makeLease(8300, "tenant-a", "lease-a", now));

  const wrongTenant = await adapter.heartbeatLeaseIfOwner(
    "tenant-b",
    "lease-a",
    8300,
    now + 100
  );

  assertEqual(wrongTenant.ok, false, "wrong tenant heartbeat should fail");
  assertEqual(
    wrongTenant.reason,
    "tenant-mismatch",
    "wrong tenant heartbeat reason should match"
  );

  const wrongLease = await adapter.heartbeatLeaseIfOwner(
    "tenant-a",
    "fake-lease",
    8300,
    now + 100
  );

  assertEqual(wrongLease.ok, false, "wrong lease heartbeat should fail");
  assertEqual(wrongLease.reason, "not-found", "wrong lease heartbeat reason should match");

  const good = await adapter.heartbeatLeaseIfOwner(
    "tenant-a",
    "lease-a",
    8300,
    now + 200
  );

  assertEqual(good.ok, true, "owner heartbeat should succeed");
  assertEqual(good.reason, null, "owner heartbeat reason should be null");
  assertEqual(
    good.lease?.last_heartbeat_ms,
    now + 200,
    "heartbeat timestamp should update"
  );
}

async function testReleaseOwnerOnly(): Promise<void> {
  const adapter = makeAdapter();
  const now = Date.now();

  await adapter.claimPortIfFree(makeLease(8400, "tenant-a", "lease-a", now));

  const wrongTenant = await adapter.releaseLeaseIfOwner(
    "tenant-b",
    "lease-a",
    8400,
    now + 100
  );

  assertEqual(wrongTenant.ok, false, "wrong tenant release should fail");
  assertEqual(
    wrongTenant.reason,
    "tenant-mismatch",
    "wrong tenant release reason should match"
  );

  const wrongLease = await adapter.releaseLeaseIfOwner(
    "tenant-a",
    "fake-lease",
    8400,
    now + 100
  );

  assertEqual(wrongLease.ok, false, "wrong lease release should fail");
  assertEqual(wrongLease.reason, "not-found", "wrong lease release reason should match");

  const good = await adapter.releaseLeaseIfOwner(
    "tenant-a",
    "lease-a",
    8400,
    now + 200
  );

  assertEqual(good.ok, true, "owner release should succeed");
  assertEqual(good.reason, null, "owner release reason should be null");
  assertEqual(good.lease?.status, "expired", "released lease should be expired");

  const active = await adapter.listActiveLeases();

  assertEqual(active.length, 0, "released lease should not appear active");
}

async function testDeleteLeaseIfCurrent(): Promise<void> {
  const adapter = makeAdapter();

  await adapter.claimPortIfFree(makeLease(8500, "tenant-a", "lease-a"));

  const wrong = await adapter.deleteLeaseIfCurrent("fake-lease", 8500);

  assertEqual(wrong.ok, false, "wrong lease delete should fail");
  assertEqual(wrong.reason, "not-found", "wrong lease delete reason should match");

  const good = await adapter.deleteLeaseIfCurrent("lease-a", 8500);

  assertEqual(good.ok, true, "current lease delete should succeed");

  const byPort = await adapter.getLeaseByPort(8500);
  const byId = await adapter.getLeaseById("lease-a");

  assertEqual(byPort, null, "deleted lease should not exist by port");
  assertEqual(byId, null, "deleted lease should not exist by id");
}

async function testActiveAndTenantIndexes(): Promise<void> {
  const adapter = makeAdapter();
  const now = Date.now();

  await adapter.claimPortIfFree(makeLease(8600, "tenant-a", "lease-a1", now));
  await adapter.claimPortIfFree(makeLease(8601, "tenant-a", "lease-a2", now));
  await adapter.claimPortIfFree(makeLease(8602, "tenant-b", "lease-b1", now));

  const activeBefore = await adapter.listActiveLeases();
  const tenantABefore = await adapter.listLeasesByTenant("tenant-a");
  const tenantBBefore = await adapter.listLeasesByTenant("tenant-b");

  assertEqual(activeBefore.length, 3, "active list should include 3 leases");
  assertEqual(tenantABefore.length, 2, "tenant-a should have 2 leases");
  assertEqual(tenantBBefore.length, 1, "tenant-b should have 1 lease");

  await adapter.releaseLeaseIfOwner("tenant-a", "lease-a1", 8600, now + 100);

  const activeAfter = await adapter.listActiveLeases();
  const tenantAAfter = await adapter.listLeasesByTenant("tenant-a");

  assertEqual(activeAfter.length, 2, "active list should filter released lease");
  assertEqual(tenantAAfter.length, 1, "tenant-a list should filter released lease");
  assertEqual(tenantAAfter[0].port, 8601, "tenant-a remaining port should be 8601");
}

async function testCursorPersistence(): Promise<void> {
  const adapter = makeAdapter();
  const now = Date.now();

  const missing = await adapter.getCursor();

  assertEqual(missing, null, "missing cursor should return null");

  await adapter.putCursor(8700, now);

  const cursor = await adapter.getCursor();

  assert(cursor, "cursor should exist after put");
  assertEqual(cursor?.cursor_port, 8700, "cursor port should match");
  assertEqual(cursor?.updated_at_ms, now, "cursor timestamp should match");
}

async function testInvalidInputsFailSafely(): Promise<void> {
  const adapter = makeAdapter();

  const badClaim = await adapter.claimPortIfFree({
    port: -1,
    tenant_id: "",
    lease_id: "",
    created_at_ms: 0,
    last_heartbeat_ms: 0,
    status: "active"
  });

  assertEqual(badClaim.ok, false, "bad claim should fail");
  assertEqual(
    badClaim.reason,
    "invalid-lease-record",
    "bad claim reason should match"
  );

  const badHeartbeat = await adapter.heartbeatLeaseIfOwner(
    "",
    "",
    -1,
    Date.now()
  );

  assertEqual(badHeartbeat.ok, false, "bad heartbeat should fail");
  assertEqual(
    badHeartbeat.reason,
    "invalid-request",
    "bad heartbeat reason should match"
  );

  const badRelease = await adapter.releaseLeaseIfOwner(
    "",
    "",
    -1,
    Date.now()
  );

  assertEqual(badRelease.ok, false, "bad release should fail");
  assertEqual(
    badRelease.reason,
    "invalid-request",
    "bad release reason should match"
  );
}

const tests: TestCase[] = [
  { name: "claim port and lookup", run: testClaimPortAndLookup },
  { name: "reject busy port", run: testRejectBusyPort },
  { name: "expired port can be reclaimed", run: testExpiredPortCanBeReclaimed },
  { name: "heartbeat owner only", run: testHeartbeatOwnerOnly },
  { name: "release owner only", run: testReleaseOwnerOnly },
  { name: "delete lease if current", run: testDeleteLeaseIfCurrent },
  { name: "active and tenant indexes", run: testActiveAndTenantIndexes },
  { name: "cursor persistence", run: testCursorPersistence },
  { name: "invalid inputs fail safely", run: testInvalidInputsFailSafely }
];

async function run(): Promise<void> {
  let passed = 0;

  for (const test of tests) {
    try {
      await test.run();
      passed++;
      console.log(`PASS ${test.name}`);
    } catch (error) {
      console.error(`FAIL ${test.name}`);
      console.error(error);
      process.exitCode = 1;
      return;
    }
  }

  console.log(`allocator db adapter selftest passed: ${passed}/${tests.length}`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
