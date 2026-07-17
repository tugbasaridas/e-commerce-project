using ECommerceApi.Entities;

namespace ECommerceApi.Services;

public interface IKategoriService
{
    Task<List<Kategori>> GetKategorilerAsync();
    Task<Kategori> KategoriEkleAsync(Kategori yeniKategori);
    Task<(bool Basarili, string Mesaj)> KategoriSilAsync(int id);
}