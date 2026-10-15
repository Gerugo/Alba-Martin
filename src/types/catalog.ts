export type ProductCategory = 'tops' | 'bottoms' | 'one-pieces' | 'auto';
export type BackgroundType = 'original' | 'beach' | 'studio' | 'urban' | 'garden' | 'custom';
export type GarmentCaptureMode = 'single' | 'outfit';

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
