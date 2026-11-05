import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext.tsx';
import { AppNotification, EmailNotification } from '../types/index.ts';
import { Bell, Check, X, ShieldAlert, Sparkles } from 'lucide-react';

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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [emails, setEmails] = useState<EmailNotification[]>([]);
  const [latestToast, setLatestToast] = useState<AppNotification | null>(null);
  
  // Real Native Push Notifications
  const [pushPermission, setPushPermission] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
  const [showPushPrompt, setShowPushPrompt] = useState<boolean>(false);
  
  const orderListenersRef = useRef<Set<(data: any) => void>>(new Set());
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

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
        // Register PushSubscription with service worker and sync with server
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
              // Service worker push fallback is handled via WebSocket & showNotification
            }
          });
        }

        // Send an immediate test confirmation notification
        triggerNativeNotification('تم تفعيل إشعارات KOUMND بنجاح! 🔔', {
          body: 'ستصلك الآن إشعارات فورية مباشرة على شاشة هاتفك عند وصول الطلبات الجديدة وتأكيد شحن الرصيد.',
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

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEmails = async () => {
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
  };

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
      await fetch('/api/notifications/read-all', {
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

  // Setup WebSocket connection for real-time events & native pushes
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

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          // Connected
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

              // Trigger real phone/browser lockscreen push notification!
              triggerNativeNotification(newNotif.title, {
                body: newNotif.message,
                tag: newNotif.id,
              });

              // Auto-dismiss in-app toast after 6 seconds
              setTimeout(() => {
                setLatestToast((current) => (current?.id === newNotif.id ? null : current));
              }, 6000);
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
          // Reconnect with backoff up to 3 attempts, then rely on background polling
          if (token && retryCount < 3) {
            retryCount++;
            reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
          }
        };

        ws.onerror = () => {
          // Handled silently to avoid noisy console errors if proxy blocks WebSockets
        };
      } catch {
        // Fallback silently
      }
    };

    let retryCount = 0;
    connectWebSocket();

    // Background polling fallback every 20 seconds to guarantee fresh data even if WebSockets are blocked
    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, 20000);

    return () => {
      clearInterval(pollInterval);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [token, user?.id]);

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
      }}
    >
      {children}

      {/* ========================================================================= */}
      {/* PHONE PUSH PERMISSION PROMPT BANNER                                      */}
      {/* "لو حد سمح بأن الإشعارات يظهر له إذن، نبعث له إذن إن كان يوافق ولا لا"  */}
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
                  هل تسمح لـ <strong>KOUMND</strong> بإرسال إشعارات على شاشة هاتفك عند تأكيد شحن الرصيد، أو الرد على طلبك (مكتمل/ملغي)، أو وصول خصومات وعروض حصرية؟
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

      {/* Floating In-App Toast */}
      {latestToast && (
        <div className="fixed top-20 right-4 sm:right-6 max-w-sm w-full z-50 animate-in slide-in-from-top duration-300">
          <div className="rounded-2xl bg-slate-900/95 border-2 border-indigo-500/60 p-4 shadow-2xl backdrop-blur-xl text-right flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-black text-white">{latestToast.title}</div>
              <div className="text-[11px] text-slate-300 mt-0.5">{latestToast.message}</div>
            </div>
            <button
              onClick={dismissToast}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
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
