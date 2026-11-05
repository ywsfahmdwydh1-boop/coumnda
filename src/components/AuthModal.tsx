import React, { useState, useEffect } from 'react';
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
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  RefreshCw,
  Clock,
  Shield,
  HelpCircle,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
}) => {
  const { login, register, setSession } = useAuth();

  // Active Main Tab:
  // 1. 'login': Sign-in (Password or Fast OTP code)
  // 2. 'register': Instant secure registration
  // 3. 'forgot': Guaranteed account & password recovery with OTP
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>(initialTab);

  // Login Mode: 'password' or 'otp'
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginOtpCode, setLoginOtpCode] = useState('');
  const [isOtpSentForLogin, setIsOtpSentForLogin] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regIdentifier, setRegIdentifier] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Forgot Password / Recovery States (Guaranteed Recovery - ضمان استرجاع)
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [isRecoveryCodeSent, setIsRecoveryCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Feedback States
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync initial tab when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialTab]);

  // Countdown timer for code resend
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!isOpen) return null;

  // ----------------------------------------------------
  // 1. LOGIN HANDLERS
  // ----------------------------------------------------
  const handleLoginWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = loginIdentifier.trim();
    if (!cleanId || !loginPassword) {
      setError('يرجى إدخال رقم الهاتف أو البريد الإلكتروني وكلمة المرور');
      return;
    }
    setError(null);
    setLoading(true);
    const res = await login(cleanId, loginPassword);
    setLoading(false);
    if (res.success) {
      setSuccessMsg('تم تسجيل الدخول بنجاح! مرحباً بك.');
      setTimeout(() => onClose(), 600);
    } else {
      setError(res.error || 'بيانات الدخول غير مطابقة، يرجى التأكد من الرقم أو كلمة المرور');
    }
  };

  const handleSendLoginOtp = async () => {
    const cleanId = loginIdentifier.trim();
    if (!cleanId) {
      setError('يرجى كتابة رقم هاتفك أو بريدك الإلكتروني لإرسال الرمز');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'تعذر إرسال كود الدخول');
      } else {
        setIsOtpSentForLogin(true);
        setSuccessMsg(data.message || 'تم إرسال كود الدخول السري بنجاح!');
        setCountdown(60);
      }
    } catch {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = loginIdentifier.trim();
    if (!cleanId || !loginOtpCode.trim()) {
      setError('يرجى إدخال كود التحقق السري المكون من 6 أرقام');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, code: loginOtpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'كود التحقق غير صحيح أو انتهت صلاحيته');
      } else {
        setSession(data.token, data.user);
        setSuccessMsg('تم تأكيد الرمز وتسجيل الدخول فوراً!');
        setTimeout(() => onClose(), 600);
      }
    } catch {
      setError('حدث خطأ أثناء التحقق من الرمز');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // 2. REGISTER HANDLER
  // ----------------------------------------------------
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = regName.trim();
    const cleanId = regIdentifier.trim();
    if (!cleanName || !cleanId || !regPassword) {
      setError('يرجى كتابة الاسم ورقم الهاتف أو البريد وكلمة المرور');
      return;
    }
    if (regPassword.length < 5) {
      setError('كلمة المرور يجب ألا تقل عن 5 خانات لتأمين حسابك');
      return;
    }
    setError(null);
    setLoading(true);
    const res = await register(cleanName, cleanId, regPassword);
    setLoading(false);
    if (res.success) {
      setSuccessMsg('🎉 تم إنشاء حسابك بنجاح وتسجيل الدخول فوراً!');
      setTimeout(() => onClose(), 800);
    } else {
      setError(res.error || 'فشل إنشاء الحساب، قد يكون هذا الرقم أو البريد مستخدماً بالفعل');
    }
  };

  // ----------------------------------------------------
  // 3. GUARANTEED ACCOUNT RECOVERY (ضمان استرجاع)
  // ----------------------------------------------------
  const handleSendRecoveryCode = async () => {
    const cleanId = forgotIdentifier.trim();
    if (!cleanId) {
      setError('يرجى إدخال رقم هاتفك أو بريدك المسجل لإرسال كود الاسترجاع');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'لم يتم العثور على حساب مسجل بهذا الرقم أو البريد');
      } else {
        setIsRecoveryCodeSent(true);
        setSuccessMsg(data.message || 'تم إرسال كود استعادة كلمة المرور بنجاح في رسالة SMS / بريد!');
        setCountdown(60);
      }
    } catch {
      setError('حدث خطأ في الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = forgotIdentifier.trim();
    if (!cleanId || !recoveryCode.trim() || !recoveryNewPassword) {
      setError('يرجى كتابة كود التحقق وكلمة المرور الجديدة');
      return;
    }
    if (recoveryNewPassword.length < 6) {
      setError('كلمة المرور الجديدة يجب أن تكون 6 أحرف أو أرقام على الأقل');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanId,
          code: recoveryCode.trim(),
          newPassword: recoveryNewPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'تعذر تعيين كلمة المرور، يرجى التأكد من صحة الكود');
      } else {
        setSession(data.token, data.user);
        setSuccessMsg('✅ تم استرجاع حسابك وتعيين كلمة المرور الجديدة بنجاح! تم تسجيل دخولك فوراً.');
        setTimeout(() => onClose(), 1200);
      }
    } catch {
      setError('حدث خطأ أثناء استعادة الحساب');
    } finally {
      setLoading(false);
    }
  };

  // Google Quick Login Helper
  const handleGoogleQuickLogin = async () => {
    const defaultEmail = prompt('أدخل بريدك الإلكتروني في Google للمتابعة السريعة:', 'user@gmail.com');
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
        setError(data.error || 'فشل الدخول بحساب Google');
      } else {
        setSession(data.token, data.user);
        setSuccessMsg('تم تسجيل الدخول بحساب Google بنجاح!');
        setTimeout(() => onClose(), 500);
      }
    } catch {
      setError('خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  // Password Strength Indicator
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: '', color: 'bg-slate-700', percent: 0 };
    if (pass.length < 5) return { label: 'ضعيفة جداً', color: 'bg-rose-500', percent: 25 };
    if (pass.length < 8) return { label: 'متوسطة', color: 'bg-amber-500', percent: 60 };
    return { label: 'قوية ومحمية 🛡️', color: 'bg-emerald-500', percent: 100 };
  };

  const regStrength = getPasswordStrength(regPassword);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl relative text-right scrollbar-none">
        
        {/* Top Floating Badge & Close Button */}
        <div className="flex items-center justify-between p-5 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-amber-400/50 bg-slate-950 shrink-0">
              <img src="/images/logo.png" alt="KOUMND" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm text-white">KOUMND | كومند</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  تشفير 256-Bit
                </span>
              </div>
              <p className="text-[10px] text-slate-400">بوابة الدخول والاسترجاع الآمنة</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Header & Tab Navigation */}
        <div className="px-5 pt-3">
          <h2 className="text-lg font-black text-white">
            {activeTab === 'login'
              ? 'تسجيل الدخول إلى حسابك'
              : activeTab === 'register'
              ? 'إنشاء حساب جديد في ثوانٍ'
              : 'استعادة الحساب وضمان استرجاع كلمة المرور'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeTab === 'login'
              ? 'أدخل بياناتك للمتابعة السريعة وشحن رصيدك فورياً.'
              : activeTab === 'register'
              ? 'سجّل حسابك الآن واستمتع بأرخص أسعار شحن الألعاب وسرعة التنفيذ.'
              : 'ضمان استرجاع الحساب فوري 100% عبر كود التحقق السري.'}
          </p>

          {/* 3-Way Tab Switcher */}
          <div className="flex bg-slate-950/80 p-1 rounded-2xl mt-3 border border-slate-800 gap-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>تسجيل الدخول</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>حساب جديد</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('forgot');
                setError(null);
                setSuccessMsg(null);
                setForgotIdentifier(loginIdentifier);
              }}
              className={`flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'forgot'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>استرجاع</span>
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 space-y-4">
          
          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="font-medium leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: LOGIN (PASSWORD OR FAST SMS CODE)                                  */}
          {/* ========================================================================= */}
          {activeTab === 'login' && (
            <div className="space-y-3.5">
              
              {/* Login Method Toggle: Password vs Fast OTP */}
              <div className="flex items-center justify-center gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('password');
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    loginMode === 'password'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  بكلمة المرور 🔐
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('otp');
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    loginMode === 'otp'
                      ? 'bg-slate-800 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  برمز SMS السريع 📲
                </button>
              </div>

              {loginMode === 'password' ? (
                /* Standard Password Login */
                <form onSubmit={handleLoginWithPassword} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      رقم الهاتف أو البريد الإلكتروني أو اسم المستخدم:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="01556266856 أو بريدك الإلكتروني"
                        className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-10 text-left font-mono"
                        dir="ltr"
                        autoFocus
                      />
                      <Smartphone className="w-4 h-4 text-slate-400 absolute top-3 right-3.5" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
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
                        نسيت كلمة السر؟ (استرجاع فوري)
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-10 pl-10 text-left font-mono"
                        dir="ltr"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute top-3 right-3.5" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-400 hover:text-slate-200 absolute top-2.5 left-2.5"
                        aria-label="تبديل إظهار كلمة المرور"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
                      />
                      <span>تذكر بياناتي في هذا المتصفح</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 text-white font-black rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{loading ? 'جاري التحقق والدخول...' : 'تسجيل الدخول فوراً ⚡'}</span>
                  </button>
                </form>
              ) : (
                /* Fast OTP SMS/Email Login */
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      رقم الهاتف لتلقي كود الدخول السريع:
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          required
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          placeholder="01xxxxxxxxx"
                          className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-10 text-left font-mono"
                          dir="ltr"
                        />
                        <Smartphone className="w-4 h-4 text-slate-400 absolute top-3 right-3.5" />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendLoginOtp}
                        disabled={loading || countdown > 0}
                        className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                      >
                        {countdown > 0 ? `${countdown} ثانية` : 'إرسال الكود 📲'}
                      </button>
                    </div>
                  </div>

                  {isOtpSentForLogin && (
                    <form onSubmit={handleVerifyLoginOtp} className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-amber-300 mb-1">
                          أدخل كود التحقق السري (6 أرقام):
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={loginOtpCode}
                            onChange={(e) => setLoginOtpCode(e.target.value)}
                            placeholder="123456"
                            className="w-full bg-slate-950 border-2 border-amber-500/60 rounded-xl px-3.5 py-2.5 text-base font-black tracking-widest text-center text-amber-300 placeholder-slate-700 focus:outline-none focus:border-amber-400 font-mono"
                            dir="ltr"
                            autoFocus
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
                      >
                        <Zap className="w-4 h-4" />
                        <span>{loading ? 'جاري التحقق...' : 'تأكيد الرمز والدخول فوراً ✨'}</span>
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Bottom Quick Switch */}
              <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800">
                <span>ليس لديك حساب بعد؟ </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="font-black text-emerald-400 hover:underline cursor-pointer"
                >
                  اضغط هنا لإنشاء حساب في ثوانٍ
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: REGISTER (FAST, SECURE & GUARANTEED)                               */}
          {/* ========================================================================= */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] leading-relaxed flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>حسابك مشفر ومحمي بالكامل مع إمكانية استرجاعه في أي وقت بضمان 100%!</span>
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
                  رقم الهاتف أو البريد الإلكتروني (لتأمين حسابك):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={regIdentifier}
                    onChange={(e) => setRegIdentifier(e.target.value)}
                    placeholder="01xxxxxxxxx أو بريدك الإلكتروني"
                    className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 pr-10 text-left font-mono"
                    dir="ltr"
                  />
                  <Smartphone className="w-4 h-4 text-slate-400 absolute top-3 right-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  كلمة المرور للحساب:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 pr-10 pl-10 text-left font-mono"
                    dir="ltr"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute top-3 right-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-200 absolute top-2.5 left-2.5"
                    aria-label="تبديل إظهار كلمة المرور"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength bar */}
                {regPassword && (
                  <div className="mt-1.5 space-y-1">
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${regStrength.color}`}
                        style={{ width: `${regStrength.percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>قوة كلمة المرور:</span>
                      <span className="font-bold text-slate-300">{regStrength.label}</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98 mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب والدخول فوراً ✨'}</span>
              </button>

              <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800">
                <span>لديك حساب بالفعل؟ </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="font-black text-indigo-400 hover:underline cursor-pointer"
                >
                  اضغط هنا لتسجيل الدخول
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: GUARANTEED RECOVERY & RESET (ضمان استرجاع بكود التحقق)            */}
          {/* ========================================================================= */}
          {activeTab === 'forgot' && (
            <div className="space-y-4">
              
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>ضمان استرجاع الحساب الفوري 100%:</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  أدخل رقم هاتفك أو بريدك المسجل وسيصلك رمز تحقق سري في رسالة SMS لتأكيد هويتك وتعيين كلمة مرور جديدة والدخول فوراً.
                </p>
              </div>

              {/* Step 1: Identifier Input & Send Code */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  رقم الهاتف أو البريد الإلكتروني المسجل:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      required
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="01xxxxxxxxx أو بريدك المسجل"
                      className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 pr-10 text-left font-mono"
                      dir="ltr"
                      autoFocus
                    />
                    <Smartphone className="w-4 h-4 text-slate-400 absolute top-3 right-3.5" />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendRecoveryCode}
                    disabled={loading || countdown > 0}
                    className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all disabled:opacity-50 shrink-0 cursor-pointer active:scale-95 flex items-center gap-1"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{countdown > 0 ? `${countdown} ث` : isRecoveryCodeSent ? 'إعادة الإرسال' : 'إرسال الرمز'}</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Code Input and New Password */}
              {isRecoveryCodeSent && (
                <form onSubmit={handleResetPasswordWithCode} className="space-y-3.5 animate-in fade-in duration-300">
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/40">
                    <label className="block text-xs font-black text-amber-300 mb-1">
                      أدخل رمز التحقق السري (6 أرقام المستلم في هاتفك/بريدك):
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      placeholder="123456"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-black tracking-widest text-center text-amber-300 placeholder-slate-700 focus:outline-none focus:border-amber-400 font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      كلمة المرور الجديدة (6 أحرف أو أرقام على الأقل):
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={recoveryNewPassword}
                        onChange={(e) => setRecoveryNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-800/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 pr-10 pl-10 text-left font-mono"
                        dir="ltr"
                      />
                      <KeyRound className="w-4 h-4 text-slate-400 absolute top-3 right-3.5" />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="p-1 text-slate-400 hover:text-slate-200 absolute top-2.5 left-2.5"
                        aria-label="تبديل إظهار كلمة المرور الجديدة"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{loading ? 'جاري التحقق والتحديث...' : 'تأكيد واستعادة الحساب فوراً 🔐'}</span>
                  </button>
                </form>
              )}

              {/* Direct WhatsApp Emergency Assistance */}
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
                  href="https://wa.me/201556266856?text=مرحباً،%20أحتاج%20مساعدة%20في%20استرجاع%20حسابي%20في%20KOUMND"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 font-bold hover:underline"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>دعم الاسترجاع الفوري عبر واتساب</span>
                </a>
              </div>
            </div>
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
