export type ProductCategory = 'upper_body' | 'lower_body' | 'dresses' | 'outerwear' | 'auto';

export type FreeEngineType = 
  | 'hf-gradio'      // Hugging Face Spaces (IDM-VTON / CatVTON via Gradio client - 100% Free)
  | 'colab-tunnel'   // Google Colab Free GPU T4 Backend via Cloudflare Tunnel
  | 'simulation';    // Instant test mode with high-res editorial presets

export type ModelGender = 'female' | 'male';

export type ModelEthnicity = 
  | 'caucasian'
  | 'latina'
  | 'afro'
  | 'asian'
  | 'mediterranean'
  | 'scandinavian';

export type ModelBodyType = 'standard' | 'petite' | 'curvy' | 'athletic';

export type ModelPose = 'front_lookbook' | 'side_stride' | 'macro_detail' | 'hands_in_pocket';

export interface AIModelProfile {
  id: string;
  name: string;
  gender: ModelGender;
  ethnicity: ModelEthnicity;
  bodyType: ModelBodyType;
  description: string;
  avatarUrl: string;       // Thumbnail for model picker
  fullBodyUrl: string;     // Base model photo for VTON pipeline
  recommendedScenes: string[];
}

export type ScenePreset = 
  | 'studio_minimal'
  | 'boutique_luxury'
  | 'urban_paris'
  | 'mediterranean_sun'
  | 'loft_minimalist'
  | 'nature_garden'
  | 'keep_original';

export interface SceneConfig {
  id: ScenePreset;
  name: string;
  description: string;
  thumbnail: string;
  promptDescription: string;
}

export interface GarmentData {
  dataUri: string;
  base64Raw: string;
  fileSizeBytes: number;
  category: ProductCategory;
  titleSuggestion?: string;
  colorSuggestion?: string;
}

export interface GeneratedCatalogItem {
  id: string;
  createdAt: string;
  title: string;
  handle: string;
  descriptionHtml: string;
  tags: string[];
  price: number;
  sizes: string[];
  vendor: string;
  category: ProductCategory;
  modelProfile: AIModelProfile;
  scene: ScenePreset;
  engineUsed: FreeEngineType;
  garmentOriginalDataUri: string;
  resultHeroUrl: string;
  resultSideUrl?: string;
  resultDetailUrl?: string;
  instagramCaption: string;
  whatsappMessage: string;
}
