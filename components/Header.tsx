
import React from 'react';
import { Cpu, Settings } from 'lucide-react';
import { Language } from '../types';

interface HeaderProps {
  lang: Language;
  onLanguageChange: (l: Language) => void;
  onOpenSettings: () => void;
}

const headerTranslations = {
  ar: {
    title: "MedScan",
    badge: "PLATINUM",
    dev: "O. FERJANI",
    drName: "د. أسامة",
    role: "رئيس التشخيص"
  },
  en: {
    title: "MedScan",
    badge: "PLATINUM",
    dev: "O. FERJANI",
    drName: "Dr. Oussama",
    role: "Diagnostic Head"
  },
  fr: {
    title: "MedScan",
    badge: "PLATINUM",
    dev: "O. FERJANI",
    drName: "Dr. Oussama",
    role: "Chef Diagnostic"
  }
};

const Header: React.FC<HeaderProps> = ({ lang, onLanguageChange, onOpenSettings }) => {
  const isRtl = lang === 'ar';
  const t = headerTranslations[lang];

  return (
    <header className="bg-[#0f172a] border-b border-slate-800 sticky top-0 z-[100] h-16 md:h-20 flex items-center shadow-2xl no-print">
      <div className={`container mx-auto px-4 md:px-6 flex ${isRtl ? 'flex-row' : 'flex-row-reverse'} justify-between items-center`}>
        <div className={`flex items-center gap-3 md:gap-6 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="bg-indigo-600 p-2 md:p-2.5 rounded-lg md:rounded-xl shadow-lg shadow-indigo-500/20">
              <Cpu className="w-4 h-4 md:w-6 md:h-6 text-white" />
            </div>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <h1 className="text-base md:text-xl font-black text-white tracking-tight flex items-center gap-1.5 md:gap-2">
                {t.title} <span className="bg-indigo-600 px-1.5 py-0.5 rounded text-[8px] md:text-[10px]">{t.badge}</span>
              </h1>
              <div className="hidden sm:block text-[8px] font-bold uppercase tracking-widest text-slate-500">
                {t.dev}
              </div>
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-2 md:gap-8 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
          <button 
            onClick={onOpenSettings}
            className="p-2 md:p-3 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg md:rounded-xl border border-slate-700 transition-all"
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
            {(['ar', 'en', 'fr'] as Language[]).map((l) => (
              <button 
                key={l}
                onClick={() => onLanguageChange(l)}
                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg text-[8px] md:text-[10px] font-black transition-all ${lang === l ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          
          <div className={`flex items-center gap-2 md:gap-3 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
             <div className={`${isRtl ? 'text-right' : 'text-left'} hidden lg:block`}>
              <div className="text-[10px] md:text-xs font-black text-white">{t.drName}</div>
              <div className="text-[8px] md:text-[10px] font-bold text-indigo-400 uppercase">{t.role}</div>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl border-2 border-indigo-500/30 overflow-hidden">
              <img src={`https://ui-avatars.com/api/?name=${t.drName}&background=4f46e5&color=fff&bold=true`} alt="Avatar" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
