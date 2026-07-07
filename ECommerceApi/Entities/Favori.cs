using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ECommerceApi.Entities;

public class Favori
{
    public int Id { get; set; }

    // ForeignKey belirterek EF Core'un KullanicilarId kolonunu 
    // otomatik oluşturmasını ve doğru eşleştirmesini sağlıyoruz.
    public int KullaniciId { get; set; }
    
    [ForeignKey(nameof(KullaniciId))]
    [JsonIgnore] 
    public Kullanicilar? Kullanicilar { get; set; } 

    public int UrunId { get; set; }
    
    [ForeignKey(nameof(UrunId))]
    [JsonIgnore]
    public Urunler? Urunler { get; set; } 

    public DateTime OlusturulmaTarihi { get; set; } = DateTime.UtcNow;
}