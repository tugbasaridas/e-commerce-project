using ECommerceApi.DTOs;

namespace ECommerceApi.Services;

public interface IAdminService
{
    Task<object> GetDashboardIstatistikleriAsync();
    Task<object> TumSiparisleriGetirAsync();
    Task<(bool Basarili, string Mesaj, string? YeniDurum)> SiparisDurumGuncelleAsync(int id, SiparisDurumGuncelleDTO dto);
}