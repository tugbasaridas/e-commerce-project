using ECommerceApi.DataAccess;
using ECommerceApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer; 
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens; 
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// --- 1. CORS AYARLARI ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy => 
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

// --- 2. VERİTABANI BAĞLANTISI (PostgreSQL) ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// --- 3. CONTROLLER VE JSON AYARLARI ---
// Senin yazdığın IgnoreCycles ayarını Controller yapısına entegre ettik
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

// --- 4. DEPENDENCY INJECTION (SERVİS KAYITLARI) ---
builder.Services.AddScoped<IUrunService, UrunService>();
builder.Services.AddScoped<ISiparisService, SiparisService>();
builder.Services.AddScoped<IKullaniciService, KullaniciService>();
builder.Services.AddScoped<IKategoriService, KategoriService>();
builder.Services.AddScoped<IKartService, KartService>();
builder.Services.AddScoped<IFavoriService, FavoriService>();
builder.Services.AddScoped<IDestekService, DestekService>();
builder.Services.AddScoped<IAdminService, AdminService>();

// --- 5. JWT GÜVENLİK SERVİSİ ---
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

// --- 6. YETKİLENDİRME ---
builder.Services.AddAuthorization();

// --- 7. SWAGGER ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// --- 8. HTTP İSTEK BORU HATTI (MIDDLEWARE) ---
app.UseCors("AllowAll"); // Cors en üstte olmalı

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication(); // Önce kimlik doğrulama
app.UseAuthorization();  // Sonra yetki kontrolü

// Eski app.Map...Endpoints(); satırlarının yerini tek bir satır aldı:
app.MapControllers(); 

app.Run();