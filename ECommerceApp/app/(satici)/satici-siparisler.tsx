import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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

type SiparisKategori = 'Tümü' | 'Hazırlanıyor' | 'Kargoya Verildi' | 'Tamamlandı' | 'İptal Edildi';

export default function SaticiSiparisler() {
  const router = useRouter();
  const [tumSiparisler, setTumSiparisler] = useState<any[]>([]);
  const [filtrelenmisSiparisler, setFiltrelenmisSiparisler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [aramaMetni, setAramaMetni] = useState('');
  const [aktifKategori, setAktifKategori] = useState<SiparisKategori>('Tümü');

  // MODAL STATE'LERİ (Satıcıya Özel Kargo Girişli)
  const [modalGorunur, setModalGorunur] = useState(false);
  const [seciliUrun, setSeciliUrun] = useState<any | null>(null);
  const [yeniDurum, setYeniDurum] = useState('Hazırlanıyor');
  const [kargoFirma, setKargoFirma] = useState('');
  const [kargoTakipNo, setKargoTakipNo] = useState('');

  useFocusEffect(
    useCallback(() => {
      siparisleriGetir();
    }, [])
  );

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
    } catch (error: any) {
      const gercekHata = error.response?.data?.message || error.response?.data || error.message || "Bilinmeyen Hata";
      const statusCode = error.response?.status || "Ağ Hatası";
      console.log("🚨 SATICI API ÇÖKME DETAYI:", error);
      Alert.alert(`Hata Kodu: ${statusCode}`, `Siparişler yüklenemedi: ${JSON.stringify(gercekHata)}`);
    } finally {
      setLoading(false);
    }
  };

  const filtrele = (liste: any[], aranan: string, kategori: SiparisKategori) => {
    let sonuc = [...liste];
    if (kategori !== 'Tümü') {
      sonuc = sonuc.filter(s => s.durum?.toLowerCase() === kategori.toLowerCase());
    }
    if (aranan.trim() !== '') {
      const arananKucuk = aranan.toLowerCase();
      sonuc = sonuc.filter(s => 
        s.siparisId?.toString().includes(arananKucuk) || 
        (s.musteriAd && s.musteriAd.toLowerCase().includes(arananKucuk))
      );
    }
    setFiltrelenmisSiparisler(sonuc);
  };

  const durumGuncellemeModalAc = (urun: any) => {
    setSeciliUrun(urun);
    setYeniDurum(urun.durum || urun.Durum || 'Hazırlanıyor');
    setKargoFirma(urun.kargoFirma || urun.KargoFirma || '');
    setKargoTakipNo(urun.kargoTakipNo || urun.KargoTakipNo || '');
    setModalGorunur(true);
  };

  const guncelleApi = async () => {
    if (yeniDurum === 'Kargoya Verildi' && (!kargoFirma.trim() || !kargoTakipNo.trim())) {
      Alert.alert("Uyarı", "Kargoya verildi statüsü için Kargo Firması ve Takip Numarası girmek zorunludur!");
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(`${API_CONFIG.BASE_URL}/satici/siparis-detay/${seciliUrun.detayId || seciliUrun.DetayId}/durum`, 
        { 
          yeniDurum: yeniDurum,
          kargoFirma: yeniDurum === 'Kargoya Verildi' ? kargoFirma : null,
          kargoTakipNo: yeniDurum === 'Kargoya Verildi' ? kargoTakipNo : null
        }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      Alert.alert("Başarılı", "Ürün durumu ve kargo bilgileri başarıyla güncellendi.");
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

      {/* Yatay Kategori Sekmeleri */}
      <View style={styles.kategoriAlani}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {kategoriler.map((kat) => (
            <TouchableOpacity
              key={kat}
              style={[styles.kategoriHap, aktifKategori === kat && styles.kategoriHapAktif]}
              onPress={() => setAktifKategori(kat)}
            >
              <Text style={[styles.kategoriYazi, aktifKategori === kat && styles.kategoriYaziAktif]}>{kat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.merkez}><ActivityIndicator size="large" color="#FF9F00" /></View>
      ) : (
        <FlatList
          data={filtrelenmisSiparisler}
          keyExtractor={(item) => (item.siparisId || item.SiparisId).toString()}
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
          renderItem={({ item }) => {
            const urunler = item.satilanUrunler || item.SatilanUrunler || [];
            const siparisId = item.siparisId || item.SiparisId;
            const siparisTarihi = item.siparisTarihi || item.SiparisTarihi;
            const musteriAd = item.musteriAd || item.MusteriAd;
            const teslimatAdresi = item.teslimatAdresi || item.TeslimatAdresi;
            const telefon = item.iletisimTelfonu || item.IletisimTelfonu;
            const saticiKazanci = item.saticiKazanci ?? item.SaticiKazanci ?? 0;
            const kuponKodu = item.kullanilanKuponKodu || item.KullanilanKuponKodu;
            const kuponIndirim = item.kuponIndirimTutari ?? item.KuponIndirimTutari ?? 0;
            const anaDurumStil = getDurumStili(item.durum);

            return (
              <View style={styles.siparisKapsayici}>
                <View style={styles.kart}>
                  {/* Kart Üst */}
                  <View style={styles.kartUst}>
                    <View>
                      <Text style={styles.siparisNo}>Sipariş No: #{siparisId}</Text>
                      <Text style={styles.tarih}>{tarihFormatla(siparisTarihi)}</Text>
                    </View>
                    <View style={[styles.durumRozeti, { backgroundColor: anaDurumStil.bgColor }]}>
                      <Text style={[styles.durumYazi, { color: anaDurumStil.color }]}>{item.durum}</Text>
                    </View>
                  </View>

                  {/* SİPARİŞ DURUM ÇUBUĞU ENTEGRESİ */}
                  <SiparisDurumCubugu durum={item.durum} />

                  {/* Müşteri Bilgileri */}
                  <View style={styles.kullaniciBilgiKutusu}>
                    <Text style={styles.kullaniciAd}><Ionicons name="person" size={14}/> {musteriAd}</Text>
                    <Text style={styles.kullaniciDetay}><Ionicons name="call" size={14}/> {telefon}</Text>
                    <Text style={styles.kullaniciDetay}><Ionicons name="location" size={14}/> {teslimatAdresi}</Text>
                  </View>

                  {/* Ürünler Listesi */}
                  <View style={styles.urunlerAlani}>
                    {urunler.map((urun: any, index: number) => {
                      const mevcutDurum = urun.durum || urun.Durum;
                      const urunDurumStil = getDurumStili(mevcutDurum);
                      
                      // 🌟 Bitiş statülerinden biriyse buton kilitlenecek
                      const islemBittiMi = ['Tamamlandı', 'Teslim Edildi', 'İptal', 'İptal Edildi'].includes(mevcutDurum);

                      return (
                        <View key={index} style={styles.urunSatiriKapsayici}>
                          <View style={styles.urunSatiri}>
                            <Image source={{ uri: urun.resimUrl || urun.ResimUrl || 'https://via.placeholder.com/150' }} style={styles.urunResim} />
                            <View style={styles.urunBilgi}>
                              <Text style={styles.urunAd} numberOfLines={2}>{urun.ad || urun.Ad}</Text>
                              <Text style={styles.urunAdetFiyat}>
                                {urun.adet || urun.Adet} adet x {(urun.birimFiyat || urun.BirimFiyat || 0).toFixed(2)} TL
                              </Text>
                              <View style={[styles.kucukDurumRozet, { backgroundColor: urunDurumStil.bgColor }]}>
                                <Ionicons name={urunDurumStil.icon as any} size={12} color={urunDurumStil.color} style={{ marginRight: 4 }} />
                                <Text style={{ fontSize: 11, fontWeight: 'bold', color: urunDurumStil.color }}>{mevcutDurum}</Text>
                              </View>
                            </View>
                          </View>
                          
                          {/* 🌟 Kilitli Buton Mantığı */}
                          {!islemBittiMi ? (
                            <TouchableOpacity style={styles.guncelleButon} onPress={() => durumGuncellemeModalAc(urun)}>
                              <Ionicons name="cube-outline" size={16} color="#fff" style={{marginRight: 4}}/>
                              <Text style={styles.guncelleButonYazi}>Kargo & Durum Güncelle</Text>
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

                {/* SATICI FİNANS BİLGİSİ (Yeşil Kutu) */}
                <View style={styles.finansPanelKutu}>
                  <View style={styles.finansPanelHeader}>
                    <Ionicons name="wallet-outline" size={16} color="#28A745" />
                    <Text style={styles.finansPanelBaslik}>Satış & Kazanç Özeti</Text>
                  </View>

                  {kuponKodu && (
                    <>
                      <View style={styles.finansSatir}>
                        <Text style={styles.finansEtiket}><Ionicons name="ticket" size={14} color="#FF9F00"/> Kupon ({kuponKodu}):</Text>
                        <Text style={styles.finansTutarEksi}>- {kuponIndirim.toFixed(2)} ₺</Text>
                      </View>
                      <View style={styles.finansAyrac} />
                    </>
                  )}

                  <View style={styles.finansSatir}>
                    <Text style={[styles.finansEtiket, { fontWeight: 'bold' }]}>Net Kazancım:</Text>
                    <Text style={styles.finansTutarSatici}>{saticiKazanci.toFixed(2)} ₺</Text>
                  </View>
                  <Text style={styles.finansNot}>* Komisyon ve iptaller düşülmüş, hesabınıza yatacak net tutardır.</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* SATICI GÜNCELLEME MODALI */}
      <Modal visible={modalGorunur} transparent animationType="slide">
        <View style={styles.modalArkaPlan}>
          <View style={styles.modalKutu}>
            <Text style={styles.modalBaslik}>Sipariş Durumu Güncelle</Text>
            <Text style={styles.modalUrunAd} numberOfLines={2}>{seciliUrun?.ad || seciliUrun?.Ad}</Text>
            
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
                  placeholder="Örn: Aras Kargo" 
                  value={kargoFirma} 
                  onChangeText={setKargoFirma} 
                />
                <Text style={styles.kargoEtiket}>Kargo Takip No:</Text>
                <TextInput 
                  style={styles.kargoInput} 
                  placeholder="Örn: 987654321" 
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
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  geriBtn: { padding: 4 },
  baslik: { fontSize: 17, fontWeight: 'bold', color: '#1C1C1E' },
  aramaKutusu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 12, paddingHorizontal: 12, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA' },
  aramaInput: { flex: 1, fontSize: 15, color: '#1C1C1E' },
  kategoriAlani: { marginTop: 10, marginBottom: 4 },
  kategoriHap: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FFFFFF', borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#E5E5EA', height: 36, justifyContent: 'center', alignItems: 'center' },
  kategoriHapAktif: { backgroundColor: '#FF9F00', borderColor: '#FF9F00' },
  kategoriYazi: { fontSize: 13, fontWeight: '600', color: '#3A3A3C' },
  kategoriYaziAktif: { color: '#FFFFFF' },
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listeIcerik: { padding: 16, paddingBottom: 100 },
  bosKutu: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 30 },
  bosBaslik: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E', marginTop: 16, marginBottom: 8 },
  bosIcerik: { fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 20 },
  
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
  urunAdetFiyat: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  kucukDurumRozet: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  
  guncelleButon: { backgroundColor: '#FF9F00', flexDirection: 'row', padding: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  guncelleButonYazi: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  
  finansPanelKutu: { backgroundColor: '#E8F5E9', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, padding: 15, paddingTop: 25, marginTop: -15, marginHorizontal: 5, borderWidth: 1, borderColor: '#C8E6C9', zIndex: 1 },
  finansPanelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  finansPanelBaslik: { fontSize: 14, fontWeight: 'bold', color: '#28A745', marginLeft: 6 },
  finansSatir: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  finansEtiket: { fontSize: 13, color: '#48484A', fontWeight: '500' },
  finansAyrac: { height: 1, backgroundColor: '#C8E6C9', marginVertical: 8 },
  finansTutarEksi: { fontSize: 13, fontWeight: 'bold', color: '#EF233C' },
  finansTutarSatici: { fontSize: 16, fontWeight: 'bold', color: '#28A745' },
  finansNot: { fontSize: 11, color: '#6C757D', fontStyle: 'italic', marginTop: 8 },

  modalArkaPlan: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalKutu: { backgroundColor: '#fff', width: '100%', borderRadius: 16, padding: 20 },
  modalBaslik: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10, textAlign: 'center' },
  modalUrunAd: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 10 },
  modalDurumChip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F2F2F7', marginRight: 10 },
  modalDurumChipAktif: { backgroundColor: '#FF9F00' },
  modalDurumYazi: { color: '#666', fontWeight: '600', fontSize: 13 },
  modalDurumYaziAktif: { color: '#fff' },
  kargoKutusu: { backgroundColor: '#F9F9F9', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#EEE' },
  kargoEtiket: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 5, marginTop: 5 },
  kargoInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#DDD', padding: 10, borderRadius: 8, fontSize: 14 },
  modalButonlar: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalIptalButon: { flex: 1, padding: 12, backgroundColor: '#F2F2F7', borderRadius: 10, marginRight: 10, alignItems: 'center' },
  modalIptalYazi: { fontWeight: 'bold', color: '#333' },
  modalKaydetButon: { flex: 1, padding: 12, backgroundColor: '#FF9F00', borderRadius: 10, alignItems: 'center' },
  modalKaydetYazi: { fontWeight: 'bold', color: '#fff' }
});