namespace ECommerceApi.DTOs;

public class IadeTalepDto
{
    public int SiparisDetayId { get; set; } 
    public string IadeSebebi { get; set; } = string.Empty;
}

public class IadeDurumGuncelleDto
{
    public int IadeId { get; set; }
    // "TeslimAl", "Onayla" veya "Reddet" aksiyonlarından biri gelecek
    public string Islem { get; set; } = string.Empty; 
    public string? RedSebebi { get; set; }
}