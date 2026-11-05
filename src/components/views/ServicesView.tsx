import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { usePWAInstall } from '../../hooks/usePWAInstall.ts';
import { Category, Service, Order } from '../../types/index.ts';
import { calculateOrderCharge } from '../../lib/orderCalculation.ts';
import { parseResponseJson } from '../../lib/safeJson.ts';
import { persistOrderToFirestore } from '../../lib/firebase.ts';
import {
  ShoppingBag,
  TrendingUp,
  Search,
  DollarSign,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Download,
  Smartphone,
  Send,
  ShieldCheck,
  Zap,
  Percent,
  X,
  Layers,
  Gamepad2,
  Share2,
  Flame,
  Trophy,
  Dice6,
  Check,
  Tag,
  Video,
  Megaphone,
} from 'lucide-react';

import { RetryOrderData } from '../../context/NotificationContext.tsx';

interface ServicesViewProps {
  onNavigateToWallet: () => void;
  onNavigateToOrders: () => void;
  retryOrderData?: RetryOrderData | null;
  onClearRetryOrder?: () => void;
}

// Gaming category IDs helper
const GAMING_CAT_IDS = ['cat_pubg', 'cat_freefire', 'cat_fifa', 'cat_ludo'];

// ============================================================================
// Authentic Brand & Game SVG Logos
// ============================================================================
export const PlatformLogo: React.FC<{ categoryId: string; className?: string }> = ({
  categoryId,
  className = 'w-6 h-6',
}) => {
  switch (categoryId) {
    // ----------------- Ready Accounts & Social Platforms -----------------
    case 'cat_ready_accounts':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" />
          <path d="M12 18h.01" stroke="currentColor" strokeLinecap="round" />
          <path d="m9 10 2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'cat_tiktok':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path
            d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.892 2.893 2.895 2.895 0 0 1-2.893-2.893 2.895 2.895 0 0 1 2.893-2.892c.328 0 .642.062.934.175V9.453a6.3 6.3 0 0 0-.934-.07A6.34 6.34 0 0 0 3.14 15.72a6.34 6.34 0 0 0 6.342 6.34 6.34 6.34 0 0 0 6.34-6.34V9.012a8.212 8.212 0 0 0 3.767 1.116V6.686z"
            fill="currentColor"
          />
        </svg>
      );
    case 'cat_instagram':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <defs>
            <radialGradient id="ig-grad-view-2" cx="30%" cy="105%" r="120%">
              <stop offset="0%" stopColor="#fdf497" />
              <stop offset="15%" stopColor="#fdf497" />
              <stop offset="45%" stopColor="#fd5949" />
              <stop offset="65%" stopColor="#d6249f" />
              <stop offset="90%" stopColor="#285AEB" />
            </radialGradient>
          </defs>
          <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="url(#ig-grad-view-2)" strokeWidth="2.2" />
          <circle cx="12" cy="12" r="4.2" stroke="url(#ig-grad-view-2)" strokeWidth="2.2" />
          <circle cx="17.5" cy="6.5" r="1.3" fill="url(#ig-grad-view-2)" />
        </svg>
      );
    case 'cat_facebook':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case 'cat_youtube':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case 'cat_telegram':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.939z" />
        </svg>
      );
    case 'cat_twitter':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'cat_snapchat':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M12 2.25c-3.738 0-6.19 2.527-6.19 6.275 0 1.254.348 2.378.486 2.766.07.199.04.42-.078.59-.117.172-.312.274-.52.274-.383 0-.938-.28-1.503-.563-.193-.097-.423-.075-.595.056-.172.131-.247.348-.191.554.432 1.583 1.776 2.457 2.656 2.723.18.055.326.19.387.366.113.332.14.778-.184 1.157-.344.404-.972.636-1.867.689-.255.015-.47.185-.544.43-.074.244.02.508.237.667 1.487 1.092 3.153 1.378 4.296 1.482.23.021.41.196.442.426.082.593.414 1.229 1.15 1.52.477.189 1.05.249 1.696.249.646 0 1.218-.06 1.695-.249.736-.291 1.068-.927 1.15-1.52.032-.23.212-.405.442-.426 1.143-.104 2.809-.39 4.296-1.482.217-.159.311-.423.237-.667-.074-.245-.289-.415-.544-.43-.895-.053-1.523-.285-1.867-.689-.324-.379-.297-.825-.184-1.157.061-.176.207-.311.387-.366.88-.266 2.224-1.14 2.656-2.723.056-.206-.019-.423-.191-.554-.172-.131-.402-.153-.595-.056-.565.283-1.12.563-1.503.563-.208 0-.403-.102-.52-.274-.118-.17-.148-.391-.078-.59.138-.388.486-1.512.486-2.766 0-3.748-2.452-6.275-6.19-6.275z" />
        </svg>
      );
    case 'cat_threads':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M12.186 24h-.007C5.463 24 0 18.537 0 11.814 0 5.09 5.463 0 12.186 0c6.643 0 12.034 5.31 12.183 11.95v.693c0 3.738-2.613 6.357-6.088 6.357-2.072 0-3.82-.993-4.707-2.673-.66 1.637-2.152 2.673-4.225 2.673-3.155 0-5.59-2.39-5.59-5.834 0-3.48 2.47-5.91 5.666-5.91 1.777 0 3.328.79 4.318 2.188v-1.74h2.72v7.712c0 2.253 1.488 3.75 3.498 3.75 2.152 0 3.64-1.638 3.64-4.088v-.435C21.464 6.8 17.29 2.72 12.186 2.72 7.025 2.72 2.72 7.025 2.72 12.186c0 5.162 4.305 9.466 9.466 9.466 2.784 0 5.162-1.076 6.877-2.936l1.928 1.928C18.673 22.955 15.65 24 12.186 24zm-2.85-8.35c1.67 0 2.91-1.24 2.91-2.91 0-1.67-1.24-2.91-2.91-2.91-1.67 0-2.91 1.24-2.91 2.91 0 1.67 1.24 2.91 2.91 2.91z" />
        </svg>
      );
    case 'cat_whatsapp':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-5.795 1.543zm6.26-3.864c1.558.924 3.376 1.411 5.228 1.412 5.424 0 9.837-4.412 9.84-9.838.002-2.628-1.022-5.1-2.88-6.958-1.859-1.859-4.33-2.883-6.96-2.885-5.425 0-9.838 4.412-9.84 9.839-.002 1.894.529 3.743 1.536 5.338l-1.009 3.687 3.085-.825z" />
        </svg>
      );
    case 'cat_spotify':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
      );
    case 'cat_linkedin':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      );
    case 'cat_kwai':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
        </svg>
      );
    case 'cat_twitch_kick':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M2.149 0l-1.612 4.119v16.8h4.908v3.081h3.274l3.081-3.081h4.092l7.108-7.108V0H2.149zm19.14 12.632l-3.545 3.545h-4.908l-2.727 2.727v-2.727H6.516V2.149h14.773v10.483zm-4.363-6.273h-2.182v6.273h2.182V6.359zm-5.454 0H9.29v6.273h2.182V6.359z" />
        </svg>
      );
    case 'cat_subscriptions':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'cat_google_reviews':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
      );

    // ----------------- Gaming Platforms (Official Game Badges & Icons) -----------------
    case 'cat_pubg':
      return (
        <img
          src="/images/games/pubg.webp"
          alt="ببجي موبايل PUBG Mobile"
          className={`${className} object-cover rounded-xl shadow-md`}
          loading="lazy"
        />
      );
    case 'cat_freefire':
      return (
        <img
          src="/images/games/freefire.webp"
          alt="فري فاير Free Fire"
          className={`${className} object-cover rounded-xl shadow-md`}
          loading="lazy"
        />
      );
    case 'cat_fifa':
      return (
        <img
          src="/images/games/fifa.webp"
          alt="فيفا موبايل FC Mobile"
          className={`${className} object-cover rounded-xl shadow-md`}
          loading="lazy"
        />
      );
    case 'cat_ludo':
      return (
        <img
          src="/images/games/ludo.webp"
          alt="يلا لودو Yalla Ludo"
          className={`${className} object-cover rounded-xl shadow-md`}
          loading="lazy"
        />
      );
    default:
      return <Layers className={className} />;
  }
};

// ============================================================================
// Authentic Individual Service & App Logo (ChatGPT, Canva, CapCut, Games, etc.)
// ============================================================================
export const ServiceAppLogo: React.FC<{
  serviceName: string;
  categoryId: string;
  className?: string;
}> = ({ serviceName, categoryId, className = 'w-6 h-6' }) => {
  const text = (serviceName + ' ' + categoryId).toLowerCase();

  // 1. ChatGPT / OpenAI
  if (text.includes('gpt') || text.includes('chatgpt') || text.includes('شات') || text.includes('جي بي تي')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <rect width="24" height="24" rx="6" fill="#10A37F" />
        <path
          d="M18.8 11.2a3.8 3.8 0 0 0-.3-2.9 3.9 3.9 0 0 0-3.6-1.9h-.7a3.8 3.8 0 0 0-2.4-1.5 3.9 3.9 0 0 0-4 1.4 3.8 3.8 0 0 0-2.3 1.8 3.9 3.9 0 0 0 .4 4.3 3.8 3.8 0 0 0 .3 2.9 3.9 3.9 0 0 0 3.6 1.9h.7a3.8 3.8 0 0 0 2.4 1.5 3.9 3.9 0 0 0 4-1.4 3.8 3.8 0 0 0 2.3-1.8 3.9 3.9 0 0 0-.4-4.3zm-6.8 6.7a2.6 2.6 0 0 1-1.6-.5l2.4-1.4a.7.7 0 0 0 .3-.6v-3.3l1-.6 2.3 1.3v2.8a2.6 2.6 0 0 1-4.4 2.3zm-4.7-2a2.6 2.6 0 0 1-.3-1.6v-2.8l2.4 1.4a.7.7 0 0 0 .7 0l2.9-1.7v1.2l-2.4 1.4-2.4 1.4a2.6 2.6 0 0 1-.9.7zm-1-5.1a2.6 2.6 0 0 1 1.3-1.1l-.1 2.8a.7.7 0 0 0 .3.6l2.9 1.7-1 .6-2.4-1.4-1-3.2zm6.6-1.9l-2.3-1.3v-2.8a2.6 2.6 0 0 1 4.5-.7l-2.2 1.3a.7.7 0 0 0-.3.6l.3 2.9zm3.7 2.6a2.6 2.6 0 0 1 .3 1.6v2.8l-2.4-1.4a.7.7 0 0 0-.7 0l-2.9 1.7v-1.2l2.4-1.4 2.4-1.4a2.6 2.6 0 0 1 .9-.7zm-1.8 1.1l-2.9-1.7 1-.6 2.4 1.4 1 3.2a2.6 2.6 0 0 1-1.2-1.7l-.3-.6z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 2. Canva Pro
  if (text.includes('canva') || text.includes('كانفا')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <rect width="24" height="24" rx="6" fill="#00C4CC" />
        <path
          d="M12 4C7.58 4 4 7.58 4 12s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm2.2 11.2c-.8.8-1.9 1.2-3.1 1.2-2.4 0-4.1-1.7-4.1-4.2s1.7-4.2 4.1-4.2c1.1 0 2.1.4 2.8 1.1l-1.1 1.1c-.4-.4-1-.7-1.7-.7-1.5 0-2.5 1.1-2.5 2.7s1 2.7 2.5 2.7c.7 0 1.3-.3 1.7-.7l1.4 1z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 3. CapCut Pro
  if (text.includes('capcut') || text.includes('كاب كات') || text.includes('كابكات')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <rect width="24" height="24" rx="6" fill="#000000" stroke="#334155" strokeWidth="1" />
        <path d="M5 8l7-4 7 4-7 4-7-4zm0 8l7-4 7 4-7 4-7-4z" fill="#FFFFFF" />
      </svg>
    );
  }

  // 4. VPN
  if (text.includes('vpn') || text.includes('في بي ان')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <rect width="24" height="24" rx="6" fill="#1E3A8A" />
        <path
          d="M12 4L4 7v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V7l-8-3zm0 4a3 3 0 0 1 3 3c0 1.3-.8 2.4-2 2.8V16h-2v-2.2A3 3 0 0 1 9 11a3 3 0 0 1 3-3z"
          fill="#60A5FA"
        />
      </svg>
    );
  }

  // 5. Discord
  if (text.includes('discord') || text.includes('دسكورد') || text.includes('ديسكورد')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <rect width="24" height="24" rx="6" fill="#5865F2" />
        <path
          d="M18.8 6.5A15.3 15.3 0 0 0 15 5.3a.1.1 0 0 0-.1 0 10.6 10.6 0 0 0-.5 1 14.2 14.2 0 0 0-4.8 0 10.6 10.6 0 0 0-.5-1 .1.1 0 0 0-.1 0 15.3 15.3 0 0 0-3.8 1.2.1.1 0 0 0 0 .1C3 11 3.7 15.3 5.4 18.2a.1.1 0 0 0 .1 0 15.4 15.4 0 0 0 4.6 2.3.1.1 0 0 0 .1 0c.4-.5.7-1 1-1.6a.1.1 0 0 0-.1-.1 10.1 10.1 0 0 1-1.4-.7.1.1 0 0 1 0-.2c.1-.1.2-.2.3-.2a11 11 0 0 0 9.8 0 .1.1 0 0 1 .3.2.1.1 0 0 1 0 .2 10.2 10.2 0 0 1-1.4.7.1.1 0 0 0-.1.1c.3.5.7 1.1 1 1.6a.1.1 0 0 0 .1 0 15.4 15.4 0 0 0 4.7-2.3.1.1 0 0 0 .1 0c1.9-3.4 1.3-7.7-.3-11.7a.1.1 0 0 0 0-.1zM9.5 14.8c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8c.9 0 1.6.8 1.6 1.8s-.7 1.8-1.6 1.8zm5 0c-.9 0-1.6-.8-1.6-1.8s.7-1.8 1.6-1.8c.9 0 1.6.8 1.6 1.8s-.7 1.8-1.6 1.8z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 6. Google Maps Reviews
  if (text.includes('google') || text.includes('جوجل') || text.includes('خرائط') || text.includes('تقييم')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <rect width="24" height="24" rx="6" fill="#1E293B" />
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EA4335" />
        <circle cx="12" cy="9" r="2.5" fill="#FFFFFF" />
      </svg>
    );
  }

  // 7. WhatsApp
  if (text.includes('whatsapp') || text.includes('واتساب') || text.includes('واتس')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <rect width="24" height="24" rx="6" fill="#25D366" />
        <path
          d="M12 4.5A7.5 7.5 0 0 0 5.5 15.8L4.5 19.5l3.8-1a7.5 7.5 0 1 0 3.7-14zm3.9 10.6c-.2.5-.9 1-1.4 1.1-.4 0-.8.2-2.7-.6-2.2-.9-3.7-3.2-3.8-3.4-.1-.1-.9-1.2-.9-2.3s.6-1.6.8-1.8c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .5.4.2.5.7 1.8.8 1.9.1.1.1.3 0 .5s-.2.3-.3.4l-.4.5c-.1.1-.3.3-.1.6.2.4.9 1.5 2 2.4 1.3 1.1 2.4 1.5 2.8 1.6.3.1.5.1.7-.1.2-.2.8-1 .1-1.3.2-.3.4-.2.6-.1l1.8.9c.2.1.4.2.5.3.1.3.1.8-.1 1.3z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 8. Kwai
  if (text.includes('kwai') || text.includes('كواي')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <rect width="24" height="24" rx="6" fill="#FF6E00" />
        <path d="M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm-1 8.5v-5l4.5 2.5-4.5 2.5z" fill="#FFFFFF" />
      </svg>
    );
  }

  // 9. Spotify
  if (text.includes('spotify') || text.includes('سبوتيفاي')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <rect width="24" height="24" rx="6" fill="#1DB954" />
        <path
          d="M16.5 15.6c-.2.3-.5.4-.8.2-2.2-1.3-4.9-1.6-8.2-.9-.3.1-.6-.1-.7-.4-.1-.3.1-.6.4-.7 3.5-.8 6.5-.4 9 1.1.3.2.4.5.3.7zm1.1-2.5c-.2.3-.6.4-.9.2-2.5-1.5-6.3-2-9.2-1.1-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-.9 3.4-1 7.6-.5 10.3 1.2.4.2.5.7.2 1.1zm.1-2.6C14.7 8.7 9.8 8.5 7 9.4c-.5.1-.9-.1-1.1-.6-.1-.5.1-.9.6-1.1 3.3-1 8.7-.8 12.1 1.2.4.2.6.8.3 1.2-.2.4-.7.6-1.2.4z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 10. LinkedIn
  if (text.includes('linkedin') || text.includes('لينكد')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <rect width="24" height="24" rx="6" fill="#0A66C2" />
        <path
          d="M8.5 17h-2v-7h2v7zm-1-8a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4zm10 8h-2v-3.7c0-1.1-.4-1.8-1.4-1.8-.8 0-1.2.5-1.4 1v4.5h-2s.03-6.3 0-7h2v1c.3-.4.9-1.1 2.1-1.1 1.5 0 2.7 1 2.7 3.2V17z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 11. Twitch & Kick
  if (text.includes('kick') || text.includes('كيك')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <rect width="24" height="24" rx="6" fill="#000000" stroke="#53FC18" strokeWidth="1" />
        <path d="M7 5h3v5.5l3.5-5.5h3.5L12.5 12l5 7h-3.7L10 13.5V19H7V5z" fill="#53FC18" />
      </svg>
    );
  }
  if (text.includes('twitch') || text.includes('تويتش')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none">
        <rect width="24" height="24" rx="6" fill="#9146FF" />
        <path d="M6 5l-1.5 3.5v10.5h3.5v2h2l2-2h2.5l4.5-4.5V5H6zm10.5 8l-2.5 2.5h-3l-2 2v-2H7.5V6.5h9v6.5zm-5-3.5h1.5v3.5H11.5V9.5zm3.5 0h1.5v3.5H15V9.5z" fill="#FFFFFF" />
      </svg>
    );
  }

  // 12. Fallback to category PlatformLogo
  return <PlatformLogo categoryId={categoryId} className={className} />;
};

const getCategoryCardStyle = (catId: string, isSelected: boolean) => {
  switch (catId) {
    case 'cat_pubg':
      return {
        card: isSelected
          ? 'bg-gradient-to-b from-amber-950 to-slate-900 border-amber-400 ring-2 ring-amber-400/60 shadow-lg shadow-amber-500/20'
          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700',
        iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
        badge: 'bg-amber-500/20 text-amber-300',
        name: 'ببجي موبايل',
        subName: 'شدات UC فورية',
      };
    case 'cat_freefire':
      return {
        card: isSelected
          ? 'bg-gradient-to-b from-orange-950 to-slate-900 border-orange-400 ring-2 ring-orange-400/60 shadow-lg shadow-orange-500/20'
          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700',
        iconBg: 'bg-orange-500/10 text-orange-400 border border-orange-500/30',
        badge: 'bg-orange-500/20 text-orange-300',
        name: 'فري فاير',
        subName: 'جواهر Diamonds',
      };
    case 'cat_fifa':
      return {
        card: isSelected
          ? 'bg-gradient-to-b from-emerald-950 to-slate-900 border-emerald-400 ring-2 ring-emerald-400/60 shadow-lg shadow-emerald-500/20'
          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700',
        iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
        badge: 'bg-emerald-500/20 text-emerald-300',
        name: 'فيفا موبايل',
        subName: 'نقاط FC Points',
      };
    case 'cat_ludo':
      return {
        card: isSelected
          ? 'bg-gradient-to-b from-purple-950 to-slate-900 border-purple-400 ring-2 ring-purple-400/60 shadow-lg shadow-purple-500/20'
          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700',
        iconBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
        badge: 'bg-purple-500/20 text-purple-300',
        name: 'يلا لودو',
        subName: 'ماس وكوينز ذهب',
      };
    case 'cat_ready_accounts':
      return {
        card: isSelected
          ? 'bg-gradient-to-b from-emerald-950 to-slate-900 border-emerald-400 ring-2 ring-emerald-400/60 shadow-lg shadow-emerald-500/20'
          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700',
        iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
        badge: 'bg-emerald-500/20 text-emerald-300',
        name: 'حسابات جاهزة',
        subName: 'تيك توك موثقة 100%',
      };
    case 'cat_tiktok':
      return {
        card: isSelected
          ? 'bg-gradient-to-b from-cyan-950 to-slate-900 border-cyan-400 ring-2 ring-cyan-400/60 shadow-lg shadow-cyan-500/20'
          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700',
        iconBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30',
        badge: 'bg-cyan-500/20 text-cyan-300',
        name: 'تيك توك',
      };
    case 'cat_instagram':
      return {
        card: isSelected
          ? 'bg-gradient-to-b from-pink-950 to-slate-900 border-pink-500 ring-2 ring-pink-500/60 shadow-lg shadow-pink-500/20'
          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700',
        iconBg: 'bg-pink-500/10 text-pink-400 border border-pink-500/30',
        badge: 'bg-pink-500/20 text-pink-300',
        name: 'إنستغرام',
      };
    case 'cat_facebook':
      return {
        card: isSelected
          ? 'bg-gradient-to-b from-blue-950 to-slate-900 border-blue-400 ring-2 ring-blue-400/60 shadow-lg shadow-blue-500/20'
          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700',
        iconBg: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
        badge: 'bg-blue-500/20 text-blue-300',
        name: 'فيسبوك',
      };
    case 'cat_youtube':
      return {
        card: isSelected
          ? 'bg-gradient-to-b from-red-950 to-slate-900 border-red-500 ring-2 ring-red-500/60 shadow-lg shadow-red-500/20'
          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700',
        iconBg: 'bg-red-500/10 text-red-400 border border-red-500/30',
        badge: 'bg-red-500/20 text-red-300',
        name: 'يوتيوب',
      };
    case 'cat_telegram':
      return {
        card: isSelected
          ? 'bg-gradient-to-b from-sky-950 to-slate-900 border-sky-400 ring-2 ring-sky-400/60 shadow-lg shadow-sky-500/20'
          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700',
        iconBg: 'bg-sky-500/10 text-sky-400 border border-sky-500/30',
        badge: 'bg-sky-500/20 text-sky-300',
        name: 'تيليجرام',
      };
    case 'cat_twitter':
      return {
        card: isSelected
          ? 'bg-gradient-to-b from-slate-800 to-black border-slate-300 ring-2 ring-slate-300/60 shadow-lg shadow-slate-300/20'
          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700',
        iconBg: 'bg-slate-800 text-white border border-slate-600',
        badge: 'bg-slate-800 text-slate-200',
        name: 'إكس (تويتر)',
      };
    case 'cat_snapchat':
      return {
        card: isSelected
          ? 'bg-gradient-to-b from-yellow-950 to-slate-900 border-yellow-400 ring-2 ring-yellow-400/60 shadow-lg shadow-yellow-500/20'
          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700',
        iconBg: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
        badge: 'bg-yellow-500/20 text-yellow-300',
        name: 'سناب شات',
      };
    case 'cat_threads':
      return {
        card: isSelected
          ? 'bg-gradient-to-b from-emerald-950 to-slate-900 border-emerald-400 ring-2 ring-emerald-400/60 shadow-lg shadow-emerald-500/20'
          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700',
        iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
        badge: 'bg-emerald-500/20 text-emerald-300',
        name: 'ثريدز',
      };
    case 'cat_whatsapp':
      return {
        card: isSelected
          ? 'bg-gradient-to-b from-emerald-950 to-slate-900 border-emerald-400 ring-2 ring-emerald-400/60 shadow-lg shadow-emerald-500/20'
          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700',
        iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
        badge: 'bg-emerald-500/20 text-emerald-300',
        name: 'واتساب',
        subName: 'قنوات ومجموعات ورسائل',
      };
    case 'cat_spotify':
      return {
        card: isSelected
          ? 'bg-gradient-to-b from-green-950 to-slate-900 border-green-400 ring-2 ring-green-400/60 shadow-lg shadow-green-500/20'
          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700',
        iconBg: 'bg-green-500/10 text-green-400 border border-green-500/30',
        badge: 'bg-green-500/20 text-green-300',
        name: 'سبوتيفاي',
        subName: 'مستمعين ومتابعين وبلايليست',
      };
    case 'cat_linkedin':
      return {
        card: isSelected
          ? 'bg-gradient-to-b from-blue-950 to-slate-900 border-blue-400 ring-2 ring-blue-400/60 shadow-lg shadow-blue-500/20'
          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700',
        iconBg: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
        badge: 'bg-blue-500/20 text-blue-300',
        name: 'لينكد إن',
        subName: 'متابعين وتفاعل مهني',
      };
    case 'cat_kwai':
      return {
        card: isSelected
          ? 'bg-gradient-to-b from-amber-950 to-slate-900 border-amber-400 ring-2 ring-amber-400/60 shadow-lg shadow-amber-500/20'
          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700',
        iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
        badge: 'bg-amber-500/20 text-amber-300',
        name: 'كواي (Kwai)',
        subName: 'متابعين ومشاهدات وإعجابات',
      };
    case 'cat_twitch_kick':
      return {
        card: isSelected
          ? 'bg-gradient-to-b from-violet-950 to-slate-900 border-violet-400 ring-2 ring-violet-400/60 shadow-lg shadow-violet-500/20'
          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700',
        iconBg: 'bg-violet-500/10 text-violet-400 border border-violet-500/30',
        badge: 'bg-violet-500/20 text-violet-300',
        name: 'تويتش وكيك',
        subName: 'بث مباشر ومتابعين',
      };
    case 'cat_subscriptions':
      return {
        card: isSelected
          ? 'bg-gradient-to-b from-indigo-950 to-slate-900 border-indigo-400 ring-2 ring-indigo-400/60 shadow-lg shadow-indigo-500/20'
          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700',
        iconBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30',
        badge: 'bg-indigo-500/20 text-indigo-300',
        name: 'اشتراكات وذكاء اصطناعي',
        subName: 'ChatGPT, Canva, VPN, CapCut',
      };
    case 'cat_google_reviews':
      return {
        card: isSelected
          ? 'bg-gradient-to-b from-yellow-950 to-slate-900 border-yellow-400 ring-2 ring-yellow-400/60 shadow-lg shadow-yellow-500/20'
          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700',
        iconBg: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
        badge: 'bg-yellow-500/20 text-yellow-300',
        name: 'تقييمات وخرائط جوجل',
        subName: 'تقييمات حقيقية 5 نجوم',
      };
    default:
      return {
        card: isSelected
          ? 'bg-indigo-950 border-indigo-400 ring-2 ring-indigo-400/60'
          : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300',
        iconBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30',
        badge: 'bg-indigo-500/20 text-indigo-300',
        name: 'القسم',
      };
  }
};

export const ServicesView: React.FC<ServicesViewProps> = ({
  onNavigateToWallet,
  onNavigateToOrders,
  retryOrderData,
  onClearRetryOrder,
}) => {
  const { user, token, updateBalanceLocally } = useAuth();
  const { notifications } = useNotifications();
  const { isInstallable, install } = usePWAInstall();

  // Primary Section: Social Platforms by default (with Gaming)
  const [activeCatalogMode, setActiveCatalogMode] = useState<'gaming' | 'social'>('social');

  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('cat_tiktok');
  const [topSearchBar, setTopSearchBar] = useState('');
  const [subTypeFilter, setSubTypeFilter] = useState<string>('all');
  const [isSubBarOpen, setIsSubBarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userSpent, setUserSpent] = useState<number>(0);

  // Active broadcast announcement from admin
  const latestAnnouncement = useMemo(() => {
    return notifications.find((n) => n.type === 'announcement');
  }, [notifications]);

  // Modal Order Sheet State
  const [activeOrderService, setActiveOrderService] = useState<Service | null>(null);
  const [playerUidOrLink, setPlayerUidOrLink] = useState('');
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderFeedback, setOrderFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-open order modal if retryOrderData is provided ("مع إعادة المحاولة")
  useEffect(() => {
    if (!retryOrderData || services.length === 0) return;

    let targetService = services.find((s) => s.id === retryOrderData.serviceId);
    if (!targetService && retryOrderData.serviceName) {
      const targetNameClean = retryOrderData.serviceName.trim().toLowerCase();
      targetService = services.find(
        (s) => s.name.trim().toLowerCase() === targetNameClean
      );
    }
    if (!targetService && retryOrderData.serviceName) {
      targetService = services.find(
        (s) => s.name.includes(retryOrderData.serviceName!) || retryOrderData.serviceName!.includes(s.name)
      );
    }

    if (targetService) {
      setActiveOrderService(targetService);
      setPlayerUidOrLink(retryOrderData.link || '');
      setOrderQuantity(retryOrderData.quantity || 1);
      if (GAMING_CAT_IDS.includes(targetService.categoryId)) {
        setActiveCatalogMode('gaming');
      } else {
        setActiveCatalogMode('social');
      }
      setSelectedCategory(targetService.categoryId);
      setOrderFeedback({
        type: 'success',
        message: `تم استرجاع بيانات الخدمة للطلب #${retryOrderData.orderNumber || ''} لإعادة المحاولة فوراً بنقرة واحدة! 🔄`,
      });
      onClearRetryOrder?.();
    }
  }, [retryOrderData, services, onClearRetryOrder]);

  // Fetch categories and services
  const fetchData = async () => {
    try {
      const [catsRes, servsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/services'),
      ]);
      const catsData = await parseResponseJson<{ categories?: Category[] }>(catsRes, { categories: [] });
      const servsData = await parseResponseJson<{ services?: Service[] }>(servsRes, { services: [] });

      const loadedCats: Category[] = catsData.categories || [];
      const loadedServs: Service[] = servsData.services || [];

      setCategories(loadedCats.filter((c) => c.id !== 'cat_ready_accounts'));
      setServices(loadedServs);
      // Default to TikTok (Social services)
      setSelectedCategory('cat_tiktok');
      setActiveCatalogMode('social');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch actual user spent
  useEffect(() => {
    if (token) {
      fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((data) => {
          const list: Order[] = data.orders || [];
          const total = list
            .filter((o) => o.status !== 'canceled' && o.status !== 'refunded')
            .reduce((sum, o) => sum + (o.charge || 0), 0);
          setUserSpent(total);
        })
        .catch(() => {});
    }
  }, [token, user?.balance]);

  // Separate categories into Social vs Gaming
  const gamingCategories = useMemo(() => {
    return categories.filter((c) => GAMING_CAT_IDS.includes(c.id));
  }, [categories]);

  const socialCategories = useMemo(() => {
    return categories.filter((c) => !GAMING_CAT_IDS.includes(c.id) && c.id !== 'cat_ready_accounts');
  }, [categories]);

  // When switching catalog mode
  const handleSwitchMode = (mode: 'gaming' | 'social') => {
    setActiveCatalogMode(mode);
    setSubTypeFilter('all');
    setIsSubBarOpen(false);
    if (mode === 'gaming') {
      setSelectedCategory(gamingCategories[0]?.id || 'cat_pubg');
    } else {
      setSelectedCategory(socialCategories[0]?.id || 'cat_tiktok');
    }
  };

  // When selecting a category card:
  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setSubTypeFilter('all');
    setIsSubBarOpen(false);
  };

  const isCurrentCategoryGaming = GAMING_CAT_IDS.includes(selectedCategory);
  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);
  const currentCategoryName = activeCategoryObj
    ? activeCategoryObj.name.replace(/\(.*?\)/g, '').trim()
    : 'الخدمات';

  // Normalize Arabic text for searching
  const normalizeArabic = (text: string) => {
    return text
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .toLowerCase();
  };

  // Sub-type classification for Social Platforms
  const getSocialSubType = (serviceName: string, isAccountSale?: boolean): string => {
    if (isAccountSale) return 'accounts';
    const n = normalizeArabic(serviceName);
    if (n.includes('حساب') || n.includes('أكونت') || n.includes('اكونت') || n.includes('جاهز')) return 'accounts';
    if (n.includes('بث') || n.includes('لايف') || n.includes('تكبيس') || n.includes('مشاهدين بث')) return 'live';
    if (n.includes('متابع') || n.includes('مشترك') || n.includes('اعضاء')) return 'followers';
    if (n.includes('مشاهد') || n.includes('ريلز') || n.includes('فيديو') || n.includes('ستوري')) return 'views';
    if (n.includes('لايك') || n.includes('اعجاب') || n.includes('قلوب') || n.includes('تفاعل')) return 'likes';
    if (n.includes('تعليق') || n.includes('كومنت') || n.includes('تصويت')) return 'comments';
    if (n.includes('اكسبلور') || n.includes('مشارك') || n.includes('شير') || n.includes('حفظ') || n.includes('مفضل') || n.includes('ريتويت')) return 'explore';
    return 'other';
  };

  // Sub-type classification for Gaming
  const getGameSubType = (catId: string, serviceName: string): string => {
    const n = normalizeArabic(serviceName);
    if (catId === 'cat_pubg') {
      if (n.includes('رويال') || n.includes('باس') || n.includes('pass')) return 'pubg_pass';
      if (n.includes('توفير') || n.includes('عرض') || n.includes('سريع')) return 'pubg_saving';
      return 'pubg_uc';
    }
    if (catId === 'cat_freefire') {
      if (n.includes('عضويه') || n.includes('تصريح') || n.includes('اسبوعي') || n.includes('شهري') || n.includes('ليفل')) return 'ff_pass';
      if (n.includes('باقه') || n.includes('عرض') || n.includes('مميز')) return 'ff_bundle';
      return 'ff_diamonds';
    }
    if (catId === 'cat_fifa') {
      if (n.includes('نجم') || n.includes('star') || n.includes('تصريح')) return 'fifa_pass';
      return 'fifa_points';
    }
    if (catId === 'cat_ludo') {
      if (n.includes('ذهب') || n.includes('كوينز') || n.includes('coins')) return 'ludo_coins';
      if (n.includes('فارس') || n.includes('knight') || n.includes('vip')) return 'ludo_vip';
      return 'ludo_diamonds';
    }
    return 'all';
  };

  // Generate appropriate Sub-Type Options depending on category
  const activeSubOptions = useMemo(() => {
    if (!isCurrentCategoryGaming) {
      const opts = [
        { id: 'all', label: `جميع خدمات ${currentCategoryName}`, shortLabel: 'الكل', emoji: '✨' },
      ];
      if (selectedCategory === 'cat_tiktok') {
        opts.push({
          id: 'accounts',
          label: 'حسابات تيك توك جاهزة وموثقة (6K, 14K, 14.5K, 64K)',
          shortLabel: 'حسابات جاهزة',
          emoji: '💎',
        });
      }
      opts.push(
        { id: 'followers', label: `متابعين ومشتركين ${currentCategoryName}`, shortLabel: 'متابعين', emoji: '👥' },
        { id: 'views', label: `مشاهدات ${currentCategoryName}`, shortLabel: 'مشاهدات', emoji: '👁️' },
        { id: 'likes', label: `لايكات وتفاعل ${currentCategoryName}`, shortLabel: 'لايكات', emoji: '❤️' },
        { id: 'explore', label: `إكسبلور ومشاركات ${currentCategoryName}`, shortLabel: 'إكسبلور', emoji: '🚀' },
        { id: 'live', label: `بث مباشر وتكبيس ${currentCategoryName}`, shortLabel: 'بث لايف', emoji: '🔴' },
        { id: 'comments', label: `تعليقات ${currentCategoryName}`, shortLabel: 'تعليقات', emoji: '💬' }
      );
      return opts;
    }

    // Gaming Sub-options (No likes or followers!)
    switch (selectedCategory) {
      case 'cat_pubg':
        return [
          { id: 'all', label: 'جميع باقات ببجي موبايل', shortLabel: 'كل الباقات', emoji: '🎮' },
          { id: 'pubg_uc', label: 'شحن شدات UC فورية بالـ ID', shortLabel: 'شدات UC', emoji: '⚡' },
          { id: 'pubg_pass', label: 'رويال باس Royal Pass وبطاقات النخبة', shortLabel: 'رويال باس', emoji: '🎖️' },
        ];
      case 'cat_freefire':
        return [
          { id: 'all', label: 'جميع باقات فري فاير', shortLabel: 'كل الباقات', emoji: '🔥' },
          { id: 'ff_diamonds', label: 'جواهر فري فاير Diamonds بالـ ID', shortLabel: 'جواهر فري', emoji: '💎' },
          { id: 'ff_pass', label: 'العضوية وتصريح المستوى Level Pass', shortLabel: 'العضويات', emoji: '👑' },
        ];
      case 'cat_fifa':
        return [
          { id: 'all', label: 'جميع نقاط فيفا FC Mobile', shortLabel: 'كل النقاط', emoji: '⚽' },
          { id: 'fifa_points', label: 'نقاط FC Points بالمعرف UID', shortLabel: 'نقاط FC', emoji: '🟢' },
          { id: 'fifa_pass', label: 'تصريح النجم Star Pass', shortLabel: 'Star Pass', emoji: '⭐' },
        ];
      case 'cat_ludo':
        return [
          { id: 'all', label: 'جميع باقات يلا لودو', shortLabel: 'كل الباقات', emoji: '🎲' },
          { id: 'ludo_diamonds', label: 'شحن ماس لودو Diamonds بالـ ID', shortLabel: 'ماس لودو', emoji: '💎' },
          { id: 'ludo_coins', label: 'شحن كوينز وذهب يلا لودو', shortLabel: 'كوينز ذهب', emoji: '🪙' },
          { id: 'ludo_vip', label: 'باقة الفارس وعضويات VIP', shortLabel: 'باقة الفارس', emoji: '🛡️' },
        ];
      default:
        return [{ id: 'all', label: 'جميع الخدمات', shortLabel: 'الكل', emoji: '✨' }];
    }
  }, [isCurrentCategoryGaming, selectedCategory, currentCategoryName]);

  // Counts of services for current category
  const subCounts = useMemo(() => {
    const catServices = services.filter((s) => s.categoryId === selectedCategory);
    const counts: Record<string, number> = { all: catServices.length };

    activeSubOptions.forEach((opt) => {
      if (opt.id !== 'all') counts[opt.id] = 0;
    });

    catServices.forEach((s) => {
      const type = isCurrentCategoryGaming
        ? getGameSubType(selectedCategory, s.name)
        : getSocialSubType(s.name, s.isAccountSale);

      if (counts[type] !== undefined) {
        counts[type]++;
      }
    });

    return counts;
  }, [services, selectedCategory, isCurrentCategoryGaming, activeSubOptions]);

  // Filter services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      // Category match
      if (s.categoryId !== selectedCategory) return false;

      // Sub-type match
      if (subTypeFilter !== 'all') {
        const itemType = isCurrentCategoryGaming
          ? getGameSubType(selectedCategory, s.name)
          : getSocialSubType(s.name, s.isAccountSale);
        if (itemType !== subTypeFilter) return false;
      }

      // Search match
      const query = normalizeArabic(topSearchBar.trim());
      if (!query) return true;

      const normName = normalizeArabic(s.name);
      const normDesc = normalizeArabic(s.description || '');
      const normCat = normalizeArabic(currentCategoryName);

      return normName.includes(query) || normDesc.includes(query) || normCat.includes(query);
    });
  }, [services, selectedCategory, subTypeFilter, topSearchBar, isCurrentCategoryGaming, currentCategoryName]);

  // Open Order Modal for specific service
  const handleOpenOrder = (service: Service) => {
    if (!service.active || service.isAvailable === false) {
      return;
    }
    setActiveOrderService(service);
    if (service.type === 'package') {
      // For game package: 1 package
      setOrderQuantity(1);
    } else {
      // For social per-1000 service: default to service minQuantity directly
      setOrderQuantity(service.minQuantity || 100);
    }
    setPlayerUidOrLink('');
    setOrderFeedback(null);
  };

  // Close Order Modal
  const handleCloseOrder = () => {
    setActiveOrderService(null);
    setOrderFeedback(null);
  };

  // Calculate order cost in EGP
  const isPackageItem = activeOrderService?.type === 'package' || isCurrentCategoryGaming;
  const calculatedCostEGP = activeOrderService
    ? (isPackageItem
        ? activeOrderService.pricePer1000 * (Number(orderQuantity) || 1)
        : calculateOrderCharge(activeOrderService.pricePer1000, Number(orderQuantity) || 0))
    : 0;

  // Submit Order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) {
      setOrderFeedback({ type: 'error', message: 'يرجى تسجيل الدخول أولاً للمتابعة' });
      return;
    }

    if (!activeOrderService) return;

    if (!activeOrderService.active || activeOrderService.isAvailable === false) {
      setOrderFeedback({ type: 'error', message: 'هذه الخدمة غير متوفرة حالياً ومينفعش يطلب' });
      return;
    }

    if (!playerUidOrLink.trim()) {
      setOrderFeedback({
        type: 'error',
        message: isPackageItem
          ? 'يرجى إدخال معرّف اللاعب (Player ID / UID) الخاص بحسابك'
          : 'يرجى إدخال رابط الحساب أو المنشور المطلوب',
      });
      return;
    }

    const qty = Number(orderQuantity);
    if (!isPackageItem && (!qty || qty < (activeOrderService.minQuantity || 1))) {
      setOrderFeedback({
        type: 'error',
        message: `الحد الأدنى للكمية المسموح بها لهذه الخدمة هو ${(activeOrderService.minQuantity || 1).toLocaleString()}`,
      });
      return;
    }

    if (!isPackageItem && activeOrderService.maxQuantity && qty > activeOrderService.maxQuantity) {
      setOrderFeedback({
        type: 'error',
        message: `الحد الأقصى للكمية المسموح بها لهذه الخدمة هو ${activeOrderService.maxQuantity.toLocaleString()}`,
      });
      return;
    }

    if (user.balance < calculatedCostEGP) {
      setOrderFeedback({
        type: 'error',
        message: `رصيدك الحالي (${user.balance.toFixed(2)} ج.م) غير كافٍ. المطلوب: ${calculatedCostEGP.toFixed(2)} ج.م. ينقصك ${(calculatedCostEGP - user.balance).toFixed(2)} ج.م. يرجى الشحن أولاً.`,
      });
      return;
    }

    setIsSubmitting(true);
    setOrderFeedback(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceId: activeOrderService.id,
          link: playerUidOrLink.trim(),
          quantity: Number(orderQuantity),
        }),
      });

      const data = await parseResponseJson<{ error?: string; newBalance?: number; order?: Order }>(res, {});

      if (!res.ok) {
        setOrderFeedback({ type: 'error', message: data.error || 'فشل إرسال الطلب' });
      } else {
        updateBalanceLocally(data.newBalance ?? user.balance - calculatedCostEGP);
        if (data.order) {
          persistOrderToFirestore(data.order).catch((err) =>
            console.warn('[Firestore] Order sync fallback:', err)
          );
        }
        setOrderFeedback({
          type: 'success',
          message: isPackageItem
            ? `تم شحن الباقة بنجاح لمعرّف اللاعب (${playerUidOrLink}) برقم (#${data.order?.orderNumber}) وخصم ${calculatedCostEGP.toFixed(2)} ج.م!`
            : `تم تنفيذ الطلب بنجاح برقم (#${data.order?.orderNumber}) وخصم ${calculatedCostEGP.toFixed(2)} ج.م فورياً!`,
        });
        setPlayerUidOrLink('');
        setTimeout(() => {
          handleCloseOrder();
        }, 2200);
      }
    } catch (err: any) {
      setOrderFeedback({ type: 'error', message: err.message || 'حدث خطأ في الاتصال بالخادم' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeSubOption = activeSubOptions.find((o) => o.id === subTypeFilter) || activeSubOptions[0];

  return (
    <div className="space-y-4 sm:space-y-6 text-right pb-10">

      {/* ========================================================================= */}
      {/* 1. TOP GLOBAL SEARCH BAR                                                  */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl backdrop-blur-md">
        <div className="relative">
          <input
            type="text"
            value={topSearchBar}
            onChange={(e) => setTopSearchBar(e.target.value)}
            placeholder={
              activeCatalogMode === 'gaming'
                ? '🔍 ابحث عن باقات الألعاب (مثل: شدات ببجي، جواهر فري فاير، نقاط فيفا، ماس لودو)...'
                : '🔍 ابحث عن خدمات السوشيال ميديا (مثل: متابعين، مشاهدات، إكسبلور، ريلز)...'
            }
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pr-10 pl-10 py-3 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-inner"
          />
          <Search className="w-5 h-5 text-indigo-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          {topSearchBar && (
            <button
              onClick={() => setTopSearchBar('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 cursor-pointer"
              title="مسح البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {topSearchBar && (
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>
              نتائج البحث عن: <strong className="text-white">"{topSearchBar}"</strong>
            </span>
            <span className="text-emerald-400 font-bold">
              {filteredServices.length} خدمة مطابقة
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. OFFICIAL TOP BANNER & WALLET / PWA ACTION                              */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-gradient-to-l from-indigo-950 via-slate-900 to-cyan-950 border border-indigo-500/30 p-4 sm:p-5 shadow-xl">
        {/* ACTIVE ANNOUNCEMENTS FROM ADMIN */}
        {latestAnnouncement && (
          <div className="rounded-2xl bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-2 border-amber-500/80 p-3.5 sm:p-4 shadow-xl flex items-start gap-3 mb-3 animate-in slide-in-from-top duration-300">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/40">
              <Megaphone className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div className="flex-1 text-right">
              <div className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5">
                <span>إعلان رسمي من إدارة KOUMND:</span>
                <span className="text-white">{latestAnnouncement.title}</span>
              </div>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">{latestAnnouncement.message}</p>
            </div>
          </div>
        )}

        {/* USER BALANCE & TOTAL SPENT DISPLAY */}
        <div className="grid grid-cols-2 gap-3 bg-slate-950/90 rounded-2xl p-3 border border-slate-800 mb-3 shadow">
          <div className="flex items-center justify-between px-2">
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">رصيدي المتاح:</span>
              <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                {user ? user.balance.toFixed(2) : '0.00'} ج.م
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center justify-between px-2 border-r border-slate-800">
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">إجمالي الرصيد المنفق:</span>
              <span className="text-base sm:text-lg font-black text-indigo-400 font-mono">
                {userSpent.toFixed(2)} ج.م
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>العملة الرسمية: الجنيه المصري (EGP / ج.م) • تنفيذ آلي ومباشر على مدار الساعة</span>
            </div>
            <h1 className="text-base sm:text-xl font-black text-white">
              متجر شحن الألعاب الإلكترونية وخدمات السوشيال ميديا
            </h1>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onNavigateToWallet}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <DollarSign className="w-4 h-4" />
              <span>شحن المحفظة (01556266856)</span>
            </button>
            <button
              onClick={onNavigateToOrders}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>طلباتي</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DUAL SECTION SWITCH: 📱 منصات السوشيال ميديا | 🎮 شحن الألعاب الإلكترونية */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl shadow-xl">
        
        {/* SOCIAL MEDIA TAB */}
        <button
          type="button"
          onClick={() => handleSwitchMode('social')}
          className={`py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeCatalogMode === 'social'
              ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/50'
              : 'text-slate-300 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Share2 className="w-4 h-4 text-cyan-300" />
          <span>📱 منصات السوشيال ميديا وتيك توك</span>
        </button>

        {/* GAMING TAB */}
        <button
          type="button"
          onClick={() => handleSwitchMode('gaming')}
          className={`py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeCatalogMode === 'gaming'
              ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 text-white shadow-lg shadow-orange-600/30 ring-2 ring-amber-400/50'
              : 'text-slate-300 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Gamepad2 className="w-4 h-4 text-amber-300" />
          <span>🎮 شحن الألعاب المباشر بالـ ID</span>
        </button>

      </div>

      {/* QUICK USER GUIDE HELPER */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 sm:p-4 text-xs shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0">1</div>
            <div>
              <div className="font-bold text-white text-[11px] sm:text-xs">إيداع الرصيد في محفظتك</div>
              <div className="text-[10px] text-slate-400">محفظة كاش الموحدة 01556266856</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-black flex items-center justify-center shrink-0">2</div>
            <div>
              <div className="font-bold text-white text-[11px] sm:text-xs">اختر الباقة وضع الـ ID أو الرابط</div>
              <div className="text-[10px] text-slate-400">بدون أي كلمة سر، أمان وحماية 100%</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-black flex items-center justify-center shrink-0">3</div>
            <div>
              <div className="font-bold text-white text-[11px] sm:text-xs">تنفيذ فوري وإشعار لهاتفك</div>
              <div className="text-[10px] text-slate-400">متابعة لحظية وتحديث لحالة الطلب</div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CATEGORY CARDS ROW (GAMES OR SOCIAL PLATFORMS)                         */}
      {/* ========================================================================= */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isCurrentCategoryGaming ? 'bg-amber-400' : 'bg-indigo-400'} animate-pulse`} />
            <span>
              {activeCatalogMode === 'gaming'
                ? 'اختر اللعبة المطلوبة لشحن حسابك بالـ ID:'
                : 'اختر منصة التواصل الاجتماعي المطلوبة:'}
            </span>
          </span>
          <span className="text-xs text-indigo-400 font-bold">
            {activeCatalogMode === 'gaming' ? '4 ألعاب معتمدة' : '8 منصات رقمية'}
          </span>
        </div>

        {/* Cards Grid */}
        <div
          className={`grid gap-2 sm:gap-3 ${
            activeCatalogMode === 'gaming'
              ? 'grid-cols-2 sm:grid-cols-4'
              : 'grid-cols-4 sm:grid-cols-4 md:grid-cols-8'
          }`}
        >
          {(activeCatalogMode === 'gaming' ? gamingCategories : socialCategories).map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const style = getCategoryCardStyle(cat.id, isSelected);
            const count = services.filter((s) => s.categoryId === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer relative group text-center active:scale-95 ${style.card}`}
              >
                {/* Active Indicator */}
                {isSelected && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                  </span>
                )}

                {/* Game / Platform Icon */}
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-1.5 shadow transition-transform group-hover:scale-105 ${style.iconBg}`}
                >
                  <PlatformLogo categoryId={cat.id} className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>

                <span className={`text-xs font-black truncate w-full ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                  {style.name}
                </span>

                {style.subName && (
                  <span className="text-[10px] text-amber-300 font-bold truncate w-full mt-0.5">
                    {style.subName}
                  </span>
                )}

                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 ${style.badge}`}>
                  {count} باقة
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. SUB-TABS & FILTERS BAR (CUSTOMIZED FOR GAMES OR SOCIAL)                 */}
      {/* (NO LIKES/FOLLOWERS FOR GAMES!)                                           */}
      {/* ========================================================================= */}
      <div
        className={`bg-slate-900 border-2 rounded-2xl p-3 sm:p-4 shadow-xl space-y-3 ${
          isCurrentCategoryGaming ? 'border-amber-500/50' : 'border-indigo-500/40'
        }`}
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">
              {isCurrentCategoryGaming ? 'شحن لعبة:' : 'قسم خدمات:'}
            </span>
            <span className="font-black text-white text-sm sm:text-base flex items-center gap-1.5">
              <PlatformLogo categoryId={selectedCategory} className="w-5 h-5" />
              <span>{currentCategoryName}</span>
            </span>
          </div>

          <span
            className={`text-[11px] px-2.5 py-0.5 rounded-lg font-bold border ${
              isCurrentCategoryGaming
                ? 'text-amber-300 bg-amber-500/10 border-amber-500/30'
                : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            }`}
          >
            {isCurrentCategoryGaming ? 'شحن فوري بالمعرّف الرسمي (Player ID)' : `${filteredServices.length} خدمة متوفرة`}
          </span>
        </div>

        {/* The Clickable Bar / Dropdown */}
        <div className="relative">
          <label className="block text-[11px] font-bold text-slate-300 mb-1">
            {isCurrentCategoryGaming
              ? `اختر تصنيف باقات ${currentCategoryName}:`
              : `اختر نوع خدمات ${currentCategoryName}:`}
          </label>
          <button
            type="button"
            onClick={() => setIsSubBarOpen(!isSubBarOpen)}
            className={`w-full bg-slate-950 border-2 rounded-xl px-4 py-3 text-xs sm:text-sm text-white flex items-center justify-between shadow-lg cursor-pointer transition-colors ${
              isCurrentCategoryGaming
                ? 'border-amber-500 hover:border-amber-400'
                : 'border-indigo-500 hover:border-indigo-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{activeSubOption.emoji}</span>
              <span className="font-black text-white">{activeSubOption.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isCurrentCategoryGaming ? 'bg-amber-500/20 text-amber-300' : 'bg-indigo-500/20 text-indigo-300'
                }`}
              >
                {subCounts[activeSubOption.id] ?? 0} باقة
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${isSubBarOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Expanded Dropdown Menu */}
          {isSubBarOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-30 bg-slate-950 border-2 border-indigo-500 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-800 animate-in fade-in duration-150">
              {activeSubOptions.map((opt) => {
                const count = subCounts[opt.id] ?? 0;
                const isSelected = subTypeFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSubTypeFilter(opt.id);
                      setIsSubBarOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-right text-xs sm:text-sm flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/30 text-white font-black'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-bold">
                        {count}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Horizontal Sub-Tabs Row (Touch-Safe) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 scroll-touch-safe">
          {activeSubOptions
            .filter((tab) => tab.id === 'all' || (subCounts[tab.id] && subCounts[tab.id] > 0))
            .map((tab) => {
              const isTabActive = subTypeFilter === tab.id;
              const count = subCounts[tab.id] ?? 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSubTypeFilter(tab.id);
                    setIsSubBarOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    isTabActive
                      ? isCurrentCategoryGaming
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-1 ring-amber-400'
                        : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/80'
                  }`}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.shortLabel || tab.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/70 font-mono text-emerald-300 font-bold">
                    {count}
                  </span>
                </button>
              );
            })}
        </div>

        {/* Gaming Notice Banner */}
        {isCurrentCategoryGaming && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>شحن آلي وفوري بالمعرّف ID فقط • بدون كلمة سر</span>
            </span>
            <span className="text-[11px] text-slate-300">
              تسليم مباشر وتلقائي لحسابك داخل اللعبة
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. SERVICES LISTING (CARDS WITH EGP PRICES)                                */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            جاري تحميل كتالوج الخدمات الرقمية وشحن الألعاب...
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 text-xs space-y-2">
            <p className="font-bold text-slate-300">لا توجد خدمات مطابقة لهذا التصنيف حالياً</p>
            <p className="text-[11px]">اختر قسماً آخر مثل "كل الباقات" أو اختر لعبة/منصة أخرى.</p>
          </div>
        ) : (
          filteredServices.map((service) => {
            const isPackage = service.type === 'package' || isCurrentCategoryGaming;
            const isUnavailable = !service.active || service.isAvailable === false;
            return (
              <div
                key={service.id}
                className={`p-3.5 sm:p-5 rounded-2xl bg-slate-900 hover:bg-slate-850 border transition-all shadow-md ${
                  isUnavailable ? 'border-rose-900/50 opacity-90' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5">
                  
                  {/* Service Details with Authentic App/Game Logo */}
                  <div className="flex items-start gap-3 sm:gap-4 flex-1">
                    <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-slate-950/90 border border-slate-800 p-2 shrink-0 flex items-center justify-center shadow-md group-hover:border-slate-700">
                      <ServiceAppLogo serviceName={service.name} categoryId={service.categoryId} className="w-full h-full object-contain" />
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[11px] px-2.5 py-0.5 rounded-lg font-bold border flex items-center gap-1.5 ${
                            isCurrentCategoryGaming
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}
                        >
                          <PlatformLogo categoryId={service.categoryId} className="w-3.5 h-3.5" />
                          <span>{currentCategoryName}</span>
                        </span>

                        <span className="text-[10px] text-slate-500 font-mono">
                          #{service.providerServiceId}
                        </span>

                        {isUnavailable ? (
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-md border border-rose-500/40 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>غير متوفر حالياً ❌</span>
                          </span>
                        ) : service.isAccountSale ? (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/40 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            <span>حساب حقيقي 100% بدون أي تزويد</span>
                          </span>
                        ) : isPackage ? (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/30 font-bold flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            <span>باقة شحن ألعاب</span>
                          </span>
                        ) : (
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/20 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>خدمة فورية ومضمونة</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-white leading-snug">
                        {service.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {service.description}
                      </p>

                      {isUnavailable && (
                        <div className="mt-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-black flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>غير متوفر ومينفعش يطلب</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing in EGP & Order CTA */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-800">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">
                        {service.isAccountSale ? 'سعر الحساب كاملاً' : isPackage ? 'سعر الباقة كاملة' : 'السعر لكل 1,000'}
                      </div>
                      <div className="flex items-baseline gap-2 flex-wrap sm:justify-end">
                        <span className="text-lg sm:text-xl font-black text-amber-400 font-mono">
                          {service.pricePer1000.toFixed(2)} ج.م
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isUnavailable
                          ? 'غير متاح للطلب حالياً'
                          : service.isAccountSale
                          ? 'تسليم فوري ومباشر'
                          : isPackage
                          ? 'شحن فوري بالـ ID'
                          : `الحد الأدنى: ${(service.minQuantity || 1).toLocaleString()}`}
                      </div>
                    </div>

                    {isUnavailable ? (
                      <div className="flex flex-col items-center sm:items-end gap-1">
                        <button
                          disabled
                          className="px-4 py-2.5 rounded-xl text-slate-400 bg-slate-800/80 border border-slate-700/60 font-black text-xs cursor-not-allowed opacity-60 flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5 text-rose-400" />
                          <span>غير متوفر</span>
                        </button>
                        <span className="text-[10px] text-rose-400 font-bold">غير متوفر ومينفعش يطلب</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenOrder(service)}
                        className={`px-4 py-2.5 rounded-xl text-white font-black text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                          service.isAccountSale
                            ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                            : isCurrentCategoryGaming
                            ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                            : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>{service.isAccountSale ? 'شراء الحساب الآن' : isPackage ? 'شحن الباقة الآن' : 'طلب الخدمة'}</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                </div>

                {/* Bottom Metadata */}
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>السرعة: {service.speed}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    {isPackage ? (
                      <span className="text-emerald-400 font-bold">باقة جاهزة للشحن الفوري</span>
                    ) : (
                      <>
                        <span>الحد الأدنى: <strong className="text-slate-200">{service.minQuantity}</strong></span>
                        <span>•</span>
                        <span>الحد الأقصى: <strong className="text-slate-200">{service.maxQuantity.toLocaleString()}</strong></span>
                      </>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 7. MODAL ORDER SHEET (GAMES: PLAYER ID / SOCIAL: LINK)                     */}
      {/* ========================================================================= */}
      {activeOrderService && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl relative text-right p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-black text-sm sm:text-base">
                <ServiceAppLogo serviceName={activeOrderService.name} categoryId={activeOrderService.categoryId} className="w-5 h-5 object-contain shrink-0" />
                <span>
                  {isPackageItem ? 'شحن باقة لعبة: ' : 'شراء خدمة: '}
                  {activeOrderService.name}
                </span>
              </div>
              <button
                onClick={handleCloseOrder}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FINANCIAL TRANSPARENCY NOTICE */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/80 to-slate-950 border border-indigo-500/40 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-indigo-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>تفاصيل الرسوم والشفافية المالية بالجنيه المصري:</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">
                    {isPackageItem ? 'سعر الباقة:' : 'سعر الألف (1K):'}
                  </span>
                  <span className="font-bold text-white font-mono">
                    {activeOrderService.pricePer1000.toFixed(2)} ج.م
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">رسوم التحويل:</span>
                  <span className="font-bold text-emerald-400 font-mono">0.00 ج.م (شامل تماماً)</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 font-mono text-[11px]">
                <span className="text-slate-300">الحد الأدنى للطلب:</span>
                <span className="text-amber-400 font-bold">
                  {isPackageItem ? 'باقة واحدة (1)' : `${(activeOrderService.minQuantity || 1).toLocaleString()} عدد`}
                </span>
              </div>
            </div>

            {/* Feedback alert */}
            {orderFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  orderFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {orderFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                )}
                <div className="leading-relaxed font-medium">{orderFeedback.message}</div>
              </div>
            )}

            <form onSubmit={handleSubmitOrder} className="space-y-4">
              
              {/* TARGET INPUT: STRICT PLAYER ID FOR GAMES, URL FOR SOCIAL, CONTACT FOR ACCOUNTS */}
              {activeOrderService.isAccountSale ? (
                <div>
                  <label className="block text-xs font-black text-emerald-300 mb-1.5 flex items-center gap-1.5">
                    <span>رقم هاتفك (واتساب) أو بريدك لتسليم بيانات الحساب فورياً:</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={playerUidOrLink}
                    onChange={(e) => setPlayerUidOrLink(e.target.value)}
                    placeholder="اكتب رقم هاتفك أو بريدك (مثال: 01556266856 أو yourname@gmail.com)"
                    className="w-full bg-slate-800 border-2 border-emerald-500 rounded-xl px-4 py-3 text-base text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono text-left tracking-wider"
                    dir="ltr"
                  />
                  <p className="text-[11px] text-emerald-300/90 mt-1">
                    🛡️ حساب حقيقي 100% بدون أي تزويد، يتم تسليم بيانات الدخول كاملة وتغيير البريد والرقم فورياً.
                  </p>
                </div>
              ) : isPackageItem ? (
                <div>
                  <label className="block text-xs font-black text-amber-300 mb-1.5 flex items-center gap-1.5">
                    <span>الآيدي في اللعبة (Player ID / UID):</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={playerUidOrLink}
                    onChange={(e) => setPlayerUidOrLink(e.target.value)}
                    placeholder="اكتب الآيدي الخاص بك في اللعبة (مثال: 5123984712)"
                    className="w-full bg-slate-800 border-2 border-amber-500 rounded-xl px-4 py-3 text-base text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono text-left tracking-wider"
                    dir="ltr"
                  />
                  <p className="text-[11px] text-amber-300/90 mt-1">
                    ⚡ الشحن فوري ومباشر بالآيدي ID فقط وبدون كلمة سر نهائياً.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    رابط الحساب أو المنشور المطلوب:
                  </label>
                  <input
                    type="url"
                    required
                    value={playerUidOrLink}
                    onChange={(e) => setPlayerUidOrLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-left"
                    dir="ltr"
                  />
                </div>
              )}

              {/* FOR GAMES: NO QUANTITY SELECTOR (FIXED PACKAGE). FOR SOCIAL: QUANTITY STEPPER */}
              {isPackageItem ? (
                <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-amber-500/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">الباقة المحددة للشحن:</span>
                    <span className="text-white font-bold">{activeOrderService.name}</span>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-base font-black text-amber-400">
                      {activeOrderService.pricePer1000.toFixed(2)} ج.م
                    </span>
                    <span className="text-[10px] text-emerald-400 block">شحن فوري بالـ ID</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-300">الكمية المطلوبة:</label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      بين {activeOrderService.minQuantity} و {activeOrderService.maxQuantity.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={activeOrderService.minQuantity}
                    max={activeOrderService.maxQuantity}
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono text-center"
                  />

                  {/* Stepper buttons */}
                  <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none scroll-touch-safe">
                    {[
                      { label: 'الحد الأدنى', val: activeOrderService.minQuantity },
                      { label: '+500', add: 500 },
                      { label: '+1,000', add: 1000 },
                      { label: '+5,000', add: 5000 },
                      { label: 'الحد الأقصى', val: activeOrderService.maxQuantity },
                    ].map((btn, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (btn.val !== undefined) setOrderQuantity(btn.val);
                          else if (btn.add !== undefined) {
                            setOrderQuantity((prev) =>
                              Math.min(activeOrderService.maxQuantity, (prev || 0) + btn.add!)
                            );
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-[10px] text-slate-300 hover:text-white font-mono shrink-0 cursor-pointer"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Cost Breakdown */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold">المبلغ النهائي المطلوب خصمه:</span>
                  <div className="text-left font-mono">
                    <span className="text-xl font-black text-amber-400">
                      {calculatedCostEGP.toFixed(2)} ج.م
                    </span>
                    <span className="text-[10px] text-emerald-400 block">
                      (سعر نهائي شامل بدون رسوم)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-indigo-900/60">
                  <span className="text-slate-400">رصيدك الحالي في المحفظة:</span>
                  <span
                    className={`font-bold font-mono ${
                      user && user.balance < calculatedCostEGP ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {user ? user.balance.toFixed(2) : '0.00'} ج.م
                  </span>
                </div>

                {user && user.balance < calculatedCostEGP && (
                  <div className="text-[11px] text-rose-300 flex items-center justify-between pt-1">
                    <span>الرصيد لا يكفي. ينقصك {(calculatedCostEGP - user.balance).toFixed(2)} ج.م</span>
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseOrder();
                        onNavigateToWallet();
                      }}
                      className="underline font-bold text-white hover:text-emerald-300 cursor-pointer"
                    >
                      شحن الرصيد الآن
                    </button>
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting || !user || (user && user.balance < calculatedCostEGP) || (!isPackageItem && Number(orderQuantity) < (activeOrderService.minQuantity || 1))}
                className={`w-full py-3 rounded-xl text-white font-black text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                  isPackageItem
                    ? 'bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 hover:from-amber-500 hover:to-orange-400 shadow-amber-600/30'
                    : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 shadow-indigo-600/30'
                }`}
              >
                {isSubmitting ? (
                  <span>جاري خصم الرصيد وشحن الحساب فوراً...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {isPackageItem ? 'تأكيد وشحن الباقة فوراً (' : 'تأكيد وشراء الطلب فوراً ('}
                      {calculatedCostEGP.toFixed(2)} ج.م)
                    </span>
                  </>
                )}
              </button>

            </form>
          </div>
        </div>
      )}
      {/* CUSTOM SERVICES BANNER (VIDEO DESIGN & SOCIAL ACCOUNTS) - PLACED AT THE VERY BOTTOM */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/90 rounded-3xl p-6 border-2 border-amber-500/50 shadow-xl mt-8">
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
              مونتاج احترافي وتصميمات وإدارة أموال وشراء وبيع حسابات • للتواصل المباشر مع إدارة KOUMND عبر الواتساب أو الهاتف:{' '}
              <a href="tel:01556266856" className="text-amber-400 font-mono font-bold hover:underline" dir="ltr">
                01556266856
              </a>
            </p>
          </div>
        </div>

        <a
          href="https://wa.me/201556266856"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95"
        >
          <span>واتساب: 01556266856</span>
        </a>
      </div>

    </div>
  );
};
