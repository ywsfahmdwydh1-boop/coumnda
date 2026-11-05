import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import {
  Layers,
  ShoppingBag,
  ListOrdered,
  Wallet,
  Headphones,
  ShieldAlert,
  User as UserIcon,
  LogOut,
  Sparkles,
  ArrowRightLeft,
  Bell,
  Mail,
  Check,
  CheckCheck,
  ExternalLink,
  X,
  FileText,
  BookOpen,
  Smartphone,
  Star,
} from 'lucide-react';
import { EmailModal } from './EmailModal.tsx';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenAuth }) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin' && user?.email === 'ywsfahmdwydh1@gmail.com';
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    latestToast,
    dismissToast,
    pushPermission,
    requestPushPermission,
  } = useNotifications();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const handleNotificationClick = (notifId: string, link?: string) => {
    markAsRead(notifId);
    setIsNotifOpen(false);
    if (link) {
      if (link.includes('order')) setCurrentTab('orders');
      else if (link.includes('wallet')) setCurrentTab('wallet');
      else if (link.includes('service')) setCurrentTab('services');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Brand */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => setCurrentTab(user ? 'services' : 'landing')}
                className="flex items-center gap-3 group text-right"
                aria-label="الرئيسية منصة KOUMND"
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-400/50 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform bg-slate-900 shrink-0">
                  <img
                    src="/images/logo.png"
                    alt="شعار KOUMND الرسمي"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xl tracking-wider text-white">KOUMND</span>
                    <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                      منصة معتمدة
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">شحن الألعاب والسوشيال ميديا</p>
                </div>
              </button>

              {/* Navigation Tabs */}
              <nav className="hidden md:flex items-center gap-1">
                {!user ? (
                  <>
                    <button
                      onClick={() => setCurrentTab('landing')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        currentTab === 'landing'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      الرئيسية
                    </button>

                    <a
                      href="#features"
                      className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                    >
                      مميزات السيرفر
                    </a>

                    <a
                      href="#app-download"
                      className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-1.5"
                    >
                      <Smartphone className="w-4 h-4 text-indigo-400" />
                      <span>تطبيق الهاتف</span>
                    </a>

                    <a
                      href="#reviews"
                      className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors flex items-center gap-1"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>التقييمات (4.9 ⭐)</span>
                    </a>

                    <button
                      onClick={() => setCurrentTab('guide')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        currentTab === 'guide'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      دليل الاستخدام
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setCurrentTab('services')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        currentTab === 'services'
                          ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      متجر الخدمات
                    </button>

                    <button
                      onClick={() => setCurrentTab('orders')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        currentTab === 'orders'
                          ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <ListOrdered className="w-4 h-4" />
                      طلباتي
                    </button>

                    <button
                      onClick={() => setCurrentTab('wallet')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        currentTab === 'wallet'
                          ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                      إيداع الرصيد
                    </button>

                    <button
                      onClick={() => setCurrentTab('tickets')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        currentTab === 'tickets'
                          ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Headphones className="w-4 h-4" />
                      الدعم الفني
                    </button>

                    <button
                      onClick={() => setCurrentTab('guide')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        currentTab === 'guide'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      دليل الاستخدام
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => setCurrentTab('admin')}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${
                          currentTab === 'admin'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 ring-1 ring-rose-500/30'
                            : 'bg-rose-950/40 text-rose-400 hover:bg-rose-900/40 border border-rose-800/40'
                        }`}
                      >
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        لوحة الإدارة
                      </button>
                    )}
                  </>
                )}
              </nav>
            </div>

            {/* Right actions: Balance, Notifications Bell, Emails, Profile */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {user ? (
                <>
                  {/* Balance Chip */}
                  <button
                    onClick={() => setCurrentTab('wallet')}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 transition-colors text-right group shadow-inner"
                    title="انقر لفتح المحفظة وشحن الرصيد"
                  >
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Wallet className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-400 leading-tight">الرصيد</div>
                      <div className="text-xs font-bold text-emerald-400 tracking-tight font-mono">
                        {user.balance.toFixed(2)} ج.م
                      </div>
                    </div>
                  </button>

                  {/* Real-time Notifications Bell */}
                  <div className="relative">
                    <button
                      onClick={() => setIsNotifOpen(!isNotifOpen)}
                      className="relative p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="الإشعارات الفورية"
                      aria-label="الإشعارات الفورية"
                    >
                      <Bell className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-black text-[9px] rounded-full flex items-center justify-center animate-pulse border border-slate-900 font-mono">
                          {unreadCount > 9 ? '+9' : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notifications Dropdown (Contained to mobile viewport) */}
                    {isNotifOpen && (
                      <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden text-right animate-in fade-in zoom-in-95">
                        <div className="p-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Bell className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-black text-white">
                              الإشعارات ({unreadCount} غير مقروء)
                            </span>
                          </div>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>تحديد الكل كمقروء</span>
                            </button>
                          )}
                        </div>

                        {/* Quick Push Notification Enable Bar */}
                        <div className="p-2.5 bg-indigo-950/40 border-b border-indigo-900/30 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>إشعارات الهاتف الفورية:</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => requestPushPermission()}
                            className="text-[10px] px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                          >
                            <Bell className="w-3 h-3" />
                            <span>{pushPermission === 'granted' ? 'مفعلة على الهاتف ✅' : 'تفعيل الإشعارات 🔔'}</span>
                          </button>
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 p-1">
                          {notifications.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-500">
                              لا توجد إشعارات حتى الآن
                            </div>
                          ) : (
                            notifications.map((notif) => (
                              <button
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif.id, notif.link)}
                                className={`w-full text-right p-3 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer ${
                                  !notif.read ? 'bg-indigo-950/30 text-white' : 'hover:bg-slate-850 text-slate-300'
                                }`}
                              >
                                <div
                                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                    !notif.read ? 'bg-indigo-500 animate-ping' : 'bg-transparent'
                                  }`}
                                />
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-white">{notif.title}</h4>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      {new Date(notif.createdAt).toLocaleTimeString('ar-EG', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 leading-relaxed">
                                    {notif.message}
                                  </p>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Email Notifications Log Button (Desktop only) */}
                  <button
                    onClick={() => setIsEmailModalOpen(true)}
                    className="hidden sm:flex p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="سجل إشعارات البريد الإلكتروني"
                    aria-label="سجل إشعارات البريد الإلكتروني"
                  >
                    <Mail className="w-4 h-4" />
                  </button>

                  {/* User Profile / Username display */}
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/80 border border-slate-700/80 text-slate-200">
                    <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{user.username}</span>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={logout}
                    aria-label="تسجيل الخروج"
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="تسجيل الخروج"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-102 cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-slate-950" />
                  <span>تسجيل الدخول / حساب جديد</span>
                </button>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* Android Native Fixed Bottom Navigation Bar for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 px-1 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
        {!user ? (
          <>
            <button
              onClick={() => setCurrentTab('landing')}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                currentTab === 'landing'
                  ? 'text-amber-400 font-black bg-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">الرئيسية</span>
            </button>

            <a
              href="#app-download"
              className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-indigo-400"
            >
              <Smartphone className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">التطبيق</span>
            </a>

            <a
              href="#reviews"
              className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-amber-400"
            >
              <Star className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">التقييمات</span>
            </a>

            <button
              onClick={() => setCurrentTab('guide')}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                currentTab === 'guide'
                  ? 'text-amber-300 font-black bg-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">الدليل</span>
            </button>

            <button
              onClick={onOpenAuth}
              className="flex flex-col items-center justify-center py-1 px-3.5 rounded-xl bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 active:scale-95"
            >
              <UserIcon className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">دخول</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setCurrentTab('services')}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                currentTab === 'services'
                  ? 'text-indigo-400 font-black bg-indigo-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">المتجر</span>
            </button>

            <button
              onClick={() => setCurrentTab('orders')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                currentTab === 'orders'
                  ? 'text-indigo-400 font-black bg-indigo-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListOrdered className="w-5 h-5 mb-0.5" />
              <span className="text-[11px]">طلباتي</span>
            </button>

            <button
              onClick={() => setCurrentTab('wallet')}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                currentTab === 'wallet'
                  ? 'text-emerald-400 font-black bg-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Wallet className="w-5 h-5 mb-0.5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[10px]">إيداع الرصيد</span>
            </button>

            <button
              onClick={() => setCurrentTab('tickets')}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                currentTab === 'tickets'
                  ? 'text-indigo-400 font-black bg-indigo-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Headphones className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">الدعم</span>
            </button>

            <button
              onClick={() => setCurrentTab('guide')}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                currentTab === 'guide'
                  ? 'text-amber-300 font-black bg-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">الدليل</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setCurrentTab('admin')}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                  currentTab === 'admin'
                    ? 'text-rose-400 font-black bg-rose-500/15'
                    : 'text-rose-400/80 hover:text-rose-300'
                }`}
              >
                <ShieldAlert className="w-5 h-5 mb-0.5" />
                <span className="text-[11px]">الإدارة</span>
              </button>
            )}
          </>
        )}
      </nav>

      {/* Real-time Incoming Notification Toast (Safe bottom offset for mobile navbar) */}
      {latestToast && (
        <div className="fixed bottom-20 left-3 right-3 sm:right-auto sm:left-6 z-50 max-w-sm rounded-2xl bg-slate-900 border border-indigo-500/60 shadow-2xl p-4 text-right animate-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-3">
            <button
              onClick={dismissToast}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="text-xs font-black text-white">{latestToast.title}</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{latestToast.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Email Inbox/Outbox Modal */}
      <EmailModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} />
    </>
  );
};
