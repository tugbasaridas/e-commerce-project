using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ECommerceApi.Entities;

public class Karturun
{
    public int Id { get; set; }

    public int KullaniciId { get; set; }
    
    // [ForeignKey] ile EF Core'a bu alanın KullaniciId ile eşleştiğini söylüyoruz.
    // Böylece "KullanicilarId" diye hayalet bir kolon aramaz.
    [ForeignKey(nameof(KullaniciId))]
    [JsonIgnore] 
    public Kullanicilar? Kullanicilar { get; set; }

    public int UrunId { get; set; }
    
    [ForeignKey(nameof(UrunId))]
    [JsonIgnore]
    public Urunler? Urunler { get; set; }

    public int Miktar { get; set; } = 1;
    public DateTime OlusturulmaTarihi { get; set; } = DateTime.UtcNow;
}