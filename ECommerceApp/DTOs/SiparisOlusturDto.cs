namespace ECommerceApi.DTOs;

public class SiparisOlusturDto
{
    public string OdemeYontemi { get; set; } = "Kredi Kartı";
    public string TeslimatAdresi { get; set; } = string.Empty;
    public string Telefon { get; set; } = string.Empty;
}
public class SiparisDetayGuncelleDTO
{
    public string YeniDurum { get; set; } = string.Empty;
    public string? KargoFirma { get; set; }
    public string? KargoTakipNo { get; set; }
}