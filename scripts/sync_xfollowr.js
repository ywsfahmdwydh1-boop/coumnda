import fs from 'node:fs';

async function syncXFollowrServices() {
  console.log('Fetching live services from https://xfollowr.com/services ...');
  const html = await fetch('https://xfollowr.com/services').then((r) => r.text());

  const catMap = new Map();
  const catRegex = /<tr class="services-list-category-title"[^>]*data-filter-table-category-id="([^"]+)"[\s\S]*?<h4>([\s\S]*?)<\/h4>/g;
  let cm;
  while ((cm = catRegex.exec(html)) !== null) {
    catMap.set(cm[1].trim(), cm[2].replace(/<[^>]+>/g, '').trim());
  }

  function resolveCategoryId(platformName, catName, serviceName) {
    const text = (platformName + ' ' + catName + ' ' + serviceName).toLowerCase();
    if (text.includes('tiktok') || text.includes('تيك توك') || text.includes('تيكتوك')) return 'cat_tiktok';
    if (text.includes('instagram') || text.includes('انستقرام') || text.includes('انستجرام') || text.includes('إنستغرام') || text.includes('انستا')) return 'cat_instagram';
    if (text.includes('facebook') || text.includes('فيسبوك') || text.includes('فيس بوك')) return 'cat_facebook';
    if (text.includes('telegram') || text.includes('تيليجرام') || text.includes('تيلجرام') || text.includes('تليجرام')) return 'cat_telegram';
    if (text.includes('youtube') || text.includes('يوتيوب')) return 'cat_youtube';
    if (text.includes('twitter') || text.includes('تويتر') || text.includes('إكس') || text.includes(' منصة x')) return 'cat_twitter';
    if (text.includes('snapchat') || text.includes('سناب شات') || text.includes('سناب')) return 'cat_snapchat';
    if (text.includes('whatsapp') || text.includes('واتساب') || text.includes('واتس')) return 'cat_whatsapp';
    if (text.includes('kwai') || text.includes('كواي') || text.includes('كواى')) return 'cat_kwai';
    if (text.includes('threads') || text.includes('ثريدز')) return 'cat_threads';
    if (text.includes('spotify') || text.includes('سبوتيفاي') || text.includes('سبوتيفاى')) return 'cat_spotify';
    if (text.includes('linkedin') || text.includes('لينكد إن') || text.includes('لينكد')) return 'cat_linkedin';
    if (text.includes('twitch') || text.includes('kick') || text.includes('تويتش') || text.includes('كيك') || text.includes('بيجو')) return 'cat_twitch_kick';
    if (text.includes('google') || text.includes('جوجل') || text.includes('خرائط') || text.includes('تقييم')) return 'cat_google_reviews';
    if (text.includes('gpt') || text.includes('canva') || text.includes('كانفا') || text.includes('vpn') || text.includes('gemini') || text.includes('اشتراك') || text.includes('كاب كات')) return 'cat_subscriptions';
    if (text.includes('ببج') || text.includes('pubg')) return 'cat_pubg';
    if (text.includes('فرى فاير') || text.includes('free fire')) return 'cat_freefire';
    if (text.includes('لودو') || text.includes('ludo') || text.includes('جواكر')) return 'cat_ludo';
    if (text.includes('فيفا') || text.includes('fifa')) return 'cat_fifa';

    if (platformName === 'Facebook') return 'cat_facebook';
    if (platformName === 'TikTok') return 'cat_tiktok';
    if (platformName === 'Instagram') return 'cat_instagram';
    if (platformName === 'Telegram') return 'cat_telegram';
    if (platformName === 'YouTube') return 'cat_youtube';
    if (platformName === 'Twitter') return 'cat_twitter';
    return 'cat_subscriptions';
  }

  const serviceRegex = /<tr data-filter-table-category-id="([^"]+)"[^>]*data-platform-name="([^"]*)"[\s\S]*?<td[^>]*data-filter-table-service-id="([^"]+)">[\s\S]*?<td[^>]*class="table-service"[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*data-label="السعر لكل 1000">([\s\S]*?)<\/td>[\s\S]*?<td[^>]*data-label="الحد الأدنى للطلب">([\s\S]*?)<\/td>[\s\S]*?<td[^>]*data-label="الحد الأقصى للطلب">([\s\S]*?)<\/td>([\s\S]*?)<\/tr>/g;

  let sm;
  const newServices = [];
  while ((sm = serviceRegex.exec(html)) !== null) {
    const categoryId = sm[1].trim();
    const platformName = sm[2].trim();
    const serviceId = sm[3].trim();
    const serviceName = sm[4].replace(/<[^>]+>/g, '').trim();
    const priceRaw = sm[5].replace(/<[^>]+>/g, '').replace(/\$/g, '').trim();
    const minQtyRaw = sm[6].replace(/<[^>]+>/g, '').trim();
    const maxQtyRaw = sm[7].replace(/<[^>]+>/g, '').trim();
    const rest = sm[8];
    const timeMatch = rest.match(/data-label="متوسط الوقت"[^>]*>([\s\S]*?)<\/td>/);
    const avgTime = timeMatch ? timeMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    const priceUsd = parseFloat(priceRaw) || 0;
    const minQty = parseInt(minQtyRaw.replace(/[^0-9]/g, ''), 10) || 1;
    const maxQty = parseInt(maxQtyRaw.replace(/[^0-9]/g, ''), 10) || 10000;
    const catName = catMap.get(categoryId) || 'خدمات عامة';
    const mappedCatId = resolveCategoryId(platformName, catName, serviceName);

    // Exchange rate: 1 USD = 50 EGP
    const rawCostEGP = priceUsd * 50;
    const costEGP = rawCostEGP > 0 ? Math.round(rawCostEGP * 100) / 100 : 0.50;
    // Exactly +30% profit margin as requested by user
    const sellingPrice = Math.round(costEGP * 1.30 * 100) / 100;

    // Check if offer
    const isOffer =
      serviceName.includes('VIP') ||
      serviceName.includes('الارخص') ||
      serviceName.includes('الأرخص') ||
      serviceName.includes('ضمان') ||
      serviceName.includes('سريع') ||
      serviceName.includes('حقيقي');
    let originalPriceBeforeDiscount = undefined;
    let discountPercent = undefined;
    if (isOffer) {
      originalPriceBeforeDiscount = Math.round(sellingPrice * 1.45 * 100) / 100;
      discountPercent = Math.round(
        ((originalPriceBeforeDiscount - sellingPrice) / originalPriceBeforeDiscount) * 100
      );
    }

    const type =
      minQty === 1 && maxQty === 1
        ? 'package'
        : serviceName.includes('مخصصة') || serviceName.includes('Custom')
        ? 'custom_comments'
        : 'default';

    newServices.push({
      id: 'srv_xf_' + serviceId,
      categoryId: mappedCatId,
      name: serviceName,
      description:
        'خدمة ' +
        serviceName +
        ' عالية الجودة وموثوقة، الحد الأدنى: ' +
        minQty +
        '، الحد الأقصى: ' +
        maxQty +
        '، متوسط سرعة التنفيذ: ' +
        (avgTime || 'فوري خلال دقائق') +
        '. أمان 100% بدون أي كلمة سر.',
      originalProviderCost: costEGP,
      pricePer1000: sellingPrice,
      minQuantity: minQty,
      maxQuantity: maxQty,
      providerServiceId: serviceId,
      speed: avgTime || 'فوري وسريع',
      type: type,
      active: true,
      isAvailable: true,
      isOffer: isOffer,
      originalPriceBeforeDiscount,
      discountPercent,
    });
  }

  // Read existing database to preserve accounts and dedicated game packages
  const db = JSON.parse(fs.readFileSync('data/database.json', 'utf8'));

  // Dedicated bespoke accounts
  const preservedAccounts = db.services.filter((s) => s.isAccountSale);
  // Dedicated Player ID game packages
  const gamingCats = ['cat_pubg', 'cat_freefire', 'cat_fifa', 'cat_ludo'];
  const preservedGamingPackages = db.services.filter(
    (s) => gamingCats.includes(s.categoryId) && !s.id.startsWith('srv_xf_')
  );

  // Combine: preserved accounts + preserved gaming packages + all xfollowr services
  const finalServices = [
    ...preservedGamingPackages,
    ...preservedAccounts,
    ...newServices,
  ];

  // Define complete categories list
  const fullCategories = [
    {
      id: 'cat_pubg',
      name: 'ببجي موبايل (PUBG Mobile)',
      icon: 'Gamepad2',
      description: 'شحن شدات ببجي UC فورية بالأيدي ID مباشر وموثوق عبر منصة KOUMND',
      sortOrder: 1,
      active: true,
      profitMarginPercent: 5,
    },
    {
      id: 'cat_freefire',
      name: 'فري فاير (Free Fire)',
      icon: 'Flame',
      description: 'شحن جواهر فري فاير فورية، العضوية الأسبوعية والشهرية بالمعرف ID',
      sortOrder: 2,
      active: true,
      profitMarginPercent: 5,
    },
    {
      id: 'cat_fifa',
      name: 'فيفا موبايل (FC Mobile)',
      icon: 'Trophy',
      description: 'شحن نقاط فيفا FC Points وتصريح النجم Star Pass فوري عبر الـ UID',
      sortOrder: 3,
      active: true,
      profitMarginPercent: 5,
    },
    {
      id: 'cat_ludo',
      name: 'يلا لودو وجواكر (Yalla Ludo)',
      icon: 'Dice6',
      description: 'شحن ماس وجواهر وكوينز يلا لودو ولودو كلوب وجواكر بالمعرّف ID',
      sortOrder: 4,
      active: true,
      profitMarginPercent: 5,
    },
    {
      id: 'cat_tiktok',
      name: 'تيك توك (TikTok)',
      icon: 'Video',
      description: 'متابعين، لايكات، مشاهدات فورية للإكسبلور، مشاركات، وبث مباشر وحسابات موثقة',
      sortOrder: 5,
      active: true,
      profitMarginPercent: 30,
    },
    {
      id: 'cat_instagram',
      name: 'إنستغرام (Instagram)',
      icon: 'Instagram',
      description: 'متابعين حقيقيين، لايكات، مشاهدات ريلز وستوري بجودة عالية وضمان تعويض',
      sortOrder: 6,
      active: true,
      profitMarginPercent: 30,
    },
    {
      id: 'cat_facebook',
      name: 'فيسبوك (Facebook)',
      icon: 'Facebook',
      description: 'متابعين صفحات وحسابات شخصية، لايكات وتفاعل لمنشورات وريلز فيسبوك',
      sortOrder: 7,
      active: true,
      profitMarginPercent: 30,
    },
    {
      id: 'cat_youtube',
      name: 'يوتيوب (YouTube)',
      icon: 'Youtube',
      description: 'مشاهدات يوتيوب حقيقية لتحقيق الدخل، وساعات مشاهدة ومشتركين بدون نقص',
      sortOrder: 8,
      active: true,
      profitMarginPercent: 30,
    },
    {
      id: 'cat_telegram',
      name: 'تيليجرام (Telegram)',
      icon: 'Send',
      description: 'أعضاء قنوات ومجموعات، مشاهدات وتفاعلات تصويت',
      sortOrder: 9,
      active: true,
      profitMarginPercent: 30,
    },
    {
      id: 'cat_twitter',
      name: 'إكس / تويتر (X / Twitter)',
      icon: 'Twitter',
      description: 'متابعين حسابات، ريتويت، لايكات وتصويت استطلاعات موثوقة',
      sortOrder: 10,
      active: true,
      profitMarginPercent: 30,
    },
    {
      id: 'cat_whatsapp',
      name: 'واتساب (WhatsApp)',
      icon: 'MessageCircle',
      description: 'متابعين قنوات واتساب، تفاعلات إيموجي، وأعضاء مجتمعات',
      sortOrder: 11,
      active: true,
      profitMarginPercent: 30,
    },
    {
      id: 'cat_kwai',
      name: 'كواي (Kwai)',
      icon: 'Flame',
      description: 'متابعين كواي، لايكات، ومشاهدات فيديو سريعة',
      sortOrder: 12,
      active: true,
      profitMarginPercent: 30,
    },
    {
      id: 'cat_subscriptions',
      name: 'اشتراكات وبرامج AI (ChatGPT / Canva / VPN)',
      icon: 'Sparkles',
      description: 'اشتراكات شات GPT بريميوم، كاب كات، كانفا برو، Gemini، وبرامج VPN',
      sortOrder: 13,
      active: true,
      profitMarginPercent: 30,
    },
    {
      id: 'cat_twitch_kick',
      name: 'ستريمرز وتويتش وكيك (Twitch / Kick)',
      icon: 'Tv',
      description: 'مشاهدات ومتابعين بث مباشر لمنصات تويتش، كيك، وبيجو لايف',
      sortOrder: 14,
      active: true,
      profitMarginPercent: 30,
    },
    {
      id: 'cat_google_reviews',
      name: 'خرائط جوجل وتقييمات (Google Maps)',
      icon: 'MapPin',
      description: 'تقييمات 5 نجوم عربية حقيقية لخرائط جوجل والأنشطة التجارية',
      sortOrder: 15,
      active: true,
      profitMarginPercent: 30,
    },
    {
      id: 'cat_threads',
      name: 'ثريدز (Threads)',
      icon: 'Hash',
      description: 'متابعين، لايكات، وإعادة نشر لمنصة ثريدز',
      sortOrder: 16,
      active: true,
      profitMarginPercent: 30,
    },
    {
      id: 'cat_spotify',
      name: 'سبوتيفاي وموسيقى (Spotify)',
      icon: 'Music',
      description: 'استماعات ومتابعين سبوتيفاي حقيقيين لرفع تصنيف الأغاني',
      sortOrder: 17,
      active: true,
      profitMarginPercent: 30,
    },
    {
      id: 'cat_linkedin',
      name: 'لينكد إن (LinkedIn)',
      icon: 'Briefcase',
      description: 'متابعين حسابات وصفحات شركات، اتصالات وتفاعل مهني',
      sortOrder: 18,
      active: true,
      profitMarginPercent: 30,
    },
    {
      id: 'cat_snapchat',
      name: 'سناب شات (Snapchat)',
      icon: 'Ghost',
      description: 'متابعين سناب شات حقيقيين ومشاهدات أضواء السبوت لايت',
      sortOrder: 19,
      active: true,
      profitMarginPercent: 30,
    },
  ];

  db.categories = fullCategories;
  db.services = finalServices;
  db.catalogVersion = 'v10_xfollowr_full_catalog_30_margin';
  db.providerSettings = {
    ...db.providerSettings,
    apiUrl: 'https://xfollowr.com/api/v2',
  };

  fs.writeFileSync('data/database.json', JSON.stringify(db, null, 2), 'utf8');
  console.log('Successfully updated database.json!');
  console.log('Total categories:', fullCategories.length);
  console.log('Total services loaded:', finalServices.length);
}

syncXFollowrServices().catch((err) => {
  console.error('Error during sync:', err);
  process.exit(1);
});
