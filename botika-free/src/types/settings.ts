import { FreeEngineType } from './fashion';

export interface BotikaFreeSettings {
  engine: FreeEngineType;
  // Hugging Face Space Gradio endpoint (default: yisol/IDM-VTON)
  hfSpaceEndpoint: string;
  // Google Colab free tunnel URL (e.g., https://xyz.trycloudflare.com)
  colabTunnelUrl: string;
  // Google Gemini API Key for Free Tier Vision Analysis, SEO copy & Tagging
  geminiApiKey: string;
  geminiModel: string;
  // Store branding for exports
  storeName: string;
  storePhone: string;
  // General flags
  autoTagging: boolean;
  generate3Shots: boolean; // Hero, Side motion, Detail macro
}

export const DEFAULT_SETTINGS: BotikaFreeSettings = {
  engine: 'hf-gradio',
  hfSpaceEndpoint: 'yisol/IDM-VTON',
  colabTunnelUrl: '',
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  storeName: 'ATELIER MODA',
  storePhone: '34600000000',
  autoTagging: true,
  generate3Shots: true,
};
