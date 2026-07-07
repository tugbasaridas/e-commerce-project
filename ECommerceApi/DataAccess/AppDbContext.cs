using ECommerceApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace ECommerceApi.DataAccess;

public class AppDbContext : DbContext
{
    // Veritabanı bağlantı ayarlarını dışarıdan (Program.cs'den) almak için constructor
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Kategori> Kategoriler { get; set; }
    public DbSet<Urunler> Urunler { get; set; }
    public DbSet<Kullanicilar> Kullanicilar { get; set; }
    public DbSet<Favori> Favoriler { get; set; }
    public DbSet<Karturun> SepetUrunleri { get; set; }
    public DbSet<Siparis> Siparisler { get; set; }
    public DbSet<SiparisDetay> SiparisDetaylari { get; set; }
    public DbSet<DestekTalepleri> DestekTalepleri { get; set; }
}