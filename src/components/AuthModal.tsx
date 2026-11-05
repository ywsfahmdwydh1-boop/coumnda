import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  AlertCircle,
  Smartphone,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  PhoneCall,
  UserPlus,
  LogIn,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, setSession } = useAuth();

  // Tabs:
  // 1. 'login': Instant sign-in (Phone/Email/Username + Password)
  // 2. 'register': Instant sign-up WITHOUT any waiting or SMS codes!
  // 3. 'forgot': Direct password reset or WhatsApp assistance
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');

  // Login states
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register states
  const [regName, setRegName] = useState('');
  const [regIdentifier, setRegIdentifier] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Forgot password states
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // 1. Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = loginIdentifier.trim();
    if (!cleanId || !loginPassword) {
      setError('يرجى إدخال رقم الهاتف أو البريد وكلمة المرور');
      return;
    }
    setError(null);
    setLoading(true);
    const res = await login(cleanId, loginPassword);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'بيانات الدخول غير صحيحة، يرجى التأكد من الرقم أو البريد وكلمة المرور');
    }
  };

  // 2. Handle Instant Registration (NO SMS CODES NEEDED!)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = regName.trim();
    const cleanId = regIdentifier.trim();
    if (!cleanName || !cleanId || !regPassword) {
      setError('يرجى ملء جميع الحقول المطلوبة لإنشاء الحساب');
      return;
    }
    if (regPassword.length < 5) {
      setError('كلمة المرور يجب أن تتكون من 5 أحرف أو أرقام على الأقل');
      return;
    }
    setError(null);
    setLoading(true);
    const res = await register(cleanName, cleanId, regPassword);
    setLoading(false);
    if (res.success) {
      setSuccessMsg('تم إنشاء حسابك بنجاح وتسجيل الدخول فوراً!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setError(res.error || 'فشل إنشاء الحساب، قد يكون هذا الرقم أو البريد مستخدماً بالفعل');
    }
  };

  // 3. Handle Direct Password Reset
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = forgotIdentifier.trim();
    if (!cleanId || !forgotNewPassword) {
      setError('يرجى كتابة رقم هاتفك أو بريدك وكلمة المرور الجديدة');
      return;
    }
    if (forgotNewPassword.length < 5) {
      setError('كلمة المرور الجديدة يجب ألا تقل عن 5 خانات');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/direct-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, newPassword: forgotNewPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'لم يتم العثور على حساب مسجل بهذا الرقم أو البريد');
      } else {
        setSession(data.token, data.user);
        setSuccessMsg('تم تحديث كلمة المرور وتسجيل الدخول بنجاح!');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  // Quick Google Login helper
  const handleGoogleQuickLogin = async () => {
    const defaultEmail = prompt('أدخل بريدك الإلكتروني في Google للمتابعة:', 'user@gmail.com');
    if (!defaultEmail || !defaultEmail.includes('@')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          email: defaultEmail.trim().toLowerCase(),
          name: defaultEmail.split('@')[0],
          providerUid: defaultEmail.trim().toLowerCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'فشل الدخول عبر Google');
      } else {
        setSession(data.token, data.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative text-right">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-1.5 text-amber-400">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wide">منصة KOUMND • تسجيل آمن ومباشر 100%</span>
          </div>

          <h2 className="text-xl font-black text-white">
            {activeTab === 'login'
              ? 'تسجيل الدخول إلى حسابك'
              : activeTab === 'register'
              ? 'إنشاء حساب جديد فوري'
              : 'استعادة كلمة المرور'}
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            {activeTab === 'login'
              ? 'أدخل رقم هاتفك أو بريدك وكلمة المرور لمتابعة طلباتك وشحن رصيدك.'
              : activeTab === 'register'
              ? 'سجّل حسابك في ثوانٍ معدودة وابدأ في شحن الألعاب والسوشيال ميديا فوراً.'
              : 'أدخل رقم هاتفك أو بريدك المسجل لتعيين كلمة مرور جديدة مباشرة.'}
          </p>

          {/* Clean 2-Way Tab Switcher */}
          <div className="flex bg-slate-950/80 p-1.5 rounded-2xl mt-4 border border-slate-800 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>إنشاء حساب جديد</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 1. LOGIN TAB                                                              */}
          {/* ========================================================================= */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  رقم الهاتف أو البريد الإلكتروني:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="01556266856 أو بريدك الإلكتروني"
                    className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-10 text-left font-mono"
                    dir="ltr"
                    autoFocus
                  />
                  <Smartphone className="w-4 h-4 text-slate-400 absolute top-3.5 right-3.5" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-300">كلمة المرور:</label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('forgot');
                      setError(null);
                      setSuccessMsg(null);
                      setForgotIdentifier(loginIdentifier);
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold hover:underline cursor-pointer"
                  >
                    نسيت كلمة السر؟
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-10 text-left font-mono"
                    dir="ltr"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute top-3.5 right-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 text-white font-black rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'جاري التحقق والدخول...' : 'تسجيل الدخول فوراً'}</span>
              </button>

              <div className="pt-2 text-center">
                <span className="text-xs text-slate-400">ليس لديك حساب بعد؟ </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs font-black text-emerald-400 hover:underline cursor-pointer"
                >
                  اضغط هنا لإنشاء حساب في ثوانٍ
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* 2. INSTANT REGISTER TAB (NO CODES, NO WAITING!)                           */}
          {/* ========================================================================= */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] leading-relaxed flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>تسجيل فوري وسريع 100% دون الحاجة لانتظار أي أكواد SMS أو تفعيل!</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  الاسم الكامل أو اسم المستخدم:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="مثال: يوسف أحمد"
                    className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 pr-10"
                    autoFocus
                  />
                  <User className="w-4 h-4 text-slate-400 absolute top-3 right-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  رقم الهاتف أو البريد الإلكتروني:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={regIdentifier}
                    onChange={(e) => setRegIdentifier(e.target.value)}
                    placeholder="01xxxxxxxxx أو بريدك"
                    className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 pr-10 text-left font-mono"
                    dir="ltr"
                  />
                  <Smartphone className="w-4 h-4 text-slate-400 absolute top-3 right-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  كلمة المرور للحساب (5 أحرف أو أرقام على الأقل):
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 pr-10 text-left font-mono"
                    dir="ltr"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute top-3 right-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98 mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب والدخول فوراً'}</span>
              </button>

              <div className="pt-2 text-center">
                <span className="text-xs text-slate-400">لديك حساب بالفعل؟ </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs font-black text-indigo-400 hover:underline cursor-pointer"
                >
                  اضغط هنا لتسجيل الدخول
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* 3. FORGOT PASSWORD TAB                                                    */}
          {/* ========================================================================= */}
          {activeTab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
                اكتب رقم هاتفك أو بريدك المسجل وكلمة المرور الجديدة وسيتم تغييرها والدخول فوراً، أو تواصل مع الإدارة مباشرة عبر واتساب.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  رقم الهاتف أو البريد المسجل:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="01xxxxxxxxx أو بريدك"
                    className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 pr-10 text-left font-mono"
                    dir="ltr"
                    autoFocus
                  />
                  <Smartphone className="w-4 h-4 text-slate-400 absolute top-3.5 right-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  كلمة المرور الجديدة:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 pr-10 text-left font-mono"
                    dir="ltr"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute top-3.5 right-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-black rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-amber-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>{loading ? 'جاري التحديث...' : 'تحديث كلمة المرور والدخول'}</span>
              </button>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-slate-400 hover:text-white underline cursor-pointer"
                >
                  العودة لتسجيل الدخول
                </button>

                <a
                  href="https://wa.me/201556266856"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>مساعدة عبر واتساب</span>
                </a>
              </div>
            </form>
          )}

          {/* Fast Google Login Alternative */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleGoogleQuickLogin}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>تسجيل الدخول السريع بحساب Google</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
