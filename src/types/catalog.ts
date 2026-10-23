export type ProductCategory = 'tops' | 'bottoms' | 'one-pieces' | 'auto';
export type BackgroundType = 'original' | 'beach' | 'studio' | 'urban' | 'garden' | 'custom';
export type GarmentCaptureMode = 'single' | 'outfit' | 'look_completo';
export type LookItemCategory = 'outerwear' | 'top' | 'bottom' | 'accessory';

export interface LookItem {
  id: string;
  category: LookItemCategory;
  label: string;
  dataUri: string;
  base64Raw: string;
  fileSizeBytes?: number;
}

export type TryOnEngine = 'nano-banana-pro' | 'flux-2-max' | 'fashn-v16';
export type SceneStyle = 'boutique' | 'studio' | 'street' | 'original';
export type ModelMode = 'real' | 'virtual';
export type VirtualModelProfile = 'mediterranean' | 'nordic-studio' | 'andalusian-chic';
export type ShotPackMode = 'single' | 'pack-3';

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
  garmentPhotosBase64: string[];
  garmentPhotoBase64?: string;
  secondaryGarmentPhotoBase64?: string;
  resultImageUrl: string;
  resultImageUrls?: string[];
  shotPackMode?: ShotPackMode;
  instagramCaption: string;
  backgroundType?: BackgroundType;
  isOutfit?: boolean;
  isLookCompleto?: boolean;
  lookItems?: LookItem[];
  modelMode?: ModelMode;
  editorialRepose?: boolean;
  preserveFaceIdentity?: boolean;
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
