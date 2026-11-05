import React, { useState } from 'react';
import {
  BookOpen,
  HelpCircle,
  Wallet,
  Smartphone,
  Gamepad2,
  Video,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ExternalLink,
  PhoneCall,
  Clock,
  Layers,
  Copy,
  Check,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface UserGuideViewProps {
  onNavigateTab: (tab: string) => void;
}

interface FAQItem {
  id: string;
  category: 'deposit' | 'gaming' | 'social' | 'accounts' | 'custom' | 'general';
  question: string;
  answer: string;
  tags?: string[];
}

const FAQ_LIST: FAQItem[] = [
  {
    id: 'faq_1',
    category: 'deposit',
    question: 'كيف أقوم بشحن رصيد محفظتي في موقع KOUMND؟',
    answer: 'الشحن يتم عبر محفظة كاش الرسمية المعتمدة رقم 01556266856. تقوم بتحويل المبلغ من أي محفظة (فودافون كاش، أورنج كاش، اتصالات كاش، وي باي، أو عبر إنستاباي InstaPay، أو فوري)، ثم تدخل على صفحة «إيداع الرصيد» وتكتب رقم هاتفك والمبلغ وتضغط «تأكيد الدفع». يتم التحقق وإضافة المبلغ لمحفظتك فوراً.',
    tags: ['إيداع', 'كاش', '01556266856', 'فودافون كاش', 'إنستاباي', 'فوري'],
  },
  {
    id: 'faq_2',
    category: 'deposit',
    question: 'هل يقبل رقم الكاش 01556266856 التحويل من جميع شبكات مصر؟',
    answer: 'نعم، الرقم 01556266856 هو محفظة كاش معتمدة وموحدة تستقبل التحويلات من كافة محافظ المحمول في جمهورية مصر العربية (Vodafone Cash, Orange Cash, Etisalat Cash, WE Pay) وكذلك التحويلات اللحظية عبر تطبيق إنستاباي InstaPay ومن منافذ فوري.',
    tags: ['01556266856', 'المحافظ', 'شبكات مصر'],
  },
  {
    id: 'faq_3',
    category: 'deposit',
    question: 'متى يظهر الرصيد في حسابي بعد إرسال الفلوس؟',
    answer: 'تتم مراجعة الدفعات والتحقق منها وتغذية الرصيد خلال دقائق معدودة. ولضمان الأمان المالي الكامل، لا يتم خصم أو إضافة أي رصيد إلا بعد التحقق الفعلي من وصول المبلغ على المحفظة واعتماده، وتصلك رسالة وإشعار فوري على هاتفك.',
    tags: ['سرعة الشحن', 'تأكيد الدفع'],
  },
  {
    id: 'faq_4',
    category: 'gaming',
    question: 'كيف أشحن ألعاب مثل ببجي وفري فاير وفيفا ويلا لودو؟',
    answer: 'شحن الألعاب يعمل بنظام الـ ID المباشر عبر منصة KOUMND المعتمدة. كل ما عليك هو اختيار اللعبة من متجر الخدمات، وتحديد باقة الشدات أو الجواهر، وإدخال معرف اللاعب (Player ID) فقط بدون أي كلمة سر أو بيانات سرية، وسيصلك الشحن داخل اللعبة فوراً.',
    tags: ['ألعاب', 'ببجي', 'فري فاير', 'KOUMND', 'Player ID'],
  },
  {
    id: 'faq_5',
    category: 'gaming',
    question: 'هل يطلب موقع KOUMND كلمة سر حسابي في اللعبة أو الفيسبوك؟',
    answer: 'مستحيل! نحن لا نطلب إطلاقاً ولا نخزن أي كلمة سر لأي لعبة أو منصة. كافة عمليات شحن الألعاب تتم عبر المعرف الرقمي (UID / Player ID) فقط بنسبة أمان 100% ودون أي خطورة على حسابك.',
    tags: ['أمان', 'كلمة سر', 'بدون باند'],
  },
  {
    id: 'faq_6',
    category: 'social',
    question: 'كيف يتم تسعير وتنفيذ خدمات السوشيال ميديا وتيك توك لديكم؟',
    answer: 'توفر منصة KOUMND خدمات متابعين ومشاهدات ولايكات بأعلى سرعة وجودة وثبات وبدون نقص. جميع خدمات متابعين ومشاهدات تيك توك محسوبة بأفضل وأقل سعر في الشرق الأوسط مع ضمان تعويض وحماية كاملة لحسابك.',
    tags: ['سوشيال ميديا', 'KOUMND', 'تيك توك', 'أفضل سعر'],
  },
  {
    id: 'faq_7',
    category: 'accounts',
    question: 'أين أجد قسم الحسابات الجاهزة؟ وما هي تفاصيل الحسابات؟',
    answer: 'الحسابات الجاهزة مدمجة مباشرة داخل قسم «تيك توك (TikTok)» في متجر الخدمات. الحسابات حقيقية 100% بدون أي تزويد ومؤهلة للربح والبث المباشر (مثل حساب 6K بـ 650 ج.م، حساب 14K بـ 800 ج.م، حساب 14.5K بـ 900 ج.م، وحساب 64K بـ 2,900 ج.م) مع تسليم فوري ونقل البريد الأصلي.',
    tags: ['حسابات جاهزة', 'تيك توك', 'أكونتات', 'مؤهل للربح'],
  },
  {
    id: 'faq_8',
    category: 'custom',
    question: 'ما هي تفاصيل خدمة عمل تصميم فيديوهات وإدارة الأموال؟',
    answer: 'نوفر خدمة خاصة وحصرية لعمل وتصميم فيديوهات ومونتاج احترافي للريلز والتيك توك، بالإضافة إلى إدارة الأموال وشراء وبيع أكونتات السوشيال ميديا. للتواصل المباشر مع الإدارة عبر الواتساب أو الاتصال على الرقم: 01556266856.',
    tags: ['مونتاج', 'تصميم فيديوهات', 'إدارة أموال', 'واتساب'],
  },
  {
    id: 'faq_9',
    category: 'general',
    question: 'ماذا أفعل إذا واجهت مشكلة في طلبي أو أردت الاستفسار؟',
    answer: 'فريق دعم KOUMND متاح على مدار الساعة! يمكنك فتح تذكرة دعم فني من تبويب «الدعم الفني»، أو التحدث مع المساعد الآلي التفاعلي المتاح في أسفل الموقع، أو التواصل المباشر عبر واتساب الإدارة على 01556266856.',
    tags: ['دعم فني', 'تذاكر', 'واتساب'],
  },
];

export const UserGuideView: React.FC<UserGuideViewProps> = ({ onNavigateTab }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('faq_1');
  const [copiedNumber, setCopiedNumber] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const filteredFAQs = FAQ_LIST.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      item.question.includes(searchQuery) ||
      item.answer.includes(searchQuery) ||
      item.tags?.some((t) => t.includes(searchQuery));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-8 text-right animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* 1. HERO HEADER                                                            */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 p-6 sm:p-10 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black">
            <BookOpen className="w-3.5 h-3.5" />
            <span>مركز المساعدة الشامل • سيرفر KOUMND</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            دليل استخدام المنصة والأسئلة الشائعة
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            كل ما تحتاج لمعرفته حول شحن الرصيد عبر محفظة كاش <strong className="text-amber-400 font-mono">01556266856</strong>، شحن الألعاب المباشر بالـ ID، طلب خدمات تيك توك والسوشيال ميديا الموثوقة، وشراء الحسابات الجاهزة وخدمات المونتاج والتصميم.
          </p>

          {/* Quick Action Badges */}
          <div className="pt-2 flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigateTab('wallet')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Wallet className="w-4 h-4" />
              <span>إيداع الرصيد الآن</span>
            </button>
            <button
              onClick={() => onNavigateTab('services')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>تصفح متجر الخدمات</span>
            </button>
            <a
              href="https://wa.me/201556266856"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-400/30 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>واتساب الإدارة: 01556266856</span>
            </a>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STEP-BY-STEP VISUAL WORKFLOW (4 PILLARS)                                */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>خطوات استخدام المنصة في 4 خطوات بسيطة</span>
          </h2>
          <span className="text-xs text-slate-400">سريع • آمن • بدون تعقيد</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* STEP 1 */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center">
                1
              </span>
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-sm font-black text-white">إيداع وشحن الرصيد</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              حوّل من محفظتك إلى رقم الكاش المعتمد <strong className="text-amber-400 font-mono">01556266856</strong> (فودافون كاش، أورنج، اتصالات، وي، إنستاباي، فوري)، ثم سجّل طلبك في صفحة «إيداع الرصيد».
            </p>
            <div className="pt-1">
              <button
                onClick={() => handleCopy('01556266856')}
                className="w-full py-1.5 px-2.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-[11px] font-mono text-cyan-300 border border-slate-750 flex items-center justify-between cursor-pointer"
              >
                <span>رقم المحفظة: 01556266856</span>
                {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3 relative overflow-hidden group hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-black text-sm flex items-center justify-center">
                2
              </span>
              <Gamepad2 className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-sm font-black text-white">شحن الألعاب بالـ ID</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              من قسم شحن الألعاب المباشر، اختر باقة الشدات أو الجواهر وضع معرف اللاعب (Player ID) فقط بدون أي كلمة سر. يتم الشحن المباشر خلال لحظات.
            </p>
            <div className="text-[11px] text-amber-400 font-bold bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
              ببجي • فري فاير • فيفا • يلا لودو
            </div>
          </div>

          {/* STEP 3 */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3 relative overflow-hidden group hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 font-black text-sm flex items-center justify-center">
                3
              </span>
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-sm font-black text-white">تيك توك والسوشيال ميديا</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              خدمات تيك توك وسوشيال ميديا فورية وثابتة بدون نقص وبأفضل أسعار الجملة، أو اختر حسابات تيك توك الجاهزة الموثقة داخل قسم تيك توك.
            </p>
            <div className="text-[11px] text-indigo-300 font-bold bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
              متابعين • مشاهدات • حسابات جاهزة
            </div>
          </div>

          {/* STEP 4 */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 font-black text-sm flex items-center justify-center">
                4
              </span>
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-sm font-black text-white">تتبع الطلبات والدعم</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              تابع تقدم طلباتك لحظة بلحظة من تبويب «طلباتي». وإذا احتجت لأي مساعدة افتح تذكرة أو تحدث مع الشات الذكي التفاعلي 24/7.
            </p>
            <div className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
              ضمان تعويض تلقائي • دعم فني 24/7
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE FAQ ACCORDION                                              */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-400" />
              <span>الأسئلة الأكثر شيوعاً وإجاباتها الرسمية (FAQ)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              إجابات واضحة ومباشرة على كل ما يخص الدفع والشحن والخدمات
            </p>
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في الأسئلة (مثال: كاش، ببجي، تيك توك)..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-right"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'deposit', label: 'إيداع الرصيد وكاش 01556266856' },
            { id: 'gaming', label: 'شحن الألعاب بالـ ID' },
            { id: 'social', label: 'خدمات السوشيال وتيك توك' },
            { id: 'accounts', label: 'حسابات تيك توك الجاهزة' },
            { id: 'custom', label: 'المونتاج والتصميم وإدارة الأموال' },
            { id: 'general', label: 'الأمان والدعم الفني' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {filteredFAQs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              لم يتم العثور على أي سؤال يطابق بحثك. جرب كلمة بحث أخرى أو تواصل مع الدعم الفني.
            </div>
          ) : (
            filteredFAQs.map((faq) => {
              const isOpen = expandedId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isOpen
                      ? 'bg-slate-850/80 border-indigo-500/50 shadow-md'
                      : 'bg-slate-850/30 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : faq.id)}
                    className="w-full p-4 sm:p-5 text-right flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      <span className="text-xs sm:text-sm font-black text-white">{faq.question}</span>
                    </div>
                    <div className="text-slate-400 shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/80 animate-in fade-in duration-200">
                      <p>{faq.answer}</p>
                      {faq.tags && faq.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/60">
                          {faq.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. CUSTOM DESIGN & VIDEO BANNER (AT THE VERY BOTTOM)                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/90 rounded-3xl p-6 border-2 border-amber-500/50 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0 shadow">
            <Video className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-white">
                متوفر عمل تصميم فيديوهات وإدارة أموال وشراء وبيع أكونتات السوشيال ميديا
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                خدمة حصرية
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              مونتاج وتصميمات وتوثيق حسابات • للتواصل المباشر مع إدارة KOUMND عبر الواتساب: 01556266856
            </p>
          </div>
        </div>

        <a
          href="https://wa.me/201556266856"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95"
        >
          <span>تواصل واتساب: 01556266856</span>
        </a>
      </div>

    </div>
  );
};
