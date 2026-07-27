import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAdminDashboard } from '../../hooks/custom/useAdminDashboard';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const router = useRouter();
  const { stats, loading, oturumuKapat, yenile, adminAdi } = useAdminDashboard();

  // KESİN ÇÖZÜM: Backend'den (C#) veriler büyük veya küçük harfle dönse de güvenle yakalıyoruz
  const ciro = stats?.toplamCiro ?? (stats as any)?.ToplamCiro ?? 0;
  const netKazanc = stats?.platformKazanci ?? (stats as any)?.PlatformKazanci ?? 0;
  const musteriSayisi = stats?.toplamMusteri ?? (stats as any)?.ToplamMusteri ?? 0;
  const saticiSayisi = stats?.toplamSatici ?? (stats as any)?.ToplamSatici ?? 0;
  const aktifUrunSayisi = stats?.aktifUrun ?? (stats as any)?.AktifUrun ?? 0;
  const pasifUrunSayisi = stats?.pasifUrun ?? (stats as any)?.PasifUrun ?? 0;
  const topSatanlar = stats?.enCokSatanlar ?? (stats as any)?.EnCokSatanlar ?? [];

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={yenile} colors={['#FF9F00']} />}
    >
      {/* ÜST BANNER / BAŞLIK */}
      <View style={styles.headerBanner}>
        <View>
          <Text style={styles.welcomeText}>Hoş geldin, {adminAdi} 👋</Text>
          <Text style={styles.headerTitle}>Raporlar & Analiz</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.adminBadge}>
            <Ionicons name="analytics" size={16} color="#FF9F00" />
            <Text style={styles.adminBadgeText}>İstatistikler</Text>
          </View>
        </View>
      </View>

      {/* FİNANSAL DURUM - YENİLENEN İKİLİ KART YAPISI */}
      <Text style={styles.sectionTitle}>Finansal Durum</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        
        {/* TOPLAM İŞLEM HACMİ (Müşterinin Ödediği) */}
        <View style={[styles.ciroCard, { flex: 1, marginRight: 10, marginBottom: 0, flexDirection: 'column', alignItems: 'flex-start', padding: 16, borderLeftColor: '#1E90FF' }]}>
          <View style={[styles.ciroIconContainer, { backgroundColor: '#E6F2FF', marginBottom: 12, marginRight: 0 }]}>
            <Ionicons name="swap-horizontal" size={24} color="#1E90FF" />
          </View>
          <View>
            <Text style={styles.ciroLabel}>Toplam Hacim</Text>
            <Text style={[styles.ciroValue, { color: '#1E90FF', fontSize: 18 }]} numberOfLines={1} adjustsFontSizeToFit>
              {Number(ciro).toFixed(2)} ₺
            </Text>
          </View>
        </View>

        {/* ADMİN NET KAZANCI (%10 Komisyon) */}
        <View style={[styles.ciroCard, { flex: 1, marginBottom: 0, flexDirection: 'column', alignItems: 'flex-start', padding: 16, borderLeftColor: '#28A745' }]}>
          <View style={[styles.ciroIconContainer, { backgroundColor: '#E8F5E9', marginBottom: 12, marginRight: 0 }]}>
            <Ionicons name="wallet" size={24} color="#28A745" />
          </View>
          <View>
            <Text style={styles.ciroLabel}>Net Kazancımız</Text>
            <Text style={[styles.ciroValue, { color: '#28A745', fontSize: 18 }]} numberOfLines={1} adjustsFontSizeToFit>
              {Number(netKazanc).toFixed(2)} ₺
            </Text>
          </View>
        </View>

      </View>

      {/* İSTATİSTİK KARTLARI GRİD YAPISI */}
      <Text style={styles.sectionTitle}>Genel Bakış</Text>
      <View style={styles.statsGrid}>
        
        {/* MÜŞTERİ KARTI */}
        <View style={[styles.card, { borderLeftColor: '#4EA8DE' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#E1F5FE' }]}>
              <Ionicons name="people" size={24} color="#4EA8DE" />
            </View>
          </View>
          <Text style={styles.cardValue}>{musteriSayisi}</Text>
          <Text style={styles.cardLabel}>Toplam Müşteri</Text>
        </View>

        {/* SATICI KARTI */}
        <View style={[styles.card, { borderLeftColor: '#9D4EDD' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="storefront" size={24} color="#9D4EDD" />
            </View>
          </View>
          <Text style={styles.cardValue}>{saticiSayisi}</Text>
          <Text style={styles.cardLabel}>Toplam Satıcı</Text>
        </View>

        {/* AKTİF ÜRÜN KARTI */}
        <View style={[styles.card, { borderLeftColor: '#70E000' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="cube" size={24} color="#70E000" />
            </View>
          </View>
          <Text style={styles.cardValue}>{aktifUrunSayisi}</Text>
          <Text style={styles.cardLabel}>Aktif Ürün</Text>
        </View>

        {/* PASİF ÜRÜN KARTI */}
        <View style={[styles.card, { borderLeftColor: '#EF233C' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#FFF0F0' }]}>
              <Ionicons name="archive" size={24} color="#EF233C" />
            </View>
          </View>
          <Text style={styles.cardValue}>{pasifUrunSayisi}</Text>
          <Text style={styles.cardLabel}>Pasif Ürün</Text>
        </View>
        
      </View>

      {/* EN ÇOK SATANLAR LİSTESİ */}
      {topSatanlar && topSatanlar.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 15 }]}>En Çok Satanlar (Top 5)</Text>
          <View style={styles.topSellerContainer}>
            {topSatanlar.map((urun: any, index: number) => {
              
              // Backend JSON dönüşü (Büyük/Küçük harf duyarlılığı kontrolü)
              const urunId = urun?.urunId ?? urun?.UrunId;
              const urunAdi = urun?.urunAdi ?? urun?.UrunAdi ?? "Bilinmeyen Ürün";
              const magazaAdi = urun?.magazaAdi ?? urun?.MagazaAdi ?? "Bilinmiyor";
              
              // RESİM İÇİN KESİN GÜVENLİK KONTROLÜ
              let resimLink = 'https://via.placeholder.com/150';
              if (urun?.resimUrl && typeof urun.resimUrl === 'string' && urun.resimUrl.length > 5) {
                resimLink = urun.resimUrl;
              } else if (urun?.ResimUrl && typeof urun.ResimUrl === 'string' && urun.ResimUrl.length > 5) {
                resimLink = urun.ResimUrl;
              }

              const kazanc = urun?.toplamKazanc ?? urun?.ToplamKazanc ?? 0;
              const satisAdedi = urun?.toplamSatisAdedi ?? urun?.ToplamSatisAdedi ?? 0;

              return (
                <View key={urunId} style={[styles.topSellerRow, index !== topSatanlar.length - 1 && styles.rowDivider]}>
                  
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </View>

                  <Image 
                    source={{ uri: resimLink }} 
                    style={styles.productImage} 
                  />

                  <View style={styles.productInfoContainer}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {urunAdi}
                    </Text>
                    <View style={styles.storeContainer}>
                      <Ionicons name="storefront-outline" size={12} color="#8E8E93" />
                      <Text style={styles.storeName} numberOfLines={1}>{magazaAdi}</Text>
                    </View>
                  </View>

                  <View style={styles.productStatsContainer}>
                    <Text style={styles.productRevenue}>{Number(kazanc).toFixed(2)} ₺</Text>
                    <View style={styles.salesBadge}>
                      <Ionicons name="trending-up" size={10} color="#FF9F00" />
                      <Text style={styles.productSales}>{satisAdedi} Satış</Text>
                    </View>
                  </View>
                  
                </View>
              );
            })}
          </View>
        </>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingHorizontal: 20 },
  headerBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 20, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  welcomeText: { fontSize: 14, color: '#8E8E93' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  adminBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF4E5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  adminBadgeText: { color: '#FF9F00', fontWeight: '600', fontSize: 12, marginLeft: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 12, marginTop: 10 },
  
  ciroCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 20, borderLeftWidth: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  ciroIconContainer: { padding: 14, borderRadius: 12, marginRight: 16 },
  ciroTextContainer: { flex: 1, justifyContent: 'center' },
  ciroLabel: { fontSize: 13, color: '#8E8E93', fontWeight: '500', marginBottom: 4 },
  ciroValue: { fontSize: 26, fontWeight: '800' },
  
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, flexWrap: 'wrap' },
  card: { backgroundColor: '#FFFFFF', width: (width - 55) / 2, padding: 16, borderRadius: 14, borderLeftWidth: 4, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  iconContainer: { padding: 8, borderRadius: 10 },
  cardValue: { fontSize: 26, fontWeight: '800', color: '#1C1C1E' },
  cardLabel: { fontSize: 13, color: '#8E8E93', marginTop: 4, fontWeight: '500' },
  
  topSellerContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 5, marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E5EA' },
  topSellerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 },
  
  rankBadge: { width: 28, height: 28, backgroundColor: '#FFF4E5', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  rankText: { fontSize: 12, fontWeight: '800', color: '#FF9F00' },
  
  productImage: { width: 45, height: 45, borderRadius: 8, backgroundColor: '#F2F2F7', marginRight: 12 },
  
  productInfoContainer: { flex: 1, paddingRight: 10, justifyContent: 'center' },
  productName: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', marginBottom: 4, lineHeight: 18 },
  storeContainer: { flexDirection: 'row', alignItems: 'center' },
  storeName: { fontSize: 12, color: '#8E8E93', marginLeft: 4, flex: 1 },
  
  productStatsContainer: { alignItems: 'flex-end', justifyContent: 'center' },
  productRevenue: { fontSize: 15, fontWeight: '700', color: '#28A745', marginBottom: 4 },
  salesBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF4E5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  productSales: { fontSize: 11, fontWeight: '600', color: '#FF9F00', marginLeft: 4 }
});