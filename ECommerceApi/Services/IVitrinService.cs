using ECommerceApi.DTOs;
using System.Threading.Tasks;

namespace ECommerceApi.Services;

public interface IVitrinService
{
    Task<object> TumVitrinBannerlariGetirAsync();
    Task<(bool Basarili, string Mesaj)> VitrinBannerEkleAsync(VitrinBannerDto dto);
    Task<(bool Basarili, string Mesaj)> VitrinBannerDurumGuncelleAsync(int id, bool aktifMi);
    Task<(bool Basarili, string Mesaj)> VitrinBannerSilAsync(int id);
    Task<object> IndirimliUrunleriGetirAsync();
    Task<(bool Basarili, string Mesaj)> VitrinBannerSiraGuncelleAsync(int id, int yeniSira);
}