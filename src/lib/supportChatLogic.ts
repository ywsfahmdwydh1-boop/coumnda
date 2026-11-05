export interface ChatResponse {
  reply: string;
  category?: 'how_to_use' | 'games' | 'wallet' | 'tiktok' | 'security' | 'speed' | 'accounts' | 'pricing' | 'tracking' | 'custom' | 'general';
  quickActions?: Array<{ label: string; action: string; payload?: string }>;
}

export function generateSupportResponse(userInput: string): ChatResponse {
  const query = userInput.trim().toLowerCase();

  // 1. Critical Security Boundary
  if (
    query.includes('كلمة سر') ||
    query.includes('باسورد') ||
    query.includes('password') ||
    query.includes('حسابي اتسرق') ||
    query.includes('رقم سري') ||
    query.includes('pin') ||
    query.includes('بياناتي')
  ) {
    return {
      reply: '🛡️ **تنبيه أمان وخصوصية صارم:**\nمنصة KOUMND وفريق الدعم الفني **لن يطلبوا منك أبداً كلمة مرور حسابك أو لعبتك** تحت أي ظرف!\n\n• لشحن الألعاب (ببجي، فري فاير...): نحتاج فقط **معرّف اللاعب (Player ID)**.\n• لخدمات السوشيال ميديا: نحتاج فقط **رابط الحساب أو الفيديو العلني**.\n• لا تشارك كلمة سرك أو رمز التأكيد (OTP) مع أي شخص حرصاً على أمانك.',
      category: 'security',
      quickActions: [
        { label: '🎮 شحن الألعاب بالـ ID فقط', action: 'ask_games' },
        { label: '💳 كيفية إيداع الرصيد (01556266856)', action: 'ask_wallet' },
        { label: '💬 تواصل مع الإدارة واتساب', action: 'open_whatsapp' },
      ],
    };
  }

  // 2. Custom Services (Video Design, Money Management, Social Accounts Trading)
  if (
    query.includes('تصميم فيديو') ||
    query.includes('تصميم فيديوهات') ||
    query.includes('مونتاج') ||
    query.includes('ادارة اموال') ||
    query.includes('إدارة أموال') ||
    query.includes('بيع اكونت') ||
    query.includes('شراء اكونت') ||
    query.includes('شراء وبيع')
  ) {
    return {
      reply: '🎬 **خدمة تصميم الفيديوهات وإدارة الأموال وتداول الحسابات:**\n\nمتوفر لدينا من خلال إدارة KOUMND:\n• عمل ومونتاج فيديوهات احترافية وتصميمات للريلز والتيك توك والإعلانات.\n• إدارة أموال وحملات تسويقية.\n• شراء وبيع وتوثيق أكونتات السوشيال ميديا الحقيقية.\n\n📲 **للتواصل المباشر مع الإدارة:** عبر الواتساب أو الاتصال على الرقم: **01556266856**.',
      category: 'custom',
      quickActions: [
        { label: 'واتساب: 01556266856', action: 'open_whatsapp' },
        { label: '📱 حسابات تيك توك الجاهزة', action: 'ask_accounts' },
        { label: '📖 دليل الاستخدام الكامل', action: 'navigate_guide' },
      ],
    };
  }

  // 3. Comprehensive Guide: How to Use the Website
  if (
    query.includes('ازاي استخدم') ||
    query.includes('كيف استخدم') ||
    query.includes('طريقة الاستخدام') ||
    query.includes('شرح الموقع') ||
    query.includes('شرح استخدام') ||
    query.includes('ازاي اطلب') ||
    query.includes('كيف اطلب') ||
    query.includes('طريقة الطلب') ||
    query.includes('ازاي اشتري') ||
    query.includes('كيف اشتري') ||
    query.includes('الخطوات') ||
    query.includes('خطوة') ||
    query.includes('استخدام الموقع') ||
    query.includes('دليل')
  ) {
    return {
      reply: '📖 **دليل استخدام منصة KOUMND الشامل (في 4 خطوات سهلة):**\n\n1️⃣ **إنشاء حساب أو تسجيل الدخول:**\nاضغط على «تسجيل الدخول» في أعلى الصفحة، وسجّل برقم هاتفك أو بريدك الإلكتروني بنقرة واحدة.\n\n2️⃣ **إيداع وشحن الرصيد في محفظتك:**\nتوجّه إلى صفحة «إيداع الرصيد» في القائمة:\n• حوّل المبلغ إلى محفظة كاش المعتمدة **01556266856** (تقبل من جميع المحافظ: فودافون كاش، أورنج، اتصالات، وي باي، إنستاباي InstaPay، أو فوري).\n• اكتب رقم الموبايل والمبلغ المطلوب (الحد الأدنى 10 ج.م فقط).\n• اضغط «تأكيد الدفع» ليتم التحقق واعتماد الرصيد فوراً.\n\n3️⃣ **اختيار الخدمة وتنفيذ الطلب:**\nادخل على «متجر الخدمات»:\n• شحن الألعاب المباشر بالـ ID فقط (ببجي، فري فاير...).\n• خدمات السوشيال ميديا وتيك توك بأرخص الأسعار وحسابات موثقة.\n• حسابات تيك توك جاهزة وموثقة مدمجة داخل قسم تيك توك.\n\n4️⃣ **متابعة طلبك والدعم:**\nتوجّه لصفحة «طلباتي» لمتابعة سير التنفيذ لحظة بلحظة، أو افتح صفحة «دليل الاستخدام» لمزيد من الشروحات!',
      category: 'how_to_use',
      quickActions: [
        { label: '💳 صفحة إيداع الرصيد', action: 'navigate_wallet' },
        { label: '🛍️ متجر الخدمات والأسعار', action: 'navigate_services' },
        { label: '📖 صفحة دليل الاستخدام', action: 'navigate_guide' },
        { label: '📋 صفحة طلباتي', action: 'navigate_orders' },
      ],
    };
  }

  // 4. Ready Accounts (Inside TikTok: 6K, 14K, 14.5K, 64K)
  if (
    query.includes('حساب جاهز') ||
    query.includes('حسابات') ||
    query.includes('6k') ||
    query.includes('6000') ||
    query.includes('14k') ||
    query.includes('14500') ||
    query.includes('14.5k') ||
    query.includes('64k') ||
    query.includes('شراء حساب') ||
    query.includes('حساب تيك توك')
  ) {
    return {
      reply: '📱 **حسابات تيك توك الجاهزة والموثقة (داخل قسم تيك توك بالمتجر):**\n\n1. **حساب 6,000 متابع:**\n• السعر الحالي: **650 ج.م** بدل ~~850 ج.م~~ (مؤهل لفتح بث مباشر Live Studio).\n\n2. **حساب 14,000 متابع + 2 مليون مشاهدة:**\n• السعر الحالي: **800 ج.م** بدل ~~1,300 ج.م~~ (تفاعل حقيقي ودخول برامج المبدعين).\n\n3. **حساب 14,500 متابع حقيقي متفاعل:**\n• السعر الحالي: **900 ج.م** بدل ~~1,500 ج.م~~ (مؤهل للربح وصندوق المشاهدات).\n\n4. **حساب 64,000 متابع VIP:**\n• السعر الحالي: **2,900 ج.م** بدل ~~4,200 ج.م~~.\n\n• **طريقة الاستلام:** فورياً بنقل ملكية البريد الإلكتروني الرسمي وربط هاتفك بضمان رسمي 100% من KOUMND.\n• **القسم:** تجدها مباشرة داخل قسم «تيك توك» في المتجر.',
      category: 'accounts',
      quickActions: [
        { label: 'عرض الحسابات في قسم تيك توك', action: 'navigate_services' },
        { label: 'طلب حساب عبر واتساب الإدارة', action: 'open_whatsapp' },
        { label: '💳 كيفية شحن الرصيد (01556266856)', action: 'ask_wallet' },
      ],
    };
  }

  // 5. Pricing & Margins (TikTok +35%, Gaming +5%)
  if (
    query.includes('اسعار') ||
    query.includes('أسعار') ||
    query.includes('سعر') ||
    query.includes('كام') ||
    query.includes('بكام') ||
    query.includes('تكلفة') ||
    query.includes('ارخص') ||
    query.includes('نسبة') ||
    query.includes('خصم') ||
    query.includes('عرض')
  ) {
    return {
      reply: '💰 **نظام الأسعار المعتمد في منصة KOUMND:**\n\n• **شحن الألعاب الإلكترونية:** شحن مباشر بالـ ID بأقل وأفضل تكلفة جملة في مصر.\n• **خدمات السوشيال ميديا وتيك توك:**\n- خدمات تيك توك محددة بأفضل وأرخص الأسعار دون أي منافس.\n- باقي منصات السوشيال (إنستغرام، فيسبوك، يوتيوب، تيليجرام) بأسعار جملة مخفضة.\n• **العملة الرسمية:** الجنيه المصري (ج.م) بأسعار واضحة بدون أي استقطاعات خفية.',
      category: 'pricing',
      quickActions: [
        { label: 'تصفح قائمة الأسعار بالمتجر', action: 'navigate_services' },
        { label: '🎮 أسعار شحن الألعاب بالـ ID', action: 'ask_games' },
        { label: '📱 أسعار الحسابات الجاهزة', action: 'ask_accounts' },
      ],
    };
  }

  // 6. Gaming Top-Ups (PUBG UC, Free Fire Diamonds, FC Points, Ludo)
  if (
    query.includes('ببجي') ||
    query.includes('شدات') ||
    query.includes('uc') ||
    query.includes('free fire') ||
    query.includes('فري فاير') ||
    query.includes('جواهر') ||
    query.includes('diamonds') ||
    query.includes('فيفا') ||
    query.includes('fc') ||
    query.includes('لودو') ||
    query.includes('العاب') ||
    query.includes('ألعاب') ||
    query.includes('id') ||
    query.includes('ايدي')
  ) {
    return {
      reply: '🎮 **شحن الألعاب الفوري بالمعرّف (Player ID) عبر منصة KOUMND:**\n\n• **ببجي موبايل (PUBG UC):**\n- 60 شدة: 59.40 ج.م\n- 325 شدة (300+25 مجاناً): 297.00 ج.م\n- 660 شدة (رويال باس): 594.00 ج.م\n- 1800 شدة: 1512.00 ج.م\n- 3850 شدة: 3132.00 ج.م\n\n• **فري فاير (Free Fire):**\n- 110 جوهرة: 54.00 ج.م\n- 231 جوهرة: 108.00 ج.م\n- 583 جوهرة: 270.00 ج.م\n- 1188 جوهرة: 540.00 ج.م\n- العضوية الأسبوعية والشهرية متاحة\n\n• **فيفا موبايل & يلا لودو:** شحن فوري بالمعرف الرسمي.\n🔒 **الأمان:** نحتاج معرّف اللاعب (Player ID) فقط بدون أي كلمة سر. التنفيذ خلال 1 إلى 5 دقائق!',
      category: 'games',
      quickActions: [
        { label: '🎮 شحن ألعاب الآن بالـ ID', action: 'navigate_gaming' },
        { label: '💳 شحن رصيد المحفظة', action: 'navigate_wallet' },
      ],
    };
  }

  // 7. Social Media Services (TikTok, Instagram, Facebook, Telegram, YouTube)
  if (
    query.includes('تيك توك') ||
    query.includes('تيكتوك') ||
    query.includes('tiktok') ||
    query.includes('انستقرام') ||
    query.includes('انستغرام') ||
    query.includes('فيسبوك') ||
    query.includes('يوتيوب') ||
    query.includes('تيليجرام') ||
    query.includes('تويتر') ||
    query.includes('لايك') ||
    query.includes('متابعين') ||
    query.includes('مشاهدات') ||
    query.includes('اكسبلور')
  ) {
    return {
      reply: '🌟 **خدمات السوشيال ميديا وتيك توك المعتمدة عبر منصة KOUMND:**\n\n• **تيك توك:** لايكات سريعة، متابعين حقيقيين لفتح البث المباشر 1K، مشاهدات إكسبلور، ومشاركات وسيف، بالإضافة إلى الحسابات الجاهزة الموثقة.\n• **إنستغرام:** متابعين بضمان سنة تعويض، لايكات وظهور إكسبلور، مشاهدات ريلز فورية.\n• **فيسبوك:** متابعين صفحات شخصية وعامة، وتفاعلات منشورات.\n• **يوتيوب:** مشتركين حقيقيين وساعات مشاهدة لتحقيق شروط الربح.\n• **تيليجرام:** أعضاء قنوات بدون تساقط ومشاهدات منشورات.\n\n⚡ التنفيذ يبدأ آلياً ومباشرة فور تأكيد طلبك.',
      category: 'tiktok',
      quickActions: [
        { label: 'تصفح خدمات السوشيال ميديا', action: 'navigate_services_tiktok' },
        { label: '📱 حسابات تيك توك الجاهزة', action: 'ask_accounts' },
      ],
    };
  }

  // 8. Wallet Recharge & Deposits (Cash Wallet 01556266856 Only)
  if (
    query.includes('شحن') ||
    query.includes('رصيد') ||
    query.includes('محفظة') ||
    query.includes('محفظه') ||
    query.includes('إيداع') ||
    query.includes('ايداع') ||
    query.includes('فودافون') ||
    query.includes('كاش') ||
    query.includes('فوري') ||
    query.includes('انستاباي') ||
    query.includes('إنستاباي') ||
    query.includes('فيزا') ||
    query.includes('فلوس') ||
    query.includes('تحويل') ||
    query.includes('01556266856')
  ) {
    return {
      reply: '💳 **كيفية إيداع وشحن الرصيد عبر محفظة كاش المعتمدة:**\n\n1. ادخل على صفحة «إيداع الرصيد» من القائمة.\n2. يتم التحويل إلى رقم محفظة الكاش المعتمدة: **01556266856**.\n• **تقبل من كافة طرق الدفع والمحافظ في مصر:** فودافون كاش، أورنج كاش، اتصالات كاش، وي باي (WE Pay)، إنستاباي InstaPay، ومنافذ فوري Fawry.\n3. اكتب **رقم هاتفك المحول منه** والمبلغ المطلوب (الحد الأدنى 10 ج.م فقط).\n4. يظهر لك المبلغ بوضوح، ثم اضغط «تأكيد الدفع».\n5. يتم التحقق من وصول المبلغ وإضافته لمحفظتك مرة واحدة فقط دون أي استقطاعات خفية (0.00 ج.م رسوم)!',
      category: 'wallet',
      quickActions: [
        { label: 'الانتقال لصفحة إيداع الرصيد', action: 'navigate_wallet' },
        { label: 'تواصل مع الإدارة واتساب', action: 'open_whatsapp' },
      ],
    };
  }

  // 9. Order Tracking & SMS Notifications
  if (
    query.includes('تتبع') ||
    query.includes('طلباتي') ||
    query.includes('طلبي') ||
    query.includes('حالة') ||
    query.includes('فين طلبي') ||
    query.includes('وصل ولا لسه') ||
    query.includes('اشعار') ||
    query.includes('إشعار') ||
    query.includes('رسالة')
  ) {
    return {
      reply: '📱 **متابعة الطلبات والإشعارات الخارجية:**\n\n• لمتابعة حالة أي طلب، اضغط على تبويب **«طلباتي»** في القائمة.\n• يعرض لك النظام: رقم الطلب، الخدمة، الكمية، الحالة (قيد الانتظار، قيد التنفيذ، مكتمل، ملغي، مسترد).\n• **إشعار خارجي لهاتفك:** فور قيام الإدارة أو السيرفر بتحديث طلبك، يصلك إشعار SMS خارجي على رقم هاتفك مباشرة لإعلامك بانتهاء التنفيذ!',
      category: 'tracking',
      quickActions: [
        { label: '📋 الذهاب لصفحة طلباتي', action: 'navigate_orders' },
        { label: 'فتح تذكرة دعم فني', action: 'navigate_tickets' },
      ],
    };
  }

  // 10. Speed & Guarantee & Refunds
  if (
    query.includes('سرعة') ||
    query.includes('وقت') ||
    query.includes('متى') ||
    query.includes('كام وقت') ||
    query.includes('تأخير') ||
    query.includes('ضمان') ||
    query.includes('استرداد') ||
    query.includes('فلوسي')
  ) {
    return {
      reply: '⚡ **سرعة التنفيذ وضمان استرداد الأموال:**\n\n• **شحن الألعاب بالـ ID:** يبدأ ويصل حسابك خلال 1 إلى 5 دقائق فقط.\n• **خدمات السوشيال ميديا:** يبدأ النظام في التمرير والتنفيذ آلياً خلال دقائق.\n• **ضمان استرداد الرصيد تلقائياً:** إذا حدث أي عطل في الخدمة أو ألغيت طلباً معلقاً، يسترجع النظام فوراً المبلغ كاملاً لمحفظتك دون أي خصم.',
      category: 'speed',
      quickActions: [
        { label: 'متابعة طلباتي', action: 'navigate_orders' },
        { label: 'فتح تذكرة دعم فني', action: 'navigate_tickets' },
      ],
    };
  }

  // Default Fallback: Welcoming, comprehensive portal of guidance
  return {
    reply: 'مرحباً بك في خدمة عملاء ومساعد منصة **KOUMND** الذكي! 👋\nأنا هنا لمساعدتك في كل ما يخص استخدام الموقع وشحن الرصيد والخدمات:\n\n• **إيداع الرصيد:** عبر محفظة كاش المعتمدة **01556266856** (تقبل من فودافون كاش، أورنج، اتصالات، وي، إنستاباي، فوري).\n• **شحن الألعاب بالـ ID:** ببجي، فري فاير، فيفا، لودو بالمعرف المباشر.\n• **خدمات السوشيال ميديا وتيك توك:** متابعين، مشاهدات، لايكات بأفضل سعر جملة.\n• **حسابات تيك توك جاهزة:** مدمجة بقسم تيك توك (6K بـ 650 ج، 14K بـ 800 ج، 14.5K بـ 900 ج، 64K بـ 2900 ج).\n• **مونتاج وتصميم فيديوهات وإدارة أموال:** تواصل عبر 01556266856.\n• **دليل الاستخدام:** متاح في التبويب الجديد «دليل الاستخدام» بالأعلى.\n\nاختر من الأسئلة السريعة أدناه أو اكتب سؤالك وسأجيبك فوراً:',
    category: 'general',
    quickActions: [
      { label: '📖 كيف أستخدم الموقع؟ (دليل شامل)', action: 'ask_how_to_use' },
      { label: '🎮 شحن الألعاب بالـ ID وأسعارها', action: 'ask_games' },
      { label: '💳 كيفية إيداع وشحن الرصيد (01556266856)', action: 'ask_wallet' },
      { label: '📱 حسابات تيك توك الجاهزة (6K و 14.5K)', action: 'ask_accounts' },
      { label: '🎬 عمل وتصميم فيديوهات ومونتاج', action: 'ask_custom' },
      { label: '💬 محادثة واتساب الإدارة المباشرة', action: 'open_whatsapp' },
    ],
  };
}
