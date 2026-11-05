import { Service } from '../types/index.ts';

export const GAMING_CATEGORY_IDS = ['cat_pubg', 'cat_freefire', 'cat_fifa', 'cat_ludo'];

export const DEFAULT_TIKTOK_MARGIN_PERCENT = 30; // +30% margin on TikTok services (xfollowr.com)
export const DEFAULT_SOCIAL_MARGIN_PERCENT = 30; // +30% margin on other social services (xfollowr.com)
export const DEFAULT_OFFER_MARGIN_PERCENT = 20;
export const DEFAULT_GAMING_MARGIN_PERCENT = 5; // +5% profit margin on gaming top-ups (Carry st shop API)

/**
 * Returns the default profit margin percentage for a category:
 * - TikTok: 30%
 * - Gaming: 5% (Carry st shop)
 * - Other Social Media: 30% (XFollowr)
 */
export function getDefaultCategoryMargin(categoryId: string): number {
  if (categoryId === 'cat_tiktok') {
    return DEFAULT_TIKTOK_MARGIN_PERCENT;
  }
  if (GAMING_CATEGORY_IDS.includes(categoryId)) {
    return DEFAULT_GAMING_MARGIN_PERCENT;
  }
  return DEFAULT_SOCIAL_MARGIN_PERCENT;
}

export interface PricingCalculationResult {
  sellingPrice: number;
  effectiveMarginPercent: number;
  profitAmount: number;
  originalProviderCost: number;
  originalPriceBeforeDiscount?: number;
  discountPercent?: number;
}

/**
 * Unified calculation of service selling price:
 * Final Selling Price = Provider Base Cost + Specified Margin (+30% social, +7% gaming)
 * For special offers, the selling price preserves 100% of platform profit margin (+30% or +7%),
 * while generating a psychological fake anchor strikethrough price (e.g. ~1.5x) so the customer
 * sees a rewarding discount badge without any loss to the platform.
 * Enforces strict protection that selling price can never be less than base provider cost.
 */
export function calculateSellingPrice(
  originalProviderCost: number,
  marginPercent: number,
  isOffer = false,
  fakeAnchorMultiplier = 1.5
): PricingCalculationResult {
  const cost = Math.max(0, originalProviderCost);
  
  // Safe margin determination: negative margins are strictly disallowed to prevent loss
  const targetMargin = Math.max(0, marginPercent);
  
  // Calculate price with 2 decimal precision
  const rawPrice = cost * (1 + targetMargin / 100);
  let sellingPrice = Math.round(rawPrice * 100) / 100;

  // Strict Protection Gate: Selling price must never be below provider base cost
  if (sellingPrice < cost) {
    sellingPrice = cost;
  }

  const profitAmount = Math.round((sellingPrice - cost) * 100) / 100;

  // Fake offer calculation: platform charges full selling price, displays higher anchor
  let originalPriceBeforeDiscount: number | undefined;
  let discountPercent: number | undefined;

  if (isOffer && sellingPrice > 0) {
    const rawAnchor = Math.max(sellingPrice * fakeAnchorMultiplier, sellingPrice + 5);
    // Round anchor to clean display number
    originalPriceBeforeDiscount = Math.round(rawAnchor * 100) / 100;
    discountPercent = Math.round(((originalPriceBeforeDiscount - sellingPrice) / originalPriceBeforeDiscount) * 100);
  }

  return {
    sellingPrice,
    effectiveMarginPercent: targetMargin,
    profitAmount,
    originalProviderCost: cost,
    originalPriceBeforeDiscount,
    discountPercent,
  };
}

export interface PriceUpdateValidationResult {
  valid: boolean;
  error?: string;
  minAllowedPrice: number;
  calculatedMarginPercent?: number;
}

/**
 * Protection validation gate for editing/creating services.
 * Blocks any price update that falls below the provider's cost.
 */
export function validateServicePriceUpdate(input: {
  originalProviderCost: number;
  newPrice: number;
  isOffer?: boolean;
}): PriceUpdateValidationResult {
  const cost = Number(input.originalProviderCost);
  const price = Number(input.newPrice);

  if (isNaN(cost) || cost < 0) {
    return {
      valid: false,
      error: 'تكلفة المزود الأصلية غير صالحة',
      minAllowedPrice: 0,
    };
  }

  if (isNaN(price) || price <= 0) {
    return {
      valid: false,
      error: 'سعر البيع يجب أن يكون رقماً أكبر من صفر',
      minAllowedPrice: cost,
    };
  }

  // Mandatory Protection: Never allow selling price below provider base cost
  if (price < cost) {
    return {
      valid: false,
      error: `لا يمكن تعيين سعر بيع (${price.toFixed(2)} ج.م) أقل من تكلفة المزود الأصلية (${cost.toFixed(2)} ج.م). هذا الإجراء محمي لمنع أي خسائر مالية.`,
      minAllowedPrice: cost,
    };
  }

  const margin = cost > 0 ? Math.round(((price - cost) / cost) * 10000) / 100 : 100;

  return {
    valid: true,
    minAllowedPrice: cost,
    calculatedMarginPercent: margin,
  };
}

/**
 * Batch recalculates all services in a category with a new margin.
 * Special offers maintain the full profit margin (selling price = cost * (1 + margin/100)),
 * while presenting a psychological anchor price and discount badge to the customer.
 * Account sales are preserved if marked.
 */
export function applyCategoryMarginToServices(
  services: Service[],
  categoryId: string,
  newMarginPercent: number
): Service[] {
  return services.map((s) => {
    if (s.categoryId !== categoryId) return s;
    if (s.isAccountSale) return s; // Do not overwrite accounts sales

    const cost = s.originalProviderCost ?? (s.pricePer1000 / 1.3);

    const calc = calculateSellingPrice(
      cost,
      newMarginPercent,
      Boolean(s.isOffer)
    );

    return {
      ...s,
      originalProviderCost: cost,
      pricePer1000: calc.sellingPrice,
      originalPriceBeforeDiscount: calc.originalPriceBeforeDiscount,
      discountPercent: calc.discountPercent,
    };
  });
}

