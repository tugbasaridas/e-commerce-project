export interface DestekTalebi {
  id: number;
  kullaniciAdi: string;
  kullaniciEmail: string;
  gonderenRol?: string;
  konu: string;
  mesaj: string;
  adminCevabi: string | null;
  durum: string;
  olusturulmaTarihi: string;
}