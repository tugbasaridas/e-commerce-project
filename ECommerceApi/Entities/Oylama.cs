using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ECommerceApi.Entities;

public class Oylama
{
    public int Id { get; set; }
    public int Puan { get; set; }
    public int UrunId { get; set; }
    public int KullaniciId { get; set; }

    // İlişkiler
    [ForeignKey(nameof(UrunId))]
    [JsonIgnore]
    public Urunler? Urunler { get; set; }

    [ForeignKey(nameof(KullaniciId))]
    [JsonIgnore]
    public Kullanicilar? Kullanicilar { get; set; }

    public DateTime Tarih { get; set; } = DateTime.UtcNow;
}