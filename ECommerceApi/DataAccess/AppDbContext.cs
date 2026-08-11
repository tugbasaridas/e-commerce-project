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
    public DbSet<UrunSoru> UrunSorulari { get; set; }
    public DbSet<Kullanicilar> Kullanicilar { get; set; }
    public DbSet<Favori> Favoriler { get; set; }
    public DbSet<Karturun> SepetUrunleri { get; set; }
    public DbSet<Siparis> Siparisler { get; set; }
    public DbSet<SiparisDetay> SiparisDetaylari { get; set; }
    public DbSet<DestekTalepleri> DestekTalepleri { get; set; }
    public DbSet<Oylama> Oylamalar { get; set; }
    public DbSet<Magaza> Magazalar { get; set; }
    public DbSet<Takipci> Takipciler { get; set; }
    public DbSet<Kupon> Kuponlar { get; set; }
    public DbSet<KullaniciKupon> KullaniciKuponlari { get; set; }
    public DbSet<KuponUrun> KuponUrunleri { get; set; }
    public DbSet<Bildirim> Bildirimler { get; set; }
    public DbSet<IadeTalebi> IadeTalepleri { get; set; }
    public DbSet<VitrinBanner> VitrinBannerlar { get; set; }

    // --- YENİ EKLENEN: İLİŞKİ KURALLARI ---
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. KULLANICI ve MAĞAZA (Bire-Bir İlişki)
        modelBuilder.Entity<Magaza>()
            .HasOne(m => m.Kullanici)
            .WithOne(k => k.Magaza)
            .HasForeignKey<Magaza>(m => m.KullaniciId)
            .OnDelete(DeleteBehavior.Cascade); // Kullanıcı silinirse mağazası da silinsin

        // 2. MAĞAZA ve ÜRÜNLER (Bire-Çok İlişki)
        modelBuilder.Entity<Urunler>()
            .HasOne(u => u.Magaza)
            .WithMany(m => m.Urunler)
            .HasForeignKey(u => u.MagazaId)
            .OnDelete(DeleteBehavior.SetNull); // Mağaza kapanırsa ürünler silinmesin, NovaStore'a devrolsun (MagazaId = null)

            // Bir kullanıcı bir mağazayı sadece 1 kere takip edebilir
    modelBuilder.Entity<Takipci>()
        .HasIndex(t => new { t.KullaniciId, t.MagazaId }).IsUnique();

    // Bir kullanıcıya aynı kupon 2 kere tanımlanamaz
    modelBuilder.Entity<KullaniciKupon>()
        .HasIndex(kk => new { kk.KullaniciId, kk.KuponId }).IsUnique();
    }
}