namespace ECommerceApi.DTOs;

public class SaticiUrunEkleDto
{
    public string Ad { get; set; } = string.Empty;
    public string? Aciklama { get; set; } = string.Empty;
    public decimal Fiyat { get; set; }
    public int Stok { get; set; }
    public int KategoriId { get; set; }
    public string? ResimUrl { get; set; } = string.Empty;
}