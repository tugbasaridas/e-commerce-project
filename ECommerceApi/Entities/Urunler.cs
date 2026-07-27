namespace ECommerceApi.Entities;

public class Urunler
{
    public int Id { get; set; }
    public string Ad { get; set; } = string.Empty;
    public string? Aciklama { get; set; } = string.Empty;
    public decimal Fiyat { get; set; }
    public decimal? IndirimliFiyat { get; set; }
    public DateTime? IndirimBitisTarihi { get; set; }
    public int Stok { get; set; }
    public string? ResimUrl { get; set; } = string.Empty;
    public DateTime OlusturulmaTarihi { get; set; } = DateTime.UtcNow;
    public bool AdminOnayliMi { get; set; } = false; 
    public bool AktifMi { get; set; } = true;
    
    public int KategoriId { get; set; } 
    public Kategori Kategori { get; set; } = null!;

    public ICollection<Oylama> Oylamalar { get; set; } = new List<Oylama>();
    public ICollection<UrunSoru> Sorular { get; set; } = new List<UrunSoru>();
   
    public int MagazaId { get; set; }
    public Magaza Magaza { get; set; } = null!;
}