import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOrderCharge,
  validateOrder,
  canCancelOrder,
  calculateRefundAmount,
} from './orderCalculation.ts';

test('calculateOrderCharge computes correct charge based on price per 1000 or per package', () => {
  assert.equal(calculateOrderCharge(2.5, 1000), 2.5);
  assert.equal(calculateOrderCharge(2.5, 500), 1.25);
  assert.equal(calculateOrderCharge(10.0, 100), 1.0);
  assert.equal(calculateOrderCharge(0.85, 2000), 1.7);
  assert.equal(calculateOrderCharge(2.5, 0), 0);
  assert.equal(calculateOrderCharge(0, 1000), 0);

  // Package testing (e.g. 60 UC for 65 EGP)
  assert.equal(calculateOrderCharge(65.0, 1, true), 65.0);
  assert.equal(calculateOrderCharge(65.0, 2, true), 130.0);
  assert.equal(calculateOrderCharge(305.0, 1, true), 305.0);
});

test('validateOrder blocks invalid inputs', () => {
  const base = {
    link: 'https://instagram.com/user',
    quantity: 1000,
    minQuantity: 100,
    maxQuantity: 10000,
    pricePer1000: 20.0,
    userBalance: 50.0,
  };

  // Valid order (charge = 20.0 EGP >= 10 EGP)
  const validRes = validateOrder(base);
  assert.equal(validRes.valid, true);
  assert.equal(validRes.charge, 20.0);

  // Small order under 10 EGP (charge = 4.0 EGP) is valid as long as quantity >= minQuantity (100)
  const smallOrder = validateOrder({ ...base, quantity: 200, pricePer1000: 20.0 }); // charge = 4.0
  assert.equal(smallOrder.valid, true);
  assert.equal(smallOrder.charge, 4.0);

  // Empty link
  const emptyLink = validateOrder({ ...base, link: '' });
  assert.equal(emptyLink.valid, false);
  assert.match(emptyLink.error!, /الرابط مطلوب/);

  // Under min quantity
  const underMin = validateOrder({ ...base, quantity: 50 });
  assert.equal(underMin.valid, false);
  assert.match(underMin.error!, /الحد الأدنى/);

  // Over max quantity
  const overMax = validateOrder({ ...base, quantity: 20000 });
  assert.equal(overMax.valid, false);
  assert.match(overMax.error!, /الحد الأقصى/);

  // Insufficient balance
  const lowBalance = validateOrder({ ...base, userBalance: 5.0 });
  assert.equal(lowBalance.valid, false);
  assert.match(lowBalance.error!, /غير كافٍ/);
});

test('canCancelOrder only permits pending orders', () => {
  assert.equal(canCancelOrder('pending'), true);
  assert.equal(canCancelOrder('in_progress'), false);
  assert.equal(canCancelOrder('completed'), false);
  assert.equal(canCancelOrder('canceled'), false);
});

test('calculateRefundAmount computes full and partial refunds correctly', () => {
  // Full refund for canceled
  assert.equal(calculateRefundAmount('canceled', 10.0, 0, 1000), 10.0);
  // Partial refund: 500 remains out of 1000 with 10 charge = 5.0
  assert.equal(calculateRefundAmount('partial', 10.0, 500, 1000), 5.0);
  // Zero remains
  assert.equal(calculateRefundAmount('partial', 10.0, 0, 1000), 0);
});
