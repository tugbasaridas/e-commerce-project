using System.ComponentModel.DataAnnotations;

namespace ECommerceApi.DTOs;

public class MagazaBasvuruDto
{
    [Required(ErrorMessage = "Ad Soyad zorunludur.")]
    public string AdSoyad { get; set; } = string.Empty;

    [Required(ErrorMessage = "E-posta adresi zorunludur.")]
    [EmailAddress(ErrorMessage = "Lütfen geçerli bir e-posta adresi giriniz.")] 
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Şifre zorunludur.")]
    public string Sifre { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mağaza Adı zorunludur.")]
    public string MagazaAdi { get; set; } = string.Empty;

    public string? VergiNo { get; set; }
    public string? IletisimTelefonu { get; set; }
}