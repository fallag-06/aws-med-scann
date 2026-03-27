
import React, { useState, useRef, useEffect } from 'react';
import { DiagnosisResult, MedicalImage, PatientBio, Language, AppSettings } from '../types';
import { askFollowUpQuestion, generateVocalSummary } from '../services/geminiService';
import { 
  Printer, ChevronLeft, MessageSquare, 
  User, Activity, Image as ImageIcon,
  ShieldCheck, PlayCircle, Volume2,
  RefreshCw, TrendingUp, ClipboardList,
  Calendar, CheckCircle2, AlertOctagon, Fingerprint, Bone, Zap, Activity as Pulse,
  FileCode, Users, AlertTriangle, ListChecks, Info, Stethoscope, Award, ShieldAlert,
  ZoomIn, ZoomOut, Sun, Contrast, EyeOff, Eye, Move, RotateCcw,
  Search, Grid3X3, Layers
} from 'lucide-react';

interface DiagnosisReportProps {
  result: DiagnosisResult;
  images: MedicalImage[];
  bio: PatientBio;
  lang: Language;
  settings?: AppSettings;
  onReset: () => void;
}

const reportTranslations = {
  ar: {
    back: "رجوع",
    listen: "قراءة التقرير",
    stopListen: "إيقاف",
    print: "طباعة",
    reportTitle: "تقرير التشخيص الذكي",
    age: "العمر",
    date: "التاريخ",
    patientId: "ID المريض",
    confidence: "مؤشر الثقة",
    expertBoard: "مجلس الخبراء",
    roadmap: "المسار العلاجي",
    painManagement: "إدارة الألم",
    functionalRehab: "التأهيل الوظيفي",
    visualAnalysis: "التحليل البصري",
    risks: "تقييم المخاطر",
    differential: "التشخيص التفريقي",
    findings: "النتائج السريرية",
    icd10: "أكواد ICD-10 المقترحة",
    chatTitle: "المساعد الطبي",
    chatPlaceholder: "اطرح سؤالاً حول التشخيص...",
    chatSend: "إرسال",
    chatThinking: "جاري التحليل...",
    signature: "توقيع معتمد",
    developer: "نظام MedScan",
    critical: "حالة حرجة",
    urgent: "حالة عاجلة",
    stable: "حالة مستقرة",
    recommendations: "التوصيات الطبية",
    prognosis: "التوقع الطبي",
    showOverlay: "إظهار المؤشرات",
    hideOverlay: "إخفاء المؤشرات"
  },
  en: {
    back: "Back",
    listen: "Read Report",
    stopListen: "Stop",
    print: "Print",
    reportTitle: "AI Diagnostic Report",
    age: "Age",
    date: "Date",
    patientId: "Patient ID",
    confidence: "Confidence Score",
    expertBoard: "Expert Board",
    roadmap: "Recovery Roadmap",
    painManagement: "Pain Mgmt",
    functionalRehab: "Rehabilitation",
    visualAnalysis: "Visual Analysis",
    risks: "Risk Assessment",
    differential: "Differential Diagnosis",
    findings: "Clinical Findings",
    icd10: "Suggested ICD-10",
    chatTitle: "Medical Assistant",
    chatPlaceholder: "Ask about the diagnosis...",
    chatSend: "Send",
    chatThinking: "Thinking...",
    signature: "Verified Signature",
    developer: "MedScan System",
    critical: "Critical",
    urgent: "Urgent",
    stable: "Stable",
    recommendations: "Recommendations",
    prognosis: "Prognosis",
    showOverlay: "Show Markers",
    hideOverlay: "Hide Markers"
  },
  fr: {
    back: "Retour",
    listen: "Lire",
    stopListen: "Arrêter",
    print: "Imprimer",
    reportTitle: "Rapport Diagnostic IA",
    age: "Âge",
    date: "Date",
    patientId: "ID Patient",
    confidence: "Indice de Confiance",
    expertBoard: "Comité d'Experts",
    roadmap: "Parcours de Soin",
    painManagement: "Gestion Douleur",
    functionalRehab: "Rééducation",
    visualAnalysis: "Analyse Visuelle",
    risks: "Évaluation des Risques",
    differential: "Diagnostic Différentiel",
    findings: "Résultats Cliniques",
    icd10: "Codes ICD-10",
    chatTitle: "Assistant Médical",
    chatPlaceholder: "Posez une question...",
    chatSend: "Envoyer",
    chatThinking: "Analyse...",
    signature: "Signature Vérifiée",
    developer: "Système MedScan",
    critical: "Critique",
    urgent: "Urgent",
    stable: "Stable",
    recommendations: "Recommandations",
    prognosis: "Pronostic",
    showOverlay: "Afficher Marqueurs",
    hideOverlay: "Masquer Marqueurs"
  }
};

// Helper to decode raw PCM (Linear16 24kHz Mono) from Gemini
const decodeLinear16 = (arrayBuffer: ArrayBuffer, sampleRate: number, ctx: AudioContext): AudioBuffer => {
  const dataView = new DataView(arrayBuffer);
  const numSamples = arrayBuffer.byteLength / 2;
  const audioBuffer = ctx.createBuffer(1, numSamples, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  for (let i = 0; i < numSamples; i++) {
    // Little endian is standard for these APIs
    const sample = dataView.getInt16(i * 2, true); 
    channelData[i] = sample / 32768.0;
  }
  
  return audioBuffer;
};

// Internal Component for Smart Image Viewer
const SmartImageViewer: React.FC<{
  img: MedicalImage;
  coordinates: { x: number; y: number; label: string }[];
  showTools: boolean;
  defaultOverlay: boolean;
  settings: AppSettings | undefined;
  t: any;
  isRtl: boolean;
}> = ({ img, coordinates, showTools, defaultOverlay, settings, t, isRtl }) => {
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [invert, setInvert] = useState(false);
  const [showOverlay, setShowOverlay] = useState(defaultOverlay);

  // New Tool States
  const [showGrid, setShowGrid] = useState(false);
  const [magnifierActive, setMagnifierActive] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
  const [activeFilter, setActiveFilter] = useState<'none' | 'bone' | 'tissue'>('none');

  const reset = () => {
    setZoom(1);
    setBrightness(100);
    setContrast(100);
    setInvert(false);
    setShowGrid(false);
    setMagnifierActive(false);
    setActiveFilter('none');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!magnifierActive) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    setMagnifierPos({ x, y });
  };

  // Compute filter string based on both basic and advanced filters
  const getFilterString = () => {
    let base = `brightness(${brightness}%) contrast(${contrast}%) invert(${invert ? 1 : 0})`;
    if (activeFilter === 'bone') {
      base += ` grayscale(100%) contrast(150%) brightness(110%)`;
    } else if (activeFilter === 'tissue') {
      base += ` sepia(40%) contrast(90%) brightness(105%) saturate(140%)`;
    }
    return base;
  };

  const toggleFilter = () => {
    setActiveFilter(curr => curr === 'none' ? 'bone' : curr === 'bone' ? 'tissue' : 'none');
  };

  return (
    <div className="flex flex-col gap-4 no-print-break w-full">
      <div 
        className="relative aspect-[4/5] w-full bg-black rounded-3xl overflow-hidden border-2 border-slate-100 shadow-2xl group transition-all"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMagnifierActive(false)}
      >
        <div className="w-full h-full overflow-hidden flex items-center justify-center bg-black">
          <img 
            src={img.url} 
            className="w-full h-full object-contain transition-all duration-300" 
            style={{
              transform: `scale(${zoom})`,
              filter: getFilterString()
            }}
          />
        </div>
        
        {/* Grid Overlay */}
        {showGrid && (
          <div className="absolute inset-0 pointer-events-none opacity-40 z-10" 
               style={{ 
                 backgroundImage: `linear-gradient(to right, #4f46e5 1px, transparent 1px), linear-gradient(to bottom, #4f46e5 1px, transparent 1px)`,
                 backgroundSize: '10% 10%'
               }}>
            <div className="absolute inset-0 border-[4px] border-indigo-500/50"></div>
            <div className="absolute top-1/2 left-0 right-0 h-px bg-rose-500/80"></div>
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-rose-500/80"></div>
          </div>
        )}

        {/* Magnifier Loupe */}
        {magnifierActive && (
          <div 
            className="absolute w-32 h-32 rounded-full border-[3px] border-white shadow-2xl overflow-hidden z-50 pointer-events-none"
            style={{
              left: magnifierPos.x,
              top: magnifierPos.y,
              transform: 'translate(-50%, -50%)',
              backgroundImage: `url(${img.url})`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: `${(magnifierPos.x / (document.querySelector('.group')?.clientWidth || 1)) * 100}% ${(magnifierPos.y / (document.querySelector('.group')?.clientHeight || 1)) * 100}%`,
              backgroundSize: `${zoom * 300}%`, // 3x Zoom relative to current zoom
              backgroundColor: 'black',
              filter: getFilterString()
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-2 h-2 border border-rose-500/50 rounded-full bg-rose-500/20"></div>
            </div>
          </div>
        )}
        
        {/* Overlays / Annotations */}
        {showOverlay && coordinates.map((coord, ci) => (
           <React.Fragment key={ci}>
             <div className="absolute w-12 md:w-16 h-12 md:h-16 border-[2px] md:border-[3px] border-rose-500/50 rounded-full animate-ping pointer-events-none" style={{ left: `${coord.x}%`, top: `${coord.y}%`, transform: 'translate(-50%, -50%)' }}></div>
             <div className="absolute w-5 h-5 md:w-7 md:h-7 bg-rose-600/20 border-2 border-rose-500 rounded-full shadow-2xl flex items-center justify-center cursor-help z-10 hover:bg-rose-600 hover:scale-125 transition-all" style={{ left: `${coord.x}%`, top: `${coord.y}%`, transform: 'translate(-50%, -50%)' }}>
                <div className="absolute top-full mt-2 bg-black/80 backdrop-blur-md text-white text-[9px] md:text-[10px] font-black px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 border border-white/10 shadow-xl">
                  {coord.label}
                </div>
             </div>
           </React.Fragment>
        ))}

        {/* Toolbar - Only visible if enabled in settings */}
        {showTools && (
          <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <div className="bg-slate-900/90 backdrop-blur-xl p-2 rounded-2xl border border-white/10 flex items-center gap-1 shadow-2xl overflow-x-auto no-scrollbar max-w-full">
                {/* Basic Zoom */}
                <button onClick={() => setZoom(z => Math.max(1, z - 0.2))} className="p-2 hover:bg-white/10 rounded-xl text-white shrink-0"><ZoomOut className="w-4 h-4" /></button>
                <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-2 hover:bg-white/10 rounded-xl text-white shrink-0"><ZoomIn className="w-4 h-4" /></button>
                <div className="w-px h-4 bg-white/20 mx-1 shrink-0"></div>
                
                {/* Basic Adjustments */}
                <button onClick={() => setBrightness(b => b === 100 ? 120 : 100)} className={`p-2 hover:bg-white/10 rounded-xl shrink-0 ${brightness !== 100 ? 'text-indigo-400' : 'text-white'}`}><Sun className="w-4 h-4" /></button>
                <button onClick={() => setContrast(c => c === 100 ? 130 : 100)} className={`p-2 hover:bg-white/10 rounded-xl shrink-0 ${contrast !== 100 ? 'text-indigo-400' : 'text-white'}`}><Contrast className="w-4 h-4" /></button>
                <button onClick={() => setInvert(!invert)} className={`p-2 hover:bg-white/10 rounded-xl shrink-0 ${invert ? 'text-indigo-400' : 'text-white'}`}><RefreshCw className="w-4 h-4" /></button>
                <div className="w-px h-4 bg-white/20 mx-1 shrink-0"></div>

                {/* New Advanced Tools */}
                {settings?.enableMagnifier && (
                  <button onClick={() => setMagnifierActive(!magnifierActive)} className={`p-2 hover:bg-white/10 rounded-xl shrink-0 ${magnifierActive ? 'text-indigo-400 bg-white/10' : 'text-white'}`} title="Magnifier">
                    <Search className="w-4 h-4" />
                  </button>
                )}
                
                {settings?.enableGridOverlay && (
                  <button onClick={() => setShowGrid(!showGrid)} className={`p-2 hover:bg-white/10 rounded-xl shrink-0 ${showGrid ? 'text-indigo-400 bg-white/10' : 'text-white'}`} title="Grid">
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                )}

                {settings?.enableAdvancedFilters && (
                  <button onClick={toggleFilter} className={`p-2 hover:bg-white/10 rounded-xl shrink-0 ${activeFilter !== 'none' ? 'text-indigo-400 bg-white/10' : 'text-white'}`} title="Advanced Filters">
                    <Layers className="w-4 h-4" />
                  </button>
                )}
                
                <div className="w-px h-4 bg-white/20 mx-1 shrink-0"></div>
                
                {/* Overlay Toggle */}
                <button onClick={() => setShowOverlay(!showOverlay)} className={`p-2 hover:bg-white/10 rounded-xl shrink-0 ${showOverlay ? 'text-rose-400' : 'text-slate-400'}`}>
                  {showOverlay ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                
                {/* Reset */}
                <button onClick={reset} className="p-2 hover:bg-rose-500/20 hover:text-rose-400 rounded-xl text-slate-400 ml-1 shrink-0"><RotateCcw className="w-4 h-4" /></button>
             </div>
          </div>
        )}
      </div>
      
      {/* Mobile Toggle for Overlay (if tools hidden or strictly for ease of use) */}
      <div className="flex justify-center md:hidden">
         <button onClick={() => setShowOverlay(!showOverlay)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${showOverlay ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
            {showOverlay ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {showOverlay ? t.hideOverlay : t.showOverlay}
         </button>
      </div>
    </div>
  );
};

const DiagnosisReport: React.FC<DiagnosisReportProps> = ({ result, images, bio, lang, settings, onReset }) => {
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    return () => {
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch(e) {}
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const t = reportTranslations[lang];
  const isRtl = lang === 'ar';

  const handleVocalSummary = async () => {
    if (isPlayingVoice) {
      if (audioSourceRef.current) {
        try { audioSourceRef.current.stop(); } catch(e) {}
      }
      setIsPlayingVoice(false);
      return;
    }

    setIsPlayingVoice(true);
    const textToSpeak = `${result.findings}. ${result.prognosis || ''}`;
    
    // Get Base64 from Gemini
    const base64Audio = await generateVocalSummary(textToSpeak, lang);

    if (base64Audio) {
      try {
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        
        // Gemini TTS returns raw PCM 24000Hz Mono
        const audioBuffer = decodeLinear16(bytes.buffer, 24000, ctx);
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsPlayingVoice(false);
        source.start(0);
        audioSourceRef.current = source;
      } catch (e) {
        console.error("Audio Decode Error", e);
        setIsPlayingVoice(false);
      }
    } else {
      setIsPlayingVoice(false);
    }
  };

  const handleAsk = async () => {
    if (!chatQuestion.trim()) return;
    const q = chatQuestion;
    setChatQuestion("");
    setChatHistory(prev => [...prev, { role: 'user', text: q }]);
    setIsAsking(true);
    try {
      const answer = await askFollowUpQuestion(q, result, images, lang);
      setChatHistory(prev => [...prev, { role: 'ai', text: answer }]);
    } catch (e) { setChatHistory(prev => [...prev, { role: 'ai', text: "Model error." }]); }
    finally { setIsAsking(false); }
  };

  return (
    <div className={`max-w-7xl mx-auto space-y-6 md:space-y-10 pb-20 animate-in fade-in duration-1000 ${isRtl ? 'rtl' : 'ltr'}`}>
      
      {/* Control Hub */}
      <div className={`flex flex-wrap items-center justify-between no-print sticky top-16 md:top-20 z-[60] bg-[#0d1117]/90 backdrop-blur-3xl p-3 md:p-5 rounded-2xl md:rounded-[2.5rem] border border-white/10 shadow-2xl gap-3 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
        <button onClick={onReset} className="flex items-center gap-2 text-slate-400 hover:text-white font-black px-3 md:px-5 py-2 hover:bg-white/5 rounded-xl transition-all">
          <ChevronLeft className={`w-4 h-4 md:w-5 md:h-5 ${isRtl ? '' : 'rotate-180'}`} /> 
          <span className="text-[10px] md:text-sm">{t.back}</span>
        </button>
        <div className={`flex gap-2 md:gap-3 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
          <button onClick={handleVocalSummary} className={`px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm flex items-center gap-2 transition-all shadow-lg ${isPlayingVoice ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-indigo-400 border border-indigo-500/20'}`}>
            {isPlayingVoice ? <Volume2 className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
            {isPlayingVoice ? t.stopListen : t.listen}
          </button>
          <button onClick={() => window.print()} className="px-4 md:px-6 py-2 md:py-3 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-sm flex items-center gap-2 shadow-2xl hover:bg-indigo-500 transition-all">
            <Printer className="w-4 h-4" /> {t.print}
          </button>
        </div>
      </div>

      <div id="print-area-container" className="bg-white rounded-2xl md:rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
        
        {/* PLATINUM SURGICAL HEADER */}
        <div className="bg-[#0f172a] text-white p-6 md:p-12 lg:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-indigo-600/10 rounded-full blur-[80px] md:blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
          <div className={`relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 ${isRtl ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
            <div className={`space-y-4 md:space-y-6 flex-1 ${isRtl ? 'text-right' : 'text-left'} w-full`}>
              <div className={`flex flex-col md:flex-row items-center gap-3 md:gap-5 ${isRtl ? 'md:flex-row' : 'md:flex-row-reverse'} text-center md:text-right`}>
                <div className="bg-indigo-600 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl animate-subtle-pulse"><Bone className="w-6 h-6 md:w-8 md:h-8" /></div>
                <div>
                  <span className="text-indigo-400 font-black tracking-widest text-[8px] md:text-[9px] uppercase block mb-1">CLINICAL AI ENGINE v7.8</span>
                  <h2 className="text-xl md:text-3xl lg:text-4xl font-black tracking-tighter leading-tight">{t.reportTitle}</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                {[
                  { icon: Fingerprint, label: t.patientId, val: bio.patientId },
                  { icon: User, label: "Name", val: `${bio.firstName} ${bio.lastName}` },
                  { icon: Activity, label: t.age, val: `${bio.age} Yrs` },
                  { icon: Calendar, label: t.date, val: new Date().toLocaleDateString() }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white/5 backdrop-blur-md p-2 md:p-4 rounded-xl border border-white/10">
                    <div className={`flex items-center gap-1.5 text-indigo-400 mb-0.5 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                      <item.icon className="w-2.5 h-2.5" />
                      <span className="text-[6px] md:text-[8px] font-black uppercase tracking-widest">{item.label}</span>
                    </div>
                    <div className="text-[10px] md:text-base font-black text-white truncate">{item.val}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-row lg:flex-col items-center justify-between lg:justify-center gap-4 w-full lg:w-auto">
              <div className="relative w-16 h-16 md:w-32 md:h-32 flex items-center justify-center bg-white/5 border border-white/20 rounded-full shadow-2xl">
                 <div className="text-center relative z-10">
                   <div className="text-[6px] md:text-[8px] font-black uppercase text-indigo-400 tracking-widest mb-0.5">{t.confidence}</div>
                   <div className="text-lg md:text-4xl font-black text-white">{result.certaintyScore || 98}%</div>
                 </div>
              </div>
              <div className={`px-4 md:px-8 py-2 md:py-3.5 rounded-xl md:rounded-full text-white font-black text-[8px] md:text-base shadow-2xl uppercase tracking-tighter flex items-center gap-2 ${result.triageLevel === 'critical' ? 'bg-rose-600 animate-pulse' : result.triageLevel === 'urgent' ? 'bg-amber-500' : 'bg-emerald-600'}`}>
                 {result.triageLevel === 'critical' ? <AlertOctagon className="w-4 h-4 md:w-5 md:h-5" /> : <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />}
                 {t[result.triageLevel as keyof typeof t] || result.triageLevel}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-12 lg:p-16 space-y-12 md:space-y-20">
          
          {/* FINDINGS & EXPERT BOARD SECTION */}
          <section className="space-y-12">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                <div className="lg:col-span-2 space-y-8">
                  <div className={`flex items-center gap-3 border-b-2 border-slate-50 pb-3 md:pb-5 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className="w-8 h-8 md:w-12 md:h-12 bg-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-600"><ClipboardList className="w-4 h-4 md:w-6 md:h-6" /></div>
                    <h3 className="text-lg md:text-3xl font-black text-slate-900 tracking-tighter">{t.findings}</h3>
                  </div>
                  <div className="bg-slate-50/80 p-5 md:p-8 rounded-2xl md:rounded-[2rem] text-sm md:text-lg lg:text-xl text-slate-800 leading-relaxed text-justify whitespace-pre-line font-medium italic shadow-inner">
                    {result.findings}
                  </div>

                  {result.prognosis && (
                    <div className="p-5 md:p-7 bg-amber-50/30 border border-amber-100 rounded-2xl text-xs md:text-base font-bold text-amber-900/80 leading-relaxed italic">
                      <div className={`flex items-center gap-2 mb-2 text-amber-700 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}><Info className="w-4 h-4" /> <span className="uppercase tracking-widest text-[10px] font-black">{t.prognosis}</span></div>
                      {result.prognosis}
                    </div>
                  )}
                </div>

                {/* ADVISORY BOARD - Redesigned to support more content */}
                <aside className="space-y-6">
                   <div className={`flex items-center gap-2 border-b-2 border-slate-50 pb-3 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                      <Users className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
                      <h4 className="text-base md:text-xl font-black text-slate-900">{t.expertBoard}</h4>
                   </div>
                   <div className="space-y-4">
                      {result.expertBoard?.map((exp, i) => (
                        <div key={i} className="bg-white border-l-4 border-indigo-600 shadow-sm rounded-r-xl md:rounded-r-2xl p-4 transition-all hover:shadow-md">
                           <div className={`flex items-center justify-between mb-2 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                              <div className={`flex items-center gap-2 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                                <Award className="w-3.5 h-3.5 text-indigo-600" />
                                <span className="text-[9px] md:text-[11px] font-black text-indigo-700 uppercase">{exp.specialty}</span>
                              </div>
                              <Stethoscope className="w-3 h-3 text-slate-300" />
                           </div>
                           <p className="text-[10px] md:text-[13px] font-bold text-slate-700 leading-relaxed border-t border-slate-50 pt-2">{exp.insight}</p>
                        </div>
                      ))}
                      {!result.expertBoard && <div className="text-center p-6 text-slate-400 font-bold italic text-xs">No specific advisory insights available.</div>}
                   </div>
                </aside>
             </div>
          </section>

          {/* RISK ASSESSMENT SECTION */}
          {result.riskAssessment && (
            <section className="bg-slate-50/50 p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] border border-slate-100">
               <div className={`flex items-center gap-3 border-b-2 border-white pb-5 mb-8 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                  <ShieldAlert className="w-6 h-6 md:w-10 md:h-10 text-rose-600" />
                  <h3 className="text-lg md:text-4xl font-black text-slate-900 tracking-tighter">{t.risks}</h3>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                  {result.riskAssessment.map((risk, i) => (
                    <div key={i} className="bg-white p-5 md:p-8 rounded-[2rem] border border-white shadow-sm flex flex-col justify-between h-full">
                       <div className={`flex justify-between items-start mb-4 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                          <h5 className="text-[11px] md:text-base font-black text-slate-900 max-w-[70%]">{risk.factor}</h5>
                          <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${risk.level === 'high' ? 'bg-rose-100 text-rose-600' : risk.level === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{risk.level}</div>
                       </div>
                       <div className="space-y-2">
                          <div className="flex justify-between text-[9px] font-black text-slate-400">
                             <span>Severity</span>
                             <span>{risk.percentage}%</span>
                          </div>
                          <div className="h-1.5 md:h-2.5 bg-slate-50 rounded-full overflow-hidden">
                             <div className={`h-full transition-all duration-1000 ${risk.level === 'high' ? 'bg-rose-500' : risk.level === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${risk.percentage}%` }}></div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </section>
          )}

          {/* DIFFERENTIAL & ICD-10 SECTION */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
             {result.differentialDiagnoses && (
               <div className="space-y-6">
                  <div className={`flex items-center gap-3 border-b-2 border-slate-50 pb-3 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                     <ListChecks className="w-5 h-5 md:w-7 md:h-7 text-indigo-600" />
                     <h3 className="text-base md:text-2xl font-black text-slate-900 tracking-tighter">{t.differential}</h3>
                  </div>
                  <div className="space-y-3">
                     {result.differentialDiagnoses.map((diff, i) => (
                       <div key={i} className="flex items-center justify-between p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-indigo-50 transition-all">
                          <div>
                             <h5 className="text-[11px] md:text-base font-black text-slate-900 mb-0.5">{diff.condition}</h5>
                             <p className="text-[9px] md:text-xs font-bold text-slate-500 italic">{diff.reasoning}</p>
                          </div>
                          <div className="text-sm md:text-2xl font-black text-indigo-600">{diff.probability}%</div>
                       </div>
                     ))}
                  </div>
               </div>
             )}

             {result.icd10Codes && (
               <div className="space-y-6">
                  <div className={`flex items-center gap-3 border-b-2 border-slate-50 pb-3 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                     <FileCode className="w-5 h-5 md:w-7 md:h-7 text-emerald-600" />
                     <h3 className="text-base md:text-2xl font-black text-slate-900 tracking-tighter">{t.icd10}</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                     {result.icd10Codes.map((icd, i) => (
                       <div key={i} className={`flex items-start gap-3 p-3 md:p-5 bg-emerald-50/30 border border-emerald-100 rounded-xl ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                          <div className="bg-emerald-600 text-white px-2.5 md:px-4 py-1 rounded-lg font-black text-[9px] md:text-sm shadow-md shrink-0">{icd.code}</div>
                          <p className={`text-[10px] md:text-sm font-bold text-slate-700 ${isRtl ? 'text-right' : 'text-left'}`}>{icd.description}</p>
                       </div>
                     ))}
                  </div>
               </div>
             )}
          </section>

          {/* ROADMAP SECTION */}
          {result.recoveryRoadmap && (
            <section className="space-y-8">
               <div className={`flex items-center gap-4 border-b-4 border-slate-50 pb-5 md:pb-8 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className="w-10 h-10 md:w-16 md:h-16 bg-emerald-600/10 rounded-2xl flex items-center justify-center text-emerald-600"><TrendingUp className="w-5 h-5 md:w-9 md:h-9" /></div>
                  <h3 className="text-xl md:text-4xl font-black text-slate-900 tracking-tighter">{t.roadmap}</h3>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                  {result.recoveryRoadmap.map((step, i) => (
                    <div key={i} className="bg-white border-2 border-slate-50 p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all h-full flex flex-col relative group">
                       <div className="w-8 h-8 md:w-12 md:h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm md:text-xl mb-6 shadow-xl">{i + 1}</div>
                       <h4 className="text-lg md:text-xl font-black text-slate-900 mb-1 leading-tight">{step.phase}</h4>
                       <span className="text-indigo-600 font-black text-[8px] md:text-[10px] uppercase mb-6 block tracking-widest">{step.duration}</span>
                       <ul className="space-y-2 md:space-y-3 mt-auto">
                          {(step.actions || []).map((act, j) => (
                            <li key={j} className="text-[10px] md:text-xs font-bold text-slate-500 flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> {act}
                            </li>
                          ))}
                       </ul>
                    </div>
                  ))}
               </div>
            </section>
          )}

          {/* VISUAL ANALYSIS SECTION */}
          <section className="space-y-8">
             <div className={`flex items-center gap-4 border-b-4 border-slate-50 pb-5 md:pb-8 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className="w-10 h-10 md:w-16 md:h-16 bg-slate-900/5 rounded-2xl flex items-center justify-center text-slate-900"><ImageIcon className="w-5 h-5 md:w-9 md:h-9" /></div>
                <h3 className="text-xl md:text-4xl font-black text-slate-900 tracking-tighter">{t.visualAnalysis}</h3>
             </div>
             {/* INCREASED IMAGE SIZE HERE by changing grid columns */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
               {images.map((img) => (
                 <SmartImageViewer 
                    key={img.id} 
                    img={img} 
                    coordinates={result.detectedCoordinates || []} 
                    showTools={settings?.enableImageTools ?? true}
                    defaultOverlay={settings?.defaultOverlay ?? true}
                    settings={settings}
                    t={t}
                    isRtl={isRtl}
                 />
               ))}
             </div>
          </section>

          {/* SIGNATURE AREA */}
          <div className={`pt-12 md:pt-20 border-t-4 border-slate-50 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-16 ${isRtl ? 'text-right' : 'text-left'} text-center`}>
             <div className="space-y-4">
                <div className="text-2xl md:text-5xl font-black tracking-tighter text-slate-900 leading-none">aws MedScan <span className="text-indigo-600 block md:inline">v7.8 Platinum</span></div>
                <p className="text-[8px] md:text-sm font-black text-slate-400 max-w-xs mx-auto md:mx-0 tracking-widest uppercase leading-relaxed">{t.developer}</p>
             </div>
             <div className="flex flex-col items-center gap-2 md:gap-4 w-full md:w-auto">
                <div className="w-full md:w-[350px] h-20 md:h-32 border-b-4 border-slate-200 font-signature text-slate-800 text-4xl md:text-6xl flex items-center justify-center opacity-90 select-none">oussamaferjani</div>
                <div className="text-[7px] md:text-[10px] font-black text-slate-400 uppercase tracking-[1em]">{t.signature}</div>
             </div>
          </div>
        </div>
      </div>
      
      {/* AI CONSULTATION HUB */}
      <div className={`max-w-5xl mx-auto bg-[#0d1117] border-[2px] md:border-[4px] border-indigo-500/20 rounded-3xl md:rounded-[3.5rem] shadow-2xl p-6 md:p-10 no-print space-y-8 md:space-y-12 relative overflow-hidden`}>
          <div className={`flex items-center gap-4 md:gap-8 ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
            <div className="w-12 h-12 md:w-20 md:h-20 bg-indigo-600/20 rounded-xl md:rounded-[1.8rem] flex items-center justify-center text-indigo-400 border border-indigo-500/30 shrink-0">
              <MessageSquare className="w-6 h-6 md:w-10 md:h-10" />
            </div>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <h4 className="font-black text-white text-2xl md:text-4xl tracking-tighter">{t.chatTitle}</h4>
              <p className="text-[8px] md:text-xs font-black text-slate-500 uppercase tracking-widest mt-1">Local Expert System</p>
            </div>
          </div>

          <div className="max-h-[350px] md:max-h-[500px] overflow-y-auto space-y-6 md:space-y-8 p-4 md:p-8 custom-scrollbar bg-black/20 rounded-2xl md:rounded-[2.5rem]">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? (isRtl ? 'justify-end' : 'justify-start') : (isRtl ? 'justify-start' : 'justify-end')}`}>
                <div className={`p-4 md:p-7 rounded-2xl md:rounded-[2.5rem] max-w-[90%] md:max-w-[80%] relative shadow-xl text-xs md:text-base leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800/95 text-slate-200 border border-slate-700/50'}`}>
                  <p className="font-bold">{msg.text}</p>
                </div>
              </div>
            ))}
            {isAsking && (
              <div className={`flex items-center gap-3 text-indigo-400 font-black animate-pulse text-sm md:text-lg ${isRtl ? 'flex-row' : 'flex-row-reverse'}`}>
                <RefreshCw className="w-4 h-4 md:w-6 md:h-6 animate-spin" /> {t.chatThinking}
              </div>
            )}
          </div>

          <div className="relative group">
            <input 
              type="text" 
              value={chatQuestion} 
              onChange={(e) => setChatQuestion(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && handleAsk()} 
              placeholder={t.chatPlaceholder} 
              className={`w-full bg-slate-900 border-[2px] md:border-[4px] border-slate-800 focus:border-indigo-500 rounded-2xl md:rounded-full py-4 md:py-8 text-white outline-none font-bold transition-all shadow-inner px-6 md:px-12 text-xs md:text-lg ${isRtl ? 'md:pr-16' : 'md:pl-16'}`} 
            />
            <button onClick={handleAsk} disabled={isAsking} className={`w-full md:w-auto md:absolute md:top-4 md:bottom-4 bg-indigo-600 hover:bg-indigo-500 text-white px-8 md:px-12 py-3 md:py-0 rounded-xl md:rounded-full font-black text-xs md:text-base transition-all shadow-2xl active:scale-95 disabled:opacity-50 mt-3 md:mt-0 ${isRtl ? 'md:left-4' : 'md:right-4'}`}>
              {t.chatSend}
            </button>
          </div>
      </div>
    </div>
  );
};

export default DiagnosisReport;
