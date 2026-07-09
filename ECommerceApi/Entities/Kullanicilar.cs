namespace ECommerceApi.Entities;

public class Kullanicilar
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string SifreHash { get; set; } = string.Empty; 
    public string? AdSoyad { get; set; } = string.Empty;
    public string Rol { get; set; } = "Kullanici"; 
    public DateTime OlusturulmaTarihi { get; set; } = DateTime.UtcNow;
}