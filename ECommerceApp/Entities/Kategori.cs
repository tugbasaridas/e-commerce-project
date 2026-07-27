namespace ECommerceApi.Entities;

public class Kategori
{
    public int Id { get; set; }
    public string Ad { get; set; } = string.Empty; 
    
    // TRENDYOL DETAYI: Alt Kategori Mantığı (Örn: Giyim -> Kadın -> Elbise)
    public int? UstKategoriId { get; set; }
    public Kategori? UstKategori { get; set; }
    public ICollection<Kategori> AltKategoriler { get; set; } = new List<Kategori>();
    
    public List<Urunler> Urunler { get; set; } = new();
}