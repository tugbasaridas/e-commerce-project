using ECommerceApi.DataAccess;
using ECommerceApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace ECommerceApi.Endpoints;

public static class KategoriEndpoints
{
    // Program.cs'den çağıracağımız ana metod
    public static void MapKategoriEndpoints(this WebApplication app)
    {
        // Tüm kategori istekleri "localhost:port/api/kategoriler" adresine gidecek
        var group = app.MapGroup("/api/kategoriler");

        // 1. Kategorileri Listele (GET İstediği)
        group.MapGet("/", async (AppDbContext db) =>
        {
            var kategoriler = await db.Kategoriler.ToListAsync();
            return Results.Ok(kategoriler);
        });

        // 2. Yeni Kategori Ekle (POST İstediği)
        group.MapPost("/", async (Kategori yeniKategori, AppDbContext db) =>
        {
            db.Kategoriler.Add(yeniKategori);
            await db.SaveChangesAsync(); // Veritabanına kaydet
            
            return Results.Ok(yeniKategori);
        });
    }
}