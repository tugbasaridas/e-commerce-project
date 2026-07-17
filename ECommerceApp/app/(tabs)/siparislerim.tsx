import { API_CONFIG } from '@/config/api';
import { Siparis } from '@/types/Siparis';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  LayoutAnimation,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Siparislerim() {
  const router = useRouter();
  const [siparisler, setSiparisler] = useState<Siparis[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLogged, setIsLogged] = useState(false);

  // ARAMA SİSTEMİ STATE'LERİ
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

  // GERÇEKÇİ KARGO TAKİP YÖNLENDİRMESİ
  const kargoTakipBaslat = async (siparisId: number) => {
    const kargoNo = `ARS${Math.floor(100000000 + Math.random() * 900000000)}`;
    const kargoUrl = `https://www.araskargo.com.tr/kargo-takip`;

    Alert.alert(
      "Kargo Takip Bilgisi", 
      `Siparişiniz yola çıkmıştır.\nTakip No: ${kargoNo}\n\nKargo firmasının takip sayfasına yönlendirilmek ister misiniz?`,
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Siteye Git", 
          onPress: async () => {
            const supported = await Linking.canOpenURL(kargoUrl);
            if (supported) {
              await Linking.openURL(kargoUrl);
            } else {
              Alert.alert("Hata", "Takip sayfası açılamadı.");
            }
          } 
        }
      ]
    );
  };

  const tarihFormatla = (tarihString: string) => {
    const tarih = new Date(tarihString);
    return tarih.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDurumStili = (durum: string) => {
    switch (durum) {
      case 'Hazırlanıyor':
        return { color: '#FFA500', bgColor: '#FFF3E0', icon: 'time-outline' };
      case 'Kargoya Verildi':
        return { color: '#1E90FF', bgColor: '#E6F2FF', icon: 'cube-outline' };
      case 'Tamamlandı':
        return { color: '#28A745', bgColor: '#E8F5E9', icon: 'checkmark-circle-outline' };
      default:
        return { color: '#6C757D', bgColor: '#F8F9FA', icon: 'information-circle-outline' };
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
    const urunEslesiyorMu = item.urunler.some(u => u.ad.toLowerCase().includes(aramaKucuk));
    return noEslesiyorMu || urunEslesiyorMu;
  });

  if (loading) return <View style={styles.merkez}><ActivityIndicator size="large" color="#FFB800" /></View>;

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

  const siparisKartiCiz = ({ item }: { item: Siparis }) => {
    const durumStil = getDurumStili(item.durum);

    return (
      <View style={styles.kart}>
        <View style={styles.kartUst}>
          <View>
            <Text style={styles.siparisNo}>Sipariş No: #{item.id}</Text>
            <Text style={styles.tarih}>{tarihFormatla(item.siparisTarihi)}</Text>
          </View>
          <View style={[styles.durumRozeti, { backgroundColor: durumStil.bgColor }]}>
            <Ionicons name={durumStil.icon as any} size={14} color={durumStil.color} style={{ marginRight: 4 }} />
            <Text style={[styles.durumYazi, { color: durumStil.color }]}>{item.durum}</Text>
          </View>
        </View>

        <View style={styles.urunlerAlani}>
          {item.urunler.map((urun, index) => (
            <View key={index} style={styles.urunSatiri}>
              <View style={styles.urunBilgi}>
                <Text style={styles.urunAd} numberOfLines={1}>{urun.ad}</Text>
                <Text style={styles.urunAdetFiyat}>
                  {urun.adet} adet x {urun.satinAlinanFiyat.toFixed(2)} TL
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.kartAlt}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toplamYazi}>Ödeme: {item.odemeYontemi}</Text>
            <Text style={styles.adresYazi} numberOfLines={1}>{item.teslimatAdresi}</Text>
            {(item as any).telefon ? (
              <Text style={[styles.adresYazi, { color: '#00529B', fontWeight: 'bold' }]}>Tel: {(item as any).telefon}</Text>
            ) : null}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.toplamYazi}>Toplam:</Text>
            <Text style={styles.toplamFiyat}>{item.toplamTutar.toFixed(2)} TL</Text>
          </View>
        </View>

        {item.durum === 'Kargoya Verildi' && (
          <TouchableOpacity style={styles.kargoButon} onPress={() => kargoTakipBaslat(item.id)}>
            <Image 
              source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Aras_Kargo_logo.svg/1200px-Aras_Kargo_logo.svg.png' }} 
              style={styles.kargoLogo} resizeMode="contain"
            />
            <Text style={styles.kargoButonYazi}>Kargom Nerede?</Text>
            <Ionicons name="chevron-forward" size={16} color="#00529B" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.headerSatiri}>
        <Text style={styles.sayfaBaslik}>Siparişlerim</Text>
        {siparisler.length > 0 && (
          <TouchableOpacity onPress={toggleArama} style={styles.aramaIkonButon}>
            <Ionicons name={aramaAktif ? "close" : "search"} size={26} color="#333" />
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

      {siparisler.length === 0 ? (
        <View style={styles.merkez}>
          <Ionicons name="receipt-outline" size={80} color="#ccc" />
          <Text style={[styles.altMetin, { textAlign: 'center', marginTop: 15 }]}>
            Henüz hiçbir siparişiniz bulunmamaktadır.
          </Text>
          <TouchableOpacity style={styles.girisButon} onPress={() => router.replace('/(tabs)' as any)}>
            <Text style={styles.girisButonYazi}>Alışverişe Başla</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtrelenmisSiparisler}
          keyExtractor={(item) => item.id.toString()}
          renderItem={siparisKartiCiz}
          contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>
              Aramanıza uygun sipariş bulunamadı.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerSatiri: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  sayfaBaslik: { fontSize: 26, fontWeight: 'bold' },
  aramaIkonButon: { padding: 8, backgroundColor: '#eee', borderRadius: 20 },
  aramaKutusu: { flexDirection: 'row', backgroundColor: '#F0F0F5', padding: 12, marginHorizontal: 15, borderRadius: 12, marginBottom: 10 },
  aramaInput: { flex: 1, fontSize: 16 },
  kart: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, padding: 15, borderWidth: 1, borderColor: '#eee' },
  kartUst: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  siparisNo: { fontWeight: 'bold' },
  tarih: { fontSize: 12, color: '#888' },
  durumRozeti: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  durumYazi: { fontSize: 12, fontWeight: '600' },
  urunlerAlani: { marginBottom: 10 },
  urunSatiri: { marginBottom: 5 },
  urunAd: { fontSize: 13, fontWeight: '500' },
  urunAdetFiyat: { fontSize: 12, color: '#777' },
  kartAlt: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 10, borderColor: '#eee' },
  toplamYazi: { fontSize: 12, color: '#555' },
  toplamFiyat: { fontSize: 16, fontWeight: 'bold' },
  adresYazi: { fontSize: 11, color: '#888', fontStyle: 'italic' },
  kargoButon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6F2FF', padding: 12, borderRadius: 8, marginTop: 10 },
  kargoLogo: { width: 60, height: 20 },
  kargoButonYazi: { flex: 1, marginLeft: 10, fontWeight: 'bold', color: '#00529B' },
  girisButon: { backgroundColor: 'orange', padding: 15, borderRadius: 10, marginTop: 20 },
  girisButonYazi: { color: '#fff', fontWeight: 'bold' },
  altMetin: { fontSize: 16, color: '#888' },
  urunBilgi: { 
    flex: 1, 
    marginLeft: 12 
  },
});