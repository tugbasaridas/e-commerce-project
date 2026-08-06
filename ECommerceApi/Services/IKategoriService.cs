using ECommerceApi.Entities;
using ECommerceApi.DTOs;

namespace ECommerceApi.Services;

public interface IKategoriService
{
    Task<object> GetKategorilerAsync();
    Task<object> GetTumKategorilerDuzAsync();
    Task<(bool Basarili, string Mesaj)> KategoriEkleAsync(KategoriEkledto dto);
   Task<(bool Basarili, string Mesaj)> KategoriSilAsync(int id);
}