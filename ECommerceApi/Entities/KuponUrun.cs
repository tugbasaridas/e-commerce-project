namespace ECommerceApi.Entities;

public class KuponUrun
{
    public int Id { get; set; }
    
    public int KuponId { get; set; }
    public Kupon? Kupon { get; set; }
    
    public int UrunId { get; set; }
    public Urunler? Urun { get; set; }
}