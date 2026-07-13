namespace ECommerceApi.DTOs;

public class UrunEkleDTO
{
    public string Ad { get; set; } = string.Empty;
    public string? Aciklama { get; set; }
    public decimal Fiyat { get; set; }
    public int Stok { get; set; }
    public string? ResimUrl { get; set; }
    public int KategoriId { get; set; }
}