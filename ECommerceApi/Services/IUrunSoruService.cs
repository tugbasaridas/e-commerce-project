using ECommerceApi.DTOs;

namespace ECommerceApi.Services;

public interface IUrunSoruService
{
    // Müşterinin ürüne soru sorması
    Task<(bool Basarili, string Mesaj)> SoruSorAsync(int kullaniciId, SoruEkleDTO dto);
    
    // Ürün detay sayfasında o ürüne ait soruları listeleme
    Task<object> UrunSorulariniGetirAsync(int urunId);
    
    // Satıcının KENDİ mağazasına gelen soruları listelemesi
    Task<object> SaticiSorulariniGetirAsync(int saticiKullaniciId);
    
    // Satıcının soruya cevap vermesi
    Task<(bool Basarili, string Mesaj)> SoruCevaplaAsync(int saticiKullaniciId, int soruId, SoruCevaplaDTO dto);
}