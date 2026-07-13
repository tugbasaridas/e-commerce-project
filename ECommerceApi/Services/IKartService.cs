using ECommerceApi.DTOs;

namespace ECommerceApi.Services;

public interface IKartService
{
    Task<object> SepetiGetirAsync(int userId);
    Task<(bool Basarili, string Mesaj)> SepeteEkleAsync(int userId, SepeteEkleDTO dto);
    Task<(bool Basarili, string Mesaj)> SepettenSilAsync(int userId, int id);
    Task<(bool Basarili, string Mesaj)> MiktarGuncelleAsync(int userId, int id, MiktarGuncelleDTO dto);
}