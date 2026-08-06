# ECommerce Full Stack

Bu proje, ASP.NET Core Web API tabanlı backend ile React Native/Expo tabanlı mobil frontend'in birlikte çalıştığı bir e-ticaret uygulamasıdır.

## Proje Yapısı

- Backend: ECommerceApi
- Frontend: ECommerceApp

## Teknolojiler

### Backend
- ASP.NET Core
- Entity Framework Core
- PostgreSQL
- JWT Authentication
- Swagger

### Frontend
- React Native
- Expo
- TypeScript

## Kurulum

### 1) Backend
```bash
cd ECommerceApi
dotnet restore
dotnet run
```

API Swagger arayüzü şu adreste açılır:
- http://localhost:5000/swagger

### 2) Frontend
```bash
cd ECommerceApp
npm install
npx expo start
```

## Özellikler
-Gelişmiş Rol Yönetimi: Admin, Satıcı ve Kullanıcı modülleri ile yetki bazlı erişim.

-Kupon ve İndirim Sistemi: Satın alma süreçlerinde kampanya ve kupon kodu entegrasyonu.

-Bildirim Sistemi: Kullanıcı eylemleri ve sistem süreçleri için anlık bilgilendirmeler.

-Kargo Takip Sistemi: Siparişlerin anlık sevkiyat ve kargo durumlarının izlenmesi.

-Güvenlik ve Kullanıcı Kontrolü: Kart doğrulama işlemleri ve kullanıcı aktiflik/pasiflik durumu yönetimi.

-Temel E-Ticaret Akışı: Ürün listeleme, detay görüntüleme, favori ürünler, sepet yönetimi ve sipariş oluşturma.Yorum ve puanlama sistemi.

-Satıcı & Admin Paneli: Ürün yönetimi, stok takibi ve müşteri destek talepleri kontrolü.

## Notlar
- Backend için veritabanı bağlantısı appsettings.json dosyasından ayarlanır.
- Frontend tarafında API adresi config/api.ts dosyasında düzenlenebilir.
