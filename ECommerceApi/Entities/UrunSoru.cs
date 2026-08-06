using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ECommerceApi.Entities;

public class UrunSoru
{
    public int Id { get; set; }
    
    public int UrunId { get; set; }
    [ForeignKey(nameof(UrunId))]
    [JsonIgnore]
    public Urunler? Urun { get; set; }

    public int KullaniciId { get; set; }
    [ForeignKey(nameof(KullaniciId))]
    [JsonIgnore]
    public Kullanicilar? Kullanici { get; set; }

    public string SoruMetni { get; set; } = string.Empty;
    public DateTime SoruTarihi { get; set; } = DateTime.UtcNow;

   
    public string? CevapMetni { get; set; }
    public DateTime? CevapTarihi { get; set; }
    public bool CevaplandiMi { get; set; } = false;
}