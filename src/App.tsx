import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { LandingPageView } from './components/views/LandingPageView.tsx';
import { ServicesView } from './components/views/ServicesView.tsx';
import { OrdersView } from './components/views/OrdersView.tsx';
import { WalletView } from './components/views/WalletView.tsx';
import { TicketsView } from './components/views/TicketsView.tsx';
import { UserGuideView } from './components/views/UserGuideView.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { CustomerSupportChat } from './components/CustomerSupportChat.tsx';
import { ShieldCheck, Sparkles } from 'lucide-react';

function AppContent() {
  const { user } = useAuth();
  // By default, show introductory landing page for visitors before entering main app content
  const [currentTab, setCurrentTab] = useState<string>(() => (user ? 'services' : 'landing'));
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // When user successfully signs in, transition to main services store
  useEffect(() => {
    if (user && currentTab === 'landing') {
      setCurrentTab('services');
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 w-full">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main View Container (with safe pb-28 for mobile bottom navigation bar) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 md:pb-10">
        
        {/* 1. INTRODUCTORY LANDING PAGE (VISITORS ONLY) */}
        {!user && currentTab !== 'guide' && (
          <LandingPageView
            onGetStarted={() => setIsAuthOpen(true)}
            onExploreServices={() => setIsAuthOpen(true)}
            onContactAdmin={() => window.open('https://wa.me/201556266856', '_blank')}
          />
        )}

        {/* 2. SERVICES & GAMING CATALOG (AUTHENTICATED USERS) */}
        {user && currentTab === 'services' && (
          <ServicesView
            onNavigateToWallet={() => setCurrentTab('wallet')}
            onNavigateToOrders={() => setCurrentTab('orders')}
          />
        )}

        {/* 3. ORDERS VIEW */}
        {user && currentTab === 'orders' && (
          <OrdersView onNavigateToServices={() => setCurrentTab('services')} />
        )}

        {/* 4. WALLET & RECHARGE */}
        {user && currentTab === 'wallet' && <WalletView />}

        {/* 5. SUPPORT TICKETS */}
        {user && currentTab === 'tickets' && <TicketsView />}

        {/* 6. USER GUIDE & FAQ */}
        {currentTab === 'guide' && <UserGuideView onNavigateTab={setCurrentTab} />}

        {/* 7. ADMIN DASHBOARD */}
        {currentTab === 'admin' && (
          (user?.role === 'admin' && user?.email === 'ywsfahmdwydh1@gmail.com') ? (
            <AdminDashboard />
          ) : (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-md mx-auto my-12 space-y-3">
              <h3 className="text-base font-bold text-rose-400">منطقة مخصصة للإدارة فقط</h3>
              <p className="text-xs text-slate-400">
                هذه الصفحة تتطلب تسجيل الدخول بحساب المشرف الرئيسي المعتمد.
              </p>
              <button
                onClick={() => setCurrentTab('services')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
              >
                العودة لمتجر الخدمات
              </button>
            </div>
          )
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Interactive Safe Customer Support Assistant */}
      <CustomerSupportChat onNavigateTab={setCurrentTab} />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 mt-12 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-amber-400/50 shrink-0">
              <img src="/images/logo.png" alt="KOUMND" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-black text-slate-200">KOUMND | كومند</span>
              <span className="mx-2">•</span>
              <span>أرخص وأقوى منصة معتمدة لشحن الألعاب والمنصات الرقمية</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              أمان وتشفير 100%
            </span>
            <span>•</span>
            <span>تنفيذ فوري بالـ ID</span>
            <span>•</span>
            <span>إشعارات هاتف مباشرة 24/7</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
