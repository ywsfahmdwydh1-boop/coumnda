import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { Order } from '../../types/index.ts';
import { canCancelOrder } from '../../lib/orderCalculation.ts';
import {
  Search,
  ExternalLink,
  CheckCircle,
  Clock,
  RotateCcw,
  XCircle,
  AlertCircle,
  RefreshCw,
  Ban,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

interface OrdersViewProps {
  onNavigateToServices: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ onNavigateToServices }) => {
  const { token, updateBalanceLocally } = useAuth();
  const { subscribeToOrderUpdates, triggerRetryOrder } = useNotifications();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Automated real-time listener for order status changes
    const unsub = subscribeToOrderUpdates(() => {
      fetchOrders();
    });
    const interval = setInterval(fetchOrders, 10000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [token, subscribeToOrderUpdates]);

  const handleCancelOrder = async (order: Order) => {
    if (!confirm(`هل أنت متأكد من رغبتك في إلغاء الطلب #${order.orderNumber} واسترداد مبلغ ${order.charge.toFixed(2)} ج.م؟`)) {
      return;
    }

    setCancellingId(order.id);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ type: 'success', message: data.message });
        updateBalanceLocally(data.newBalance);
        // Refresh list
        fetchOrders();
      } else {
        setActionMessage({ type: 'error', message: data.error || 'فشل إلغاء الطلب' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', message: err.message || 'حدث خطأ في الاتصال' });
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5" />
            مكتمل
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Clock className="w-3.5 h-3.5" />
            قيد التنفيذ
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            قيد الانتظار
          </span>
        );
      case 'canceled':
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <RotateCcw className="w-3.5 h-3.5" />
            ملغي / مسترد
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            مكتمل جزئياً
          </span>
        );
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'canceled'
        ? o.status === 'canceled' || o.status === 'refunded'
        : o.status === statusFilter;

    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.link.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 text-right animate-in fade-in duration-300">
      
      {/* Header and Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">سجل طلباتي ومتابعة الحالات</h1>
          <p className="text-xs text-slate-400 mt-1">
            تابع حالة كل طلب وتفاصيل تنفيذه لدى السيرفر وإمكانية الإلغاء والاسترداد المباشر.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            تحديث القائمة
          </button>
          <button
            onClick={onNavigateToServices}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
          >
            + طلب جديد
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{actionMessage.message}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الطلب (مثال: KMD-8821)، اسم الخدمة، أو الرابط..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-10"
          />
          <Search className="w-4 h-4 text-slate-500 absolute top-3.5 right-3.5" />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'in_progress', label: 'قيد التنفيذ' },
            { id: 'pending', label: 'قيد الانتظار' },
            { id: 'completed', label: 'المكتملة' },
            { id: 'canceled', label: 'الملغية والمستردة' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table / Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400">جاري تحميل الطلبات...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <p>لا توجد طلبات تطابق هذا التحديد</p>
            <button
              onClick={onNavigateToServices}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold underline"
            >
              تصفح الخدمات واطلب الآن
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-850/80 text-xs text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">رقم الطلب</th>
                  <th className="px-4 py-3 font-semibold">الخدمة</th>
                  <th className="px-4 py-3 font-semibold">الآيدي / الرابط</th>
                  <th className="px-4 py-3 font-semibold">الكمية / الباقة</th>
                  <th className="px-4 py-3 font-semibold">التكلفة</th>
                  <th className="px-4 py-3 font-semibold">الحالة</th>
                  <th className="px-4 py-3 font-semibold">التاريخ</th>
                  <th className="px-4 py-3 font-semibold text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredOrders.map((order) => {
                  const cancellable = canCancelOrder(order.status);
                  const isBeingCancelled = cancellingId === order.id;
                  const isUrl = order.link && (order.link.startsWith('http://') || order.link.startsWith('https://'));

                  return (
                    <tr key={order.id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-white whitespace-nowrap">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="font-semibold text-white text-xs line-clamp-1">{order.serviceName}</div>
                        <div className="text-[11px] text-slate-400">{order.categoryName}</div>
                      </td>
                      <td className="px-4 py-3.5 max-w-xs truncate">
                        {isUrl ? (
                          <a
                            href={order.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 underline font-mono"
                            dir="ltr"
                          >
                            <span className="truncate max-w-[150px]">{order.link}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs" dir="ltr">
                            <span className="text-[10px] text-amber-400/80">آيدي:</span>
                            <span>{order.link}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-200">
                        {order.quantity === 1 ? '1 باقة' : order.quantity.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-amber-400 whitespace-nowrap">
                        {order.charge.toFixed(2)} ج.م
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {cancellable ? (
                          <button
                            onClick={() => handleCancelOrder(order)}
                            disabled={isBeingCancelled}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors disabled:opacity-50 cursor-pointer"
                            title="إلغاء الطلب واسترداد الرصيد لمحفظتك"
                          >
                            {isBeingCancelled ? 'جاري الإلغاء...' : 'إلغاء واسترداد'}
                          </button>
                        ) : order.status === 'canceled' || order.status === 'refunded' ? (
                          <button
                            onClick={() => {
                              triggerRetryOrder({
                                serviceId: order.serviceId,
                                serviceName: order.serviceName,
                                link: order.link,
                                quantity: order.quantity,
                                orderNumber: order.orderNumber,
                                charge: order.charge,
                              });
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
                            title="إعادة طلب هذه الخدمة بنفس البيانات بنقرة واحدة"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>إعادة المحاولة</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
