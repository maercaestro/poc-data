export interface Price {
  value: number | null;
  currency: 'MYR' | string;
}

export interface Size {
  value: number | null;
  unit: 'g' | 'kg' | 'ml' | 'l' | 'pcs' | 'pack' | null;
}

export type ItemStatus = 'ai' | 'edited' | 'verified';

export interface CatalogItem {
  id: number;
  bbox: [number, number, number, number];
  name: string | null;
  brand: string | null;
  variants: string[] | null;
  price: Price;
  size: Size;
  barcode: string | null;
  tags: string[] | null;
  raw_text: string | null;
  confidence: number;
  status: ItemStatus;
}

export interface CatalogPage {
  source_id: string;
  page: number;
  page_width: number;
  page_height: number;
  items: CatalogItem[];
}
