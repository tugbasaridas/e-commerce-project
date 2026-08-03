namespace ECommerceApi.Entities;

public class KullaniciKupon
{
    public int Id { get; set; }
    public int KullaniciId { get; set; }
    public int KuponId { get; set; }
    public bool KullanildiMi { get; set; } = false;
    public DateTime TanimlanmaTarihi { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public Kullanicilar? Kullanici { get; set; }
    public Kupon? Kupon { get; set; }
}