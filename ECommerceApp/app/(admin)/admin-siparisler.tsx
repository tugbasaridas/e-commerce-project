import api, { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Oluşturduğumuz bileşenleri içe aktarıyoruz
import SiparisDurumModal from '../../components/SiparisDurumModal';
import SiparisKart from '../../components/SiparisKart';

export default function AdminSiparisler() {
  const router = useRouter();
  const [siparisler, setSiparisler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalGorunur, setModalGorunur] = useState(false);
  const [seciliSiparis, setSeciliSiparis] = useState<any | null>(null); // Sadece ID değil, tüm objeyi tutuyoruz

  const [aramaMetni, setAramaMetni] = useState('');
  const [seciliDurum, setSeciliDurum] = useState('Tümü');

  useFocusEffect(
    useCallback(() => {
      siparisleriGetir();
    }, [])
  );

  const siparisleriGetir = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/siparisler'); 
      setSiparisler(response.data);
    } catch (error: any) {
      Alert.alert("Hata", "Siparişler yüklenemedi. Lütfen backend rotasını kontrol et.");
    } finally {
      setLoading(false);
    }
  };

  const durumSec = (yeniDurum: string) => {
    if (seciliSiparis !== null) {
      guncelleApi(seciliSiparis.id, yeniDurum);
    }
    setModalGorunur(false);
  };

  const guncelleApi = async (id: number, yeniDurum: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(`${API_CONFIG.BASE_URL}/admin/siparisler/${id}/durum`, 
        { yeniDurum }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      siparisleriGetir(); 
    } catch (error) {
      Alert.alert("Hata", "Güncelleme başarısız.");
    }
  };

  const kargoTakipBaslat = async (siparisId: number) => {
    const kargoNo = `ARS${Math.floor(100000000 + Math.random() * 900000000)}`;
    const kargoUrl = `https://www.araskargo.com.tr/kargo-takip`;

    Alert.alert(
      "Kargo Takip", 
      `Sipariş #${siparisId}\nTakip No: ${kargoNo}\n\nKargo firmasının takip sayfasına gitmek ister misiniz?`,
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Siteye Git", 
          onPress: async () => {
            const supported = await Linking.canOpenURL(kargoUrl);
            if (supported) await Linking.openURL(kargoUrl);
            else Alert.alert("Hata", "Takip sayfası açılamadı.");
          } 
        }
      ]
    );
  };

  const filtrelenmisSiparisler = useMemo(() => {
    return siparisler.filter(siparis => {
      const durumUyar = seciliDurum === 'Tümü' || siparis.durum === seciliDurum;
      const aramaKucukHarf = aramaMetni.toLowerCase();
      const aramaUyar = 
        siparis.id.toString().includes(aramaKucukHarf) ||
        (siparis.kullaniciAdSoyad && siparis.kullaniciAdSoyad.toLowerCase().includes(aramaKucukHarf)) ||
        (siparis.kullaniciEmail && siparis.kullaniciEmail.toLowerCase().includes(aramaKucukHarf)) ||
        (siparis.teslimatAdresi && siparis.teslimatAdresi.toLowerCase().includes(aramaKucukHarf)) ||
        (siparis.telefon && siparis.telefon.toLowerCase().includes(aramaKucukHarf));

      return durumUyar && aramaUyar;
    });
  }, [siparisler, aramaMetni, seciliDurum]);

  const durumSecenekleri = ['Tümü', 'Hazırlanıyor', 'Kargoya Verildi', 'Tamamlandı', 'İptal'];

  if (loading) return <View style={styles.merkez}><ActivityIndicator size="large" color="#FF9F00" /></View>;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.navigate('/(admin)/admin-islemler' as any)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.baslik}>Sipariş Yönetimi</Text>
      </View>

      <View style={styles.aramaKutusuContainer}>
        <View style={styles.aramaKutusu}>
          <Ionicons name="search-outline" size={20} color="#8E8E93" />
          <TextInput
            style={styles.aramaInput}
            placeholder="Sipariş No, İsim, E-posta veya Telefon ara..."
            placeholderTextColor="#8E8E93"
            value={aramaMetni}
            onChangeText={setAramaMetni}
            autoCorrect={false}
          />
          {aramaMetni.length > 0 && (
            <TouchableOpacity onPress={() => setAramaMetni('')}>
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filtreKapsayici}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtreScroll}>
          {durumSecenekleri.map((durum, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.filtreChip, seciliDurum === durum && styles.aktifFiltreChip]}
              onPress={() => setSeciliDurum(durum)}
            >
              <Text style={[styles.filtreChipYazi, seciliDurum === durum && styles.aktifFiltreChipYazi]}>{durum}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtrelenmisSiparisler}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.bosListeMetni}>Aradığınız kriterlere uygun sipariş bulunamadı.</Text>
        }
        renderItem={({ item }) => (
          <SiparisKart 
            item={item} 
            onGuncelle={(siparis) => {
              setSeciliSiparis(siparis);
              setModalGorunur(true);
            }} 
            onKargoTakip={kargoTakipBaslat} 
          />
        )}
      />

      <SiparisDurumModal 
        visible={modalGorunur}
        siparis={seciliSiparis}
        onClose={() => setModalGorunur(false)}
        onDurumSec={durumSec}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, backgroundColor: '#FFFFFF' },
  backBtn: { padding: 5 },
  baslik: { fontSize: 20, fontWeight: 'bold', marginLeft: 15, color: '#1C1C1E' },
  aramaKutusuContainer: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingBottom: 10 },
  aramaKutusu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 10, paddingHorizontal: 12, height: 44 },
  aramaInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#1C1C1E' },
  filtreKapsayici: { backgroundColor: '#FFFFFF', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  filtreScroll: { paddingHorizontal: 15 },
  filtreChip: { backgroundColor: '#F2F2F7', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginHorizontal: 5, borderWidth: 1, borderColor: '#E5E5EA' },
  aktifFiltreChip: { backgroundColor: '#4EA8DE', borderColor: '#4EA8DE' },
  filtreChipYazi: { fontSize: 13, color: '#48484A', fontWeight: '600' },
  aktifFiltreChipYazi: { color: '#FFFFFF' },
  bosListeMetni: { textAlign: 'center', color: '#8E8E93', marginTop: 50, fontSize: 15 },
  listContainer: { padding: 20, paddingBottom: 100 }
});