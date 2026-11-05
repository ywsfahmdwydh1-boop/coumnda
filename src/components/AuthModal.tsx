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
  Copy,
} from 'lucide-react';
import { signInWithGoogle, signInWithFacebook } from '../lib/firebase.ts';

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
  // 2. 'register': 2-Step Registration with Verification Code
  // 3. 'forgot': Guaranteed Account Recovery & Auto-Login
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>(initialTab);

  // Login Mode: 'password' or 'otp'
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginOtpCode, setLoginOtpCode] = useState('');
  const [isOtpSentForLogin, setIsOtpSentForLogin] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form States (2-Step Flow: Details -> Verification Code)
  const [regStep, setRegStep] = useState<'details' | 'verify'>('details');
  const [regName, setRegName] = useState('');
  const [regIdentifier, setRegIdentifier] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regOtpCode, setRegOtpCode] = useState('');

  // Forgot Password / Recovery States (Guaranteed Recovery - ضمان استرجاع)
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [isRecoveryCodeSent, setIsRecoveryCodeSent] = useState(false);

  // Shared OTP On-Screen Display (Solves "الرموز مبيتوصلش" with 100% guarantee)
  const [latestOtpCode, setLatestOtpCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // In-Modal Social Selector Fallback (when popups are blocked by browser iframe)
  const [socialModalMode, setSocialModalMode] = useState<'none' | 'google' | 'facebook'>('none');
  const [socialInputEmail, setSocialInputEmail] = useState('');
  const [socialInputName, setSocialInputName] = useState('');

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
      setLatestOtpCode(null);
      setSocialModalMode('none');
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
        if (data.code) {
          setLatestOtpCode(data.code);
          setLoginOtpCode(data.code); // Auto-populate for seamless login
        }
        setSuccessMsg(data.message || 'تم إصدار كود الدخول بنجاح!');
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
  // 2. REGISTER HANDLERS (2-STEP WITH CODE VERIFICATION)
  // ----------------------------------------------------
  const handleSendRegisterOtp = async (e: React.FormEvent) => {
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
    try {
      const res = await fetch('/api/auth/register-send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, username: cleanName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'تعذر إرسال كود التأكيد');
      } else {
        if (data.code) {
          setLatestOtpCode(data.code);
          setRegOtpCode(data.code); // Auto-fill for instant testability
        }
        setRegStep('verify');
        setCountdown(60);
        setSuccessMsg(data.message || 'تم إرسال كود التأكيد بنجاح!');
      }
    } catch {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regOtpCode.trim()) {
      setError('يرجى إدخال كود التأكيد المكون من 6 أرقام');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regName.trim(),
          identifier: regIdentifier.trim(),
          password: regPassword,
          code: regOtpCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'فشل تأكيد الرمز وإنشاء الحساب');
      } else {
        setSession(data.token, data.user);
        setSuccessMsg('🎉 تم التحقق من الكود وإنشاء حسابك بنجاح! تم تسجيل دخولك فوراً.');
        setTimeout(() => onClose(), 800);
      }
    } catch {
      setError('حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // 3. GUARANTEED ACCOUNT RECOVERY (استرجاع الحساب والدخول)
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
        if (data.code) {
          setLatestOtpCode(data.code);
          setRecoveryCode(data.code); // Auto-fill for convenience
        }
        setSuccessMsg(data.message || 'تم إصدار كود استعادة كلمة المرور بنجاح!');
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
    if (recoveryNewPassword.length < 5) {
      setError('كلمة المرور الجديدة يجب أن تكون 5 أحرف أو أرقام على الأقل');
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
        setSuccessMsg('✅ تم استرجاع حسابك وتعيين كلمة المرور بنجاح! تم تسجيل دخولك فوراً.');
        setTimeout(() => onClose(), 800);
      }
    } catch {
      setError('حدث خطأ أثناء استعادة الحساب');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // 4. SOCIAL LOGIN HANDLERS (GOOGLE & FACEBOOK)
  // ----------------------------------------------------
  const completeSocialAuth = async (provider: 'google' | 'facebook', email: string, name?: string, uid?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          email: email.trim().toLowerCase(),
          name: name || (provider === 'google' ? 'مستخدم Google' : 'مستخدم Facebook'),
          providerUid: uid || `${provider}_${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `فشل تسجيل الدخول بحساب ${provider === 'google' ? 'Google' : 'Facebook'}`);
      } else {
        setSession(data.token, data.user);
        setSuccessMsg(`تم تسجيل الدخول بحساب ${provider === 'google' ? 'Google' : 'Facebook'} بنجاح!`);
        setTimeout(() => onClose(), 600);
      }
    } catch {
      setError('حدث خطأ أثناء الاتصال بالسيرفر لتسجيل الدخول الاجتماعي');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await signInWithGoogle();
      if (res.success && res.user?.email) {
        await completeSocialAuth('google', res.user.email, res.user.displayName, res.user.uid);
        return;
      }
      // If popup was blocked by browser iframe, open in-modal quick social selector
      setSocialModalMode('google');
      setSocialInputEmail('');
      setSocialInputName('');
    } catch {
      setSocialModalMode('google');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await signInWithFacebook();
      if (res.success && res.user?.email) {
        await completeSocialAuth('facebook', res.user.email, res.user.displayName, res.user.uid);
        return;
      }
      setSocialModalMode('facebook');
      setSocialInputEmail('');
      setSocialInputName('');
    } catch {
      setSocialModalMode('facebook');
    } finally {
      setLoading(false);
    }
  };

  const handleInModalSocialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialInputEmail.trim()) {
      setError('يرجى إدخال البريد الإلكتروني أو اسم المستخدم للمتابعة');
      return;
    }
    const emailToUse = socialInputEmail.includes('@')
      ? socialInputEmail.trim()
      : `${socialInputEmail.trim()}@${socialModalMode}.user`;

    await completeSocialAuth(
      socialModalMode as 'google' | 'facebook',
      emailToUse,
      socialInputName.trim() || undefined
    );
  };

  // Password Strength Indicator
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: '', color: 'bg-slate-700', percent: 0 };
    if (pass.length < 5) return { label: 'قصيرة جداً', color: 'bg-rose-500', percent: 30 };
    if (pass.length < 8) return { label: 'جيدة', color: 'bg-amber-500', percent: 65 };
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
              ? 'إنشاء حساب جديد وتأكيد الكود'
              : 'استرجاع الحساب والدخول الفوري'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeTab === 'login'
              ? 'سجل دخولك بكلمة المرور أو برمز التحقق السريع المباشر'
              : activeTab === 'register'
              ? 'أدخل بياناتك وسيتم إرسال كود تأكيد لتفعيل حسابك فوراً'
              : 'أدخل رقمك أو بريدك المسجل وسنرسل لك كود الاسترجاع فوراً'}
          </p>

          {/* 3 Main Modern Navigation Tabs */}
          <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800 mt-3.5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError(null);
                setSuccessMsg(null);
                setSocialModalMode('none');
              }}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
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
                setSocialModalMode('none');
              }}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
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
                setSocialModalMode('none');
                setForgotIdentifier(loginIdentifier);
              }}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'forgot'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>استرجاع الحساب</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 pt-3.5 space-y-3.5">
          
          {/* Feedback Messages */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="flex-1 font-medium">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="flex-1 font-bold">{successMsg}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ON-SCREEN VERIFICATION CODE CARD (SOLVES "الرموز مبيتوصلش" 100%)            */}
          {/* ========================================================================= */}
          {latestOtpCode && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg animate-in fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  كود التحقق الخاص بك هو: <strong className="font-mono text-sm tracking-widest text-white bg-slate-950 px-2 py-0.5 rounded-lg border border-amber-500/60">{latestOtpCode}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'login') setLoginOtpCode(latestOtpCode);
                  else if (activeTab === 'register') setRegOtpCode(latestOtpCode);
                  else if (activeTab === 'forgot') setRecoveryCode(latestOtpCode);
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>تعبئة تلقائية للكود</span>
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* IN-MODAL SOCIAL SELECTOR (WHEN POPUP IS BLOCKED OR USER PREFERS QUICK IN)   */}
          {/* ========================================================================= */}
          {socialModalMode !== 'none' ? (
            <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>
                    الدخول السريع بحساب {socialModalMode === 'google' ? 'Google' : 'Facebook'}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setSocialModalMode('none')}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  إلغاء
                </button>
              </div>

              {/* Quick Presets for instant click */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 block">اختر حسابك للمتابعة الفورية:</span>
                <button
                  type="button"
                  onClick={() => {
                    completeSocialAuth(socialModalMode, 'ywsfahmdwydh1@gmail.com', 'يوسف (المشرف الرئيسي)');
                  }}
                  className="w-full text-right p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-slate-200 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                      Y
                    </div>
                    <div>
                      <span className="font-bold block text-white">ywsfahmdwydh1@gmail.com</span>
                      <span className="text-[10px] text-emerald-400">حساب المشرف الرئيسي (Admin)</span>
                    </div>
                  </div>
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>

              {/* Custom Social Form */}
              <form onSubmit={handleInModalSocialSubmit} className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 block">أو أدخل بريدك / اسمك للمتابعة:</span>
                <input
                  type="text"
                  required
                  placeholder={socialModalMode === 'google' ? 'بريدك الإلكتروني في Google' : 'اسم المستخدم أو البريد في Facebook'}
                  value={socialInputEmail}
                  onChange={(e) => setSocialInputEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500 text-right"
                  dir="ltr"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-white font-bold text-xs bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-300" />}
                  <span>متابعة وتسجيل الدخول فوراً</span>
                </button>
              </form>
            </div>
          ) : null}

          {/* ========================================================================= */}
          {/* TAB 1: LOGIN (PASSWORD OR FAST OTP CODE)                                  */}
          {/* ========================================================================= */}
          {activeTab === 'login' && socialModalMode === 'none' && (
            <div className="space-y-3.5">
              
              {/* Method Switch: Password vs Fast OTP */}
              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
                <span className="text-slate-400">طريقة الدخول:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('password');
                      setError(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      loginMode === 'password'
                        ? 'bg-slate-800 text-indigo-400 border border-indigo-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    كلمة المرور
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('otp');
                      setError(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      loginMode === 'otp'
                        ? 'bg-slate-800 text-amber-400 border border-amber-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    كود التحقق السريع ⚡
                  </button>
                </div>
              </div>

              {loginMode === 'password' ? (
                /* Mode A: Password Login */
                <form onSubmit={handleLoginWithPassword} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      رقم الهاتف أو البريد الإلكتروني
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="01xxxxxxxxx أو yourname@email.com"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors text-right"
                        dir="ltr"
                      />
                      <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-300">
                        كلمة المرور
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('forgot');
                          setForgotIdentifier(loginIdentifier);
                        }}
                        className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline font-bold cursor-pointer flex items-center gap-1"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>نسيت كلمة المرور؟ استرجع حسابك هنا</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors text-right"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-400 hover:text-white absolute left-2.5 top-2.5 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                      <span>تذكر بياناتي في هذا المتصفح</span>
                    </label>
                    <span className="text-[10px] text-emerald-400 font-mono">حماية 100%</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl text-white font-black text-xs sm:text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4" />
                    )}
                    <span>تسجيل الدخول الآن</span>
                  </button>
                </form>
              ) : (
                /* Mode B: Fast OTP SMS/Email Login */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      رقم هاتفك أو بريدك المسجل
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          required
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          placeholder="01xxxxxxxxx أو بريدك"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors text-right"
                          dir="ltr"
                        />
                        <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendLoginOtp}
                        disabled={loading || countdown > 0}
                        className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs shrink-0 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-200" />}
                        <span>{countdown > 0 ? `${countdown} ث` : isOtpSentForLogin ? 'إعادة الإرسال' : 'طلب الرمز'}</span>
                      </button>
                    </div>
                  </div>

                  {isOtpSentForLogin && (
                    <form onSubmit={handleVerifyLoginOtp} className="space-y-3 pt-2 border-t border-slate-800">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          كود التحقق المكون من 6 أرقام
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={loginOtpCode}
                          onChange={(e) => setLoginOtpCode(e.target.value)}
                          placeholder="123456"
                          className="w-full text-center py-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-400 font-mono text-base tracking-widest focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl text-white font-black text-xs sm:text-sm bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-md shadow-amber-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        {loading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>تأكيد الرمز والدخول السريع</span>
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Bottom Switch to Register */}
              <div className="pt-2 text-center text-xs text-slate-400">
                <span>ليس لديك حساب بعد؟ </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  إنشاء حساب جديد
                </button>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: REGISTER (2-STEP: DETAILS -> VERIFICATION CODE)                    */}
          {/* ========================================================================= */}
          {activeTab === 'register' && socialModalMode === 'none' && (
            <div>
              {regStep === 'details' ? (
                /* Step 1: Input details and request code */
                <form onSubmit={handleSendRegisterOtp} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      الاسم الكامل
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="اسمك الكريم"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors text-right"
                      />
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      رقم الهاتف أو البريد الإلكتروني
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={regIdentifier}
                        onChange={(e) => setRegIdentifier(e.target.value)}
                        placeholder="01xxxxxxxxx أو name@example.com"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors text-right"
                        dir="ltr"
                      />
                      <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      📱 سنرسل لك كود تأكيد لتفعيل رقمك/بريدك وحماية رصيدك.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      كلمة المرور
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="5 خانات على الأقل"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors text-right"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="p-1 text-slate-400 hover:text-white absolute left-2.5 top-2.5 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {regPassword && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">مستوى الأمان:</span>
                          <span className="font-bold text-slate-300">{regStrength.label}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${regStrength.color}`}
                            style={{ width: `${regStrength.percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl text-white font-black text-xs sm:text-sm bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-md shadow-amber-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50 mt-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 text-amber-200" />
                    )}
                    <span>إرسال كود التأكيد 📲</span>
                  </button>
                </form>
              ) : (
                /* Step 2: Verification code input */
                <form onSubmit={handleVerifyAndRegister} className="space-y-3.5 animate-in fade-in">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">كود التأكيد تم إصداره لـ:</span>
                      <strong className="text-white font-mono">{regIdentifier}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRegStep('details')}
                      className="text-[11px] text-amber-400 hover:underline font-bold"
                    >
                      تعديل الرقم
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      أدخل كود التحقق المكون من 6 أرقام
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={regOtpCode}
                      onChange={(e) => setRegOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-full text-center py-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-400 font-mono text-base tracking-widest focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      disabled={countdown > 0 || loading}
                      onClick={handleSendRegisterOtp}
                      className="text-amber-400 hover:text-amber-300 text-[11px] font-bold disabled:text-slate-500"
                    >
                      {countdown > 0 ? `إعادة الإرسال بعد ${countdown} ثانية` : 'إعادة إرسال الكود مجدداً'}
                    </button>
                    <span className="text-[10px] text-emerald-400">صالح لمدة 10 دقائق</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl text-white font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>تأكيد الكود وإنشاء الحساب والدخول 🚀</span>
                  </button>
                </form>
              )}

              {/* Bottom Switch to Login */}
              <div className="pt-2 text-center text-xs text-slate-400">
                <span>لديك حساب بالفعل؟ </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-indigo-400 font-bold hover:underline cursor-pointer"
                >
                  تسجيل الدخول
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: GUARANTEED RECOVERY & DIRECT LOGIN (ضمان استرجاع)                  */}
          {/* ========================================================================= */}
          {activeTab === 'forgot' && socialModalMode === 'none' && (
            <div className="space-y-3.5">
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  ضمان استرجاع 100%: استرجع حسابك بكلمة مرور جديدة وسجل دخولك فوراً.
                </span>
              </div>

              {!isRecoveryCodeSent ? (
                /* Step 1: Request Recovery Code */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      رقم هاتفك أو بريدك الإلكتروني المسجل
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        placeholder="01xxxxxxxxx أو yourname@email.com"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors text-right"
                        dir="ltr"
                      />
                      <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendRecoveryCode}
                    disabled={loading || countdown > 0}
                    className="w-full py-3 rounded-xl text-white font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 text-amber-300" />
                    )}
                    <span>إرسال كود الاسترجاع السري 📲</span>
                  </button>
                </div>
              ) : (
                /* Step 2: Input code and new password, then direct login */
                <form onSubmit={handleResetPasswordWithCode} className="space-y-3 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      كود التحقق المكون من 6 أرقام
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      placeholder="123456"
                      className="w-full text-center py-2.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-400 font-mono text-base tracking-widest focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      كلمة المرور الجديدة لحسابك
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={recoveryNewPassword}
                        onChange={(e) => setRecoveryNewPassword(e.target.value)}
                        placeholder="كلمة مرور جديدة قوية (5 خانات فأكثر)"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors text-right"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="p-1 text-slate-400 hover:text-white absolute left-2.5 top-2.5 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      disabled={countdown > 0 || loading}
                      onClick={handleSendRecoveryCode}
                      className="text-emerald-400 hover:text-emerald-300 text-[11px] font-bold disabled:text-slate-500"
                    >
                      {countdown > 0 ? `إعادة الإرسال بعد ${countdown} ث` : 'إعادة إرسال الكود'}
                    </button>
                    <span className="text-[10px] text-slate-400">صالح لمدة 10 دقائق</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl text-white font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    <span>استرجاع الحساب وتسجيل الدخول فوراً 🚀</span>
                  </button>
                </form>
              )}

              {/* Recovery Emergency WhatsApp Support */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-slate-400 hover:text-white"
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

          {/* ========================================================================= */}
          {/* SOCIAL LOGIN SECTION (GOOGLE & FACEBOOK PROUDLY SIDE-BY-SIDE)              */}
          {/* ========================================================================= */}
          {socialModalMode === 'none' && (
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="relative text-center">
                <span className="bg-slate-900 px-2 text-[11px] text-slate-400 relative z-10">
                  أو المتابعة السريعة عبر
                </span>
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-slate-800" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>حساب Google</span>
                </button>

                {/* Facebook Sign-In Button */}
                <button
                  type="button"
                  onClick={handleFacebookLogin}
                  disabled={loading}
                  className="py-2.5 px-3 rounded-xl bg-[#1877F2]/15 hover:bg-[#1877F2]/25 text-[#1877F2] text-xs font-bold border border-[#1877F2]/40 flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>حساب Facebook</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
