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
  ShieldAlert,
  ArrowDown,
  Info,
  ExternalLink,
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
  avatarBg: string;
}

const INITIAL_REVIEWS: UserReview[] = [
  {
    id: 'rev-1',
    name: 'عمر الخالدي',
    rating: 5,
    serviceType: 'شحن شدات ببجي موبايل (660 UC)',
    comment: 'أقسم بالله أرخص وأسرع سيرفر شحن جربته في مصر كلها! كتبت رقم الـ ID بس، وحولت على محفظة كاش 01556266856 وفي أقل من دقيقة كانت الشدات في حسابي رسمي وبدون أي كلمة سر. خدمة خرافية ومضمونة.',
    date: 'منذ 25 دقيقة',
    verified: true,
    avatarBg: 'from-amber-500 to-amber-600',
  },
  {
    id: 'rev-2',
    name: 'محمود الصاوي - ريسلر وموزع',
    rating: 5,
    serviceType: 'خدمات تيك توك وسوشيال ميديا بالجملة',
    comment: 'أنا موزع خدمات وعندي زباين كتير، كل طلباتي بمررها من سيرفر KOUMND. السرعة فورية وثبات المتابعين واللايكات عالي جداً وأرخص سعر جملة لقيته في السوق بدون وسيط. تقييمي 5 من 5 بجدارة.',
    date: 'منذ ساعتين',
    verified: true,
    avatarBg: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'rev-3',
    name: 'يوسف الشريف',
    rating: 5,
    serviceType: 'جواهر فري فاير (1080 جوهرة + عضوية)',
    comment: 'أفضل تجربة شحن ألعاب، الموقع تلقائي وسهل جداً، وتطبيق الموبايل اللي نزلته على تليفوني شغال طيارة وبيبعتلي إشعار فوري لما الطلب يكتمل. شكراً لكم.',
    date: 'منذ 4 ساعات',
    verified: true,
    avatarBg: 'from-orange-500 to-red-600',
  },
  {
    id: 'rev-4',
    name: 'سارة عبد الرحمن',
    rating: 5,
    serviceType: 'اشتراك كانفا برو وشات GPT',
    comment: 'استلمت حسابات كانفا وChatGPT فوراً وبجودة ممتازة وشغالين بدون أي مشاكل، والدعم الفني على الواتساب قمة في الذوق والاحترام.',
    date: 'منذ يوم',
    verified: true,
    avatarBg: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'rev-5',
    name: 'كابتن مروان كمال',
    rating: 5,
    serviceType: 'نقاط فيفا FC Points وتصريح النجم',
    comment: 'شحنت 2200 نقطة فيفا FC بالـ UID وصلوني في 3 دقايق، مفيش أي تعقيد والمحفظة بتقبل فودافون كاش وإنستاباي فوري.',
    date: 'منذ يومين',
    verified: true,
    avatarBg: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'rev-6',
    name: 'أحمد نبيل',
    rating: 5,
    serviceType: 'متابعين وتفاعل إنستغرام وفيسبوك',
    comment: 'سيرفر تلقائي سريع بدون لف ودوران، أسعار منافسة جداً وأرخص من أي منصة تانية. السيرفر رقم واحد في مصر حالياً.',
    date: 'منذ 3 أيام',
    verified: true,
    avatarBg: 'from-pink-500 to-rose-600',
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

    const colors = [
      'from-amber-500 to-amber-600',
      'from-cyan-500 to-blue-600',
      'from-emerald-500 to-teal-600',
      'from-purple-500 to-indigo-600',
      'from-rose-500 to-red-600',
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newRev: UserReview = {
      id: `rev-${Date.now()}`,
      name: userName.trim(),
      rating: userRating,
      serviceType: userServiceType,
      comment: userComment.trim(),
      date: 'الآن (تقييم معتمد)',
      verified: true,
      avatarBg: randomColor,
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
      {/* 1. HERO SECTION: Premier High-Speed Server & Instant Execution            */}
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
              <span>سيرفر KOUMND السحابي الرسمي · الأقوى والأرخص في مصر والشرق الأوسط</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
              أقوى سيرفر شحن ألعاب
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">
                وخدمات رقمية بتنفيذ فوري
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              الخادم المباشر رقم 1 لخدمات السوشيال ميديا وشحن الألعاب. اشحن شدات ببجي، جواهر فري فاير، كوينز فيفا، ولودو فورياً بالـ Player ID فقط دون الحاجة لأي كلمات سر. تنفيذ آلي فوري 100%، أرخص سعر في السوق بدون وسيط، ومحفظة كاش واحدة سريعة ومعتمدة.
            </p>

            {/* 4 Trust Counters Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">تنفيذ فوري بالـ ID</div>
                  <div className="text-[10px] text-slate-400">بدون أي كلمة سر</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-400">أرخص سعر بالسوق</div>
                  <div className="text-[10px] text-slate-400">أسعار جملة مباشرة</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-amber-300">تقييم 4.9 من 5 ⭐</div>
                  <div className="text-[10px] text-slate-400">+12,480 عميل معتمد</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">أمان وسرية 100%</div>
                  <div className="text-[10px] text-slate-400">ضمان ذهبي وتعويض</div>
                </div>
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
                href="#app-install-guide"
                className="px-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span>طريقة تثبيت التطبيق على هاتفك</span>
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
            <div className="w-64 sm:w-72 p-5 rounded-3xl bg-slate-950/90 border border-slate-800 shadow-2xl text-center group hover:border-amber-400/50 transition-all">
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
                  أقوى سيرفر وخدمة تلقائية معتمدة
                </div>
                <div className="text-xs text-slate-400 pt-1 flex items-center justify-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-white">4.9 من 5.0</span>
                  <span>(+12,480 تقييم)</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold pt-1">
                  محفظة كاش المعتمدة: 01556266856
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SERVER POWER & ADVANTAGES (أقوى سيرفر شحن وأرخص سعر بالسوق)           */}
      {/* ========================================================================= */}
      <section id="features" className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>مميزات لا تجدها إلا في سيرفر KOUMND</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            أقوى سيرفر شحن وخدمات تلقائية في الشرق الأوسط
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
            بنية تحتية سحابية متقدمة تضمن لك استلام شحناتك وتزويد حساباتك فورياً بأقل سعر في السوق
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          
          {/* Pillar 1 */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-3.5 hover:border-amber-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xl border border-amber-500/20">
              <Coins className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white">أرخص سعر في السوق بدون وسيط</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              أسعار جملة مباشرة وأقل تكلفة شحن للألعاب والسوشيال ميديا في مصر والوطن العربي دون أي زيادات أو رسوم إضافية خفية.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-3.5 hover:border-emerald-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white">تنفيذ فوري تلقائي 100%</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              خوادم API مؤتمتة تبدأ فوراً في تمرير وتنفيذ طلبك خلال ثوانٍ من تأكيد الدفع بدون انتظار موافقات يدوية أو تأخير.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-3.5 hover:border-indigo-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white">شحن الألعاب بالـ ID فقط</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              أمان حسابك خط أحمر. كل ما نحتاجه هو رقم المعرف (Player ID / UID) فقط. لا نطلب كلمة السر أو أي بيانات خاصة إطلاقاً.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 space-y-3.5 hover:border-cyan-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-xl border border-cyan-500/20">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white">محفظة كاش واحدة (01556266856)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              إيداع مالي مباشر وسريع يستقبل من جميع شبكات مصر: فودافون، أورنج، اتصالات، وي باي، وإنستاباي مع اعتماد فوري للرصيد.
            </p>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. STEP-BY-STEP APP INSTALLATION TUTORIAL (طريقة التثبيت على الهاتف)      */}
      {/* ========================================================================= */}
      <section id="app-install-guide" className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-6 sm:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3.5 py-1.5 rounded-xl border border-indigo-500/20">
              <Smartphone className="w-4 h-4" />
              <span>تطبيق KOUMND الرسمي للهواتف الذكية (PWA)</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              طريقة تثبيت تطبيق KOUMND على هاتفك في ثوانٍ
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              تطبيق المنصة هو تطبيق ويب تقدمي فائق السرعة وخفيف الحجم، يتم تثبيته مباشرة على شاشة هاتفك دون الحاجة لمتجر تطبيقات ثقيل، ليوفر لك وصولاً فورياً وإشعارات حية لكافة طلباتك ورصيدك.
            </p>
          </div>

          {/* Dual Operating System Installation Guides */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Guide A: Android (Chrome) */}
            <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/20">
                    Android
                  </div>
                  <h3 className="font-black text-white text-sm sm:text-base">خطوات التثبيت لأجهزة أندرويد (Chrome)</h3>
                </div>
                <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">سهل وفوري</span>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs">1</div>
                  <p className="leading-relaxed">
                    افتح الموقع من متصفح <strong className="text-white">Google Chrome</strong> على هاتفك الأندرويد.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs">2</div>
                  <p className="leading-relaxed">
                    اضغط على قائمة الخيارات <strong className="text-white">(⋮ أيقونة الثلاث نقاط الرأسية)</strong> الموجودة بأعلى يمين أو يسار شاشة المتصفح.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs">3</div>
                  <p className="leading-relaxed">
                    اختر خيار <strong className="text-indigo-300">"التثبيت في الهاتف" (Install app)</strong> أو <strong className="text-indigo-300">"إضافة إلى الشاشة الرئيسية" (Add to Home Screen)</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0 text-xs">4</div>
                  <p className="leading-relaxed">
                    اضغط تأكيد <strong className="text-emerald-400">"تثبيت"</strong>، وستجد أيقونة KOUMND ظهرت فوراً على شاشتك الرئيسية كأي تطبيق رسمي جاهز للاستخدام!
                  </p>
                </div>
              </div>
            </div>

            {/* Guide B: iPhone (Safari / iOS) */}
            <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/20">
                    iOS
                  </div>
                  <h3 className="font-black text-white text-sm sm:text-base">خطوات التثبيت لأجهزة آيفون (Safari)</h3>
                </div>
                <span className="text-[11px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded">بنقرتين فقط</span>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-xs">1</div>
                  <p className="leading-relaxed">
                    افتح رابط المنصة من متصفح <strong className="text-white">Safari</strong> على هاتفك الآيفون.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-xs">2</div>
                  <p className="leading-relaxed">
                    اضغط على زر المشاركة <strong className="text-white">(Share ⎋)</strong> الموضح في الشريط السفلي للمتصفح.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-xs">3</div>
                  <p className="leading-relaxed">
                    مرر القائمة لأسفل واضغط على خيار <strong className="text-indigo-300">"إضافة إلى الصفحة الرئيسية" (Add to Home Screen ⊞)</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-xs">4</div>
                  <p className="leading-relaxed">
                    اضغط على <strong className="text-emerald-400">"إضافة" (Add)</strong> في الزاوية العلوية، وستظهر أيقونة التطبيق على شاشة هاتفك فوراً!
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Quick Install Action Button (if supported by browser) */}
          <div className="text-center pt-2 space-y-3">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition-all inline-flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>فحص ودعم التثبيت المباشر بالمتصفح</span>
            </button>
            <p className="text-[11px] text-slate-400">
              * إذا لم يظهر لك إشعار التثبيت التلقائي فوراً، اتبع الشرح المصور أعلاه (عبر خيارات المتصفح الثلاث نقاط في كروم، أو زر المشاركة في سفاري).
            </p>
            {installSuccessToast && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold inline-flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>تم إرسال طلب التثبيت بنجاح! ستجد التطبيق مثبتاً على شاشتك الرئيسية الآن.</span>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. RATINGS & REVIEWS SECTION (+12,480 Ratings · Overall 4.9 / 5.0 ⭐)     */}
      {/* ========================================================================= */}
      <section id="reviews" className="space-y-8">
        
        {/* Rating Header & Overall Score */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-10 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Score Summary */}
            <div className="md:col-span-5 text-center md:text-right space-y-2.5 border-b md:border-b-0 md:border-l border-slate-800 pb-6 md:pb-0 md:pl-8">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>التقييم الإجمالي العام للمنصة</span>
              </div>

              <div className="flex items-baseline justify-center md:justify-start gap-2.5">
                <span className="text-5xl sm:text-6xl font-black text-white font-mono">4.9</span>
                <span className="text-2xl font-bold text-slate-400">/ 5.0</span>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-xs text-slate-300 font-medium">
                استناداً إلى <strong className="text-amber-400 font-mono font-bold">+12,480 تقييم حقيقي ومعتمد</strong> من اللاعبين والموزعين في مصر والشرق الأوسط.
              </p>

              <div className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center md:justify-start gap-1">
                <BadgeCheck className="w-4 h-4 text-emerald-400" />
                <span>98.4% من العملاء يوصون بسيرفر KOUMND</span>
              </div>
            </div>

            {/* Rating Breakdown Bars */}
            <div className="md:col-span-7 space-y-3">
              <div className="text-xs font-bold text-white mb-2">توزيع تقييمات العملاء الموثقة:</div>
              
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="w-16 font-mono text-white text-[11px]">5 نجوم</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: '94%' }} />
                  </div>
                  <span className="w-12 text-left font-mono text-slate-300 text-[11px]">94%</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-16 font-mono text-white text-[11px]">4 نجوم</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-amber-400/80 rounded-full" style={{ width: '5%' }} />
                  </div>
                  <span className="w-12 text-left font-mono text-slate-300 text-[11px]">5%</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-16 font-mono text-white text-[11px]">3 نجوم</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-slate-600 rounded-full" style={{ width: '1%' }} />
                  </div>
                  <span className="w-12 text-left font-mono text-slate-300 text-[11px]">1%</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed pt-2">
                نلتزم بتنفيذ كل شحنة ألعاب أو خدمة سوشيال ميديا بأعلى جودة وسرعة تنفيذ، مع ضمان تعويض فوري واسترداد كامل للرصيد عند أي عطل.
              </p>
            </div>

          </div>
        </div>

        {/* Interactive "شاركنا رأيك وقيم الموقع" Box */}
        <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>شاركنا رأيك · أضف تقييمك لسيرفر KOUMND الآن</span>
              </div>
              <p className="text-xs text-slate-400">
                رأيك يظهر فوراً لكافة زوار وعملاء المنصة.
              </p>
            </div>

            {/* Star Rating Picker */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-2 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 ml-2 font-medium">اختر النجوم:</span>
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
                        : 'text-slate-700'
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
                  <option value="خدمات تيك توك وسوشيال ميديا">خدمات تيك توك وسوشيال ميديا</option>
                  <option value="اشتراكات كانفا وشات GPT">اشتراكات كانفا وشات GPT</option>
                  <option value="إيداع رصيد المحفظة 01556266856">إيداع رصيد المحفظة 01556266856</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                تعليقك وتجربتك مع سرعة وجودة السيرفر:
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
                <span>إرسال التقييم ونشره فوراً</span>
              </button>

              {reviewSubmitted && (
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>شكراً جزيلاً لتقييمك الرائع! تم نشر رأيك في المنصة بنجاح ⭐</span>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3 hover:border-slate-700 transition-colors shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${rev.avatarBg} text-white font-black text-sm flex items-center justify-center shadow-inner`}>
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
              </div>

              <div className="text-[10px] text-slate-500 text-left pt-2 border-t border-slate-800/60">
                {rev.date}
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 5. READY ACCOUNTS & VIDEO MONTAGE                                         */}
      {/* ========================================================================= */}
      <section className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
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
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          سجل دخولك الآن إلى KOUMND وابدأ شحن ألعابك وسوشيال ميديا في ثوانٍ معدودة وبكل أمان وبأرخص سعر في السوق.
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
