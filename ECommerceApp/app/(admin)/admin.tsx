import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAdminDashboard } from '../../hooks/custom/useAdminDashboard';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const router = useRouter();
  // YENİ: adminAdi değişkenini hook'tan çekiyoruz
  const { stats, loading, oturumuKapat, yenile, adminAdi } = useAdminDashboard();

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={yenile} colors={['#FF9F00']} />}
    >
      {/* ÜST BANNER / BAŞLIK */}
      <View style={styles.headerBanner}>
        <View>
          {/* YENİ: Dinamik karşılama mesajı eklendi */}
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

      {/* FİNANSAL DURUM */}
      <Text style={styles.sectionTitle}>Finansal Durum</Text>
      <View style={styles.ciroCard}>
        <View style={styles.ciroIconContainer}>
          <Ionicons name="wallet" size={28} color="#28A745" />
        </View>
        <View style={styles.ciroTextContainer}>
          <Text style={styles.ciroLabel}>Toplam Kazanç (Ciro)</Text>
          <Text style={styles.ciroValue} numberOfLines={1} adjustsFontSizeToFit={true}>
            {stats.toplamCiro ? stats.toplamCiro.toFixed(2) : "0.00"} ₺
          </Text>
        </View>
      </View>

      {/* İSTATİSTİK KARTLARI GRİD YAPISI */}
      <Text style={styles.sectionTitle}>Genel Bakış</Text>
      <View style={styles.statsGrid}>
        <View style={[styles.card, { borderLeftColor: '#4EA8DE' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#E1F5FE' }]}>
              <Ionicons name="people" size={24} color="#4EA8DE" />
            </View>
          </View>
          <Text style={styles.cardValue}>{stats.toplamKullanici}</Text>
          <Text style={styles.cardLabel}>Toplam Kullanıcı</Text>
        </View>

        <View style={[styles.card, { borderLeftColor: '#70E000' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="cube" size={24} color="#70E000" />
            </View>
          </View>
          <Text style={styles.cardValue}>{stats.toplamUrun}</Text>
          <Text style={styles.cardLabel}>Aktif Ürün</Text>
        </View>
      </View>

      {/* AKTİF SİPARİŞ KARTI */}
      <TouchableOpacity 
        style={[styles.longCard, { borderLeftColor: '#FF9F00' }]}
        activeOpacity={0.8}
        onPress={() => router.push('/admin-siparisler' as any)} 
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.iconContainer, { backgroundColor: '#FFF4E5' }]}>
            <Ionicons name="cart" size={24} color="#FF9F00" />
          </View>
          <View style={{ marginLeft: 15 }}>
            <Text style={styles.longCardLabel}>Bekleyen Siparişler</Text>
            <Text style={styles.longCardSub}>Siparişleri incelemek için dokunun</Text> 
          </View>
        </View>
        <Text style={[styles.cardValue, { color: '#FF9F00' }]}>{stats.bekleyenSiparisler || 0}</Text>
      </TouchableOpacity>

      {/* EN ÇOK SATANLAR LİSTESİ */}
      {stats.enCokSatanlar && stats.enCokSatanlar.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>En Çok Satan Ürünler (Top 5)</Text>
          <View style={[styles.menuContainer, { paddingVertical: 0 }]}>
            {stats.enCokSatanlar.map((urun, index) => (
              <View key={urun.urunId} style={[styles.topProductRow, index !== 0 && styles.rowDivider]}>
                <Text style={styles.rankText}>#{index + 1}</Text>
                <View style={styles.productInfoContainer}>
                  <Text style={styles.productName} numberOfLines={1} ellipsizeMode="tail">
                    {urun.urunAdi}
                  </Text>
                  <Text style={styles.productSales}>{urun.toplamSatisAdedi} Adet Satıldı</Text>
                </View>
                <Text style={styles.productRevenue}>{urun.toplamKazanc.toFixed(2)} ₺</Text>
              </View>
            ))}
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
  ciroCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 20, borderLeftWidth: 5, borderLeftColor: '#28A745', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  ciroIconContainer: { backgroundColor: '#E8F5E9', padding: 14, borderRadius: 12, marginRight: 16 },
  ciroTextContainer: { flex: 1, justifyContent: 'center' },
  ciroLabel: { fontSize: 13, color: '#8E8E93', fontWeight: '500', marginBottom: 4 },
  ciroValue: { fontSize: 26, fontWeight: '800', color: '#28A745' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  card: { backgroundColor: '#FFFFFF', width: (width - 55) / 2, padding: 16, borderRadius: 14, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  iconContainer: { padding: 8, borderRadius: 10 },
  cardValue: { fontSize: 26, fontWeight: '800', color: '#1C1C1E' },
  cardLabel: { fontSize: 13, color: '#8E8E93', marginTop: 4, fontWeight: '500' },
  longCard: { backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 14, borderLeftWidth: 4, marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  longCardLabel: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  longCardSub: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  menuContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 5, marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5EA' },
  topProductRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  rankText: { fontSize: 16, fontWeight: '800', color: '#FF9F00', width: 32 },
  productInfoContainer: { flex: 1, paddingRight: 10, justifyContent: 'center' },
  productName: { fontSize: 15, fontWeight: '600', color: '#1C1C1E', marginBottom: 3 },
  productSales: { fontSize: 12, color: '#8E8E93' },
  productRevenue: { fontSize: 15, fontWeight: '700', color: '#28A745', textAlign: 'right' }
});