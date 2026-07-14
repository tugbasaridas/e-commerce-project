
export interface Kategori {
  id: number;
  ad: string;
}

export interface Urun {
  id: number;
  ad: string;
  aciklama?: string;
  fiyat: number;
  indirimliFiyat?: number | null;
  stok: number;
  resimUrl?: string;
  kategoriId: number;
  kategori: Kategori; 
  ortalamaPuan?: number;
  oylamaSayisi?: number;
}