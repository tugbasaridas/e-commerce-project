using ECommerceApi.DTOs;

namespace ECommerceApi.Services;

public interface ISiparisService
{
    Task<(bool Basarili, string Mesaj, int? SiparisId)> SiparisOlusturAsync(int userId, SiparisOlusturDto dto);
    Task<object> SiparisGecmisiniGetirAsync(int userId);
}