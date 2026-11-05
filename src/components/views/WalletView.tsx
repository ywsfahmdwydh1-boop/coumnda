import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { DepositRequest } from '../../types/index.ts';
import { persistDepositToFirestore } from '../../lib/firebase.ts';
import {
  Wallet,
  PlusCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Smartphone,
  ShieldCheck,
  Lock,
  TrendingUp,
  Receipt,
  Info,
  Copy,
  Check,
  Zap,
} from 'lucide-react';

export const WalletView: React.FC = () => {
  const { user, token, refreshUser } = useAuth();

  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [amount, setAmount] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [referenceCode, setReferenceCode] = useState<string>('');
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    depositNumber?: string;
  } | null>(null);

  const OFFICIAL_CASH_WALLET = '01556266856';

  const fetchWalletData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const depsRes = await fetch('/api/deposits', { headers: { Authorization: `Bearer ${token}` } });
      const depsData = await depsRes.json();
      setDeposits(depsData.deposits || []);
    } catch (e) {
      console.error('Failed to load wallet data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [token]);

  // Pre-fill phone number from logged in user if available
  useEffect(() => {
    if (user?.phone && !phoneNumber) {
      setPhoneNumber(user.phone);
    }
  }, [user]);

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(OFFICIAL_CASH_WALLET);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  const numAmount = parseFloat(amount) || 0;

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;

    if (numAmount < 10) {
      setFeedback({
        type: 'error',
        message: 'الحد الأدنى لمبلغ الإيداع هو 10 جنيه مصري',
      });
      return;
    }

    if (!phoneNumber.trim()) {
      setFeedback({
        type: 'error',
        message: 'يرجى إدخال رقم الموبايل أو رقم المحفظة المحول منها',
      });
      return;
    }

    setSubmittingDeposit(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: numAmount,
          paymentMethodId: 'pm_cash_wallet_all',
          senderAccountOrNumber: phoneNumber.trim(),
          referenceCode: referenceCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: 'error',
          message: data.error || 'فشل تسجيل طلب الإيداع، يرجى المحاولة مرة أخرى',
        });
      } else {
        if (data.deposit) {
          persistDepositToFirestore(data.deposit).catch((err) =>
            console.warn('[Firestore] Deposit sync fallback:', err)
          );
        }
        setFeedback({
          type: 'success',
          message: data.message || 'تم تسجيل طلب الإيداع بنجاح وهو قيد التحقق المالي والاعتماد.',
          depositNumber: data.deposit?.depositNumber,
        });
        setAmount('');
        setReferenceCode('');
        fetchWalletData();
        refreshUser();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'حدث خطأ في الاتصال بالسيرفر أثناء تسجيل طلب الإيداع',
      });
    } finally {
      setSubmittingDeposit(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 text-right animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* 1. HEADER: OFFICIAL DEPOSIT PAGE TITLE                                    */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-black border border-emerald-500/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>بوابة المدفوعات الإلكترونية المعتمدة</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Wallet className="w-7 h-7 text-emerald-400" />
            <span>إيداع الرصيد</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            شحن المحفظة عبر محفظة كاش المعتمدة رقم <strong className="text-amber-400 font-mono">01556266856</strong> التي تقبل من كافة المحافظ الإلكترونية وطرق الدفع في مصر.
          </p>
        </div>

        <button
          onClick={fetchWalletData}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition-all flex items-center gap-2 border border-slate-700/80 cursor-pointer shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث بيانات الرصيد</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. WALLET BALANCE SUMMARY CARDS                                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Available Balance */}
        <div className="rounded-3xl bg-gradient-to-tr from-indigo-950/70 via-slate-900 to-emerald-950/40 border border-emerald-500/30 p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300">رصيدك الحالي المتاح</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
              {user ? user.balance.toFixed(2) : '0.00'}{' '}
              <span className="text-emerald-400 text-xl font-bold font-sans">ج.م</span>
            </div>
            <p className="text-xs text-emerald-300 mt-2 font-semibold">
              العملة الرسمية: الجنيه المصري (EGP) • متاح لشراء الخدمات وشحن الألعاب فورياً
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>حالة المحفظة: <strong className="text-emerald-400">نشطة ومحمية</strong></span>
            <span>الحد الأدنى للشراء: <strong className="text-amber-400">10.00 ج.م</strong></span>
          </div>
        </div>

        {/* Total Successful Deposits */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300">إجمالي عمليات الإيداع المعتمدة</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shadow">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {deposits
                .filter((d) => d.status === 'approved')
                .reduce((s, d) => s + d.amount, 0)
                .toFixed(2)}{' '}
              <span className="text-sm font-sans font-bold text-slate-300">ج.م</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              عدد العمليات المكتملة بنجاح: {deposits.filter((d) => d.status === 'approved').length} عملية
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>توثيق مالي شفاف ومحمي على الخادم</span>
            <span className="text-emerald-400 font-bold">بدون أي رسوم استقطاع</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. OFFICIAL DEPOSIT FORM («إيداع الرصيد»)                                   */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
        
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              <span>طلب إيداع رصيد جديد</span>
            </h2>
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-400">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>محفظة كاش معتمدة ومؤمنة</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            اكتب رقم الموبايل والمبلغ المطلوب دفعه، وسيظهر لك المبلغ بوضوح، ثم اضغط «تأكيد الدفع».
          </p>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-500/10 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-bold text-white">{feedback.message}</div>
                {feedback.depositNumber && (
                  <div className="text-xs text-emerald-300 font-mono">
                    رقم الطلب المسجل: <strong>{feedback.depositNumber}</strong> • الحالة: قيد المراجعة والتحقق
                  </div>
                )}
                {feedback.type === 'success' && (
                  <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
                    تنبيه أمان: لم يتم خصم أو إضافة الرصيد بعد. سيتم اعتماد المبلغ وإضافته إلى محفظتك مرة واحدة فقط فور التحقق الفعلي من وصول الفلوس على المحفظة.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* EXCLUSIVE UNIFIED CASH WALLET CARD (ONLY THIS METHOD IS DISPLAYED) */}
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-950 to-emerald-500/10 border-2 border-amber-500/50 p-5 shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black text-white">
                    محفظة كاش المعتمدة
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30">
                    تقبل من جميع طرق الدفع والمحافظ
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  تقبل التحويل المباشر من: فودافون كاش • أورنج كاش • اتصالات كاش • وي باي (WE Pay) • إنستاباي InstaPay • منافذ فوري Fawry
                </p>
              </div>
            </div>

            {/* Wallet Number Box & Copy Button */}
            <div className="flex items-center gap-2 bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-2 shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">رقم المحفظة المعتمد:</span>
                <span className="font-mono font-black text-amber-300 text-base tracking-wider" dir="ltr">
                  {OFFICIAL_CASH_WALLET}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyWallet}
                className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-all cursor-pointer"
                title="نسخ رقم المحفظة"
              >
                {copiedWallet ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmitDeposit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* SENDER PHONE NUMBER INPUT */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                1. رقم الموبايل (الرقم أو المحفظة التي قمت بالتحويل منها):
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="مثال: 01012345678 أو رقم حسابك"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pr-10 pl-4 py-3 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  dir="ltr"
                />
                <Smartphone className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                أدخل رقم الموبايل المستخدم في التحويل ليتم التطابق والتحقق فوراً.
              </span>
            </div>

            {/* AMOUNT INPUT */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-300">
                  2. المبلغ المطلوب دفعه (ج.م):
                </label>
                <span className="text-[11px] text-emerald-400 font-bold font-mono">الحد الأدنى: 10 ج.م</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={10}
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="أدخل المبلغ (مثال: 50، 100، 500)"
                  className="w-full bg-slate-800 border-2 border-emerald-500/40 rounded-xl pr-4 pl-12 py-3 text-base sm:text-lg font-black text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono text-right"
                />
                <span className="text-xs text-emerald-400 font-black absolute left-4 top-1/2 -translate-y-1/2">
                  ج.م
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                المبلغ بالجنيه المصري ويضاف بالكامل دون أي خصومات أو استقطاعات.
              </span>
            </div>

          </div>

          {/* OPTIONAL REFERENCE CODE */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                رقم العملية أو كود الإيصال المرجعي إن وُجد (اختياري):
              </label>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                اختياري
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                placeholder="أدخل الرقم المرجعي للعملية إن توفر، أو اتركه فارغاً"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-left"
                dir="ltr"
              />
              <Receipt className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* STEP 5: PROMINENT PAYMENT SUMMARY CARD (CLEAR AMOUNT DISPLAY)             */}
          {/* ========================================================================= */}
          <div className="rounded-2xl bg-slate-950/90 border border-emerald-500/40 p-4 sm:p-5 shadow-inner space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-400" />
                <span>ملخص عملية إيداع الرصيد:</span>
              </span>
              <span className="text-emerald-400 font-bold font-mono">بوابة دفع معتمدة</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div>
                <span className="text-xs text-slate-400 block mb-1">المبلغ المطلوب دفعه بوضوح:</span>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-wide">
                  {numAmount > 0 ? numAmount.toFixed(2) : '0.00'}{' '}
                  <span className="text-emerald-400 text-lg font-sans">جنيه مصري</span>
                </div>
              </div>

              <div className="text-right sm:text-left space-y-0.5 text-xs">
                <div className="text-slate-400">
                  وسيلة الدفع: <strong className="text-amber-400">محفظة كاش المعتمدة ({OFFICIAL_CASH_WALLET})</strong>
                </div>
                <div className="text-slate-400">
                  رقم الموبايل المحول منه:{' '}
                  <strong className="text-cyan-300 font-mono">{phoneNumber || 'لم يُحدد بعد'}</strong>
                </div>
                <div className="text-emerald-400 font-bold">
                  الرسوم والعمولات: 0.00 ج.م (بدون أي رسوم إضافية)
                </div>
              </div>
            </div>

            {/* Clear safety declaration */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                تنبيه أمان: لا تدّعِ المنصة أن الفلوس اتخصمت أو وصلت إلا بعد تأكيد حقيقي من وسيلة الدفع أو اعتماد مسؤول المنصة بعد التحقق لضمان سلامة العمليات.
              </span>
            </div>
          </div>

          {/* STEP 6: CONFIRM PAYMENT BUTTON («تأكيد الدفع») */}
          <button
            type="submit"
            disabled={submittingDeposit}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-base sm:text-lg shadow-xl shadow-emerald-950/60 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
          >
            {submittingDeposit ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>جاري تسجيل طلب الإيداع والتحقق...</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 text-slate-950" />
                <span className="text-slate-950 font-black">
                  تأكيد الدفع ({numAmount > 0 ? `${numAmount.toFixed(2)} ج.م` : 'أدخل المبلغ المطلوب'})
                </span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 4. PREVIOUS DEPOSITS AUDIT HISTORY TABLE                                  */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>سجل عمليات الإيداع السابقة وحالاتها</span>
          </h3>
          <span className="text-xs text-slate-400">
            إجمالي السجلات: <strong className="text-white font-mono">{deposits.length}</strong>
          </span>
        </div>

        {deposits.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            لا توجد عمليات إيداع مسجلة لحسابك حتى الآن.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-850 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">رقم الطلب</th>
                  <th className="px-4 py-3 font-semibold">المبلغ المطلوب</th>
                  <th className="px-4 py-3 font-semibold">وسيلة الدفع</th>
                  <th className="px-4 py-3 font-semibold">رقم الموبايل / الحساب</th>
                  <th className="px-4 py-3 font-semibold">حالة العملية</th>
                  <th className="px-4 py-3 font-semibold">ملاحظات التحقق</th>
                  <th className="px-4 py-3 font-semibold">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                {deposits.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-white whitespace-nowrap">
                      {d.depositNumber}
                    </td>
                    <td className="px-4 py-3 font-mono font-black text-emerald-400 whitespace-nowrap">
                      +{d.amount.toFixed(2)} ج.م
                    </td>
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                      {d.paymentMethodName}
                    </td>
                    <td className="px-4 py-3 font-mono text-cyan-300 whitespace-nowrap" dir="ltr">
                      {d.senderAccountOrNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {d.status === 'approved' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          تم الاعتماد وإضافة الرصيد
                        </span>
                      )}
                      {d.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                          قيد التحقق والتأكيد
                        </span>
                      )}
                      {d.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px]">
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          مرفوض (لم يُضف رصيد)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs truncate text-[11px]">
                      {d.adminNotes || (d.status === 'pending' ? 'بانتظار تأكيد وصول الفلوس واعتماد الإدارة' : '-')}
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {new Date(d.createdAt).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
