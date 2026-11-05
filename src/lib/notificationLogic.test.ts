import test from 'node:test';
import assert from 'node:assert/strict';

export function isOrderRetryable(status: string): boolean {
  return status === 'canceled' || status === 'refunded' || status === 'failed';
}

export function formatStatusLabelArabic(status: string): string {
  switch (status) {
    case 'completed':
      return 'مكتمل بنجاح ✅';
    case 'in_progress':
      return 'قيد التنفيذ 🚀';
    case 'canceled':
      return 'ملغي ❌';
    case 'refunded':
      return 'مسترد لرصيدك 🔄';
    case 'partial':
      return 'مكتمل جزئياً ⏳';
    default:
      return 'قيد الانتظار ⏳';
  }
}

export function calculateBackoffDelay(attempt: number, maxMs: number = 10000): number {
  return Math.min(1000 * Math.pow(1.5, attempt), maxMs);
}

export function prepareRetryOrderPayload(order: {
  serviceId?: string;
  serviceName?: string;
  link?: string;
  quantity?: number;
  orderNumber?: string;
  charge?: number;
}) {
  return {
    serviceId: order.serviceId || '',
    serviceName: order.serviceName || '',
    link: order.link || '',
    quantity: order.quantity && order.quantity > 0 ? order.quantity : 1,
    orderNumber: order.orderNumber || '',
    charge: order.charge || 0,
    isReadyForOneClickRetry: Boolean(order.serviceId || order.serviceName),
  };
}

test('isOrderRetryable flags canceled and refunded orders correctly', () => {
  assert.equal(isOrderRetryable('canceled'), true);
  assert.equal(isOrderRetryable('refunded'), true);
  assert.equal(isOrderRetryable('failed'), true);
  assert.equal(isOrderRetryable('completed'), false);
  assert.equal(isOrderRetryable('in_progress'), false);
  assert.equal(isOrderRetryable('pending'), false);
});

test('formatStatusLabelArabic provides clear Arabic status tags', () => {
  assert.equal(formatStatusLabelArabic('completed'), 'مكتمل بنجاح ✅');
  assert.equal(formatStatusLabelArabic('in_progress'), 'قيد التنفيذ 🚀');
  assert.equal(formatStatusLabelArabic('canceled'), 'ملغي ❌');
  assert.equal(formatStatusLabelArabic('refunded'), 'مسترد لرصيدك 🔄');
});

test('calculateBackoffDelay produces bounded exponential backoff values', () => {
  assert.equal(calculateBackoffDelay(0), 1000);
  assert.equal(calculateBackoffDelay(1), 1500);
  assert.equal(calculateBackoffDelay(2), 2250);
  assert.equal(calculateBackoffDelay(10), 10000); // capped at maxMs
});

test('prepareRetryOrderPayload correctly preserves all details for 1-click reorder', () => {
  const retryPayload = prepareRetryOrderPayload({
    serviceId: 'srv_pubg_60uc',
    serviceName: '60 شدة ببجي موبايل',
    link: '5192837461',
    quantity: 1,
    orderNumber: 'KMD-9912',
    charge: 52.5,
  });

  assert.equal(retryPayload.serviceId, 'srv_pubg_60uc');
  assert.equal(retryPayload.serviceName, '60 شدة ببجي موبايل');
  assert.equal(retryPayload.link, '5192837461');
  assert.equal(retryPayload.quantity, 1);
  assert.equal(retryPayload.isReadyForOneClickRetry, true);
});
