import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Gamepad2,
  Wallet,
  ShoppingBag,
  HelpCircle,
  PhoneCall,
  CheckCircle2,
} from 'lucide-react';
import { generateSupportResponse, ChatResponse } from '../lib/supportChatLogic.ts';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  quickActions?: ChatResponse['quickActions'];
}

interface CustomerSupportChatProps {
  onNavigateTab?: (tab: string) => void;
}

export function CustomerSupportChat({ onNavigateTab }: CustomerSupportChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome_1',
      sender: 'bot',
      text: 'مرحباً بك في خدمة عملاء ومساعد **KOUMND** الفوري! 👋\nأنا هنا لمساعدتك في كل تفاصيل استخدام المنصة: خطوات الطلب، شحن الألعاب بالـ ID، إيداع الرصيد بالمحفظة، أسعار وعروض الخدمات، وحسابات تيك توك الموثقة.',
      time: 'الآن',
      quickActions: [
        { label: '📖 كيف أستخدم الموقع؟ (دليل شامل)', action: 'ask_how_to_use' },
        { label: '🎮 شحن الألعاب بالـ ID وأسعارها', action: 'ask_games' },
        { label: '💳 كيفية إيداع وشحن الرصيد', action: 'ask_wallet' },
        { label: '📱 حسابات تيك توك الجاهزة (6K و 14.5K)', action: 'ask_accounts' },
        { label: '💰 قائمة الأسعار والعروض المخفضة', action: 'ask_pricing' },
        { label: '💬 محادثة واتساب الإدارة', action: 'open_whatsapp' },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');

    // Simulate instant intelligent response
    setTimeout(() => {
      const botResponse = generateSupportResponse(text);
      const botMsg: Message = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: botResponse.reply,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        quickActions: botResponse.quickActions,
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 250);
  };

  const handleActionClick = (action: string, label: string) => {
    if (action === 'open_whatsapp') {
      window.open(
        'https://wa.me/201556266856?text=' + encodeURIComponent('مرحباً إدارة KOUMND، لدي استفسار بخصوص الخدمات أو الرصيد'),
        '_blank'
      );
      return;
    }

    if (action === 'navigate_services') {
      onNavigateTab?.('services');
      setIsOpen(false);
      return;
    }

    if (action === 'navigate_services_tiktok') {
      onNavigateTab?.('services');
      setIsOpen(false);
      return;
    }

    if (action === 'navigate_gaming') {
      onNavigateTab?.('services');
      setIsOpen(false);
      return;
    }

    if (action === 'navigate_wallet') {
      onNavigateTab?.('wallet');
      setIsOpen(false);
      return;
    }

    if (action === 'navigate_orders') {
      onNavigateTab?.('orders');
      setIsOpen(false);
      return;
    }

    if (action === 'navigate_tickets') {
      onNavigateTab?.('tickets');
      setIsOpen(false);
      return;
    }

    // Default: send label as question
    handleSendMessage(label);
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-24 md:bottom-6 left-4 z-40 flex items-center gap-2">
          <button
            onClick={() => setIsOpen(true)}
            aria-label="فتح محادثة الدعم والمساعد الذكي"
            className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-full shadow-xl shadow-emerald-950/60 border border-emerald-400/30 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
            </span>
            <MessageSquare className="w-5 h-5 text-emerald-100 group-hover:rotate-6 transition-transform" />
            <span className="text-xs font-black tracking-wide hidden sm:inline">
              مساعد الدعم الفوري | KOUMND
            </span>
            <span className="text-xs font-black tracking-wide sm:hidden">
              الدعم المباشر
            </span>
          </button>
        </div>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="محادثة الدعم الفني والمساعد الذكي"
          className="fixed bottom-20 md:bottom-6 left-2 sm:left-6 z-50 w-[94vw] sm:w-[410px] h-[560px] max-h-[82vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-950 shrink-0">
                <img src="/images/logo.png" alt="KOUMND" className="w-full h-full object-cover" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border border-slate-900 rounded-full"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black text-slate-100">مساعد KOUMND الفوري</h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                    آلي معتمد
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span>إجابات فورية لجميع الخدمات 24/7</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  window.open(
                    'https://wa.me/201556266856?text=' +
                      encodeURIComponent('مرحباً إدارة KOUMND، أحتاج مساعدة مباشرة'),
                    '_blank'
                  )
                }
                title="تواصل واتساب مع الإدارة مباشرة"
                className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50 rounded-lg transition-colors cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="إغلاق نافذة المحادثة"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Security Banner (Strict Security Compliance) */}
          <div className="bg-amber-950/40 border-b border-amber-900/50 px-3 py-1.5 flex items-center gap-2 text-[10px] text-amber-300 shrink-0">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <strong>أمان تام:</strong> لا يطلب الموقع كلمة سر حسابك أو لعبتك أبداً. الشحن بالـ ID فقط.
            </span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line text-[11px] sm:text-xs">
                    {msg.text.split('**').map((part, i) =>
                      i % 2 === 1 ? <strong key={i} className="text-amber-300">{part}</strong> : part
                    )}
                  </p>
                </div>

                <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.time}</span>

                {/* Quick actions if present */}
                {msg.quickActions && msg.quickActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                    {msg.quickActions.map((qa, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleActionClick(qa.action, qa.label)}
                        className="text-[10px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 border border-slate-700 hover:border-emerald-500/50 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        {qa.action === 'open_whatsapp' && <ExternalLink className="w-2.5 h-2.5" />}
                        {qa.action.startsWith('navigate') && <ChevronRight className="w-2.5 h-2.5" />}
                        <span>{qa.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick FAQ Suggestion Bar */}
          <div className="px-3 py-1.5 bg-slate-950/60 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <button
              onClick={() => handleSendMessage('كيف أشحن المحفظة وفودافون كاش؟')}
              className="text-[10px] whitespace-nowrap px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shrink-0 cursor-pointer"
            >
              💳 شحن المحفظة
            </button>
            <button
              onClick={() => handleSendMessage('اسعار لايكات ومتابعين تيك توك')}
              className="text-[10px] whitespace-nowrap px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shrink-0 cursor-pointer"
            >
              🌟 أسعار تيك توك
            </button>
            <button
              onClick={() => handleSendMessage('طريقة شحن ببجي وفري فاير بالـ ID')}
              className="text-[10px] whitespace-nowrap px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shrink-0 cursor-pointer"
            >
              🎮 شحن بالـ ID
            </button>
            <button
              onClick={() => handleSendMessage('حسابات تيك توك جاهزة 14K و 64K')}
              className="text-[10px] whitespace-nowrap px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shrink-0 cursor-pointer"
            >
              📱 حسابات جاهزة
            </button>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="اكتب استفسارك هنا (مثال: شحن بالـ ID، ليكات التيك توك...)"
              className="flex-1 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              aria-label="إرسال السؤال"
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
