namespace ECommerceApi.DTOs;

public class UrunListelemeDTO
{
    public int Id { get; set; }
    public string Ad { get; set; } = string.Empty;
    public string? Aciklama { get; set; }
    public decimal Fiyat { get; set; }
    public decimal? IndirimliFiyat { get; set; }
    public string? ResimUrl { get; set; }
    public int KategoriId { get; set; }
    public object? Kategori { get; set; } 
    public double OrtalamaPuan { get; set; }
    public int OylamaSayisi { get; set; }
}