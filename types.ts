
export type Language = 'ar' | 'en' | 'fr';

export type AnalysisDepth = 'standard' | 'academic' | 'deep_clinical';
export type MedicalFocus = 'general' | 'orthopedic' | 'neurology' | 'cardiology' | 'oncology';
export type VisualTheme = 'dark-clinical' | 'light-medical' | 'high-contrast-surgical';
export type ReportLayout = 'modern_platinum' | 'classic_medical' | 'compact_summary';
export type ClinicalStandard = 'standard' | 'who' | 'academic_strict';
export type AnalysisMode = 'precision' | 'balanced' | 'turbo'; // New: Control Speed vs Quality

export interface AppSettings {
  // Core AI
  analysisMode: AnalysisMode; // New setting
  depth: AnalysisDepth;
  focus: MedicalFocus;
  aiCreativity: number;
  confidenceThreshold: number;
  thinkingBudget: number; // For advanced reasoning
  secondaryOpinion: boolean; // Double-check pass
  
  // Clinical
  standard: ClinicalStandard;
  enabledSections: {
    findings: boolean;
    roadmap: boolean;
    expertBoard: boolean;
    risks: boolean;
    differential: boolean;
    icd10: boolean;
  };

  // Interface
  theme: VisualTheme;
  layout: ReportLayout;
  fontSize: 'small' | 'medium' | 'large' | 'extra';
  autoSave: boolean;
  autoNarrate: boolean;
  enableImageTools: boolean; // Enable zoom/contrast tools
  defaultOverlay: boolean;   // Show damage markers by default
  
  // New Advanced Tools
  enableMagnifier: boolean; // Enable medical loupe tool
  enableGridOverlay: boolean; // Enable measurement grid
  enableAdvancedFilters: boolean; // Enable bone/tissue filters

  // Privacy
  privacyMode: boolean; // Anonymize data in prompts
}

export interface ExpertPerspective {
  specialty: string;
  insight: string;
  priority: 'low' | 'medium' | 'high';
}

export interface RoadmapStep {
  phase: string;
  duration: string;
  actions: string[];
}

export interface DifferentialDiagnosis {
  condition: string;
  probability: number;
  reasoning: string;
}

export interface RiskAssessment {
  factor: string;
  level: 'low' | 'medium' | 'high';
  percentage: number;
}

export interface DiagnosisResult {
  findings?: string;
  impression?: string;
  recommendations?: string[];
  certaintyScore?: number;
  detectedIssues?: string[];
  icd10Codes?: { code: string; description: string }[];
  patientSummary?: string;
  prognosis?: string;
  triageLevel?: 'critical' | 'urgent' | 'stable';
  expertBoard?: ExpertPerspective[];
  recoveryRoadmap?: RoadmapStep[];
  detectedCoordinates?: { x: number; y: number; label: string }[];
  differentialDiagnoses?: DifferentialDiagnosis[];
  riskAssessment?: RiskAssessment[];
  error?: string;
}

export interface PatientBio {
  patientId: string;
  firstName: string;
  lastName: string;
  dob: string;
  age: number;
  preExistingConditions: string;
  clinicalNotes: string;
}

export interface MedicalImage {
  id: string;
  url: string;
  base64: string;
  type: string;
  name: string;
  timestamp: Date;
}

export interface ArchivedReport {
  id: string;
  timestamp: string;
  patientBio: PatientBio;
  result: DiagnosisResult;
  images: MedicalImage[];
}

export enum AnalysisStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error',
  INVALID_IMAGE = 'invalid_image'
}
