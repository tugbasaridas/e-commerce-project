import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SaticiAnasayfa() {
  const router = useRouter();
  const [urunler, setUrunler] = useState<any[]>([]);
  const [siparisler, setSiparisler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      verileriGetir();
    }, [])
  );

  const verileriGetir = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      // Ürünleri ve Siparişleri paralel olarak çekiyoruz
      const [urunResponse, siparisResponse] = await Promise.all([
        axios.get(`${API_CONFIG.BASE_URL}/satici/urunlerim`, { headers }),
        axios.get(`${API_CONFIG.BASE_URL}/satici/siparislerim`, { headers })
      ]);

      setUrunler(urunResponse.data);
      setSiparisler(siparisResponse.data);
    } catch (error) {
      console.log("Veriler getirilemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const cikisYap = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userRole');
    await AsyncStorage.removeItem('refreshToken');
    
    router.replace('/(tabs)' as any); 
  };

  // 1. Yayındaki aktif ve onaylı ürün sayısı
  const aktifUrunSayisi = urunler.filter(urun => urun.aktifMi && urun.adminOnayliMi).length;

  // 2. Toplam Sipariş Sayısı
  const toplamSiparisSayisi = siparisler.length;

  // 3. KAZANÇ HESAPLAMA: Sadece durumu "Tamamlandı" olan ürünlerin kazançlarını topluyoruz!
  let toplamKazanc = 0;
  siparisler.forEach(siparis => {
    const urunlerListesi = siparis.satilanUrunler || siparis.urunler || [];
    urunlerListesi.forEach((urun: any) => {
      if (urun.durum === 'Tamamlandı') {
        const kazanc = urun.saticiKazanci || (urun.birimFiyat * urun.adet * 0.9);
        toplamKazanc += kazanc;
      }
    });
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <View style={styles.header}>
        <View>
          <Text style={styles.baslik}>Satıcı Paneli</Text>
          <Text style={styles.altMetin}>Hoş geldiniz, mağazanızı yönetin.</Text>
        </View>
        <TouchableOpacity onPress={cikisYap} style={styles.cikisIkon}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="orange" style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.istatistikKutusu}>
            <View style={styles.istatistikKart}>
              <Ionicons name="cube" size={26} color="orange" />
              <Text style={styles.istatistikSayi}>{aktifUrunSayisi}</Text>
              <Text style={styles.istatistikBaslik}>Yayındaki Ürün</Text>
            </View>
            
            <View style={styles.istatistikKart}>
              <Ionicons name="cart" size={26} color="#34C759" />
              <Text style={styles.istatistikSayi}>{toplamSiparisSayisi}</Text>
              <Text style={styles.istatistikBaslik}>Siparişler</Text>
            </View>

            <View style={styles.istatistikKart}>
              <Ionicons name="wallet" size={26} color="#007AFF" />
              <Text style={styles.istatistikSayi}>{toplamKazanc.toFixed(2)} ₺</Text>
              <Text style={styles.istatistikBaslik}>Net Kazanç</Text>
            </View>
          </View>

          {/* YÖNETİM ARAÇLARI */}
          <View style={styles.yonetimAraclariKutusu}>
            <Text style={styles.bolumBaslik}>Yönetim Araçları</Text>
            <View style={styles.islemGrid}>
              
              <TouchableOpacity 
                style={styles.islemKart} 
                activeOpacity={0.8}
                onPress={() => router.push('/(satici)/satici-urunler' as any)}
              >
                <View style={[styles.islemIkonKutu, { backgroundColor: '#FFF4E5' }]}>
                  <Ionicons name="cube" size={26} color="#FF9F00" />
                </View>
                <Text style={styles.islemKartYazi}>Ürün Yönetimi</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.islemKart} 
                activeOpacity={0.8}
                onPress={() => router.push('/(satici)/satici-indirim-yonetimi' as any)}
              >
                <View style={[styles.islemIkonKutu, { backgroundColor: '#FFF0F0' }]}>
                  <Ionicons name="pricetag" size={26} color="#FF3B30" />
                </View>
                <Text style={styles.islemKartYazi}>İndirim Yönetimi</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.islemKart} 
                activeOpacity={0.8}
                onPress={() => router.push('/(satici)/satici-stok-yonetimi' as any)}
              >
                <View style={[styles.islemIkonKutu, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="layers" size={26} color="#2E7D32" />
                </View>
                <Text style={styles.islemKartYazi}>Stok Yönetimi</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.islemKart} 
                activeOpacity={0.8}
                onPress={() => router.push('/(satici)/satici-siparisler' as any)}
              >
                <View style={[styles.islemIkonKutu, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="basket" size={26} color="#1565C0" />
                </View>
                <Text style={styles.islemKartYazi}>Siparişler</Text>
              </TouchableOpacity>

              {/* YENİ EKLENEN KART: MÜŞTERİ SORULARI */}
              <TouchableOpacity 
                style={styles.islemKart} 
                activeOpacity={0.8}
                onPress={() => router.push('/(satici)/satici-sorulari' as any)}
              >
                <View style={[styles.islemIkonKutu, { backgroundColor: '#F3E5F5' }]}>
                  <Ionicons name="chatbubbles" size={26} color="#9C27B0" />
                </View>
                <Text style={styles.islemKartYazi}>Müşteri Soruları</Text>
              </TouchableOpacity>

            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15, backgroundColor: '#F8F9FA' },
  baslik: { fontSize: 24, fontWeight: 'bold', color: '#1C1C1E' },
  altMetin: { fontSize: 14, color: '#8E8E93', marginTop: 2 },
  cikisIkon: { padding: 10, backgroundColor: '#FFF5F5', borderRadius: 12, borderWidth: 1, borderColor: '#FFEBEB' },
  
  istatistikKutusu: { flexDirection: 'row', paddingHorizontal: 15, marginBottom: 20, justifyContent: 'space-between' },
  istatistikKart: { flex: 1, backgroundColor: '#fff', paddingVertical: 16, paddingHorizontal: 5, borderRadius: 16, alignItems: 'center', marginHorizontal: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },
  istatistikSayi: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E', marginTop: 8 },
  istatistikBaslik: { fontSize: 12, color: '#8E8E93', marginTop: 4, fontWeight: '500', textAlign: 'center' },

  yonetimAraclariKutusu: { paddingHorizontal: 20, marginTop: 10 },
  bolumBaslik: { fontSize: 16, fontWeight: '800', color: '#1C1C1E', marginBottom: 15, marginLeft: 5 },
  
  islemGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  islemKart: { width: '48%', backgroundColor: '#fff', paddingVertical: 22, borderRadius: 16, alignItems: 'center', marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  islemIkonKutu: { padding: 16, borderRadius: 14, marginBottom: 12 },
  islemKartYazi: { fontSize: 14, fontWeight: '700', color: '#333', textAlign: 'center' }
});