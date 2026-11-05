import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext.tsx';
import { EmailNotification } from '../types/index.ts';
import { Mail, X, CheckCircle, ExternalLink, Calendar, Send } from 'lucide-react';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose }) => {
  const { emails } = useNotifications();
  const [selectedEmail, setSelectedEmail] = useState<EmailNotification | null>(null);

  React.useEffect(() => {
    if (emails && emails.length > 0) {
      setSelectedEmail((curr) => curr || emails[0]);
    }
  }, [emails, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[650px] flex flex-col shadow-2xl relative text-right overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">صندوق إشعارات البريد الإلكتروني المرسلة</h2>
              <p className="text-[11px] text-slate-400">توثيق لجميع الرسائل الصادرة للبريد الإلكتروني للعميل</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Two-pane layout: List on right (RTL), Email Viewer on left */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Email list */}
          <div className="w-80 border-l border-slate-800 overflow-y-auto p-3 space-y-2 bg-slate-900/60">
            {emails.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">لا توجد رسائل بريد مسجلة</div>
            ) : (
              emails.map((e) => {
                const isSelected = selectedEmail?.id === e.id;
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelectedEmail(e)}
                    className={`w-full text-right p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-950/50 border-indigo-500/80 ring-1 ring-indigo-500/30'
                        : 'bg-slate-850 hover:bg-slate-800 border-slate-750'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                        تم الإرسال
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(e.sentAt).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white line-clamp-1">{e.subject}</div>
                    <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5" dir="ltr">
                      {e.userEmail}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Email Preview Pane */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50 space-y-4">
            {selectedEmail ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">الموضوع:</span>
                    <strong className="text-white text-sm">{selectedEmail.subject}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">المرسل إليه:</span>
                    <span className="font-mono text-cyan-300" dir="ltr">{selectedEmail.userEmail}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">تاريخ الإرسال:</span>
                    <span className="font-mono">{new Date(selectedEmail.sentAt).toLocaleString('ar-EG')}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">حالة التسليم:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Delivered (مُسلّم بنجاح)
                    </span>
                  </div>
                </div>

                {/* HTML Email preview iframe / container */}
                <div className="rounded-xl border border-slate-800 overflow-hidden shadow-inner bg-slate-900">
                  <div className="p-3 bg-slate-850 border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>معاينة الرسالة كما تظهر في صندوق البريد:</span>
                    <span className="font-mono">HTML Template</span>
                  </div>
                  <div
                    className="p-4"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }}
                  />
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs">
                اختر رسالة من القائمة لمعاينة محتواها
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
