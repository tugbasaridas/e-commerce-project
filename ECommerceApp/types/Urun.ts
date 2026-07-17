export interface Kategori {
  id: number;
  ad: string;
}

// YENİ EKLENDİ: Yorumların veri tipini belirleyen yapı
export interface Yorum {
  id: number;
  puan: number;
  yorumMetni?: string;
  tarih: string;
  kullaniciAdi: string;
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
  
  // YENİ EKLENDİ: Ürüne ait yorumlar listesi
  yorumlar?: Yorum[];
}