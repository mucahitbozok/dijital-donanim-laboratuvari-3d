export interface CategoryTheme {
  id: string;
  name: string;
  textColor: string;
  badgeBg: string;
  badgeBorder: string;
  activeCardBorder: string;
  activeCardGlow: string;
  iconBg: string;
  hex: string;
}

export const getCategoryTheme = (category: string) => {
  switch (category) {
    case 'İşlem':
      return {
        textColor: 'text-amber-400',
        badgeBg: 'bg-amber-500/15',
        badgeBorder: 'border-amber-500/30',
        activeCardBorder: 'border-amber-400',
        activeCardGlow: 'rgba(245, 158, 11, 0.35)',
        activeCardBg: 'from-amber-500/20 to-zinc-900/90',
        pillActive: 'bg-amber-500 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]',
        iconBg: 'bg-amber-500/20 text-amber-400',
        hex: '#f59e0b'
      };
    case 'Bellek':
      return {
        textColor: 'text-purple-400',
        badgeBg: 'bg-purple-500/15',
        badgeBorder: 'border-purple-500/30',
        activeCardBorder: 'border-purple-400',
        activeCardGlow: 'rgba(168, 85, 247, 0.35)',
        activeCardBg: 'from-purple-500/20 to-zinc-900/90',
        pillActive: 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]',
        iconBg: 'bg-purple-500/20 text-purple-400',
        hex: '#a855f7'
      };
    case 'Görüntü':
      return {
        textColor: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/15',
        badgeBorder: 'border-emerald-500/30',
        activeCardBorder: 'border-emerald-400',
        activeCardGlow: 'rgba(16, 185, 129, 0.35)',
        activeCardBg: 'from-emerald-500/20 to-zinc-900/90',
        pillActive: 'bg-emerald-500 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]',
        iconBg: 'bg-emerald-500/20 text-emerald-400',
        hex: '#10b981'
      };
    case 'Depolama':
      return {
        textColor: 'text-cyan-400',
        badgeBg: 'bg-cyan-500/15',
        badgeBorder: 'border-cyan-500/30',
        activeCardBorder: 'border-cyan-400',
        activeCardGlow: 'rgba(6, 182, 212, 0.35)',
        activeCardBg: 'from-cyan-500/20 to-zinc-900/90',
        pillActive: 'bg-cyan-500 text-zinc-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]',
        iconBg: 'bg-cyan-500/20 text-cyan-400',
        hex: '#06b6d4'
      };
    case 'Ana Donanım':
      return {
        textColor: 'text-indigo-400',
        badgeBg: 'bg-indigo-500/15',
        badgeBorder: 'border-indigo-500/30',
        activeCardBorder: 'border-indigo-400',
        activeCardGlow: 'rgba(99, 102, 241, 0.35)',
        activeCardBg: 'from-indigo-500/20 to-zinc-900/90',
        pillActive: 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]',
        iconBg: 'bg-indigo-500/20 text-indigo-400',
        hex: '#6366f1'
      };
    case 'Güç':
      return {
        textColor: 'text-yellow-400',
        badgeBg: 'bg-yellow-500/15',
        badgeBorder: 'border-yellow-500/30',
        activeCardBorder: 'border-yellow-400',
        activeCardGlow: 'rgba(234, 179, 8, 0.35)',
        activeCardBg: 'from-yellow-500/20 to-zinc-900/90',
        pillActive: 'bg-yellow-400 text-zinc-950 shadow-[0_0_15px_rgba(234,179,8,0.4)]',
        iconBg: 'bg-yellow-500/20 text-yellow-400',
        hex: '#eab308'
      };
    case 'Soğutma':
      return {
        textColor: 'text-sky-400',
        badgeBg: 'bg-sky-500/15',
        badgeBorder: 'border-sky-500/30',
        activeCardBorder: 'border-sky-400',
        activeCardGlow: 'rgba(56, 189, 248, 0.35)',
        activeCardBg: 'from-sky-500/20 to-zinc-900/90',
        pillActive: 'bg-sky-400 text-zinc-950 shadow-[0_0_15px_rgba(56,189,248,0.4)]',
        iconBg: 'bg-sky-500/20 text-sky-400',
        hex: '#38bdf8'
      };
    case 'Giriş':
    case 'Giriş Birimi':
    case 'Giriş Birimleri':
      return {
        textColor: 'text-rose-400',
        badgeBg: 'bg-rose-500/15',
        badgeBorder: 'border-rose-500/30',
        activeCardBorder: 'border-rose-400',
        activeCardGlow: 'rgba(244, 63, 94, 0.35)',
        activeCardBg: 'from-rose-500/20 to-zinc-900/90',
        pillActive: 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]',
        iconBg: 'bg-rose-500/20 text-rose-400',
        hex: '#f43f5e'
      };
    case 'Çıkış':
    case 'Çıkış Birimi':
    case 'Çıkış Birimleri':
      return {
        textColor: 'text-fuchsia-400',
        badgeBg: 'bg-fuchsia-500/15',
        badgeBorder: 'border-fuchsia-500/30',
        activeCardBorder: 'border-fuchsia-400',
        activeCardGlow: 'rgba(217, 70, 239, 0.35)',
        activeCardBg: 'from-fuchsia-500/20 to-zinc-900/90',
        pillActive: 'bg-fuchsia-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]',
        iconBg: 'bg-fuchsia-500/20 text-fuchsia-400',
        hex: '#d946ef'
      };
    case 'Giriş/Çıkış':
    case 'Hem Giriş Hem Çıkış Birimi':
    case 'Hem Giriş Hem Çıkış Birimleri':
    case 'Hem Giriş Hem Çıkış':
      return {
        textColor: 'text-violet-400',
        badgeBg: 'bg-violet-500/15',
        badgeBorder: 'border-violet-500/30',
        activeCardBorder: 'border-violet-400',
        activeCardGlow: 'rgba(139, 92, 246, 0.35)',
        activeCardBg: 'from-violet-500/20 to-zinc-900/90',
        pillActive: 'bg-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]',
        iconBg: 'bg-violet-500/20 text-violet-400',
        hex: '#8b5cf6'
      };
    case 'Ağ':
      return {
        textColor: 'text-teal-400',
        badgeBg: 'bg-teal-500/15',
        badgeBorder: 'border-teal-500/30',
        activeCardBorder: 'border-teal-400',
        activeCardGlow: 'rgba(20, 184, 166, 0.35)',
        activeCardBg: 'from-teal-500/20 to-zinc-900/90',
        pillActive: 'bg-teal-500 text-zinc-950 shadow-[0_0_15px_rgba(20,184,166,0.4)]',
        iconBg: 'bg-teal-500/20 text-teal-400',
        hex: '#14b8a6'
      };
    default:
      return {
        textColor: 'text-slate-300',
        badgeBg: 'bg-slate-500/15',
        badgeBorder: 'border-slate-500/30',
        activeCardBorder: 'border-slate-300',
        activeCardGlow: 'rgba(148, 163, 184, 0.35)',
        activeCardBg: 'from-slate-500/20 to-zinc-900/90',
        pillActive: 'bg-slate-200 text-zinc-950 shadow-[0_0_15px_rgba(255,255,255,0.4)]',
        iconBg: 'bg-slate-500/20 text-slate-300',
        hex: '#94a3b8'
      };
  }
};
