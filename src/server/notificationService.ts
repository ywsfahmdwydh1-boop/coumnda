import { WebSocket } from 'ws';
import { getDatabase, saveDatabase } from './db.ts';
import { AppNotification, EmailNotification, NotificationType, User, SmsNotification, Order } from '../types/index.ts';

// Connected clients mapped by userId
const activeClients = new Map<string, Set<WebSocket>>();

export function registerWebSocketClient(userId: string, ws: WebSocket) {
  if (!activeClients.has(userId)) {
    activeClients.set(userId, new Set());
  }
  activeClients.get(userId)!.add(ws);

  ws.on('close', () => {
    const userSockets = activeClients.get(userId);
    if (userSockets) {
      userSockets.delete(ws);
      if (userSockets.size === 0) {
        activeClients.delete(userId);
      }
    }
  });
}

/**
 * Send real-time notification to a specific user or broadcast to all.
 */
export function sendRealtimeNotification(
  userId: string | 'all',
  type: NotificationType,
  title: string,
  message: string,
  link?: string
): AppNotification {
  const db = getDatabase();
  if (!db.notifications) {
    db.notifications = [];
  }

  const notification: AppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    type,
    title,
    message,
    link,
    read: false,
    createdAt: new Date().toISOString(),
  };

  db.notifications.unshift(notification);
  saveDatabase(db);

  // Broadcast via WebSocket
  const payload = JSON.stringify({ event: 'notification', data: notification });

  if (userId === 'all') {
    activeClients.forEach((sockets) => {
      sockets.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
        }
      });
    });
  } else {
    const userSockets = activeClients.get(userId);
    if (userSockets) {
      userSockets.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
        }
      });
    }
  }

  return notification;
}

/**
 * Send simulated/logged email notification with responsive Arabic HTML template.
 */
export function sendEmailNotification(
  userId: string,
  userEmail: string,
  eventType: NotificationType,
  subject: string,
  headline: string,
  bodyParagraphs: string[],
  actionBtn?: { label: string; url: string }
): EmailNotification {
  const db = getDatabase();
  if (!db.emailLogs) {
    db.emailLogs = [];
  }

  const htmlBody = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Cairo', Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; direction: rtl; text-align: right; }
        .container { max-width: 580px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; }
        .header { text-align: center; border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 24px; }
        .logo { font-size: 24px; font-weight: 900; color: #6366f1; letter-spacing: 2px; }
        .tagline { font-size: 12px; color: #94a3b8; margin-top: 4px; }
        .content { font-size: 14px; line-height: 1.8; color: #cbd5e1; }
        .headline { font-size: 18px; font-weight: bold; color: #ffffff; margin-bottom: 16px; }
        .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; margin-top: 20px; }
        .footer { border-top: 1px solid #334155; margin-top: 32px; padding-top: 16px; text-align: center; font-size: 11px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">KOUMND</div>
          <div class="tagline">منصة الخدمات الرقمية وشحن الأرصدة</div>
        </div>
        <div class="content">
          <div class="headline">${headline}</div>
          ${bodyParagraphs.map((p) => `<p>${p}</p>`).join('')}
          ${actionBtn ? `<div style="text-align: center;"><a href="${actionBtn.url}" class="btn">${actionBtn.label}</a></div>` : ''}
        </div>
        <div class="footer">
          هذه رسالة آلية صادرة من نظام منصة KOUMND. لا تقم بالرد المباشر على هذه الرسالة.
        </div>
      </div>
    </body>
    </html>
  `.trim();

  const textBody = bodyParagraphs.join('\n\n');

  const emailLog: EmailNotification = {
    id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    userEmail,
    subject,
    htmlBody,
    textBody,
    status: 'delivered',
    eventType,
    sentAt: new Date().toISOString(),
  };

  db.emailLogs.unshift(emailLog);
  saveDatabase(db);

  return emailLog;
}

// -----------------------------------------------------------------

/**
 * Send simulated and logged SMS / WhatsApp notification to phone or email identifier.
 */
export function sendSmsNotification(
  recipientPhoneOrEmail: string,
  recipientName: string,
  recipientRole: 'admin' | 'user',
  message: string,
  referenceOrderId?: string,
  channel: 'SMS' | 'WhatsApp' = 'SMS'
): SmsNotification {
  const db = getDatabase();
  if (!db.smsLogs) {
    db.smsLogs = [];
  }
  const smsLog: SmsNotification = {
    id: `sms_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    recipientPhoneOrEmail,
    recipientName,
    recipientRole,
    message,
    status: 'delivered',
    channel,
    referenceOrderId,
    sentAt: new Date().toISOString(),
  };
  db.smsLogs.unshift(smsLog);
  saveDatabase(db);
  return smsLog;
}

/**
 * Alert Admin externally whenever ANY order is placed on the site.
 * Sends:
 * - SMS / Phone dispatch to Admin phone (01556266856)
 * - Urgent Email to Admin (ywsfahmdwydh1@gmail.com)
 * - Web Push / WebSocket Native Alert to open Admin screens
 */
export function notifyAdminNewOrderAlert(
  order: Order,
  customer: User,
  serviceName: string
) {
  const adminPhone = '01556266856';
  const adminEmail = 'ywsfahmdwydh1@gmail.com';

  // 1. Send external SMS dispatch to Admin Phone
  const smsMsg = `🚨 طلب جديد في KOUMND! رقم: #${order.orderNumber} | العميل: ${customer.username} (${customer.phone || customer.email}) | الخدمة: ${serviceName} | الكمية: ${order.quantity} | المبلغ: ${order.charge.toFixed(2)} ج.م | الرابط/ID: ${order.link}`;
  sendSmsNotification(adminPhone, 'إدارة KOUMND (يوسف)', 'admin', smsMsg, order.id, 'SMS');

  // 2. Send external Email to Admin
  sendEmailNotification(
    'usr_admin_youssef',
    adminEmail,
    'admin_order_alert',
    `🚨 تنبيه طلب جديد #${order.orderNumber} - ${serviceName}`,
    `وصلك طلب جديد رقم #${order.orderNumber} من ${customer.username}`,
    [
      'مرحباً يوسف، وصلك طلب جديد عبر منصة KOUMND:',
      `• رقم الطلب: #${order.orderNumber}`,
      `• اسم العميل: ${customer.username} (${customer.phone || customer.email})`,
      `• الخدمة المطلوبة: ${serviceName}`,
      `• الكمية: ${order.quantity}`,
      `• القيمة المدفوعة: ${order.charge.toFixed(2)} ج.م`,
      `• الرابط أو معرف اللاعب (ID): ${order.link}`,
      `• تاريخ الطلب: ${new Date().toLocaleString('ar-EG')}`,
      'يرجى الدخول للوحة التحكم لمتابعة التنفيذ وتحديث حالة الطلب.',
    ],
    { label: 'فتح لوحة التحكم', url: '/admin' }
  );

  // 3. Real-time Native Push Notification via WebSocket to all connected Admin screens
  const adminNotif = sendRealtimeNotification(
    'usr_admin_youssef',
    'admin_order_alert',
    `🚨 طلب جديد #${order.orderNumber}! (${order.charge.toFixed(2)} ج.م)`,
    `طلب جديد من ${customer.username}: ${serviceName} (الكمية: ${order.quantity})`,
    '/admin'
  );

  // Broadcast external admin alert with sound/vibration flag
  const alertPayload = JSON.stringify({
    event: 'admin_external_alert',
    data: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      serviceName,
      customerName: customer.username,
      charge: order.charge,
      link: order.link,
      phone: customer.phone || customer.email,
    },
  });

  activeClients.forEach((sockets) => {
    sockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(alertPayload);
      }
    });
  });

  return adminNotif;
}

// HIGH-LEVEL EVENT DISPATCHERS
// -----------------------------------------------------------------

export function notifyRegistrationSuccess(user: { id: string; email: string; username: string }) {
  sendRealtimeNotification(
    user.id,
    'registration',
    'مرحباً بك في منصة KOUMND! 🎉',
    `أهلاً بك يا ${user.username}! تم إنشاء وتفعيل حسابك بنجاح. يمكنك الآن استعراض الخدمات وشحن رصيدك للبدء فوراً.`,
    '/services'
  );

  sendEmailNotification(
    user.id,
    user.email,
    'registration',
    'أهلاً بك في KOUMND - تم تفعيل حسابك بنجاح!',
    `مرحباً بك ${user.username}!`,
    [
      'يسرنا انضمامك إلى منصة KOUMND لخدمات التواصل الاجتماعي والحلول الرقمية.',
      'حسابك الآن مفعل بالكامل، وتستطيع شحن رصيدك عبر وسائل دفع متعددة والبدء في تنفيذ طلباتك الفورية بأعلى سرعة وضمان.',
    ],
    { label: 'استعراض متجر الخدمات', url: '#' }
  );
}

export function notifyDepositApproved(user: User, amount: number, paymentMethodName: string) {
  // 1. External SMS to customer phone
  const customerPhone = user.phone || user.email;
  sendSmsNotification(
    customerPhone,
    user.username,
    'user',
    `📱 رسالة من KOUMND: تم التحقق والموافقة على إيداع مبلغ ${amount.toFixed(2)} ج.م عبر ${paymentMethodName} وإضافته لمحفظتك بنجاح! رصيدك المتاح الآن: ${user.balance.toFixed(2)} ج.م.`,
    undefined,
    'SMS'
  );

  sendRealtimeNotification(
    user.id,
    'deposit_approved',
    'تم تأكيد إيداع الرصيد بنجاح 💰',
    `تمت مراجعة عملية الإيداع وإضافة مبلغ ${amount.toFixed(2)} ج.م في محفظتك عبر ${paymentMethodName}. رصيدك الحالي: ${user.balance.toFixed(2)} ج.م`,
    '/wallet'
  );

  sendEmailNotification(
    user.id,
    user.email,
    'deposit_approved',
    `إشعار إيداع: تم شحن رصيدك بمبلغ ${amount.toFixed(2)} ج.م بنجاح`,
    'تمت الموافقة على طلب الإيداع وتغذية المحفظة',
    [
      `مرحباً ${user.username}،`,
      `تمت مراجعة وتأكيد عملية الإيداع الخاصة بك بنجاح عبر ${paymentMethodName}، وإضافة مبلغ ${amount.toFixed(2)} ج.م إلى محفظتك في KOUMND.`,
      `رصيدك المتاح الحالي: ${user.balance.toFixed(2)} ج.م. يمكنك الآن البدء في طلب الخدمات وشحن الألعاب فوراً.`,
    ],
    { label: 'عرض المحفظة والطلبات', url: '#' }
  );
}

export function notifyDepositRejected(user: User, amount: number, reason: string) {
  // 1. External SMS to customer phone
  const customerPhone = user.phone || user.email;
  sendSmsNotification(
    customerPhone,
    user.username,
    'user',
    `📱 رسالة من KOUMND: تعذر قبول طلب الإيداع بمبلغ ${amount.toFixed(2)} ج.م. السبب: ${reason}. يمكنك التواصل مع الدعم الفني للمساعدة.`,
    undefined,
    'SMS'
  );

  sendRealtimeNotification(
    user.id,
    'deposit_rejected',
    'تنبيه بخصوص طلب الإيداع ⚠️',
    `تعذر تأكيد طلب الإيداع بمبلغ ${amount.toFixed(2)} ج.م. السبب: ${reason}`,
    '/wallet'
  );

  sendEmailNotification(
    user.id,
    user.email,
    'deposit_rejected',
    'تنبيه بخصوص طلب إيداع الرصيد في KOUMND',
    'لم نتمكن من تأكيد عملية الإيداع',
    [
      `عزيزي ${user.username}،`,
      `نود إبلاغك بأنه تعذر قبول طلب الإيداع بمبلغ ${amount.toFixed(2)} ج.م لعدم مطابقة بيانات التحويل أو الإيصال.`,
      `ملاحظات الإدارة: ${reason}`,
      'يرجى مراجعة رقم المحفظة وبيانات التحويل وإعادة تقديم الطلب، أو التواصل مع الدعم الفني.',
    ],
    { label: 'مراجعة المحفظة', url: '#' }
  );
}

export function notifyAdminNewDepositAlert(deposit: any, user: User) {
  // Alert admin account in real-time
  sendRealtimeNotification(
    'all',
    'admin_alert',
    '🚨 طلب إيداع رصيد جديد بانتظار التحقق!',
    `طلب إيداع #${deposit.depositNumber} بمبلغ ${deposit.amount.toFixed(2)} ج.م من العميل ${user.username} (${deposit.paymentMethodName}).`,
    '/admin'
  );
}

export function notifyOrderPlaced(
  user: User,
  orderNumber: string,
  serviceName: string,
  charge: number,
  quantity: number
) {
  sendRealtimeNotification(
    user.id,
    'order_confirmed',
    `تم تأكيد استلام طلبك (#${orderNumber}) ⚡`,
    `تم خصم $${charge.toFixed(3)} وتمرير طلبك (${serviceName} - كمية ${quantity}) للسيرفر للبدء في التنفيذ.`,
    '/orders'
  );

  sendEmailNotification(
    user.id,
    user.email,
    'order_confirmed',
    `تأكيد الطلب #${orderNumber} في منصة KOUMND`,
    `تم استلام وتأكيد طلبك رقم #${orderNumber}`,
    [
      `عزيزي ${user.username}،`,
      `نشكرك على استخدام منصة KOUMND. تم استلام طلبك وتمريره فوراً للتنفيذ.`,
      `تفاصيل الطلب:`,
      `• الخدمة: ${serviceName}`,
      `• الكمية: ${quantity}`,
      `• التكلفة: $${charge.toFixed(3)}`,
      `• الرصيد المتبقي: $${user.balance.toFixed(2)}`,
    ],
    { label: 'متابعة حالة الطلب', url: '#' }
  );
}

export function notifyOrderStatusChange(
  user: User,
  orderNumber: string,
  serviceName: string,
  newStatus: string,
  adminNotes?: string
) {
  let statusArabic = newStatus;
  if (newStatus === 'completed') statusArabic = 'مكتمل بنجاح ✅';
  else if (newStatus === 'in_progress') statusArabic = 'قيد التنفيذ 🚀';
  else if (newStatus === 'canceled') statusArabic = 'ملغي ❌';
  else if (newStatus === 'refunded') statusArabic = 'مسترد لرصيدك 🔄';
  else if (newStatus === 'partial') statusArabic = 'مكتمل جزئياً ⏳';

  // 1. External SMS / Phone notification to customer
  const customerPhoneOrEmail = user.phone || user.email;
  const customerSmsMsg = `📱 رسالة من KOUMND: تم تحديث طلبك #${orderNumber} (${serviceName}) إلى: ${statusArabic}.${adminNotes ? ' ملاحظة الإدارة: ' + adminNotes : ''} شكراً لثقتكم بنا!`;
  sendSmsNotification(customerPhoneOrEmail, user.username, 'user', customerSmsMsg, undefined, 'SMS');

  // 2. Real-time App & Native Push Notification
  const notifMsg = `أصبحت حالة طلبك (${serviceName}) الآن: ${statusArabic}${adminNotes ? ' | رد الإدارة: ' + adminNotes : ''}`;
  sendRealtimeNotification(
    user.id,
    'order_status',
    `تحديث حالة الطلب (#${orderNumber}) 🔔`,
    notifMsg,
    '/orders'
  );

  // 3. WebSocket Event Broadcast for instant UI sync and native push
  const statusEventPayload = JSON.stringify({
    event: 'order_status_change',
    data: { orderNumber, serviceName, newStatus, adminNotes, userId: user.id },
  });
  activeClients.forEach((sockets) => {
    sockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(statusEventPayload);
      }
    });
  });

  // 4. External Email to customer
  sendEmailNotification(
    user.id,
    user.email,
    'order_status',
    `تحديث حالة الطلب #${orderNumber}: ${statusArabic}`,
    `تحديث جديد على طلبك رقم #${orderNumber}`,
    [
      `مرحباً ${user.username}،`,
      `تم تحديث حالة طلبك على الخدمة: ${serviceName}.`,
      `الحالة الجديدة: ${statusArabic}`,
      ...(adminNotes ? [`• رد الإدارة / بيانات التسليم: ${adminNotes}`] : []),
      'تم إرسال إشعار خارجي إلى هاتفك أيضاً لإعلامك فوراً.',
    ],
    { label: 'عرض تفاصيل الطلب', url: '/orders' }
  );
}

export function notifyBroadcastAnnouncement(title: string, message: string) {
  sendRealtimeNotification('all', 'announcement', `📢 إعلان إداري: ${title}`, message, '/services');

  // Also log email dispatch for all users
  const db = getDatabase();
  db.users.forEach((u) => {
    sendEmailNotification(
      u.id,
      u.email,
      'announcement',
      `إعلان إداري من KOUMND: ${title}`,
      title,
      [message],
      { label: 'زيارة المنصة', url: '#' }
    );
  });
}
