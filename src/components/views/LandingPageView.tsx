import React from 'react';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Gamepad2,
  Share2,
  TrendingUp,
  Headphones,
  CheckCircle2,
  ChevronRight,
  Flame,
  Wallet,
  PhoneCall,
  Video,
  Award,
  ArrowRight,
  Clock,
  Coins,
} from 'lucide-react';

interface LandingPageViewProps {
  onGetStarted: () => void;
  onExploreServices: () => void;
  onContactAdmin: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onGetStarted,
  onExploreServices,
  onContactAdmin,
}) => {
  return (
    <div className="w-full text-right space-y-12 sm:space-y-16 animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                          */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/80 p-8 sm:p-12 shadow-2xl">
        {/* Ambient subtle glow background */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Main Hero Copy */}
          <div className="lg:col-span-8 space-y-6">
            
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-300 tracking-wide">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>منصة KOUMND الرسمية المعتمدة لشحن الألعاب والخدمات الرقمية</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
              أسرع منصة لشحن
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">
                الألعاب والمنصات الرقمية
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              شحن فوري لشدات ببجي، جواهر فري فاير، كوينز فيفا، ولودو بالـ Player ID فقط دون الحاجة لأي كلمات سر. خدمات تيك توك وسوشيال ميديا موثوقة بدون أي نقص، مع إيداع رصيد فوري عبر محفظة كاش <span className="text-amber-400 font-mono font-bold">01556266856</span>.
            </p>

            {/* Trust Markers Bar */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>تنفيذ فوري بالـ ID فقط</span>
              </div>
              <span className="text-slate-600 hidden sm:inline">·</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>محفظة كاش 01556266856</span>
              </div>
              <span className="text-slate-600 hidden sm:inline">·</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>حفظ دائم للطلبات وسرية 100%</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <button
                type="button"
                onClick={onExploreServices}
                className="px-7 py-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
              >
                <Gamepad2 className="w-5 h-5 text-slate-950" />
                <span>تصفح متجر الخدمات والأسعار</span>
              </button>

              <button
                type="button"
                onClick={onGetStarted}
                className="px-7 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>تسجيل الدخول / إنشاء حساب جديد</span>
              </button>

              <a
                href="https://wa.me/201556266856"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>واتساب الإدارة المباشر</span>
              </a>
            </div>

          </div>

          {/* Hero Brand Identity Card */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="w-56 sm:w-64 p-4 rounded-3xl bg-slate-950/90 border border-slate-800 shadow-2xl text-center group hover:border-amber-400/50 transition-all">
              <div className="aspect-square w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-inner flex items-center justify-center p-2">
                <img
                  src="/images/logo.png"
                  alt="شعار KOUMND الرسمي"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="mt-3">
                <div className="text-base font-black text-white tracking-wide">
                  KOUMND • كومند
                </div>
                <div className="text-xs text-amber-400 font-semibold mt-0.5">
                  منصة رقمية موثقة
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  أكثر من 15,000 عملية شحن ناجحة
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. THREE CORE PILLARS                                                     */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Gaming */}
        <div
          onClick={onExploreServices}
          className="rounded-3xl bg-slate-900/80 border border-slate-800 p-7 space-y-4 hover:border-amber-500/50 hover:bg-slate-900 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xl border border-amber-500/20 group-hover:scale-105 transition-transform">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">شحن الألعاب بالـ ID</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              شحن شدات ببجي، جواهر فري فاير، نقاط فيفا، ولودو. أدخل رقم المعرف الخاص بك فقط واستلم شحنتك فوراً في حسابك خلال دقائق دون طلب أي كلمة سر.
            </p>
          </div>
          <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 pt-2">
            <span>تصفح باقات الألعاب</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Social Media */}
        <div
          onClick={onExploreServices}
          className="rounded-3xl bg-slate-900/80 border border-slate-800 p-7 space-y-4 hover:border-indigo-500/50 hover:bg-slate-900 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-500/20 group-hover:scale-105 transition-transform">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">خدمات تيك توك وسوشيال ميديا</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              متابعين حقيقيين، لايكات، مشاهدات فائقة السرعة، وحسابات تيك توك جاهزة وموثقة بأفضل أسعار الجملة وثبات تام وضمان تعويض كامل.
            </p>
          </div>
          <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 pt-2">
            <span>تصفح خدمات السوشيال ميديا</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: Cash Wallet */}
        <div
          onClick={onExploreServices}
          className="rounded-3xl bg-slate-900/80 border border-slate-800 p-7 space-y-4 hover:border-emerald-500/50 hover:bg-slate-900 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/20 group-hover:scale-105 transition-transform">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">شحن المحفظة (01556266856)</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              حوّل من فودافون كاش، اتصالات، أورنج، وي، أو إنستاباي إلى رقمنا المعتمد، وارفع رقم الإشعار ليتم شحن رصيدك تلقائياً وفوراً.
            </p>
          </div>
          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 pt-2">
            <span>طرق الإيداع المتاحة</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 3. PLATFORM STATS & TRUST                                                 */}
      {/* ========================================================================= */}
      <section className="rounded-3xl bg-slate-900/60 border border-slate-800 p-8 sm:p-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          
          <div className="space-y-1">
            <div className="text-2xl sm:text-4xl font-black text-amber-400 font-mono">15,000+</div>
            <div className="text-xs text-slate-400">عملية شحن ناجحة</div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-4xl font-black text-emerald-400 font-mono">3 دقائق</div>
            <div className="text-xs text-slate-400">متوسط سرعة التنفيذ</div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-4xl font-black text-indigo-400 font-mono">100%</div>
            <div className="text-xs text-slate-400">أمان وتشفير البيانات</div>
          </div>

          <div className="space-y-1">
            <div className="text-2xl sm:text-4xl font-black text-cyan-400 font-mono">24/7</div>
            <div className="text-xs text-slate-400">دعم فني ومتابعة مستمرة</div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. READY ACCOUNTS & VIDEO MONTAGE (AT THE BOTTOM AS REQUESTED)           */}
      {/* ========================================================================= */}
      <section className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2.5 text-amber-400">
          <Video className="w-5 h-5" />
          <h2 className="text-lg font-black text-white">خدمات المونتاج وتصميم الفيديوهات والحسابات الجاهزة</h2>
        </div>
        
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          نقدم خدمات تصميم ومونتاج احترافية مخصصة لفيديوهات تيك توك، ريلز إنستغرام، وشورتس يوتيوب لمساعدتك على تصدر الإكسبلور وجلب ملايين المشاهدات. كما يتوفر قسم خاص بالحسابات الجاهزة الموثقة ذات التفاعل الحقيقي.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onExploreServices}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>عرض الحسابات الجاهزة والأسعار</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <a
            href="https://wa.me/201556266856"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-bold text-xs transition-all flex items-center gap-2"
          >
            <PhoneCall className="w-4 h-4 text-emerald-400" />
            <span>طلب تصميم ومونتاج فيديو خاص عبر واتساب</span>
          </a>
        </div>
      </section>

    </div>
  );
};
