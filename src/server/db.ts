import fs from 'node:fs';
import path from 'node:path';
import {
  UserWithPassword,
  Category,
  Service,
  Order,
  Transaction,
  DepositRequest,
  PaymentMethod,
  SupportTicket,
  TicketMessage,
  ProviderSettings,
  AppNotification,
  EmailNotification,
  SmsNotification,
} from '../types/index.ts';
import { hashPassword, generateSalt } from '../lib/security.ts';
import { categories as seedCategories, generateAllServices } from './seedServices.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const DB_FILE_BACKUP = path.join(DATA_DIR, 'database.json.backup');

export interface DatabaseSchema {
  catalogVersion?: string;
  users: UserWithPassword[];
  categories: Category[];
  services: Service[];
  orders: Order[];
  transactions: Transaction[];
  deposits: DepositRequest[];
  paymentMethods: PaymentMethod[];
  tickets: SupportTicket[];
  ticketMessages: TicketMessage[];
  providerSettings: ProviderSettings;
  notifications: AppNotification[];
  emailLogs: EmailNotification[];
  smsLogs: SmsNotification[];
}


// In-memory cache synced with disk
let dbCache: DatabaseSchema | null = null;

function getInitialData(): DatabaseSchema {
  const adminSalt = generateSalt();
  const clientSalt = generateSalt();

  // Admin password: qwerty123$$$
  // Client password: ClientPass2026!
  const adminHash = hashPassword('qwerty123$$$', adminSalt);
  const clientHash = hashPassword('ClientPass2026!', clientSalt);

  const initialUsers: UserWithPassword[] = [
    {
      id: 'usr_admin_youssef',
      username: 'youssef_admin',
      email: 'ywsfahmdwydh1@gmail.com',
      role: 'admin',
      balance: 5000.0,
      status: 'active',
      passwordHash: adminHash,
      salt: adminSalt,
      createdAt: new Date().toISOString(),
    },
  ];

  const initialCategories: Category[] = [
    {
      id: 'cat_tiktok',
      name: 'تيك توك (TikTok)',
      icon: 'Video',
      description: 'متابعين تيك توك، مشاهدات فورية، لايكات ومشاركات إكسبلور ودعم البث المباشر',
      sortOrder: 1,
      active: true,
    },
    {
      id: 'cat_instagram',
      name: 'إنستغرام (Instagram)',
      icon: 'Instagram',
      description: 'متابعين حقيقيين، لايكات، مشاهدات ريلز وستوري بجودة عالية وضمان تعويض',
      sortOrder: 2,
      active: true,
    },
    {
      id: 'cat_facebook',
      name: 'فيسبوك (Facebook)',
      icon: 'Facebook',
      description: 'متابعين صفحات وحسابات شخصية، لايكات وتفاعل لمنشورات وريلز فيسبوك',
      sortOrder: 3,
      active: true,
    },
    {
      id: 'cat_youtube',
      name: 'يوتيوب (YouTube)',
      icon: 'Youtube',
      description: 'مشاهدات يوتيوب حقيقية لتحقيق الدخل، وساعات مشاهدة ومشتركين بدون نقص',
      sortOrder: 4,
      active: true,
    },
    {
      id: 'cat_telegram',
      name: 'تيليجرام (Telegram)',
      icon: 'Send',
      description: 'أعضاء قنوات ومجموعات عربية وعالمية مع مشاهدات للمنشورات',
      sortOrder: 5,
      active: true,
    },
    {
      id: 'cat_twitter',
      name: 'إكس / تويتر (X / Twitter)',
      icon: 'Twitter',
      description: 'متابعين حسابات، ريتويت، لايكات وتصويت استطلاعات موثوقة',
      sortOrder: 6,
      active: true,
    },
    {
      id: 'cat_snapchat',
      name: 'سناب شات (Snapchat)',
      icon: 'Ghost',
      description: 'متابعين سناب شات حقيقيين ومشاهدات أضواء السبوت لايت (Spotlight)',
      sortOrder: 7,
      active: true,
    },
  ];

  // Base provider cost + exactly 50% profit margin (Selling Price = Provider Cost * 1.50)
  const initialServices: Service[] = [
    // TikTok Services Only (تيك توك)
    {
      id: 'srv_tt_followers',
      categoryId: 'cat_tiktok',
      name: 'متابعين تيك توك بدون نقصان - ضمان 60 يوم (فتح لايف 1K)',
      description: 'متابعين ذوو جودة ممتازة، حسابات نشطة تساعد على فتح البث المباشر (Live 1K) وبدء الربح.',
      originalProviderCost: 2.00,
      pricePer1000: 3.00, // +50% margin
      minQuantity: 100,
      maxQuantity: 30000,
      providerServiceId: '201',
      speed: '5K في اليوم',
      type: 'default',
      active: true,
    },
    {
      id: 'srv_tt_views',
      categoryId: 'cat_tiktok',
      name: 'مشاهدات تيك توك سريعة جداً لدعم الإكسبلور 🚀',
      description: 'مشاهدات فائقة السرعة وفورية لرفع تقييم الفيديو لدى خوارزمية تيك توك وتوصيله للإكسبلور.',
      originalProviderCost: 0.06,
      pricePer1000: 0.09, // +50% margin
      minQuantity: 1000,
      maxQuantity: 1000000,
      providerServiceId: '202',
      speed: '1M في اليوم',
      type: 'default',
      active: true,
    },
    {
      id: 'srv_tt_likes',
      categoryId: 'cat_tiktok',
      name: 'لايكات تيك توك حقيقية - رفع التفاعل والمشاركات',
      description: 'إعجابات حقيقية لحسابات وفيديوهات تيك توك ترفع من رواج المنشور والوصول.',
      originalProviderCost: 0.80,
      pricePer1000: 1.20, // +50% margin
      minQuantity: 100,
      maxQuantity: 50000,
      providerServiceId: '203',
      speed: '10K في اليوم',
      type: 'default',
      active: true,
    },
    {
      id: 'srv_tt_shares',
      categoryId: 'cat_tiktok',
      name: 'مشاركات وحفظ تيك توك (Shares & Saves) لصعود التريند',
      description: 'مشاركات للفيديو وحفظ في المفضلة مما يعطي إشارة قوية لخوارزميات تيك توك لترقية الفيديو.',
      originalProviderCost: 0.20,
      pricePer1000: 0.30, // +50% margin
      minQuantity: 500,
      maxQuantity: 100000,
      providerServiceId: '204',
      speed: '20K في اليوم',
      type: 'default',
      active: true,
    },

    // Instagram Services Only (إنستغرام)
    {
      id: 'srv_ig_followers_hq',
      categoryId: 'cat_instagram',
      name: 'متابعين إنستغرام حقيقيين مع ضمان 365 يوم - سرعة فائقة ⚡',
      description: 'متابعين بحسابات نشطة مع صور ومنشورات. بدء فوري. ضمان تعويض سنة كاملة عند أي نقص.',
      originalProviderCost: 1.60,
      pricePer1000: 2.40, // +50% margin
      minQuantity: 100,
      maxQuantity: 50000,
      providerServiceId: '101',
      speed: '10K - 20K في اليوم',
      type: 'default',
      active: true,
    },
    {
      id: 'srv_ig_likes_instant',
      categoryId: 'cat_instagram',
      name: 'لايكات إنستغرام فائقة السرعة مع ظهور في الاستكشاف (Explore)',
      description: 'لايكات فورية تبدأ في ثوانٍ. تزيد من نسبة التفاعل وتساعد المنشور على الصعود للإكسبلور.',
      originalProviderCost: 0.40,
      pricePer1000: 0.60, // +50% margin
      minQuantity: 50,
      maxQuantity: 25000,
      providerServiceId: '102',
      speed: 'فوري (خلال 30 ثانية)',
      type: 'default',
      active: true,
    },
    {
      id: 'srv_ig_reels_views',
      categoryId: 'cat_instagram',
      name: 'مشاهدات ريلز إنستغرام غير محدودة - وصول حقيقي 🔥',
      description: 'مشاهدات ريلز فائقة السرعة مع وصول حقيقي (Reach + Impressions) لزيادة المتابعين.',
      originalProviderCost: 0.10,
      pricePer1000: 0.15, // +50% margin
      minQuantity: 500,
      maxQuantity: 500000,
      providerServiceId: '103',
      speed: '500K في اليوم',
      type: 'default',
      active: true,
    },
    {
      id: 'srv_ig_comments_custom',
      categoryId: 'cat_instagram',
      name: 'تعليقات إنستغرام عربية مخصصة حسب رغبتك (Custom Comments)',
      description: 'اكتب التعليقات التي تريدها وسيتم نشرها بحسابات عربية حقيقية لزيادة الموثوقية.',
      originalProviderCost: 3.00,
      pricePer1000: 4.50, // +50% margin
      minQuantity: 10,
      maxQuantity: 1000,
      providerServiceId: '104',
      speed: '1K في اليوم',
      type: 'default',
      active: true,
    },

    // Facebook Services Only (فيسبوك)
    {
      id: 'srv_fb_page_likes',
      categoryId: 'cat_facebook',
      name: 'متابعين وإعجابات صفحات فيسبوك حقيقية مع ضمان تعويض',
      description: 'زيادة متابعي صفحة الفيسبوك مع إعجابات الصفحة لزيادة الموثوقية والمبيعات.',
      originalProviderCost: 2.20,
      pricePer1000: 3.30, // +50% margin
      minQuantity: 100,
      maxQuantity: 50000,
      providerServiceId: '601',
      speed: '3K في اليوم',
      type: 'default',
      active: true,
    },
    {
      id: 'srv_fb_post_likes',
      categoryId: 'cat_facebook',
      name: 'لايكات وتفاعلات منشورات فيسبوك (Love - Like - Wow)',
      description: 'تفاعلات فورية لمنشورات وصور الفيسبوك تزيد من انتشار المنشور للجمهور المستهدف.',
      originalProviderCost: 0.60,
      pricePer1000: 0.90, // +50% margin
      minQuantity: 50,
      maxQuantity: 20000,
      providerServiceId: '602',
      speed: 'فوري',
      type: 'default',
      active: true,
    },

    // YouTube Services Only (يوتيوب)
    {
      id: 'srv_yt_views_monetization',
      categoryId: 'cat_youtube',
      name: 'مشاهدات يوتيوب آمنة لتحقيق الدخل (AdSense Safe) 🎬',
      description: 'مشاهدات مقترحة وبحث يوتيوب مع مدة مشاهدة مرتفعة (High Retention). آمنة 100% لتحقيق شروط الربح.',
      originalProviderCost: 2.80,
      pricePer1000: 4.20, // +50% margin
      minQuantity: 500,
      maxQuantity: 100000,
      providerServiceId: '401',
      speed: '3K - 5K في اليوم',
      type: 'default',
      active: true,
    },
    {
      id: 'srv_yt_subscribers',
      categoryId: 'cat_youtube',
      name: 'مشتركين قنوات يوتيوب حقيقيين مع ضمان 90 يوم',
      description: 'مشتركين بجودة ممتازة لتخطي شرط الـ 1,000 مشترك لتحقيق الربح بدون أي مخاطر.',
      originalProviderCost: 8.00,
      pricePer1000: 12.00, // +50% margin
      minQuantity: 50,
      maxQuantity: 5000,
      providerServiceId: '402',
      speed: '500 - 1K في اليوم',
      type: 'default',
      active: true,
    },

    // Telegram Services Only (تيليجرام)
    {
      id: 'srv_tg_channel_members',
      categoryId: 'cat_telegram',
      name: 'أعضاء قنوات ومجموعات تيليجرام - ضمان دائم بدون تساقط',
      description: 'أعضاء لقنوات ومجموعات التيليجرام العامة والخاصة، بدون تساقط مع بقاء دائم.',
      originalProviderCost: 1.30,
      pricePer1000: 1.95, // +50% margin
      minQuantity: 100,
      maxQuantity: 50000,
      providerServiceId: '301',
      speed: '15K في اليوم',
      type: 'default',
      active: true,
    },
    {
      id: 'srv_tg_post_views',
      categoryId: 'cat_telegram',
      name: 'مشاهدات منشورات تيليجرام لآخر 5 منشورات - فوري ⚡',
      description: 'مشاهدات سريعة لمنشورات القناة تظهر التفاعل وتزيد من مصداقية القناة والمشتركين.',
      originalProviderCost: 0.08,
      pricePer1000: 0.12, // +50% margin
      minQuantity: 500,
      maxQuantity: 100000,
      providerServiceId: '302',
      speed: 'فوري',
      type: 'default',
      active: true,
    },

    // Twitter / X Services Only (إكس / تويتر)
    {
      id: 'srv_tw_followers',
      categoryId: 'cat_twitter',
      name: 'متابعين منصة إكس (Twitter) حسابات قديمة وموثوقة',
      description: 'متابعين عرب وأجانب لحسابات تويتر لرفع الهيبة والمصداقية والوصول.',
      originalProviderCost: 3.40,
      pricePer1000: 5.10, // +50% margin
      minQuantity: 100,
      maxQuantity: 20000,
      providerServiceId: '501',
      speed: '2K في اليوم',
      type: 'default',
      active: true,
    },
    {
      id: 'srv_tw_retweets_likes',
      categoryId: 'cat_twitter',
      name: 'ريتويت وإعجابات إكس (Retweets & Likes) للمنشورات',
      description: 'تفاعل حقيقي للتغريدات يساعد على تصدر الهاشتاجات وقائمة التريند.',
      originalProviderCost: 1.20,
      pricePer1000: 1.80, // +50% margin
      minQuantity: 50,
      maxQuantity: 10000,
      providerServiceId: '502',
      speed: 'فوري',
      type: 'default',
      active: true,
    },

    // Snapchat Services Only (سناب شات)
    {
      id: 'srv_snap_followers',
      categoryId: 'cat_snapchat',
      name: 'متابعين سناب شات حقيقيين للملفات التعريفية العامة (Public Profile)',
      description: 'متابعين حقيقيين لزيادة أعداد الملف التعريفي العام في سناب شات.',
      originalProviderCost: 4.00,
      pricePer1000: 6.00, // +50% margin
      minQuantity: 100,
      maxQuantity: 10000,
      providerServiceId: '701',
      speed: '1K - 2K في اليوم',
      type: 'default',
      active: true,
    },
    {
      id: 'srv_snap_spotlight_views',
      categoryId: 'cat_snapchat',
      name: 'مشاهدات سناب شات أضواء (Spotlight Views) سريعة',
      description: 'مشاهدات فورية لفيديوهات السبوت لايت ترفع من تصنيف الفيديو وتوصيله لمزيد من المتابعين.',
      originalProviderCost: 0.50,
      pricePer1000: 0.75, // +50% margin
      minQuantity: 1000,
      maxQuantity: 100000,
      providerServiceId: '702',
      speed: '25K في اليوم',
      type: 'default',
      active: true,
    },
  ];

  const initialPaymentMethods: PaymentMethod[] = [
    {
      id: 'pm_cash_wallet_all',
      name: 'محفظة كاش المعتمدة (01556266856) - تقبل من جميع المحافظ وطرق الدفع',
      category: 'wallet',
      instructions: 'قم بتحويل المبلغ المطلوب إلى رقم المحفظة المعتمدة 01556266856. المحفظة تقبل التحويل المباشر من جميع شبكات ومحافظ مصر: فودافون كاش (Vodafone Cash)، أورنج كاش (Orange Cash)، اتصالات كاش (Etisalat Cash)، وي باي (WE Pay)، وتطبيق إنستاباي (InstaPay IPN)، ومنافذ فوري (Fawry). بعد إتمام التحويل اكتب رقم هاتفك والمبلغ واضغط تأكيد الدفع ليتم التحقق والاعتماد.',
      accountNumberOrDetails: '01556266856',
      currency: 'EGP',
      minDeposit: 10,
      maxDeposit: 50000,
      feePercentage: 0,
      isActive: true,
      icon: 'Smartphone',
    },
  ];

  const initialProviderSettings: ProviderSettings = {
    apiUrl: 'https://xfollowr.com/api/v2',
    apiKey: 'sec_live_provider_key_placeholder',
    isTestMode: true,
    autoForwardOrders: true,
    mockLatencyMs: 350,
    balance: 428.65,
    currency: 'USD',
    lastTestedAt: new Date().toISOString(),
    lastTestStatus: 'success',
    lastTestMessage: 'الاتصال بمزود XFollowr نشط ومستقر، تم التحقق من الرصيد والخدمات بنجاح.',
  };

  const initialOrders: Order[] = [];

  const initialTransactions: Transaction[] = [];

  const initialDeposits: DepositRequest[] = [];

  const initialTickets: SupportTicket[] = [];
  const initialTicketMessages: TicketMessage[] = [];

  return {
    users: initialUsers,
    categories: seedCategories,
    services: generateAllServices(),
    orders: initialOrders,
    transactions: initialTransactions,
    deposits: initialDeposits,
    paymentMethods: initialPaymentMethods,
    tickets: initialTickets,
    ticketMessages: initialTicketMessages,
    providerSettings: initialProviderSettings,
    notifications: [],
    smsLogs: [],
    emailLogs: [],
  };
}

const CURRENT_CATALOG_VERSION = 'v10_xfollowr_full_catalog_30_margin';

function sanitizeDatabase(data: DatabaseSchema): DatabaseSchema {
  if (data.users && Array.isArray(data.users)) {
    data.users = data.users.filter(
      (u) =>
        u.email !== 'client@koumnd.com' &&
        u.id !== 'usr_client' &&
        u.username !== 'ahmed_vip' &&
        u.username !== 'ahmed_client'
    );
  }
  if (data.tickets && Array.isArray(data.tickets)) {
    data.tickets = data.tickets.filter(
      (t) => t.userEmail !== 'client@koumnd.com' && t.userId !== 'usr_client'
    );
  }
  if (data.ticketMessages && Array.isArray(data.ticketMessages)) {
    data.ticketMessages = data.ticketMessages.filter((m) => m.senderId !== 'usr_client');
  }
  if (data.notifications && Array.isArray(data.notifications)) {
    data.notifications = data.notifications.filter((n) => n.userId !== 'usr_client');
  }
  if (data.emailLogs && Array.isArray(data.emailLogs)) {
    data.emailLogs = data.emailLogs.filter(
      (e) => e.userId !== 'usr_client' && e.userEmail !== 'client@koumnd.com'
    );
  }
  return data;
}

export function getDatabase(): DatabaseSchema {
  if (dbCache) {
    return sanitizeDatabase(dbCache);
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Attempt 1: Read main database file
  if (fs.existsSync(DB_FILE)) {
    try {
      const fileData = fs.readFileSync(DB_FILE, 'utf8');
      dbCache = JSON.parse(fileData);
      if (dbCache) {
        dbCache.notifications = dbCache.notifications || [];
        dbCache.emailLogs = dbCache.emailLogs || [];
        dbCache.smsLogs = dbCache.smsLogs || [];
        dbCache.deposits = dbCache.deposits || [];
        dbCache.orders = dbCache.orders || [];
        dbCache.users = dbCache.users || [];
        dbCache.services = dbCache.services || [];
        dbCache.categories = dbCache.categories && dbCache.categories.length > 0 ? dbCache.categories : seedCategories;

        // If new catalog version, MERGE new services without overwriting existing prices!
        if (dbCache.catalogVersion !== CURRENT_CATALOG_VERSION) {
          const freshServices = generateAllServices();
          const existingIds = new Set(dbCache.services.map((s) => s.id));
          for (const s of freshServices) {
            if (!existingIds.has(s.id)) {
              dbCache.services.push(s);
            }
          }
          if (!dbCache.providerSettings || !dbCache.providerSettings.apiUrl.includes('xfollowr')) {
            dbCache.providerSettings = {
              ...dbCache.providerSettings,
              apiUrl: 'https://xfollowr.com/api/v2',
            };
          }
          dbCache.catalogVersion = CURRENT_CATALOG_VERSION;
          saveDatabase(dbCache);
        }

        return sanitizeDatabase(dbCache);
      }
    } catch (err) {
      console.error('[DB] Error parsing main database.json, attempting backup recovery:', err);
    }
  }

  // Attempt 2: Recover from backup file if main file was corrupted
  if (fs.existsSync(DB_FILE_BACKUP)) {
    try {
      const backupData = fs.readFileSync(DB_FILE_BACKUP, 'utf8');
      dbCache = JSON.parse(backupData);
      if (dbCache && dbCache.users) {
        console.log('[DB] Successfully recovered from database.json.backup!');
        saveDatabase(dbCache);
        return sanitizeDatabase(dbCache);
      }
    } catch (bErr) {
      console.error('[DB] Backup file recovery failed:', bErr);
    }
  }

  // Attempt 3: Initial seed ONLY if no database exists at all
  const fallbackInitial = getInitialData();
  fallbackInitial.catalogVersion = CURRENT_CATALOG_VERSION;
  saveDatabase(fallbackInitial);
  dbCache = fallbackInitial;
  return sanitizeDatabase(dbCache);
}

export function saveDatabase(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const cleanData = sanitizeDatabase(data);
  dbCache = cleanData;
  const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
  const serialized = JSON.stringify(cleanData, null, 2);
  fs.writeFileSync(tempPath, serialized, 'utf8');
  fs.renameSync(tempPath, DB_FILE);

  try {
    fs.writeFileSync(DB_FILE_BACKUP, serialized, 'utf8');
  } catch (err) {
    console.error('[DB] Failed to save database backup:', err);
  }
}
