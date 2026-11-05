export interface LedgerCalculationResult {
  allowed: boolean;
  balanceBefore: number;
  balanceAfter: number;
  error?: string;
}

/**
 * Validates and calculates balance changes atomically.
 * Prevents overdrafts and floating-point errors.
 */
export function applyBalanceAdjustment(
  currentBalance: number,
  deltaAmount: number,
  allowNegative = false
): LedgerCalculationResult {
  const roundedCurrent = Math.round(currentBalance * 10000) / 10000;
  const roundedDelta = Math.round(deltaAmount * 10000) / 10000;
  const balanceAfter = Math.round((roundedCurrent + roundedDelta) * 10000) / 10000;

  if (!allowNegative && balanceAfter < 0) {
    return {
      allowed: false,
      balanceBefore: roundedCurrent,
      balanceAfter: roundedCurrent,
      error: 'الرصيد الحالي غير كافٍ لإتمام هذه المعاملة',
    };
  }

  return {
    allowed: true,
    balanceBefore: roundedCurrent,
    balanceAfter,
  };
}

/**
 * Checks for idempotency key collision or duplicate order within short time window.
 */
export function isDuplicateOrderRecent(
  recentOrders: Array<{ serviceId: string; link: string; quantity: number; createdAt: string }>,
  newOrder: { serviceId: string; link: string; quantity: number },
  windowSeconds = 30
): boolean {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  return recentOrders.some((order) => {
    const isSameService = order.serviceId === newOrder.serviceId;
    const isSameLink = order.link.trim().toLowerCase() === newOrder.link.trim().toLowerCase();
    const isSameQty = order.quantity === newOrder.quantity;
    const orderTime = new Date(order.createdAt).getTime();
    const isRecent = now - orderTime < windowMs;

    return isSameService && isSameLink && isSameQty && isRecent;
  });
}
