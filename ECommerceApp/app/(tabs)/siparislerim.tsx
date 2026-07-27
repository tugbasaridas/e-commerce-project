import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, LayoutAnimation, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Siparislerim() {
  const router = useRouter();
  const [siparisler, setSiparisler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLogged, setIsLogged] = useState(false);
  const [aramaAktif, setAramaAktif] = useState(false);
  const [aramaMetni, setAramaMetni] = useState('');

  useFocusEffect(
    useCallback(() => {
      siparisleriGetir();
    }, [])
  );

  const siparisleriGetir = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setIsLogged(false);
        setLoading(false);
        return;
      }
      
      setIsLogged(true);
      const response = await axios.get(`${API_CONFIG.BASE_URL}/siparisler/gecmisim`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSiparisler(response.data);
    } catch (error) {
      console.error("Siparişler getirilemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const kargoTakipBaslat = async (takipNo: string | null, kargoFirma: string | null) => {
    const firmaAd = kargoFirma || "Kargo Firması";
    const kargoNo = takipNo || `TR${Math.floor(100000000 + Math.random() * 900000000)}`;
    const kargoUrl = `https://www.google.com/search?q=${firmaAd}+kargo+takip+${kargoNo}`;

    Alert.alert(
      "Kargo Takip Bilgisi", 
      `Firma: ${firmaAd}\nTakip No: ${kargoNo}\n\nKargo sitesine yönlendirilmek ister misiniz?`,
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Siteye Git", 
          onPress: async () => {
            const supported = await Linking.canOpenURL(kargoUrl);
            if (supported) {
              await Linking.openURL(kargoUrl);
            }
          } 
        }
      ]
    );
  };

  const urunDegerlendir = (urun: any) => {
    router.push({
      pathname: '/detay', 
      params: { id: String(urun.urunId) }
    } as any);
  };

  const tarihFormatla = (tarihString: string) => {
    const tarih = new Date(tarihString);
    return tarih.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getDurumStili = (durum: string) => {
    switch (durum) {
      case 'Hazırlanıyor': return { color: '#FFA500', bgColor: '#FFF3E0', icon: 'time-outline' };
      case 'Kargoya Verildi': return { color: '#1E90FF', bgColor: '#E6F2FF', icon: 'cube-outline' };
      case 'Tamamlandı': return { color: '#28A745', bgColor: '#E8F5E9', icon: 'checkmark-circle-outline' };
      case 'İptal': return { color: '#EF233C', bgColor: '#FFEBEA', icon: 'close-circle-outline' };
      default: return { color: '#6C757D', bgColor: '#F8F9FA', icon: 'information-circle-outline' };
    }
  };

  const toggleArama = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAramaAktif(!aramaAktif);
    if (aramaAktif) setAramaMetni('');
  };

  const filtrelenmisSiparisler = siparisler.filter(item => {
    const aramaKucuk = aramaMetni.toLowerCase();
    const noEslesiyorMu = item.id.toString().includes(aramaKucuk);
    const urunEslesiyorMu = item.urunler.some((u: any) => u.ad.toLowerCase().includes(aramaKucuk));
    return noEslesiyorMu || urunEslesiyorMu;
  });

  if (loading) return <View style={styles.merkez}><ActivityIndicator size="large" color="#FF9F00" /></View>;

  if (!isLogged) {
    return (
      <View style={styles.merkez}>
        <Ionicons name="cube-outline" size={80} color="#ccc" />
        <Text style={styles.altMetin}>Siparişlerinizi görmek için giriş yapmalısınız.</Text>
        <TouchableOpacity style={styles.girisButon} onPress={() => router.push('/(auth)/giris' as any)}>
          <Text style={styles.girisButonYazi}>Giriş Yap</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const siparisKartiCiz = ({ item }: { item: any }) => (
    <View style={styles.kart}>
      <View style={styles.kartUst}>
        <View>
          <Text style={styles.siparisNo}>Sipariş No: #{item.id}</Text>
          <Text style={styles.tarih}>{tarihFormatla(item.siparisTarihi)}</Text>
        </View>
        <View style={[styles.durumRozeti, { backgroundColor: '#F2F2F7' }]}>
          <Text style={[styles.durumYazi, { color: '#1C1C1E' }]}>{item.durum}</Text>
        </View>
      </View>

      <View style={styles.urunlerAlani}>
        {item.urunler.map((urun: any, index: number) => {
          const dStil = getDurumStili(urun.durum);
          return (
            <View key={index} style={{ marginBottom: 15 }}>
              <View style={styles.urunSatiri}>
                <Image source={{ uri: urun.resimUrl || 'https://via.placeholder.com/150' }} style={styles.urunResim} />
                <View style={styles.urunBilgi}>
                  <Text style={styles.urunAd} numberOfLines={2}>{urun.ad}</Text>
                  <Text style={styles.urunAdetFiyat}>
                    {urun.adet} adet x {urun.satinAlinanFiyat.toFixed(2)} TL
                  </Text>
                  <View style={[styles.kucukDurumRozet, { backgroundColor: dStil.bgColor }]}>
                    <Ionicons name={dStil.icon as any} size={12} color={dStil.color} style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: dStil.color }}>{urun.durum}</Text>
                  </View>
                </View>
              </View>

              {/* Kargom Nerede Butonu */}
              {urun.durum === 'Kargoya Verildi' && (
                <TouchableOpacity style={styles.kargoButon} onPress={() => kargoTakipBaslat(urun.kargoTakipNo, urun.kargoFirma)}>
                  <Ionicons name="location" size={16} color="#00529B" style={{marginRight: 6}} />
                  <Text style={styles.kargoButonYazi}>Kargom Nerede?</Text>
                  <Ionicons name="chevron-forward" size={16} color="#00529B" />
                </TouchableOpacity>
              )}

              {/* Ürünü Değerlendir Butonu */}
              {urun.durum === 'Tamamlandı' && (
                <TouchableOpacity style={styles.degerlendirButon} onPress={() => urunDegerlendir(urun)}>
                  <Ionicons name="star" size={16} color="#FF9F00" style={{marginRight: 6}}/>
                  <Text style={styles.degerlendirButonYazi}>Ürünü Değerlendir / İncele</Text>
                  <Ionicons name="chevron-forward" size={16} color="#FF9F00" />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.kartAlt}>
        <View style={{ flex: 1 }}>
          <Text style={styles.toplamYazi}>Ödeme: {item.odemeYontemi}</Text>
          <Text style={styles.adresYazi} numberOfLines={1}>{item.teslimatAdresi}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.toplamYazi}>Toplam:</Text>
          <Text style={styles.toplamFiyat}>{item.toplamTutar.toFixed(2)} TL</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.headerSatiri}>
        <Text style={styles.sayfaBaslik}>Siparişlerim</Text>
        {siparisler.length > 0 && (
          <TouchableOpacity onPress={toggleArama} style={styles.aramaIkonButon}>
            <Ionicons name={aramaAktif ? "close" : "search"} size={24} color="#1C1C1E" />
          </TouchableOpacity>
        )}
      </View>

      {aramaAktif && (
        <View style={styles.aramaKutusu}>
          <TextInput
            style={styles.aramaInput}
            placeholder="Sipariş no veya ürün ara..."
            value={aramaMetni}
            onChangeText={setAramaMetni}
            autoFocus={true}
          />
        </View>
      )}

      <FlatList
        data={filtrelenmisSiparisler}
        keyExtractor={(item) => item.id.toString()}
        renderItem={siparisKartiCiz}
        contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.merkez}>
            <Ionicons name="receipt-outline" size={80} color="#ccc" />
            <Text style={[styles.altMetin, { textAlign: 'center', marginTop: 15 }]}>Henüz siparişiniz yok.</Text>
            {aramaAktif && <Text style={{ color: '#888', marginTop: 5 }}>Aramanıza uygun sipariş bulunamadı.</Text>}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  headerSatiri: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  sayfaBaslik: { fontSize: 26, fontWeight: 'bold' },
  aramaIkonButon: { padding: 8, backgroundColor: '#eee', borderRadius: 20 },
  aramaKutusu: { flexDirection: 'row', backgroundColor: '#F0F0F5', padding: 12, marginHorizontal: 15, borderRadius: 12, marginBottom: 10 },
  aramaInput: { flex: 1, fontSize: 16 },
  kart: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 15, padding: 15, borderWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  kartUst: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F2F2F7', paddingBottom: 10 },
  siparisNo: { fontWeight: 'bold', fontSize: 16 },
  tarih: { fontSize: 12, color: '#888', marginTop: 2 },
  durumRozeti: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  durumYazi: { fontSize: 12, fontWeight: '600' },
  urunlerAlani: { marginBottom: 5 },
  urunSatiri: { flexDirection: 'row', alignItems: 'center' },
  urunResim: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#f0f0f0' },
  urunBilgi: { flex: 1, marginLeft: 12 },
  urunAd: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  urunAdetFiyat: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  kucukDurumRozet: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  kartAlt: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderColor: '#eee' },
  toplamYazi: { fontSize: 12, color: '#8E8E93' },
  toplamFiyat: { fontSize: 18, fontWeight: 'bold', color: '#FF9F00' },
  adresYazi: { fontSize: 11, color: '#888', fontStyle: 'italic', marginTop: 4 },
  kargoButon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E1F5FE', padding: 12, borderRadius: 10, marginTop: 10 },
  kargoButonYazi: { flex: 1, marginLeft: 6, fontWeight: 'bold', color: '#00529B', fontSize: 13 },
  degerlendirButon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF4E5', padding: 12, borderRadius: 10, marginTop: 10 },
  degerlendirButonYazi: { flex: 1, fontWeight: 'bold', color: '#FF9F00', fontSize: 13 },
  girisButon: { backgroundColor: 'orange', padding: 15, borderRadius: 10, marginTop: 20 },
  girisButonYazi: { color: '#fff', fontWeight: 'bold' },
  altMetin: { fontSize: 16, color: '#888' },
});