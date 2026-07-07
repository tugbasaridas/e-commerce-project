

export interface SiparisUrun {
  ad: string;
  resimUrl: string;
  adet: number;
  satinAlinanFiyat: number;
}

export interface Siparis {
  id: number;
  siparisTarihi: string;
  toplamTutar: number;
  durum: string;
  urunler: SiparisUrun[];
}

export interface AdminSiparis {
  id: number;
  siparisTarihi: string;
  toplamTutar: number;
  durum: string;
  urunler: any[]; 
}