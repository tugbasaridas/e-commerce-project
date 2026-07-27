namespace ECommerceApi.DTOs;

// 1. Müşterinin Soru Sorarken Gönderdiği Veri
public class SoruEkleDTO
{
    public int UrunId { get; set; }
    public string SoruMetni { get; set; } = string.Empty;
}

// 2. Ürün Detayında Soruları Listelerken Kullanılan Veri
public class SoruListeleDTO
{
    public int Id { get; set; }
    public string SoruMetni { get; set; } = string.Empty;
    public DateTime SoruTarihi { get; set; }
    public string MusteriAdi { get; set; } = string.Empty; 
    
    public bool CevaplandiMi { get; set; }
    public string? CevapMetni { get; set; }
    public DateTime? CevapTarihi { get; set; }
    public string MagazaAdi { get; set; } = string.Empty;
}

// 3. Satıcının Soruya Cevap Verirken Gönderdiği Veri
public class SoruCevaplaDTO
{
    public string CevapMetni { get; set; } = string.Empty;
}