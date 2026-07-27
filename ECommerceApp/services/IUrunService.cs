using ECommerceApi.DTOs;
using ECommerceApi.Entities;

namespace ECommerceApi.Services;

public interface IUrunService
{
    
    Task<List<UrunListelemeDTO>> TumUrunleriGetirAsync();
    Task<object?> UrunGetirByIdAsync(int id);
    Task<(bool Basarili, string Mesaj)> UrunOylaAsync(int urunId, int userId, int puan, string? yorum = null);
    Task<List<UrunListelemeDTO>> IndirimliUrunleriGetirAsync();
    
    
}