
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { DiagnosisResult, MedicalImage, PatientBio, Language, AppSettings } from "../types";

// Initialize AI strictly from environment variable
const apiKey = process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// --- Helper: Compress Image to reduce payload size and timeouts ---
const compressImage = async (base64Str: string, maxWidth = 1536, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = `data:image/jpeg;base64,${base64Str}`;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Returns full data URL, we need to split to get just base64
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl.split(',')[1]); 
      } else {
        resolve(base64Str); // Fallback
      }
    };
    img.onerror = () => resolve(base64Str); // Fallback
  });
};

// --- Helper: Retry Logic ---
const retryOperation = async <T>(operation: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retries <= 0) throw error;
    console.log(`Retrying operation... Attempts left: ${retries}`);
    await new Promise(res => setTimeout(res, delay));
    return retryOperation(operation, retries - 1, delay * 2); // Exponential backoff
  }
};

export const analyzeMedicalCase = async (
  images: MedicalImage[], 
  bio: PatientBio,
  lang: Language = 'ar',
  settings: AppSettings
): Promise<DiagnosisResult> => {
  
  if (!ai) {
    throw new Error("API_KEY_MISSING");
  }

  // Optimize Images before sending
  const processedImages = await Promise.all(
    images.map(async (img) => ({
      inlineData: { 
        mimeType: "image/jpeg", 
        data: await compressImage(img.base64) 
      }
    }))
  );

  const languageNames = {
    'ar': 'Arabic (العربية)',
    'en': 'English',
    'fr': 'French (Français)'
  };

  // Model Selection Strategy based on Analysis Mode
  let selectedModel = "gemini-3-pro-preview"; // Default Precision
  let effectiveBudget = settings.thinkingBudget;

  if (settings.analysisMode === 'turbo') {
    selectedModel = "gemini-2.5-flash-latest"; // Very fast, no thinking config supported usually, or lightweight
    effectiveBudget = 0; // Disable thinking for speed
  } else if (settings.analysisMode === 'balanced') {
    selectedModel = "gemini-3-flash-preview"; // Good balance
    effectiveBudget = Math.min(settings.thinkingBudget, 8000); // Cap budget for speed
  }

  const focusPrompts = {
    general: "Senior General Radiologist",
    orthopedic: "Senior Orthopedic Surgeon & Spine Specialist",
    neurology: "Neuro-Radiology Specialist",
    cardiology: "Cardiac Imaging Expert",
    oncology: "Oncology Diagnostic Consultant"
  };

  const standardInstruction = {
    standard: "Follow standard international radiology reporting guidelines.",
    who: "Adhere strictly to World Health Organization (WHO) clinical classification and terminology.",
    academic_strict: "Use highly rigorous academic medical terminology with references to physiological mechanisms."
  };

  const depthPrompts = {
    standard: "Provide a clear clinical report.",
    academic: "Provide a technical report with deep physiological analysis.",
    deep_clinical: "Provide an exhaustive diagnostic bulletin with micro-observations and multi-layered prognosis."
  };

  // Privacy Filter
  const patientData = settings.privacyMode 
    ? "ANONYMOUS_PATIENT (Gender/Age preserved)" 
    : `${bio.firstName} ${bio.lastName}`;

  const systemInstruction = `
    ROLE: ${focusPrompts[settings.focus]}. 
    STANDARD: ${standardInstruction[settings.standard]}.
    DEPTH: ${depthPrompts[settings.depth]}.
    INSTRUCTION: Analyze medical scans for ${patientData}. 
    
    EXPERT BOARD PROTOCOL: When generating 'expertBoard', you MUST provide a diverse panel of 3 to 5 distinct specialist perspectives.
    
    ${settings.secondaryOpinion && settings.analysisMode !== 'turbo' ? "MANDATORY: Perform an internal verification pass." : ""}
    CONFIDENCE_THRESHOLD: ${settings.confidenceThreshold}.
    ${!settings.enabledSections.icd10 ? "DO NOT include ICD-10 codes." : ""}
    STRICT JSON RESPONSE ONLY. Language: ${languageNames[lang]}.
  `;

  // Define the schema once
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      findings: { type: Type.STRING },
      prognosis: { type: Type.STRING },
      certaintyScore: { type: Type.NUMBER },
      triageLevel: { type: Type.STRING },
      expertBoard: settings.enabledSections.expertBoard ? {
        type: Type.ARRAY,
        description: "A panel of 3-5 distinct medical specialists providing targeted insights.",
        items: {
          type: Type.OBJECT,
          properties: {
            specialty: { type: Type.STRING },
            insight: { type: Type.STRING },
            priority: { type: Type.STRING }
          }
        }
      } : undefined,
      recoveryRoadmap: settings.enabledSections.roadmap ? {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            phase: { type: Type.STRING },
            duration: { type: Type.STRING },
            actions: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      } : undefined,
      differentialDiagnoses: settings.enabledSections.differential ? {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            condition: { type: Type.STRING },
            probability: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          }
        }
      } : undefined,
      riskAssessment: settings.enabledSections.risks ? {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            factor: { type: Type.STRING },
            level: { type: Type.STRING },
            percentage: { type: Type.NUMBER }
          }
        }
      } : undefined,
      icd10Codes: settings.enabledSections.icd10 ? {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            code: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        }
      } : undefined,
      detectedCoordinates: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            x: { type: Type.NUMBER },
            y: { type: Type.NUMBER },
            label: { type: Type.STRING }
          }
        }
      }
    }
  };

  const apiCall = async () => {
    // Config construction based on model capabilities
    const config: any = {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      temperature: settings.aiCreativity,
      responseSchema: responseSchema,
    };

    // Only add thinking config if supported and not turbo
    if (settings.analysisMode !== 'turbo' && effectiveBudget > 0) {
      config.thinkingConfig = { thinkingBudget: effectiveBudget };
    }

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: {
        parts: [
          { text: `Clinical Request for ID ${bio.patientId}. Notes: ${bio.clinicalNotes}.` },
          ...processedImages
        ]
      },
      config: config
    });

    return JSON.parse(response.text);
  };

  // Execute with Retry
  try {
    return await retryOperation(apiCall);
  } catch (error) {
    console.error("Clinical Analysis Error (Final):", error);
    throw error;
  }
};

export const generateVocalSummary = async (text: string, lang: Language): Promise<string> => {
  if (!ai) return "";

  const voiceMap = { 'ar': 'Kore', 'en': 'Zephyr', 'fr': 'Puck' };
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceMap[lang] } }
        }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (e) {
    console.error("TTS Error", e);
    return "";
  }
};

export const askFollowUpQuestion = async (question: string, context: DiagnosisResult, images: MedicalImage[], lang: Language): Promise<string> => {
  if (!ai) return "Error: API Key Missing.";

  try {
    // Compress for chat as well
    const processedImages = await Promise.all(
      images.map(async (img) => ({
        inlineData: { 
          mimeType: "image/jpeg", 
          data: await compressImage(img.base64, 1024) 
        }
      }))
    );

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Use faster model for chat
      contents: {
        parts: [
          { text: `Medical Context: ${context.findings}. Answer in ${lang}: ${question}` },
          ...processedImages
        ]
      }
    });
    return response.text || "Diagnostic error.";
  } catch (e) {
    return "Connection error.";
  }
};
