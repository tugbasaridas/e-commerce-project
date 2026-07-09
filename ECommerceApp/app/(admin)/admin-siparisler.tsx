import api, { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminSiparisler() {
  const router = useRouter();
  const [siparisler, setSiparisler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalGorunur, setModalGorunur] = useState(false);
  const [seciliSiparis, setSeciliSiparis] = useState<number | null>(null);

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
      guncelleApi(seciliSiparis, yeniDurum);
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

  const getDurumRenkleri = (durum: string) => {
    switch (durum) {
      case 'Hazırlanıyor': return { bg: '#FFF4E5', text: '#FF9F00', icon: 'time-outline' };
      case 'Kargoya Verildi': return { bg: '#E1F5FE', text: '#4EA8DE', icon: 'cube-outline' };
      case 'Tamamlandı': return { bg: '#F0FDF4', text: '#28A745', icon: 'checkmark-circle-outline' };
      case 'İptal': return { bg: '#FFEBEA', text: '#EF233C', icon: 'close-circle-outline' };
      default: return { bg: '#F8F9FA', text: '#8E8E93', icon: 'ellipse-outline' };
    }
  };

  if (loading) return <View style={styles.merkez}><ActivityIndicator size="large" color="#FF9F00" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.baslik}>Sipariş Yönetimi</Text>
      </View>

      <FlatList
        data={siparisler}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const renkler = getDurumRenkleri(item.durum);
          return (
            <View style={styles.kart}>
              
              <View style={styles.kartUst}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.siparisNo}>Sipariş #{item.id}</Text>
                  
                  <View style={styles.kullaniciBilgiSatiri}>
                    <Ionicons name="person" size={12} color="#8E8E93" />
                    <Text style={styles.kullaniciYazi}>{item.kullaniciAdSoyad || 'İsimsiz Kullanıcı'}</Text>
                  </View>
                  
                  <View style={styles.kullaniciBilgiSatiri}>
                    <Ionicons name="mail" size={12} color="#8E8E93" />
                    <Text style={styles.kullaniciEmailYazi}>{item.kullaniciEmail}</Text>
                  </View>
                </View>

                <View style={[styles.durumBadge, { backgroundColor: renkler.bg }]}>
                  <Ionicons name={renkler.icon as any} size={14} color={renkler.text} style={{ marginRight: 4 }} />
                  <Text style={[styles.durumYazi, { color: renkler.text }]}>{item.durum}</Text>
                </View>
              </View>

              <View style={styles.ayiriciCizgi} />
              
              <View style={styles.urunlerKutusu}>
                {item.urunler && item.urunler.map((urun: any, index: number) => (
                  <Text key={index} style={styles.urunDetayYazi}>
                    <Text style={styles.urunAdet}>{urun.adet}x</Text> {urun.ad} 
                    <Text style={styles.urunFiyat}> ({(urun.birimFiyat * urun.adet).toFixed(2)} TL)</Text>
                  </Text>
                ))}
              </View>
              
              {/* YENİ EKLENEN KISIM: ADRES VE ÖDEME YÖNTEMİ */}
              <View style={styles.kargoKutusu}>
                <View style={styles.kargoSatiri}>
                  <Ionicons name="location-outline" size={14} color="#8E8E93" />
                  <Text style={styles.kargoAdresYazi}>{item.teslimatAdresi || 'Adres bilgisi yok.'}</Text>
                </View>
                <View style={styles.kargoSatiri}>
                  <Ionicons name="card-outline" size={14} color="#8E8E93" />
                  <Text style={styles.kargoOdemeYazi}>{item.odemeYontemi || 'Belirtilmemiş'}</Text>
                </View>
              </View>

              <View style={styles.ayiriciCizgi} />

              <View style={styles.kartAlt}>
                <Text style={styles.fiyatAlan}>
                  Toplam: <Text style={styles.fiyatDeger}>{item.toplamTutar.toFixed(2)} TL</Text>
                </Text>

                <TouchableOpacity 
                  style={styles.btnGuncelle} 
                  activeOpacity={0.8}
                  onPress={() => {
                    setSeciliSiparis(item.id);
                    setModalGorunur(true);
                  }}
                >
                  <Ionicons name="color-wand-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.btnGuncelleYazi}>Güncelle</Text>
                </TouchableOpacity>
              </View>

            </View>
          );
        }}
      />

      <Modal
        visible={modalGorunur}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalGorunur(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalGorunur(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalTutacak} />
                <Text style={styles.modalBaslik}>Sipariş Durumunu Seçin</Text>
                <Text style={styles.modalAltBaslik}>#{seciliSiparis} numaralı sipariş için yeni durumu belirleyin.</Text>
                
                <TouchableOpacity style={[styles.modalSecenek, { borderLeftColor: '#FF9F00' }]} onPress={() => durumSec('Hazırlanıyor')}>
                  <View style={[styles.modalSecenekIcon, { backgroundColor: '#FFF4E5' }]}>
                    <Ionicons name="time-outline" size={20} color="#FF9F00" />
                  </View>
                  <Text style={styles.modalSecenekYazi}>Hazırlanıyor</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.modalSecenek, { borderLeftColor: '#4EA8DE' }]} onPress={() => durumSec('Kargoya Verildi')}>
                  <View style={[styles.modalSecenekIcon, { backgroundColor: '#E1F5FE' }]}>
                    <Ionicons name="cube-outline" size={20} color="#4EA8DE" />
                  </View>
                  <Text style={styles.modalSecenekYazi}>Kargoya Verildi</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.modalSecenek, { borderLeftColor: '#28A745' }]} onPress={() => durumSec('Tamamlandı')}>
                  <View style={[styles.modalSecenekIcon, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#28A745" />
                  </View>
                  <Text style={styles.modalSecenekYazi}>Tamamlandı</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.modalSecenek, { borderLeftColor: '#EF233C' }]} onPress={() => durumSec('İptal')}>
                  <View style={[styles.modalSecenekIcon, { backgroundColor: '#FFEBEA' }]}>
                    <Ionicons name="close-circle-outline" size={20} color="#EF233C" />
                  </View>
                  <Text style={styles.modalSecenekYazi}>İptal</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalVazgecBtn} onPress={() => setModalGorunur(false)}>
                  <Text style={styles.modalVazgecYazi}>Vazgeç</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backBtn: { padding: 5 },
  baslik: { fontSize: 20, fontWeight: 'bold', marginLeft: 15, color: '#1C1C1E' },
  listContainer: { padding: 20, paddingBottom: 100 },
  
  kart: { 
    backgroundColor: '#FFFFFF', 
    padding: 18, 
    marginBottom: 16, 
    borderRadius: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3 
  },
  kartUst: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  siparisNo: { fontWeight: '800', fontSize: 16, color: '#1C1C1E', marginBottom: 6 },
  
  kullaniciBilgiSatiri: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  kullaniciYazi: { fontSize: 13, color: '#1C1C1E', marginLeft: 4, fontWeight: '500' },
  kullaniciEmailYazi: { fontSize: 12, color: '#8E8E93', marginLeft: 4 },
  
  durumBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  durumYazi: { fontSize: 12, fontWeight: '700' },
  
  ayiriciCizgi: { height: 1, backgroundColor: '#F2F2F7', marginVertical: 12 },
  
  urunlerKutusu: { paddingLeft: 4, marginBottom: 8 },
  urunDetayYazi: { fontSize: 13, color: '#48484A', marginBottom: 6 },
  urunAdet: { fontWeight: '700', color: '#1C1C1E' },
  urunFiyat: { color: '#BFBFBF', fontSize: 12 },

  // YENİ: Kargo ve Adres Kısımları İçin Stiller
  kargoKutusu: { backgroundColor: '#F8F9FA', padding: 10, borderRadius: 8, marginTop: 4 },
  kargoSatiri: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  kargoAdresYazi: { fontSize: 12, color: '#48484A', marginLeft: 6, flex: 1, lineHeight: 18 },
  kargoOdemeYazi: { fontSize: 12, color: '#1C1C1E', marginLeft: 6, fontWeight: '600' },

  kartAlt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  fiyatAlan: { fontSize: 13, color: '#8E8E93' },
  fiyatDeger: { fontWeight: '800', color: '#1C1C1E', fontSize: 18 },
  
  btnGuncelle: { 
    flexDirection: 'row', 
    backgroundColor: '#4EA8DE', 
    paddingVertical: 10, 
    paddingHorizontal: 16,
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#4EA8DE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  btnGuncelleYazi: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 25,
    paddingBottom: 35,
    paddingTop: 15,
  },
  modalTutacak: {
    width: 40,
    height: 5,
    backgroundColor: '#E5E5EA',
    borderRadius: 5,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalBaslik: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  modalAltBaslik: { fontSize: 14, color: '#8E8E93', marginBottom: 20 },
  modalSecenek: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  modalSecenekIcon: { padding: 8, borderRadius: 8, marginRight: 15 },
  modalSecenekYazi: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  modalVazgecBtn: {
    marginTop: 15,
    paddingVertical: 15,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    alignItems: 'center',
  },
  modalVazgecYazi: { color: '#1C1C1E', fontSize: 16, fontWeight: 'bold' }
});