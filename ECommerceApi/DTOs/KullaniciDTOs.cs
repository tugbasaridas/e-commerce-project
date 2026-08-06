using System.ComponentModel.DataAnnotations;

namespace ECommerceApi.DTOs;

public record KayitDTO(
    [Required(ErrorMessage = "Ad Soyad alanı zorunludur.")]
    [MinLength(3, ErrorMessage = "Ad Soyad en az 3 karakterden oluşmalıdır.")]
    string AdSoyad,

    [Required(ErrorMessage = "E-posta alanı zorunludur.")]
    [EmailAddress(ErrorMessage = "Lütfen geçerli bir e-posta adresi giriniz.")]
    string Email,

    [Required(ErrorMessage = "Şifre alanı zorunludur.")]
    [MinLength(6, ErrorMessage = "Şifreniz en az 6 karakter uzunluğunda olmalıdır.")]
    [RegularExpression(@"^(?=.*[A-Z])(?=.*\d).+$", ErrorMessage = "Şifreniz daha güvenli olması için en az bir büyük harf ve bir rakam içermelidir.")]
    string Sifre
);

public record GirisDTO(
    [Required(ErrorMessage = "E-posta alanı zorunludur.")]
    string Email, 
    
    [Required(ErrorMessage = "Şifre alanı zorunludur.")]
    string Sifre
);



// --- YENİ EKLENEN DTO'LAR ---
public record SifremiUnuttumDto(
    [Required(ErrorMessage = "E-posta adresi zorunludur.")]
    [EmailAddress(ErrorMessage = "Geçerli bir e-posta adresi giriniz.")]
    string Email
);

public record SifreSifirlaDto(
    [Required(ErrorMessage = "E-posta adresi zorunludur.")]
    string Email,
    
    [Required(ErrorMessage = "Sıfırlama kodu zorunludur.")]
    string Kod,
    
    [Required(ErrorMessage = "Yeni şifre alanı zorunludur.")]
    [MinLength(6, ErrorMessage = "Şifreniz en az 6 karakter uzunluğunda olmalıdır.")]
    [RegularExpression(@"^(?=.*[A-Z])(?=.*\d).+$", ErrorMessage = "Şifreniz daha güvenli olması için en az bir büyük harf ve bir rakam içermelidir.")]
    string YeniSifre
);