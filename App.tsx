
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import DiagnosisReport from './components/DiagnosisReport';
import { analyzeMedicalCase } from './services/geminiService';
import { MedicalImage, DiagnosisResult, AnalysisStatus, PatientBio, Language, ArchivedReport, AppSettings } from './types';
import { 
  Monitor, Zap, Plus, X, 
  RefreshCw,
  AlertTriangle,
  BrainCircuit, UserCheck, Search, Database, 
  CalendarDays, LayoutDashboard, Microscope, ShieldAlert,
  Sliders, Eye, Box, Scale,
  Volume2, Lock, Shield, Layout, Settings2, FileText, CheckSquare, Brain, Stethoscope,
  ClipboardCheck, ScanEye, MousePointer2, Grid3X3, Layers, Gauge
} from 'lucide-react';

const ARCHIVE_KEY = 'medscan_archive_v7';
const SETTINGS_KEY = 'medscan_settings_v1';

const DEFAULT_SETTINGS: AppSettings = {
  analysisMode: 'balanced', // Default to balanced for speed/quality
  depth: 'deep_clinical',
  focus: 'general',
  aiCreativity: 0.1,
  confidenceThreshold: 0.85,
  thinkingBudget: 8192, // Reduced default from 15000 to improve latency
  secondaryOpinion: true,
  standard: 'standard',
  enabledSections: { findings: true, roadmap: true, expertBoard: true, risks: true, differential: true, icd10: true },
  theme: 'dark-clinical',
  layout: 'modern_platinum',
  fontSize: 'medium',
  autoSave: true,
  autoNarrate: false,
  enableImageTools: true,
  defaultOverlay: true,
  enableMagnifier: true,
  enableGridOverlay: true,
  enableAdvancedFilters: true,
  privacyMode: false
};

const translations = {
  ar: {
    workstation: "محطة العمل",
    archive: "الأرشيف العالمي",
    newScan: "فحص جديد",
    patientDetails: "سجل المريض",
    clinicalInfo: "الملاحظات السريرية",
    startAnalysis: "بدء التحليل",
    analyzing: "جاري المعالجة...",
    uploadScan: "رفع العينة",
    existingId: "مريض سابق",
    newId: "ID آلي",
    errorMedical: "خطأ في توافق الصور.",
    noImages: "يرجى إرفاق صور أولاً.",
    success: "اكتمل التحليل",
    quotaError: "تنبيه: تم تنظيف الأرشيف.",
    settingsTitle: "التحكم المتقدم",
    intelligence: "الذكاء",
    clinical: "السريري",
    interface: "الواجهة",
    privacy: "الأمان",
    depth: "عمق التحليل",
    focus: "التخصص",
    theme: "المظهر",
    layout: "تنسيق التقرير",
    saveSettings: "حفظ الإعدادات",
    confidence: "عتبة الثقة",
    creativity: "المرونة",
    autoSave: "حفظ تلقائي",
    autoNarrate: "قراءة آلية",
    thinking: "التفكير العصبي",
    opinion: "المراجعة الثانوية",
    standard: "المعيار الطبي",
    sections: "أقسام التقرير",
    fontSize: "حجم الخط",
    privacyMode: "التشفير المجهول",
    privacyDesc: "إخفاء بيانات المريض لضمان الخصوصية القصوى.",
    firstName: "الاسم الأول",
    lastName: "اسم العائلة",
    dob: "تاريخ الميلاد",
    systemId: "معرف النظام ID",
    notesPlaceholder: "أدخل التاريخ الطبي أو الأعراض هنا...",
    searchPlaceholder: "بحث في الأرشيف...",
    protocolTitle: "البروتوكول السيادي",
    encTitle: "نواة التشفير",
    encDesc: "تشفير عسكري SHA-256 للبيانات.",
    aiCoreActive: "نواة الذكاء نشطة",
    verificationActive: "التحقق نشط",
    sysFault: "خطأ في النواة",
    idTypeLabel: "بروتوكول الهوية",
    newPatientDesc: "تحليل ذكاء اصطناعي سيادي فائق الدقة.",
    enableTools: "أدوات الفحص",
    defaultOverlay: "مؤشرات الضرر التلقائية",
    enableMagnifier: "العدسة المكبرة",
    enableGrid: "شبكة القياس",
    enableFilters: "فلاتر الأنسجة",
    analysisMode: "نمط المعالجة",
    modePrecision: "فائق الدقة (بطيء)",
    modeBalanced: "متوازن (موصى به)",
    modeTurbo: "تيربو (سريع جداً)",
    analysisNote: "ملاحظة: النمط الدقيق قد يستغرق وقتاً أطول لضمان الجودة."
  },
  en: {
    workstation: "Workstation",
    archive: "Global Archive",
    newScan: "New Scan",
    patientDetails: "Patient Record",
    clinicalInfo: "Clinical Notes",
    startAnalysis: "Start Analysis",
    analyzing: "Processing...",
    uploadScan: "Upload Scan",
    existingId: "Existing ID",
    newId: "Auto ID",
    errorMedical: "Image validation error.",
    noImages: "Please upload scans first.",
    success: "Analysis completed",
    quotaError: "System: Archives pruned.",
    settingsTitle: "Advanced Control",
    intelligence: "Intelligence",
    clinical: "Clinical",
    interface: "Interface",
    privacy: "Privacy",
    depth: "Analysis Depth",
    focus: "Specialization",
    theme: "Visual Theme",
    layout: "Report Layout",
    saveSettings: "Save Settings",
    confidence: "Confidence",
    creativity: "Creativity",
    autoSave: "Auto-Save",
    autoNarrate: "Auto-Narrate",
    thinking: "Neural Thinking",
    opinion: "Double-Check",
    standard: "Clinical Standard",
    sections: "Report Sections",
    fontSize: "Font Size",
    privacyMode: "Anonymous Privacy",
    privacyDesc: "Strip personal ID for extreme privacy.",
    firstName: "First Name",
    lastName: "Last Name",
    dob: "Date of Birth",
    systemId: "System ID",
    notesPlaceholder: "Enter clinical history or symptoms...",
    searchPlaceholder: "Search archive...",
    protocolTitle: "Sovereign Protocol",
    encTitle: "Encryption Core",
    encDesc: "Military-grade SHA-256 data protection.",
    aiCoreActive: "Intelligence Core Active",
    verificationActive: "Verification Active",
    sysFault: "Core System Fault",
    idTypeLabel: "ID Protocol",
    newPatientDesc: "Supreme precision sovereign AI analysis.",
    enableTools: "Exam Tools",
    defaultOverlay: "Auto Damage Markers",
    enableMagnifier: "Medical Loupe",
    enableGrid: "Clinical Grid",
    enableFilters: "Tissue Filters",
    analysisMode: "Processing Mode",
    modePrecision: "Precision (Slow)",
    modeBalanced: "Balanced (Rec.)",
    modeTurbo: "Turbo (Fastest)",
    analysisNote: "Note: Precision mode takes longer for deep reasoning."
  },
  fr: {
    workstation: "Poste Clinique",
    archive: "Archives",
    newScan: "Nouvel Examen",
    patientDetails: "Dossier Patient",
    clinicalInfo: "Notes Cliniques",
    startAnalysis: "Lancer l'analyse",
    analyzing: "Traitement...",
    uploadScan: "Charger",
    existingId: "ID Existant",
    newId: "ID Auto",
    errorMedical: "Erreur d'image.",
    noImages: "Veuillez charger des scans.",
    success: "Analyse terminée",
    quotaError: "Système: Archives purgées.",
    settingsTitle: "Contrôle Avancé",
    intelligence: "Intelligence",
    clinical: "Clinique",
    interface: "Interface",
    privacy: "Confidentialité",
    depth: "Profondeur",
    focus: "Spécialité",
    theme: "Thème",
    layout: "Mise en page",
    saveSettings: "Enregistrer",
    confidence: "Confiance",
    creativity: "Créativité",
    autoSave: "Auto-Archive",
    autoNarrate: "Narration Auto",
    thinking: "Raisonnement Neural",
    opinion: "Vérification",
    standard: "Standard Médical",
    sections: "Sections du rapport",
    fontSize: "Police",
    privacyMode: "Mode Anonyme",
    privacyDesc: "Données anonymisées pour la confidentialité.",
    firstName: "Prénom",
    lastName: "Nom",
    dob: "Date de naissance",
    systemId: "ID Système",
    notesPlaceholder: "Notes, historique ou symptômes...",
    searchPlaceholder: "Rechercher...",
    protocolTitle: "Protocole Souverain",
    encTitle: "Noyau de Chiffrement",
    encDesc: "Chiffrement SHA-256 de niveau militaire.",
    aiCoreActive: "Noyau IA Actif",
    verificationActive: "Vérification Active",
    sysFault: "Erreur Système",
    idTypeLabel: "Protocole d'ID",
    newPatientDesc: "Analyse IA souveraine de haute précision.",
    enableTools: "Outils d'examen",
    defaultOverlay: "Marqueurs Auto",
    enableMagnifier: "Loupe Médicale",
    enableGrid: "Grille Clinique",
    enableFilters: "Filtres Tissulaires",
    analysisMode: "Mode Analyse",
    modePrecision: "Précision (Lent)",
    modeBalanced: "Équilibré (Rec.)",
    modeTurbo: "Turbo (Rapide)",
    analysisNote: "Note: Le mode Précision est plus lent."
  }
};

const generateRandomId = () => `MS-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('ar');
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [images, setImages] = useState<MedicalImage[]>([]);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'clinical' | 'ui' | 'privacy'>('ai');
  const [searchQuery, setSearchQuery] = useState("");
  const [idType, setIdType] = useState<'new' | 'existing'>('new');
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch (e) { return DEFAULT_SETTINGS; }
  });

  const [bio, setBio] = useState<PatientBio>({
    patientId: generateRandomId(),
    firstName: "", lastName: "", dob: "", age: 0,
    preExistingConditions: "", clinicalNotes: ""
  });

  const t = translations[lang];
  const isRtl = lang === 'ar';

  useEffect(() => {
    if (bio.dob) {
      const birthDate = new Date(bio.dob);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      setBio(prev => ({ ...prev, age: Math.max(0, age) }));
    }
  }, [bio.dob]);

  useEffect(() => {
    if (idType === 'new') {
      setBio(prev => ({ ...prev, patientId: generateRandomId() }));
    }
  }, [idType]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const saveToArchive = (reportResult: DiagnosisResult) => {
    if (!settings.autoSave) return;
    let archive: ArchivedReport[] = [];
    try { archive = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]'); } catch (e) { archive = []; }
    const newEntry: ArchivedReport = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      patientBio: { ...bio },
      result: reportResult,
      images: images.map(img => ({ ...img }))
    };
    archive.unshift(newEntry);
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archive.slice(0, 50)));
  };

  const getArchivedReports = (): ArchivedReport[] => {
    try {
      const archive: ArchivedReport[] = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]');
      const sorted = archive.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      if (!searchQuery) return sorted;
      const q = searchQuery.toLowerCase();
      return sorted.filter(r => 
        r.patientBio.patientId.toLowerCase().includes(q) || 
        r.patientBio.firstName.toLowerCase().includes(q) || 
        r.patientBio.lastName.toLowerCase().includes(q)
      );
    } catch (e) { return []; }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
          setImages(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            url: reader.result as string,
            base64: (reader.result as string).split(',')[1],
            type: file.type, name: file.name, timestamp: new Date()
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleStartAnalysis = async () => {
    if (images.length === 0) return setError(t.noImages);
    setStatus(AnalysisStatus.PROCESSING);
    setError(null);
    try {
      const res = await analyzeMedicalCase(images, bio, lang, settings);
      setResult(res);
      saveToArchive(res);
      setStatus(AnalysisStatus.COMPLETED);
    } catch (err: any) {
      console.error(err);
      if (err.message === "API_KEY_MISSING") {
         setError(isRtl ? "نظام الرفض: مفتاح API مفقود. يرجى إعداد مفتاح Google Gemini API المجاني." : "System Error: API Key missing. Please configure your free Google Gemini API Key.");
      } else {
         setError(isRtl ? "فشل التحليل: يرجى التحقق من الاتصال أو المحاولة بوضع 'Turbo'." : "Analysis Failed: Please check connection or try 'Turbo' mode.");
      }
      setStatus(AnalysisStatus.ERROR);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#010409] text-slate-300 font-sans ${isRtl ? 'rtl' : 'ltr'} ${settings.theme}`}>
      <Header lang={lang} onLanguageChange={setLang} onOpenSettings={() => setShowSettings(true)} />
      
      <div className={`flex flex-1 overflow-hidden ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Sidebar responsive - Icons only on mobile */}
        <aside className="w-16 md:w-20 lg:w-72 bg-[#0d1117] border-slate-800/50 flex flex-col shrink-0 z-40 transition-all no-print overflow-hidden">
          <div className="p-4 lg:p-6 space-y-10">
            <div className={`flex items-center gap-4 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-inner">
                <LayoutDashboard className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="hidden lg:block">
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Medical Control</h3>
                <p className="text-[8px] font-bold text-slate-500">Clinical OS v7.8</p>
              </div>
            </div>

            <nav className="space-y-4">
              <button onClick={() => { setStatus(AnalysisStatus.IDLE); setShowArchive(false); }} className={`w-full flex items-center gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl transition-all ${!showArchive && status !== AnalysisStatus.COMPLETED ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-500 hover:bg-white/5'} ${isRtl ? 'flex-row' : 'flex-row-reverse'} justify-center lg:justify-start`}>
                <Microscope className="w-5 h-5" />
                <span className="text-xs font-black hidden lg:block">{t.workstation}</span>
              </button>
              <button onClick={() => setShowArchive(true)} className={`w-full flex items-center gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl transition-all ${showArchive ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-500 hover:bg-white/5'} ${isRtl ? 'flex-row' : 'flex-row-reverse'} justify-center lg:justify-start`}>
                <Database className="w-5 h-5" />
                <span className="text-xs font-black hidden lg:block">{t.archive}</span>
              </button>
            </nav>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-[#010409] custom-scrollbar p-4 md:p-6 lg:p-10">
          <div className="max-w-6xl mx-auto space-y-8 md:space-y-12 pb-20">
            {status === AnalysisStatus.COMPLETED && result && !showArchive ? (
              <DiagnosisReport lang={lang} result={result} images={images} bio={bio} settings={settings} onReset={() => setStatus(AnalysisStatus.IDLE)} />
            ) : showArchive ? (
              <div className="animate-in fade-in duration-500 space-y-6 md:space-y-10">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">{t.archive}</h2>
                <div className="relative max-w-md w-full">
                   <input 
                    type="text" 
                    placeholder={t.searchPlaceholder} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 md:py-4 text-xs outline-none text-white focus:border-indigo-500 ${isRtl ? 'text-right' : 'text-left'}`} 
                   />
                   <Search className={`w-4 h-4 text-slate-600 absolute top-3.5 md:top-4 ${isRtl ? 'left-4' : 'right-4'}`} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {getArchivedReports().map(r => (
                    <div key={r.id} onClick={() => { setResult(r.result); setBio(r.patientBio); setImages(r.images); setStatus(AnalysisStatus.COMPLETED); setShowArchive(false); }} className="bg-[#0d1117] p-6 md:p-8 rounded-2xl md:rounded-[3rem] border border-slate-800 hover:border-indigo-500 transition-all cursor-pointer group shadow-xl">
                      <div className="text-[10px] font-black text-indigo-500 mb-2">{r.patientBio.patientId}</div>
                      <div className="text-xl md:text-2xl font-black text-white mb-4 group-hover:text-indigo-400">{r.patientBio.firstName} {r.patientBio.lastName}</div>
                      <div className="flex items-center gap-3 text-[9px] text-slate-500 font-bold uppercase tracking-widest"><CalendarDays className="w-3 h-3" /> {new Date(r.timestamp).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in duration-700 space-y-10 md:space-y-16">
                <section className="bg-[#0d1117] rounded-3xl md:rounded-[4rem] p-6 md:p-10 border border-slate-800/50 shadow-2xl space-y-8 md:space-y-10">
                  <div className={`flex flex-col md:flex-row justify-between items-center gap-6 ${isRtl ? 'md:text-right' : 'md:text-left'} text-center`}>
                    <div>
                      <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tighter">{t.newScan}</h2>
                      <p className="text-slate-500 font-bold text-sm md:text-lg">{t.newPatientDesc}</p>
                    </div>
                    <button onClick={() => document.getElementById('file-upload')?.click()} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl md:rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all shadow-xl group">
                      <Plus className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-90 transition-transform" /> {t.uploadScan}
                      <input id="file-upload" type="file" onChange={handleFileUpload} multiple className="hidden" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-8">
                    {images.map(img => (
                      <div key={img.id} className="aspect-square bg-black rounded-2xl md:rounded-[2.5rem] border-2 border-slate-800 overflow-hidden relative group shadow-2xl">
                        <img src={img.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" />
                        <button onClick={() => setImages(prev => prev.filter(i => i.id !== img.id))} className="absolute top-3 right-3 md:top-5 md:right-5 p-2 md:p-3 bg-rose-600 text-white rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-all"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
                  <div className="lg:col-span-2 bg-[#0d1117] rounded-3xl md:rounded-[4rem] p-6 md:p-12 border border-slate-800/50 space-y-8 md:space-y-12 shadow-2xl">
                    <div className={`flex items-center gap-4 border-b border-slate-800 pb-6 md:pb-8 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                      <UserCheck className="w-6 h-6 md:w-8 md:h-8 text-indigo-500" />
                      <h3 className="text-2xl md:text-3xl font-black text-white">{t.patientDetails}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                       <div className="space-y-3 md:space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{t.firstName}</label>
                          <input type="text" value={bio.firstName} onChange={(e) => setBio({...bio, firstName: e.target.value})} className={`w-full bg-slate-900 border border-slate-800 rounded-xl md:rounded-2xl px-5 md:px-6 py-4 md:py-5 text-white font-bold outline-none focus:border-indigo-600 ${isRtl ? 'text-right' : 'text-left'}`} />
                       </div>
                       <div className="space-y-3 md:space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{t.lastName}</label>
                          <input type="text" value={bio.lastName} onChange={(e) => setBio({...bio, lastName: e.target.value})} className={`w-full bg-slate-900 border border-slate-800 rounded-xl md:rounded-2xl px-5 md:px-6 py-4 md:py-5 text-white font-bold outline-none focus:border-indigo-600 ${isRtl ? 'text-right' : 'text-left'}`} />
                       </div>
                       <div className="space-y-3 md:space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{t.dob}</label>
                          <input type="date" value={bio.dob} onChange={(e) => setBio({...bio, dob: e.target.value})} className={`w-full bg-slate-900 border border-slate-800 rounded-xl md:rounded-2xl px-5 md:px-6 py-4 md:py-5 text-white font-bold outline-none focus:border-indigo-600 ${isRtl ? 'text-right' : 'text-left'}`} />
                       </div>
                       <div className="space-y-3 md:space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{t.idTypeLabel}</label>
                          <div className={`flex bg-slate-900 rounded-xl md:rounded-2xl border border-slate-800 p-1 md:p-1.5 shadow-inner ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                             <button onClick={() => setIdType('new')} className={`flex-1 py-2 md:py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black transition-all ${idType === 'new' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{t.newId}</button>
                             <button onClick={() => setIdType('existing')} className={`flex-1 py-2 md:py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black transition-all ${idType === 'existing' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{t.existingId}</button>
                          </div>
                          <input 
                            type="text" 
                            value={bio.patientId} 
                            readOnly={idType === 'new'} 
                            onChange={(e) => setBio({...bio, patientId: e.target.value})}
                            className={`w-full bg-slate-900 border border-slate-800 rounded-xl md:rounded-2xl px-5 md:px-6 py-4 md:py-5 text-indigo-400 font-black outline-none focus:border-indigo-600 ${isRtl ? 'text-right' : 'text-left'}`} 
                          />
                       </div>
                       <div className="md:col-span-2 space-y-3 md:space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{t.clinicalInfo}</label>
                          <textarea 
                            value={bio.clinicalNotes} 
                            placeholder={t.notesPlaceholder}
                            onChange={(e) => setBio({...bio, clinicalNotes: e.target.value})} 
                            className={`w-full bg-slate-900 border border-slate-800 rounded-2xl md:rounded-[2.5rem] px-6 md:px-8 py-5 md:py-6 text-white font-bold outline-none h-32 md:h-40 resize-none shadow-inner ${isRtl ? 'text-right' : 'text-left'}`} 
                          />
                       </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-8 md:gap-10">
                     <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-3xl md:rounded-[4rem] p-8 md:p-12 text-white shadow-2xl flex-1 flex flex-col justify-between relative overflow-hidden group min-h-[300px]">
                        <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-125 transition-transform duration-1000"><Zap className="w-48 md:w-64 h-48 md:h-64" /></div>
                        <div className="space-y-4 md:space-y-6 relative z-10">
                           <Brain className="w-12 h-12 md:w-16 md:h-16 text-white/40" />
                           <h4 className="text-3xl md:text-4xl font-black leading-tight tracking-tighter">{t.protocolTitle}</h4>
                        </div>
                        <button onClick={handleStartAnalysis} disabled={status === AnalysisStatus.PROCESSING} className="w-full bg-white text-indigo-800 py-5 md:py-7 rounded-xl md:rounded-[2rem] font-black text-xl md:text-2xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 relative z-10 disabled:opacity-50 mt-8">
                          {status === AnalysisStatus.PROCESSING ? <RefreshCw className="w-6 h-6 md:w-8 md:h-8 animate-spin" /> : t.startAnalysis}
                        </button>
                     </div>
                     <div className="bg-[#0d1117] rounded-3xl p-6 md:p-8 border border-slate-800/50 flex items-start gap-4 md:gap-5 shadow-xl">
                        <ShieldAlert className="w-6 h-6 md:w-8 md:h-8 text-emerald-500 shrink-0" />
                        <div className={isRtl ? 'text-right' : 'text-left'}>
                           <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-1 md:mb-2">{t.encTitle}</h5>
                           <p className="text-[10px] md:text-[11px] font-bold text-slate-600 leading-relaxed">{t.encDesc}</p>
                        </div>
                     </div>
                  </div>
                </section>
              </div>
            )}
          </div>
        </main>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-500">
          <div className="bg-[#0d1117] w-full max-w-5xl md:rounded-[5rem] border-2 border-indigo-500/20 shadow-2xl overflow-hidden flex flex-col h-full md:h-auto md:max-h-[90vh]">
            <div className="bg-indigo-600 p-8 md:p-12 flex justify-between items-center relative overflow-hidden shrink-0">
               <div className="flex items-center gap-4 md:gap-6 relative z-10">
                  <div className="bg-white/20 p-3 md:p-4 rounded-2xl md:rounded-3xl"><Sliders className="w-6 h-6 md:w-10 md:h-10 text-white" /></div>
                  <div>
                    <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase">{t.settingsTitle}</h2>
                  </div>
               </div>
               <button onClick={() => setShowSettings(false)} className="p-3 md:p-4 bg-white/10 hover:bg-white/20 rounded-2xl md:rounded-3xl text-white transition-all relative z-10"><X className="w-6 h-6 md:w-8 md:h-8" /></button>
            </div>
            
            <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
               <div className={`w-full md:w-24 lg:w-64 bg-slate-900/50 border-slate-800 p-4 md:p-8 flex md:flex-col gap-2 md:gap-4 overflow-x-auto md:overflow-y-auto ${isRtl ? 'md:border-l' : 'md:border-r'} shrink-0`}>
                  {[
                    { id: 'ai', icon: Brain, label: t.intelligence },
                    { id: 'clinical', icon: FileText, label: t.clinical },
                    { id: 'ui', icon: Layout, label: t.interface },
                    { id: 'privacy', icon: Shield, label: t.privacy }
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-3 md:gap-4 p-3 md:p-5 rounded-xl md:rounded-3xl transition-all shrink-0 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:bg-white/5'} ${isRtl ? 'flex-row' : 'flex-row-reverse'} justify-center lg:justify-start`}>
                      <tab.icon className="w-5 h-5 md:w-6 md:h-6" />
                      <span className="text-[10px] font-black hidden lg:block uppercase tracking-wider">{tab.label}</span>
                    </button>
                  ))}
               </div>

               <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar">
                  {activeTab === 'ai' && (
                    <div className="space-y-10 md:space-y-12 animate-in slide-in-from-bottom-4">
                       
                       {/* NEW ANALYSIS MODE SECTION */}
                       <div className="space-y-4 md:space-y-6">
                          <h4 className={`text-base md:text-lg font-black text-white flex items-center gap-3 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}><Gauge className="w-5 h-5 text-indigo-400" /> {t.analysisMode}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                             {[
                               { id: 'precision', label: t.modePrecision },
                               { id: 'balanced', label: t.modeBalanced },
                               { id: 'turbo', label: t.modeTurbo }
                             ].map(m => (
                               <button key={m.id} onClick={() => setSettings({...settings, analysisMode: m.id as any})} className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 transition-all font-black uppercase text-[10px] md:text-xs ${settings.analysisMode === m.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                                 {m.label}
                               </button>
                             ))}
                          </div>
                          <p className={`text-[10px] font-bold text-slate-500 ${isRtl ? 'text-right' : 'text-left'}`}>{t.analysisNote}</p>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                          <div className="space-y-4 md:space-y-6">
                             <h4 className={`text-base md:text-lg font-black text-white flex items-center gap-3 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}><Eye className="w-5 h-5 text-indigo-400" /> {t.depth}</h4>
                             <div className="flex flex-col gap-2 md:gap-3">
                                {['standard', 'academic', 'deep_clinical'].map(d => (
                                  <button key={d} onClick={() => setSettings({...settings, depth: d as any})} className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 transition-all font-black uppercase text-[10px] md:text-xs ${settings.depth === d ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'} ${isRtl ? 'text-right' : 'text-left'}`}>
                                    {d.replace('_', ' ')}
                                  </button>
                                ))}
                             </div>
                          </div>
                          <div className="space-y-4 md:space-y-6">
                             <h4 className={`text-base md:text-lg font-black text-white flex items-center gap-3 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}><Monitor className="w-5 h-5 text-indigo-400" /> {t.focus}</h4>
                             <div className="grid grid-cols-2 gap-2 md:gap-3">
                                {['general', 'orthopedic', 'neurology', 'cardiology', 'oncology'].map(f => (
                                  <button key={f} onClick={() => setSettings({...settings, focus: f as any})} className={`p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all text-center font-black uppercase text-[9px] md:text-[10px] ${settings.focus === f ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                                    {f}
                                  </button>
                                ))}
                             </div>
                          </div>
                       </div>
                       
                       <div className="p-6 md:p-10 bg-slate-900/50 rounded-2xl md:rounded-[3rem] border border-slate-800 space-y-8 md:space-y-10">
                          <div className="space-y-4 md:space-y-6">
                             <div className={`flex justify-between items-center ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}><h4 className="text-xs md:text-sm font-black text-white">{t.thinking}</h4><span className="text-[10px] md:text-xs text-indigo-400 font-black">{settings.thinkingBudget} Tokens</span></div>
                             <input type="range" min="0" max="32768" step="1000" value={settings.thinkingBudget} disabled={settings.analysisMode === 'turbo'} onChange={(e) => setSettings({...settings, thinkingBudget: parseInt(e.target.value)})} className={`w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 ${settings.analysisMode === 'turbo' ? 'opacity-50 grayscale' : ''}`} />
                          </div>
                          <button onClick={() => setSettings({...settings, secondaryOpinion: !settings.secondaryOpinion})} className={`w-full p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border-2 flex items-center justify-between transition-all ${settings.secondaryOpinion ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-slate-900 border-slate-800'} ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                             <div className={`flex items-center gap-3 md:gap-4 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}><CheckSquare className={`w-5 h-5 md:w-6 md:h-6 ${settings.secondaryOpinion ? 'text-indigo-400' : 'text-slate-600'}`} /><span className="text-sm md:font-black text-white">{t.opinion}</span></div>
                             <div className={`w-10 h-5 md:w-14 md:h-7 rounded-full relative transition-all ${settings.secondaryOpinion ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                <div className={`absolute top-1 md:top-1.5 w-3 h-3 md:w-4 md:h-4 bg-white rounded-full transition-all ${settings.secondaryOpinion ? (isRtl ? 'left-1 md:left-1.5' : 'right-1 md:right-1.5') : (isRtl ? 'right-1 md:right-1.5' : 'left-1 md:left-1.5')}`}></div>
                             </div>
                          </button>
                       </div>
                    </div>
                  )}

                  {activeTab === 'clinical' && (
                    <div className="space-y-8 md:space-y-12 animate-in slide-in-from-bottom-4">
                       <div className="space-y-4 md:space-y-6">
                          <h4 className={`text-base md:text-lg font-black text-white flex items-center gap-3 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}><Stethoscope className="w-5 h-5 text-indigo-400" /> {t.standard}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                             {['standard', 'who', 'academic_strict'].map(s => (
                               <button key={s} onClick={() => setSettings({...settings, standard: s as any})} className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 transition-all font-black uppercase text-[9px] md:text-[10px] ${settings.standard === s ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                                 {s.replace('_', ' ')}
                               </button>
                             ))}
                          </div>
                       </div>
                       <div className="space-y-4 md:space-y-6">
                          <h4 className={`text-base md:text-lg font-black text-white flex items-center gap-3 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}><ClipboardCheck className="w-5 h-5 text-indigo-400" /> {t.sections}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                             {Object.entries(settings.enabledSections).map(([key, val]) => (
                               <button key={key} onClick={() => setSettings({...settings, enabledSections: {...settings.enabledSections, [key]: !val}})} className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 flex items-center justify-between transition-all ${val ? 'bg-indigo-600/10 border-indigo-500/30 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'} ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                                 <span className="font-black uppercase text-[9px] md:text-[10px]">{key}</span>
                                 <CheckSquare className={`w-4 h-4 md:w-5 md:h-5 ${val ? 'text-indigo-400' : 'text-slate-700'}`} />
                               </button>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}
                  {/* ... other tabs remain same ... */}
                  {activeTab === 'ui' && (
                    <div className="space-y-8 md:space-y-12 animate-in slide-in-from-bottom-4">
                       <div className="space-y-4 md:space-y-6">
                          <h4 className={`text-base md:text-lg font-black text-white flex items-center gap-3 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}><Scale className="w-5 h-5 text-indigo-400" /> {t.fontSize}</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                             {['small', 'medium', 'large', 'extra'].map(sz => (
                               <button key={sz} onClick={() => setSettings({...settings, fontSize: sz as any})} className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 transition-all font-black uppercase text-[9px] md:text-[10px] ${settings.fontSize === sz ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                                 {sz}
                               </button>
                             ))}
                          </div>
                       </div>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                          <button onClick={() => setSettings({...settings, autoSave: !settings.autoSave})} className={`p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border-2 flex items-center justify-between transition-all ${settings.autoSave ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-slate-900 border-slate-800'} ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                             <div className={`flex items-center gap-3 md:gap-4 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}><Database className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" /><span className="text-sm md:font-black text-white">{t.autoSave}</span></div>
                             <div className={`w-10 h-5 md:w-14 md:h-7 rounded-full relative transition-all ${settings.autoSave ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                <div className={`absolute top-1 md:top-1.5 w-3 h-3 md:w-4 md:h-4 bg-white rounded-full transition-all ${settings.autoSave ? (isRtl ? 'left-1 md:left-1.5' : 'right-1 md:right-1.5') : (isRtl ? 'right-1 md:right-1.5' : 'left-1 md:left-1.5')}`}></div>
                             </div>
                          </button>
                          <button onClick={() => setSettings({...settings, autoNarrate: !settings.autoNarrate})} className={`p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border-2 flex items-center justify-between transition-all ${settings.autoNarrate ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-slate-900 border-slate-800'} ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                             <div className={`flex items-center gap-3 md:gap-4 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}><Volume2 className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" /><span className="text-sm md:font-black text-white">{t.autoNarrate}</span></div>
                             <div className={`w-10 h-5 md:w-14 md:h-7 rounded-full relative transition-all ${settings.autoNarrate ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                <div className={`absolute top-1 md:top-1.5 w-3 h-3 md:w-4 md:h-4 bg-white rounded-full transition-all ${settings.autoNarrate ? (isRtl ? 'left-1 md:left-1.5' : 'right-1 md:right-1.5') : (isRtl ? 'right-1 md:right-1.5' : 'left-1 md:left-1.5')}`}></div>
                             </div>
                          </button>
                          {/* Tools Settings */}
                          <button onClick={() => setSettings({...settings, enableImageTools: !settings.enableImageTools})} className={`p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border-2 flex items-center justify-between transition-all ${settings.enableImageTools ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-slate-900 border-slate-800'} ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                             <div className={`flex items-center gap-3 md:gap-4 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}><ScanEye className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" /><span className="text-sm md:font-black text-white">{t.enableTools}</span></div>
                             <div className={`w-10 h-5 md:w-14 md:h-7 rounded-full relative transition-all ${settings.enableImageTools ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                <div className={`absolute top-1 md:top-1.5 w-3 h-3 md:w-4 md:h-4 bg-white rounded-full transition-all ${settings.enableImageTools ? (isRtl ? 'left-1 md:left-1.5' : 'right-1 md:right-1.5') : (isRtl ? 'right-1 md:right-1.5' : 'left-1 md:left-1.5')}`}></div>
                             </div>
                          </button>
                          <button onClick={() => setSettings({...settings, defaultOverlay: !settings.defaultOverlay})} className={`p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border-2 flex items-center justify-between transition-all ${settings.defaultOverlay ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-slate-900 border-slate-800'} ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                             <div className={`flex items-center gap-3 md:gap-4 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}><MousePointer2 className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" /><span className="text-sm md:font-black text-white">{t.defaultOverlay}</span></div>
                             <div className={`w-10 h-5 md:w-14 md:h-7 rounded-full relative transition-all ${settings.defaultOverlay ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                <div className={`absolute top-1 md:top-1.5 w-3 h-3 md:w-4 md:h-4 bg-white rounded-full transition-all ${settings.defaultOverlay ? (isRtl ? 'left-1 md:left-1.5' : 'right-1 md:right-1.5') : (isRtl ? 'right-1 md:right-1.5' : 'left-1 md:left-1.5')}`}></div>
                             </div>
                          </button>

                          {/* ADVANCED TOOLS */}
                          <button onClick={() => setSettings({...settings, enableMagnifier: !settings.enableMagnifier})} className={`p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border-2 flex items-center justify-between transition-all ${settings.enableMagnifier ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-slate-900 border-slate-800'} ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                             <div className={`flex items-center gap-3 md:gap-4 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}><Search className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" /><span className="text-sm md:font-black text-white">{t.enableMagnifier}</span></div>
                             <div className={`w-10 h-5 md:w-14 md:h-7 rounded-full relative transition-all ${settings.enableMagnifier ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                <div className={`absolute top-1 md:top-1.5 w-3 h-3 md:w-4 md:h-4 bg-white rounded-full transition-all ${settings.enableMagnifier ? (isRtl ? 'left-1 md:left-1.5' : 'right-1 md:right-1.5') : (isRtl ? 'right-1 md:right-1.5' : 'left-1 md:left-1.5')}`}></div>
                             </div>
                          </button>

                          <button onClick={() => setSettings({...settings, enableGridOverlay: !settings.enableGridOverlay})} className={`p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border-2 flex items-center justify-between transition-all ${settings.enableGridOverlay ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-slate-900 border-slate-800'} ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                             <div className={`flex items-center gap-3 md:gap-4 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}><Grid3X3 className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" /><span className="text-sm md:font-black text-white">{t.enableGrid}</span></div>
                             <div className={`w-10 h-5 md:w-14 md:h-7 rounded-full relative transition-all ${settings.enableGridOverlay ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                <div className={`absolute top-1 md:top-1.5 w-3 h-3 md:w-4 md:h-4 bg-white rounded-full transition-all ${settings.enableGridOverlay ? (isRtl ? 'left-1 md:left-1.5' : 'right-1 md:right-1.5') : (isRtl ? 'right-1 md:right-1.5' : 'left-1 md:left-1.5')}`}></div>
                             </div>
                          </button>

                          <button onClick={() => setSettings({...settings, enableAdvancedFilters: !settings.enableAdvancedFilters})} className={`p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border-2 flex items-center justify-between transition-all ${settings.enableAdvancedFilters ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-slate-900 border-slate-800'} ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                             <div className={`flex items-center gap-3 md:gap-4 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}><Layers className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" /><span className="text-sm md:font-black text-white">{t.enableFilters}</span></div>
                             <div className={`w-10 h-5 md:w-14 md:h-7 rounded-full relative transition-all ${settings.enableAdvancedFilters ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                <div className={`absolute top-1 md:top-1.5 w-3 h-3 md:w-4 md:h-4 bg-white rounded-full transition-all ${settings.enableAdvancedFilters ? (isRtl ? 'left-1 md:left-1.5' : 'right-1 md:right-1.5') : (isRtl ? 'right-1 md:right-1.5' : 'left-1 md:left-1.5')}`}></div>
                             </div>
                          </button>
                       </div>
                    </div>
                  )}
                  {activeTab === 'privacy' && (
                    <div className="space-y-12 animate-in slide-in-from-bottom-4">
                       <div className="bg-rose-600/10 p-6 md:p-10 rounded-2xl md:rounded-[4rem] border-2 border-rose-500/30 space-y-6 md:space-y-8">
                          <div className={`flex items-center gap-4 md:gap-6 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                             <div className="bg-rose-600 p-3 md:p-4 rounded-xl md:rounded-3xl"><Lock className="w-8 h-8 md:w-10 md:h-10 text-white" /></div>
                             <div className={isRtl ? 'text-right' : 'text-left'}>
                                <h4 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase">{t.privacyMode}</h4>
                                <p className="text-rose-400 font-bold text-[10px] md:text-sm mt-1 md:text-sm mt-2">{t.privacyDesc}</p>
                             </div>
                             <button onClick={() => setSettings({...settings, privacyMode: !settings.privacyMode})} className={`ms-auto w-12 h-6 md:w-20 md:h-10 rounded-full relative transition-all ${settings.privacyMode ? 'bg-rose-600 shadow-xl' : 'bg-slate-800 border-2 border-slate-700'}`}>
                                <div className={`absolute top-1 w-4 h-4 md:w-6 md:h-6 bg-white rounded-full transition-all ${settings.privacyMode ? (isRtl ? 'left-1 md:left-2' : 'right-1 md:right-2') : (isRtl ? 'right-1 md:right-2' : 'left-1 md:left-2')}`}></div>
                             </button>
                          </div>
                       </div>
                    </div>
                  )}
               </div>
            </div>

            <div className="p-6 md:p-12 bg-slate-900/80 border-t border-slate-800 flex justify-end shrink-0">
               <button onClick={() => setShowSettings(false)} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-10 md:px-16 py-4 md:py-6 rounded-xl md:rounded-[2.5rem] font-black text-xl md:text-2xl shadow-2xl transition-all active:scale-95">
                  {t.saveSettings}
               </button>
            </div>
          </div>
        </div>
      )}

      {status === AnalysisStatus.PROCESSING && (
        <div className="fixed inset-0 z-[1000] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6 space-y-8 md:space-y-12 animate-in fade-in duration-500">
           <div className="relative">
              <div className="w-40 h-40 md:w-64 md:h-64 rounded-full border-[6px] md:border-[10px] border-slate-800 border-t-indigo-500 animate-spin shadow-2xl shadow-indigo-500/30"></div>
              <div className="absolute inset-0 flex items-center justify-center"><BrainCircuit className="w-16 h-16 md:w-24 md:h-24 text-indigo-500 animate-pulse" /></div>
           </div>
           <div className="text-center space-y-4 md:space-y-6">
              <h3 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase">{t.analyzing}</h3>
              <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
                 <div className="px-4 md:px-5 py-1.5 md:py-2 bg-indigo-500/20 rounded-full text-[9px] md:text-xs font-black text-indigo-400 uppercase tracking-widest">{settings.focus}</div>
                 <div className="px-4 md:px-5 py-1.5 md:py-2 bg-purple-500/20 rounded-full text-[9px] md:text-xs font-black text-purple-400 uppercase tracking-widest">{settings.analysisMode}</div>
                 {settings.secondaryOpinion && settings.analysisMode !== 'turbo' && <div className="px-4 md:px-5 py-1.5 md:py-2 bg-emerald-500/20 rounded-full text-[9px] md:text-xs font-black text-emerald-400 uppercase tracking-widest">Verification Pass</div>}
              </div>
           </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-6 md:bottom-12 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-xl z-[2000] bg-rose-600 text-white px-6 md:px-12 py-5 md:py-7 rounded-2xl md:rounded-[2.5rem] shadow-2xl flex items-center gap-6 md:gap-10 border-2 border-rose-500 animate-in slide-in-from-bottom-10 duration-700">
           <AlertTriangle className="w-8 h-8 md:w-12 md:h-12 shrink-0" />
           <div className={isRtl ? 'text-right' : 'text-left'}>
              <div className="text-[10px] font-black uppercase opacity-75 tracking-widest mb-1">{t.sysFault}</div>
              <div className="font-bold text-base md:text-2xl leading-tight">{error}</div>
           </div>
           <button onClick={() => setError(null)} className="p-2 md:p-4 hover:bg-white/10 rounded-xl md:rounded-3xl transition-all ms-auto"><X className="w-6 h-6 md:w-8 md:h-8" /></button>
        </div>
      )}
    </div>
  );
};

export default App;
