namespace ECommerceApi.Services;

public interface IBildirimService
{
    Task BildirimGonderAsync(int kullaniciId, string baslik, string icerik, string bildirimTipi, string? yonlendirmeLinki = null);
    Task<object> KullaniciBildirimleriniGetirAsync(int kullaniciId);
    Task<int> OkunmamisBildirimSayisiGetirAsync(int kullaniciId);
    Task OkunduIsaretleAsync(int bildirimId, int kullaniciId);
    Task TumunuOkunduIsaretleAsync(int kullaniciId);
}