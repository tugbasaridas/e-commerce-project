import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SiparisDurumModal from '../../components/SiparisDurumModal';
import SiparisKart from '../../components/SiparisKart';

export default function AdminSiparisler() {
  const router = useRouter();
  const [siparisler, setSiparisler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalGorunur, setModalGorunur] = useState(false);
  const [seciliSiparis, setSeciliSiparis] = useState<any | null>(null); 
  const [seciliUrun, setSeciliUrun] = useState<any | null>(null);

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
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/admin/siparisler`, {
        headers: { Authorization: `Bearer ${token}` }
      }); 
      setSiparisler(response.data);
    } catch (error: any) {
      Alert.alert("Hata", "Siparişler yüklenemedi. Lütfen backend bağlantınızı kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  const durumSec = (yeniDurum: string, kargoFirma?: string, kargoTakipNo?: string) => {
    if (seciliUrun !== null) {
      guncelleApi(seciliUrun.detayId, yeniDurum, kargoFirma, kargoTakipNo);
    }
  };

  const guncelleApi = async (detayId: number, yeniDurum: string, kargoFirma?: string, kargoTakipNo?: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      await axios.put(`${API_CONFIG.BASE_URL}/admin/siparis-detay/${detayId}/durum`, 
        { yeniDurum, kargoFirma, kargoTakipNo }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      Alert.alert("Başarılı", "Ürün durumu başarıyla güncellendi.");
      setModalGorunur(false);
      siparisleriGetir(); 
    } catch (error) {
      Alert.alert("Hata", "Güncelleme başarısız oldu.");
    }
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

  // İŞTE BURAYI DA EŞİTLEDİK
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
        renderItem={({ item }) => {
          const toplam = item.toplamTutar ?? item.ToplamTutar ?? 0;
          const saticiKazanc = item.saticiKazanci ?? item.SaticiKazanci ?? (toplam * 0.90);
          const adminKazanc = item.adminKazanci ?? item.AdminKazanci ?? (toplam * 0.10);

          return (
            <View style={styles.siparisKapsayici}>
              <SiparisKart 
                item={item} 
                isAdmin={true} 
                onGuncelle={(siparis, urun) => {
                  setSeciliSiparis(siparis);
                  setSeciliUrun(urun);
                  setModalGorunur(true);
                }} 
                onKargoTakip={() => {}} 
              />

              <View style={styles.adminPanelKutu}>
                <View style={styles.adminPanelHeader}>
                  <Ionicons name="shield-checkmark" size={16} color="#007AFF" />
                  <Text style={styles.adminPanelBaslik}>Admin Yetkileri & Finans</Text>
                </View>

                <View style={styles.finansSatir}>
                  <Text style={styles.finansEtiket}>Müşteri Ödediği:</Text>
                  <Text style={styles.finansTutarMusteri}>{toplam.toFixed(2)} ₺</Text>
                </View>
                <View style={styles.finansAyrac} />
                <View style={styles.finansSatir}>
                  <Text style={styles.finansEtiket}>Satıcı Kazancı (%90):</Text>
                  <Text style={styles.finansTutarSatici}>{saticiKazanc.toFixed(2)} ₺</Text>
                </View>
                <View style={styles.finansSatir}>
                  <Text style={styles.finansEtiket}>Admin Kazancı (%10):</Text>
                  <Text style={styles.finansTutarAdmin}>{adminKazanc.toFixed(2)} ₺</Text>
                </View>
              </View>
            </View>
          );
        }}
      />

      <SiparisDurumModal 
        visible={modalGorunur}
        siparis={seciliSiparis}
        seciliUrun={seciliUrun} 
        isAdmin={true} 
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
  listContainer: { padding: 20, paddingBottom: 100 },
  siparisKapsayici: { marginBottom: 25 },
  adminPanelKutu: { backgroundColor: '#E5F1FF', borderRadius: 12, padding: 15, marginTop: -10, marginHorizontal: 5, borderWidth: 1, borderColor: '#CCE4FF' },
  adminPanelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  adminPanelBaslik: { fontSize: 14, fontWeight: 'bold', color: '#007AFF', marginLeft: 6 },
  finansSatir: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  finansEtiket: { fontSize: 13, color: '#48484A', fontWeight: '500' },
  finansAyrac: { height: 1, backgroundColor: '#CCE4FF', marginVertical: 8 },
  finansTutarMusteri: { fontSize: 14, fontWeight: 'bold', color: '#1C1C1E' },
  finansTutarSatici: { fontSize: 14, fontWeight: 'bold', color: '#28A745' },
  finansTutarAdmin: { fontSize: 14, fontWeight: 'bold', color: '#007AFF' }
});