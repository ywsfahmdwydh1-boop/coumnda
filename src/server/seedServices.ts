import fs from 'fs';
import path from 'path';

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  sortOrder: number;
  active: boolean;
}

interface Service {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  pricePer1000: number; // Price in EGP
  originalProviderCost: number; // Base cost from provider
  minQuantity: number;
  maxQuantity: number;
  providerServiceId: string;
  speed: string;
  type: 'default' | 'custom_comments' | 'package';
  active: boolean;
  isOffer?: boolean;
  originalPriceBeforeDiscount?: number;
  discountPercent?: number;
  isAccountSale?: boolean;
  isAvailable?: boolean;
}

export const categories: Category[] = [
  {
    id: 'cat_pubg',
    name: 'ببجي موبايل (PUBG Mobile)',
    icon: 'Gamepad2',
    description: 'شحن شدات ببجي UC فورية بالأيدي ID مباشر وموثوق عبر منصة KOUMND',
    sortOrder: 1,
    active: true,
  },
  {
    id: 'cat_freefire',
    name: 'فري فاير (Free Fire)',
    icon: 'Flame',
    description: 'شحن جواهر فري فاير فورية، العضوية الأسبوعية والشهرية بالمعرف ID',
    sortOrder: 2,
    active: true,
  },
  {
    id: 'cat_fifa',
    name: 'فيفا موبايل (FC Mobile)',
    icon: 'Trophy',
    description: 'شحن نقاط فيفا FC Points وتصريح النجم Star Pass فوري عبر الـ UID',
    sortOrder: 3,
    active: true,
  },
  {
    id: 'cat_ludo',
    name: 'يلا لودو (Yalla Ludo)',
    icon: 'Dice6',
    description: 'شحن ماس وجواهر وكوينز يلا لودو ولودو كلوب فورياً بالمعرّف ID',
    sortOrder: 4,
    active: true,
  },
  {
    id: 'cat_tiktok',
    name: 'تيك توك (TikTok)',
    icon: 'Video',
    description: 'متابعين تيك توك، مشاهدات فورية، لايكات ومشاركات إكسبلور ودعم البث المباشر وحسابات حقيقية',
    sortOrder: 5,
    active: true,
  },
  {
    id: 'cat_instagram',
    name: 'إنستغرام (Instagram)',
    icon: 'Instagram',
    description: 'متابعين حقيقيين، لايكات، مشاهدات ريلز وستوري بجودة عالية وضمان تعويض',
    sortOrder: 6,
    active: true,
  },
  {
    id: 'cat_facebook',
    name: 'فيسبوك (Facebook)',
    icon: 'Facebook',
    description: 'متابعين صفحات وحسابات شخصية، لايكات وتفاعل لمنشورات وريلز فيسبوك',
    sortOrder: 7,
    active: true,
  },
  {
    id: 'cat_youtube',
    name: 'يوتيوب (YouTube)',
    icon: 'Youtube',
    description: 'مشاهدات يوتيوب حقيقية لتحقيق الدخل، وساعات مشاهدة ومشتركين بدون نقص',
    sortOrder: 8,
    active: true,
  },
  {
    id: 'cat_telegram',
    name: 'تيليجرام (Telegram)',
    icon: 'Send',
    description: 'أعضاء قنوات ومجموعات عربية وعالمية مع مشاهدات وتفاعلات للمنشورات',
    sortOrder: 9,
    active: true,
  },
  {
    id: 'cat_twitter',
    name: 'إكس / تويتر (X / Twitter)',
    icon: 'Twitter',
    description: 'متابعين حسابات، ريتويت، لايكات وتصويت استطلاعات موثوقة',
    sortOrder: 10,
    active: true,
  },
  {
    id: 'cat_snapchat',
    name: 'سناب شات (Snapchat)',
    icon: 'Ghost',
    description: 'متابعين أضواء Spotlight، مشاهدات قصص وسنابات سريعة وآمنة',
    sortOrder: 11,
    active: true,
  },
  {
    id: 'cat_threads',
    name: 'ثريدز (Threads)',
    icon: 'AtSign',
    description: 'متابعين ثريدز، إعجابات وإعادة نشر لمنشورات تطبيق ثريدز الجديد',
    sortOrder: 12,
    active: true,
  },
];

let serviceCounter = 100;

// Helper to calculate attractive fake discount anchor (Current selling price is discounted from higher anchor)
function computeFakeAnchor(sellingPrice: number, isSpecialOffer: boolean = false): { anchor: number; discountPercent: number } {
  const multiplier = isSpecialOffer ? 1.57 : 1.42;
  let raw = sellingPrice * multiplier;
  if (sellingPrice < 1) {
    raw = Math.round((sellingPrice * 1.6 + 0.05) * 100) / 100;
  } else if (sellingPrice < 10) {
    raw = Math.ceil(raw * 2) / 2;
  } else if (sellingPrice < 100) {
    raw = Math.ceil(raw);
  } else {
    raw = Math.ceil(raw / 5) * 5;
  }
  const anchor = Math.round(Math.max(raw, sellingPrice + (sellingPrice < 5 ? 0.1 : 3)) * 100) / 100;
  const discountPercent = Math.round(((anchor - sellingPrice) / anchor) * 100);
  return { anchor, discountPercent };
}

// Helper to create social service with exact margin (35% for TikTok, 30% for others) & attractive fake discount anchor
function createService(
  categoryId: string,
  name: string,
  description: string,
  originalCostUsd: number,
  minQty: number,
  maxQty: number,
  speed: string,
  type: 'default' | 'custom_comments' | 'package' = 'default',
  isOffer: boolean = false,
  isAvailable: boolean = true
): Service {
  serviceCounter++;
  const costEGP = Math.round(originalCostUsd * 50 * 100) / 100;
  const marginMultiplier = 1.35; // Exact +35% for all social services (xfollowr.com API)
  const sellingPrice = Math.round(costEGP * marginMultiplier * 100) / 100;
  
  // Attractive fake discount anchor
  const { anchor: fakeAnchor, discountPercent } = computeFakeAnchor(sellingPrice, isOffer);

  return {
    id: `srv_${categoryId.replace('cat_', '')}_${serviceCounter}`,
    categoryId,
    name,
    description,
    originalProviderCost: costEGP,
    pricePer1000: sellingPrice,
    minQuantity: minQty,
    maxQuantity: maxQty,
    providerServiceId: `${serviceCounter}`,
    speed,
    type,
    active: true,
    isAvailable,
    isOffer: true, // Display attractive offer badge
    originalPriceBeforeDiscount: fakeAnchor,
    discountPercent,
  };
}

// Helper to create services directly from base cost in EGP with exact margin (+35% for all social) & fake discount anchor
function createServiceEGP(
  categoryId: string,
  name: string,
  description: string,
  costEGP: number,
  minQty: number,
  maxQty: number,
  speed: string,
  type: 'default' | 'custom_comments' | 'package' = 'default',
  isOffer: boolean = false,
  isAvailable: boolean = true
): Service {
  serviceCounter++;
  const baseCost = Math.round(costEGP * 100) / 100;
  const marginMultiplier = 1.35; // Exact +35% for all social services (xfollowr.com API)
  const sellingPrice = Math.round(baseCost * marginMultiplier * 100) / 100;
  
  // Attractive fake discount anchor
  const { anchor: fakeAnchor, discountPercent } = computeFakeAnchor(sellingPrice, isOffer);

  return {
    id: `srv_${categoryId.replace('cat_', '')}_${serviceCounter}`,
    categoryId,
    name,
    description,
    originalProviderCost: baseCost,
    pricePer1000: sellingPrice,
    minQuantity: minQty,
    maxQuantity: maxQty,
    providerServiceId: `${serviceCounter}`,
    speed,
    type,
    active: true,
    isAvailable,
    isOffer: true,
    originalPriceBeforeDiscount: fakeAnchor,
    discountPercent,
  };
}

// Helper to create game package with exact +5% margin & attractive fake discount anchor
function createGamePackage(
  categoryId: string,
  id: string,
  name: string,
  description: string,
  costEGP: number,
  speed: string = 'فوري خلال 1-5 دقائق',
  isOffer: boolean = false,
  isAvailable: boolean = true
): Service {
  serviceCounter++;
  const priceEGP = Math.round(costEGP * 1.05 * 100) / 100; // Exact +5% profit margin (Carry st shop API)
  
  // Fake Offer Strategy: Sell price stays at full +5% margin, anchor price is attractive
  const multiplier = isOffer ? 1.45 : 1.35;
  let rawAnchor = priceEGP * multiplier;
  if (priceEGP >= 50) {
    rawAnchor = Math.ceil(rawAnchor / 5) * 5;
  } else {
    rawAnchor = Math.ceil(rawAnchor);
  }
  const fakeAnchor = Math.round(Math.max(rawAnchor, priceEGP + 5) * 100) / 100;
  const discountPercent = Math.round(((fakeAnchor - priceEGP) / fakeAnchor) * 100);

  return {
    id,
    categoryId,
    name,
    description,
    originalProviderCost: costEGP,
    pricePer1000: priceEGP,
    minQuantity: 1,
    maxQuantity: 1,
    providerServiceId: `gm_${id}`,
    speed,
    type: 'package',
    active: true,
    isAvailable,
    isOffer: true,
    originalPriceBeforeDiscount: fakeAnchor,
    discountPercent,
  };
}

export function generateAllServices(): Service[] {
  const list: Service[] = [];

  // ==========================================
  // 0. GAMING PACKAGES (+7% PROFIT MARGIN ONLY)
  // ==========================================
  // PUBG Mobile Packages
  list.push(
    createGamePackage(
      'cat_pubg',
      'serv_pubg_60uc',
      'ببجي موبايل | شحن 60 شدة (60 UC) فوري بالأيدي ID',
      'شحن شدات ببجي 60 UC فوري ومباشر في حسابك عبر معرّف اللاعب Player ID بدون كلمة سر.',
      55
    ),
    createGamePackage(
      'cat_pubg',
      'serv_pubg_325uc',
      'ببجي موبايل | شحن 325 شدة (300 + 25 مجاناً) فوري بالأيدي ID',
      'شحن شدات ببجي 325 UC فوري في حسابك عبر الأيدي ID بسرعة فائقة.',
      275
    ),
    createGamePackage(
      'cat_pubg',
      'serv_pubg_660uc',
      'ببجي موبايل | شحن 660 شدة (600 + 60 مجاناً) فوري بالأيدي ID',
      'شحن 660 شدة تكفي لفتح الرويال باس فورياً عبر معرّف اللاعب.',
      550
    ),
    createGamePackage(
      'cat_pubg',
      'serv_pubg_1800uc',
      'ببجي موبايل | شحن 1800 شدة (1500 + 300 مجاناً) VIP',
      'باقة الشدات المتوسطة لفتح صناديق الحظ وتطوير الأسلحة فوراً.',
      1400
    ),
    createGamePackage(
      'cat_pubg',
      'serv_pubg_3850uc',
      'ببجي موبايل | شحن 3850 شدة (3000 + 850 مجاناً) سوبر',
      'باقة شدات ضخمة مع بونص إضافي رسمي للشحن بالآيدي ID.',
      2900
    ),
    createGamePackage(
      'cat_pubg',
      'serv_pubg_rp_pass',
      'ببجي موبايل | بطاقة رويال باس Royal Pass الشهرية',
      'تفعيل الرويال باس المطور مباشرة عبر معرّف حسابك.',
      550
    ),
    createGamePackage(
      'cat_pubg',
      'serv_pubg_elite_plus',
      'ببجي موبايل | بطاقة رويال باس بلس Elite Pass Plus',
      'تفعيل الرويال باس بلس مع فتح 12 رتبة فورية وجوائز حصرية.',
      1400
    ),
    createGamePackage(
      'cat_pubg',
      'serv_pubg_special_bundle_soldout',
      'ببجي موبايل | باقة التحدي الكبرى 12,000 شدة (غير متوفرة مؤقتاً)',
      'هذه الباقة غير متوفرة حالياً ومينفعش طلبها في الوقت الحالي لحين توفرها مجدداً.',
      8800,
      'غير متوفر حالياً',
      false,
      false // isAvailable = false
    )
  );

  // Free Fire Packages
  list.push(
    createGamePackage(
      'cat_freefire',
      'serv_ff_110dia',
      'فري فاير | شحن 100 + 10 جواهر مجانية Diamonds بالـ ID',
      'شحن جواهر فري فاير فورياً بحسابك الرسمي عبر الأيدي ID دون انتظار.',
      50
    ),
    createGamePackage(
      'cat_freefire',
      'serv_ff_231dia',
      'فري فاير | شحن 210 + 21 جوهرة مجاناً Diamonds بالـ ID',
      'شحن جواهر فري فاير مع بونص إضافي فوري.',
      100
    ),
    createGamePackage(
      'cat_freefire',
      'serv_ff_583dia',
      'فري فاير | شحن 530 + 53 جوهرة Diamonds سوبر بالـ ID',
      'باقة الجواهر الشعبية لفتح العجلة وسكنات الأسلحة.',
      250
    ),
    createGamePackage(
      'cat_freefire',
      'serv_ff_1188dia',
      'فري فاير | شحن 1080 + 108 جوهرة Diamonds بالـ ID',
      'باقة الجواهر الكبرى مع بونص 10% إضافي رسمي.',
      500
    ),
    createGamePackage(
      'cat_freefire',
      'serv_ff_weekly',
      'فري فاير | العضوية الأسبوعية Weekly Membership',
      'عضوية أسبوعية تمنحك جواهر يومية بأسعار مخفضة جداً.',
      110
    ),
    createGamePackage(
      'cat_freefire',
      'serv_ff_monthly',
      'فري فاير | العضوية الشهرية Monthly Membership VIP',
      'عضوية شهرية متميزة تشمل شارات وجواهر يومية وبطاقات حصرية.',
      450
    ),
    createGamePackage(
      'cat_freefire',
      'serv_ff_levelpass',
      'فري فاير | تصريح المستوى Level Up Pass',
      'تصريح المستوى الرسمي الذي يمنحك أكثر من 1000 جوهرة تدريجياً.',
      90
    ),
    createGamePackage(
      'cat_freefire',
      'serv_ff_50dia',
      'فري فاير | شحن 50 جوهرة Diamonds فوري بالأيدي ID',
      'شحن باقة 50 جوهرة فري فاير فورية لتفعيل السكنات والشحن اليومي.',
      25
    ),
    createGamePackage(
      'cat_freefire',
      'serv_ff_2420dia',
      'فري فاير | شحن 2420 جوهرة (2200 + 220 مجاناً) Diamonds VIP',
      'باقة النخبة الكبرى مع بونص إضافي 220 جوهرة مجانية بضمان رسمي عبر منصة KOUMND.',
      950
    ),
    createGamePackage(
      'cat_freefire',
      'serv_ff_6050dia',
      'فري فاير | باقة الأساطير الكبرى 6,050 جوهرة (5500 + 550 مجاناً)',
      'أضخم باقة جواهر فري فاير رسمية عبر معرّف اللاعب Player ID بأسرع تسليم.',
      2350
    )
  );

  // FIFA Mobile FC Packages
  list.push(
    createGamePackage(
      'cat_fifa',
      'serv_fifa_100p',
      'فيفا موبايل | 100 نقطة FC Points بالمعرف UID',
      'شحن نقاط FC Mobile فورية ورسمية لتفتيح بكجات اللاعبين.',
      50
    ),
    createGamePackage(
      'cat_fifa',
      'serv_fifa_500p',
      'فيفا موبايل | 500 نقطة FC Points بالمعرف UID',
      'شحن نقاط فيفا FC سريعة بالأيدي الخاص بحسابك.',
      220
    ),
    createGamePackage(
      'cat_fifa',
      'serv_fifa_1050p',
      'فيفا موبايل | 1050 نقطة FC Points بالمعرف UID',
      'باقة النقاط المفضلة لشراء عروض الأحداث الأسبوعية.',
      450
    ),
    createGamePackage(
      'cat_fifa',
      'serv_fifa_2200p',
      'فيفا موبايل | 2200 نقطة FC Points سوبر بالـ UID',
      'باقة ضخمة لفتح بكجات نجوم الموسم وتطوير التشكيلة.',
      900
    ),
    createGamePackage(
      'cat_fifa',
      'serv_fifa_5750p',
      'فيفا موبايل | 5750 نقطة FC Points VIP الكبرى',
      'أكبر باقة نقاط FC رسمية مع بونص كامل فوري.',
      2250
    ),
    createGamePackage(
      'cat_fifa',
      'serv_fifa_starpass',
      'فيفا موبايل | تصريح النجم Star Pass المميز',
      'تفعيل تصريح النجم للحصول على بطاقات اللاعبين الأساطير وجوائز الحدث.',
      500
    )
  );

  // Yalla Ludo Packages
  list.push(
    createGamePackage(
      'cat_ludo',
      'serv_ludo_250d',
      'يلا لودو | شحن 250 ماسة Diamonds بالـ ID',
      'شحن ماس يلا لودو فوري ومباشر في حسابك عبر معرّف اللاعب.',
      40
    ),
    createGamePackage(
      'cat_ludo',
      'serv_ludo_650d',
      'يلا لودو | شحن 650 ماسة Diamonds بالـ ID',
      'شحن ماس سريع للعبة يلا لودو ولودو كلوب.',
      90
    ),
    createGamePackage(
      'cat_ludo',
      'serv_ludo_1350d',
      'يلا لودو | شحن 1350 ماسة Diamonds بالـ ID',
      'باقة الماس المفضلة للدخول في غرف اللعب الكبيرة.',
      180
    ),
    createGamePackage(
      'cat_ludo',
      'serv_ludo_3400d',
      'يلا لودو | شحن 3400 ماسة Diamonds بالـ ID',
      'باقة ماس ضخمة بالآيدي الرسمي فوري.',
      450
    ),
    createGamePackage(
      'cat_ludo',
      'serv_ludo_7000d',
      'يلا لودو | شحن 7000 ماسة Diamonds VIP الكبرى',
      'أكبر باقة ماس لشراء النرد المميز وإرسال الهدايا.',
      900
    ),
    createGamePackage(
      'cat_ludo',
      'serv_ludo_2m_coins',
      'يلا لودو | شحن 2 مليون كوينز ذهب 2,000,000 Gold',
      'ذهب لودو فوري للعب وتحدي اللاعبين بدون انقطاع.',
      60
    ),
    createGamePackage(
      'cat_ludo',
      'serv_ludo_10m_coins',
      'يلا لودو | شحن 10 مليون كوينز ذهب 10,000,000 Gold',
      'ذهب وفير لغرف اللعب عالية الرهان.',
      250
    ),
    createGamePackage(
      'cat_ludo',
      'serv_ludo_knight',
      'يلا لودو | باقة الفارس Knight Pack المميزة',
      'باقة الفارس الحصرية مع شارة ونرد ماسي.',
      220
    ),
    createGamePackage(
      'cat_ludo',
      'serv_ludo_vip',
      'يلا لودو | اشتراك عضوية VIP 30 يوماً',
      'عضوية VIP شهرية تشمل ميزات الروم ودخول الغرف الخاصة.',
      400
    )
  );

  // ==========================================
  // 1. TIKTOK SERVICES (~80 Services + Account Sales)
  // ==========================================

  // ==========================================
  // 1. DEDICATED TIKTOK READY ACCOUNTS (قسم حسابات تيك توك الجاهزة)
  // ==========================================
  list.push(
    {
      id: 'serv_acc_ready_tt_6k',
      categoryId: 'cat_tiktok',
      name: 'حساب تيك توك 6,000 متابع حقيقي 100% بدون أي تزويد (مؤهل للبث المباشر)',
      description: 'متوفر حساب تيك توك مميز ونشط يضم 6,000 متابع حقيقي بدون أي تزويد وهمي 100%، مؤهل لفتح استوديو البث المباشر (Live Studio) وهدايا اللايف مع تسليم فوري وتغيير كامل للبريد الإلكتروني ورقم الهاتف بضمان رسمي من KOUMND.',
      pricePer1000: 650, // 650 EGP as requested
      originalProviderCost: 500,
      originalPriceBeforeDiscount: 850, // Fake anchor 850 EGP as requested (بدل 850 ج)
      discountPercent: 24,
      minQuantity: 1,
      maxQuantity: 1,
      providerServiceId: 'acc_ready_tt_6k',
      speed: 'تسليم فوري ومباشر مع البريد الأصلي',
      type: 'package',
      active: true,
      isOffer: true,
      isAccountSale: true,
    },
    {
      id: 'serv_acc_ready_tt_14k',
      categoryId: 'cat_tiktok',
      name: 'حساب تيك توك 14,000 متابع + 2 مليون مشاهدة (حقيقي 100% بدون أي تزويد)',
      description: 'متوفر حساب تيك توك مميز ونشط جداً يضم 14K متابع حقيقي وأكثر من 2 مليون مشاهدة خلال آخر 28 يوم، جاهز لتحقيق الأرباح ودخول برامج المبدعين بدون أي تزويد وهمي 100%. يتم تسليم بيانات الحساب فورياً بنقل البريد الإلكتروني الرسمي.',
      pricePer1000: 800, // Fixed price 800 EGP as requested
      originalProviderCost: 615,
      originalPriceBeforeDiscount: 1300,
      discountPercent: 38,
      minQuantity: 1,
      maxQuantity: 1,
      providerServiceId: 'acc_ready_tt_14k',
      speed: 'تسليم فوري ومباشر مع البريد الأصلي',
      type: 'package',
      active: true,
      isOffer: true,
      isAccountSale: true,
    },
    {
      id: 'serv_acc_ready_tt_14_5k',
      categoryId: 'cat_tiktok',
      name: 'حساب تيك توك 14,500 متابع حقيقي 100% بدون أي تزويد (تفاعل عالي + مؤهل للربح)',
      description: 'متوفر حساب تيك توك موثق ونشط يضم 14,500 متابع حقيقي وتفاعل عالي بدون أي تزويد، مؤهل بالكامل لبرنامج دعم المبدعين وصندوق المشاهدات وسحب الأرباح، تسليم فوري مع نقل البريد الأصلي والربط المباشر بضمان KOUMND.',
      pricePer1000: 900, // 900 EGP as requested
      originalProviderCost: 692,
      originalPriceBeforeDiscount: 1500, // Fake anchor 1500 EGP as requested (بدل 1500 ج)
      discountPercent: 40,
      minQuantity: 1,
      maxQuantity: 1,
      providerServiceId: 'acc_ready_tt_14_5k',
      speed: 'تسليم فوري ومباشر مع البريد الأصلي',
      type: 'package',
      active: true,
      isOffer: true,
      isAccountSale: true,
    },
    {
      id: 'serv_acc_ready_tt_50k_soldout',
      categoryId: 'cat_tiktok',
      name: 'حساب تيك توك 50,000 متابع حقيقي موثق (تم البيع - غير متوفر حالياً)',
      description: 'هذا الحساب تم بيعه لأحد عملائنا الكرام، وهو غير متوفر حالياً في المخزون ومينفعش يطلب.',
      pricePer1000: 2350,
      originalProviderCost: 1800,
      originalPriceBeforeDiscount: 3400,
      discountPercent: 30,
      minQuantity: 1,
      maxQuantity: 1,
      providerServiceId: 'acc_ready_tt_50k_sold',
      speed: 'غير متوفر حالياً',
      type: 'package',
      active: true,
      isAvailable: false,
      isOffer: false,
      isAccountSale: true,
    },
    {
      id: 'serv_acc_ready_tt_64k',
      categoryId: 'cat_tiktok',
      name: 'حساب تيك توك 64,000 متابع حقيقي 100% بدون أي تزويد (مؤهل للربح والبث)',
      description: 'متوفر حساب تيك توك ضخم وموثوق به 64,000 متابع حقيقي ومتفاعل بدون أي برامج تزويد، جاهز لفتح كافة المزايا والبث المباشر وصندوق دعم صناع المحتوى مع تسليم فوري لبيانات الحساب وتغيير البريد والرقم.',
      pricePer1000: 2900, // Fixed price 2,900 EGP as requested
      originalProviderCost: 2230,
      originalPriceBeforeDiscount: 4200,
      discountPercent: 31,
      minQuantity: 1,
      maxQuantity: 1,
      providerServiceId: 'acc_ready_tt_64k',
      speed: 'تسليم فوري ومباشر مع البريد الأصلي',
      type: 'package',
      active: true,
      isOffer: true,
      isAccountSale: true,
    }
  );


  const ttFollowerGuarantees = [
    { title: 'بدون ضمان سرعة خارقة', cost: 1.20, speed: '10K/يوم', isOffer: true },
    { title: 'ضمان 30 يوم تعويض تلقائي', cost: 1.80, speed: '5K/يوم' },
    { title: 'ضمان 60 يوم (فتح لايف 1K)', cost: 2.00, speed: '10K/يوم', isOffer: true },
    { title: 'ضمان 90 يوم حسابات نشطة', cost: 2.40, speed: '15K/يوم' },
    { title: 'ضمان 365 يوم VIP بدون هبوط', cost: 3.20, speed: '20K/يوم', isOffer: true },
    { title: 'متابعين عرب حقيقيين 100%', cost: 4.50, speed: '3K/يوم' },
    { title: 'متابعين خليجيين مستهدفين', cost: 6.00, speed: '2K/يوم' },
    { title: 'متابعين مصريين نشطين بالبث', cost: 3.80, speed: '4K/يوم', isOffer: true },
    { title: 'متابعين عراقيين وشام', cost: 3.50, speed: '5K/يوم' },
    { title: 'متابعين أجانب ذوو جودة HQ', cost: 1.50, speed: '30K/يوم' },
    { title: 'متابعين حقيقيين متفاعلين مع المنشورات', cost: 5.00, speed: '2K/يوم' },
    { title: 'متابعين دعم صندوق المبدعين Creator Fund', cost: 4.20, speed: '10K/يوم' },
  ];

  ttFollowerGuarantees.forEach((f, idx) => {
    list.push(
      createService(
        'cat_tiktok',
        `متابعين تيك توك | ${f.title}`,
        `خدمة متابعين تيك توك فائقة الأمان لحسابك، لا تتطلب كلمة سر. ${f.title}. سرعة تنفيذ ${f.speed}.`,
        f.cost,
        100,
        50000,
        f.speed,
        'default',
        Boolean((f as any).isOffer)
      )
    );
  });

  // TikTok Views (15 variants)
  const ttViewVariants = [
    { name: 'مشاهدات فورية للإكسبلور 🚀 سرعة فائقة', cost: 0.04, min: 1000, max: 10000000, speed: '1M/يوم' },
    { name: 'مشاهدات تيك توك مع ظهور بالبحث Search', cost: 0.08, min: 1000, max: 5000000, speed: '500K/يوم' },
    { name: 'مشاهدات تيك توك عربية عالية التفاعل', cost: 0.25, min: 500, max: 1000000, speed: '200K/يوم' },
    { name: 'مشاهدات تيك توك خليجية حقيقية', cost: 0.40, min: 500, max: 500000, speed: '100K/يوم' },
    { name: 'مشاهدات تيك توك مع مدة مشاهدة كاملة Watch Time', cost: 0.20, min: 500, max: 2000000, speed: '300K/يوم' },
    { name: 'مشاهدات تيك توك بطيئة وطبيعية (Drip-feed)', cost: 0.10, min: 1000, max: 1000000, speed: '50K/يوم' },
    { name: 'مشاهدات تيك توك مليونية فورية في دقائق', cost: 0.05, min: 5000, max: 20000000, speed: '5M/يوم' },
    { name: 'مشاهدات ريلز تيك توك مع حفظ وتفضيل', cost: 0.15, min: 1000, max: 1000000, speed: '500K/يوم' },
  ];
  ttViewVariants.forEach((v, idx) => {
    list.push(
      createService(
        'cat_tiktok',
        v.name,
        `مشاهدات حقيقية بدون حظر. تعزز من رواج الفيديو لدى خوارزميات تيك توك لدخول قائمة For You.`,
        v.cost,
        v.min,
        v.max,
        v.speed
      )
    );
  });

  // TikTok Likes (Top 3 Ultra-Cheap Offers + Standard Variants)
  const ttLikes = [
    { name: 'لايكات تيك توك اقتصادية سريعة [باقة مخفضة رقم 1]', costEGP: 21.50, min: 50, max: 100000, speed: 'فوري (خلال 30 ثانية)', isOffer: true },
    { name: 'لايكات تيك توك فورية بضمان تعويض تلقائي [باقة VIP السريعة]', costEGP: 25.00, min: 50, max: 50000, speed: 'فوري - سرعة 15K/يوم', isOffer: true },
    { name: 'لايكات تيك توك حقيقية مكس عالمي استقرار عالي [باقة تريند إكسبلور]', costEGP: 28.50, min: 50, max: 50000, speed: '10K/يوم بدون نقص', isOffer: true },
    { name: 'لايكات تيك توك فورية بدون نقص', costEGP: 32.00, min: 50, max: 50000, speed: '10K/يوم', isOffer: false },
    { name: 'لايكات تيك توك ضمان 30 يوم تعويض تلقائي', costEGP: 36.00, min: 50, max: 50000, speed: '5K/يوم', isOffer: false },
    { name: 'لايكات تيك توك ضمان 90 يوم VIP حسابات نشطة', costEGP: 42.00, min: 50, max: 30000, speed: '8K/يوم', isOffer: false },
    { name: 'لايكات تيك توك عربية حقيقية متفاعلة', costEGP: 55.00, min: 20, max: 10000, speed: '2K/يوم', isOffer: false },
    { name: 'لايكات تيك توك خليجية ممتازة', costEGP: 70.00, min: 20, max: 10000, speed: '1K/يوم', isOffer: false },
    { name: 'لايكات تعليقات تيك توك Comment Likes', costEGP: 32.00, min: 25, max: 15000, speed: '5K/يوم', isOffer: false },
    { name: 'لايكات تيك توك فائقة السرعة للصعود للإكسبلور والتريند', costEGP: 29.00, min: 50, max: 50000, speed: '25K/يوم', isOffer: true },
    { name: 'لايكات تيك توك حسابات موثوقة ذات صور شخصية', costEGP: 48.00, min: 50, max: 20000, speed: '10K/يوم', isOffer: false },
  ];
  ttLikes.forEach((l, idx) => {
    list.push(
      createServiceEGP(
        'cat_tiktok',
        `لايكات تيك توك | ${l.name} (#${idx + 1})`,
        `إعجابات عالية الجودة من حسابات متفاعلة تزيد من جاذبية مقطعك ومعدل انتشاره لدى خوارزمية تيك توك.`,
        l.costEGP,
        l.min || 50,
        l.max || 50000,
        l.speed,
        'default',
        l.isOffer
      )
    );
  });

  // TikTok Shares, Saves, Live Stream & Comments (25+ variants)
  const ttOther = [
    { name: 'مشاركات تيك توك Shares قوية لدخول الإكسبلور', cost: 0.20, speed: '50K/يوم' },
    { name: 'حفظ تيك توك في المفضلة Favorites/Saves', cost: 0.25, speed: '30K/يوم' },
    { name: 'مشاهدين بث مباشر تيك توك (مدة 15 دقيقة)', cost: 1.50, speed: 'فوري' },
    { name: 'مشاهدين بث مباشر تيك توك (مدة 30 دقيقة)', cost: 2.80, speed: 'فوري' },
    { name: 'مشاهدين بث مباشر تيك توك (مدة 60 دقيقة كاملة)', cost: 4.80, speed: 'فوري' },
    { name: 'مشاهدين بث مباشر تيك توك (مدة 120 دقيقة VIP)', cost: 8.50, speed: 'فوري' },
    { name: 'لايكات وتكبيس بث مباشر تيك توك (Tap Tap)', cost: 0.30, speed: '100K/ساعة' },
    { name: 'تعليقات تيك توك عربية إيجابية جاهزة', cost: 3.00, speed: '1K/يوم' },
    { name: 'تعليقات تيك توك مخصصة حسب رغبتك Custom Comments', cost: 4.50, speed: '500/يوم', type: 'custom_comments' as const },
    { name: 'تعليقات إيموجي تيك توك Emoji Comments', cost: 2.00, speed: '2K/يوم' },
    { name: 'مشاركات تيك توك عبر واتساب وتليجرام (Organic Share)', cost: 0.50, speed: '10K/يوم' },
  ];
  ttOther.forEach((o, idx) => {
    list.push(
      createService(
        'cat_tiktok',
        `${o.name} [خادم #${idx + 1}]`,
        `خدمة حصرية للبث والتفاعل على تيك توك مع استقرار وثبات وسرعة إرسال.`,
        o.cost,
        o.cost > 3 ? 10 : 100,
        100000,
        o.speed,
        o.type || 'default'
      )
    );
  });

  // Generate additional fine-grained tier packages to reach 85+ TikTok services
  for (let i = 1; i <= 45; i++) {
    const types = ['متابعين سرعة فائقة', 'لايكات فورية رخيصة', 'مشاهدات إكسبلور بلس', 'مشاركات متعددة'];
    const chosenType = types[i % types.length];
    list.push(
      createService(
        'cat_tiktok',
        `تيك توك | ${chosenType} - باقة التوفير الاقتصادية (#${i + 40})`,
        `خدمة سريعة واقتصادية مخصصة للكميات الكبيرة والتسويق الرقمي بضمان كامل وبدون نقص.`,
        0.5 + (i * 0.05),
        100,
        100000,
        'فوري - خلال دقائق'
      )
    );
  }

  // ==========================================
  // 2. INSTAGRAM SERVICES (~85 Services)
  // ==========================================
  const igFollowers = [
    { title: 'ضمان 30 يوم استعادة فورية', cost: 1.10, speed: '10K/يوم' },
    { title: 'ضمان 60 يوم عالي الجودة HQ', cost: 1.40, speed: '15K/يوم' },
    { title: 'ضمان 90 يوم بدون هبوط قطرة', cost: 1.70, speed: '20K/يوم' },
    { title: 'ضمان 365 يوم VIP لمدة عام كامل', cost: 2.20, speed: '25K/يوم' },
    { title: 'متابعين إنستغرام عرب 100% متفاعلين', cost: 4.00, speed: '3K/يوم' },
    { title: 'متابعين إنستغرام خليجيين حقيقيين', cost: 5.50, speed: '2K/يوم' },
    { title: 'متابعين إنستغرام مصريين نشطين', cost: 3.50, speed: '4K/يوم' },
    { title: 'متابعين إنستغرام أجانب ذوو بروفايلات مكتملة', cost: 1.30, speed: '30K/يوم' },
    { title: 'متابعين إنستغرام من حسابات موثقة بالعلامة الزرقاء (Notch)', cost: 25.00, speed: '50/يوم' },
    { title: 'متابعين حسابات قديمة +5 سنوات Aged Accounts', cost: 3.20, speed: '5K/يوم' },
  ];
  igFollowers.forEach((f, idx) => {
    list.push(
      createService(
        'cat_instagram',
        `متابعين إنستغرام | ${f.title} (#${idx + 1})`,
        `متابعين ذوو مظهر حقيقي (صور شخصية، ستوريز وبوستات). آمن على الحساب وبدء فوري. ${f.title}.`,
        f.cost,
        100,
        100000,
        f.speed
      )
    );
  });

  // Instagram Likes & Views
  const igLikesViews = [
    { name: 'لايكات إنستغرام ريلز وبوست فورية رخيصة', cost: 0.30, speed: '20K/يوم' },
    { name: 'لايكات إنستغرام حقيقية مع ظهور بالإكسبلور', cost: 0.60, speed: '10K/يوم' },
    { name: 'لايكات إنستغرام عربية 100% من السعودية ومصر', cost: 1.80, speed: '3K/يوم' },
    { name: 'مشاهدات ريلز إنستغرام فائقة السرعة 🚀', cost: 0.05, speed: '2M/يوم' },
    { name: 'مشاهدات ستوري إنستغرام جميع الستوريات النشطة', cost: 0.20, speed: '50K/يوم' },
    { name: 'مشاهدات بث مباشر إنستغرام (30 دقيقة)', cost: 3.00, speed: 'فوري' },
    { name: 'مشاهدات بث مباشر إنستغرام (60 دقيقة)', cost: 5.50, speed: 'فوري' },
    { name: 'حفظ المنشورات والمشاركات Saves & Shares', cost: 0.25, speed: '50K/يوم' },
    { name: 'تصويت ستوري استطلاعات Poll Votes', cost: 0.40, speed: '10K/يوم' },
    { name: 'انطباعات ووصول المنشور Impressions & Reach', cost: 0.15, speed: '100K/يوم' },
  ];
  igLikesViews.forEach((l, idx) => {
    list.push(
      createService(
        'cat_instagram',
        l.name,
        `خدمة معتمدة لتحسين خوارزمية إنستغرام وتوصيل المنشور لأكبر عدد من الجمهور المستهدف.`,
        l.cost,
        50,
        500000,
        l.speed
      )
    );
  });

  // Additional 50 Instagram Services
  for (let i = 1; i <= 65; i++) {
    const varieties = [
      'متابعين بدون هبوط باقة التميز',
      'لايكات حقيقية بدون نقص ضمان 60 يوم',
      'مشاهدات ريلز فورية ترند',
      'تفاعل شامل ريلز (لايك + شير + حفظ)',
      'تعليقات عربية إيجابية موجهة',
    ];
    const item = varieties[i % varieties.length];
    list.push(
      createService(
        'cat_instagram',
        `إنستغرام | ${item} (#${i + 30})`,
        `خدمة عالية الثبات والكفاءة لنمو حساب إنستغرام الخاص بك بسرعة وأمان 100%.`,
        0.4 + (i * 0.04),
        50,
        100000,
        'فوري - سرعة عالية'
      )
    );
  }

  // ==========================================
  // 3. FACEBOOK SERVICES (~85 Services)
  // ==========================================
  const fbFollowers = [
    { title: 'متابعين صفحات فيسبوك (Page Likes & Followers)', cost: 1.50, speed: '5K/يوم' },
    { title: 'متابعين بروفايل فيسبوك شخصي أو احترافي', cost: 1.60, speed: '5K/يوم' },
    { title: 'متابعين فيسبوك عرب وحسابات مصرية وخليجية', cost: 3.20, speed: '2K/يوم' },
    { title: 'أعضاء مجموعات فيسبوك عامة وخاصة (Groups)', cost: 1.80, speed: '3K/يوم' },
    { title: 'مشاهدات فيديو وريلز فيسبوك 100K في ساعات', cost: 0.10, speed: '500K/يوم' },
    { title: 'ساعات مشاهدة 60 ألف دقيقة لتحقيق ربح صفحات فيسبوك', cost: 12.00, speed: 'خلال 24 ساعة' },
    { title: 'تفاعلات فيسبوك (Love ❤️) للمنشورات', cost: 0.50, speed: '10K/يوم' },
    { title: 'تفاعلات فيسبوك (Care 🥰 / Haha 😂 / Wow 😮)', cost: 0.55, speed: '10K/يوم' },
    { title: 'مشاركات بوستات فيسبوك في مجموعات كبرى Shares', cost: 2.00, speed: '5K/يوم' },
    { title: 'تقييمات 5 نجوم لصفحات فيسبوك 5 Star Reviews', cost: 8.00, speed: '200/يوم' },
  ];
  fbFollowers.forEach((f, idx) => {
    list.push(
      createService(
        'cat_facebook',
        `فيسبوك | ${f.title} (#${idx + 1})`,
        `خدمة معتمدة لزيادة شعبية صفحات ومجموعات فيسبوك بدون حظر وبنتائج مؤكدة وسريعة.`,
        f.cost,
        50,
        100000,
        f.speed
      )
    );
  });

  for (let i = 1; i <= 75; i++) {
    const fbItems = [
      'متابعين بيجات فيسبوك بدون نقص ضمان 90 يوم',
      'لايكات ريلز فيسبوك فورية سرعة صاروخية',
      'مشاهدات فيديوهات فيسبوك كاملة مع Watch Time',
      'أعضاء جروبات فيسبوك حقيقيين نشطين',
      'تفاعلات لايك منشورات من بروفايلات قديمة',
    ];
    list.push(
      createService(
        'cat_facebook',
        `فيسبوك | ${fbItems[i % fbItems.length]} (#${i + 15})`,
        `حلول نمو فيسبوك الشاملة المعتمدة لدى الوكالات الرقمية والمسوقين المحترفين.`,
        0.35 + (i * 0.05),
        100,
        50000,
        'فوري'
      )
    );
  }

  // ==========================================
  // 4. YOUTUBE SERVICES (~75 Services)
  // ==========================================
  const ytBases = [
    { title: 'مشتركين يوتيوب حقيقيين ضمان مدى الحياة Lifetime', cost: 14.00, speed: '500-1K/يوم' },
    { title: 'مشتركين يوتيوب سرعة عالية ضمان 365 يوم', cost: 9.50, speed: '1K/يوم' },
    { title: 'مشتركين يوتيوب عرب وخليجيين بدون نقص', cost: 22.00, speed: '300/يوم' },
    { title: 'ساعات مشاهدة 4000 ساعة لتحقيق الدخل والربح Monetization', cost: 24.00, speed: '3-5 أيام' },
    { title: 'مشاهدات يوتيوب حقيقية من اقتراحات الفيديو Suggested', cost: 1.20, speed: '50K/يوم' },
    { title: 'مشاهدات يوتيوب تدعم أرباح جوجل أدسنس AdSense Safe', cost: 1.80, speed: '20K/يوم' },
    { title: 'مشاهدات يوتيوب شورتس (Shorts) فائقة السرعة', cost: 0.25, speed: '200K/يوم' },
    { title: 'لايكات يوتيوب فورية لا تسقط أبداً', cost: 0.80, speed: '10K/يوم' },
    { title: 'مشاهدين بث مباشر يوتيوب (مدة 60 دقيقة)', cost: 6.00, speed: 'فوري' },
    { title: 'تعليقات يوتيوب مخصصة إيجابية حسب الطلب', cost: 8.00, speed: '500/يوم', type: 'custom_comments' as const },
  ];
  ytBases.forEach((y, idx) => {
    list.push(
      createService(
        'cat_youtube',
        `يوتيوب | ${y.title} (#${idx + 1})`,
        `خدمة آمنة 100% على قنوات اليوتيوب ومتوافقة مع أحدث إرشادات وسياسات YouTube.`,
        y.cost,
        y.cost > 5 ? 20 : 100,
        100000,
        y.speed,
        y.type || 'default'
      )
    );
  });

  for (let i = 1; i <= 60; i++) {
    const ytItems = [
      'مشاهدات يوتيوب من محركات البحث SEO Search',
      'مشاهدات شورتس يوتيوب ملايين فورية',
      'مشتركين بدون انخفاض باقة احترافية',
      'لايكات ومشاركات فيديوهات اليوتيوب',
      'ساعات مشاهدة باقات مجزأة (500 - 1000 ساعة)',
    ];
    list.push(
      createService(
        'cat_youtube',
        `يوتيوب | ${ytItems[i % ytItems.length]} (#${i + 15})`,
        `خدمات متخصصة لدعم نمو القنوات الجديدة وصناع المحتوى لتحقيق شروط تحقيق الدخل بسرعة.`,
        0.6 + (i * 0.12),
        50,
        50000,
        'سرعة طبيعية مستمرة'
      )
    );
  }

  // ==========================================
  // 5. TELEGRAM SERVICES (~70 Services)
  // ==========================================
  const tgBases = [
    { title: 'أعضاء قنوات تيليجرام بدون نقص ضمان مدى الحياة', cost: 0.80, speed: '20K/يوم' },
    { title: 'أعضاء قنوات تيليجرام عرب 100% نشطين', cost: 1.80, speed: '5K/يوم' },
    { title: 'أعضاء قنوات تيليجرام بريميوم Telegram Premium Members', cost: 4.50, speed: '2K/يوم' },
    { title: 'أعضاء مجموعات تيليجرام مع ميزة النقل والفلترة', cost: 1.50, speed: '10K/يوم' },
    { title: 'مشاهدات منشورات تيليجرام لآخر 10 منشورات', cost: 0.10, speed: '100K/يوم' },
    { title: 'مشاهدات منشورات تلقائية للمنشورات المستقبلية (Auto)', cost: 0.30, speed: 'تلقائي فوري' },
    { title: 'تفاعلات إيموجي على رسائل تيليجرام (👍 / ❤️ / 🔥 / 🚀)', cost: 0.15, speed: '50K/يوم' },
    { title: 'تصويت استطلاعات قنوات تيليجرام Poll Votes', cost: 0.25, speed: '20K/يوم' },
    { title: 'أعضاء قنوات تيليجرام صامتة ومستقرة للأعداد الكبيرة', cost: 0.60, speed: '50K/يوم' },
  ];
  tgBases.forEach((t, idx) => {
    list.push(
      createService(
        'cat_telegram',
        `تيليجرام | ${t.title} (#${idx + 1})`,
        `خدمات تيليجرام فورية بدون هبوط تدعم القنوات والمجموعات والبوتات باحترافية وسرعة.`,
        t.cost,
        50,
        200000,
        t.speed
      )
    );
  });

  for (let i = 1; i <= 55; i++) {
    const tgItems = [
      'أعضاء قنوات بدون نقص ضمان 60 يوم',
      'تفاعلات إيجابية وتصويتات سريعة للمنشورات',
      'مشاهدات للمنشور الفردي فورية في ثوانٍ',
      'أعضاء جروبات تيليجرام حقيقيين',
      'مشاهدات ريلز ورسائل تيليجرام مخصصة',
    ];
    list.push(
      createService(
        'cat_telegram',
        `تيليجرام | ${tgItems[i % tgItems.length]} (#${i + 15})`,
        `تزويد آمن لقنوات التداول والقنوات الإخبارية والمتاجر الرقمية بأعلى استقرار ممكن.`,
        0.12 + (i * 0.03),
        50,
        100000,
        'فوري'
      )
    );
  }

  // ==========================================
  // 6. TWITTER / X SERVICES (~65 Services)
  // ==========================================
  const twBases = [
    { title: 'متابعين إكس / تويتر حسابات نشطة ضمان 90 يوم', cost: 3.50, speed: '5K/يوم' },
    { title: 'متابعين إكس / تويتر عرب وخليجيين حقيقيين', cost: 7.00, speed: '2K/يوم' },
    { title: 'متابعين موثقين بالعلامة الزرقاء X Premium', cost: 35.00, speed: '50/يوم' },
    { title: 'ريتويت Retweets لتغريدات إكس فورية', cost: 1.20, speed: '10K/يوم' },
    { title: 'لايكات وإعجابات تغريدات إكس سريعة', cost: 0.90, speed: '15K/يوم' },
    { title: 'مشاهدات تغريدات إكس Tweet Impressions (ملايين)', cost: 0.04, speed: '5M/يوم' },
    { title: 'مشاهدات فيديو تغريدات إكس Video Views', cost: 0.15, speed: '1M/يوم' },
    { title: 'تصويت استطلاعات تويتر Poll Votes خيار محدد', cost: 0.80, speed: '20K/يوم' },
  ];
  twBases.forEach((tw, idx) => {
    list.push(
      createService(
        'cat_twitter',
        `إكس (تويتر) | ${tw.title} (#${idx + 1})`,
        `تعزيز ظهور التغريدات في خوارزمية For You لمنصة X ودعم صعود الهاشتاجات للتريند.`,
        tw.cost,
        50,
        100000,
        tw.speed
      )
    );
  });

  for (let i = 1; i <= 50; i++) {
    const twItems = [
      'متابعين إكس سرعة فائقة بدون نقص',
      'ريتويت ولايكات مجمعة للتغريدة',
      'مشاهدات تغريدات لدعم تحقيق شروط الربح من X Ads',
      'تفاعل تغريدات إكس حسابات قديمة',
    ];
    list.push(
      createService(
        'cat_twitter',
        `إكس (تويتر) | ${twItems[i % twItems.length]} (#${i + 12})`,
        `خدمات متطورة ومحمية ضد الحظر تناسب الحملات الإعلانية والتريندات في الخليج والعالم.`,
        0.4 + (i * 0.08),
        50,
        50000,
        'فوري'
      )
    );
  }

  // ==========================================
  // 7. SNAPCHAT SERVICES (~45 Services)
  // ==========================================
  const snapBases = [
    { title: 'متابعين سناب شات منصة أضواء Spotlight Followers', cost: 4.00, speed: '2K/يوم' },
    { title: 'متابعين سناب شات بروفايل عام Public Profile', cost: 4.50, speed: '3K/يوم' },
    { title: 'مشاهدات قصص وسنابات سناب شات Story Views', cost: 0.80, speed: '20K/يوم' },
    { title: 'مشاهدات منصة أضواء Spotlight سريعة', cost: 0.50, speed: '100K/يوم' },
    { title: 'مشاركات سناب وشير Shares لسناباتك', cost: 1.20, speed: '10K/يوم' },
  ];
  snapBases.forEach((s, idx) => {
    list.push(
      createService(
        'cat_snapchat',
        `سناب شات | ${s.title} (#${idx + 1})`,
        `زيادة انتشار حسابك وسناباتك في منصة الأضواء وتوثيق ملفك التعريفي على Snapchat.`,
        s.cost,
        50,
        50000,
        s.speed
      )
    );
  });

  for (let i = 1; i <= 35; i++) {
    list.push(
      createService(
        'cat_snapchat',
        `سناب شات | مشاهدات وتفاعل أضواء VIP (#${i + 8})`,
        `مشاهدات مستقرة لحسابات المشاهير وصناع المحتوى على سناب شات بسرعة واستقرار.`,
        0.5 + (i * 0.07),
        50,
        50000,
        'فوري'
      )
    );
  }

  // ==========================================
  // 8. THREADS SERVICES (~35 Services)
  // ==========================================
  const thrBases = [
    { title: 'متابعين ثريدز حقيقيين من حسابات إنستغرام متصلة', cost: 1.80, speed: '5K/يوم' },
    { title: 'لايكات ثريدز Threads Likes سريعة', cost: 0.60, speed: '10K/يوم' },
    { title: 'إعادة نشر Repost لبوستات ثريدز', cost: 1.00, speed: '5K/يوم' },
    { title: 'مشاركات ثريدز Shares وإرسال للمحادثات', cost: 0.80, speed: '10K/يوم' },
  ];
  thrBases.forEach((t, idx) => {
    list.push(
      createService(
        'cat_threads',
        `ثريدز | ${t.title} (#${idx + 1})`,
        `خدمات نمو تطبيق ثريدز التابع لإنستغرام لدعم وصول منشوراتك لآلاف المتابعين.`,
        t.cost,
        50,
        25000,
        t.speed
      )
    );
  });

  for (let i = 1; i <= 25; i++) {
    list.push(
      createService(
        'cat_threads',
        `ثريدز | باقة التفاعل الشامل (#${i + 6})`,
        `متابعين ولايكات سريعة تساعد منشوراتك على الصعود لقائمة المتداول على Threads.`,
        0.5 + (i * 0.06),
        50,
        25000,
        'فوري'
      )
    );
  }

  return list;
}
