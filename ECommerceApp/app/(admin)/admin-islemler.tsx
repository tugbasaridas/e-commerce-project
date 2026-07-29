import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAdminDashboard } from '../../hooks/custom/useAdminDashboard';

const { width } = Dimensions.get('window');

// BİLDİRİM BALONCUĞU (BADGE) BİLEŞENİ
const BildirimRozeti = ({ sayi }: { sayi: number }) => {
  if (!sayi || sayi <= 0) return null; // Sıfırsa veya yoksa hiç gösterme
  
  return (
    <View style={styles.badgeContainer}>
      <Text style={styles.badgeText}>{sayi > 99 ? '99+' : sayi}</Text>
    </View>
  );
};

export default function AdminIslemler() {
  const router = useRouter();
  // YENİ: Backend'deki istatistik (ve bildirim) sayılarını çeken hook'umuzu dahil ettik
  const { stats } = useAdminDashboard();

  const cikisYap = async () => {
    Alert.alert(
      "Çıkış Yap",
      "Yönetici hesabınızdan çıkış yapmak istediğinize emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Çıkış Yap", 
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userRole');
              await AsyncStorage.removeItem('userId');
              await AsyncStorage.removeItem('adSoyad');
              router.replace('/'); 
            } catch (error) {
              console.error("Çıkış yapılırken hata:", error);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hızlı İşlemler</Text>
          <TouchableOpacity style={styles.cikisButon} onPress={cikisYap}>
            <Ionicons name="log-out-outline" size={26} color="#EF233C" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Tüm mağaza operasyonlarını tek bir yerden yönetin.</Text>
      </View>

      <View style={styles.gridContainer}>
        
        {/* SİPARİŞLER (Hazırlanan sipariş sayısı) */}
        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push('/admin-siparisler' as any)}>
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF4E5' }]}>
              <Ionicons name="cart" size={26} color="#FF9F00" />
            </View>
            <BildirimRozeti sayi={stats?.bekleyenSiparis || (stats as any)?.BekleyenSiparis || 0} />
          </View>
          <Text style={styles.cardTitle}>Siparişler</Text>
          <Text style={styles.cardDesc}>Platformdaki tüm siparişlerin durumunu izle</Text>
        </TouchableOpacity>

        {/* ÜRÜN ONAY */}
        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push('/admin-urun-onay' as any)}>
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: '#E0F7FA' }]}>
              <Ionicons name="checkmark-done-circle" size={26} color="#00BCD4" />
            </View>
            <BildirimRozeti sayi={stats?.bekleyenUrun || (stats as any)?.BekleyenUrun || 0} />
          </View>
          <Text style={styles.cardTitle}>Ürün Onay</Text>
          <Text style={styles.cardDesc}>Satıcıların eklediği yeni ürünleri incele ve onayla</Text>
        </TouchableOpacity>

        {/* MAĞAZA YÖNETİMİ */}
        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push('/admin-satici-onay' as any)}>
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: '#E8EAF6' }]}>
              <Ionicons name="storefront" size={26} color="#3F51B5" />
            </View>
            <BildirimRozeti sayi={stats?.bekleyenMagaza || (stats as any)?.BekleyenMagaza || 0} />
          </View>
          <Text style={styles.cardTitle}>Mağaza Yönetimi</Text>
          <Text style={styles.cardDesc}>Onay bekleyen ve aktif satıcıları yönet</Text>
        </TouchableOpacity>

        {/* KULLANICILAR */}
        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push('/admin-kullanicilar' as any)}>
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="people" size={26} color="#9C27B0" />
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D1D6" />
          </View>
          <Text style={styles.cardTitle}>Kullanıcılar</Text>
          <Text style={styles.cardDesc}>Müşteri hesaplarını yönet, askıya al veya aktifleştir</Text>
        </TouchableOpacity>

        {/* KATEGORİLER */}
        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push('/admin-kategoriler' as any)}>
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: '#FCE4EC' }]}>
              <Ionicons name="list" size={26} color="#E91E63" />
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D1D6" />
          </View>
          <Text style={styles.cardTitle}>Kategoriler</Text>
          <Text style={styles.cardDesc}>Mağaza kategorilerini oluştur ve düzenle</Text>
        </TouchableOpacity>

        {/* MÜŞTERİ DESTEK */}
        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push('/admindestek' as any)}>
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="chatbubbles" size={26} color="#28A745" />
            </View>
            <BildirimRozeti sayi={stats?.bekleyenDestek || (stats as any)?.BekleyenDestek || 0} />
          </View>
          <Text style={styles.cardTitle}>Müşteri Destek</Text>
          <Text style={styles.cardDesc}>Gelen soruları ve talepleri anında yanıtla</Text>
        </TouchableOpacity>

      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  geriButon: { padding: 4, marginLeft: -4 },
  cikisButon: { padding: 4, marginRight: -4 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1C1C1E' },
  headerSubtitle: { fontSize: 14, color: '#8E8E93' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: 20, justifyContent: 'space-between' },
  card: { backgroundColor: '#FFFFFF', width: (width - 55) / 2, padding: 16, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#E5E5EA', shadowColor: '#1C1C1E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 6 },
  cardDesc: { fontSize: 12, color: '#8E8E93', lineHeight: 18 },
  
  // YENİ EKLENEN BİLDİRİM (BADGE) STİLLERİ
  badgeContainer: {
    backgroundColor: '#FF3B30',
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginTop: -5,
    marginRight: -5,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  }
}); 