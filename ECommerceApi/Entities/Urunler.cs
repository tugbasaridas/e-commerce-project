namespace ECommerceApi.Entities;

public class Urunler
{
    public int Id { get; set; }
    public string Ad { get; set; } = string.Empty; // Ürün Adı
    public string? Aciklama { get; set; } = string.Empty; // Ürün Açıklaması
    public decimal Fiyat { get; set; }
    public int Stok { get; set; }
    public string? ResimUrl { get; set; } = string.Empty;
    public DateTime OlusturulmaTarihi { get; set; } = DateTime.UtcNow;
    
    
    public int KategoriId { get; set; } 
    public Kategori Kategori { get; set; } = null!;
}