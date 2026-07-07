namespace ECommerceApi.Entities;

public class Kategori
{
    public int Id { get; set; }
    public string Ad { get; set; } = string.Empty; // Kategori Adı
    
    // Bir kategoride birden fazla ürün olabilir
    public List<Urunler> Urunler { get; set; } = new();
}