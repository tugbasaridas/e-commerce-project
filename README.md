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
- Ürün listeleme ve detay görüntüleme
- Sepet yönetimi
- Favori ürünler
- Sipariş oluşturma
- Admin ürün yönetimi
- Destek talepleri

## Notlar
- Backend için veritabanı bağlantısı appsettings.json dosyasından ayarlanır.
- Frontend tarafında API adresi config/api.ts dosyasında düzenlenebilir.
