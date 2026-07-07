using ECommerceApi.DataAccess;
using ECommerceApi.Endpoints;
using Microsoft.AspNetCore.Authentication.JwtBearer; 
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens; 
using System.Text; 

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy => 
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// --- 1. JWT GÜVENLİK SERVİSİNİ EKLEME ---
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

// --- 2. YETKİLENDİRME (AUTHORIZATION) SERVİSİNİ EKLEME ---
builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// --- CORS'U AKTİF ETTİK ---
app.UseCors("AllowAll");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// --- 3. GÜVENLİK MIDDLEWARE'LERİ (Sıralama Çok Önemli!) ---
app.UseAuthentication(); // Önce kimlik doğrulama (Sen kimsin?)
app.UseAuthorization();  // Sonra yetki kontrolü (Bunu yapmaya iznin var mı?)

app.MapKategoriEndpoints();
app.MapUrunEndpoints();
app.MapKartEndpoints();
app.MapKullaniciEndpoints();
app.MapFavoriEndpoints();
app.MapAdminEndpoints();
app.MapSiparisEndpoints();
app.MapDestekEndpoints();

app.Run();