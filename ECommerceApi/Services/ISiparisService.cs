using ECommerceApi.DTOs;

namespace ECommerceApi.Services;

public interface ISiparisService
{
    Task<(bool Basarili, string Mesaj, int? SiparisId)> SiparisOlusturAsync(int userId, SiparisOlusturDto dto);
    Task<object> SiparisGecmisiniGetirAsync(int userId);
    Task<(bool Basarili, string Mesaj)> IadeTalepEtAsync(int userId, IadeTalepDto dto);
    Task<object> IadeTaleplerimiGetirAsync(int userId);
}