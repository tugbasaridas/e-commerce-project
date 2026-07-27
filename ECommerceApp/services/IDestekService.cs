using ECommerceApi.DTOs;

namespace ECommerceApi.Services;

public interface IDestekService
{
    Task<(bool Basarili, string Mesaj)> YeniTalepOlusturAsync(int userId, DestekTalebiDTO dto);
    Task<object> KullaniciTalepleriniGetirAsync(int userId);
    Task<object> TumTalepleriGetirAdminAsync();
    Task<(bool Basarili, string Mesaj)> TalebiCevaplaAsync(int id, DestekCevapDTO dto);
}