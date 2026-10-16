export type ProductCategory = 'tops' | 'bottoms' | 'one-pieces' | 'auto';
export type BackgroundType = 'original' | 'beach' | 'studio' | 'urban' | 'garden' | 'custom';
export type GarmentCaptureMode = 'single' | 'outfit';
export type TryOnEngine = 'nano-banana-pro' | 'flux-2-max' | 'fashn-v16';
export type SceneStyle = 'boutique' | 'studio' | 'street' | 'original';
export type ModelMode = 'real' | 'virtual';
export type VirtualModelProfile = 'mediterranean' | 'nordic-studio' | 'andalusian-chic';

export interface CatalogProduct {
  id: string;
  createdAt: string;
  title: string;
  handle: string;
  descriptionHtml: string;
  vendor: string;
  productCategory: ProductCategory;
  tags: string[];
  price: number;
  sizes: string[];
  skuPrefix: string;
  modelPhotoBase64: string;
  garmentPhotoBase64: string;
  secondaryGarmentPhotoBase64?: string;
  resultImageUrl: string;
  instagramCaption: string;
  backgroundType?: BackgroundType;
  isOutfit?: boolean;
  modelMode?: ModelMode;
  editorialRepose?: boolean;
  virtualModel?: VirtualModelProfile;
}

export interface DemoSettings {
  falKey: string;
  geminiKey: string;
  storeName: string;
  storePhone: string;
  simulationMode: boolean;
  geminiModel?: string;
}

export interface CompressedImageResult {
  dataUri: string;
  base64Raw: string;
  mimeType: string;
  fileSizeBytes: number;
  originalSizeBytes: number;
  width: number;
  height: number;
}
