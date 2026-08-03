namespace ECommerceApi.Entities;

public class Takipci
{
    public int Id { get; set; }
    public int KullaniciId { get; set; }
    public int MagazaId { get; set; }
    public DateTime TakipTarihi { get; set; } = DateTime.UtcNow;

    public Kullanicilar? Kullanici { get; set; }
    public Magaza? Magaza { get; set; }
}