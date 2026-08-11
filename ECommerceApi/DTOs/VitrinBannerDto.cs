namespace ECommerceApi.DTOs;

public class VitrinBannerDto
{
    public string ResimUrl { get; set; } = string.Empty;
    public string Baslik { get; set; } = string.Empty;
    public string YonlendirmeTuru { get; set; } = string.Empty;
    public int? HedefId { get; set; }
    public int SiraNo { get; set; }
    public bool AktifMi { get; set; }
}