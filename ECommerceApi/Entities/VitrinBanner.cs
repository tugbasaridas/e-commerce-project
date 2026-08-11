using System;
using System.ComponentModel.DataAnnotations;

namespace ECommerceApi.Entities;

public class VitrinBanner
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public string ResimUrl { get; set; } = string.Empty;
    
    [Required]
    public string Baslik { get; set; } = string.Empty; 
    
    // Yönlendirme Türü: "Magaza", "Kategori", "Urun" veya "Yok"
    public string YonlendirmeTuru { get; set; } = string.Empty; 
    
    // Gideceği hedefin ID numarası
    public int? HedefId { get; set; } 
    
    public int SiraNo { get; set; }
    public bool AktifMi { get; set; } = true;
    public DateTime OlusturulmaTarihi { get; set; } = DateTime.UtcNow;
}