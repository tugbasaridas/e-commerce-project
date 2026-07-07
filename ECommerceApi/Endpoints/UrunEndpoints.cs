using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using Microsoft.EntityFrameworkCore;
using ECommerceApi.DTOs;

namespace ECommerceApi.Endpoints;

public static class UrunEndpoints
{
    public static void MapUrunEndpoints(this WebApplication app)
    {
        // Tüm ürün istekleri bu adreste toplanacak
        var group = app.MapGroup("/api/urunler");

       // 1. Ürünleri Listele 
        group.MapGet("/", async (AppDbContext db) =>
        {
            var urunler = await db.Urunler.Include(u => u.Kategori).ToListAsync();
    
            return Results.Ok(urunler.Select(u => new {
                u.Id,
                u.Ad,
                u.Aciklama,
                u.Fiyat,
                u.ResimUrl,
                KategoriId = u.KategoriId, 
                Kategori = u.Kategori != null ? new 
                { 
                    Id = u.Kategori.Id, 
                    Ad = u.Kategori.Ad 
                } : null 
            }));
        });

        // 2. Tek Bir Ürün Getir 
        group.MapGet("/{id}", async (int id, AppDbContext db) =>
        {
            var urun = await db.Urunler.Include(u => u.Kategori).FirstOrDefaultAsync(u => u.Id == id);
            
            if (urun is null) return Results.NotFound("Ürün bulunamadı.");
            return Results.Ok(urun);
        });

        // 3. Yeni Ürün Ekle
        group.MapPost("/", async (Urunler yeniUrun, AppDbContext db) =>
        {
            db.Urunler.Add(yeniUrun);
            await db.SaveChangesAsync();
            return Results.Created($"/api/urunler/{yeniUrun.Id}", yeniUrun);
        });

        // 4. Ürün Sil
        group.MapDelete("/{id}", async (int id, AppDbContext db) =>
        {
            var urun = await db.Urunler.FindAsync(id);
            if (urun is null) return Results.NotFound();

            db.Urunler.Remove(urun);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        group.MapPut("/{id}", async (int id, UrunGuncelleDto guncelUrun, AppDbContext db) =>
                {
                    var mevcutUrun = await db.Urunler.FindAsync(id);
                    if (mevcutUrun is null) return Results.NotFound("Güncellenecek ürün bulunamadı.");

                    
                    if (guncelUrun.Ad != null) mevcutUrun.Ad = guncelUrun.Ad;
                    if (guncelUrun.Aciklama != null) mevcutUrun.Aciklama = guncelUrun.Aciklama;
                    
                    if (guncelUrun.Fiyat.HasValue) mevcutUrun.Fiyat = guncelUrun.Fiyat.Value;
                    if (guncelUrun.Stok.HasValue) mevcutUrun.Stok = guncelUrun.Stok.Value;
                    
                    if (guncelUrun.ResimUrl != null) mevcutUrun.ResimUrl = guncelUrun.ResimUrl;
                    if (guncelUrun.KategoriId.HasValue) mevcutUrun.KategoriId = guncelUrun.KategoriId.Value;

                    await db.SaveChangesAsync();
                    
                    return Results.Ok(mevcutUrun);
                });
    }
}