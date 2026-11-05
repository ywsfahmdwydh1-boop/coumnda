import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import {
  AdminStats,
  Order,
  DepositRequest,
  Service,
  Category,
  PaymentMethod,
  User,
  ProviderSettings,
  SupportTicket,
} from '../../types/index.ts';
import {
  ShieldAlert,
  BarChart3,
  ListOrdered,
  DollarSign,
  Layers,
  Users,
  Settings,
  Headphones,
  CheckCircle,
  XCircle,
  Bell,
  Clock,
  RotateCcw,
  Zap,
  Check,
  Search,
  Plus,
  RefreshCw,
  Send,
  AlertTriangle,
  Server,
  Lock,
  Filter,
  Edit2,
  Trash2,
  Tag,
  Sliders,
  Percent,
  ShieldCheck,
  TrendingUp,
  Calculator,
  Sparkles,
  ArrowUpRight,
  HelpCircle,
} from 'lucide-react';
import {
  validateServicePriceUpdate,
  calculateSellingPrice,
  getDefaultCategoryMargin,
  GAMING_CATEGORY_IDS,
  DEFAULT_SOCIAL_MARGIN_PERCENT,
  DEFAULT_GAMING_MARGIN_PERCENT,
} from '../../lib/pricingManager.ts';
import {
  subscribeToFirestoreOrders,
  subscribeToFirestoreUsers,
  subscribeToFirestoreDeposits,
  persistOrderToFirestore,
  persistUserToFirestore,
  persistDepositToFirestore,
  signInAdminWithGoogle,
  signOutFirebase,
  auth,
} from '../../lib/firebase.ts';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export const AdminDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const { subscribeToOrderUpdates } = useNotifications();

  const [currentSubTab, setCurrentSubTab] = useState<
    'stats' | 'orders' | 'deposits' | 'services' | 'users' | 'provider' | 'tickets'
  >('stats');

  const [orderFilter, setOrderFilter] = useState<'active' | 'finalized' | 'all'>('all');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [providerSettings, setProviderSettings] = useState<ProviderSettings | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Firestore Real-time Snapshots State
  const [firestoreActive, setFirestoreActive] = useState<boolean>(false);
  const [firebaseAdmin, setFirebaseAdmin] = useState<FirebaseUser | null>(null);
  const [isSyncingAllFirestore, setIsSyncingAllFirestore] = useState<boolean>(false);
  const [firestoreSyncCount, setFirestoreSyncCount] = useState<{ orders: number; users: number }>({ orders: 0, users: 0 });

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Deposit review state
  const [processingDepositId, setProcessingDepositId] = useState<string | null>(null);
  const [depositNotes, setDepositNotes] = useState<{ [key: string]: string }>({});

  // Manual balance adjust modal/state
  const [adjustUser, setAdjustUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('10');
  const [adjustAction, setAdjustAction] = useState<'add' | 'deduct'>('add');
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // SMS Reply Modal State
  const [replyOrder, setReplyOrder] = useState<Order | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replySuccessMsg, setReplySuccessMsg] = useState<string | null>(null);
  const [replyWhatsappUrl, setReplyWhatsappUrl] = useState<string | null>(null);

  // New Service Modal/Form state
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCat, setNewServiceCat] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('25.00');
  const [newServiceCost, setNewServiceCost] = useState('20.00');
  const [newServiceMin, setNewServiceMin] = useState('50');
  const [newServiceMax, setNewServiceMax] = useState('50000');
  const [newServiceSpeed, setNewServiceSpeed] = useState('سريع (خلال دقائق)');
  const [newServiceDesc, setNewServiceDesc] = useState('');

  // Edit Service Modal & Search state
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editServiceName, setEditServiceName] = useState('');
  const [editServiceCat, setEditServiceCat] = useState('');
  const [editServicePrice, setEditServicePrice] = useState('');
  const [editServiceCost, setEditServiceCost] = useState('');
  const [editServiceMin, setEditServiceMin] = useState('');
  const [editServiceMax, setEditServiceMax] = useState('');
  const [editServiceSpeed, setEditServiceSpeed] = useState('');
  const [editServiceDesc, setEditServiceDesc] = useState('');
  const [editServiceActive, setEditServiceActive] = useState(true);
  const [editServiceIsOffer, setEditServiceIsOffer] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Services filtering in Admin
  const [adminServiceSearch, setAdminServiceSearch] = useState('');
  const [adminServiceCatFilter, setAdminServiceCatFilter] = useState('all');
  const [adminMarginFilter, setAdminMarginFilter] = useState<
    'all' | 'healthy' | 'low' | 'gaming' | 'social' | 'offers' | 'accounts' | 'unavailable'
  >('all');

  // Quick Pricing & Profit Margin Modal State
  const [pricingModalService, setPricingModalService] = useState<Service | null>(null);
  const [pricingCost, setPricingCost] = useState('');
  const [pricingPrice, setPricingPrice] = useState('');
  const [pricingTargetMargin, setPricingTargetMargin] = useState('');
  const [pricingIsOffer, setPricingIsOffer] = useState(false);
  const [pricingAnchorPrice, setPricingAnchorPrice] = useState('');
  const [pricingIsAvailable, setPricingIsAvailable] = useState(true);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [pricingValidationError, setPricingValidationError] = useState<string | null>(null);

  // Bulk Margins Tool State
  const [bulkMarginCategory, setBulkMarginCategory] = useState<string>('social');
  const [bulkMarginPercent, setBulkMarginPercent] = useState<string>('30');
  const [bulkApplyFakeAnchor, setBulkApplyFakeAnchor] = useState<boolean>(true);
  const [isApplyingBulkMargin, setIsApplyingBulkMargin] = useState<boolean>(false);
  const [showBulkMarginPanel, setShowBulkMarginPanel] = useState<boolean>(false);

  // Provider Settings form state
  const [provApiUrl, setProvApiUrl] = useState('');
  const [provApiKey, setProvApiKey] = useState('');
  const [provTestMode, setProvTestMode] = useState(true);
  const [provAutoForward, setProvAutoForward] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Broadcast Announcement State
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementMsg.trim() || !token) return;
    setBroadcasting(true);
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: announcementTitle, message: announcementMsg }),
      });
      if (res.ok) {
        showToast('success', 'تم بث الإعلان بنجاح وإرسال الإشعارات اللحظية والبريد الإلكتروني للعملاء');
        setAnnouncementTitle('');
        setAnnouncementMsg('');
      } else {
        showToast('error', 'فشل بث الإعلان');
      }
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setBroadcasting(false);
    }
  };

  const [testingPush, setTestingPush] = useState(false);
  const handleTestPushNotification = async () => {
    if (!token) return;
    setTestingPush(true);
    try {
      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: '🚨 تنبيه إداري فوري (طلب جديد تجريبي)',
          body: 'تم استلام طلب جديد #ORD-9999 - شدات ببجي موبايل 60 UC بقيمة 57.75 ج.م',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', data.message || 'تم إطلاق الإشعار الفوري للهاتف بنجاح!');
      } else {
        showToast('error', data.error || 'فشل إرسال الإشعار');
      }
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setTestingPush(false);
    }
  };

  const fetchAllAdminData = async () => {
    if (!token || user?.role !== 'admin') return;
    setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [
        statsRes,
        ordersRes,
        depsRes,
        servsRes,
        catsRes,
        usersRes,
        provRes,
        tktRes,
      ] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/orders', { headers }),
        fetch('/api/admin/deposits', { headers }),
        fetch('/api/services'),
        fetch('/api/categories'),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/provider-settings', { headers }),
        fetch('/api/admin/tickets', { headers }),
      ]);

      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();
      const depsData = await depsRes.json();
      const servsData = await servsRes.json();
      const catsData = await catsRes.json();
      const usersData = await usersRes.json();
      const provData = await provRes.json();
      const tktData = await tktRes.json();

      setStats(statsData.stats);
      setOrders(ordersData.orders || []);
      setDeposits(depsData.deposits || []);
      setServices(servsData.services || []);
      setCategories(catsData.categories || []);
      setUsers(usersData.users || []);
      setProviderSettings(provData.settings);
      setTickets(tktData.tickets || []);

      if (provData.settings) {
        setProvApiUrl(provData.settings.apiUrl);
        setProvApiKey(provData.settings.apiKey);
        setProvTestMode(provData.settings.isTestMode);
        setProvAutoForward(provData.settings.autoForwardOrders);
      }

      if (catsData.categories && catsData.categories.length > 0 && !newServiceCat) {
        setNewServiceCat(catsData.categories[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Listen to Firebase Auth state for Admin Google credentials
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseAdmin(fbUser);
      if (fbUser && fbUser.email === 'ywsfahmdwydh1@gmail.com') {
        setFirestoreActive(true);
      }
    });
    return () => unsubAuth();
  }, []);

  // Real-time Firestore snapshots + WebSocket listener
  useEffect(() => {
    fetchAllAdminData();

    // 1. Subscribe directly to Firestore orders in real-time
    const unsubFirestoreOrders = subscribeToFirestoreOrders(
      (firestoreOrders) => {
        if (firestoreOrders && firestoreOrders.length > 0) {
          setOrders((prev) => {
            const map = new Map<string, Order>();
            // Keep existing orders in memory so no record is ever lost
            prev.forEach((o) => map.set(o.id, o));
            // Layer Firestore live updates on top
            firestoreOrders.forEach((o) => map.set(o.id, o));
            return Array.from(map.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });
          setFirestoreActive(true);
          setFirestoreSyncCount((c) => ({ ...c, orders: firestoreOrders.length }));
        }
      },
      (err) => {
        console.warn('[Firestore] Real-time orders waiting for admin sync:', err.message);
      }
    );

    // 2. Subscribe directly to Firestore users in real-time
    const unsubFirestoreUsers = subscribeToFirestoreUsers(
      (firestoreUsers) => {
        if (firestoreUsers && firestoreUsers.length > 0) {
          setUsers((prev) => {
            const map = new Map<string, User>();
            prev.forEach((u) => map.set(u.id, u));
            firestoreUsers.forEach((u) => map.set(u.id, u));
            return Array.from(map.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });
          setFirestoreActive(true);
          setFirestoreSyncCount((c) => ({ ...c, users: firestoreUsers.length }));
        }
      },
      (err) => {
        console.warn('[Firestore] Real-time users waiting for admin sync:', err.message);
      }
    );

    // 3. Subscribe directly to Firestore deposits in real-time
    const unsubFirestoreDeposits = subscribeToFirestoreDeposits(
      (firestoreDeps) => {
        if (firestoreDeps && firestoreDeps.length > 0) {
          setDeposits((prev) => {
            const map = new Map<string, DepositRequest>();
            prev.forEach((d) => map.set(d.id, d));
            firestoreDeps.forEach((d) => map.set(d.id, d));
            return Array.from(map.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });
        }
      },
      (err) => {
        console.warn('[Firestore] Real-time deposits listener:', err.message);
      }
    );

    // 4. WebSocket stream for instant updates
    const unsubWs = subscribeToOrderUpdates(() => {
      fetchAllAdminData();
    });

    const interval = setInterval(fetchAllAdminData, 10000);

    return () => {
      unsubFirestoreOrders();
      unsubFirestoreUsers();
      unsubFirestoreDeposits();
      unsubWs();
      clearInterval(interval);
    };
  }, [token, user, subscribeToOrderUpdates]);

  // Synchronize all current memory/disk records to Firestore collections
  const handleSyncAllToFirestore = async () => {
    setIsSyncingAllFirestore(true);
    let ordersSuccess = 0;
    let usersSuccess = 0;

    for (const order of orders) {
      const ok = await persistOrderToFirestore(order);
      if (ok) ordersSuccess++;
    }

    for (const u of users) {
      const ok = await persistUserToFirestore(u);
      if (ok) usersSuccess++;
    }

    setIsSyncingAllFirestore(false);
    showToast(
      'success',
      `تمت المزامنة السحابية بنجاح: تم حفظ ${ordersSuccess} طلب و ${usersSuccess} مستخدم في Firestore!`
    );
    setFirestoreActive(true);
  };

  const handleGoogleAdminLogin = async () => {
    const res = await signInAdminWithGoogle();
    if (res.success) {
      showToast(
        'success',
        'تم تسجيل الدخول بحساب المشرف الرئيسي في Google وربط المزامنة السحابية المباشرة مع Firestore بنجاح!'
      );
      setFirestoreActive(true);
    } else {
      showToast('error', res.error || 'فشل تسجيل الدخول بـ Google');
    }
  };

  // Order status classifications:
  // "لو خليت الطلب مكتمل جزئياً أو مكتمل أو ملغي أو مسترد، كدا خلاص ينقص من عدد الطلبات"
  const isFinalizedStatus = (status: string) =>
    ['completed', 'partial', 'canceled', 'refunded'].includes(status);

  const activeOrders = useMemo(
    () => orders.filter((o) => !isFinalizedStatus(o.status)),
    [orders]
  );
  const finalizedOrders = useMemo(
    () => orders.filter((o) => isFinalizedStatus(o.status)),
    [orders]
  );

  const displayedOrders = useMemo(() => {
    if (orderFilter === 'active') return activeOrders;
    if (orderFilter === 'finalized') return finalizedOrders;
    return orders;
  }, [orders, orderFilter, activeOrders, finalizedOrders]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Action: Approve or Reject Deposit
  const handleDepositAction = async (depositId: string, action: 'approve' | 'reject') => {
    setProcessingDepositId(depositId);
    try {
      const res = await fetch(`/api/admin/deposits/${depositId}/action`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          adminNotes: depositNotes[depositId] || '',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(
          'success',
          action === 'approve'
            ? 'تمت الموافقة وتغذية رصيد العميل فوراً وتوثيق العملية في السجل المالي'
            : 'تم رفض طلب الشحن'
        );
        fetchAllAdminData();
      } else {
        showToast('error', data.error || 'فشلت المعالجة');
      }
    } catch (err: any) {
      showToast('error', err.message || 'خطأ في الاتصال');
    } finally {
      setProcessingDepositId(null);
    }
  };

  // Action: Refund Order
  const handleOrderRefund = async (orderId: string, orderNumber: string) => {
    if (!confirm(`هل أنت متأكد من استرداد قيمة الطلب #${orderNumber} بالكامل للمستخدم؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: 'استرداد بطلب من الإدارة' }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('success', data.message);
        fetchAllAdminData();
      } else {
        showToast('error', data.error || 'فشل الاسترداد');
      }
    } catch (err: any) {
      showToast('error', err.message || 'خطأ في الاتصال');
    }
  };

  // Action: Change Order Status (optimistically removes order from active queue if finalized)
    // External Order Alert Listener & Audio Chime
  useEffect(() => {
    const handleAdminAlert = (e: any) => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } catch {}

      showToast('success', `🚨 طلب جديد وصل الآن #${e.detail?.orderNumber || ''} (${e.detail?.charge || ''} ج.م)`);
      fetchAllAdminData();
    };

    window.addEventListener('admin_external_order_event', handleAdminAlert);
    return () => window.removeEventListener('admin_external_order_event', handleAdminAlert);
  }, []);

  const handleOpenReplyModal = (o: Order) => {
    setReplyOrder(o);
    setReplyMessage(`مرحباً ${o.username}، تم تحديث ومتابعة طلبك رقم #${o.orderNumber} (${o.serviceName}) بنجاح! شكراً لاختيارك منصة KOUMND.`);
    setReplySuccessMsg(null);
    setReplyWhatsappUrl(null);
  };

  const handleSendSmsReply = async (channel: 'SMS' | 'WhatsApp') => {
    if (!replyOrder || !replyMessage.trim()) return;
    setIsSendingReply(true);
    try {
      const res = await fetch(`/api/admin/orders/${replyOrder.id}/reply-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: replyMessage.trim(), channel }),
      });
      const data = await res.json();
      if (res.ok) {
        setReplySuccessMsg('تم إرسال الإشعار الخارجي إلى هاتف العميل بنجاح 📱');
        if (data.whatsappUrl) {
          setReplyWhatsappUrl(data.whatsappUrl);
        }
        showToast('success', 'تم إرسال الرسالة إلى هاتف العميل بنجاح');
      } else {
        showToast('error', data.error || 'فشل إرسال الرسالة');
      }
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleOrderStatusChange = async (orderId: string, newStatus: string) => {
    // Immediate optimistic update so count decreases and active order moves to finalized
    const targetOrder = orders.find((o) => o.id === orderId);
    const updatedOrder = targetOrder ? { ...targetOrder, status: newStatus as any } : null;

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
    );

    // Persist to Firestore in real-time
    if (updatedOrder) {
      persistOrderToFirestore(updatedOrder).catch((err) =>
        console.warn('Firestore order sync:', err)
      );
    }

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showToast('success', 'تم تحديث حالة الطلب وحفظها سحابياً في Firestore بنجاح');
        fetchAllAdminData();
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Action: Manual Balance Adjustment
  const handleManualBalanceAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustUser) return;

    setIsAdjusting(true);
    try {
      const res = await fetch(`/api/admin/users/${adjustUser.id}/balance`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(adjustAmount),
          actionType: adjustAction,
          reason: adjustReason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('success', data.message);
        setAdjustUser(null);
        setAdjustReason('');
        fetchAllAdminData();
      } else {
        showToast('error', data.error || 'فشل تعديل الرصيد');
      }
    } catch (err: any) {
      showToast('error', err.message || 'خطأ في الاتصال');
    } finally {
      setIsAdjusting(false);
    }
  };

  // Action: Save Provider Settings
  const handleSaveProviderSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/provider-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          apiUrl: provApiUrl,
          apiKey: provApiKey,
          isTestMode: provTestMode,
          autoForwardOrders: provAutoForward,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('success', 'تم حفظ إعدادات مزود الخدمة بنجاح');
        setProviderSettings(data.settings);
      }
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Action: Test Provider Connection
  const handleTestProviderConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/provider-settings/test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTestResult(data.result);
      if (data.settings) setProviderSettings(data.settings);
      showToast(data.result?.success ? 'success' : 'error', data.result?.message);
    } catch (err: any) {
      showToast('error', err.message || 'خطأ أثناء اختبار الاتصال');
    } finally {
      setTestingConnection(false);
    }
  };

  // Action: Open Add Service Modal with active category prefilled
  const handleOpenAddService = () => {
    if (adminServiceCatFilter && adminServiceCatFilter !== 'all') {
      setNewServiceCat(adminServiceCatFilter);
    } else if (!newServiceCat && categories.length > 0) {
      setNewServiceCat(categories[0].id);
    }
    setNewServiceName('');
    setNewServiceDesc('');
    setNewServicePrice('50.00');
    setNewServiceCost('47.60');
    setIsAddServiceOpen(true);
  };

  // Action: Instantly move service from one category to another with immediate database sync
  const handleMoveServiceCategory = async (serviceId: string, targetCatId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categoryId: targetCatId }),
      });
      const data = await res.json();
      if (res.ok) {
        const catName = categories.find((c) => c.id === targetCatId)?.name || targetCatId;
        showToast('success', `تم نقل الخدمة فوراً إلى فئة (${catName}) وحفظها بالسيرفر ✅`);
        setServices((prev) =>
          prev.map((s) => (s.id === serviceId ? { ...s, categoryId: targetCatId } : s))
        );
      } else {
        showToast('error', data.error || 'فشل نقل الخدمة');
      }
    } catch (err: any) {
      showToast('error', err.message || 'خطأ في الاتصال');
    }
  };

  // Action: Add Service
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) {
      showToast('error', 'يرجى كتابة اسم الخدمة');
      return;
    }
    const priceNum = parseFloat(newServicePrice) || 0;
    const isGaming = GAMING_CATEGORY_IDS.includes(newServiceCat);
    const defaultCost = priceNum > 0 ? (isGaming ? priceNum / 1.05 : priceNum / 1.35) : 10;
    const costNum = parseFloat(newServiceCost) || defaultCost;

    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          categoryId: newServiceCat,
          name: newServiceName.trim(),
          description: newServiceDesc.trim(),
          pricePer1000: priceNum,
          originalProviderCost: costNum,
          minQuantity: parseInt(newServiceMin) || 1,
          maxQuantity: parseInt(newServiceMax) || 10000,
          speed: newServiceSpeed || 'فوري خلال 1-5 دقائق',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const targetCatName = categories.find((c) => c.id === newServiceCat)?.name || '';
        showToast('success', `تمت إضافة الخدمة بنجاح إلى فئة (${targetCatName}) وتثبيتها بالسيرفر ✅`);
        setIsAddServiceOpen(false);
        setNewServiceName('');
        setNewServiceDesc('');
        if (data.service) {
          setServices((prev) => [data.service, ...prev]);
        }
        fetchAllAdminData();
      } else {
        showToast('error', data.error || 'فشلت إضافة الخدمة');
      }
    } catch (err: any) {
      showToast('error', err.message || 'خطأ في الاتصال بالسيرفر');
    }
  };

  // Action: Open Edit Service Modal
  const handleOpenEditService = (s: Service) => {
    setEditingService(s);
    setEditServiceName(s.name);
    setEditServiceCat(s.categoryId);
    setEditServicePrice(s.pricePer1000.toString());
    setEditServiceCost((s.originalProviderCost || 0).toString());
    setEditServiceMin(s.minQuantity.toString());
    setEditServiceMax(s.maxQuantity.toString());
    setEditServiceSpeed(s.speed);
    setEditServiceDesc(s.description || '');
    setEditServiceActive(s.active);
    setEditServiceIsOffer(Boolean(s.isOffer));
  };

  // Action: Save Service Edits
  const handleSaveServiceEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !token) return;
    setIsSavingEdit(true);

    try {
      const res = await fetch(`/api/admin/services/${editingService.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editServiceName,
          categoryId: editServiceCat,
          pricePer1000: parseFloat(editServicePrice) || 0,
          originalProviderCost: parseFloat(editServiceCost) || 0,
          minQuantity: parseInt(editServiceMin) || 1,
          maxQuantity: parseInt(editServiceMax) || 100000,
          speed: editServiceSpeed,
          description: editServiceDesc,
          active: editServiceActive,
          isOffer: editServiceIsOffer,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('success', 'تم حفظ وتحديث الخدمة بنجاح');
        setServices((prev) => prev.map((s) => (s.id === editingService.id ? data.service : s)));
        setEditingService(null);
      } else {
        showToast('error', data.error || 'فشل تعديل الخدمة');
      }
    } catch {
      showToast('error', 'حدث خطأ أثناء تعديل الخدمة');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Action: Delete Service
  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    if (!token) return;
    if (!window.confirm(`هل أنت متأكد من حذف الخدمة "${serviceName}" نهائياً من السيرفر؟`)) return;

    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        showToast('success', 'تم حذف الخدمة بنجاح من قاعدة البيانات');
        setServices((prev) => prev.filter((s) => s.id !== serviceId));
      } else {
        showToast('error', 'فشل حذف الخدمة');
      }
    } catch {
      showToast('error', 'حدث خطأ أثناء حذف الخدمة');
    }
  };

  // Open Fast Pricing Modal
  const handleOpenPricingModal = (s: Service) => {
    setPricingModalService(s);
    const cost = s.originalProviderCost ?? (s.pricePer1000 / 1.3);
    const costNum = Math.round(cost * 100) / 100;
    setPricingCost(costNum.toString());
    setPricingPrice(s.pricePer1000.toString());

    const margin = costNum > 0 ? Math.round(((s.pricePer1000 - costNum) / costNum) * 10000) / 100 : 30;
    setPricingTargetMargin(margin.toString());
    setPricingIsOffer(Boolean(s.isOffer));
    setPricingAnchorPrice(s.originalPriceBeforeDiscount ? s.originalPriceBeforeDiscount.toString() : '');
    setPricingIsAvailable(s.isAvailable !== false);
    setPricingValidationError(null);
  };

  // Sync pricing when cost changes
  const handlePricingCostChange = (newCostStr: string) => {
    setPricingCost(newCostStr);
    const costNum = parseFloat(newCostStr);
    const priceNum = parseFloat(pricingPrice);
    if (!isNaN(costNum) && !isNaN(priceNum) && costNum > 0) {
      if (priceNum < costNum) {
        setPricingValidationError(`تحذير أمان: سعر البيع (${priceNum} ج.م) أقل من تكلفة المزود (${costNum} ج.م)! هذا يسبب خسارة.`);
      } else {
        setPricingValidationError(null);
        const margin = Math.round(((priceNum - costNum) / costNum) * 10000) / 100;
        setPricingTargetMargin(margin.toString());
      }
    }
  };

  // Sync pricing when target margin % changes
  const handleTargetMarginChange = (newMarginStr: string) => {
    setPricingTargetMargin(newMarginStr);
    const marginNum = parseFloat(newMarginStr);
    const costNum = parseFloat(pricingCost) || 0;
    if (!isNaN(marginNum) && !isNaN(costNum) && costNum >= 0) {
      const calc = calculateSellingPrice(costNum, marginNum, pricingIsOffer);
      setPricingPrice(calc.sellingPrice.toString());
      if (pricingIsOffer) {
        setPricingAnchorPrice(calc.originalPriceBeforeDiscount ? calc.originalPriceBeforeDiscount.toString() : '');
      }
      setPricingValidationError(null);
    }
  };

  // Sync pricing when selling price changes
  const handleSellingPriceChange = (newPriceStr: string) => {
    setPricingPrice(newPriceStr);
    const priceNum = parseFloat(newPriceStr);
    const costNum = parseFloat(pricingCost) || 0;
    if (!isNaN(priceNum) && !isNaN(costNum)) {
      if (priceNum < costNum) {
        setPricingValidationError(`تحذير أمان: سعر البيع (${priceNum} ج.م) أقل من تكلفة المزود (${costNum} ج.م)! هذا الإجراء محمي لتفادي الخسارة.`);
      } else {
        setPricingValidationError(null);
        const margin = costNum > 0 ? Math.round(((priceNum - costNum) / costNum) * 10000) / 100 : 100;
        setPricingTargetMargin(margin.toString());
        if (pricingIsOffer) {
          const calc = calculateSellingPrice(costNum, margin, true);
          setPricingAnchorPrice(calc.originalPriceBeforeDiscount ? calc.originalPriceBeforeDiscount.toString() : '');
        }
      }
    }
  };

  // Apply Quick Margin Preset (+30%, +8%, +50%, +20%)
  const handleApplyPresetMargin = (pct: number) => {
    handleTargetMarginChange(pct.toString());
  };

  // Save Fast Pricing
  const handleSaveFastPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricingModalService || !token) return;

    const costNum = parseFloat(pricingCost);
    const priceNum = parseFloat(pricingPrice);

    if (isNaN(costNum) || isNaN(priceNum)) {
      showToast('error', 'يرجى إدخال أرقام صحيحة للأسعار');
      return;
    }

    if (priceNum < costNum) {
      setPricingValidationError(`لا يمكن حفظ سعر بيع (${priceNum} ج.م) أقل من تكلفة المزود (${costNum} ج.م).`);
      return;
    }

    setIsSavingPricing(true);
    try {
      const res = await fetch(`/api/admin/services/${pricingModalService.id}/pricing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          providerCost: costNum,
          sellingPrice: priceNum,
          isOffer: pricingIsOffer,
          anchorPrice: pricingIsOffer && pricingAnchorPrice ? parseFloat(pricingAnchorPrice) : undefined,
          isAvailable: pricingIsAvailable,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('success', data.message || 'تم تحديث السعر وهامش الربح بنجاح');
        setServices((prev) => prev.map((s) => (s.id === pricingModalService.id ? data.service : s)));
        setPricingModalService(null);
      } else {
        showToast('error', data.error || 'فشل تحديث السعر');
      }
    } catch (err: any) {
      showToast('error', err.message || 'خطأ في الاتصال');
    } finally {
      setIsSavingPricing(false);
    }
  };

  // Bulk Margin Action
  const handleApplyBulkMarginAction = async (
    target: 'social' | 'gaming' | 'category' | 'all',
    margin: number,
    applyAnchor: boolean,
    categoryId?: string
  ) => {
    if (!token) return;
    setIsApplyingBulkMargin(true);
    try {
      const res = await fetch('/api/admin/services/bulk-margin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          target,
          categoryId,
          marginPercent: margin,
          applyFakeAnchor: applyAnchor,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('success', data.message);
        if (data.services) setServices(data.services);
        fetchAllAdminData();
      } else {
        showToast('error', data.error || 'فشل تطبيق الهامش الجماعي');
      }
    } catch (err: any) {
      showToast('error', err.message || 'خطأ أثناء المعالجة');
    } finally {
      setIsApplyingBulkMargin(false);
    }
  };

  // Pricing & Margins Health Analytics
  const pricingStats = useMemo(() => {
    let marginSum = 0;
    let countedServices = 0;
    let healthyCount = 0;
    let lowCount = 0;
    let offersCount = 0;
    let accountsCount = 0;
    let outOfStockCount = 0;

    services.forEach((s) => {
      const isGaming = GAMING_CATEGORY_IDS.includes(s.categoryId);
      const cost = s.originalProviderCost ?? (s.pricePer1000 / 1.3);
      const margin = cost > 0 ? ((s.pricePer1000 - cost) / cost) * 100 : 100;
      marginSum += margin;
      countedServices++;

      const isHealthy = isGaming ? margin >= 8 : margin >= 30;
      if (isHealthy) {
        healthyCount++;
      } else if (margin < 15) {
        lowCount++;
      }

      if (s.isOffer) offersCount++;
      if (s.isAccountSale) accountsCount++;
      if (s.isAvailable === false || s.active === false) outOfStockCount++;
    });

    const avgMargin = countedServices > 0 ? Math.round((marginSum / countedServices) * 10) / 10 : 0;

    return {
      avgMargin,
      healthyCount,
      lowCount,
      offersCount,
      accountsCount,
      outOfStockCount,
      totalServices: services.length,
    };
  }, [services]);

  // Filtered Services for Admin View with Margin Health filtering
  const filteredAdminServices = useMemo(() => {
    return services.filter((s) => {
      if (adminServiceCatFilter !== 'all' && s.categoryId !== adminServiceCatFilter) return false;

      const isGaming = GAMING_CATEGORY_IDS.includes(s.categoryId);
      const cost = s.originalProviderCost ?? (s.pricePer1000 / 1.3);
      const margin = cost > 0 ? ((s.pricePer1000 - cost) / cost) * 100 : 100;

      if (adminMarginFilter === 'healthy') {
        const isHealthy = isGaming ? margin >= 8 : margin >= 30;
        if (!isHealthy) return false;
      } else if (adminMarginFilter === 'low') {
        if (margin >= 15) return false;
      } else if (adminMarginFilter === 'gaming') {
        if (!isGaming) return false;
      } else if (adminMarginFilter === 'social') {
        if (isGaming) return false;
      } else if (adminMarginFilter === 'offers') {
        if (!s.isOffer) return false;
      } else if (adminMarginFilter === 'accounts') {
        if (!s.isAccountSale) return false;
      } else if (adminMarginFilter === 'unavailable') {
        if (s.isAvailable !== false && s.active !== false) return false;
      }

      if (!adminServiceSearch.trim()) return true;
      const q = adminServiceSearch.toLowerCase().trim();
      return (
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.providerServiceId && s.providerServiceId.toLowerCase().includes(q))
      );
    });
  }, [services, adminServiceCatFilter, adminMarginFilter, adminServiceSearch]);

  return (
    <div className="space-y-6 text-right animate-in fade-in duration-300">
      
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 left-6 z-50 p-4 rounded-xl border shadow-2xl flex items-center gap-3 text-xs font-bold animate-in slide-in-from-bottom-4 ${
            toast.type === 'success'
              ? 'bg-slate-900 border-emerald-500 text-emerald-300 shadow-emerald-500/10'
              : 'bg-slate-900 border-rose-500 text-rose-300 shadow-rose-500/10'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-900/40 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">لوحة تحكم إدارة المنصة (KOUMND Master)</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                ADMIN ACCESS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              إدارة الطلبات، تأكيد شحن الأرصدة، إعدادات المزود، وتوثيق السجل المالي الآمن.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAllAdminData}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          تحديث البيانات
        </button>
      </div>

      {/* Real-time Firestore Persistent Cloud Sync Status */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white">
                حالة التخزين السحابي الدائم (Firebase Firestore)
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                  firestoreActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${firestoreActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {firestoreActive ? 'مزامنة لحظية نشطة (Real-time Snapshots)' : 'جاهز للمزامنة السحابية'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              قاعدة البيانات: <span className="font-mono text-slate-300">ai-studio-koumnd-2cc306ec-c7dd-4229-b975-7a823d4103c0</span> • جميع الطلبات والمستخدمين محفوظة سحابياً بشكل دائم وغير قابلة للحذف التلقائي.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleSyncAllToFirestore}
            disabled={isSyncingAllFirestore}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAllFirestore ? 'animate-spin' : ''}`} />
            <span>{isSyncingAllFirestore ? 'جارٍ المزامنة السحابية...' : 'مزامنة سحابية لكافة السجلات'}</span>
          </button>

          {!firebaseAdmin && (
            <button
              type="button"
              onClick={handleGoogleAdminLogin}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              <span>ربط Google المشرف</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'stats', label: 'الإحصائيات العامة', icon: BarChart3 },
          { id: 'deposits', label: `طلبات الإيداع (${deposits.filter((d) => d.status === 'pending').length} معلق / ${deposits.length} إجمالي)`, icon: DollarSign },
          { id: 'orders', label: `إدارة الطلبات (${activeOrders.length})`, icon: ListOrdered },
          { id: 'services', label: `الأسعار وهوامش الربح (${services.length})`, icon: Percent },
          { id: 'users', label: `المستخدمين (${users.length})`, icon: Users },
          { id: 'provider', label: 'ربط API المزود', icon: Server },
          { id: 'tickets', label: `التذاكر (${tickets.filter((t) => t.status !== 'closed').length})`, icon: Headphones },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                isActive
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: STATS */}
      {currentSubTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <span className="text-xs text-slate-400 font-bold block mb-1">إجمالي الإيرادات المكتسبة</span>
              <div className="text-2xl font-black text-emerald-400 font-mono">{stats.totalRevenue.toFixed(2)} ج.م</div>
              <span className="text-[11px] text-slate-500 mt-2 block">من الطلبات المكتملة والنشطة</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <span className="text-xs text-slate-400 font-bold block mb-1">طلبات الشحن المعلقة</span>
              <div className="text-2xl font-black text-amber-400 font-mono">
                {stats.pendingDepositsCount} طلب ({stats.pendingDepositsAmount.toFixed(2)} ج.م)
              </div>
              <button
                onClick={() => setCurrentSubTab('deposits')}
                className="text-[11px] text-indigo-400 hover:underline mt-2 inline-block font-bold"
              >
                مراجعة وتأكيد الآن &larr;
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <span className="text-xs text-slate-400 font-bold block mb-1">إجمالي عدد الطلبات</span>
              <div className="text-2xl font-black text-cyan-400 font-mono">{stats.totalOrders}</div>
              <span className="text-[11px] text-slate-500 mt-2 block">
                منها {stats.pendingOrders} بانتظار البدء
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <span className="text-xs text-slate-400 font-bold block mb-1">أرصدة العملاء بالمحافظ</span>
              <div className="text-2xl font-black text-purple-400 font-mono">{stats.totalUserBalances.toFixed(2)} ج.م</div>
              <span className="text-[11px] text-slate-500 mt-2 block">
                موزعة على {stats.totalUsers} مستخدمين
              </span>
            </div>

          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <h3 className="text-base font-black text-white mb-3">حالة الأمان والتشغيل والتنبيهات الفورية</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">تشفير كلمات المرور (scrypt)</div>
                  <div className="text-slate-400 text-[11px]">مفعل مع توليد Salt ديناميكي لكل حساب</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">حماية الخصم المزدوج والطلب المكرر</div>
                  <div className="text-slate-400 text-[11px]">مفعل عبر قفل التسلسل وفحص الرصيد الصارم</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">السجل المالي الشفاف (Audit Trail)</div>
                  <div className="text-slate-400 text-[11px]">توثيق لحظي لكل حركة مالية بالسيرفر</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-900/50 flex flex-col justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white">إشعارات الهاتف الفورية (Push)</div>
                    <div className="text-slate-400 text-[10px]">تصلك طلبات العملاء فوراً على هاتفك</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTestPushNotification}
                  disabled={testingPush}
                  className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Bell className="w-3 h-3 text-amber-300" />
                  <span>{testingPush ? 'جاري الإرسال...' : 'تجربة إشعار فوري على هاتفي 🔔'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Announcement Broadcaster */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-900/40 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-400" />
                <span>بث إعلان إداري فوري لجميع المستخدمين (Live WebSocket + Email)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                سيصل الإعلان كإشعار منبثق فوري لجميع المتصلين حالياً بالمنصة، بالإضافة إلى إدراجه في صندوق إشعاراتهم وبريدهم.
              </p>
            </div>

            <form onSubmit={handleBroadcastAnnouncement} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">عنوان الإعلان</label>
                <input
                  type="text"
                  required
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="مثال: خصم 20% على خدمات تيك توك بمناسبة نهاية الأسبوع!"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">تفاصيل الإعلان</label>
                <textarea
                  rows={2}
                  required
                  value={announcementMsg}
                  onChange={(e) => setAnnouncementMsg(e.target.value)}
                  placeholder="اكتب نص الإشعار الكامل الذي سيصل للمستخدمين..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={broadcasting}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{broadcasting ? 'جاري البث...' : 'بث الإعلان لجميع العملاء الآن'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUBTAB 2: DEPOSIT REQUESTS («طلبات الإيداع») */}
      {currentSubTab === 'deposits' && (
        <div className="space-y-6">
          
          {/* 1. Pending Deposit Requests Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-2">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <span>طلبات الإيداع المعلقة بانتظار المراجعة والتحقق</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  تحقق بنفسك من وصول المبلغ أولاً، ثم اضغط «موافقة» لإضافة الرصيد للعميل مرة واحدة فقط، أو «رفض» في حال عدم استلام المبلغ.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl font-bold">
                  بانتظار القرار: {deposits.filter((d) => d.status === 'pending').length} طلب
                </span>
                <span className="text-xs bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-xl font-bold">
                  إجمالي المسجل: {deposits.length} طلب
                </span>
              </div>
            </div>

            {deposits.filter((d) => d.status === 'pending').length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-950/40 rounded-xl border border-slate-800/60 space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
                <div className="font-bold text-white text-sm">لا توجد طلبات إيداع جديدة معلقة بانتظار اتخاذ قرار حالياً</div>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  جميع طلبات الإيداع المسجلة في السيرفر (إجمالي {deposits.length} طلب) معتمدة أو مؤرشفة ومحفوظة بالكامل في «سجل عمليات الإيداع السابقة» أدناه، ولن تُفقد أبداً عند التحديث.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-850 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-semibold">رقم الطلب</th>
                      <th className="px-4 py-3 font-semibold">رقم العميل / المحفظة</th>
                      <th className="px-4 py-3 font-semibold">بيانات العميل</th>
                      <th className="px-4 py-3 font-semibold">المبلغ المطلوب</th>
                      <th className="px-4 py-3 font-semibold">وسيلة الدفع</th>
                      <th className="px-4 py-3 font-semibold">حالة العملية</th>
                      <th className="px-4 py-3 font-semibold">ملاحظات الإدارة (اختياري)</th>
                      <th className="px-4 py-3 font-semibold text-center">القرار والإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                    {deposits
                      .filter((dep) => dep.status === 'pending')
                      .map((dep) => {
                        const isProcessing = processingDepositId === dep.id;
                        return (
                          <tr key={dep.id} className="hover:bg-slate-850/50 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-white whitespace-nowrap">
                              {dep.depositNumber}
                            </td>
                            <td className="px-4 py-3 font-mono text-cyan-300 font-bold whitespace-nowrap" dir="ltr">
                              {dep.senderAccountOrNumber}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-white">{dep.username}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{dep.userEmail}</div>
                            </td>
                            <td className="px-4 py-3 font-mono font-black text-emerald-400 whitespace-nowrap text-sm">
                              +{dep.amount.toFixed(2)} ج.م
                            </td>
                            <td className="px-4 py-3 text-slate-200 whitespace-nowrap">
                              <div>{dep.paymentMethodName}</div>
                              {dep.referenceCode && (
                                <div className="text-[10px] text-slate-400 font-mono" dir="ltr">
                                  مرجع: {dep.referenceCode}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full font-bold text-[11px]">
                                <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                                بانتظار التحقق والموافقة
                              </span>
                            </td>
                            <td className="px-4 py-3 min-w-[180px]">
                              <input
                                type="text"
                                placeholder="ملاحظة أو رقم إيصال التحقق..."
                                value={depositNotes[dep.id] || ''}
                                onChange={(e) =>
                                  setDepositNotes({ ...depositNotes, [dep.id]: e.target.value })
                                }
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                              />
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDepositAction(dep.id, 'approve')}
                                  disabled={isProcessing}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all flex items-center gap-1 shadow-md shadow-emerald-600/30 disabled:opacity-50 cursor-pointer active:scale-95"
                                  title="تأكيد استلام المبلغ وإضافته لرصيد العميل مرة واحدة فقط"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{isProcessing ? 'جاري الاعتماد...' : 'موافقة'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDepositAction(dep.id, 'reject')}
                                  disabled={isProcessing}
                                  className="px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white font-black text-xs transition-all flex items-center gap-1 shadow-md shadow-rose-600/20 disabled:opacity-50 cursor-pointer active:scale-95"
                                  title="رفض الطلب لعدم وصول المبلغ (لا يضيف أي رصيد)"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>رفض</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 2. Previous Operations History Section (Audit Log) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  <span>سجل عمليات الإيداع السابقة (المعتمدة والمرفوضة)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  سجل تاريخي كامل لجميع العمليات السابقة مع تفاصيل التدقيق المحاسبي وملاحظات الإدارة.
                </p>
              </div>
              <span className="text-xs text-slate-400">
                إجمالي السجلات السابقة:{' '}
                <strong className="text-white font-mono">
                  {deposits.filter((d) => d.status !== 'pending').length}
                </strong>
              </span>
            </div>

            {deposits.filter((d) => d.status !== 'pending').length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                لا توجد عمليات سابقة مؤرشفة حتى الآن.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-850 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-semibold">رقم الطلب</th>
                      <th className="px-4 py-3 font-semibold">رقم العميل / الهاتف</th>
                      <th className="px-4 py-3 font-semibold">المستخدم</th>
                      <th className="px-4 py-3 font-semibold">المبلغ</th>
                      <th className="px-4 py-3 font-semibold">وسيلة الدفع</th>
                      <th className="px-4 py-3 font-semibold">الحالة النهائية</th>
                      <th className="px-4 py-3 font-semibold">ملاحظات الإدارة والمراجع</th>
                      <th className="px-4 py-3 font-semibold">تاريخ ووقت المعالجة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                    {deposits
                      .filter((dep) => dep.status !== 'pending')
                      .map((dep) => (
                        <tr key={dep.id} className="hover:bg-slate-850/30 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-white whitespace-nowrap">
                            {dep.depositNumber}
                          </td>
                          <td className="px-4 py-3 font-mono text-cyan-300 whitespace-nowrap" dir="ltr">
                            {dep.senderAccountOrNumber}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-200">{dep.username}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{dep.userEmail}</div>
                          </td>
                          <td className="px-4 py-3 font-mono font-black text-emerald-400 whitespace-nowrap">
                            +{dep.amount.toFixed(2)} ج.م
                          </td>
                          <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                            {dep.paymentMethodName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {dep.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold text-[11px]">
                                <CheckCircle className="w-3 h-3 text-emerald-400" />
                                تمت الموافقة وإضافة الرصيد (مرة واحدة)
                              </span>
                            )}
                            {dep.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold text-[11px]">
                                <XCircle className="w-3 h-3 text-rose-400" />
                                مرفوض (لم يُضف أي رصيد)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-400 max-w-xs text-[11px]">
                            {dep.adminNotes || '-'}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                            {dep.processedAt
                              ? new Date(dep.processedAt).toLocaleDateString('ar-EG', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : new Date(dep.createdAt).toLocaleDateString('ar-EG')}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* SUBTAB 3: ORDERS MANAGEMENT */}
      {currentSubTab === 'orders' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-indigo-400" />
                  <span>سجل وإدارة طلبات العملاء (محفوظة دائماً ولا تُحذف)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  جميع الطلبات محفوظة بشكل دائم في السيرفر دون أي حذف. عند تغيير الحالة إلى (مكتمل)، يظل الطلب محفوظاً في «كل الطلبات» مع علامته الرسمية.
                </p>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setOrderFilter('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    orderFilter === 'all'
                      ? 'bg-indigo-600 text-white font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  كل الطلبات ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter('active')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    orderFilter === 'active'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الطلبات الجديدة والجارية ({activeOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter('finalized')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    orderFilter === 'finalized'
                      ? 'bg-emerald-600 text-white font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الطلبات المنفذة والمكتملة ({finalizedOrders.length})
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {displayedOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                {orderFilter === 'active'
                  ? 'رائع! لا توجد طلبات معلقة أو قيد الانتظار حالياً.'
                  : 'لا توجد طلبات في هذا القسم.'}
              </div>
            ) : (
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-850/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">رقم الطلب</th>
                  <th className="px-4 py-3 font-semibold">العميل</th>
                  <th className="px-4 py-3 font-semibold">الخدمة & الرابط</th>
                  <th className="px-4 py-3 font-semibold">الكمية والتكلفة</th>
                  <th className="px-4 py-3 font-semibold">معرّف المزود</th>
                  <th className="px-4 py-3 font-semibold">الحالة الحالية</th>
                  <th className="px-4 py-3 font-semibold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {displayedOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-850/40">
                    <td className="px-4 py-3 font-mono font-bold text-white whitespace-nowrap">
                      {o.orderNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{o.username}</div>
                      <div className="text-[10px] text-slate-400">{o.userEmail}</div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-bold text-slate-200 truncate">{o.serviceName}</div>
                      <div className="text-cyan-400 font-mono truncate text-[11px]" dir="ltr">
                        {o.link}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono whitespace-nowrap">
                      <div>الكمية: {o.quantity.toLocaleString()}</div>
                      <div className="text-amber-400 font-bold">${o.charge.toFixed(3)}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                      {o.providerOrderId || 'قيد الإرسال'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <select
                        value={o.status}
                        onChange={(e) => handleOrderStatusChange(o.id, e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      >
                        <option value="pending">قيد الانتظار</option>
                        <option value="in_progress">قيد التنفيذ</option>
                        <option value="completed">مكتمل</option>
                        <option value="partial">مكتمل جزئياً</option>
                        <option value="canceled">ملغي</option>
                        <option value="refunded">مسترد</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenReplyModal(o)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="إرسال رسالة لهاتف العميل عبر SMS أو واتساب"
                        >
                          <span>📱 رسالة للهاتف</span>
                        </button>
                      {o.status !== 'refunded' && (
                        <button
                          onClick={() => handleOrderRefund(o.id, o.orderNumber)}
                          className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors"
                          title="استرداد المبلغ لمحفظة العميل"
                        >
                          استرداد للعميل
                        </button>
                      )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 4: SERVICES & PROFIT MARGINS REVIEW */}
      {currentSubTab === 'services' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Percent className="w-5 h-5 text-amber-400" />
                <span>مراجعة وتحديث أسعار الخدمات وهوامش الربح (الأسعار الحالية vs المزود)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                مقارنة فورية بين سعر تكلفة المزود وسعر البيع الحالي، حساب صافي الربح وهامش الربح بالجنيه المصري (ج.م)، وضبط جماعي للهوامش.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowBulkMarginPanel(!showBulkMarginPanel)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showBulkMarginPanel
                    ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>أدوات الضبط الجماعي للهوامش</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAddService}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة خدمة جديدة</span>
              </button>
            </div>
          </div>

          {/* Pricing Health Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-xs text-slate-400 font-bold block mb-1 flex items-center justify-between">
                <span>متوسط هامش الربح</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                %{pricingStats.avgMargin.toFixed(1)}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">على مستوى جميع الخدمات</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-xs text-slate-400 font-bold block mb-1 flex items-center justify-between">
                <span>هوامش آمنة وممتازة</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
                {pricingStats.healthyCount}{' '}
                <span className="text-xs text-slate-400 font-normal">من أصل {pricingStats.totalServices}</span>
              </div>
              <span className="text-[11px] text-emerald-400/80 mt-1 block">30%+ سوشيال / 8%+ ألعاب</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-xs text-slate-400 font-bold block mb-1 flex items-center justify-between">
                <span>هوامش منخفضة بحاجة تعديل</span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                {pricingStats.lowCount}
              </div>
              <button
                type="button"
                onClick={() => setAdminMarginFilter('low')}
                className="text-[11px] text-amber-400 hover:underline mt-1 inline-block font-bold"
              >
                فلترة الخدمات المنخفضة &larr;
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-xs text-slate-400 font-bold block mb-1 flex items-center justify-between">
                <span>العروض الترويجية والحسابات</span>
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              </span>
              <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
                {pricingStats.offersCount}{' '}
                <span className="text-xs text-slate-400 font-normal">عرض ({pricingStats.accountsCount} حساب)</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">تتضمن عروض الشطب النفسية</span>
            </div>
          </div>

          {/* Quick Margin Presets Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-slate-900 border border-amber-500/20 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-white">إجراءات الضبط السريع للهوامش بنقرة واحدة:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isApplyingBulkMargin}
                  onClick={() => handleApplyBulkMarginAction('social', DEFAULT_SOCIAL_MARGIN_PERCENT, true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                  title="تطبيق هامش 35% على خدمات السوشيال والتسويق مع حفظ الحسابات الجاهزة"
                >
                  <span>🚀 تطبيق هامش 35% على السوشيال</span>
                </button>
                <button
                  type="button"
                  disabled={isApplyingBulkMargin}
                  onClick={() => handleApplyBulkMarginAction('gaming', DEFAULT_GAMING_MARGIN_PERCENT, false)}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                  title="تطبيق هامش 5% على ألعاب الشحن المباشر مثل ببجي وفري فاير"
                >
                  <span>🎮 تطبيق هامش 5% على الألعاب</span>
                </button>
                <button
                  type="button"
                  disabled={isApplyingBulkMargin}
                  onClick={() => handleApplyBulkMarginAction('all', 30, false)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                  title="إعادة ضبط آمنة لجميع الخدمات"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ضبط آمن للكل</span>
                </button>
              </div>
            </div>

            {/* Collapsible Custom Bulk Tool */}
            {showBulkMarginPanel && (
              <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2.5 animate-in fade-in">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">الجهة المستهدفة بالهوامش</label>
                  <select
                    value={bulkMarginCategory}
                    onChange={(e) => setBulkMarginCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="social">خدمات السوشيال والتسويق (غير الألعاب)</option>
                    <option value="gaming">ألعاب الشحن (ببجي، فري فاير، فيفا، لودو)</option>
                    <option value="all">كل الخدمات في المنصة</option>
                    {categories.map((c) => (
                      <option key={c.id} value={`cat:${c.id}`}>
                        فئة معينة: {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">نسبة هامش الربح المطلوبة (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={bulkMarginPercent}
                      onChange={(e) => setBulkMarginPercent(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                    <Percent className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="flex items-center pt-4">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bulkApplyFakeAnchor}
                      onChange={(e) => setBulkApplyFakeAnchor(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-amber-500 w-4 h-4"
                    />
                    <span>تطبيق عروض وهمية بأسعار شطب جذابة</span>
                  </label>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    disabled={isApplyingBulkMargin}
                    onClick={() => {
                      const isSpecificCat = bulkMarginCategory.startsWith('cat:');
                      const catId = isSpecificCat ? bulkMarginCategory.replace('cat:', '') : undefined;
                      const target = isSpecificCat ? 'category' : (bulkMarginCategory as any);
                      handleApplyBulkMarginAction(
                        target,
                        parseFloat(bulkMarginPercent) || 30,
                        bulkApplyFakeAnchor,
                        catId
                      );
                    }}
                    className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {isApplyingBulkMargin ? 'جاري التطبيق والتحديث...' : 'تطبيق الهامش فوراً'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search & Filter Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="sm:col-span-5 relative">
              <input
                type="text"
                value={adminServiceSearch}
                onChange={(e) => setAdminServiceSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الكود (#ID) أو معرف المزود..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="sm:col-span-4">
              <select
                value={adminServiceCatFilter}
                onChange={(e) => setAdminServiceCatFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">جميع الفئات ({services.length} خدمة)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={adminMarginFilter}
                onChange={(e) => setAdminMarginFilter(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
              >
                <option value="all">كل الهوامش والحالات</option>
                <option value="healthy">هوامش ممتازة (35%+ أو 5%+ للألعاب)</option>
                <option value="low">هوامش منخفضة بحاجة تعديل (&lt; 15%)</option>
                <option value="social">خدمات السوشيال ميديا</option>
                <option value="gaming">ألعاب الشحن المباشر بالـ ID</option>
                <option value="offers">العروض المخفضة الترويجية</option>
                <option value="accounts">حسابات جاهزة بأسعار خاصة</option>
                <option value="unavailable">الخدمات غير المتوفرة</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 px-1 gap-2">
            <span>
              الخدمات المعروضة في الجدول:{' '}
              <strong className="text-white font-mono">{filteredAdminServices.length}</strong> من إجمالي{' '}
              <strong className="text-white font-mono">{services.length}</strong> خدمة
            </span>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                <span>هامش 35%+ أو ألعاب 5%+</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                <span>هامش متوسط</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span>
                <span>هامش منخفض</span>
              </span>
            </div>
          </div>

          {/* Pricing & Comparison Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-850/90 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-3 py-3 font-semibold">الكود والفئة</th>
                  <th className="px-4 py-3 font-semibold">اسم الخدمة والبيانات</th>
                  <th className="px-3 py-3 font-semibold">تكلفة المزود الأصلية</th>
                  <th className="px-3 py-3 font-semibold">سعر البيع للزبائن</th>
                  <th className="px-3 py-3 font-semibold text-emerald-400">صافي الربح الفعلي</th>
                  <th className="px-3 py-3 font-semibold">نسبة هامش الربح (%)</th>
                  <th className="px-3 py-3 font-semibold">العرض وسعر الشطب</th>
                  <th className="px-3 py-3 font-semibold">حالة التوفر</th>
                  <th className="px-4 py-3 font-semibold text-center">إجراءات التسعير</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
                {filteredAdminServices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                      لا توجد خدمات مطابقة لمعايير الفلترة المحددة.
                    </td>
                  </tr>
                ) : (
                  filteredAdminServices.slice(0, 100).map((s) => {
                    const isGaming = GAMING_CATEGORY_IDS.includes(s.categoryId);
                    const cost = s.originalProviderCost ?? (s.pricePer1000 / 1.3);
                    const sellingPrice = s.pricePer1000;
                    const profitAmount = Math.max(0, Math.round((sellingPrice - cost) * 100) / 100);
                    const marginPercent = cost > 0
                      ? Math.round(((sellingPrice - cost) / cost) * 10000) / 100
                      : 100;

                    const isHealthy = isGaming ? marginPercent >= 5 : marginPercent >= 35;
                    const isWarning = marginPercent < 5;

                    return (
                      <tr key={s.id} className="hover:bg-slate-850/50 transition-colors">
                        {/* ID & Category */}
                        <td className="px-3 py-2.5 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                          <div className="font-bold text-white">#{s.providerServiceId || s.id.slice(-6)}</div>
                          <select
                            value={s.categoryId}
                            onChange={(e) => handleMoveServiceCategory(s.id, e.target.value)}
                            className="mt-1 text-[10px] bg-slate-950 border border-slate-700 hover:border-amber-400/80 rounded px-1.5 py-0.5 text-amber-300 font-sans cursor-pointer block max-w-[135px]"
                            title="انقر لتغيير فئة الخدمة ونقلها فوراً"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name.split('(')[0].trim()}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Name & Badges */}
                        <td className="px-4 py-2.5 max-w-xs">
                          <div className="font-bold text-white truncate" title={s.name}>
                            {s.name}
                          </div>
                          <div className="flex flex-wrap items-center gap-1 mt-0.5">
                            {s.isAccountSale && (
                              <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/30 font-bold">
                                حساب جاهز
                              </span>
                            )}
                            {s.isOffer && (
                              <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded border border-rose-500/30 font-bold">
                                عرض مخفض
                              </span>
                            )}
                            {isGaming ? (
                              <span className="text-[9px] bg-amber-500/10 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/20">
                                ألعاب بالـ ID
                              </span>
                            ) : (
                              <span className="text-[9px] bg-blue-500/10 text-blue-300 px-1.5 py-0.2 rounded border border-blue-500/20">
                                سوشيال ميديا
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Provider Cost */}
                        <td className="px-3 py-2.5 font-mono whitespace-nowrap">
                          <div className="text-slate-300 font-bold text-xs">{cost.toFixed(2)} ج.م</div>
                          <div className="text-[10px] text-slate-500">
                            {isGaming ? 'تكلفة أساسية' : 'تكلفة أساسية'}
                          </div>
                        </td>

                        {/* Selling Price */}
                        <td className="px-3 py-2.5 font-mono whitespace-nowrap">
                          <div className="text-amber-400 font-black text-xs">{sellingPrice.toFixed(2)} ج.م</div>
                          <div className="text-[10px] text-slate-400">لكل 1000 / باقة</div>
                        </td>

                        {/* Net Profit */}
                        <td className="px-3 py-2.5 font-mono whitespace-nowrap">
                          <div className="text-emerald-400 font-black text-xs">+{profitAmount.toFixed(2)} ج.م</div>
                          <div className="text-[10px] text-emerald-500/80">ربح مضمون</div>
                        </td>

                        {/* Profit Margin % */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-black border ${
                              isHealthy
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : isWarning
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            %{marginPercent.toFixed(1)}
                            {isHealthy && ' ✓'}
                            {isWarning && ' ⚠️'}
                          </span>
                        </td>

                        {/* Fake Anchor Discount */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {s.isOffer && s.originalPriceBeforeDiscount ? (
                            <div>
                              <span className="line-through text-slate-500 font-mono text-[11px]">
                                {s.originalPriceBeforeDiscount.toFixed(2)} ج.م
                              </span>
                              <span className="mr-1 text-[10px] bg-rose-500/20 text-rose-300 px-1 rounded font-bold">
                                -{s.discountPercent || 25}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">سعر قياسي</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {s.isAvailable !== false && s.active !== false ? (
                            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/20">
                              متوفر للطلب
                            </span>
                          ) : (
                            <span className="text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-500/30">
                              غير متوفر ومينفعش يطلب
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-2.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenPricingModal(s)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="تعديل السعر وهامش الربح بالحاسبة الذكية"
                            >
                              <Calculator className="w-3.5 h-3.5 text-amber-400" />
                              <span>تعديل السعر</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditService(s)}
                              className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer"
                              title="تعديل تفاصيل الخدمة بالكامل"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteService(s.id, s.name)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                              title="حذف الخدمة نهائياً"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {filteredAdminServices.length > 100 && (
            <div className="text-center text-slate-500 text-xs py-1">
              يتم عرض أول 100 نتيجة من أصل {filteredAdminServices.length} خدمة. استخدم البحث أو الفلاتر لتحديد خدمة بعينها.
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 5: USERS & BALANCE ADJUSTMENT */}
      {currentSubTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>إدارة المستخدمين والأرصدة</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              عرض بيانات العملاء وتعديل الأرصدة يدوياً مع إرفاق سبب إداري يوثق في السجل المالي.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-850/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">المستخدم</th>
                  <th className="px-4 py-3 font-semibold">البريد الإلكتروني</th>
                  <th className="px-4 py-3 font-semibold">الرتبة</th>
                  <th className="px-4 py-3 font-semibold">الرصيد المتاح</th>
                  <th className="px-4 py-3 font-semibold">الحالة</th>
                  <th className="px-4 py-3 font-semibold text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-850/40">
                    <td className="px-4 py-3 font-bold text-white">{u.username}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{u.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {u.role === 'admin' ? 'مدير' : 'عميل'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">${u.balance.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className="text-emerald-400 text-xs font-bold">نشط</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setAdjustUser(u);
                          setAdjustAmount('10');
                          setAdjustAction('add');
                          setAdjustReason('');
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-indigo-400 border border-slate-700 font-bold transition-colors"
                      >
                        تعديل الرصيد
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 6: PROVIDER API SETTINGS & TEST */}
      {currentSubTab === 'provider' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" />
              <span>إعدادات الاتصال بمزود الخدمة (SMM Provider API)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              الربط الآمن المتوافق مع بروتوكول SMM API v2 المعتمد عالمياً (إضافة طلبات، استعلام عن الحالات، وفحص الرصيد).
            </p>
          </div>

          <form onSubmit={handleSaveProviderSettings} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">رابط API المزود (Provider Endpoint URL)</label>
              <input
                type="url"
                required
                value={provApiUrl}
                onChange={(e) => setProvApiUrl(e.target.value)}
                placeholder="https://api.smm-provider.com/api/v2"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono text-left"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">مفتاح API السري للمزود (API Key)</label>
              <input
                type="password"
                value={provApiKey}
                onChange={(e) => setProvApiKey(e.target.value)}
                placeholder="أدخل مفتاحك السري هنا..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono text-left"
                dir="ltr"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                ملاحظة أمنية: يتم تخزين المفتاح على السيرفر فقط ولا يُرسل أبداً للواجهة أو للمتصفح.
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={provTestMode}
                  onChange={(e) => setProvTestMode(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4"
                />
                <div>
                  <div className="text-xs font-bold text-white">وضع المحاكاة الآمن (Sandbox / Test Mode)</div>
                  <div className="text-[11px] text-slate-400">
                    عند التفعيل، يستجيب النظام بأرقام طلبات تجريبية ويحاكي ردود المزود دون خصم أموال حقيقية من حساب المزود الخارجي.
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer pt-2 border-t border-slate-800">
                <input
                  type="checkbox"
                  checked={provAutoForward}
                  onChange={(e) => setProvAutoForward(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 w-4 h-4"
                />
                <div>
                  <div className="text-xs font-bold text-white">التمرير التلقائي للطلبات (Auto-Forward Orders)</div>
                  <div className="text-[11px] text-slate-400">
                    إرسال الطلب فورياً للمزود عند قيام العميل بالشراء بدلاً من تركه معلقاً للإدارة.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all"
              >
                حفظ الإعدادات
              </button>

              <button
                type="button"
                onClick={handleTestProviderConnection}
                disabled={testingConnection}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-cyan-800/50 font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Zap className={`w-4 h-4 ${testingConnection ? 'animate-pulse' : ''}`} />
                <span>{testingConnection ? 'جاري الفحص...' : 'اختبار الاتصال بمزود الخدمة الآن'}</span>
              </button>
            </div>
          </form>

          {/* Test Connection Result Box */}
          {testResult && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-2 ${
                testResult.success
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {testResult.success ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
                <span>{testResult.message}</span>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-mono pt-1 text-slate-300">
                <span>زمن الاستجابة (Latency): {testResult.latencyMs}ms</span>
                {testResult.balance !== undefined && (
                  <span>رصيد الحساب لدى المزود: ${testResult.balance.toFixed(2)}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 7: TICKETS */}
      {currentSubTab === 'tickets' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Headphones className="w-5 h-5 text-indigo-400" />
              <span>تذاكر الدعم الفني واستفسارات العملاء</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-850/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">رقم التذكرة</th>
                  <th className="px-4 py-3 font-semibold">العميل</th>
                  <th className="px-4 py-3 font-semibold">الموضوع</th>
                  <th className="px-4 py-3 font-semibold">الأولوية</th>
                  <th className="px-4 py-3 font-semibold">الحالة</th>
                  <th className="px-4 py-3 font-semibold">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-850/40">
                    <td className="px-4 py-3 font-mono font-bold text-cyan-300">{t.ticketNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{t.username}</div>
                      <div className="text-[10px] text-slate-400">{t.userEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-200 font-semibold">{t.subject}</td>
                    <td className="px-4 py-3">
                      <span className="text-slate-300 font-mono text-[11px]">{t.priority}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400">
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(t.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reply & Send SMS to Customer Phone Modal */}
      {replyOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative text-right">
            <div className="p-6 pb-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400">
                <span className="text-lg">📱</span>
                <div>
                  <h3 className="text-base font-black text-white">إرسال رسالة وإشعار خارجي لهاتف العميل</h3>
                  <p className="text-xs text-slate-400">طلب #{replyOrder.orderNumber} - {replyOrder.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyOrder(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">العميل:</span>
                  <span className="font-bold text-white">{replyOrder.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">الخدمة:</span>
                  <span className="font-bold text-amber-400">{replyOrder.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">الرابط / المعرف ID:</span>
                  <span className="font-mono text-emerald-400 truncate max-w-[240px]">{replyOrder.link}</span>
                </div>
              </div>

              {/* Quick Template Buttons */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-300">ردود جاهزة وسريعة لهاتف العميل:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReplyMessage(`✅ تم شحن وتنفيذ طلبك #${replyOrder.orderNumber} (${replyOrder.serviceName}) بنجاح! تفضل بمراجعة حسابك داخل اللعبة. نشكرك لثقتك بمنصة KOUMND.`)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-right text-[11px] text-emerald-300 transition-colors cursor-pointer"
                  >
                    ✅ تم الشحن والتنفيذ بنجاح
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyMessage(`🚀 طلبك #${replyOrder.orderNumber} قيد المعالجة والتنفيذ الفوري من السيرفر، وسيصلك إشعار بالانتهاء خلال دقائق.`)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-right text-[11px] text-cyan-300 transition-colors cursor-pointer"
                  >
                    🚀 قيد التنفيذ السريع
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyMessage(`💎 تم تجهيز الحساب المطلوب #${replyOrder.orderNumber}! تفضل بمراسلتنا على الواتساب 01556266856 لاستلام كود التحقق ونقل البريد الأصلي فوراً.`)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-right text-[11px] text-amber-300 transition-colors cursor-pointer"
                  >
                    💎 تسليم حساب جاهز
                  </button>
                  <button
                    type="button"
                    onClick={() => setReplyMessage(`⚠️ بخصوص طلبك #${replyOrder.orderNumber}، يرجى التأكد من كتابة معرّف اللاعب (Player ID) بشكل صحيح والتواصل مع الدعم الفني.`)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-right text-[11px] text-rose-300 transition-colors cursor-pointer"
                  >
                    ⚠️ تنبيه نقص بيانات
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  نص الرسالة التي ستصل لهاتف العميل:
                </label>
                <textarea
                  rows={3}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="اكتب رسالة مخصصة للعميل..."
                />
              </div>

              {replySuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                  {replySuccessMsg}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  disabled={isSendingReply || !replyMessage.trim()}
                  onClick={() => handleSendSmsReply('SMS')}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>📲 إرسال SMS رسمي وتوثيقه</span>
                </button>
                {replyWhatsappUrl ? (
                  <a
                    href={replyWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <span>💬 فتح محادثة واتساب العميل</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled={isSendingReply || !replyMessage.trim()}
                    onClick={() => handleSendSmsReply('WhatsApp')}
                    className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>💬 إرسال عبر واتساب</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Balance Adjust Modal */}
      {adjustUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-right">
            <h3 className="text-base font-black text-white mb-1">
              تعديل رصيد العميل: {adjustUser.username}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              الرصيد الحالي: <strong className="text-emerald-400 font-mono">${adjustUser.balance.toFixed(2)}</strong>
            </p>

            <form onSubmit={handleManualBalanceAdjust} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">نوع العملية</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustAction('add')}
                    className={`py-2 text-xs font-bold rounded-lg border ${
                      adjustAction === 'add'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    + إضافة رصيد
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustAction('deduct')}
                    className={`py-2 text-xs font-bold rounded-lg border ${
                      adjustAction === 'deduct'
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    - خصم رصيد
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">المبلغ ($ USD)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">السبب الإداري (إلزامي للتوثيق المالي)</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تعويض عن تأخير / مكافأة شحن..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl disabled:opacity-50"
                >
                  {isAdjusting ? 'جاري التنفيذ...' : 'تأكيد التعديل المالي'}
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustUser(null)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {isAddServiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-right space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">إضافة خدمة أو باقة جديدة إلى السيرفر</h3>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg">
                <span>📍 سيتم الحفظ داخل:</span>
                <span className="text-white underline">
                  {categories.find((c) => c.id === newServiceCat)?.name || 'فئة غير محددة'}
                </span>
              </div>
            </div>

            <form onSubmit={handleAddService} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اختر الفئة المستهدفة بدقة</label>
                <select
                  value={newServiceCat}
                  onChange={(e) => setNewServiceCat(e.target.value)}
                  className="w-full bg-slate-800 border-2 border-indigo-500/60 rounded-xl px-3 py-2 text-xs text-white font-bold"
                >
                  <optgroup label="🎮 ألعاب الشحن المباشر">
                    {categories.filter((c) => GAMING_CATEGORY_IDS.includes(c.id)).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="📱 خدمات السوشيال ميديا">
                    {categories.filter((c) => !GAMING_CATEGORY_IDS.includes(c.id)).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اسم الخدمة أو الباقة</label>
                <input
                  type="text"
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder={
                    newServiceCat === 'cat_freefire'
                      ? 'مثال: فري فاير | شحن 210 + 21 جوهرة مجاناً Diamonds بالـ ID'
                      : newServiceCat === 'cat_pubg'
                      ? 'مثال: ببجي موبايل | شحن 60 شدة (60 UC) فوري بالأيدي ID'
                      : 'مثال: متابعين تيك توك حقيقيين ضمان تعويض فوري'
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1">سعر البيع للزبائن (ج.م)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    className="w-full bg-slate-800 border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">لكل 1000 أو للباقة كاملة</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">تكلفة المزود الأصلية (ج.م)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newServiceCost}
                    onChange={(e) => setNewServiceCost(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">تكلفة المورد الأساسية</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الحد الأدنى</label>
                  <input
                    type="number"
                    required
                    value={newServiceMin}
                    onChange={(e) => setNewServiceMin(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الحد الأقصى</label>
                  <input
                    type="number"
                    required
                    value={newServiceMax}
                    onChange={(e) => setNewServiceMax(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">السرعة المتوقعة</label>
                <input
                  type="text"
                  value={newServiceSpeed}
                  onChange={(e) => setNewServiceSpeed(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">وصف الخدمة وشروطها</label>
                <textarea
                  rows={2}
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  placeholder="وصف تفصيلي يظهر للعميل عند الطلب..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
                >
                  حفظ ونشر الخدمة
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddServiceOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-right my-8">
            <h3 className="text-base font-black text-white mb-1 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-amber-400" />
              <span>تعديل بيانات الخدمة والأسعار</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              معرف الخدمة: <span className="font-mono text-indigo-400 font-bold">{editingService.id}</span>
            </p>

            <form onSubmit={handleSaveServiceEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اسم الخدمة</label>
                <input
                  type="text"
                  required
                  value={editServiceName}
                  onChange={(e) => setEditServiceName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الفئة</label>
                <select
                  value={editServiceCat}
                  onChange={(e) => setEditServiceCat(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1">
                    سعر البيع للزبائن (ج.م)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editServicePrice}
                    onChange={(e) => setEditServicePrice(e.target.value)}
                    className="w-full bg-slate-800 border-2 border-amber-500/60 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">سعر الألف (1K) بالجنيه</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    تكلفة المزود الأصلية (ج.م)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editServiceCost}
                    onChange={(e) => setEditServiceCost(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">تكلفة المورد الأساسية</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الحد الأدنى للكمية</label>
                  <input
                    type="number"
                    required
                    value={editServiceMin}
                    onChange={(e) => setEditServiceMin(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الحد الأقصى للكمية</label>
                  <input
                    type="number"
                    required
                    value={editServiceMax}
                    onChange={(e) => setEditServiceMax(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">السرعة المكتوبة للعميل</label>
                <input
                  type="text"
                  value={editServiceSpeed}
                  onChange={(e) => setEditServiceSpeed(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editServiceActive}
                    onChange={(e) => setEditServiceActive(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span>الخدمة نشطة ومتاحة في المتجر</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editServiceIsOffer}
                    onChange={(e) => setEditServiceIsOffer(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600"
                  />
                  <span>عرض حصري مخفض (خصم 20% ربح)</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الوصف</label>
                <textarea
                  rows={2}
                  value={editServiceDesc}
                  onChange={(e) => setEditServiceDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? 'جاري حفظ التعديلات...' : 'حفظ التعديلات الآن'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fast Pricing & Profit Margin Calculator Modal */}
      {pricingModalService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative text-right my-8 space-y-4">
            
            {/* Modal Header */}
            <div className="border-b border-slate-800 pb-3 flex items-start justify-between">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-amber-400" />
                  <span>حاسبة وضبط أسعار الخدمة وهامش الربح</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  #{pricingModalService.providerServiceId || pricingModalService.id} -{' '}
                  <span className="text-slate-300 font-sans font-bold">{pricingModalService.name}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPricingModalService(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {/* Live Pricing Overview Card */}
            {(() => {
              const currentCost = parseFloat(pricingCost) || 0;
              const currentPrice = parseFloat(pricingPrice) || 0;
              const liveProfit = Math.round((currentPrice - currentCost) * 100) / 100;
              const liveMargin = currentCost > 0 ? Math.round(((currentPrice - currentCost) / currentCost) * 10000) / 100 : 0;
              const isGaming = GAMING_CATEGORY_IDS.includes(pricingModalService.categoryId);

              return (
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">تكلفة المزود الأصلية</span>
                    <span className="text-sm font-bold text-slate-300">{currentCost.toFixed(2)} ج.م</span>
                    <span className="text-[9px] text-slate-500 block font-sans">
                      {isGaming ? 'ألعاب مباشر' : 'سوشيال ميديا'}
                    </span>
                  </div>
                  <div className="border-x border-slate-800">
                    <span className="text-[10px] text-amber-400 block font-sans">سعر البيع المقترح</span>
                    <span className="text-sm font-black text-amber-300">{currentPrice.toFixed(2)} ج.م</span>
                    <span className="text-[9px] text-slate-500 block font-sans">للزبائن بالجنيه</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 block font-sans">صافي الربح والهامش</span>
                    <span className={`text-sm font-black ${liveProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {liveProfit >= 0 ? `+${liveProfit.toFixed(2)}` : liveProfit.toFixed(2)} ج.م
                    </span>
                    <span className="text-[9px] text-emerald-300 block">
                      %{liveMargin.toFixed(1)} هامش
                    </span>
                  </div>
                </div>
              );
            })()}

            <form onSubmit={handleSaveFastPricing} className="space-y-4">
              
              {/* Provider Cost Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  سعر تكلفة المزود الأساسية (Original Cost ج.م)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={pricingCost}
                  onChange={(e) => handlePricingCostChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  placeholder="0.00"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  المبلغ الفعلي لتكلفة الخدمة عند المزود لحساب هامش الربح بدقة.
                </span>
              </div>

              {/* Target Margin Input + Quick Presets */}
              <div className="p-3 rounded-xl bg-slate-850/60 border border-slate-750 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-amber-400" />
                    <span>نسبة هامش الربح المستهدفة (%)</span>
                  </label>
                  <span className="text-[10px] text-indigo-400 font-bold">حساب تلقائي لسعر البيع</span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={pricingTargetMargin}
                    onChange={(e) => handleTargetMarginChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono text-left font-bold"
                    placeholder="30"
                  />
                  <Percent className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 ml-1">نسب معتمدة:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetMargin(30)}
                    className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold cursor-pointer"
                  >
                    +30% (سوشيال)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetMargin(8)}
                    className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold cursor-pointer"
                  >
                    +8% (ألعاب)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetMargin(50)}
                    className="px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold cursor-pointer"
                  >
                    +50% (أرباح عالية)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetMargin(15)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-750 text-[10px] font-bold cursor-pointer"
                  >
                    +15% (تنافسي)
                  </button>
                </div>
              </div>

              {/* Direct Selling Price Input */}
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1">
                  سعر البيع النهائي للزبائن (ج.م لكل 1000 أو لكل باقة)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={pricingPrice}
                    onChange={(e) => handleSellingPriceChange(e.target.value)}
                    className="w-full bg-slate-800 border-2 border-amber-500/60 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400">
                    ج.م
                  </span>
                </div>
              </div>

              {/* Validation Warning Gate */}
              {pricingValidationError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{pricingValidationError}</span>
                </div>
              )}

              {/* Psychological Fake Anchor Discount Settings */}
              <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-750 space-y-2.5">
                <label className="flex items-center gap-2.5 text-xs text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pricingIsOffer}
                    onChange={(e) => {
                      const willBeOffer = e.target.checked;
                      setPricingIsOffer(willBeOffer);
                      if (willBeOffer) {
                        const cost = parseFloat(pricingCost) || 0;
                        const margin = parseFloat(pricingTargetMargin) || 30;
                        const calc = calculateSellingPrice(cost, margin, true);
                        setPricingAnchorPrice(calc.originalPriceBeforeDiscount?.toString() || '');
                      } else {
                        setPricingAnchorPrice('');
                      }
                    }}
                    className="w-4 h-4 rounded text-rose-500 bg-slate-900 border-slate-700"
                  />
                  <div className="font-bold">تفعيل عرض مخفض ترويجي (سعر شطب وهمي جذاب)</div>
                </label>

                {pricingIsOffer && (
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-300">
                      السعر قبل الخصم (سعر الشطب الذي يراه الزبون)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={pricingAnchorPrice}
                        onChange={(e) => setPricingAnchorPrice(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                        placeholder="مثال: 95.00"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">ج.م</span>
                    </div>
                    <div className="text-[10px] text-slate-400 leading-relaxed">
                      💡 يظهر للزبون: <span className="line-through text-slate-400 font-mono">{pricingAnchorPrice || '---'} ج.م</span>{' '}
                      ويشتري بـ <strong className="text-amber-300 font-mono">{pricingPrice} ج.م</strong>. أنت تحصل على هامش ربحك المضمون بالكامل!
                    </div>
                  </div>
                )}
              </div>

              {/* Service Availability Toggle */}
              <div className="p-3 rounded-xl bg-slate-850/60 border border-slate-750 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">حالة التوفر وقبول الطلبات</div>
                  <div className="text-[10px] text-slate-400">
                    {pricingIsAvailable ? 'الخدمة معروضة ومتاحة للشراء' : 'الخدمة غير متوفرة ومينفعش يطلب (تظهر شارة غير متوفر للعميل)'}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pricingIsAvailable}
                    onChange={(e) => setPricingIsAvailable(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSavingPricing || Boolean(pricingValidationError)}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingPricing ? 'جاري حفظ وتحديث السعر...' : 'حفظ وتطبيق السعر فوراً'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPricingModalService(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
