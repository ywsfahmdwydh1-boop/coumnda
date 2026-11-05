import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSellingPrice,
  validateServicePriceUpdate,
  applyCategoryMarginToServices,
  getDefaultCategoryMargin,
} from './pricingManager.ts';
import { Service } from '../types/index.ts';

test('getDefaultCategoryMargin returns 5% for gaming and 30% for tiktok and 30% for other social', () => {
  assert.equal(getDefaultCategoryMargin('cat_pubg'), 5);
  assert.equal(getDefaultCategoryMargin('cat_freefire'), 5);
  assert.equal(getDefaultCategoryMargin('cat_fifa'), 5);
  assert.equal(getDefaultCategoryMargin('cat_ludo'), 5);
  assert.equal(getDefaultCategoryMargin('cat_tiktok'), 30);
  assert.equal(getDefaultCategoryMargin('cat_instagram'), 30);
});

test('calculateSellingPrice correctly adds margin to provider base cost', () => {
  // TikTok Likes base cost = 21.50 EGP with +30% margin
  // 21.50 * 1.30 = 27.95
  const res30 = calculateSellingPrice(21.50, 30, false);
  assert.equal(res30.sellingPrice, 27.95);
  assert.equal(res30.profitAmount, 6.45);
  assert.equal(res30.effectiveMarginPercent, 30);
  assert.equal(res30.originalPriceBeforeDiscount, undefined);

  // TikTok Likes base cost = 21.50 EGP with offer flag (Fake Discount Strategy)
  // Selling price MUST remain 27.95 (+30% profit preserved 100%)
  // Original anchor price is generated (~1.5x) with discount percent badge
  const resOffer = calculateSellingPrice(21.50, 30, true);
  assert.equal(resOffer.sellingPrice, 27.95);
  assert.equal(resOffer.profitAmount, 6.45);
  assert.equal(resOffer.effectiveMarginPercent, 30);
  assert.equal(resOffer.originalPriceBeforeDiscount, 41.93);
  assert.equal(resOffer.discountPercent, 33);

  // Gaming package base cost = 55 EGP with +7% margin
  // 55 * 1.07 = 58.85
  const resGaming = calculateSellingPrice(55.0, 7, false);
  assert.equal(resGaming.sellingPrice, 58.85);
  assert.equal(resGaming.profitAmount, 3.85);
});

test('calculateSellingPrice enforces protection against negative margin', () => {
  // Attempting negative margin should be clamped to 0 margin (price = baseCost)
  const res = calculateSellingPrice(100, -15, false);
  assert.equal(res.sellingPrice, 100);
  assert.equal(res.profitAmount, 0);
  assert.equal(res.effectiveMarginPercent, 0);
});

test('validateServicePriceUpdate blocks prices lower than provider base cost', () => {
  // Attempt to set price lower than base cost (50 < 60) -> BLOCKED
  const blocked = validateServicePriceUpdate({
    originalProviderCost: 60,
    newPrice: 50,
  });
  assert.equal(blocked.valid, false);
  assert.match(blocked.error!, /لا يمكن تعيين سعر بيع.*أقل من تكلفة المزود الأصلية/);

  // Valid update (60 >= 60) -> ALLOWED
  const allowedExact = validateServicePriceUpdate({
    originalProviderCost: 60,
    newPrice: 60,
  });
  assert.equal(allowedExact.valid, true);
  assert.equal(allowedExact.calculatedMarginPercent, 0);

  // Valid update with profit (78 > 60) -> ALLOWED (+30%)
  const allowedProfit = validateServicePriceUpdate({
    originalProviderCost: 60,
    newPrice: 78,
  });
  assert.equal(allowedProfit.valid, true);
  assert.equal(allowedProfit.calculatedMarginPercent, 30);
});

test('applyCategoryMarginToServices recalculates services and preserves accounts', () => {
  const dummyServices: Service[] = [
    {
      id: 's1',
      categoryId: 'cat_tiktok',
      name: 'خدمة عادية',
      description: 'وصف',
      originalProviderCost: 20,
      pricePer1000: 26,
      minQuantity: 100,
      maxQuantity: 10000,
      providerServiceId: 'p1',
      speed: 'فوري',
      type: 'default',
      active: true,
      isOffer: false,
    },
    {
      id: 's2',
      categoryId: 'cat_tiktok',
      name: 'عرض ترويجي',
      description: 'وصف عرض',
      originalProviderCost: 20,
      pricePer1000: 24,
      minQuantity: 100,
      maxQuantity: 10000,
      providerServiceId: 'p2',
      speed: 'فوري',
      type: 'default',
      active: true,
      isOffer: true,
    },
    {
      id: 'acc1',
      categoryId: 'cat_tiktok',
      name: 'حساب تيك توك 14K',
      description: 'حساب',
      originalProviderCost: 700,
      pricePer1000: 800,
      minQuantity: 1,
      maxQuantity: 1,
      providerServiceId: 'acc_14k',
      speed: 'فوري',
      type: 'package',
      active: true,
      isAccountSale: true,
    },
    {
      id: 'other',
      categoryId: 'cat_instagram',
      name: 'انستا',
      description: 'انستا',
      originalProviderCost: 10,
      pricePer1000: 13,
      minQuantity: 100,
      maxQuantity: 10000,
      providerServiceId: 'ig1',
      speed: 'فوري',
      type: 'default',
      active: true,
    },
  ];

  // Adjust TikTok margin to 35%
  const updated = applyCategoryMarginToServices(dummyServices, 'cat_tiktok', 35);

  // Standard service got 35%: 20 * 1.35 = 27
  assert.equal(updated.find((s) => s.id === 's1')!.pricePer1000, 27);

  // Offer service also charges 35% (20 * 1.35 = 27) preserving profit, but has fake anchor
  const updatedOffer = updated.find((s) => s.id === 's2')!;
  assert.equal(updatedOffer.pricePer1000, 27);
  assert.equal(updatedOffer.originalPriceBeforeDiscount, 40.5); // 27 * 1.5

  // Account sale remained untouched (800)
  assert.equal(updated.find((s) => s.id === 'acc1')!.pricePer1000, 800);

  // Instagram service remained untouched (13)
  assert.equal(updated.find((s) => s.id === 'other')!.pricePer1000, 13);
});
