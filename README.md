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
- JWT & Refresh Token Authentication
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
### 🛡️ Güvenlik ve Rol Tabanlı Erişim (AuthGuard)
- **Gelişmiş Rol Yönetimi:** Admin, Satıcı ve Müşteri panellerinin tamamen izole edilmesi.
- **Kesintisiz Oturum (Refresh Token):** Kullanıcıların JWT süresi dolduğunda sistemden atılmadan, arka planda güvenli bir şekilde oturumlarının yenilenmesi.
- **Trafik Polisi (AuthGuard):** Sayfa yenilemelerinde veya yetkisiz erişim denemelerinde kullanıcıları anında doğru panellere yönlendiren sıkı rota koruması.
- **Güvenlik İşlemleri:** Şifre değiştirme, hesabı askıya alma ve kart doğrulama modülleri.

### 🎨 Dinamik Arayüz ve Kişiselleştirme
- **Karanlık / Aydınlık Mod (Dark & Light Theme):** Sistem ayarlarına veya kullanıcı tercihine anında uyum sağlayan, göz yormayan dinamik tema mimarisi.
- **Akıllı Ürün Önerileri:** Kullanıcının incelediği ürüne göre çalışan, kategori ve etiket bazlı "Benzer Ürünler" algoritması.
- **Tarama Geçmişi:** Müşterilerin platformdaki adımlarını hafızada tutarak alışverişe kaldıkları yerden devam etmelerini sağlayan "Son Gezilen Ürünler" listesi.

### 🖼️ Akıllı Vitrin ve Kaydırmalı Kampanya Mimarisi
- **Carousel Popup:** Müşteriler uygulamaya girdiğinde aktif kampanyaları gösteren kaydırmalı (carousel) vitrin sistemi.
- **Deep Linking (Akıllı Yönlendirme):** Vitrin afişlerine tıklandığında hedef ID'sine göre doğrudan Ürün, Mağaza veya Kategori filtrelemesine otomatik yönlendirme.
- **Admin Vitrin Kontrolü:** Afişleri arama, filtreleme, yayına alma ve gösterim sıralarını sürükle-bırak/düzenle mantığıyla yönetme.

### 📦 Kusursuz Sipariş Durum Makinesi (State Machine)
- **Sıkı Durum Geçişleri:** "Hazırlanıyor -> Kargoya Verildi -> Tamamlandı" akışının mantıksal kilitlerle korunması. 
- **Akıllı Sepet Durumu:** Sepetteki alt ürünlerin durumuna göre ana sipariş kutusunun durumunun otomatik güncellenmesi.
- **Kargo Takip:** Siparişlerin anlık sevkiyat ve takip numarası üzerinden izlenmesi.

### 🔄 Gelişmiş İade ve İptal Süreçleri
- **İade Talebi Döngüsü:** Müşterilerin iade başlatması, satıcının ürünü teslim alması, incelemesi, onaylaması veya **gerekçeli** reddetmesi.
- **Finansal Roll-back:** İptal veya iade durumunda, ürünlerin satıcı net kazancından ve platform komisyonundan anında düşülmesi.

### 💸 Finans, Komisyon ve Analitik Paneli
- **Gerçek Ciro Hesaplaması:** İptal/İadeler düşülerek hesaplanan net "Müşteri Ödemesi", "Satıcı Kazancı (%90)" ve "Platform Komisyonu (%10)" tabloları.
- **Görsel İstatistikler:** Satıcılar ve Admin için  aylık gelirleri gösteren dinamik grafik entegrasyonu. En çok satan ürünlerin listelenmesi.

### 🎁 Akıllı Kupon ve İndirim Motoru
- **Çoklu Kupon Yönetimi:**Hem Admin hem Satıcı tarafından bağımsız kupon kodları oluşturulabilmesi.
- **Zaman Ayarlı İndirimler:** Süresi dolan  indirimlerin süre bitiminde otomatik olarak eski fiyata dönmesi .
- **Alarm Sistemi:** Bir üründe fiyat düşüşü olduğunda, o ürünü favorileyenlere veya mağaza takipçilerine anında bildirim gitmesi.

### 🔔 Dinamik Bildirim ve İletişim Sistemi
- **Rozetli (Badge) Uyarılar:** Satıcı paneline düşen yeni iade talepleri, müşteri soruları, siparişler ve destek mesajları için sayaclı kırmızı rozetler.
- **Müşteri-Satıcı Soru-Cevap:** Kullanıcıların doğrudan ürün üzerinden mağazaya soru sorabilmesi.
- **Sistem Bildirimleri:** Kargo durumu değiştiğinde, indirim yapıldığında veya iade onaylandığında otomatik  bildirim akışı.

### 🛒 Temel E-Ticaret Akışı
- Ürün listeleme, kategori bazlı filtreleme ve sepet yönetimi.
- Detaylı ürün inceleme ve mağaza profili.
- Müşterilerin sipariş sonrası gelişmiş yorum ve 5 yıldızlı puanlama sistemi.
- Admin panelinden mağaza başvurusu ve ürün onay/red süreçlerinin yönetilmesi.

## Notlar
- Backend için veritabanı bağlantısı appsettings.json dosyasından ayarlanır.
- Frontend tarafında API adresi config/api.ts dosyasında düzenlenebilir.
