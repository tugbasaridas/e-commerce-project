using ECommerceApi.DTOs;

namespace ECommerceApi.Services;

public interface IAdminService
{
    Task<object> GetDashboardIstatistikleriAsync();
    Task<object> TumSiparisleriGetirAsync();
    Task<(bool Basarili, string Mesaj, string? YeniDurum)> SiparisDurumGuncelleAsync(int id, SiparisDurumGuncelleDTO dto);
    Task<(bool Basarili, string Mesaj)> KullaniciSilAsync(int userId);
    Task<(bool Basarili, string Mesaj)> KullaniciAktiflestirAsync(int userId);
}