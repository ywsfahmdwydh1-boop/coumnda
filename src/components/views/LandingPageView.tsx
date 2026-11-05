import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall.ts';
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
  Smartphone,
  Star,
  Users,
  Server,
  Download,
  Send,
  MessageSquare,
  ThumbsUp,
  Check,
  Cpu,
  BadgeCheck,
  Layers,
  Coins,
} from 'lucide-react';

interface LandingPageViewProps {
  onGetStarted: () => void;
  onExploreServices: () => void;
  onContactAdmin: () => void;
}

interface UserReview {
  id: string;
  name: string;
  rating: number; // Out of 5
  serviceType: string;
  comment: string;
  date: string;
  verified: boolean;
}

const INITIAL_REVIEWS: UserReview[] = [
  {
    id: 'rev-1',
    name: 'عمر الخالدي',
    rating: 5,
    serviceType: 'شحن شدات ببجي موبايل',
    comment: 'أقسم بالله أسرع سيرفر شحن جربته، حطيت الأيدي ID وحولت على محفظة 01556266856 وخلال دقيقتين الشدات كانت في الحساب بدون أي كلمة سر! شكراً كومند.',
    date: 'منذ 3 ساعات',
    verified: true,
  },
  {
    id: 'rev-2',
    name: 'يوسف الشريف',
    rating: 5,
    serviceType: 'خدمات تيك توك وسوشيال',
    comment: 'سيرفر جبار، متابعين ولايكات تيك توك سريعة جداً وبدون أي نقصان، والأسعار أرخص من أي موقع تاني، تقييمي 10 من 10 بدون تردد.',
    date: 'منذ يوم',
    verified: true,
  },
  {
    id: 'rev-3',
    name: 'مروان كمال',
    rating: 5,
    serviceType: 'جواهر فري فاير',
    comment: 'شحنت العضوية الأسبوعية و310 جوهرة، التسليم كان أوتوماتيك وسريع جداً، وتطبيق الموقع على الموبايل خفيف وسريع ووصلني إشعار فوري على التليفون.',
    date: 'منذ يومين',
    verified: true,
  },
  {
    id: 'rev-4',
    name: 'أحمد علاء - ريسلر وموزع',
    rating: 5,
    serviceType: 'اشتراكات وشحن ألعاب بالجملة',
    comment: 'أنا بوزع لزبايني وكل طلباتي بمررها من سيرفر KOUMND. الدعم الفني على الواتساب محترم وسريع والأسعار بهامش 30% عادلة وممتازة.',
    date: 'منذ 3 أيام',
    verified: true,
  },
];

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onGetStarted,
  onExploreServices,
  onContactAdmin,
}) => {
  const { isInstallable, isInstalled, install, isIOS, isAndroid } = usePWAInstall();

  // Interactive Review States
  const [reviews, setReviews] = useState<UserReview[]>(INITIAL_REVIEWS);
  const [userName, setUserName] = useState('');
  const [userComment, setUserComment] = useState('');
  const [userRating, setUserRating] = useState(5);
  const [userServiceType, setUserUserServiceType] = useState('شحن ألعاب بالـ ID');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [installSuccessToast, setInstallSuccessToast] = useState(false);

  const handleInstallClick = async () => {
    const res = await install();
    if (res) {
      setInstallSuccessToast(true);
      setTimeout(() => setInstallSuccessToast(false), 4000);
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userComment.trim()) return;

    const newRev: UserReview = {
      id: `rev-${Date.now()}`,
      name: userName.trim(),
      rating: userRating,
      serviceType: userServiceType,
      comment: userComment.trim(),
      date: 'الآن (تقييم جديد)',
      verified: true,
    };

    setReviews([newRev, ...reviews]);
    setUserName('');
    setUserComment('');
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 5000);
  };

  return (
    <div className="w-full text-right space-y-16 sm:space-y-24 animate-in fade-in duration-300 pb-12">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION: Powerful Server Identity & Fast Login CTA                */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 p-6 sm:p-12 shadow-2xl">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Main Hero Copy */}
          <div className="lg:col-span-8 space-y-6">
            
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-300 tracking-wide bg-amber-500/10 px-3.5 py-1.5 rounded-xl border border-amber-500/20">
              <Server className="w-4 h-4 text-amber-400 shrink-0" />
              <span>سيرفر KOUMND السحابي الرسمي · الأقوى والأسرع في الشرق الأوسط</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
              أقوى سيرفر لخدمات
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">
                السوشيال ميديا وشحن الألعاب
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              خادم رقمي متكامل فائق السرعة يعمل بنظام API آلي ومباشر. اشحن ألعابك المفضلة (ببجي، فري فاير، فيفا، ولودو) بالـ Player ID فوراً دون طلب أي كلمة سر، وزود متابعينك وتفاعلك بأعلى جودة وثبات تام وبأسعار الجملة المعتمدة.
            </p>

            {/* Trust Markers Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">تنفيذ فوري بالـ ID</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">محفظة 01556266856</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">تقييم 4.9 من 5 ⭐</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">أمان وتشفير 100%</span>
              </div>
            </div>

            {/* Action Buttons: Sign In / Create Account */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <button
                type="button"
                onClick={onGetStarted}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
              >
                <Cpu className="w-5 h-5 text-slate-950" />
                <span>تسجيل الدخول / إنشاء حسابك</span>
              </button>

              <a
                href="#app-download"
                className="px-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span>تطبيق الموقع للهاتف</span>
              </a>

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
            <div className="w-60 sm:w-72 p-5 rounded-3xl bg-slate-950/90 border border-slate-800 shadow-2xl text-center group hover:border-amber-400/50 transition-all">
              <div className="aspect-square w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-inner flex items-center justify-center p-3">
                <img
                  src="/images/logo.png"
                  alt="شعار KOUMND الرسمي"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="mt-4 space-y-1">
                <div className="text-lg font-black text-white tracking-wide">
                  KOUMND • كومند
                </div>
                <div className="text-xs text-amber-400 font-bold">
                  سيرفر معتمد وموثق 100%
                </div>
                <div className="text-xs text-slate-400 pt-1 flex items-center justify-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-white">4.9 من 5</span>
                  <span>(3,920+ تقييم)</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SERVER POWER & CAPABILITIES (الموقع ده أقوى سيرفر)                     */}
      {/* ========================================================================= */}
      <section id="features" className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>لماذا سيرفر KOUMND هو الخيار الأول؟</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            أقوى سيرفر وخدمات رقمية بأحدث المعايير
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
            منظومة مؤتمتة متطورة تم بناؤها لتوفير أقصى سرعة ممكنة وأعلى استقرار في الشرق الأوسط
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          
          {/* Feature 1 */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-3.5 hover:border-amber-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xl border border-amber-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white">تنفيذ آلي وفوري (API)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              اتصال مباشر بأقوى الخوادم العالمية، تمرير ومعالجة الطلبات تبدأ آلياً خلال ثوانٍ معدودة دون انتظار موافقة يدوية.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-3.5 hover:border-emerald-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white">شحن الألعاب بالـ ID فقط</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              أمان حسابك مضمون 100%. لا نطلب أي كلمة مرور أو بيانات دخول، كل ما تحتاجه هو الـ Player ID الخاص بك في اللعبة.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-3.5 hover:border-indigo-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-500/20">
              <Coins className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white">أسعار جملة بهامش عادل 30%</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              أسعار واضحة وصريحة دون مبالغة، محسوبة بدقة على سعر تكلفة المزود الأصلي مضافاً إليها 30% فقط بدون أي رسوم خفية.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-3.5 hover:border-cyan-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-xl border border-cyan-500/20">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white">محفظة كاش واحدة (01556266856)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              إيداع مالي مباشر وسريع يستقبل من جميع شبكات مصر: فودافون، أورنج، اتصالات، وي باي، وإنستاباي مع اعتماد فوري.
            </p>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. MOBILE APP SECTION (تطبيق الموقع وينزل تحت يلاقيه)                       */}
      {/* ========================================================================= */}
      <section id="app-download" className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-8 space-y-5">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
              <Smartphone className="w-4 h-4" />
              <span>تطبيق KOUMND الرسمي للهواتف الذكية (PWA)</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              حمّل تطبيق المنصة الآن على هاتفك
              <br />
              <span className="text-indigo-400">تابع طلباتك واستقبل إشعارات فورية مباشرة</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              تطبيق ويب تقدمي (PWA) فائق السرعة، خفيف الحجم ولا يستهلك ذاكرة هاتفك. يتيح لك تثبيت المنصة على شاشة هاتفك الرئيسية، ومتابعة شحن الألعاب وخدماتك وتلقي تنبيهات هاتفية فورية عند تنفيذ كل طلب أو تحديث رصيدك.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>إشعارات Push Notification حية</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>تثبيت بلمسة واحدة (أندرويد وآيفون)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>سرعة فائقة وعمل بدون تهنيج</span>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-2.5 cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>تثبيت التطبيق على الهاتف الآن</span>
              </button>

              <button
                type="button"
                onClick={onGetStarted}
                className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>دخول حسابك من المتصفح</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Instruction note for iOS / Android */}
            <div className="text-[11px] text-slate-400 pt-1">
              {isIOS ? (
                <span>* لمستخدمي آيفون (Safari): اضغط زر المشاركة <span className="font-bold text-indigo-300">Share</span> ثم اختر <span className="font-bold text-indigo-300">"إضافة إلى الصفحة الرئيسية"</span>.</span>
              ) : (
                <span>* متوافق مع كافة أجهزة الأندرويد، الآيفون، والأجهزة اللوحية دون الحاجة لمتجر تطبيقات خارجي.</span>
              )}
            </div>

            {installSuccessToast && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>تم إرسال طلب التثبيت بنجاح! ستجد أيقونة KOUMND على شاشة هاتفك الرئيسية الآن.</span>
              </div>
            )}

          </div>

          {/* App Preview Mockup Card */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="w-64 sm:w-72 rounded-3xl bg-slate-950 border-2 border-indigo-500/40 p-4 shadow-2xl space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  <span>تطبيق KOUMND</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">متصل بالسيرفر</span>
              </div>

              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-slate-800 p-4 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-amber-400/50 p-1 bg-slate-950">
                  <img src="/images/logo.png" alt="KOUMND App" className="w-full h-full object-cover" />
                </div>
                <div className="font-black text-sm text-white">KOUMND APP</div>
                <div className="text-[10px] text-slate-400">إشعارات طلبات فورية على شاشة القفل</div>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                  <span>طلب شدات ببجي #8924</span>
                  <span className="text-emerald-400 font-bold">مكتمل فوراً</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                  <span>إيداع محفظة كاش</span>
                  <span className="text-amber-400 font-bold">معتمد 01556266856</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. RATINGS & REVIEWS SECTION (تقدر تقيم وقيم الموقع 4.9 من 10)             */}
      {/* ========================================================================= */}
      <section id="reviews" className="space-y-8">
        
        {/* Rating Header & Overall Score */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            <div className="md:col-span-4 text-center md:text-right space-y-2 border-b md:border-b-0 md:border-l border-slate-800 pb-6 md:pb-0 md:pl-8">
              <div className="text-xs font-bold text-amber-400">تقييم المنصة المعتمد</div>
              <div className="flex items-baseline justify-center md:justify-start gap-2">
                <span className="text-5xl sm:text-6xl font-black text-white font-mono">4.9</span>
                <span className="text-xl font-bold text-slate-400">/ 5</span>
                <span className="text-sm font-semibold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md">
                  (9.8 من 10)
                </span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-400 pt-1">
                استناداً إلى أكثر من 3,920 تقييم موثق من اللاعبين والعملاء
              </p>
            </div>

            <div className="md:col-span-8 space-y-2 text-xs text-slate-300">
              <h3 className="text-base font-black text-white">آراء حقيقية وتجربة مستخدم لا مثيل لها</h3>
              <p className="text-slate-400 leading-relaxed">
                رضا عملائنا هو المعيار الأول لدينا. نحن نضمن وصول كل شحنة ألعاب لحسابك في دقائق بالـ ID فقط، وتنفيذ خدمات السوشيال ميديا بسرعة فائقة مع ضمان تعويض كامل لأي نقص.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <BadgeCheck className="w-4 h-4" />
                  <span>99.8% نسبة الرضا والتنفيذ الناجح</span>
                </div>
                <span className="text-slate-600 hidden sm:inline">·</span>
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <Headphones className="w-4 h-4" />
                  <span>دعم فني مباشر على مدار الساعة</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Interactive "تقدر تقيم بنفسك" Box */}
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>شاركنا رأيك · قيم سيرفر KOUMND بنفسك</span>
              </div>
              <p className="text-xs text-slate-400">
                رأيك يساعدنا دائماً في تقديم أفضل وأسرع خدمة ممكنة.
              </p>
            </div>

            {/* Star Rating Picker */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-2 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 ml-2 font-medium">اختر تقييمك:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setUserRating(star)}
                  className="p-1 hover:scale-110 transition-transform cursor-pointer"
                  title={`${star} نجوم`}
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      star <= userRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-mono font-bold text-amber-400 mr-2">
                {userRating} / 5
              </span>
            </div>
          </div>

          <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  اسمك أو لقبك:
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="مثال: يوسف أحمد أو لاعب ببجي"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  الخدمة التي قمت بتجربتها:
                </label>
                <select
                  value={userServiceType}
                  onChange={(e) => setUserUserServiceType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="شحن شدات ببجي بالـ ID">شحن شدات ببجي بالـ ID</option>
                  <option value="شحن جواهر فري فاير">شحن جواهر فري فاير</option>
                  <option value="شحن فيفا ونقاط FC">شحن فيفا ونقاط FC</option>
                  <option value="شحن يلا لودو وجواكر">شحن يلا لودو وجواكر</option>
                  <option value="خدمات تيك توك وسوشيال">خدمات تيك توك وسوشيال</option>
                  <option value="إيداع رصيد المحفظة 01556266856">إيداع رصيد المحفظة 01556266856</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                تعليقك وتقييمك للسيرفر:
              </label>
              <textarea
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                rows={2}
                placeholder="اكتب تجربتك مع سرعة الشحن وسيرفر KOUMND بكل أمانة..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>إرسال التقييم ونشره</span>
              </button>

              {reviewSubmitted && (
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>شكراً جزيلاً لتقييمك الرائع! تم تسجيل رأيك في المنصة بنجاح ⭐</span>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-black text-sm flex items-center justify-center">
                    {rev.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{rev.name}</span>
                      {rev.verified && (
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          عميل موثق
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">{rev.serviceType}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < rev.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                "{rev.comment}"
              </p>

              <div className="text-[10px] text-slate-500 text-left pt-1">
                {rev.date}
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 5. READY ACCOUNTS & VIDEO MONTAGE                                         */}
      {/* ========================================================================= */}
      <section className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2.5 text-amber-400">
          <Video className="w-5 h-5" />
          <h2 className="text-lg font-black text-white">خدمات المونتاج وتصميم الفيديوهات والحسابات الجاهزة</h2>
        </div>
        
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          نقدم خدمات تصميم ومونتاج احترافية مخصصة لفيديوهات تيك توك، ريلز إنستغرام، وشورتس يوتيوب لمساعدتك على تصدر الإكسبلور وجلب ملايين المشاهدات. كما يتوفر قسم خاص بالحسابات الجاهزة الموثقة (6K, 14K, 14.5K, 64K متابع) ذات التفاعل الحقيقي.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onGetStarted}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>دخول حسابك لاستعراض الحسابات الجاهزة</span>
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

      {/* ========================================================================= */}
      {/* 6. BOTTOM CALL-TO-ACTION                                                  */}
      {/* ========================================================================= */}
      <section className="rounded-3xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-500/10 border border-amber-500/30 p-8 sm:p-12 text-center space-y-6">
        <h2 className="text-2xl sm:text-4xl font-black text-white">
          جاهز لتجربة أسرع خادم خدمات في الشرق الأوسط؟
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          سجل دخولك الآن إلى KOUMND وابدأ شحن الألعاب وخدمات السوشيال ميديا في ثوانٍ معدودة وبكل أمان.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            type="button"
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
          >
            <Cpu className="w-5 h-5 text-slate-950" />
            <span>سجل دخولك الآن وابدأ فوراً</span>
          </button>
          
          <a
            href="https://wa.me/201556266856"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-4 h-4 text-emerald-400" />
            <span>تواصل مباشرة عبر واتساب الإدارة</span>
          </a>
        </div>
      </section>

    </div>
  );
};
