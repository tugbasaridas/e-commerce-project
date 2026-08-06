import { API_CONFIG } from '@/config/api';
import { SepetUrun } from '@/types/Sepet';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, LayoutAnimation, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Sepet() {
  const router = useRouter();
  const [sepet, setSepet] = useState<SepetUrun[]>([]);
  const [loading, setLoading] = useState(true);
  const [aramaAktif, setAramaAktif] = useState(false);
  const [aramaMetni, setAramaMetni] = useState('');

  // --- KUPON STATE'LERİ ---
  const [indirimTutari, setIndirimTutari] = useState(0);
  const [uygulananKupon, setUygulananKupon] = useState<any>(null);
  const [islemYapiliyor, setIslemYapiliyor] = useState(false);
  const [manuelKuponKodu, setManuelKuponKodu] = useState('');
  
  // Modal ve Cüzdan State'leri
  const [modalGorunur, setModalGorunur] = useState(false);
  const [cuzdanKuponlari, setCuzdanKuponlari] = useState<any[]>([]);
  const [cuzdanLoading, setCuzdanLoading] = useState(false);

  useFocusEffect(
    useCallback(() => { sepetiGetir(); }, [])
  );

  useEffect(() => {
    if (uygulananKupon) {
      kuponIptalEt();
    }
  }, [sepet]);

  const sepetiGetir = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) { setLoading(false); return; }
      const response = await axios.get(`${API_CONFIG.BASE_URL}/sepet`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSepet(response.data);
    } catch (error) {
      console.error("Sepet yükleme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const sepettenSil = async (id: number) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.delete(`${API_CONFIG.BASE_URL}/sepet/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSepet(prev => prev.filter(item => item.id !== id));
    } catch (error) { Alert.alert("Hata", "Silme işlemi başarısız."); }
  };

  const miktarGuncelle = async (item: SepetUrun, islem: 'artir' | 'azalt') => {
    const yeniMiktar = islem === 'artir' ? item.miktar + 1 : item.miktar - 1;
    if (yeniMiktar < 1) {
      Alert.alert("Ürünü Sil", "Bu ürünü sepetten çıkarmak istiyor musunuz?", [
        { text: "İptal", style: "cancel" },
        { text: "Sil", onPress: () => sepettenSil(item.id), style: "destructive" }
      ]);
      return;
    }
    setSepet(prev => prev.map(s => s.id === item.id ? { ...s, miktar: yeniMiktar } : s));
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(`${API_CONFIG.BASE_URL}/sepet/${item.id}`, { miktar: yeniMiktar }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) { sepetiGetir(); }
  };

  const cuzdanimiGetir = async () => {
    setCuzdanLoading(true);
    setModalGorunur(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/kupon/cuzdanim`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const gecerliKuponlar = response.data.filter((k: any) => !k.kullanildiMi && !k.suresiDolduMu);
      setCuzdanKuponlari(gecerliKuponlar);
    } catch (error) {
      Alert.alert("Hata", "Kuponlarınız yüklenemedi.");
      setModalGorunur(false);
    } finally {
      setCuzdanLoading(false);
    }
  };

  const kuponUygula = async (kuponKodu: string) => {
    setIslemYapiliyor(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const gonderilecekUrunler = sepet.map(item => {
        const urunHamData = item.urunler as any; 
        console.log("SEPET ÜRÜN HAM DATA:", urunHamData); // KONSOLDAN KONTROL ET
        return {
          urunId: urunHamData?.id || 0,
          magazaId: urunHamData?.magaza?.id || urunHamData?.magazaId || 0, 
          fiyat: urunHamData?.indirimliFiyat && urunHamData.indirimliFiyat > 0 ? urunHamData.indirimliFiyat : (urunHamData?.fiyat || 0),
          adet: item.miktar || 1
        };
      });

      console.log("BACKEND'E GİDEN ÜRÜNLER:", gonderilecekUrunler);

      const response = await axios.post(`${API_CONFIG.BASE_URL}/kupon/uygula`, {
        kuponKodu: kuponKodu,
        sepetToplami: toplamTutar,
        sepetUrunleri: gonderilecekUrunler 
      }, { headers: { Authorization: `Bearer ${token}` } });

      setIndirimTutari(response.data.indirimTutari);
      setUygulananKupon({ kod: kuponKodu, id: response.data.kuponId });
      setModalGorunur(false);
      setManuelKuponKodu('');
      
      Alert.alert("Başarılı", "Kupon sepete uygulandı! 🎉");
    } catch (error: any) {
      Alert.alert("Hata", error.response?.data?.mesaj || "Kupon uygulanamadı.");
    } finally {
      setIslemYapiliyor(false);
    }
  };

  const kuponIptalEt = () => {
    setUygulananKupon(null);
    setIndirimTutari(0);
  };

  const filtrelenmisSepet = sepet.filter(item => item.urunler?.ad?.toLowerCase().includes(aramaMetni.toLowerCase()));

  const toplamTutar = sepet.reduce((total, item) => {
    const fiyat = item.urunler?.indirimliFiyat ?? item.urunler?.fiyat ?? 0;
    return total + (fiyat * item.miktar);
  }, 0);

  const genelToplam = toplamTutar - indirimTutari > 0 ? toplamTutar - indirimTutari : 0;

  const handleSatinAl = async () => {
    if (sepet.length === 0) { Alert.alert('Hata', 'Sepetiniz boş!'); return; }
    const token = await AsyncStorage.getItem('userToken');
    if (!token) { router.push('/(auth)/giris' as any); return; }
    
    router.push({ 
      pathname: '/odeme', 
      params: { 
        tutar: genelToplam.toFixed(2),
        kuponId: uygulananKupon ? uygulananKupon.id : null 
      } 
    });
  };

  if (loading) return <View style={styles.merkez}><ActivityIndicator size="large" color="#FFB800" /></View>;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.headerSatiri}>
        <Text style={styles.sayfaBaslik}>Sepetim</Text>
        {sepet.length > 0 && (
          <TouchableOpacity onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setAramaAktif(!aramaAktif); }} style={styles.aramaIkonButon}>
            <Ionicons name={aramaAktif ? "close" : "search"} size={26} color="#333" />
          </TouchableOpacity>
        )}
      </View>

      {aramaAktif && (
        <View style={styles.aramaKutusu}>
          <Ionicons name="search" size={20} color="#888" style={{ marginRight: 10 }} />
          <TextInput style={styles.aramaInput} placeholder="Sepette ürün ara..." value={aramaMetni} onChangeText={setAramaMetni} autoFocus={true} />
        </View>
      )}

      {sepet.length === 0 ? (
        <View style={styles.merkez}>
          <Ionicons name="cart-outline" size={80} color="#ccc" />
          <Text style={styles.altMetin}>Sepetiniz şu anda boş.</Text>
          <TouchableOpacity style={styles.alisveriseBaslaButon} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.alisveriseBaslaYazi}>Alışverişe Başla</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            style={{ flex: 1 }}
            data={filtrelenmisSepet}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 15 }}
            renderItem={({ item }) => {
              const indirimVarmi = item.urunler?.indirimliFiyat && item.urunler.indirimliFiyat < item.urunler.fiyat;
              const guncelFiyat = (indirimVarmi ? item.urunler.indirimliFiyat : item.urunler?.fiyat) ?? 0;

              return (
                <View style={styles.kart}>
                  <Image source={{ uri: item.urunler?.resimUrl || 'https://via.placeholder.com/150' }} style={styles.resim} />
                  <View style={styles.bilgiAlani}>
                    <Text style={styles.urunAd} numberOfLines={2}>{item.urunler?.ad}</Text>
                    <View style={styles.fiyatSatiri}>
                      {indirimVarmi ? (
                        <>
                          <Text style={styles.eskiFiyat}>{item.urunler.fiyat.toFixed(2)} TL</Text>
                          <Text style={styles.guncelFiyat}>{guncelFiyat.toFixed(2)} TL</Text>
                        </>
                      ) : (
                        <Text style={styles.fiyat}>{guncelFiyat.toFixed(2)} TL</Text>
                      )}
                    </View>
                    <View style={styles.aksiyonSatiri}>
                      <View style={styles.miktarAyarlayici}>
                        <TouchableOpacity onPress={() => miktarGuncelle(item, 'azalt')} style={styles.miktarButon}><Ionicons name="remove" size={20} color="#333" /></TouchableOpacity>
                        <Text style={styles.miktarYazi}>{item.miktar}</Text>
                        <TouchableOpacity onPress={() => miktarGuncelle(item, 'artir')} style={styles.miktarButon}><Ionicons name="add" size={20} color="#333" /></TouchableOpacity>
                      </View>
                      <TouchableOpacity onPress={() => sepettenSil(item.id)} style={styles.silButon}><Ionicons name="trash" size={22} color="#ccc" /></TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }}
          />
          
          <View style={styles.altSabitAlan}>
            {uygulananKupon ? (
              <View style={styles.kuponUygulandiKutu}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.uygulananKuponKodu}>{uygulananKupon.kod} uygulandı</Text>
                </View>
                <TouchableOpacity onPress={kuponIptalEt}>
                  <Ionicons name="close-circle" size={22} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.kuponSecKutu} onPress={cuzdanimiGetir}>
                <Ionicons name="ticket-outline" size={20} color="#FFB800" />
                <Text style={styles.kuponSecYazi}>Kupon Seç veya İndirim Kodu Gir</Text>
                <Ionicons name="chevron-forward" size={18} color="#FFB800" />
              </TouchableOpacity>
            )}

            <View style={styles.hesapSatiri}>
              <Text style={styles.hesapBaslik}>Ara Toplam</Text>
              <Text style={styles.hesapDeger}>{toplamTutar.toFixed(2)} TL</Text>
            </View>

            {indirimTutari > 0 && (
              <View style={styles.hesapSatiri}>
                <Text style={[styles.hesapBaslik, { color: '#4CAF50' }]}>Kupon İndirimi</Text>
                <Text style={[styles.hesapDeger, { color: '#4CAF50' }]}>- {indirimTutari.toFixed(2)} TL</Text>
              </View>
            )}

            <View style={[styles.toplamSatiri, { marginTop: 5, paddingTop: 10, borderTopWidth: 1, borderColor: '#eee' }]}>
              <Text style={styles.toplamEtiket}>Ödenecek Tutar</Text>
              <Text style={styles.toplamFiyat}>{genelToplam.toFixed(2)} TL</Text>
            </View>

            <TouchableOpacity style={styles.odemeButon} onPress={handleSatinAl}>
              <Text style={styles.odemeButonYazi}>Satın Al</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* KUPON SEÇİM MODALI */}
      <Modal visible={modalGorunur} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalKutu}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalBaslik}>Kuponlar & Fırsatlar</Text>
              <TouchableOpacity onPress={() => setModalGorunur(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* MANUEL KUPON KODU GİRİŞ ALANI */}
            <View style={styles.manuelKuponAlani}>
              <TextInput
                style={styles.manuelKuponInput}
                placeholder="Kupon Kodu (Örn: YAZ20)"
                value={manuelKuponKodu}
                onChangeText={setManuelKuponKodu}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.manuelKuponButon}
                onPress={() => {
                  if (manuelKuponKodu.trim() === '') {
                    Alert.alert("Uyarı", "Lütfen bir kupon kodu girin.");
                    return;
                  }
                  kuponUygula(manuelKuponKodu.trim());
                }}
                disabled={islemYapiliyor}
              >
                {islemYapiliyor ? <ActivityIndicator color="#fff" /> : <Text style={styles.manuelKuponButonYazi}>Uygula</Text>}
              </TouchableOpacity>
            </View>
            
            <Text style={styles.cuzdanBaslik}>Cüzdanımdaki Kuponlar</Text>

            {cuzdanLoading ? (
              <ActivityIndicator size="large" color="#FFB800" style={{ margin: 30 }} />
            ) : cuzdanKuponlari.length === 0 ? (
              <Text style={styles.bosCuzdanYazi}>Kullanılabilir kuponunuz bulunmuyor.</Text>
            ) : (
              <FlatList
                data={cuzdanKuponlari}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => {
                  const uygunMu = toplamTutar >= item.altLimit;
                  
                  return (
                    <TouchableOpacity 
                      style={[styles.cuzdanKuponKart, !uygunMu && styles.cuzdanKuponPasif]}
                      disabled={!uygunMu || islemYapiliyor}
                      onPress={() => kuponUygula(item.kuponKodu)}
                    >
                      <View style={styles.cuzdanSol}>
                        <Text style={styles.indirimYazi}>
                          {item.indirimTipi === 'Yuzde' ? `%${item.indirimDegeri}` : `${item.indirimDegeri} TL`}
                        </Text>
                      </View>
                      <View style={styles.cuzdanSag}>
                        <Text style={styles.cuzdanMagazaAd}>
                          {item.gecerliMagaza}
                          {item.urunKuponuMu && <Text style={{fontSize: 12, color: '#007AFF'}}> (Ürüne Özel)</Text>}
                        </Text>
                        
                        {item.urunKuponuMu && item.urunAdlari && item.urunAdlari.length > 0 && (
                          <Text style={{fontSize: 11, color: '#007AFF', marginTop: 2, fontStyle: 'italic'}} numberOfLines={2}>
                            Geçerli: {item.urunAdlari.join(', ')}
                          </Text>
                        )}
                        
                        {item.altLimit > 0 && (
                           <Text style={styles.cuzdanAltLimit}>Minimum {item.altLimit} TL alışverişte</Text>
                        )}
                        
                        {!uygunMu && item.altLimit > 0 && (
                          <Text style={styles.uyariYazi}>Sepete {item.altLimit - toplamTutar} TL'lik daha ürün eklemelisiniz.</Text>
                        )}
                      </View>
                      {uygunMu && <Ionicons name="chevron-forward" size={20} color="#FFB800" />}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  headerSatiri: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  sayfaBaslik: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  aramaIkonButon: { padding: 8, backgroundColor: '#eee', borderRadius: 20 },
  aramaKutusu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F5', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 10, marginHorizontal: 20, marginBottom: 10 },
  aramaInput: { flex: 1, fontSize: 16, color: '#333' },
  kart: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, marginBottom: 15, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  resim: { width: 80, height: 100, borderRadius: 8, resizeMode: 'cover' },
  bilgiAlani: { flex: 1, marginLeft: 15, justifyContent: 'space-between' },
  urunAd: { fontSize: 15, fontWeight: '600', color: '#333' },
  fiyatSatiri: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  fiyat: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  guncelFiyat: { fontSize: 16, fontWeight: 'bold', color: '#ff4757' },
  eskiFiyat: { fontSize: 13, color: '#999', textDecorationLine: 'line-through' },
  aksiyonSatiri: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  miktarAyarlayici: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 20 },
  miktarButon: { paddingHorizontal: 12, paddingVertical: 6 },
  miktarYazi: { fontSize: 16, fontWeight: '600', paddingHorizontal: 8 },
  silButon: { padding: 5 },
  
  altSabitAlan: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderColor: '#eee', paddingBottom: 15 },
  
  kuponSecKutu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9E6', padding: 12, borderRadius: 10, marginBottom: 15, justifyContent: 'space-between', borderWidth: 1, borderColor: '#FFE8B3' },
  kuponSecYazi: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600', color: '#FFB800' },
  kuponUygulandiKutu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 12, borderRadius: 10, marginBottom: 15, justifyContent: 'space-between', borderWidth: 1, borderColor: '#C8E6C9' },
  uygulananKuponKodu: { fontSize: 14, fontWeight: 'bold', color: '#2E7D32' },
  
  hesapSatiri: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  hesapBaslik: { fontSize: 14, color: '#666' },
  hesapDeger: { fontSize: 14, fontWeight: '600', color: '#333' },
  
  toplamSatiri: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  toplamEtiket: { fontSize: 16, color: '#666', fontWeight: '500' },
  toplamFiyat: { fontSize: 22, fontWeight: 'bold', color: '#111' },
  odemeButon: { backgroundColor: '#FFB800', paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  odemeButonYazi: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  altMetin: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 15, marginBottom: 25 },
  alisveriseBaslaButon: { backgroundColor: '#FFB800', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10 },
  alisveriseBaslaYazi: { fontWeight: 'bold', fontSize: 16, color: '#fff' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalKutu: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalBaslik: { fontSize: 18, fontWeight: 'bold' },
  
  manuelKuponAlani: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  manuelKuponInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, backgroundColor: '#FAFAFA', fontSize: 15 },
  manuelKuponButon: { backgroundColor: '#333', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 8 },
  manuelKuponButonYazi: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  cuzdanBaslik: { fontSize: 15, fontWeight: 'bold', color: '#666', marginBottom: 10 },

  bosCuzdanYazi: { textAlign: 'center', color: '#888', marginTop: 20, marginBottom: 40 },
  cuzdanKuponKart: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: '#EEE', padding: 15, marginBottom: 12, alignItems: 'center' },
  cuzdanKuponPasif: { opacity: 0.5, backgroundColor: '#F9F9F9' },
  cuzdanSol: { marginRight: 15, justifyContent: 'center', alignItems: 'center' },
  indirimYazi: { fontSize: 20, fontWeight: '900', color: '#FFB800' },
  cuzdanSag: { flex: 1 },
  cuzdanMagazaAd: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  cuzdanAltLimit: { fontSize: 12, color: '#666', marginTop: 2 },
  uyariYazi: { fontSize: 11, color: '#FF3B30', marginTop: 4, fontWeight: '500' }
});