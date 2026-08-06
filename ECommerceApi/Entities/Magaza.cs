namespace ECommerceApi.Entities;

public class Magaza
{
    public int Id { get; set; }
    
    // Hangi kullanıcıya ait? (Bire-Bir İlişki)
    public int KullaniciId { get; set; } 
    public Kullanicilar Kullanici { get; set; } = null!;

    // Mağaza Detayları
    public string MagazaAdi { get; set; } = string.Empty;
    public string? VergiNo { get; set; }
    public string? IletisimTelefonu { get; set; }
    public double OrtalamaPuan { get; set; } = 0.0;
    
    public bool OnaylandiMi { get; set; } = false; // Admin onayından geçmeli mi?

    // Mağazanın Sahip Olduğu Ürünler
    public ICollection<Urunler> Urunler { get; set; } = new List<Urunler>();
}