import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { SupportTicket, TicketMessage } from '../../types/index.ts';
import {
  Headphones,
  PlusCircle,
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  X,
  User,
  ShieldAlert,
} from 'lucide-react';

export const TicketsView: React.FC = () => {
  const { user, token } = useAuth();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // New Ticket Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'order' | 'payment' | 'service' | 'general'>('general');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [initialMessage, setInitialMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reply state
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchTickets = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/tickets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        if (data.tickets && data.tickets.length > 0 && !selectedTicket) {
          handleSelectTicket(data.tickets[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [token]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject,
          category,
          priority,
          message: initialMessage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsModalOpen(false);
        setSubject('');
        setInitialMessage('');
        await fetchTickets();
        if (data.ticket) {
          handleSelectTicket(data.ticket);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim() || !token) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: replyText.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setReplyText('');
        // Update ticket status locally
        setSelectedTicket((prev) => (prev ? { ...prev, status: data.ticket.status } : null));
        fetchTickets();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadge = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">قيد المراجعة</span>;
      case 'answered':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">تم الرد</span>;
      case 'customer_reply':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">رد العميل</span>;
      case 'closed':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">مغلقة</span>;
    }
  };

  return (
    <div className="space-y-6 text-right animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Headphones className="w-6 h-6 text-indigo-400" />
            <span>مركز الدعم الفني والمساعدة</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            فريق KOUMND متاح 24/7 للإجابة على استفساراتكم وحل أي إشكال في الطلبات أو الشحن فوراً.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>فتح تذكرة جديدة</span>
        </button>
      </div>

      {/* Main Tickets Interface: Left List + Right Chat Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Tickets List (Lg: 4) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-300">التذاكر الخاصة بي ({tickets.length})</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">جاري التحميل...</div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs space-y-2">
              <p>لا توجد تذاكر مفتوحة حالياً</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-indigo-400 underline font-bold"
              >
                افتح تذكرة الآن
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {tickets.map((tkt) => {
                const isSelected = selectedTicket?.id === tkt.id;
                return (
                  <button
                    key={tkt.id}
                    onClick={() => handleSelectTicket(tkt)}
                    className={`w-full text-right p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/80 ring-1 ring-indigo-500/50'
                        : 'bg-slate-850 hover:bg-slate-800 border-slate-750'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-cyan-300">{tkt.ticketNumber}</span>
                      {getStatusBadge(tkt.status)}
                    </div>
                    <h3 className="text-xs font-bold text-white line-clamp-1 mb-1">{tkt.subject}</h3>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{tkt.category === 'order' ? 'طلب' : tkt.category === 'payment' ? 'دفع' : 'عام'}</span>
                      <span>
                        {new Date(tkt.createdAt).toLocaleDateString('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat / Message Pane (Lg: 8) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[650px] overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Ticket Top bar */}
              <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-cyan-300 bg-slate-800 px-2 py-0.5 rounded">
                      {selectedTicket.ticketNumber}
                    </span>
                    <h2 className="text-sm font-black text-white">{selectedTicket.subject}</h2>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>
                      الأولوية:{' '}
                      <strong className="text-slate-200">
                        {selectedTicket.priority === 'urgent'
                          ? 'عاجل'
                          : selectedTicket.priority === 'high'
                          ? 'مرتفع'
                          : 'عادي'}
                      </strong>
                    </span>
                    <span>
                      تاريخ الإنشاء:{' '}
                      <strong className="text-slate-200">
                        {new Date(selectedTicket.createdAt).toLocaleDateString('ar-EG')}
                      </strong>
                    </span>
                  </div>
                </div>

                <div>{getStatusBadge(selectedTicket.status)}</div>
              </div>

              {/* Message History */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/40">
                {loadingMessages ? (
                  <div className="p-12 text-center text-slate-400 text-xs">جاري تحميل الرسائل...</div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.senderRole === 'admin';
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 max-w-2xl ${
                          isAdmin ? 'mr-0 ml-auto flex-row-reverse' : 'ml-0 mr-auto'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                            isAdmin
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          }`}
                        >
                          {isAdmin ? <ShieldAlert className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>

                        <div
                          className={`p-3.5 rounded-2xl text-xs space-y-1.5 shadow-md ${
                            isAdmin
                              ? 'bg-rose-950/30 border border-rose-800/40 text-rose-100 rounded-tr-none'
                              : 'bg-slate-800 border border-slate-700/80 text-slate-100 rounded-tl-none'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-1 text-[10px]">
                            <span className="font-bold">{msg.senderName}</span>
                            <span className="text-slate-400 font-mono">
                              {new Date(msg.createdAt).toLocaleTimeString('ar-EG', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-3 bg-slate-850 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="اكتب ردك هنا..."
                  className="flex-1 bg-slate-900 border border-slate-750 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <MessageSquare className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-sm font-semibold">اختر تذكرة من القائمة لعرض المحادثة والرد عليها</p>
            </div>
          )}
        </div>

      </div>

      {/* New Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative text-right p-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-black text-white mb-1">فتح تذكرة دعم فني جديدة</h2>
            <p className="text-xs text-slate-400 mb-5">
              سنقوم بالرد عليك خلال دقائق لمعالجة طلبك بدقة.
            </p>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">عنوان التذكرة</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="مثال: استفسار بخصوص سرعة تنفيذ طلب انستغرام"
                  className="w-full bg-slate-800 border border-slate-750 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">التصنيف</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="general">استفسار عام</option>
                    <option value="order">مشكلة في طلب</option>
                    <option value="payment">مشكلة في الدفع / الشحن</option>
                    <option value="service">اقتراح خدمة جديدة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">الأولوية</label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="normal">عادي</option>
                    <option value="high">مرتفع</option>
                    <option value="urgent">عاجل جداً</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">تفاصيل الاستفسار أو المشكلة</label>
                <textarea
                  required
                  rows={4}
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="اكتب تفاصيل استفسارك بوضوح مع إرفاق رقم الطلب إن وجد..."
                  className="w-full bg-slate-800 border border-slate-750 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الإرسال...' : 'إرسال التذكرة'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
