import express, { Request, Response, NextFunction } from 'express';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { getDatabase, saveDatabase } from './src/server/db.ts';
import { UserWithPassword } from './src/types/index.ts';
import {
  hashPassword,
  verifyPassword,
  generateSalt,
  createToken,
  verifyToken,
  TokenPayload,
} from './src/lib/security.ts';
import {
  validateOrder,
  canCancelOrder,
  calculateRefundAmount,
} from './src/lib/orderCalculation.ts';
import {
  validateServicePriceUpdate,
  calculateSellingPrice,
  applyCategoryMarginToServices,
  getDefaultCategoryMargin,
  GAMING_CATEGORY_IDS,
} from './src/lib/pricingManager.ts';
import { applyBalanceAdjustment, isDuplicateOrderRecent } from './src/lib/ledger.ts';
import { forwardOrderToProvider, testProviderConnection } from './src/server/providerClient.ts';
import {
  registerWebSocketClient,
  notifyRegistrationSuccess,
  notifyDepositApproved,
  notifyDepositRejected,
  notifyOrderPlaced,
  notifyOrderStatusChange,
  notifyAdminNewOrderAlert,
  notifyAdminNewDepositAlert,
  sendSmsNotification,
  sendEmailNotification,
  sendRealtimeNotification,
  notifyBroadcastAnnouncement,
} from './src/server/notificationService.ts';
import {
  Order,
  Transaction,
  DepositRequest,
  Service,
  Category,
  PaymentMethod,
  SupportTicket,
  TicketMessage,
} from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.DISABLE_HMR = 'true';

const JWT_SECRET = process.env.JWT_SECRET || 'koumnd-platform-secret-key-salt-2026';
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// Extend express request
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// Authentication middleware
function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'يرجى تسجيل الدخول أولاً للمتابعة' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token, JWT_SECRET);
  if (!payload) {
    return res.status(401).json({ error: 'انتهت صلاحية جلسة تسجيل الدخول أو الرمز غير صالح' });
  }

  req.user = payload;
  next();
}

// Admin-only middleware (strictly locked to the owner ywsfahmdwydh1@gmail.com)
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (
    !req.user ||
    req.user.role !== 'admin' ||
    req.user.email !== 'ywsfahmdwydh1@gmail.com'
  ) {
    return res.status(403).json({ error: 'عذراً، هذه اللوحة مخصصة حصرياً للمشرف الرئيسي المعتمد فقط' });
  }
  next();
}

// ----------------------------------------------------
// AUTH ROUTES
// ----------------------------------------------------

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, identifier, email, phone, password } = req.body;
  const rawInput = (identifier || email || phone || '').trim();
  if (!username || !password || !rawInput) {
    return res.status(400).json({ error: 'يرجى إدخال الاسم، ورقم الهاتف أو البريد الإلكتروني، وكلمة المرور' });
  }

  if (password.length < 5) {
    return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 5 خانات أو أحرف على الأقل' });
  }

  const db = getDatabase();
  const isEmail = rawInput.includes('@');
  const userPhone = isEmail ? (phone ? phone.trim() : undefined) : rawInput;
  const userEmail = isEmail ? rawInput.toLowerCase() : `${rawInput.replace(/[^0-9]/g, '')}@koumnd.user`;
  const cleanUsername = username.trim();

  // Check if phone or email or username already registered
  const existing = db.users.find(
    (u) =>
      (userPhone && u.phone && u.phone.trim() === userPhone) ||
      (u.email && u.email.toLowerCase() === userEmail) ||
      (u.username && u.username.toLowerCase() === cleanUsername.toLowerCase())
  );

  if (existing) {
    return res.status(400).json({ error: 'يوجد حساب مسجل بالفعل بهذا الرقم أو البريد أو الاسم. يمكنك تسجيل الدخول مباشرة.' });
  }

  const salt = generateSalt();
  const hash = hashPassword(password, salt);
  const newUser: UserWithPassword = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    username: cleanUsername,
    email: userEmail,
    phone: userPhone,
    role: userEmail === 'ywsfahmdwydh1@gmail.com' ? 'admin' : 'user',
    balance: 0,
    status: 'active',
    createdAt: new Date().toISOString(),
    passwordHash: hash,
    salt,
  };

  db.users.push(newUser);
  saveDatabase(db);

  try {
    notifyRegistrationSuccess(newUser);
  } catch (e) {
    console.error('Failed to notify registration:', e);
  }

  const token = createToken({ userId: newUser.id, role: newUser.role, email: newUser.email }, JWT_SECRET);
  const { passwordHash: _, salt: __, ...userProfile } = newUser;

  return res.status(201).json({
    success: true,
    token,
    user: userProfile,
    message: 'تم إنشاء حسابك بنجاح وتسجيل الدخول فوراً!'
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { emailOrUsername, password } = req.body;
  if (!emailOrUsername || !password) {
    return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف أو اسم المستخدم وكلمة المرور' });
  }

  const db = getDatabase();
  const search = emailOrUsername.toLowerCase().trim();
  const digitsOnly = search.replace(/[^0-9]/g, '');

  const user = db.users.find(
    (u) =>
      u.email.toLowerCase() === search ||
      u.username.toLowerCase() === search ||
      (u.phone && (u.phone.trim() === search || (digitsOnly && u.phone.replace(/[^0-9]/g, '') === digitsOnly))) ||
      (digitsOnly && u.email.toLowerCase() === `${digitsOnly}@koumnd.user`)
  );

  if (!user) {
    return res.status(401).json({ error: 'بيانات الدخول غير صحيحة، يرجى التأكد من الرقم أو البريد وكلمة المرور' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'هذا الحساب موقوف حالياً من قِبل إدارة المنصة' });
  }

  const isMatch = verifyPassword(password, user.passwordHash, user.salt);
  if (!isMatch) {
    return res.status(401).json({ error: 'كلمة المرور غير صحيحة' });
  }

  const token = createToken({ userId: user.id, role: user.role, email: user.email }, JWT_SECRET);
  const { passwordHash: _, salt: __, ...userProfile } = user;

  return res.json({ token, user: userProfile });
});

// Direct Password Reset (without requiring unreachable SMS)
app.post('/api/auth/direct-reset-password', (req: Request, res: Response) => {
  const { identifier, newPassword } = req.body;
  if (!identifier || !newPassword) {
    return res.status(400).json({ error: 'يرجى إدخال رقم الهاتف أو البريد وكلمة المرور الجديدة' });
  }
  if (newPassword.length < 5) {
    return res.status(400).json({ error: 'كلمة المرور يجب ألا تقل عن 5 خانات' });
  }

  const db = getDatabase();
  const search = identifier.trim().toLowerCase();
  const user = db.users.find(
    (u) =>
      u.email.toLowerCase() === search ||
      (u.phone && u.phone.trim() === search) ||
      u.username.toLowerCase() === search
  );

  if (!user) {
    return res.status(404).json({ error: 'لم يتم العثور على حساب مسجل بهذا الرقم أو البريد' });
  }

  const salt = generateSalt();
  const hash = hashPassword(newPassword, salt);
  user.passwordHash = hash;
  user.salt = salt;
  saveDatabase(db);

  const token = createToken({ userId: user.id, role: user.role, email: user.email }, JWT_SECRET);
  const { passwordHash: _, salt: __, ...userProfile } = user;

  return res.json({
    success: true,
    token,
    user: userProfile,
    message: 'تم تعيين كلمة المرور الجديدة بنجاح وتسجيل الدخول'
  });
});

// In-memory OTP code store (with 10-minute expiry)
const otpCodes = new Map<string, { code: string; expiresAt: number; identifier: string }>();

app.post('/api/auth/send-otp', (req: Request, res: Response) => {
  const { identifier } = req.body;
  if (!identifier || !identifier.trim()) {
    return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف' });
  }

  const cleanId = identifier.trim().toLowerCase();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otpCodes.set(cleanId, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000,
    identifier: cleanId,
  });

  const isPhone = !cleanId.includes('@');
  const db = getDatabase();
  const existingUser = db.users.find(
    (u) => u.email.toLowerCase() === cleanId || (u.phone && u.phone.toLowerCase() === cleanId) || u.username.toLowerCase() === cleanId
  );
  const recipientName = existingUser?.username || (isPhone ? `مستخدم (${cleanId.slice(-4)})` : cleanId.split('@')[0]);

  // Dispatch actual SMS and/or Email notification
  if (isPhone) {
    const smsMessage = `📱 رمز التحقق السري الخاص بك في منصة KOUMND هو: ${code}. صالح لمدة 10 دقائق لتأكيد رقم هاتفك وحسابك.`;
    sendSmsNotification(cleanId, recipientName, 'user', smsMessage, undefined, 'SMS');
  } else {
    sendEmailNotification(
      existingUser?.id || 'guest',
      cleanId,
      'verification',
      `كود تأكيد حسابك في KOUMND: ${code}`,
      `رمز التحقق السري الخاص بك هو: ${code}`,
      [
        `مرحباً ${recipientName}،`,
        `رمز التحقق السري لتأكيد حسابك وتأمين دخولك في منصة KOUMND هو: ${code}`,
        'هذا الكود صالح للاستخدام لمدة 10 دقائق فقط. لا تشاركه مع أي شخص.',
        'إذا لم تكن أنت من طلب هذا الرمز، يمكنك تجاهل هذه الرسالة بأمان.'
      ]
    );
  }

  return res.json({
    success: true,
    message: isPhone
      ? `تم إرسال كود التأكيد في رسالة SMS إلى رقم هاتفك (${cleanId}). يرجى التحقق من رسائل هاتفك.`
      : `تم إرسال كود التأكيد إلى بريدك الإلكتروني (${cleanId}). يرجى التحقق من صندوق الوارد.`,
    channel: isPhone ? 'SMS' : 'Email',
  });
});

app.post('/api/auth/verify-otp', (req: Request, res: Response) => {
  const { identifier, code, username, password } = req.body;
  if (!identifier || !code) {
    return res.status(400).json({ error: 'يرجى إدخال البريد/الرقم وكود التأكيد' });
  }

  const cleanId = identifier.trim().toLowerCase();
  const stored = otpCodes.get(cleanId);

  if (!stored || stored.code !== code.trim() || Date.now() > stored.expiresAt) {
    return res.status(400).json({ error: 'كود التأكيد غير صحيح أو انتهت صلاحيته، يرجى إعادة المحاولة' });
  }

  // Clear code once verified
  otpCodes.delete(cleanId);

  const db = getDatabase();
  let user = db.users.find(
    (u) => u.email.toLowerCase() === cleanId || (u.phone && u.phone.toLowerCase() === cleanId) || u.username.toLowerCase() === cleanId
  );

  const isPhone = !cleanId.includes('@');

  if (!user) {
    const salt = generateSalt();
    const passwordHash = hashPassword(password || 'koumnd_otp_default', salt);
    const newUsername = username && username.trim()
      ? username.trim()
      : (cleanId.includes('@') ? cleanId.split('@')[0] : `user_${cleanId.slice(-4)}`);

    const isOwner = cleanId === 'ywsfahmdwydh1@gmail.com' || cleanId === '01556266856';

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: newUsername,
      email: cleanId.includes('@') ? cleanId : `${cleanId}@koumnd.net`,
      phone: isPhone ? cleanId : undefined,
      role: isOwner ? ('admin' as const) : ('user' as const),
      balance: isOwner ? 5000.0 : 0.0,
      status: 'active' as const,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser as any);
    saveDatabase(db);
    user = newUser as any;
  } else if (isPhone && !user.phone) {
    user.phone = cleanId;
    saveDatabase(db);
  }

  const token = createToken({ userId: user!.id, role: user!.role, email: user!.email }, JWT_SECRET);
  const { passwordHash: _, salt: __, ...userProfile } = user!;
  return res.json({ token, user: userProfile });
});

// Endpoint: Send OTP for Forgot Password / Password Reset
app.post('/api/auth/forgot-password-otp', (req: Request, res: Response) => {
  const { identifier } = req.body;
  if (!identifier || !identifier.trim()) {
    return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف المسجل' });
  }

  const cleanId = identifier.trim().toLowerCase();
  const db = getDatabase();
  const user = db.users.find(
    (u) =>
      u.email.toLowerCase() === cleanId ||
      (u.phone && u.phone.toLowerCase() === cleanId) ||
      u.username.toLowerCase() === cleanId
  );

  if (!user) {
    return res.status(404).json({ error: 'لم يتم العثور على حساب مسجل بهذا البريد أو الرقم. يرجى التحقق وإعادة المحاولة.' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otpCodes.set(cleanId, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000,
    identifier: cleanId,
  });

  const isPhone = !cleanId.includes('@');
  if (isPhone || user.phone) {
    const targetPhone = isPhone ? cleanId : user.phone!;
    const smsMessage = `🔒 كود استعادة كلمة المرور لحسابك في KOUMND هو: ${code}. استخدم هذا الرمز لتعيين كلمة مرور جديدة لحسابك.`;
    sendSmsNotification(targetPhone, user.username, 'user', smsMessage, undefined, 'SMS');
  }

  if (user.email) {
    sendEmailNotification(
      user.id,
      user.email,
      'password_reset',
      `كود استعادة كلمة المرور: ${code}`,
      `طلب استعادة كلمة المرور لحسابك: ${code}`,
      [
        `مرحباً ${user.username}،`,
        `لقد تلقينا طلباً لاستعادة كلمة المرور لحسابك المسجل في منصة KOUMND.`,
        `كود التحقق الخاص بك هو: ${code}`,
        'هذا الكود صالح لمدة 10 دقائق فقط لتأكيد هويتك وتعيين كلمة المرور الجديدة.',
        'إذا لم تكن أنت من قام بهذا الطلب، يمكنك تجاهل هذا البريد ولن يتم تغيير أي شيء.'
      ]
    );
  }

  return res.json({
    success: true,
    message: isPhone
      ? `تم إرسال كود استعادة كلمة المرور في رسالة SMS سرية إلى هاتفك (${cleanId}). يرجى كتابة الرمز للمتابعة.`
      : `تم إرسال كود استعادة كلمة المرور إلى بريدك الإلكتروني (${cleanId}). يرجى مراجعة بريدك.`,
    channel: isPhone ? 'SMS' : 'Email',
  });
});

// Endpoint: Reset Password with OTP Code
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { identifier, code, newPassword } = req.body;
  if (!identifier || !code || !newPassword) {
    return res.status(400).json({ error: 'يرجى إدخال البريد/الرقم وكود التأكيد وكلمة المرور الجديدة' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'يجب أن لا تقل كلمة المرور الجديدة عن 6 أحرف أو أرقام' });
  }

  const cleanId = identifier.trim().toLowerCase();
  const stored = otpCodes.get(cleanId);

  if (!stored || stored.code !== code.trim() || Date.now() > stored.expiresAt) {
    return res.status(400).json({ error: 'كود التأكيد غير صحيح أو انتهت صلاحيته، يرجى طلب كود جديد' });
  }

  const db = getDatabase();
  const user = db.users.find(
    (u) =>
      u.email.toLowerCase() === cleanId ||
      (u.phone && u.phone.toLowerCase() === cleanId) ||
      u.username.toLowerCase() === cleanId
  );

  if (!user) {
    return res.status(404).json({ error: 'لم يتم العثور على حساب مرتبط بهذا البريد أو الرقم' });
  }

  // Update password in database
  const salt = generateSalt();
  const passwordHash = hashPassword(newPassword, salt);
  user.passwordHash = passwordHash;
  user.salt = salt;
  saveDatabase(db);

  // Clear OTP code
  otpCodes.delete(cleanId);

  // Log confirmation security notifications
  if (user.phone) {
    sendSmsNotification(user.phone, user.username, 'user', '🔒 تم تغيير كلمة المرور لحسابك في KOUMND بنجاح.', undefined, 'SMS');
  }
  sendEmailNotification(
    user.id,
    user.email,
    'account_security',
    'تم تغيير كلمة المرور لحسابك بنجاح',
    'إشعار أمني: تم تغيير كلمة المرور',
    [
      `مرحباً ${user.username}،`,
      'تم تحديث كلمة المرور الخاصة بحسابك في منصة KOUMND بنجاح.',
      'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة واستخدام كافة خدماتك بأمان.'
    ]
  );

  const token = createToken({ userId: user.id, role: user.role, email: user.email }, JWT_SECRET);
  const { passwordHash: _, salt: __, ...userProfile } = user;

  return res.json({
    success: true,
    message: 'تم إعادة تعيين كلمة المرور بنجاح!',
    token,
    user: userProfile,
  });
});

app.post('/api/auth/social-login', (req: Request, res: Response) => {
  const { provider, email, name, providerUid } = req.body;
  if (!email || !provider) {
    return res.status(400).json({ error: 'البريد الإلكتروني ومزود الخدمة مطلوبان' });
  }

  const db = getDatabase();
  const cleanEmail = email.toLowerCase().trim();
  let user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (user && user.status === 'suspended') {
    return res.status(403).json({ error: 'هذا الحساب موقوف حالياً من قِبل إدارة المنصة' });
  }

  // Generate deterministic, persistent User Unique Identifier (UID)
  const cleanEmailSlug = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
  const persistentUid = providerUid && providerUid.trim()
    ? providerUid.trim()
    : `${provider}_uid_${cleanEmailSlug}`;

  if (!user) {
    const salt = generateSalt();
    const passwordHash = hashPassword(`social_${Date.now()}_${Math.random()}`, salt);
    let baseUsername = name && name.trim() ? name.trim() : `${provider}_user`;
    
    // Ensure username uniqueness
    let finalUsername = baseUsername;
    let counter = 1;
    while (db.users.some((u) => u.username.toLowerCase() === finalUsername.toLowerCase())) {
      finalUsername = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;
      counter++;
      if (counter > 10) break;
    }

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      uid: persistentUid,
      username: finalUsername,
      email: cleanEmail,
      role: 'user' as const,
      balance: 0.0,
      status: 'active' as const,
      passwordHash,
      salt,
      provider: provider as 'google' | 'facebook',
      providerUid: persistentUid,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser as any);
    saveDatabase(db);
    user = newUser as any;

    try {
      notifyRegistrationSuccess(newUser as any);
    } catch {
      // Safe fallback
    }
  } else {
    // Ensure existing user has permanent UID and social provider linkage registered in database
    let changed = false;
    if (!(user as any).uid) {
      (user as any).uid = persistentUid;
      changed = true;
    }
    if (!(user as any).provider) {
      (user as any).provider = provider;
      (user as any).providerUid = persistentUid;
      changed = true;
    }
    if (changed) {
      saveDatabase(db);
    }
  }

  const token = createToken({ userId: user!.id, role: user!.role, email: user!.email }, JWT_SECRET);
  const { passwordHash: _, salt: __, ...userProfile } = user!;
  return res.json({
    token,
    user: {
      ...userProfile,
      uid: (user as any).uid || persistentUid,
      provider: (user as any).provider || provider,
      providerUid: (user as any).providerUid || persistentUid,
    },
    message: 'تم ربط الحساب ومعرّف المستخدم (UID) بنجاح وحفظ البيانات في السيرفر',
  });
});

app.get('/api/auth/me', authenticate, (req: Request, res: Response) => {
  const db = getDatabase();
  const user = db.users.find((u) => u.id === req.user!.userId);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }

  const { passwordHash: _, salt: __, ...userProfile } = user;
  return res.json({ user: userProfile });
});

// ----------------------------------------------------
// PUBLIC / CLIENT DATA ROUTES
// ----------------------------------------------------

app.get('/api/categories', (_req: Request, res: Response) => {
  const db = getDatabase();
  const activeCategories = (db.categories || [])
    .filter((c) => c.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return res.json({ categories: activeCategories });
});

app.get('/api/services', (_req: Request, res: Response) => {
  const db = getDatabase();
  // Return all services including unavailable items so visitors see them with out-of-stock badge
  const allServices = db.services || [];
  return res.json({ services: allServices });
});

app.get('/api/payment-methods', (_req: Request, res: Response) => {
  const db = getDatabase();
  const activeMethods = (db.paymentMethods || []).filter((m) => m.isActive);
  return res.json({ paymentMethods: activeMethods });
});

// ----------------------------------------------------
// ORDERS ROUTES (USER)
// ----------------------------------------------------

app.get('/api/orders', authenticate, (req: Request, res: Response) => {
  const db = getDatabase();
  const userOrders = db.orders
    .filter((o) => o.userId === req.user!.userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ orders: userOrders });
});

app.post('/api/orders', authenticate, async (req: Request, res: Response) => {
  const { serviceId, link, quantity } = req.body;
  const db = getDatabase();

  const user = db.users.find((u) => u.id === req.user!.userId);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'حسابك موقوف، لا يمكنك إنشاء طلبات جديدة' });
  }

  const service = db.services.find((s) => s.id === serviceId);
  if (!service) {
    return res.status(404).json({ error: 'الخدمة المختارة غير موجودة' });
  }

  if (service.active === false || service.isAvailable === false) {
    return res.status(400).json({ error: 'هذه الخدمة غير متوفرة حالياً ومينفعش يطلب' });
  }

  const category = db.categories.find((c) => c.id === service.categoryId);

  // Validate parameters and balance
  const validation = validateOrder({
    link,
    quantity: Number(quantity),
    minQuantity: service.minQuantity,
    maxQuantity: service.maxQuantity,
    pricePer1000: service.pricePer1000,
    userBalance: user.balance,
    isPackage: service.type === 'package',
  });

  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const charge = validation.charge;

  // Check duplicate orders in recent 30 seconds
  const recentUserOrders = db.orders.filter((o) => o.userId === user.id);
  if (
    isDuplicateOrderRecent(
      recentUserOrders,
      { serviceId: service.id, link: link.trim(), quantity: Number(quantity) },
      30
    )
  ) {
    return res.status(400).json({
      error: 'لقد قمت بإرسال نفس الطلب بنفس الرابط والكمية قبل قليل. يرجى الانتظار لتفادي التكرار.',
    });
  }

  // Deduct user balance atomically
  const adj = applyBalanceAdjustment(user.balance, -charge, false);
  if (!adj.allowed) {
    return res.status(400).json({ error: adj.error });
  }

  user.balance = adj.balanceAfter;

  const orderNumber = `KMD-${Math.floor(1000 + Math.random() * 9000)}`;
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // Forward to provider API if enabled
  let providerOrderId: string | null = null;
  let providerStatus = 'Pending';
  let initialOrderStatus: Order['status'] = 'in_progress';
  let errorMessage: string | null = null;

  if (db.providerSettings.autoForwardOrders) {
    const provRes = await forwardOrderToProvider(
      db.providerSettings,
      service.providerServiceId,
      link.trim(),
      Number(quantity)
    );

    if (provRes.success) {
      providerOrderId = provRes.providerOrderId || null;
      providerStatus = 'Pending';
    } else {
      errorMessage = provRes.errorMessage || 'حدث تأخير في إرسال الطلب للمزود، قيد المعالجة الإدارية';
      initialOrderStatus = 'pending';
    }
  }

  const newOrder: Order = {
    id: orderId,
    orderNumber,
    userId: user.id,
    userEmail: user.email,
    username: user.username,
    serviceId: service.id,
    serviceName: service.name,
    categoryName: category ? category.name : 'خدمات عامة',
    link: link.trim(),
    quantity: Number(quantity),
    charge,
    startCount: 0,
    remains: Number(quantity),
    status: initialOrderStatus,
    providerOrderId,
    providerStatus,
    errorMessage,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Record financial transaction
  const transaction: Transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    transactionNumber: `TRX-${Math.floor(10000 + Math.random() * 90000)}`,
    userId: user.id,
    username: user.username,
    type: 'order_charge',
    amount: -charge,
    balanceBefore: adj.balanceBefore,
    balanceAfter: adj.balanceAfter,
    referenceId: orderId,
    description: `شراء خدمة: ${service.name} (طلب #${orderNumber})`,
    createdAt: new Date().toISOString(),
  };

  db.orders.unshift(newOrder);
  db.transactions.unshift(transaction);
  saveDatabase(db);

  notifyOrderPlaced(user, orderNumber, service.name, charge, Number(quantity));
  notifyAdminNewOrderAlert(newOrder, user, service.name);

  return res.json({
    success: true,
    message: 'تم استلام وتأكيد طلبك بنجاح!',
    order: newOrder,
    newBalance: user.balance,
  });
});

app.post('/api/orders/:id/cancel', authenticate, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();

  const order = db.orders.find((o) => o.id === id && o.userId === req.user!.userId);
  if (!order) {
    return res.status(404).json({ error: 'الطلب غير موجود' });
  }

  if (!canCancelOrder(order.status)) {
    return res.status(400).json({
      error: 'لا يمكن إلغاء الطلب لأنه بدأ بالفعل بالتنفيذ من قبل المزود أو تم الانتهاء منه مسبقاً',
    });
  }

  const user = db.users.find((u) => u.id === order.userId);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }

  const refundAmount = calculateRefundAmount('canceled', order.charge, order.remains, order.quantity);
  const adj = applyBalanceAdjustment(user.balance, refundAmount, true);
  user.balance = adj.balanceAfter;

  order.status = 'canceled';
  order.updatedAt = new Date().toISOString();

  // Create refund transaction
  const transaction: Transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    transactionNumber: `TRX-${Math.floor(10000 + Math.random() * 90000)}`,
    userId: user.id,
    username: user.username,
    type: 'order_refund',
    amount: refundAmount,
    balanceBefore: adj.balanceBefore,
    balanceAfter: adj.balanceAfter,
    referenceId: order.id,
    description: `استرداد قيمة الطلب الملغي #${order.orderNumber}`,
    createdAt: new Date().toISOString(),
  };

  // Add refund record to deposits list with "مسترد"
  const refundDeposit: DepositRequest = {
    id: `dep_ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    depositNumber: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
    userId: user.id,
    username: user.username,
    userEmail: user.email,
    amount: refundAmount,
    paymentMethodId: 'refund',
    paymentMethodName: 'استرداد طلب ملغي',
    senderAccountOrNumber: `طلب #${order.orderNumber}`,
    transactionProof: '',
    referenceCode: `استرداد #${order.orderNumber}`,
    status: 'approved',
    adminNotes: `مسترد تلقائياً لإلغاء طلب: ${order.serviceName}`,
    processedBy: 'النظام',
    createdAt: new Date().toISOString(),
    processedAt: new Date().toISOString(),
    isRefund: true,
  };

  db.deposits.unshift(refundDeposit);
  db.transactions.unshift(transaction);

  // Send in-app message / notification
  db.notifications.unshift({
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    type: 'balance_adjusted',
    title: 'تم استرداد المبلغ إلى محفظتك 🔄',
    message: `تم إلغاء الطلب #${order.orderNumber} (${order.serviceName}) واسترداد مبلغ ${refundAmount.toFixed(2)} ج.م فورياً إلى محفظتك، ومضاف في سجل الإيداعات كمسترد.`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  saveDatabase(db);

  notifyOrderStatusChange(user, order.orderNumber, order.serviceName, 'canceled');

  return res.json({
    success: true,
    message: `تم إلغاء الطلب بنجاح واسترداد ${refundAmount.toFixed(2)} ج.م إلى محفظتك`,
    order,
    newBalance: user.balance,
  });
});

// ----------------------------------------------------
// WALLET & DEPOSITS (USER)
// ----------------------------------------------------

app.get('/api/deposits', authenticate, (req: Request, res: Response) => {
  const db = getDatabase();
  const userDeposits = db.deposits
    .filter((d) => d.userId === req.user!.userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ deposits: userDeposits });
});

app.post('/api/deposits', authenticate, (req: Request, res: Response) => {
  const { amount, paymentMethodId, senderAccountOrNumber, transactionProof, referenceCode } = req.body;
  const numAmount = parseFloat(amount);

  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'يرجى إدخال مبلغ صحيح أكبر من صفر' });
  }

  const db = getDatabase();
  const method = db.paymentMethods.find((m) => m.id === paymentMethodId && m.isActive);
  if (!method) {
    return res.status(400).json({ error: 'طريقة الدفع المختارة غير متوفرة' });
  }

  if (numAmount < 10) {
    return res.status(400).json({ error: 'الحد الأدنى للإيداع هو 10 جنيه مصري ولا يوجد حد أقصى' });
  }

  // Sender number is required, transaction reference code is strictly optional
  if (!senderAccountOrNumber || !senderAccountOrNumber.trim()) {
    return res.status(400).json({ error: 'يرجى إدخال رقم المحفظة أو الحساب المحول منه' });
  }

  const user = db.users.find((u) => u.id === req.user!.userId);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }

  const cleanRef = referenceCode && referenceCode.trim() ? referenceCode.trim() : `TX-${Date.now().toString().slice(-6)}`;

  const newDeposit: DepositRequest = {
    id: `dep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    depositNumber: `DEP-${Math.floor(1000 + Math.random() * 9000)}`,
    userId: user.id,
    username: user.username,
    userEmail: user.email,
    amount: numAmount,
    paymentMethodId: method.id,
    paymentMethodName: method.name,
    senderAccountOrNumber: senderAccountOrNumber.trim(),
    transactionProof: (transactionProof || '').trim(),
    referenceCode: cleanRef,
    status: 'pending',
    adminNotes: null,
    processedBy: null,
    createdAt: new Date().toISOString(),
    processedAt: null,
  };

  db.deposits.unshift(newDeposit);
  saveDatabase(db);

  // Alert admin in real-time
  notifyAdminNewDepositAlert(newDeposit, user);

  return res.json({
    success: true,
    message: `تم تسجيل طلب إيداع الرصيد بنجاح برقم (${newDeposit.depositNumber}). طلبك قيد التحقق وسيتم إضافة الرصيد لحسابك فور تأكيد العملية.`,
    deposit: newDeposit,
  });
});

app.get('/api/wallet/transactions', authenticate, (req: Request, res: Response) => {
  const db = getDatabase();
  const userTx = db.transactions
    .filter((t) => t.userId === req.user!.userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ transactions: userTx });
});

// ----------------------------------------------------
// SUPPORT TICKETS (USER)
// ----------------------------------------------------

app.get('/api/tickets', authenticate, (req: Request, res: Response) => {
  const db = getDatabase();
  const userTickets = db.tickets
    .filter((t) => t.userId === req.user!.userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return res.json({ tickets: userTickets });
});

app.post('/api/tickets', authenticate, (req: Request, res: Response) => {
  const { subject, category, priority, message, relatedOrderId } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ error: 'عنوان التذكرة ونص الرسالة مطلوبان' });
  }

  const db = getDatabase();
  const user = db.users.find((u) => u.id === req.user!.userId);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }

  const ticketId = `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const ticketNumber = `TCK-${Math.floor(100 + Math.random() * 900)}`;

  const newTicket: SupportTicket = {
    id: ticketId,
    ticketNumber,
    userId: user.id,
    username: user.username,
    userEmail: user.email,
    subject: subject.trim(),
    category: category || 'general',
    priority: priority || 'normal',
    status: 'open',
    relatedOrderId: relatedOrderId || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const initialMessage: TicketMessage = {
    id: `msg_${Date.now()}_1`,
    ticketId,
    senderId: user.id,
    senderName: user.username,
    senderRole: 'user',
    message: message.trim(),
    createdAt: new Date().toISOString(),
  };

  db.tickets.unshift(newTicket);
  db.ticketMessages.push(initialMessage);
  saveDatabase(db);

  return res.json({ success: true, ticket: newTicket, message: initialMessage });
});

app.get('/api/tickets/:id/messages', authenticate, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();

  const ticket = db.tickets.find((t) => t.id === id);
  if (!ticket) {
    return res.status(404).json({ error: 'التذكرة غير موجودة' });
  }

  if (req.user!.role !== 'admin' && ticket.userId !== req.user!.userId) {
    return res.status(403).json({ error: 'غير مصرح بعرض هذه التذكرة' });
  }

  const messages = db.ticketMessages
    .filter((m) => m.ticketId === id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return res.json({ ticket, messages });
});

app.post('/api/tickets/:id/messages', authenticate, (req: Request, res: Response) => {
  const { id } = req.params;
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'نص الرسالة مطلوب' });
  }

  const db = getDatabase();
  const ticket = db.tickets.find((t) => t.id === id);
  if (!ticket) {
    return res.status(404).json({ error: 'التذكرة غير موجودة' });
  }

  if (req.user!.role !== 'admin' && ticket.userId !== req.user!.userId) {
    return res.status(403).json({ error: 'غير مصرح بالرد على هذه التذكرة' });
  }

  const user = db.users.find((u) => u.id === req.user!.userId);
  const senderRole = req.user!.role;

  const newMessage: TicketMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ticketId: id,
    senderId: req.user!.userId,
    senderName: senderRole === 'admin' ? 'إدارة KOUMND' : (user?.username || 'العميل'),
    senderRole,
    message: message.trim(),
    createdAt: new Date().toISOString(),
  };

  db.ticketMessages.push(newMessage);
  ticket.status = senderRole === 'admin' ? 'answered' : 'customer_reply';
  ticket.updatedAt = new Date().toISOString();

  saveDatabase(db);
  return res.json({ success: true, message: newMessage, ticket });
});

// ----------------------------------------------------
// ADMIN PROTECTED ROUTES
// ----------------------------------------------------

app.get('/api/admin/stats', authenticate, requireAdmin, (_req: Request, res: Response) => {
  const db = getDatabase();

  const totalRevenue = db.orders.reduce((sum, o) => (o.status !== 'canceled' && o.status !== 'refunded' ? sum + o.charge : sum), 0);
  const totalUserBalances = db.users.reduce((sum, u) => sum + u.balance, 0);
  const pendingOrders = db.orders.filter((o) => o.status === 'pending').length;
  const pendingDeposits = db.deposits.filter((d) => d.status === 'pending');
  const pendingDepositsAmount = pendingDeposits.reduce((sum, d) => sum + d.amount, 0);
  const openTicketsCount = db.tickets.filter((t) => t.status === 'open' || t.status === 'customer_reply').length;

  return res.json({
    stats: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders: db.orders.length,
      pendingOrders,
      totalUsers: db.users.length,
      totalUserBalances: Math.round(totalUserBalances * 100) / 100,
      pendingDepositsCount: pendingDeposits.length,
      pendingDepositsAmount: Math.round(pendingDepositsAmount * 100) / 100,
      openTicketsCount,
    },
  });
});

app.get('/api/admin/orders', authenticate, requireAdmin, (_req: Request, res: Response) => {
  const db = getDatabase();
  const sorted = [...db.orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return res.json({ orders: sorted });
});

app.patch('/api/admin/orders/:id/status', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, remains, startCount, adminNotes } = req.body;
  const db = getDatabase();
  const order = db.orders.find((o) => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'الطلب غير موجود' });
  }

  if (status) {
    order.status = status;
    const user = db.users.find((u) => u.id === order.userId);
    if (user) {
      notifyOrderStatusChange(user, order.orderNumber, order.serviceName, status, adminNotes);
    }
  }

  if (remains !== undefined) order.remains = Number(remains);
  if (startCount !== undefined) order.startCount = Number(startCount);
  order.updatedAt = new Date().toISOString();
  saveDatabase(db);

  return res.json({ success: true, order });
});

app.get('/api/admin/sms-logs', authenticate, requireAdmin, (_req: Request, res: Response) => {
  const db = getDatabase();
  return res.json({ smsLogs: db.smsLogs || [] });
});

app.post('/api/admin/orders/:id/reply-sms', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { message, channel } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'نص الرسالة مطلوب' });
  }

  const db = getDatabase();
  const order = db.orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'الطلب غير موجود' });
  }

  const user = db.users.find((u) => u.id === order.userId);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }

  const customerPhone = user.phone || user.email;
  const sms = sendSmsNotification(
    customerPhone,
    user.username,
    'user',
    message.trim(),
    order.id,
    channel === 'WhatsApp' ? 'WhatsApp' : 'SMS'
  );

  let cleanPhone = customerPhone.replace(/D/g, '');
  if (cleanPhone.startsWith('01')) {
    cleanPhone = '2' + cleanPhone;
  }

  const whatsappUrl = cleanPhone.length >= 10
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message.trim())}`
    : undefined;

  return res.json({
    success: true,
    message: 'تم إرسال الإشعار الخارجي إلى هاتف العميل بنجاح!',
    sms,
    whatsappUrl,
  });
});
app.post('/api/admin/orders/:id/refund', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { refundAmount: customRefund, reason } = req.body;
  const db = getDatabase();

  const order = db.orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'الطلب غير موجود' });
  }

  const user = db.users.find((u) => u.id === order.userId);
  if (!user) {
    return res.status(404).json({ error: 'مستخدم الطلب غير موجود' });
  }

  const refund = customRefund !== undefined ? Number(customRefund) : order.charge;
  if (refund <= 0) {
    return res.status(400).json({ error: 'مبلغ الاسترداد يجب أن يكون أكبر من صفر' });
  }

  const adj = applyBalanceAdjustment(user.balance, refund, true);
  user.balance = adj.balanceAfter;
  order.status = 'refunded';
  order.updatedAt = new Date().toISOString();

  const transaction: Transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    transactionNumber: `TRX-${Math.floor(10000 + Math.random() * 90000)}`,
    userId: user.id,
    username: user.username,
    type: 'order_refund',
    amount: refund,
    balanceBefore: adj.balanceBefore,
    balanceAfter: adj.balanceAfter,
    referenceId: order.id,
    description: `استرداد إداري لقيمة الطلب #${order.orderNumber} - سبب: ${reason || 'موافقة الإدارة'}`,
    createdAt: new Date().toISOString(),
  };

  db.transactions.unshift(transaction);
  saveDatabase(db);

  notifyOrderStatusChange(user, order.orderNumber, order.serviceName, 'refunded');

  return res.json({ success: true, message: `تم استرداد مبلغ $${refund.toFixed(3)} بنجاح للمستخدم`, order, userBalance: user.balance });
});

app.get('/api/admin/deposits', authenticate, requireAdmin, (_req: Request, res: Response) => {
  const db = getDatabase();
  const sorted = [...db.deposits].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return res.json({ deposits: sorted });
});

// Shared Deposit Resolution Engine (Strict Server-authoritative Idempotency)
function resolveDepositRequest(
  depositId: string,
  action: 'approve' | 'reject',
  adminNotes: string | undefined,
  processedByUserId: string,
  res: Response
) {
  const db = getDatabase();
  const deposit = db.deposits.find((d) => d.id === depositId);
  if (!deposit) {
    return res.status(404).json({ error: 'طلب الإيداع غير موجود' });
  }

  // STRICT IDEMPOTENCY CHECK: Once processed, it can never be processed again
  if (deposit.status !== 'pending') {
    return res.status(400).json({
      error: 'تمت معالجة هذا الطلب مسبقاً، ولا يمكن تكرار إضافة الرصيد لنفس العملية منعاً للأخطاء والتكرار المالي',
    });
  }

  const user = db.users.find((u) => u.id === deposit.userId);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم صاحب طلب الإيداع غير موجود' });
  }

  deposit.adminNotes = adminNotes || (action === 'approve' ? 'تم التحقق من وصول المبلغ بنجاح واعتماد الرصيد' : 'تم رفض الطلب لعدم مطابقة بيانات التحويل');
  deposit.processedBy = processedByUserId;
  deposit.processedAt = new Date().toISOString();

  if (action === 'approve') {
    deposit.status = 'approved';

    // Credit balance EXACTLY ONCE
    const adj = applyBalanceAdjustment(user.balance, deposit.amount, true);
    user.balance = adj.balanceAfter;

    // Create deposit transaction in the financial ledger
    const transaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      transactionNumber: `TRX-${Math.floor(10000 + Math.random() * 90000)}`,
      userId: user.id,
      username: user.username,
      type: 'deposit',
      amount: deposit.amount,
      balanceBefore: adj.balanceBefore,
      balanceAfter: adj.balanceAfter,
      referenceId: deposit.id,
      description: `إيداع رصيد معتمد عبر ${deposit.paymentMethodName} (طلب #${deposit.depositNumber})`,
      createdAt: new Date().toISOString(),
    };
    db.transactions.unshift(transaction);
    notifyDepositApproved(user, deposit.amount, deposit.paymentMethodName);
  } else if (action === 'reject') {
    deposit.status = 'rejected';
    // STRICT RULE: No balance is added under any circumstances upon rejection
    notifyDepositRejected(user, deposit.amount, deposit.adminNotes || 'عدم استلام أو مطابقة بيانات التحويل');
  }

  saveDatabase(db);
  return res.json({
    success: true,
    message: action === 'approve' ? 'تمت الموافقة وتغذية رصيد العميل بنجاح لمرة واحدة فقط' : 'تم رفض طلب الإيداع دون إضافة أي رصيد',
    deposit,
    userBalance: user.balance,
  });
}

// 1. Admin Action Endpoint (Approve / Reject)
app.patch('/api/admin/deposits/:id/action', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, adminNotes } = req.body; // action: 'approve' | 'reject'
  if (action !== 'approve' && action !== 'reject') {
    return res.status(400).json({ error: 'إجراء غير صالح، يجب أن يكون موافقة (approve) أو رفض (reject)' });
  }
  return resolveDepositRequest(id, action, adminNotes, req.user!.userId, res);
});

// 2. Explicit Dedicated Approve Routes
app.put('/api/admin/deposits/:id/approve', authenticate, requireAdmin, (req: Request, res: Response) => {
  return resolveDepositRequest(req.params.id, 'approve', req.body.adminNotes, req.user!.userId, res);
});
app.post('/api/admin/deposits/:id/approve', authenticate, requireAdmin, (req: Request, res: Response) => {
  return resolveDepositRequest(req.params.id, 'approve', req.body.adminNotes, req.user!.userId, res);
});

// 3. Explicit Dedicated Reject Routes
app.put('/api/admin/deposits/:id/reject', authenticate, requireAdmin, (req: Request, res: Response) => {
  return resolveDepositRequest(req.params.id, 'reject', req.body.adminNotes, req.user!.userId, res);
});
app.post('/api/admin/deposits/:id/reject', authenticate, requireAdmin, (req: Request, res: Response) => {
  return resolveDepositRequest(req.params.id, 'reject', req.body.adminNotes, req.user!.userId, res);
});

// 4. Secure Payment Gateway Webhook (Paymob / Fawry / Electronic Wallets IPN)
app.post('/api/webhooks/payment', (req: Request, res: Response) => {
  const { depositId, transactionReference, status, hmacSecret, amount } = req.body;
  const configuredHmac = process.env.PAYMOB_HMAC_SECRET || process.env.PAYMENT_GATEWAY_SECRET;

  if (configuredHmac && hmacSecret !== configuredHmac) {
    return res.status(403).json({ error: 'توقيع أمني غير صالح (Invalid HMAC Signature)' });
  }

  const db = getDatabase();
  const deposit = db.deposits.find(
    (d) => d.id === depositId || d.referenceCode === transactionReference || d.depositNumber === depositId
  );

  if (!deposit) {
    return res.status(404).json({ error: 'طلب الإيداع المطلوب غير موجود في النظام' });
  }

  if (deposit.status !== 'pending') {
    return res.status(200).json({ message: 'تمت معالجة الطلب مسبقاً وتجاهل التكرار بنجاح (Already processed)' });
  }

  const user = db.users.find((u) => u.id === deposit.userId);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }

  if (status === 'success' || status === 'PAID' || status === 'CAPTURED') {
    deposit.status = 'approved';
    deposit.processedAt = new Date().toISOString();
    deposit.processedBy = 'بوابة الدفع الإلكترونية المعتمدة (Webhook)';
    deposit.adminNotes = `تأكيد آلي من وسيلة الدفع - مرجع: ${transactionReference || 'WEBHOOK_OK'}`;

    const adj = applyBalanceAdjustment(user.balance, deposit.amount, true);
    user.balance = adj.balanceAfter;

    const transaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      transactionNumber: `TRX-${Math.floor(10000 + Math.random() * 90000)}`,
      userId: user.id,
      username: user.username,
      type: 'deposit',
      amount: deposit.amount,
      balanceBefore: adj.balanceBefore,
      balanceAfter: adj.balanceAfter,
      referenceId: deposit.id,
      description: `إيداع آلي مؤكد عبر بوابة الدفع (مرجع #${transactionReference || deposit.referenceCode})`,
      createdAt: new Date().toISOString(),
    };
    db.transactions.unshift(transaction);
    saveDatabase(db);

    notifyDepositApproved(user, deposit.amount, deposit.paymentMethodName);
    return res.json({ success: true, message: 'تم استلام تأكيد الدفع وإيداع الرصيد بنجاح' });
  } else {
    deposit.status = 'rejected';
    deposit.processedAt = new Date().toISOString();
    deposit.processedBy = 'بوابة الدفع الإلكترونية المعتمدة (Webhook)';
    deposit.adminNotes = 'فشلت عملية الدفع لدى البوابة أو تم إلغاؤها من قبل العميل';
    saveDatabase(db);
    notifyDepositRejected(user, deposit.amount, 'فشلت عملية الدفع لدى البوابة الإلكترونية');
    return res.json({ success: false, message: 'تم تسجيل فشل أو إلغاء الدفع لدى البوابة' });
  }
});

app.get('/api/admin/users', authenticate, requireAdmin, (_req: Request, res: Response) => {
  const db = getDatabase();
  const safeUsers = db.users.map(({ passwordHash: _, salt: __, ...u }) => u);
  return res.json({ users: safeUsers });
});

app.patch('/api/admin/users/:id/balance', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount, reason, actionType } = req.body; // actionType: 'add' | 'deduct'
  const delta = actionType === 'deduct' ? -Math.abs(Number(amount)) : Math.abs(Number(amount));

  if (isNaN(delta) || delta === 0) {
    return res.status(400).json({ error: 'يرجى إدخال مبلغ صحيح' });
  }

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'سبب تعديل الرصيد مطلوب للتوثيق المالي' });
  }

  const db = getDatabase();
  const user = db.users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }

  const adj = applyBalanceAdjustment(user.balance, delta, false);
  if (!adj.allowed) {
    return res.status(400).json({ error: adj.error });
  }

  user.balance = adj.balanceAfter;

  const transaction: Transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    transactionNumber: `TRX-${Math.floor(10000 + Math.random() * 90000)}`,
    userId: user.id,
    username: user.username,
    type: 'admin_adjustment',
    amount: delta,
    balanceBefore: adj.balanceBefore,
    balanceAfter: adj.balanceAfter,
    referenceId: `adm_${req.user!.userId}`,
    description: `تعديل رصيد إداري: ${reason.trim()} (${delta > 0 ? '+' : ''}${delta}$)`,
    createdAt: new Date().toISOString(),
  };

  db.transactions.unshift(transaction);
  saveDatabase(db);

  return res.json({ success: true, message: 'تم تعديل الرصيد وتوثيقه في السجل المالي', userBalance: user.balance });
});

// Admin Categories and Services CRUD
app.post('/api/admin/categories', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { name, icon, description, sortOrder } = req.body;
  if (!name) return res.status(400).json({ error: 'اسم الفئة مطلوب' });

  const db = getDatabase();
  const newCat: Category = {
    id: `cat_${Date.now()}`,
    name: name.trim(),
    icon: icon || 'Folder',
    description: description || '',
    sortOrder: Number(sortOrder) || db.categories.length + 1,
    active: true,
  };

  db.categories.push(newCat);
  saveDatabase(db);
  return res.json({ success: true, category: newCat });
});

app.put('/api/admin/categories/:id', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const cat = db.categories.find((c) => c.id === id);
  if (!cat) return res.status(404).json({ error: 'الفئة غير موجودة' });

  Object.assign(cat, req.body);
  saveDatabase(db);
  return res.json({ success: true, category: cat });
});

app.delete('/api/admin/categories/:id', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  db.categories = db.categories.filter((c) => c.id !== id);
  saveDatabase(db);
  return res.json({ success: true });
});

app.post('/api/admin/services', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { categoryId, name, description, pricePer1000, originalProviderCost, minQuantity, maxQuantity, speed, providerServiceId, isOffer } = req.body;
  if (!name || !categoryId || !pricePer1000) {
    return res.status(400).json({ error: 'الاسم، الفئة، وسعر الألف حقول إجبارية' });
  }

  const cost = Number(originalProviderCost) || (Number(pricePer1000) / 1.3);
  const price = Number(pricePer1000);

  // Protection validation gate: prevent price lower than provider base cost
  const priceValidation = validateServicePriceUpdate({
    originalProviderCost: cost,
    newPrice: price,
    isOffer: Boolean(isOffer),
  });

  if (!priceValidation.valid) {
    return res.status(400).json({ error: priceValidation.error });
  }

  const db = getDatabase();
  const newService: Service = {
    id: `srv_${Date.now()}`,
    categoryId,
    name: name.trim(),
    description: description || '',
    originalProviderCost: cost,
    pricePer1000: price,
    minQuantity: Number(minQuantity) || 100,
    maxQuantity: Number(maxQuantity) || 10000,
    providerServiceId: providerServiceId || '101',
    speed: speed || 'سريع',
    type: 'default',
    active: true,
    isOffer: Boolean(isOffer),
  };

  db.services.push(newService);
  saveDatabase(db);
  return res.json({ success: true, service: newService });
});

app.put('/api/admin/services/:id', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const service = db.services.find((s) => s.id === id);
  if (!service) return res.status(404).json({ error: 'الخدمة غير موجودة' });

  const candidateCost = req.body.originalProviderCost !== undefined ? Number(req.body.originalProviderCost) : service.originalProviderCost;
  const candidatePrice = req.body.pricePer1000 !== undefined ? Number(req.body.pricePer1000) : service.pricePer1000;

  if (candidateCost !== undefined && candidatePrice !== undefined) {
    const priceValidation = validateServicePriceUpdate({
      originalProviderCost: candidateCost,
      newPrice: candidatePrice,
      isOffer: req.body.isOffer !== undefined ? Boolean(req.body.isOffer) : service.isOffer,
    });

    if (!priceValidation.valid) {
      return res.status(400).json({ error: priceValidation.error });
    }
  }

  Object.assign(service, req.body);
  saveDatabase(db);
  return res.json({ success: true, service });
});

app.patch('/api/admin/services/:id', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const service = db.services.find((s) => s.id === id);
  if (!service) return res.status(404).json({ error: 'الخدمة غير موجودة' });

  const {
    name,
    description,
    pricePer1000,
    originalProviderCost,
    minQuantity,
    maxQuantity,
    speed,
    active,
    isAvailable,
    isAccountSale,
    isOffer,
    providerServiceId,
    categoryId,
  } = req.body;

  // Protection validation gate: prevent price lower than provider cost
  const nextCost = originalProviderCost !== undefined ? Number(originalProviderCost) : (service.originalProviderCost || 0);
  const nextPrice = pricePer1000 !== undefined ? Number(pricePer1000) : service.pricePer1000;
  const nextIsOffer = isOffer !== undefined ? Boolean(isOffer) : Boolean(service.isOffer);

  if (pricePer1000 !== undefined || originalProviderCost !== undefined) {
    const priceValidation = validateServicePriceUpdate({
      originalProviderCost: nextCost,
      newPrice: nextPrice,
      isOffer: nextIsOffer,
    });

    if (!priceValidation.valid) {
      return res.status(400).json({ error: priceValidation.error });
    }
  }

  if (name !== undefined) service.name = name.trim();
  if (description !== undefined) service.description = description;
  if (pricePer1000 !== undefined) service.pricePer1000 = Number(pricePer1000);
  if (originalProviderCost !== undefined) service.originalProviderCost = Number(originalProviderCost);
  if (minQuantity !== undefined) service.minQuantity = Number(minQuantity);
  if (maxQuantity !== undefined) service.maxQuantity = Number(maxQuantity);
  if (speed !== undefined) service.speed = speed;
  if (active !== undefined) service.active = Boolean(active);
  if (isAvailable !== undefined) service.isAvailable = Boolean(isAvailable);
  if (isAccountSale !== undefined) service.isAccountSale = Boolean(isAccountSale);
  if (isOffer !== undefined) service.isOffer = Boolean(isOffer);
  if (providerServiceId !== undefined) service.providerServiceId = String(providerServiceId);
  if (categoryId !== undefined) service.categoryId = categoryId;

  // Handle fake anchor discount prices for promotional offers
  if (service.isOffer) {
    if (req.body.originalPriceBeforeDiscount !== undefined) {
      service.originalPriceBeforeDiscount = Number(req.body.originalPriceBeforeDiscount);
      service.discountPercent = service.originalPriceBeforeDiscount > service.pricePer1000
        ? Math.round(((service.originalPriceBeforeDiscount - service.pricePer1000) / service.originalPriceBeforeDiscount) * 100)
        : 25;
    } else if (!service.originalPriceBeforeDiscount || service.originalPriceBeforeDiscount <= service.pricePer1000) {
      const calc = calculateSellingPrice(service.originalProviderCost || (service.pricePer1000 / 1.3), 30, true);
      service.originalPriceBeforeDiscount = calc.originalPriceBeforeDiscount;
      service.discountPercent = calc.discountPercent;
    }
  } else if (isOffer === false) {
    service.originalPriceBeforeDiscount = undefined;
    service.discountPercent = undefined;
  }

  saveDatabase(db);
  return res.json({ success: true, service });
});

// Dedicated fast pricing & profit margin update endpoint with loss-prevention verification
app.post('/api/admin/services/:id/pricing', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    sellingPrice,
    providerCost,
    targetMarginPercent,
    isOffer,
    anchorPrice,
    active,
    isAvailable,
  } = req.body;

  const db = getDatabase();
  const service = db.services.find((s) => s.id === id);
  if (!service) return res.status(404).json({ error: 'الخدمة غير موجودة' });

  let cost = providerCost !== undefined ? Number(providerCost) : (service.originalProviderCost || 0);
  let price = sellingPrice !== undefined ? Number(sellingPrice) : service.pricePer1000;

  // If admin specified target margin % instead of selling price, calculate selling price
  if (targetMarginPercent !== undefined && targetMarginPercent !== null && !isNaN(Number(targetMarginPercent))) {
    const calc = calculateSellingPrice(cost, Number(targetMarginPercent), Boolean(isOffer));
    price = calc.sellingPrice;
  }

  // Strict Loss Prevention Gate
  const validation = validateServicePriceUpdate({
    originalProviderCost: cost,
    newPrice: price,
    isOffer: Boolean(isOffer),
  });

  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  service.originalProviderCost = Math.round(cost * 100) / 100;
  service.pricePer1000 = Math.round(price * 100) / 100;
  if (active !== undefined) service.active = Boolean(active);
  if (isAvailable !== undefined) service.isAvailable = Boolean(isAvailable);
  service.isOffer = Boolean(isOffer);

  if (service.isOffer) {
    if (anchorPrice && Number(anchorPrice) > service.pricePer1000) {
      service.originalPriceBeforeDiscount = Number(anchorPrice);
      service.discountPercent = Math.round(
        ((service.originalPriceBeforeDiscount - service.pricePer1000) / service.originalPriceBeforeDiscount) * 100
      );
    } else {
      const calc = calculateSellingPrice(service.originalProviderCost, 30, true);
      service.originalPriceBeforeDiscount = calc.originalPriceBeforeDiscount;
      service.discountPercent = calc.discountPercent;
    }
  } else {
    service.originalPriceBeforeDiscount = undefined;
    service.discountPercent = undefined;
  }

  saveDatabase(db);

  const profitAmount = Math.round((service.pricePer1000 - service.originalProviderCost) * 100) / 100;
  const marginPercent = service.originalProviderCost > 0
    ? Math.round(((service.pricePer1000 - service.originalProviderCost) / service.originalProviderCost) * 10000) / 100
    : 100;

  return res.json({
    success: true,
    message: `تم تحديث سعر الخدمة بنجاح: سعر البيع ${service.pricePer1000.toFixed(2)} ج.م (هامش ربح %${marginPercent} وصافي ربح ${profitAmount.toFixed(2)} ج.م)`,
    service,
    profitAmount,
    marginPercent,
  });
});

// Bulk margin update tool across social services, gaming, category, or all
app.post('/api/admin/services/bulk-margin', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { target, categoryId, marginPercent, applyFakeAnchor } = req.body;
  // target: 'social' | 'gaming' | 'category' | 'all'
  const margin = Number(marginPercent);
  if (isNaN(margin) || margin < 0) {
    return res.status(400).json({ error: 'نسبة هامش الربح يجب أن تكون رقماً أكبر من أو يساوي صفر' });
  }

  const db = getDatabase();
  let affectedServices: Service[] = [];

  db.services = db.services.map((s) => {
    // Strictly preserve ready accounts (حسابات جاهزة) with bespoke pricing
    if (s.isAccountSale) return s;

    const isGaming = GAMING_CATEGORY_IDS.includes(s.categoryId);
    let shouldUpdate = false;

    if (target === 'social' && !isGaming) {
      shouldUpdate = true;
    } else if (target === 'gaming' && isGaming) {
      shouldUpdate = true;
    } else if (target === 'category' && s.categoryId === categoryId) {
      shouldUpdate = true;
    } else if (target === 'all') {
      shouldUpdate = true;
    }

    if (!shouldUpdate) return s;

    const cost = s.originalProviderCost && s.originalProviderCost > 0
      ? s.originalProviderCost
      : (s.pricePer1000 > 0 ? s.pricePer1000 / (1 + (isGaming ? 0.08 : 0.3)) : s.pricePer1000);

    const isOffer = applyFakeAnchor !== undefined ? Boolean(applyFakeAnchor) : Boolean(s.isOffer);
    const calc = calculateSellingPrice(cost, margin, isOffer);

    const updated: Service = {
      ...s,
      originalProviderCost: Math.round(cost * 100) / 100,
      pricePer1000: calc.sellingPrice,
      isOffer,
      originalPriceBeforeDiscount: calc.originalPriceBeforeDiscount,
      discountPercent: calc.discountPercent,
    };
    affectedServices.push(updated);
    return updated;
  });

  saveDatabase(db);

  return res.json({
    success: true,
    message: `تم تطبيق هامش ربح %${margin} بنجاح على ${affectedServices.length} خدمة`,
    affectedCount: affectedServices.length,
    services: db.services,
  });
});

app.delete('/api/admin/services/:id', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  db.services = db.services.filter((s) => s.id !== id);
  saveDatabase(db);
  return res.json({ success: true });
});

// Update dynamic profit margin for an entire category and batch-update its services
app.post('/api/admin/categories/:id/margin', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { marginPercent, offerMarginPercent } = req.body;

  const margin = Number(marginPercent);
  if (isNaN(margin) || margin < 0) {
    return res.status(400).json({ error: 'نسبة هامش الربح يجب أن تكون رقماً أكبر من أو يساوي صفر' });
  }

  const db = getDatabase();
  const category = db.categories.find((c) => c.id === id);
  if (!category) return res.status(404).json({ error: 'الفئة غير موجودة' });

  category.profitMarginPercent = margin;
  db.services = applyCategoryMarginToServices(db.services, category.id, margin);
  saveDatabase(db);

  const affectedCount = db.services.filter((s) => s.categoryId === category.id).length;

  return res.json({
    success: true,
    message: `تم تحديث هامش الربح لفئة (${category.name}) إلى %${margin} وتعديل أسعار ${affectedCount} خدمة بنجاح`,
    category,
    affectedCount,
  });
});

// Recalibrate all services to verified official margins (+30% social, +5% gaming with fake discount offers)
app.post('/api/admin/pricing/recalibrate-defaults', authenticate, requireAdmin, (_req: Request, res: Response) => {
  const db = getDatabase();

  db.categories.forEach((cat) => {
    const isGaming = GAMING_CATEGORY_IDS.includes(cat.id);
    const targetMargin = isGaming ? 5 : 30;
    cat.profitMarginPercent = targetMargin;
    db.services = applyCategoryMarginToServices(db.services, cat.id, targetMargin);
  });

  saveDatabase(db);

  return res.json({
    success: true,
    message: 'تمت إعادة ضبط واعتماد تسعير جميع الخدمات بنجاح (+30% للسوشيال وتيك توك، +5% للألعاب)',
    totalServices: db.services.length,
    categories: db.categories,
  });
});

// Admin Payment Methods CRUD
app.post('/api/admin/payment-methods', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { name, category, instructions, accountNumberOrDetails, currency, minDeposit, maxDeposit, feePercentage, icon } = req.body;
  if (!name || !accountNumberOrDetails) {
    return res.status(400).json({ error: 'اسم الطريقة وبيانات الحساب مطلوبة' });
  }

  const db = getDatabase();
  const newPm: PaymentMethod = {
    id: `pm_${Date.now()}`,
    name: name.trim(),
    category: category || 'wallet',
    instructions: instructions || '',
    accountNumberOrDetails: accountNumberOrDetails.trim(),
    currency: currency || 'USD',
    minDeposit: Number(minDeposit) || 5,
    maxDeposit: Number(maxDeposit) || 1000,
    feePercentage: Number(feePercentage) || 0,
    isActive: true,
    icon: icon || 'CreditCard',
  };

  db.paymentMethods.push(newPm);
  saveDatabase(db);
  return res.json({ success: true, paymentMethod: newPm });
});

app.put('/api/admin/payment-methods/:id', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const pm = db.paymentMethods.find((m) => m.id === id);
  if (!pm) return res.status(404).json({ error: 'طريقة الدفع غير موجودة' });

  Object.assign(pm, req.body);
  saveDatabase(db);
  return res.json({ success: true, paymentMethod: pm });
});

// Admin Provider Settings
app.get('/api/admin/provider-settings', authenticate, requireAdmin, (_req: Request, res: Response) => {
  const db = getDatabase();
  return res.json({ settings: db.providerSettings });
});

app.put('/api/admin/provider-settings', authenticate, requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  const { apiUrl, apiKey, isTestMode, autoForwardOrders } = req.body;

  if (apiUrl) db.providerSettings.apiUrl = apiUrl.trim();
  if (apiKey !== undefined) db.providerSettings.apiKey = apiKey.trim();
  if (isTestMode !== undefined) db.providerSettings.isTestMode = Boolean(isTestMode);
  if (autoForwardOrders !== undefined) db.providerSettings.autoForwardOrders = Boolean(autoForwardOrders);

  saveDatabase(db);
  return res.json({ success: true, settings: db.providerSettings });
});

app.post('/api/admin/provider-settings/test', authenticate, requireAdmin, async (_req: Request, res: Response) => {
  const db = getDatabase();
  const result = await testProviderConnection(db.providerSettings);

  db.providerSettings.lastTestedAt = new Date().toISOString();
  db.providerSettings.lastTestStatus = result.success ? 'success' : 'failed';
  db.providerSettings.lastTestMessage = result.message;
  if (result.balance !== undefined) {
    db.providerSettings.balance = result.balance;
  }
  saveDatabase(db);

  return res.json({ result, settings: db.providerSettings });
});

// Admin Tickets
app.get('/api/admin/tickets', authenticate, requireAdmin, (_req: Request, res: Response) => {
  const db = getDatabase();
  const sorted = [...db.tickets].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  return res.json({ tickets: sorted });
});

app.patch('/api/admin/tickets/:id/status', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = getDatabase();

  const ticket = db.tickets.find((t) => t.id === id);
  if (!ticket) return res.status(404).json({ error: 'التذكرة غير موجودة' });

  ticket.status = status;
  ticket.updatedAt = new Date().toISOString();
  saveDatabase(db);

  return res.json({ success: true, ticket });
});

// ----------------------------------------------------
// NOTIFICATIONS & EMAILS ROUTES
// ----------------------------------------------------

app.get('/api/notifications', authenticate, (req: Request, res: Response) => {
  const db = getDatabase();
  const userNotifs = (db.notifications || [])
    .filter((n) => n.userId === req.user!.userId || n.userId === 'all')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unreadCount = userNotifs.filter((n) => !n.read).length;
  return res.json({ notifications: userNotifs, unreadCount });
});

app.patch('/api/notifications/:id/read', authenticate, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const notif = (db.notifications || []).find((n) => n.id === id);
  if (notif) {
    notif.read = true;
    saveDatabase(db);
  }
  return res.json({ success: true, notification: notif });
});

app.patch('/api/notifications/read-all', authenticate, (req: Request, res: Response) => {
  const db = getDatabase();
  (db.notifications || []).forEach((n) => {
    if (n.userId === req.user!.userId || n.userId === 'all') {
      n.read = true;
    }
  });
  saveDatabase(db);
  return res.json({ success: true });
});

app.get('/api/emails', authenticate, (req: Request, res: Response) => {
  const db = getDatabase();
  const userEmails = (db.emailLogs || [])
    .filter((e) => req.user!.role === 'admin' || e.userId === req.user!.userId)
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  return res.json({ emails: userEmails });
});

app.post('/api/admin/announcements', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { title, message } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'عنوان الإعلان ومحتواه مطلوبان' });
  }
  notifyBroadcastAnnouncement(title.trim(), message.trim());
  return res.json({ success: true, message: 'تم بث الإعلان لجميع المستخدمين وإرسال الإشعارات والبريد' });
});

// ----------------------------------------------------
// PWA & WEB PUSH NOTIFICATION ENDPOINTS
// ----------------------------------------------------

const PUSH_SUBS_FILE = path.resolve(process.cwd(), 'data', 'push_subscriptions.json');

interface PushSubscriptionData {
  endpoint: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
  userId?: string;
  role: 'admin' | 'user';
  createdAt: string;
  userAgent?: string;
}

function getStoredPushSubscriptions(): PushSubscriptionData[] {
  if (fs.existsSync(PUSH_SUBS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PUSH_SUBS_FILE, 'utf8'));
    } catch {
      return [];
    }
  }
  return [];
}

function saveStoredPushSubscriptions(subs: PushSubscriptionData[]): void {
  try {
    fs.writeFileSync(PUSH_SUBS_FILE, JSON.stringify(subs, null, 2), 'utf8');
  } catch (err) {
    console.error('[PUSH] Failed to save subscriptions:', err);
  }
}

app.post('/api/push/subscribe', (req: Request, res: Response) => {
  const { subscription, role } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'بيانات الاشتراك في الإشعارات غير مكتملة' });
  }

  const subs = getStoredPushSubscriptions();
  const existingIdx = subs.findIndex((s) => s.endpoint === subscription.endpoint);
  const authHeader = req.headers.authorization;
  let userId: string | undefined = undefined;
  let userRole: 'admin' | 'user' = role === 'admin' ? 'admin' : 'user';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const payload = verifyToken(authHeader.split(' ')[1], JWT_SECRET);
    if (payload) {
      userId = payload.userId;
      userRole = payload.role === 'admin' ? 'admin' : 'user';
    }
  }

  const newSub: PushSubscriptionData = {
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    userId,
    role: userRole,
    createdAt: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
  };

  if (existingIdx >= 0) {
    subs[existingIdx] = newSub;
  } else {
    subs.push(newSub);
  }

  saveStoredPushSubscriptions(subs);
  return res.json({
    success: true,
    message: 'تم ربط إشعارات الهاتف الفورية (Web Push) وتفعيل استقبال التنبيهات على الجهاز بنجاح!',
  });
});

app.get('/api/push/status', (_req: Request, res: Response) => {
  const subs = getStoredPushSubscriptions();
  const adminSubs = subs.filter((s) => s.role === 'admin');
  return res.json({
    active: true,
    totalSubscriptions: subs.length,
    adminSubscribed: adminSubs.length > 0,
    provider: 'Web Push / PWA External Push Service (KOUMND Push Relay)',
  });
});

app.post('/api/push/test', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { title, body } = req.body;
  const subs = getStoredPushSubscriptions();

  sendRealtimeNotification(
    'all',
    'admin_alert',
    title || 'اختبار إشعار فوري على الهاتف 🔔',
    body || 'تم إرسال هذا الإشعار لتأكيد عمل التنبيهات الفورية على شاشة الهاتف والقفل بنجاح!',
    '/admin'
  );

  return res.json({
    success: true,
    message: `تم إطلاق الإشعار الفوري لجميع المتصلين (${subs.length} اشتراك مسجل)`,
  });
});

// ----------------------------------------------------
// VITE DEV SERVER OR STATIC PROD SERVING + WEBSOCKETS
// ----------------------------------------------------

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const server = http.createServer(app);

  // Real-time WebSocket Server attached using noServer to allow co-existing with Vite WebSocket
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    try {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      if (url.pathname === '/ws') {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req);
        });
      }
      // Note: Non-/ws upgrades (such as Vite HMR) are handled by Vite's own upgrade listener
    } catch {
      // Ignore URL parsing errors
    }
  });

  wss.on('connection', (ws, req) => {
    try {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      if (token) {
        const payload = verifyToken(token, JWT_SECRET);
        if (payload) {
          registerWebSocketClient(payload.userId, ws);
          ws.send(JSON.stringify({ event: 'connected', message: 'اتصال الإشعارات الحية نشط' }));
          return;
        }
      }
      ws.close(4001, 'Unauthorized');
    } catch {
      ws.close(4000, 'Error');
    }
  });

  app.use(express.static(path.resolve(__dirname, 'public')));

  // Guarantee that any unhandled or missing /api/* endpoint ALWAYS returns a JSON 404, NEVER Vite's index.html <!doctype
  app.all('/api/*', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'المسار البرمجي غير موجود أو غير صالح' });
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      configFile: path.resolve(__dirname, 'vite.config.ts'),
      server: {
        middlewareMode: true,
        ws: {
          server,
        },
        hmr: {
          server,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`KOUMND Server listening on port ${PORT} (mode: ${isProd ? 'production' : 'development'}, ws: enabled)`);
  });
}

startServer();
