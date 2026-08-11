namespace ECommerceApi.Entities;

public class IadeTalebi
{
    public int Id { get; set; }
    public int KullaniciId { get; set; }
    public Kullanicilar? Kullanici { get; set; }

    public int SiparisDetayId { get; set; }
    public SiparisDetay? SiparisDetay { get; set; }

    public int MagazaId { get; set; }
    public Magaza? Magaza { get; set; }

    public string IadeSebebi { get; set; } = string.Empty;
    public string Durum { get; set; } = "İade Kodu Oluşturuldu"; 
    public string? RedSebebi { get; set; }
    
    // 🌟 YENİ EKLENEN KARGO ALANLARI
    public string? IadeKargoFirma { get; set; } 
    public string? IadeKargoKodu { get; set; }

    public DateTime OlusturulmaTarihi { get; set; } = DateTime.UtcNow;
}