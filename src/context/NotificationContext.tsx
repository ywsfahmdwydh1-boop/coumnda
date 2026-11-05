import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext.tsx';
import { AppNotification, EmailNotification } from '../types/index.ts';
import {
  Bell,
  Check,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Rocket,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export interface RetryOrderData {
  serviceId?: string;
  serviceName?: string;
  link?: string;
  quantity?: number;
  orderNumber?: string;
  charge?: number;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  emails: EmailNotification[];
  latestToast: AppNotification | null;
  dismissToast: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchEmails: () => Promise<void>;
  sendBroadcastAnnouncement: (title: string, message: string) => Promise<boolean>;
  pushPermission: 'default' | 'granted' | 'denied' | 'unsupported';
  requestPushPermission: () => Promise<boolean>;
  showPushPrompt: boolean;
  dismissPushPrompt: () => void;
  onOrderStatusChangeListeners: Set<(data: any) => void>;
  subscribeToOrderUpdates: (callback: (data: any) => void) => () => void;
  // Retry mechanism ("مع إعادة المحاولة")
  pendingRetryOrder: RetryOrderData | null;
  triggerRetryOrder: (order: RetryOrderData) => void;
  clearRetryOrder: () => void;
  connectionStatus: 'connected' | 'connecting' | 'reconnecting' | 'offline';
  manualRetryConnection: () => void;
  onNavigateToTab?: (tab: string) => void;
  registerNavigationHandler: (handler: (tab: string) => void) => () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Web Audio API Chime Synthesizer
function playNotificationChime(kind: 'completed' | 'canceled' | 'progress' | 'default' = 'default') {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (kind === 'completed') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (kind === 'canceled') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(349.23, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch {
    // Non-blocking
  }
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [emails, setEmails] = useState<EmailNotification[]>([]);
  const [latestToast, setLatestToast] = useState<AppNotification | null>(null);

  // Connection & Retry Status
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'reconnecting' | 'offline'>('connecting');
  const [pendingRetryOrder, setPendingRetryOrder] = useState<RetryOrderData | null>(null);

  // Native Push
  const [pushPermission, setPushPermission] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
  const [showPushPrompt, setShowPushPrompt] = useState<boolean>(false);

  const orderListenersRef = useRef<Set<(data: any) => void>>(new Set());
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const navigationHandlerRef = useRef<((tab: string) => void) | null>(null);

  const registerNavigationHandler = useCallback((handler: (tab: string) => void) => {
    navigationHandlerRef.current = handler;
    return () => {
      if (navigationHandlerRef.current === handler) {
        navigationHandlerRef.current = null;
      }
    };
  }, []);

  const triggerRetryOrder = useCallback((order: RetryOrderData) => {
    setPendingRetryOrder(order);
    setLatestToast(null);
    if (navigationHandlerRef.current) {
      navigationHandlerRef.current('services');
    }
  }, []);

  const clearRetryOrder = useCallback(() => {
    setPendingRetryOrder(null);
  }, []);

  // Check initial permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushPermission(Notification.permission as any);
      if (Notification.permission === 'default') {
        const dismissed = localStorage.getItem('koumnd_push_prompt_dismissed');
        if (!dismissed) {
          setShowPushPrompt(true);
        }
      }
    } else {
      setPushPermission('unsupported');
    }
  }, []);

  const requestPushPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPushPermission('unsupported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission as any);
      setShowPushPrompt(false);
      localStorage.setItem('koumnd_push_prompt_dismissed', 'true');

      if (permission === 'granted') {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(async (reg) => {
            try {
              let sub = await reg.pushManager.getSubscription();
              if (!sub) {
                sub = await reg.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZ_WJJn52ZsPWzzLQf_6321q0nGyL1Y8v1Lq3fQ',
                }).catch(() => null);
              }
              if (sub) {
                await fetch('/api/push/subscribe', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                  body: JSON.stringify({
                    subscription: sub,
                    role: user?.role || 'user',
                  }),
                }).catch(() => {});
              }
            } catch {
              // Service worker push fallback
            }
          });
        }

        triggerNativeNotification('تم تفعيل إشعارات KOUMND بنجاح! 🔔', {
          body: 'ستصلك الآن إشعارات فورية مباشرة على شاشة هاتفك عند وصول الطلبات الجديدة وتحديث حالتها.',
          tag: 'welcome_push',
        });
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Failed to request notification permission', e);
      return false;
    }
  };

  const dismissPushPrompt = () => {
    setShowPushPrompt(false);
    localStorage.setItem('koumnd_push_prompt_dismissed', 'true');
  };

  const triggerNativeNotification = (title: string, options: NotificationOptions = {}) => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      const defaultOptions: NotificationOptions = {
        icon: '/images/logo.png',
        badge: '/images/logo.png',
        ...options,
      };

      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, defaultOptions);
        });
      } else {
        new Notification(title, defaultOptions);
      }
    } catch (err) {
      console.warn('Native notification trigger error', err);
    }
  };

  const subscribeToOrderUpdates = useCallback((callback: (data: any) => void) => {
    orderListenersRef.current.add(callback);
    return () => {
      orderListenersRef.current.delete(callback);
    };
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setConnectionStatus('connected');
      }
    } catch (e) {
      console.warn('Error fetching notifications:', e);
      setConnectionStatus('offline');
    }
  }, [token]);

  const fetchEmails = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/emails', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const markAsRead = async (id: string) => {
    if (!token) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await fetch(`/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const sendBroadcastAnnouncement = async (title: string, message: string): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, message }),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const dismissToast = () => {
    setLatestToast(null);
  };

  const manualRetryConnection = () => {
    setConnectionStatus('reconnecting');
    fetchNotifications();
    fetchEmails();
  };

  // Setup WebSocket connection with robust backoff retry and event handlers
  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      return;
    }

    fetchNotifications();
    fetchEmails();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;

    let retryCount = 0;
    let isDisposed = false;

    const connectWebSocket = () => {
      if (isDisposed) return;
      setConnectionStatus(retryCount === 0 ? 'connecting' : 'reconnecting');

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (isDisposed) return;
          retryCount = 0;
          setConnectionStatus('connected');
        };

        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);

            // 1. App Notification Event
            if (parsed.event === 'admin_external_alert' && parsed.data) {
              triggerNativeNotification(`🚨 طلب جديد في KOUMND! (#${parsed.data.orderNumber})`, {
                body: `العميل: ${parsed.data.customerName} • الخدمة: ${parsed.data.serviceName} (${parsed.data.charge} ج.م)`,
                tag: `admin_alert_${parsed.data.orderId}`,
              });
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('admin_external_order_event', { detail: parsed.data }));
              }
            }

            if (parsed.event === 'notification' && parsed.data) {
              const newNotif = parsed.data as AppNotification;
              setNotifications((prev) => [newNotif, ...prev]);
              setUnreadCount((prev) => prev + 1);
              setLatestToast(newNotif);

              // Sound chime according to status
              if (newNotif.orderStatus === 'completed' || newNotif.title.includes('مكتمل')) {
                playNotificationChime('completed');
              } else if (newNotif.orderStatus === 'canceled' || newNotif.orderStatus === 'refunded' || newNotif.title.includes('ملغي')) {
                playNotificationChime('canceled');
              } else {
                playNotificationChime('progress');
              }

              // Trigger phone/browser lockscreen push notification
              triggerNativeNotification(newNotif.title, {
                body: newNotif.message,
                tag: newNotif.id,
              });

              // Auto-dismiss in-app toast after 8 seconds
              setTimeout(() => {
                setLatestToast((current) => (current?.id === newNotif.id ? null : current));
              }, 8000);
            }

            // 2. Order Status Change Listener
            if (parsed.event === 'order_status_change' && parsed.data) {
              orderListenersRef.current.forEach((cb) => cb(parsed.data));
            }

            // 3. Deposit Status Change Listener
            if (parsed.event === 'deposit_status_change' && parsed.data) {
              orderListenersRef.current.forEach((cb) => cb(parsed.data));
            }

          } catch (err) {
            console.error('Error handling WS message', err);
          }
        };

        ws.onclose = () => {
          socketRef.current = null;
          if (isDisposed) return;
          setConnectionStatus('reconnecting');
          // Exponential backoff up to 10 seconds, continuous retry
          const backoffDelay = Math.min(1000 * Math.pow(1.5, retryCount), 10000);
          retryCount++;
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, backoffDelay);
        };

        ws.onerror = () => {
          // Handled silently
        };
      } catch {
        setConnectionStatus('offline');
      }
    };

    connectWebSocket();

    // Background polling fallback every 15 seconds to guarantee fresh data even if WebSockets are blocked
    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    return () => {
      isDisposed = true;
      clearInterval(pollInterval);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [token, user?.id, fetchNotifications, fetchEmails]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        emails,
        latestToast,
        dismissToast,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
        fetchEmails,
        sendBroadcastAnnouncement,
        pushPermission,
        requestPushPermission,
        showPushPrompt,
        dismissPushPrompt,
        onOrderStatusChangeListeners: orderListenersRef.current,
        subscribeToOrderUpdates,
        pendingRetryOrder,
        triggerRetryOrder,
        clearRetryOrder,
        connectionStatus,
        manualRetryConnection,
        registerNavigationHandler,
      }}
    >
      {children}

      {/* ========================================================================= */}
      {/* PHONE PUSH PERMISSION PROMPT BANNER                                      */}
      {/* ========================================================================= */}
      {showPushPrompt && pushPermission === 'default' && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom duration-300">
          <div className="rounded-2xl bg-slate-900 border-2 border-amber-500/60 p-4 shadow-2xl backdrop-blur-xl text-right space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>تفعيل إشعارات الهاتف المباشرة</span>
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  هل تسمح لـ <strong>KOUMND</strong> بإرسال إشعارات على شاشة هاتفك عند اكتمال طلبك، أو الرد عليه، أو إضافة رصيد لمحفظتك فورياً؟
                </p>
              </div>
              <button
                type="button"
                onClick={dismissPushPrompt}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={requestPushPermission}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>سماح بإرسال الإشعارات</span>
              </button>
              <button
                type="button"
                onClick={dismissPushPrompt}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                <span>لاحقاً</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING IN-APP TOAST (WITH RETRY ACTION & STATUS BADGES)                */}
      {/* ========================================================================= */}
      {latestToast && (
        <div className="fixed top-20 right-4 sm:right-6 max-w-md w-full z-50 animate-in slide-in-from-top duration-300 pointer-events-auto">
          <div className="rounded-2xl bg-slate-900/98 border-2 border-indigo-500/80 p-4 shadow-2xl backdrop-blur-xl text-right space-y-3">
            <div className="flex items-start gap-3">
              {/* Dynamic status icon */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  latestToast.orderStatus === 'completed' || latestToast.title.includes('مكتمل')
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : latestToast.orderStatus === 'canceled' || latestToast.orderStatus === 'refunded' || latestToast.title.includes('ملغي')
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : latestToast.orderStatus === 'in_progress'
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                }`}
              >
                {latestToast.orderStatus === 'completed' || latestToast.title.includes('مكتمل') ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : latestToast.orderStatus === 'canceled' || latestToast.orderStatus === 'refunded' || latestToast.title.includes('ملغي') ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : latestToast.orderStatus === 'in_progress' ? (
                  <Rocket className="w-5 h-5 animate-pulse" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-black text-white truncate">{latestToast.title}</h4>
                  <span className="text-[10px] text-indigo-400 font-mono font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 shrink-0">
                    الآن
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  {latestToast.message}
                </p>
              </div>

              <button
                onClick={dismissToast}
                className="text-slate-400 hover:text-white p-1 rounded-lg shrink-0 cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Buttons: "إعادة المحاولة" & "عرض الطلب" */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              {/* If order is canceled or refunded or flagged retryable */}
              {(latestToast.retryable ||
                latestToast.orderStatus === 'canceled' ||
                latestToast.orderStatus === 'refunded' ||
                latestToast.title.includes('ملغي') ||
                latestToast.title.includes('تعذر')) && (
                <button
                  type="button"
                  onClick={() => {
                    triggerRetryOrder({
                      serviceId: latestToast.serviceId,
                      serviceName: latestToast.serviceName,
                      link: latestToast.target,
                      quantity: latestToast.quantity,
                      orderNumber: latestToast.orderNumber,
                      charge: latestToast.charge,
                    });
                  }}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة المحاولة فوراً</span>
                </button>
              )}

              {/* View Order button */}
              <button
                type="button"
                onClick={() => {
                  dismissToast();
                  if (navigationHandlerRef.current) {
                    navigationHandlerRef.current('orders');
                  }
                }}
                className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400" />
                <span>عرض قائمة الطلبات</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
