using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Entities;

public class Bildirim
{
    [Key]
    public int Id { get; set; }
    
    public int KullaniciId { get; set; }
    
    [ForeignKey("KullaniciId")]
    public Kullanicilar? Kullanici { get; set; }
    
    public string Baslik { get; set; } = string.Empty;
    public string Icerik { get; set; } = string.Empty;
    
    // Türler: "Siparis", "Kupon", "SoruCevap", "Indirim", "Sistem"
    public string BildirimTipi { get; set; } = "Sistem"; 
    
    public string? YonlendirmeLinki { get; set; } 
    
    public bool OkunduMu { get; set; } = false;
    public DateTime Tarih { get; set; } = DateTime.UtcNow;
}