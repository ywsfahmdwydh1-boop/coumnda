import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Transaction } from '../../types/index.ts';
import {
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  SlidersHorizontal,
  Search,
  Filter,
  DollarSign,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Wallet,
  ShieldCheck,
  Calendar,
  CreditCard,
  ChevronDown,
} from 'lucide-react';

interface TransactionsViewProps {
  onNavigateToWallet?: () => void;
  onNavigateToOrders?: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onNavigateToWallet,
  onNavigateToOrders,
}) => {
  const { user, token } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTransactions = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [token]);

  // Calculations
  const totalDeposits = transactions
    .filter((t) => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCharges = transactions
    .filter((t) => t.type === 'order_charge')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalRefunds = transactions
    .filter((t) => t.type === 'order_refund')
    .reduce((sum, t) => sum + t.amount, 0);

  // Filtered transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'deposit' && tx.type === 'deposit') ||
      (filterType === 'order_charge' && tx.type === 'order_charge') ||
      (filterType === 'order_refund' && tx.type === 'order_refund');

    const matchesSearch =
      tx.transactionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.referenceId.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getBadge = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg text-[11px] font-bold">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            شحن رصيد إيداع
          </span>
        );
      case 'order_charge':
        return (
          <span className="inline-flex items-center gap-1 text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg text-[11px] font-bold">
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
            خصم شراء خدمة
          </span>
        );
      case 'order_refund':
        return (
          <span className="inline-flex items-center gap-1 text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-lg text-[11px] font-bold">
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            استرداد رصيد ملغي
          </span>
        );
      case 'admin_adjustment':
        return (
          <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg text-[11px] font-bold">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            تسوية مالية إدارية
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 text-right animate-in fade-in duration-300">
      
      {/* Header Banner - Mobile Friendly */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-l from-indigo-900/40 via-slate-900 to-cyan-950/40 border border-indigo-500/20 p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-black">
              <ShieldCheck className="w-4 h-4" />
              <span>دفتر الأستاذ والشفافية المالية المطلقة</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-400" />
              <span>سجل العمليات المالية (Transaction History)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              كشف حساب تفصيلي وشفاف لجميع الإيداعات، والخصومات الفورية عند طلب الخدمات، واستردادات المبالغ، مع توضيح الرصيد بدقة قبل وبعد كل معاملة.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
            {onNavigateToWallet && (
              <button
                onClick={onNavigateToWallet}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <Wallet className="w-4 h-4" />
                شحن رصيد جديد (01556266856)
              </button>
            )}
            <button
              onClick={fetchTransactions}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Grid (Compact on mobile) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Balance Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md text-right">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>الرصيد المتاح</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-400 font-mono">
            {(user?.balance ?? 0).toFixed(2)} ج.م
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            العملة المعتمدة: الجنيه المصري
          </div>
        </div>

        {/* Total Deposits Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md text-right">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>إجمالي الإيداعات</span>
            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-indigo-400 font-mono">
            {totalDeposits.toFixed(2)} ج.م
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">شحن معتمد ومؤكد</div>
        </div>

        {/* Total Charges Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md text-right">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>الخصومات (الطلبات)</span>
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-rose-400 font-mono">
            {totalCharges.toFixed(2)} ج.م
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">خصومات الخدمات</div>
        </div>

        {/* Total Refunds Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md text-right">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>المرتجعات</span>
            <div className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-cyan-400 font-mono">
            {totalRefunds.toFixed(2)} ج.م
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">استردادات طلبات ملغاة</div>
        </div>
      </div>

      {/* Filters and Search Bar (Mobile Optimized) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'جميع الحركات', count: transactions.length },
              {
                id: 'deposit',
                label: 'الإيداعات',
                count: transactions.filter((t) => t.type === 'deposit').length,
              },
              {
                id: 'order_charge',
                label: 'الخصومات',
                count: transactions.filter((t) => t.type === 'order_charge').length,
              },
              {
                id: 'order_refund',
                label: 'الاستردادات',
                count: transactions.filter((t) => t.type === 'order_refund').length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  filterType === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 font-mono">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Field */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم المعاملة أو البيان..."
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm sm:text-base font-black text-white">
              قائمة الحركات المالية ({filteredTransactions.length} حركة)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            آخر تحديث: {new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
            <span>جاري تحميل السجل المالي...</span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-300">لا توجد حركات مالية مطابقة للبحث</p>
            <p className="text-[11px] text-slate-400">
              عند شحن رصيدك أو طلب أي خدمة سيتم توثيق كل عملية هنا بشكل لحظي ومفصل.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Cards (Visible on screens < md) */}
            <div className="block md:hidden divide-y divide-slate-800/80">
              {filteredTransactions.map((tx) => {
                const isPositive = tx.amount > 0;
                return (
                  <div key={tx.id} className="p-4 space-y-2.5 hover:bg-slate-850/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-xs font-black text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {tx.transactionNumber}
                      </div>
                      <div
                        dir="ltr"
                        className={`font-mono text-sm font-black ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPositive ? `+${tx.amount.toFixed(2)} ج.م` : `-${Math.abs(tx.amount).toFixed(2)} ج.م`}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div>{getBadge(tx.type)}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {new Date(tx.createdAt).toLocaleDateString('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {tx.description}
                    </p>

                    {/* Balance Before & After Row */}
                    <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800 flex items-center justify-between text-[11px] font-mono">
                      <div>
                        <span className="text-slate-400">الرصيد قبل: </span>
                        <span className="text-slate-300 font-bold">{tx.balanceBefore.toFixed(2)} ج.م</span>
                      </div>
                      <div className="text-slate-600">➔</div>
                      <div>
                        <span className="text-slate-400">الرصيد بعد: </span>
                        <span className="text-cyan-400 font-black">{tx.balanceAfter.toFixed(2)} ج.م</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (Visible on md and up) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-850/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">رقم المعاملة</th>
                    <th className="px-4 py-3 font-semibold">نوع العملية</th>
                    <th className="px-4 py-3 font-semibold">المبلغ</th>
                    <th className="px-4 py-3 font-semibold">الرصيد قبل</th>
                    <th className="px-4 py-3 font-semibold">الرصيد بعد</th>
                    <th className="px-4 py-3 font-semibold">تفاصيل وبيان الحركة</th>
                    <th className="px-4 py-3 font-semibold">التاريخ والتوقيت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredTransactions.map((tx) => {
                    const isPositive = tx.amount > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-slate-850/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-white whitespace-nowrap">
                          {tx.transactionNumber}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{getBadge(tx.type)}</td>
                        <td
                          dir="ltr"
                          className={`px-4 py-3 font-mono font-black whitespace-nowrap text-left ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPositive ? `+${tx.amount.toFixed(2)} ج.م` : `-${Math.abs(tx.amount).toFixed(2)} ج.م`}
                        </td>
                        <td dir="ltr" className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap text-left">
                          {tx.balanceBefore.toFixed(2)} ج.م
                        </td>
                        <td dir="ltr" className="px-4 py-3 font-mono text-cyan-400 font-black whitespace-nowrap text-left">
                          {tx.balanceAfter.toFixed(2)} ج.م
                        </td>
                        <td className="px-4 py-3 text-slate-200 max-w-sm truncate font-medium">
                          {tx.description}
                        </td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                          {new Date(tx.createdAt).toLocaleDateString('ar-EG', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

    </div>
  );
};
