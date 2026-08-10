import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SaticiGrafikler from '../../components/SaticiGrafikler';

const BildirimRozeti = ({ sayi }: { sayi: number }) => {
  if (!sayi || sayi <= 0) return null;
  
  return (
    <View style={styles.badgeContainer}>
      <Text style={styles.badgeText}>{sayi > 99 ? '99+' : sayi}</Text>
    </View>
  );
};

export default function SaticiAnasayfa() {
  const router = useRouter();
  const [urunler, setUrunler] = useState<any[]>([]);
  const [siparisler, setSiparisler] = useState<any[]>([]);
  const [magazaBilgisi, setMagazaBilgisi] = useState<any>(null);
  const [bekleyenSoruSayisi, setBekleyenSoruSayisi] = useState(0); 
  const [bekleyenSiparisSayisi, setBekleyenSiparisSayisi] = useState(0); 
  const [bekleyenDestekSayisi, setBekleyenDestekSayisi] = useState(0); 
  const [loading, setLoading] = useState(true);

  const [grafikGoster, setGrafikGoster] = useState(false);

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

      const [urunResponse, siparisResponse, soruResponse, destekResponse, profilResponse] = await Promise.all([
        axios.get(`${API_CONFIG.BASE_URL}/satici/urunlerim`, { headers }),
        axios.get(`${API_CONFIG.BASE_URL}/satici/siparislerim`, { headers }),
        axios.get(`${API_CONFIG.BASE_URL}/urunsoru/satici-sorulari`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_CONFIG.BASE_URL}/destek/kullanici`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_CONFIG.BASE_URL}/satici/profil`, { headers }).catch(() => ({ data: null }))
      ]);

      setUrunler(urunResponse.data);
      setSiparisler(siparisResponse.data);
      if (profilResponse.data) setMagazaBilgisi(profilResponse.data);

      if (soruResponse.data && Array.isArray(soruResponse.data)) {
        const bekleyenler = soruResponse.data.filter((soru: any) => !soru.cevaplandiMi);
        setBekleyenSoruSayisi(bekleyenler.length);
      }

      if (destekResponse.data && Array.isArray(destekResponse.data)) {
        const cevaplananlar = destekResponse.data.filter((d: any) => 
          d.cevaplandiMi === true || d.CevaplandiMi === true || d.durum === 'Cevaplandı' || (d.adminCevabi && d.adminCevabi.length > 0)
        );
        
        const sonOkunanDestekId = await AsyncStorage.getItem('sonOkunanDestekId') || '0';
        const parsedSonId = Number(sonOkunanDestekId);

        const yeniCevaplar = cevaplananlar.filter((d: any) => {
          const talepId = d.id ?? d.Id ?? 0;
          return talepId > parsedSonId;
        });

        setBekleyenDestekSayisi(yeniCevaplar.length);
      }

      if (siparisResponse.data && Array.isArray(siparisResponse.data)) {
        let hazirlanacakSiparisAdedi = 0;
        siparisResponse.data.forEach((siparis: any) => {
          const urunlerListesi = siparis.satilanUrunler || siparis.urunler || [];
          const bekleyenUrunVarMi = urunlerListesi.some((urun: any) => urun.durum === 'Hazırlanıyor');
          if (bekleyenUrunVarMi) {
            hazirlanacakSiparisAdedi++;
          }
        });
        setBekleyenSiparisSayisi(hazirlanacakSiparisAdedi);
      }

    } catch (error) {
      console.log("Veriler getirilemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const destekSayfasinaGit = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const res = await axios.get(`${API_CONFIG.BASE_URL}/destek/kullanici`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const cevaplananlar = res.data.filter((d: any) => 
            d.cevaplandiMi === true || d.CevaplandiMi === true || d.durum === 'Cevaplandı' || (d.adminCevabi && d.adminCevabi.length > 0)
          );
          if (cevaplananlar.length > 0) {
            const enYuksekId = Math.max(...cevaplananlar.map((d: any) => d.id ?? d.Id ?? 0));
            await AsyncStorage.setItem('sonOkunanDestekId', enYuksekId.toString());
          }
        }
      }
    } catch (e) {
      console.log("Okundu işaretlenemedi", e);
    }

    setBekleyenDestekSayisi(0);
    router.push('/(satici)/satici-destek' as any);
  };

  const cikisYap = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userRole');
    await AsyncStorage.removeItem('refreshToken');
    router.replace('/(tabs)' as any); 
  };

  const aktifUrunSayisi = urunler.filter(urun => urun.aktifMi && urun.adminOnayliMi).length;
  const toplamSiparisSayisi = siparisler.length;

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

  const grafikVerisi = useMemo(() => {
    const aylar = [];
    const cirolar = [0, 0, 0, 0, 0, 0];
    const ayIsimleri = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    const bugun = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(bugun.getFullYear(), bugun.getMonth() - i, 1);
      aylar.push(ayIsimleri[d.getMonth()]);
    }

    siparisler.forEach(siparis => {
      const sipTarihStr = siparis.siparisTarihi || siparis.SiparisTarihi;
      if (!sipTarihStr) return;
      const sipTarih = new Date(sipTarihStr);
      const ayFarki = (bugun.getFullYear() - sipTarih.getFullYear()) * 12 + (bugun.getMonth() - sipTarih.getMonth());

      if (ayFarki >= 0 && ayFarki < 6) {
        let sipKazanc = 0;
        const urunler = siparis.satilanUrunler || siparis.urunler || [];
        urunler.forEach((u: any) => {
          if (u.durum === 'Tamamlandı' || u.Durum === 'Tamamlandı') {
            sipKazanc += u.saticiKazanci || (u.birimFiyat * u.adet * 0.9);
          }
        });
        cirolar[5 - ayFarki] += sipKazanc;
      }
    });
    return { aylar, cirolar };
  }, [siparisler]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      
      <View style={styles.header}>
        <View style={styles.profilSol}>
          <View style={styles.avatarKutusu}>
            <Text style={styles.avatarHarf}>
              {magazaBilgisi?.magazaAdi ? magazaBilgisi.magazaAdi.charAt(0).toUpperCase() : 'M'}
            </Text>
          </View>
          <View style={styles.profilBilgi}>
            <Text style={styles.magazaAdi} numberOfLines={1}>
              {magazaBilgisi?.magazaAdi || 'Yükleniyor...'}
            </Text>
            <Text style={styles.saticiAdi}>
              Hoş geldin, {magazaBilgisi?.saticiAdSoyad?.split(' ')[0] || 'Satıcı'}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerAksiyonGrup}>
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={destekSayfasinaGit} 
            style={styles.zarfButon}
          >
            <Ionicons name="mail" size={20} color="#1565C0" />
            {bekleyenDestekSayisi > 0 && (
              <View style={styles.destekBadgeContainer}>
                <Text style={styles.destekBadgeText}>
                  {bekleyenDestekSayisi > 99 ? '99+' : bekleyenDestekSayisi}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} onPress={cikisYap} style={styles.cikisButon}>
            <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF7A00" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          
          <View style={styles.grafikToggleSatiri}>
            <Text style={styles.bolumBaslik}>Genel Bakış</Text>
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => setGrafikGoster(!grafikGoster)} 
              style={styles.grafikBadge}
            >
              <Ionicons name={grafikGoster ? "chevron-up" : "stats-chart"} size={16} color="#FF9F00" />
              <Text style={styles.grafikBadgeYazi}>{grafikGoster ? "Grafiği Gizle" : "Ciro Grafiği"}</Text>
            </TouchableOpacity>
          </View>

          {grafikGoster && (
            <View style={{ paddingHorizontal: 15 }}>
              <SaticiGrafikler aylar={grafikVerisi.aylar} cirolar={grafikVerisi.cirolar} />
            </View>
          )}

          <View style={styles.istatistikKutusu}>
            <View style={styles.istatistikKart}>
              <Ionicons name="cube" size={26} color="#FF9F00" />
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

          <View style={styles.yonetimAraclariKutusu}>
            <Text style={[styles.bolumBaslik, { marginTop: 10 }]}>Yönetim Araçları</Text>
            <View style={styles.islemGrid}>
              
              <TouchableOpacity style={styles.islemKart} activeOpacity={0.8} onPress={() => router.push('/(satici)/satici-urunler' as any)}>
                <View style={[styles.islemIkonKutu, { backgroundColor: '#FFF4E5' }]}>
                  <Ionicons name="cube" size={26} color="#FF9F00" />
                </View>
                <Text style={styles.islemKartYazi}>Ürün Yönetimi</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.islemKart} activeOpacity={0.8} onPress={() => router.push('/(satici)/satici-indirim-yonetimi' as any)}>
                <View style={[styles.islemIkonKutu, { backgroundColor: '#FFF0F0' }]}>
                  <Ionicons name="pricetag" size={26} color="#FF3B30" />
                </View>
                <Text style={styles.islemKartYazi}>İndirim Yönetimi</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.islemKart} activeOpacity={0.8} onPress={() => router.push('/(satici)/satici-stok-yonetimi' as any)}>
                <View style={[styles.islemIkonKutu, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="layers" size={26} color="#2E7D32" />
                </View>
                <Text style={styles.islemKartYazi}>Stok Yönetimi</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.islemKart} activeOpacity={0.8} onPress={() => router.push('/(satici)/satici-siparisler' as any)}>
                <View style={[styles.islemIkonKutu, { backgroundColor: '#E3F2FD', position: 'relative' }]}>
                  <Ionicons name="basket" size={26} color="#1565C0" />
                  <BildirimRozeti sayi={bekleyenSiparisSayisi} />
                </View>
                <Text style={styles.islemKartYazi}>Siparişler</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.islemKart} activeOpacity={0.8} onPress={() => router.push('/(satici)/satici-iadeler' as any)}>
                <View style={[styles.islemIkonKutu, { backgroundColor: '#FFEBEE' }]}>
                  <Ionicons name="return-down-back" size={26} color="#E53935" />
                </View>
                <Text style={styles.islemKartYazi}>İade Talepleri</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.islemKart} activeOpacity={0.8} onPress={() => router.push('/(satici)/satici-sorulari' as any)}>
                <View style={[styles.islemIkonKutu, { backgroundColor: '#F3E5F5', position: 'relative' }]}>
                  <Ionicons name="chatbubbles" size={26} color="#9C27B0" />
                  <BildirimRozeti sayi={bekleyenSoruSayisi} />
                </View>
                <Text style={styles.islemKartYazi}>Müşteri Soruları</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.islemKart} activeOpacity={0.8} onPress={() => router.push('/(satici)/satici-kupon' as any)}>
                <View style={[styles.islemIkonKutu, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="ticket" size={26} color="#FF9800" />
                </View>
                <Text style={styles.islemKartYazi}>Mağaza Kuponları</Text>
              </TouchableOpacity>

              {/* 🌟 YENİ EKLENEN ŞİFRE DEĞİŞTİR BUTONU */}
              <TouchableOpacity style={styles.islemKart} activeOpacity={0.8} onPress={() => router.push('/sifre-degistir' as any)}>
                <View style={[styles.islemIkonKutu, { backgroundColor: '#f6f4f7' }]}>
                  <Ionicons name="lock-closed" size={26} color="#dd92c4" />
                </View>
                <Text style={styles.islemKartYazi}>Şifre Değiştir</Text>
              </TouchableOpacity>

            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15, backgroundColor: '#F8F9FA' },
  profilSol: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
  avatarKutusu: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF4E5', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#FFE0B2' },
  avatarHarf: { fontSize: 24, fontWeight: 'bold', color: '#FF9F00' },
  profilBilgi: { flex: 1, justifyContent: 'center' },
  magazaAdi: { fontSize: 19, fontWeight: '800', color: '#1C1C1E', marginBottom: 2, letterSpacing: -0.5 },
  saticiAdi: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
  
  headerAksiyonGrup: { flexDirection: 'row', alignItems: 'center' },
  
  zarfButon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 12, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4, position: 'relative' },
  destekBadgeContainer: { position: 'absolute', top: -4, right: -4, backgroundColor: '#FF3B30', minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: '#FFFFFF', elevation: 4 },
  destekBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  
  cikisButon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF0F0', justifyContent: 'center', alignItems: 'center', shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  
  grafikToggleSatiri: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10, marginBottom: 15 },
  grafikBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF4E5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  grafikBadgeYazi: { color: '#FF9F00', fontWeight: '600', fontSize: 12, marginLeft: 4 },

  bolumBaslik: { fontSize: 16, fontWeight: '800', color: '#1C1C1E', marginLeft: 5 },

  istatistikKutusu: { flexDirection: 'row', paddingHorizontal: 15, marginBottom: 20, justifyContent: 'space-between' },
  istatistikKart: { flex: 1, backgroundColor: '#fff', paddingVertical: 16, paddingHorizontal: 5, borderRadius: 16, alignItems: 'center', marginHorizontal: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },
  istatistikSayi: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E', marginTop: 8 },
  istatistikBaslik: { fontSize: 12, color: '#8E8E93', marginTop: 4, fontWeight: '500', textAlign: 'center' },

  yonetimAraclariKutusu: { paddingHorizontal: 20 },
  islemGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 15 },
  islemKart: { width: '48%', backgroundColor: '#fff', paddingVertical: 22, borderRadius: 16, alignItems: 'center', marginBottom: 15, shadowColor: '#pi', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  islemIkonKutu: { padding: 16, borderRadius: 14, marginBottom: 12 },
  islemKartYazi: { fontSize: 14, fontWeight: '700', color: '#333', textAlign: 'center' },

  badgeContainer: { position: 'absolute', top: -6, right: -6, backgroundColor: '#FF3B30', minWidth: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5, borderWidth: 2, borderColor: '#FFFFFF', shadowColor: '#FF3B30', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4, zIndex: 10 },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }
});