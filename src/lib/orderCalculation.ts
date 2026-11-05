export interface OrderValidationInput {
  link: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  pricePer1000: number;
  userBalance: number;
  isPackage?: boolean;
}

export interface OrderValidationResult {
  valid: boolean;
  error?: string;
  charge: number;
}

/**
 * Calculates the total charge for a service order based on price per 1000 units or per package.
 * Always rounds to 4 decimal places.
 */
export function calculateOrderCharge(pricePerUnitOr1000: number, quantity: number, isPackage = false): number {
  if (quantity <= 0 || pricePerUnitOr1000 <= 0) return 0;
  const raw = isPackage ? (quantity * pricePerUnitOr1000) : ((quantity / 1000) * pricePerUnitOr1000);
  return Math.round(raw * 10000) / 10000;
}

/**
 * Validates order parameters before placement.
 */
export function validateOrder(input: OrderValidationInput): OrderValidationResult {
  if (!input.link || input.link.trim().length === 0) {
    return { valid: false, error: input.isPackage ? 'يرجى إدخال معرّف اللاعب (Player ID) المطلوب' : 'الرابط مطلوب (يرجى إدخال رابط الحساب أو المنشور)', charge: 0 };
  }

  // Basic URL or Player ID check
  const trimmedLink = input.link.trim();
  if (trimmedLink.length < 3) {
    return { valid: false, error: input.isPackage ? 'معرّف اللاعب (Player ID) غير صالح أو قصير جداً' : 'الرابط المدخل غير صالح أو قصير جداً', charge: 0 };
  }

  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    return { valid: false, error: 'الكمية يجب أن تكون عدداً صحيحاً أكبر من صفر', charge: 0 };
  }

  if (input.quantity < input.minQuantity) {
    return {
      valid: false,
      error: `الحد الأدنى للكمية المسموح بها لهذه الخدمة هو ${input.minQuantity}`,
      charge: 0,
    };
  }

  if (input.quantity > input.maxQuantity) {
    return {
      valid: false,
      error: `الحد الأقصى للكمية المسموح بها لهذه الخدمة هو ${input.maxQuantity}`,
      charge: 0,
    };
  }

  const charge = calculateOrderCharge(input.pricePer1000, input.quantity, Boolean(input.isPackage));

  if (input.userBalance < charge) {
    const missing = (charge - input.userBalance).toFixed(2);
    return {
      valid: false,
      error: `رصيدك الحالي غير كافٍ (${input.userBalance.toFixed(2)} ج.م). ينقصك ${missing} ج.م لإتمام الطلب. يرجى شحن الرصيد أولاً.`,
      charge,
    };
  }

  return { valid: true, charge };
}

/**
 * Orders can only be cancelled/refunded if they are in 'pending' or 'in_progress' state.
 */
export function canCancelOrder(status: string): boolean {
  return status === 'pending';
}

/**
 * Calculate refund amount for partial or cancelled orders.
 */
export function calculateRefundAmount(
  status: string,
  charge: number,
  remains: number,
  quantity: number
): number {
  if (status === 'canceled' || status === 'refunded') {
    return charge;
  }
  if (status === 'partial' && quantity > 0 && remains > 0) {
    const refundRatio = Math.min(1, Math.max(0, remains / quantity));
    const refund = charge * refundRatio;
    return Math.round(refund * 10000) / 10000;
  }
  return 0;
}
