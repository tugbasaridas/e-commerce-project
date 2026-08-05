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
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SiparisDurumCubugu from '../../components/SiparisDurumCubugu';

export default function AdminSiparisler() {
  const router = useRouter();
  const [siparisler, setSiparisler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalGorunur, setModalGorunur] = useState(false);
  const [seciliUrun, setSeciliUrun] = useState<any | null>(null);
  const [yeniDurum, setYeniDurum] = useState('Hazırlanıyor');
  const [kargoFirma, setKargoFirma] = useState('');
  const [kargoTakipNo, setKargoTakipNo] = useState('');

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
      const gercekHata = error.response?.data?.message || error.response?.data || error.message || "Bilinmeyen Hata";
      const statusCode = error.response?.status || "Ağ Hatası";
      console.log("🚨 API ÇÖKME DETAYI:", error);
      Alert.alert(`Hata Kodu: ${statusCode}`, `Detay: ${JSON.stringify(gercekHata)}`);
    } finally {
      setLoading(false);
    }
  };

  const durumGuncellemeModalAc = (urun: any) => {
    setSeciliUrun(urun);
    setYeniDurum(urun.durum || 'Hazırlanıyor');
    setKargoFirma(urun.kargoFirma || '');
    setKargoTakipNo(urun.kargoTakipNo || '');
    setModalGorunur(true);
  };

  const guncelleApi = async () => {
    if (yeniDurum === 'Kargoya Verildi' && (!kargoFirma.trim() || !kargoTakipNo.trim())) {
      Alert.alert("Uyarı", "Kargoya verildi statüsü için Firma ve Takip Numarası girmek zorunludur!");
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(`${API_CONFIG.BASE_URL}/admin/siparis-detay/${seciliUrun.detayId}/durum`, 
        { 
          yeniDurum: yeniDurum, 
          kargoFirma: yeniDurum === 'Kargoya Verildi' ? kargoFirma : null, 
          kargoTakipNo: yeniDurum === 'Kargoya Verildi' ? kargoTakipNo : null 
        }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      Alert.alert("Başarılı", "Ürün durumu başarıyla güncellendi.");
      setModalGorunur(false);
      siparisleriGetir(); 
    } catch (error: any) {
      const guncellemeHatasi = error.response?.data || error.message;
      Alert.alert("Hata", `Güncelleme başarısız: ${JSON.stringify(guncellemeHatasi)}`);
    }
  };

  const tarihFormatla = (tarihString: string) => {
    if (!tarihString) return '';
    const tarih = new Date(tarihString);
    return tarih.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getDurumStili = (durum: string) => {
    switch (durum) {
      case 'Hazırlanıyor': return { color: '#FFA500', bgColor: '#FFF3E0', icon: 'time-outline' };
      case 'Kargoya Verildi': return { color: '#1E90FF', bgColor: '#E6F2FF', icon: 'cube-outline' };
      case 'Tamamlandı':
      case 'Teslim Edildi': return { color: '#28A745', bgColor: '#E8F5E9', icon: 'checkmark-circle-outline' };
      case 'İptal':
      case 'İptal Edildi': return { color: '#EF233C', bgColor: '#FFEBEA', icon: 'close-circle-outline' };
      default: return { color: '#6C757D', bgColor: '#F8F9FA', icon: 'information-circle-outline' };
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
        (siparis.telefon && siparis.telefon.toLowerCase().includes(aramaKucukHarf));

      return durumUyar && aramaUyar;
    });
  }, [siparisler, aramaMetni, seciliDurum]);

  const durumSecenekleri = ['Tümü', 'Hazırlanıyor', 'Kargoya Verildi', 'Tamamlandı', 'İptal Edildi'];

  if (loading) return <View style={styles.merkez}><ActivityIndicator size="large" color="#007AFF" /></View>;

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
          const anaDurumStil = getDurumStili(item.durum);

          return (
            <View style={styles.siparisKapsayici}>
              <View style={styles.kart}>
                <View style={styles.kartUst}>
                  <View>
                    <Text style={styles.siparisNo}>Sipariş No: #{item.id}</Text>
                    <Text style={styles.tarih}>{tarihFormatla(item.siparisTarihi)}</Text>
                  </View>
                  <View style={[styles.durumRozeti, { backgroundColor: anaDurumStil.bgColor }]}>
                    <Text style={[styles.durumYazi, { color: anaDurumStil.color }]}>{item.durum}</Text>
                  </View>
                </View>

                {/* SİPARİŞ DURUM ÇUBUĞU ENTEGRESİ */}
                <SiparisDurumCubugu durum={item.durum} />

                <View style={styles.kullaniciBilgiKutusu}>
                  <Text style={styles.kullaniciAd}><Ionicons name="person" size={14}/> {item.kullaniciAdSoyad}</Text>
                  <Text style={styles.kullaniciDetay}><Ionicons name="call" size={14}/> {item.telefon}</Text>
                  <Text style={styles.kullaniciDetay}><Ionicons name="location" size={14}/> {item.teslimatAdresi}</Text>
                </View>

                <View style={styles.urunlerAlani}>
                  {item.urunler.map((urun: any, index: number) => {
                    const mevcutDurum = urun.durum || urun.Durum;
                    const dStil = getDurumStili(mevcutDurum);
                    
                    // 🌟 ADMİN İÇİN DE BİTİŞ KİLİDİ EKLENDİ
                    const islemBittiMi = ['Tamamlandı', 'Teslim Edildi', 'İptal', 'İptal Edildi'].includes(mevcutDurum);

                    return (
                      <View key={index} style={styles.urunSatiriKapsayici}>
                        <View style={styles.urunSatiri}>
                          <Image source={{ uri: urun.resimUrl || 'https://via.placeholder.com/150' }} style={styles.urunResim} />
                          <View style={styles.urunBilgi}>
                            <Text style={styles.urunAd} numberOfLines={2}>{urun.ad}</Text>
                            <Text style={styles.urunMagaza}>🏪 {urun.magazaAdi}</Text>
                            <Text style={styles.urunAdetFiyat}>{urun.adet} adet x {urun.birimFiyat?.toFixed(2)} TL</Text>
                            <View style={[styles.kucukDurumRozet, { backgroundColor: dStil.bgColor }]}>
                              <Ionicons name={dStil.icon as any} size={12} color={dStil.color} style={{ marginRight: 4 }} />
                              <Text style={{ fontSize: 11, fontWeight: 'bold', color: dStil.color }}>{mevcutDurum}</Text>
                            </View>
                          </View>
                        </View>
                        
                        {/* 🌟 ADMİN KİLİTLİ BUTON MANTIĞI */}
                        {!islemBittiMi ? (
                          <TouchableOpacity style={styles.guncelleButon} onPress={() => durumGuncellemeModalAc(urun)}>
                            <Ionicons name="create-outline" size={16} color="#fff" style={{marginRight: 4}}/>
                            <Text style={styles.guncelleButonYazi}>Durum Güncelle</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={[styles.guncelleButon, { backgroundColor: '#F2F2F7', elevation: 0, shadowOpacity: 0 }]}>
                            <Ionicons name="lock-closed-outline" size={16} color="#8E8E93" style={{marginRight: 4}}/>
                            <Text style={[styles.guncelleButonYazi, { color: '#8E8E93' }]}>İşlem Tamamlandı</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* FİNANS BİLGİSİ (Admin'e Özel) */}
              <View style={styles.adminPanelKutu}>
                <View style={styles.adminPanelHeader}>
                  <Ionicons name="shield-checkmark" size={16} color="#007AFF" />
                  <Text style={styles.adminPanelBaslik}>Admin Yetkileri & Finans</Text>
                </View>

                {(item.kullanilanKuponKodu || item.KullanilanKuponKodu) && (
                  <>
                    <View style={styles.finansSatir}>
                      <Text style={[styles.finansEtiket, { color: '#28A745', fontWeight: 'bold' }]}>
                        <Ionicons name="ticket" size={14} /> Kupon ({item.kullanilanKuponKodu || item.KullanilanKuponKodu}):
                      </Text>
                      <Text style={[styles.finansTutarSatici, { color: '#28A745' }]}>
                        - {(item.kuponIndirimTutari ?? item.KuponIndirimTutari ?? 0).toFixed(2)} ₺
                      </Text>
                    </View>
                    <View style={styles.finansAyrac} />
                  </>
                )}

                <View style={styles.finansSatir}>
                  <Text style={styles.finansEtiket}>Müşteri Ödediği (Net):</Text>
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

      {/* ADMİN GÜNCELLEME MODALI */}
      <Modal visible={modalGorunur} transparent animationType="slide">
        <View style={styles.modalArkaPlan}>
          <View style={styles.modalKutu}>
            <Text style={styles.modalBaslik}>Sipariş Durumu Güncelle</Text>
            <Text style={styles.modalUrunAd} numberOfLines={2}>{seciliUrun?.ad}</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 15, maxHeight: 40 }}>
              {['Hazırlanıyor', 'Kargoya Verildi', 'Tamamlandı', 'İptal Edildi'].map((d) => (
                <TouchableOpacity 
                  key={d} 
                  style={[styles.modalDurumChip, yeniDurum === d && styles.modalDurumChipAktif]}
                  onPress={() => setYeniDurum(d)}
                >
                  <Text style={[styles.modalDurumYazi, yeniDurum === d && styles.modalDurumYaziAktif]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {yeniDurum === 'Kargoya Verildi' && (
              <View style={styles.kargoKutusu}>
                <Text style={styles.kargoEtiket}>Kargo Firması:</Text>
                <TextInput 
                  style={styles.kargoInput} 
                  placeholder="Örn: Yurtiçi Kargo" 
                  value={kargoFirma} 
                  onChangeText={setKargoFirma} 
                />
                <Text style={styles.kargoEtiket}>Kargo Takip No:</Text>
                <TextInput 
                  style={styles.kargoInput} 
                  placeholder="Örn: 123456789" 
                  value={kargoTakipNo} 
                  onChangeText={setKargoTakipNo} 
                  keyboardType="numeric"
                />
              </View>
            )}

            <View style={styles.modalButonlar}>
              <TouchableOpacity style={styles.modalIptalButon} onPress={() => setModalGorunur(false)}>
                <Text style={styles.modalIptalYazi}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalKaydetButon} onPress={guncelleApi}>
                <Text style={styles.modalKaydetYazi}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  aktifFiltreChip: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  filtreChipYazi: { fontSize: 13, color: '#48484A', fontWeight: '600' },
  aktifFiltreChipYazi: { color: '#FFFFFF' },
  bosListeMetni: { textAlign: 'center', color: '#8E8E93', marginTop: 50, fontSize: 15 },
  listContainer: { padding: 20, paddingBottom: 100 },
  
  siparisKapsayici: { marginBottom: 25 },
  kart: { backgroundColor: '#fff', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2, zIndex: 2 },
  kartUst: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F2F2F7', paddingBottom: 10 },
  siparisNo: { fontWeight: 'bold', fontSize: 16 },
  tarih: { fontSize: 12, color: '#888', marginTop: 2 },
  durumRozeti: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, height: 26, justifyContent: 'center' },
  durumYazi: { fontSize: 12, fontWeight: '600' },
  kullaniciBilgiKutusu: { backgroundColor: '#F9F9F9', padding: 10, borderRadius: 8, marginBottom: 15 },
  kullaniciAd: { fontWeight: 'bold', color: '#333', marginBottom: 4 },
  kullaniciDetay: { fontSize: 12, color: '#666', marginTop: 2 },
  urunlerAlani: { marginBottom: 5 },
  urunSatiriKapsayici: { marginBottom: 15, backgroundColor: '#FAFAFA', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  urunSatiri: { flexDirection: 'row', alignItems: 'center' },
  urunResim: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#E5E5EA' },
  urunBilgi: { flex: 1, marginLeft: 12 },
  urunAd: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  urunMagaza: { fontSize: 11, color: '#888', marginTop: 2, fontStyle: 'italic' },
  urunAdetFiyat: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  kucukDurumRozet: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  
  guncelleButon: { backgroundColor: '#007AFF', flexDirection: 'row', padding: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  guncelleButonYazi: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  
  adminPanelKutu: { backgroundColor: '#E5F1FF', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, padding: 15, paddingTop: 25, marginTop: -15, marginHorizontal: 5, borderWidth: 1, borderColor: '#CCE4FF', zIndex: 1 },
  adminPanelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  adminPanelBaslik: { fontSize: 14, fontWeight: 'bold', color: '#007AFF', marginLeft: 6 },
  finansSatir: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  finansEtiket: { fontSize: 13, color: '#48484A', fontWeight: '500' },
  finansAyrac: { height: 1, backgroundColor: '#CCE4FF', marginVertical: 8 },
  finansTutarMusteri: { fontSize: 14, fontWeight: 'bold', color: '#1C1C1E' },
  finansTutarSatici: { fontSize: 14, fontWeight: 'bold', color: '#28A745' },
  finansTutarAdmin: { fontSize: 14, fontWeight: 'bold', color: '#007AFF' },
  
  modalArkaPlan: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalKutu: { backgroundColor: '#fff', width: '100%', borderRadius: 16, padding: 20 },
  modalBaslik: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, textAlign: 'center' },
  modalUrunAd: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 10 },
  modalDurumChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F2F2F7', marginRight: 10 },
  modalDurumChipAktif: { backgroundColor: '#007AFF' },
  modalDurumYazi: { color: '#666', fontWeight: '600', fontSize: 13 },
  modalDurumYaziAktif: { color: '#fff' },
  kargoKutusu: { backgroundColor: '#F9F9F9', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#EEE' },
  kargoEtiket: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 5, marginTop: 5 },
  kargoInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDD', padding: 10, borderRadius: 8, fontSize: 14 },
  modalButonlar: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalIptalButon: { flex: 1, padding: 12, backgroundColor: '#F2F2F7', borderRadius: 10, marginRight: 10, alignItems: 'center' },
  modalIptalYazi: { fontWeight: 'bold', color: '#333' },
  modalKaydetButon: { flex: 1, padding: 12, backgroundColor: '#007AFF', borderRadius: 10, alignItems: 'center' },
  modalKaydetYazi: { fontWeight: 'bold', color: '#fff' }
});