import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, BarChart2, ChevronDown, Inbox, LayoutDashboard, Moon, MoreHorizontal, PenLine, RefreshCw, Send, Settings, Shield, Sun, UserRoundCog, Users, Database } from 'lucide-react';
import { cls } from '../lib/format';
import { getLocaleShortLabel, getRuntimeLocale, localeText, toggleLocale, type AppLocale } from '../lib/locale';
import type { Statistics } from '../types/api';
import { HeroOrbitLogo } from './BrandIcons';

export type MenuKey = 'dashboard' | 'stats' | 'address' | 'users' | 'inbox' | 'sent' | 'unknown' | 'compose' | 'settings' | 'maintenance';

const menuGroups: Array<Array<{ key: MenuKey; label: string; icon: React.ComponentType<{ size?: number | string; className?: string }> }>> = [
  [
    { key: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
    { key: 'stats', label: '统计', icon: BarChart2 },
    { key: 'address', label: '地址管理', icon: Users },
    { key: 'users', label: '用户管理', icon: UserRoundCog },
  ],
  [
    { key: 'inbox', label: '收件箱', icon: Inbox },
    { key: 'sent', label: '发件箱', icon: Send },
    { key: 'unknown', label: '未知邮件', icon: AlertCircle },
    { key: 'compose', label: '写邮件', icon: PenLine },
  ],
  [
    { key: 'settings', label: '系统设置', icon: Settings },
    { key: 'maintenance', label: '维护', icon: Database },
  ],
];

const flatMenuItems = menuGroups.flat();

const menuLabelsEn: Partial<Record<MenuKey, string>> = {
  dashboard: 'Dashboard',
  stats: 'Stats',
  address: 'Addresses',
  users: 'Users',
  inbox: 'Inbox',
  sent: 'Sent',
  unknown: 'Unknown',
  compose: 'Compose',
  settings: 'Settings',
  maintenance: 'Maintenance',
};

function menuLabel(item: { key: MenuKey; label: string }, locale: AppLocale) {
  return locale === 'en-US' ? menuLabelsEn[item.key] || item.label : item.label;
}

function localeToggleTitle(locale: AppLocale) {
  return locale === 'en-US' ? 'Switch to Chinese' : 'Switch to English';
}

function getApiHostLabel(apiBase?: string, locale: AppLocale = 'zh-CN') {
  if (!apiBase) return localeText('同源 Worker', 'Same-origin Worker', locale);
  try {
    return new URL(apiBase).hostname || localeText('自定义 API', 'Custom API', locale);
  } catch {
    return apiBase.replace(/^https?:\/\//, '').replace(/\/$/, '') || localeText('自定义 API', 'Custom API', locale);
  }
}

function getProfileInitial(apiBase?: string) {
  const host = getApiHostLabel(apiBase);
  const match = host.match(/[a-z0-9]/i);
  return match ? match[0].toUpperCase() : 'A';
}

function BrandGlyph({ className = 'h-7 w-7' }: { className?: string }) {
  return <HeroOrbitLogo className={cls('logo-mark logo-sigil', className)} />;
}

export function Logo() {
  return (
    <div className="logo-tile flex h-10 w-10 items-center justify-center" aria-hidden="true">
      <BrandGlyph />
    </div>
  );
}

export function Sidebar({ activeMenu, setActiveMenu, stats, theme, setTheme, locale, setLocale, refresh, apiBase, connected, children }: {
  activeMenu: MenuKey;
  setActiveMenu: (menu: MenuKey) => void;
  stats: Statistics;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  refresh: () => void;
  apiBase?: string;
  connected?: boolean;
  children?: React.ReactNode;
}) {
  const hostLabel = getApiHostLabel(apiBase, locale);
  const profileInitial = getProfileInitial(apiBase);
  return (
    <aside className="hidden h-full w-[272px] shrink-0 flex-col border-r border-slate-100 bg-[#F8FAFC] md:flex xl:w-[288px]">
      <div className="flex items-center gap-3 px-6 py-8"><Logo /><div><h1 className="brand-wordmark text-xl font-semibold text-slate-950">Loven7-Mail</h1><p className="text-xs text-slate-400">{locale === 'en-US' ? 'Cloudflare temp mail admin' : 'Cloudflare 临时邮箱后台'}</p></div></div>
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-2">
        {menuGroups.map((group, groupIndex) => <div className="space-y-1" key={groupIndex}>{group.map((item) => {
          const Icon = item.icon;
          const badge = item.key === 'inbox' ? stats.mailCount : item.key === 'sent' ? stats.sendMailCount : undefined;
          return <button key={item.key} onClick={() => setActiveMenu(item.key)} className={cls('sidebar-nav-item flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left', activeMenu === item.key ? 'sidebar-nav-active' : 'text-slate-600 hover:bg-white hover:text-slate-900')}><span className="flex min-w-0 items-center gap-3"><Icon size={20} className="shrink-0" /> <span className="truncate">{menuLabel(item, locale)}</span></span><span className="sidebar-badge-slot">{typeof badge === 'number' && badge > 0 && <span className="sidebar-badge rounded-full px-2.5 py-0.5 text-xs font-medium">{badge}</span>}</span></button>;
        })}</div>)}
      </div>
      <div className="p-4">
        <button onClick={() => setActiveMenu('compose')} className="sidebar-compose-btn mb-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-medium transition"><PenLine size={18} /> {locale === 'en-US' ? 'Compose' : '写邮件'}</button>
        <div className="rounded-2xl bg-white p-3 shadow-sm">
          <div className="admin-profile-row flex items-center gap-3">
            <div className={cls('admin-profile-avatar flex h-10 w-10 items-center justify-center rounded-full font-semibold', connected ? 'is-connected' : 'is-disconnected')}>{profileInitial}</div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800">{locale === 'en-US' ? 'Admin' : '管理员'}</p>
              <p className="admin-profile-status truncate text-[11px] text-slate-400">{connected ? (locale === 'en-US' ? 'Connected' : '已连接') : (locale === 'en-US' ? 'Offline' : '未连接')} · {hostLabel}</p>
            </div>
            <ChevronDown size={16} className="ml-auto text-slate-400" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <button onClick={refresh} className="sidebar-mini-btn" title={locale === 'en-US' ? 'Refresh' : '刷新'}><RefreshCw size={15} />{locale === 'en-US' ? 'Refresh' : '刷新'}</button>
            <button onClick={() => setActiveMenu('settings')} className="sidebar-mini-btn" title={locale === 'en-US' ? 'Settings' : '系统设置'}><Settings size={15} />{locale === 'en-US' ? 'Settings' : '设置'}</button>
            {children}
          </div>
          <div className="mt-3 flex rounded-xl bg-slate-100 p-1"><button onClick={() => setTheme('light')} className={cls('flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm', theme === 'light' ? 'bg-white font-medium shadow-sm' : 'text-slate-500')}><Sun size={16} /> {locale === 'en-US' ? 'Light' : '浅色'}</button><button onClick={() => setTheme('dark')} className={cls('flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm', theme === 'dark' ? 'bg-white font-medium shadow-sm' : 'text-slate-500')}><Moon size={16} /> {locale === 'en-US' ? 'Dark' : '深色'}</button></div>
          <button type="button" className="locale-mode-toggle mt-2 w-full" title={localeToggleTitle(locale)} onClick={() => setLocale(toggleLocale(locale))}>
            <span>{locale === 'en-US' ? 'Language' : '界面语言'}</span>
            <strong>{locale === 'en-US' ? 'English' : '中文'}</strong>
            <em>{getLocaleShortLabel(toggleLocale(locale))}</em>
          </button>
        </div>
      </div>
    </aside>
  );
}

export function Header({ activeMenu, apiBase, locale, setLocale, children }: {
  activeMenu: MenuKey; setActiveMenu: (menu: MenuKey) => void; query: string; setQuery: (query: string) => void; refresh: () => void; apiBase: string; locale: AppLocale; setLocale: (locale: AppLocale) => void; children?: React.ReactNode;
}) {
  const titleMap: Record<MenuKey, string> = { dashboard: '仪表盘', stats: '统计', address: '地址管理', users: '用户管理', inbox: '收件箱', sent: '发件箱', unknown: '未知邮件', compose: '写邮件', settings: '系统设置', maintenance: '维护' };
  const activeLabel = locale === 'en-US' ? menuLabelsEn[activeMenu] || titleMap[activeMenu] : titleMap[activeMenu];
  return (
    <div className="mobile-header flex h-12 w-full items-center justify-between px-3 md:hidden">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="mobile-logo-tile flex h-8 w-8 shrink-0 items-center justify-center" aria-hidden="true"><BrandGlyph className="h-[24px] w-[24px]" /></div>
        <div className="min-w-0">
          <span className="brand-wordmark block truncate text-[15px] font-semibold leading-4 text-slate-950">Loven7-Mail</span>
          <span className="block truncate text-[10px] leading-4 text-slate-400">{activeLabel} · {apiBase || (locale === 'en-US' ? 'Same-origin Worker' : '同源 Worker')}</span>
        </div>
      </div>
      <div className="mobile-credential-slot flex shrink-0 items-center gap-1.5">
        <button type="button" className="mobile-locale-toggle" aria-label={localeToggleTitle(locale)} onClick={() => setLocale(toggleLocale(locale))}>{getLocaleShortLabel(locale)}</button>
        {children}
      </div>
    </div>
  );
}

export function MobileNav({ activeMenu, setActiveMenu, locale }: { activeMenu: MenuKey; setActiveMenu: (menu: MenuKey) => void; locale: AppLocale }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);
  const primaryItems = useMemo<Array<{ key: MenuKey; label: string; icon: React.ComponentType<{ size?: number | string; className?: string }> }>>(() => [
    { key: 'stats', label: '统计', icon: BarChart2 },
    { key: 'address', label: '地址', icon: Users },
    { key: 'inbox', label: '收件箱', icon: Inbox },
    { key: 'sent', label: '发件箱', icon: Send },
  ], []);
  const moreItems = useMemo(() => flatMenuItems.filter((item) => !primaryItems.some((primary) => primary.key === item.key)), [primaryItems]);
  const isMoreActive = moreOpen || !primaryItems.some((item) => item.key === activeMenu);

  useEffect(() => {
    if (!moreOpen) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setMoreOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [moreOpen]);

  const choose = (menu: MenuKey) => {
    setActiveMenu(menu);
    setMoreOpen(false);
  };

  return (
    <nav ref={rootRef} className="mobile-nav fixed bottom-0 left-0 right-0 z-[80] flex h-[calc(62px+env(safe-area-inset-bottom))] items-center justify-around border-t px-2 pb-safe md:hidden" aria-label={locale === 'en-US' ? 'Mobile navigation' : '移动端主导航'}>
      {primaryItems.map((item) => {
        const Icon = item.icon;
        const active = activeMenu === item.key;
        return <button key={item.key} onClick={() => choose(item.key)} className={cls('mobile-nav-item flex w-14 flex-col items-center gap-0.5', active && 'active')}><Icon size={21} /><span className="text-[10px] font-medium">{menuLabel(item, locale)}</span></button>;
      })}
      <button type="button" onClick={() => setMoreOpen((current) => !current)} className={cls('mobile-nav-item flex w-14 flex-col items-center gap-0.5', isMoreActive && 'active')} aria-haspopup="menu" aria-expanded={moreOpen}>
        <MoreHorizontal size={21} />
        <span className="text-[10px] font-medium">{locale === 'en-US' ? 'More' : '更多'}</span>
      </button>
      {moreOpen && (
        <div className="mobile-more-menu" role="menu" aria-label={locale === 'en-US' ? 'More pages' : '更多页面'}>
          {moreItems.map((item) => {
            const Icon = item.icon;
            const active = activeMenu === item.key;
            return (
              <button key={item.key} type="button" role="menuitem" className={cls('mobile-more-item', active && 'active')} onClick={() => choose(item.key)}>
                <Icon size={17} />
                <span>{menuLabel(item, locale)}</span>
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}


export function CredentialButton({ onClick }: { onClick: () => void }) {
  const locale = getRuntimeLocale();
  return <button onClick={onClick} className="sidebar-mini-btn credential-button" aria-label={localeText('凭据设置', 'Credential settings', locale)}><Shield size={15} /><span className="credential-button-label">{localeText('凭据', 'Auth', locale)}</span></button>;
}
