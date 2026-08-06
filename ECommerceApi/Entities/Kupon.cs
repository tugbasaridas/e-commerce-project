namespace ECommerceApi.Entities;

public class Kupon
{
    public int Id { get; set; }
    
    // Müşterinin ekrana gireceği veya sistemin otomatik üreteceği kod (Örn: HOSGELDIN100, YAZ20)
    public string Kodu { get; set; } = string.Empty; 
    
    // Kuponu kimin oluşturduğu: "Admin" veya "Satici"
    public string OlusturanRol { get; set; } = string.Empty; 
    
    // Eğer Admin oluşturduysa (tüm sitede geçerliyse) NULL olur. 
    // Eğer Satıcı oluşturduysa (sadece kendi ürünlerinde geçerliyse) mağaza ID'si yazar.
    public int? MagazaId { get; set; } 
    
    public string IndirimTipi { get; set; } = string.Empty; 
    public decimal IndirimDegeri { get; set; } 
    public decimal AltLimit { get; set; } 
    public DateTime? BitisTarihi { get; set; }
    public bool AktifMi { get; set; } = true;

    // YENİ EKLENEN GÜVENLİK ALANI:
    // true: Herkes kodu yazıp kullanabilir. (Ürüne özel genel kupon)
    // false: Sadece cüzdanına gönderilen VIP/Takipçi kitle kullanabilir.
    public bool HerkeseAcikMi { get; set; } = true;

    // --- Entity Framework İlişkileri ---
    public Magaza? Magaza { get; set; }
    public ICollection<KullaniciKupon>? KullaniciKuponlari { get; set; }
    public ICollection<KuponUrun>? KuponUrunleri { get; set; }
}