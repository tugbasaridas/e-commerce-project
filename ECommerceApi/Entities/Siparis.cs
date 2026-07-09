using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ECommerceApi.Entities;
public class Siparis
{
    public int Id { get; set; }
    public int KullaniciId { get; set; }
    public DateTime SiparisTarihi { get; set; } = DateTime.UtcNow;
    public decimal ToplamTutar { get; set; }
    public string Durum { get; set; } = "Hazırlanıyor"; 
    public string OdemeYontemi { get; set; } = "Kredi Kartı";
    public string TeslimatAdresi { get; set; } = string.Empty;
    public List<SiparisDetay> Detaylar { get; set; } = new();

}

public class SiparisDetay
{
    public int Id { get; set; }
    public int SiparisId { get; set; }
    
   
    [ForeignKey(nameof(SiparisId))]
    [JsonIgnore]
    public Siparis? Siparis { get; set; } 

    [ForeignKey(nameof(UrunId))]
    public Urunler? Urunler { get; set; }
    
    public int UrunId { get; set; }
    public int Adet { get; set; }
    public decimal BirimFiyat { get; set; }
}