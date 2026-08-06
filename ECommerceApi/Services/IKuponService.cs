using ECommerceApi.DTOs;

public interface IKuponService
{
    // Kupon oluştururken opsiyonel ürün ID listesini ekledik
    Task<(bool Basarili, string Mesaj)> KuponOlusturAsync(KuponOlusturDto dto, string olusturanRol, int? magazaId, List<int>? secilenUrunIds = null);
    
    Task<(bool Basarili, string Mesaj, string KuponKodu)> MagazaTakipEtVeKuponKazanAsync(int kullaniciId, int magazaId);
    Task<(bool Basarili, string Mesaj)> YeniKullaniciyaHosgeldinKuponuVerAsync(int kullaniciId);
    Task<object> KullaniciKuponlariniGetirAsync(int kullaniciId);
    Task<(bool Basarili, string Mesaj, decimal IndirimTutari, int? KuponId)> KuponUygulaDetayliAsync(int kullaniciId, string kuponKodu, decimal sepetToplami, List<SepetUrunDto> sepetUrunleri);
    Task<object> YoneticiKuponlariniGetirAsync(int userId, string rol);
    Task<(bool Basarili, string Mesaj)> KuponSilAsync(int kuponId, int userId, string rol);
    Task<(bool Basarili, string Mesaj)> KullanicilaraKuponTanimlaAsync(int kuponId, List<int> kullaniciIdleri);
    Task<object> UrununKuponlariniGetirAsync(int urunId);
}