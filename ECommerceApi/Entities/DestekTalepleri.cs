using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerceApi.Entities;

public class DestekTalepleri
{
    [Key]
    public int Id { get; set; }

    // Hangi kullanıcının mesaj attığını bilmek için
    public int KullaniciId { get; set; }

    [ForeignKey("KullaniciId")]
    public Kullanicilar Kullanici { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string Konu { get; set; } = string.Empty;

    [Required]
    public string Mesaj { get; set; } = string.Empty;

    // Admin ilk başta cevap vermediği için nullable (soru işareti) yapıyoruz
    public string? AdminCevabi { get; set; } 

    [MaxLength(20)]
    public string Durum { get; set; } = "Bekliyor"; // Bekliyor, Cevaplandı gibi durumları tutacak

    public DateTime OlusturulmaTarihi { get; set; } = DateTime.UtcNow;

    public DateTime? CevaplanmaTarihi { get; set; } 
}