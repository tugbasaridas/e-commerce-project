namespace ECommerceApi.DTOs;

public class KuponOlusturDto
{
    public string Kodu { get; set; } = string.Empty;
    public string IndirimTipi { get; set; } = string.Empty; 
    public decimal IndirimDegeri { get; set; }
    public decimal AltLimit { get; set; }
    public int GecerlilikGunu { get; set; } = 30; 
    public List<int>? SecilenUrunIds { get; set; } = new();
    
    // YENİ EKLENDİ
    public bool HerkeseAcikMi { get; set; } = true; 
}

public class KuponUygulaDto
{
    public string KuponKodu { get; set; } = string.Empty;
    public decimal SepetToplami { get; set; }
    public List<SepetUrunDto> SepetUrunleri { get; set; } = new();
}

public class KuponTanimlaDto
{
    public int KuponId { get; set; }
    public List<int> KullaniciIdleri { get; set; } = new List<int>();
}