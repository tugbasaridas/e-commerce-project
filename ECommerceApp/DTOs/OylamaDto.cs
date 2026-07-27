namespace ECommerceApi.DTOs;

public class OylamaDto
{
    public int Puan { get; set; }
    public string? Yorum { get; set; }
}

public class IndirimDto
{
    public decimal YeniFiyat { get; set; }
    public int Saat { get; set; }
}