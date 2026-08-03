import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SiparisDurumModal from '../../components/SiparisDurumModal';
import SiparisKart from '../../components/SiparisKart';

// Kategori Filtre Tipleri
type SiparisKategori = 'Tümü' | 'Hazırlanıyor' | 'Kargoya Verildi' | 'Tamamlandı' | 'İptal Edildi';

export default function SaticiSiparisler() {
  const router = useRouter();
  const [tumSiparisler, setTumSiparisler] = useState<any[]>([]); // Orijinal veri
  const [filtrelenmisSiparisler, setFiltrelenmisSiparisler] = useState<any[]>([]); // Ekranda gösterilen
  const [loading, setLoading] = useState(true);

  // Arama ve Kategori State'leri
  const [aramaMetni, setAramaMetni] = useState('');
  const [aktifKategori, setAktifKategori] = useState<SiparisKategori>('Tümü');

  const [modalGorunur, setModalGorunur] = useState(false);
  const [seciliSiparis, setSeciliSiparis] = useState<any | null>(null);
  const [seciliUrun, setSeciliUrun] = useState<any | null>(null);

  useFocusEffect(
    useCallback(() => {
      siparisleriGetir();
    }, [])
  );

  // Arama veya Kategori değiştiğinde filtrelemeyi çalıştır
  useEffect(() => {
    filtrele(tumSiparisler, aramaMetni, aktifKategori);
  }, [aramaMetni, aktifKategori, tumSiparisler]);

  const siparisleriGetir = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/satici/siparislerim`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTumSiparisler(response.data);
      setFiltrelenmisSiparisler(response.data);
    } catch (error) {
      console.error("Siparişler çekilemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtrele = (liste: any[], aranan: string, kategori: SiparisKategori) => {
    let sonuc = [...liste];

    // 1. Kategori Filtresi
    if (kategori !== 'Tümü') {
      sonuc = sonuc.filter(s => s.durum?.toLowerCase() === kategori.toLowerCase());
    }

    // 2. Arama Filtresi (Sipariş ID veya Müşteri Adına göre)
    if (aranan.trim() !== '') {
      const arananKucuk = aranan.toLowerCase();
      sonuc = sonuc.filter(s => 
        s.siparisId.toString().includes(arananKucuk) || 
        (s.musteriAd && s.musteriAd.toLowerCase().includes(arananKucuk))
      );
    }

    setFiltrelenmisSiparisler(sonuc);
  };

  const durumSec = async (yeniDurum: string, kargoFirma?: string, kargoTakipNo?: string) => {
    if (!seciliUrun) return;
    
    if (yeniDurum === 'Kargoya Verildi' && (!kargoFirma || !kargoTakipNo)) {
        Alert.alert("Uyarı", "Lütfen kargo firması ve takip numarasını doldurun.");
        return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      
      await axios.put(`${API_CONFIG.BASE_URL}/satici/siparis-detay/${seciliUrun.detayId}/durum`, 
        { 
          yeniDurum: yeniDurum,
          kargoFirma: kargoFirma || null,
          kargoTakipNo: kargoTakipNo || null
        }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      Alert.alert("Başarılı", "Ürün durumu başarıyla güncellendi.");
      setModalGorunur(false);
      siparisleriGetir(); 
    } catch (error) {
      Alert.alert("Hata", "Güncelleme işlemi başarısız oldu.");
    }
  };

  const kategoriler: SiparisKategori[] = ['Tümü', 'Hazırlanıyor', 'Kargoya Verildi', 'Tamamlandı', 'İptal Edildi'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.geriBtn}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.baslik}>Mağaza Siparişleri</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Arama Çubuğu */}
      <View style={styles.aramaKutusu}>
        <Ionicons name="search" size={20} color="#8E8E93" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.aramaInput}
          placeholder="Sipariş No veya Müşteri Adı ile ara..."
          placeholderTextColor="#8E8E93"
          value={aramaMetni}
          onChangeText={setAramaMetni}
        />
        {aramaMetni.length > 0 && (
          <TouchableOpacity onPress={() => setAramaMetni('')}>
            <Ionicons name="close-circle" size={18} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      {/* Yatay Kategori / Durum Sekmeleri */}
      <View style={styles.kategoriAlani}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {kategoriler.map((kat) => (
            <TouchableOpacity
              key={kat}
              style={[styles.kategoriHap, aktifKategori === kat && styles.kategoriHapAktif]}
              onPress={() => setAktifKategori(kat)}
            >
              <Text style={[styles.kategoriYazi, aktifKategori === kat && styles.kategoriYaziAktif]}>
                {kat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Liste / İçerik */}
      {loading ? (
        <View style={styles.merkez}>
          <ActivityIndicator size="large" color="#FF9F00" />
        </View>
      ) : (
        <FlatList
          data={filtrelenmisSiparisler}
          keyExtractor={(item) => item.siparisId.toString()}
          contentContainerStyle={styles.listeIcerik}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.bosKutu}>
              <Ionicons name="receipt-outline" size={60} color="#D1D1D6" />
              <Text style={styles.bosBaslik}>Sipariş Bulunamadı</Text>
              <Text style={styles.bosIcerik}>
                {aramaMetni ? "Arama kriterine uygun sipariş eşleşmedi." : "Seçilen kategoride henüz sipariş yer almıyor."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <SiparisKart 
              item={item} 
              onGuncelle={(siparis, urun) => {
                setSeciliSiparis(siparis);
                setSeciliUrun(urun);
                setModalGorunur(true);
              }} 
              onKargoTakip={() => {}} 
            />
          )}
        />
      )}

      <SiparisDurumModal 
        visible={modalGorunur}
        siparis={seciliSiparis}
        seciliUrun={seciliUrun}
        onClose={() => setModalGorunur(false)}
        onDurumSec={durumSec}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA'
  },
  geriBtn: { padding: 4 },
  baslik: { fontSize: 17, fontWeight: 'bold', color: '#1C1C1E' },
  
  aramaKutusu: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  aramaInput: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
  },

  kategoriAlani: {
    marginTop: 10,
    marginBottom: 4,
  },
  kategoriHap: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kategoriHapAktif: {
    backgroundColor: '#FF9F00',
    borderColor: '#FF9F00',
  },
  kategoriYazi: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A3A3C',
  },
  kategoriYaziAktif: {
    color: '#FFFFFF',
  },

  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listeIcerik: { padding: 16 },

  bosKutu: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 30,
  },
  bosBaslik: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  bosIcerik: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  }
});