const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf8');

const target = `app.patch('/api/admin/orders/:id/status', authenticate, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, remains, startCount } = req.body;
  const db = getDatabase();
  const order = db.orders.find((o) => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'الطلب غير موجود' });
  }

  if (status) {
    order.status = status;
    const user = db.users.find((u) => u.id === order.userId);
    if (user) {
      notifyOrderStatusChange(user, order.orderNumber, order.serviceName, status);
    }
  }

  if (remains !== undefined) order.remains = Number(remains);
  if (startCount !== undefined) order.startCount = Number(startCount);
  order.updatedAt = new Date().toISOString();
  saveDatabase(db);

  return res.json({ success: true, order });
});`;

const replacement = `app.patch('/api/admin/orders/:id/status', authenticate, requireAdmin, (req: Request, res: Response) => {
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

  let cleanPhone = customerPhone.replace(/\\D/g, '');
  if (cleanPhone.startsWith('01')) {
    cleanPhone = '2' + cleanPhone;
  }

  const whatsappUrl = cleanPhone.length >= 10
    ? \`https://wa.me/\${cleanPhone}?text=\${encodeURIComponent(message.trim())}\`
    : undefined;

  return res.json({
    success: true,
    message: 'تم إرسال الإشعار الخارجي إلى هاتف العميل بنجاح!',
    sms,
    whatsappUrl,
  });
});`;

if (server.includes(target)) {
  server = server.replace(target, replacement);
  fs.writeFileSync('server.ts', server, 'utf8');
  console.log('PATCH_OK');
} else {
  console.log('TARGET_NOT_FOUND');
}
