import test from 'node:test';
import assert from 'node:assert/strict';
import { applyBalanceAdjustment, isDuplicateOrderRecent } from './ledger.ts';

test('applyBalanceAdjustment correctly increments deposits', () => {
  const result = applyBalanceAdjustment(15.5, 20.0);
  assert.equal(result.allowed, true);
  assert.equal(result.balanceBefore, 15.5);
  assert.equal(result.balanceAfter, 35.5);
});

test('applyBalanceAdjustment correctly decrements order charges', () => {
  const result = applyBalanceAdjustment(25.0, -10.5);
  assert.equal(result.allowed, true);
  assert.equal(result.balanceBefore, 25.0);
  assert.equal(result.balanceAfter, 14.5);
});

test('applyBalanceAdjustment blocks overdrafts without allowNegative', () => {
  const result = applyBalanceAdjustment(5.0, -10.0, false);
  assert.equal(result.allowed, false);
  assert.equal(result.balanceBefore, 5.0);
  assert.equal(result.balanceAfter, 5.0);
  assert.match(result.error!, /غير كافٍ/);
});

test('isDuplicateOrderRecent detects duplicate within window', () => {
  const now = new Date().toISOString();
  const recentOrders = [
    { serviceId: 's-1', link: 'https://instagram.com/p/123', quantity: 1000, createdAt: now },
  ];

  // Exact same within 30s
  assert.equal(
    isDuplicateOrderRecent(
      recentOrders,
      { serviceId: 's-1', link: 'https://instagram.com/p/123', quantity: 1000 },
      30
    ),
    true
  );

  // Different link
  assert.equal(
    isDuplicateOrderRecent(
      recentOrders,
      { serviceId: 's-1', link: 'https://instagram.com/p/999', quantity: 1000 },
      30
    ),
    false
  );

  // Different quantity
  assert.equal(
    isDuplicateOrderRecent(
      recentOrders,
      { serviceId: 's-1', link: 'https://instagram.com/p/123', quantity: 500 },
      30
    ),
    false
  );
});
