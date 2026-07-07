
export interface Kategori {
  id: number;
  ad: string;
}

export interface Urun {
  id: number;
  ad: string;
  aciklama?: string;
  fiyat: number;
  stok: number;
  resimUrl?: string;
  kategoriId: number;
  kategori: Kategori; 
}