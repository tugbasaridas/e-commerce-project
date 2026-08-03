import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SaticiKupon() {
  const router = useRouter();
  const [kuponlar, setKuponlar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Kupon Oluşturma State'leri
  const [modalGorunur, setModalGorunur] = useState(false);
  const [islemYapiliyor, setIslemYapiliyor] = useState(false);
  const [kodu, setKodu] = useState('');
  const [indirimTipi, setIndirimTipi] = useState<'Tutar' | 'Yuzde'>('Tutar');
  const [indirimDegeri, setIndirimDegeri] = useState('');
  const [altLimit, setAltLimit] = useState('');
  const [gecerlilikGunu, setGecerlilikGunu] = useState('30');
  const [herkeseAcikMi, setHerkeseAcikMi] = useState(true);

  // Ürüne Özel Kupon State'leri
  const [kapsam, setKapsam] = useState<'TumMagaza' | 'SeciliUrunler'>('TumMagaza');
  const [magazaUrunleri, setMagazaUrunleri] = useState<any[]>([]);
  const [secilenUrunIds, setSecilenUrunIds] = useState<number[]>([]);
  const [urunlerYukleniyor, setUrunlerYukleniyor] = useState(false);

  // YENİ: Takipçiler State'leri
  const [takipcilerModalGorunur, setTakipcilerModalGorunur] = useState(false);
  const [takipciler, setTakipciler] = useState<any[]>([]);
  const [takipcilerYukleniyor, setTakipcilerYukleniyor] = useState(false);

  useEffect(() => { 
    kuponlariGetir(); 
  }, []);

  useEffect(() => {
    if (modalGorunur && magazaUrunleri.length === 0) {
      saticiUrunleriniGetir();
    }
  }, [modalGorunur]);

  const saticiUrunleriniGetir = async () => {
    setUrunlerYukleniyor(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/satici/urunlerim`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setMagazaUrunleri(response.data);
    } catch (error) {
      console.log("Ürünler getirilemedi", error);
    } finally {
      setUrunlerYukleniyor(false);
    }
  };

  const kuponlariGetir = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/kupon/yonetim/listele`, { headers: { Authorization: `Bearer ${token}` } });
      setKuponlar(response.data);
    } catch (error) {
      Alert.alert("Hata", "Kuponlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  // YENİ: Takipçileri Getiren Fonksiyon
  const takipcileriGetir = async () => {
    setTakipcilerYukleniyor(true);
    setTakipcilerModalGorunur(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/satici/yonetim/takipcilerim`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setTakipciler(response.data);
    } catch (error) {
      Alert.alert("Hata", "Takipçiler yüklenemedi.");
      setTakipcilerModalGorunur(false);
    } finally {
      setTakipcilerYukleniyor(false);
    }
  };

  const kuponSil = async (id: number, kod: string) => {
    Alert.alert("Emin misiniz?", `'${kod}' kodlu mağaza kuponu silinecek.`, [
      { text: "İptal", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.delete(`${API_CONFIG.BASE_URL}/kupon/yonetim/sil/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            setKuponlar(prev => prev.filter(k => k.id !== id));
          } catch (error: any) { Alert.alert("Hata", "Silme başarısız."); }
        }
      }
    ]);
  };

  const urunSeciminiDegistir = (urunId: number) => {
    if (secilenUrunIds.includes(urunId)) {
      setSecilenUrunIds(secilenUrunIds.filter(id => id !== urunId));
    } else {
      setSecilenUrunIds([...secilenUrunIds, urunId]); 
    }
  };

  const kuponOlustur = async () => {
    if (!kodu || !indirimDegeri || !gecerlilikGunu) return Alert.alert("Uyarı", "Lütfen gerekli alanları doldurun.");
    if (kapsam === 'TumMagaza' && !altLimit) return Alert.alert("Uyarı", "Tüm mağaza kuponları için alt limit belirlemelisiniz.");
    if (kapsam === 'SeciliUrunler' && secilenUrunIds.length === 0) return Alert.alert("Uyarı", "Lütfen en az bir ürün seçin.");

    setIslemYapiliyor(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(`${API_CONFIG.BASE_URL}/kupon/yonetim/olustur`, {
        kodu, 
        indirimTipi, 
        indirimDegeri: parseFloat(indirimDegeri), 
        altLimit: kapsam === 'SeciliUrunler' ? 0 : parseFloat(altLimit), 
        gecerlilikGunu: parseInt(gecerlilikGunu),
        secilenUrunIds: kapsam === 'SeciliUrunler' ? secilenUrunIds : [],
        herkeseAcikMi 
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setModalGorunur(false);
      
      setKodu(''); setIndirimDegeri(''); setAltLimit(''); setGecerlilikGunu('30'); setIndirimTipi('Tutar'); 
      setKapsam('TumMagaza'); setSecilenUrunIds([]); setHerkeseAcikMi(true);
      
      kuponlariGetir();
    } catch (error: any) {
      Alert.alert("Hata", error.response?.data?.mesaj || "Kupon oluşturulamadı.");
    } finally { setIslemYapiliyor(false); }
  };

  const takipcilereGonder = (id: number, kod: string) => {
    Alert.alert(
      "Takipçilere Hediye Et",
      `'${kod}' kodlu bu VIP kupon mağazanızı takip eden tüm müşterilerin hesaplarına özel olarak eklenecektir. Onaylıyor musunuz?`,
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Evet, Dağıt", 
          style: "default", 
          onPress: async () => {
            setIslemYapiliyor(true);
            try {
              const token = await AsyncStorage.getItem('userToken');
              const response = await axios.post(`${API_CONFIG.BASE_URL}/kupon/yonetim/takipcilere-gonder/${id}`, {}, { 
                headers: { Authorization: `Bearer ${token}` } 
              });
              Alert.alert("Başarılı! 🎉", response.data.mesaj);
            } catch (error: any) {
              Alert.alert("Hata", error.response?.data?.mesaj || "Kupon dağıtılırken bir hata oluştu.");
            } finally {
              setIslemYapiliyor(false);
            }
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} /></TouchableOpacity>
        <Text style={styles.headerBaslik}>Mağaza Kuponlarım</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? <ActivityIndicator style={{marginTop: 50}} size="large" color="#FF9F00" /> : (
        <FlatList
          data={kuponlar}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 15 }}
          renderItem={({ item }) => (
            <View style={styles.kart}>
              <View style={{flex: 1}}>
                
                <Text style={{fontSize: 11, color: item.herkeseAcikMi ? '#4CAF50' : '#8E44AD', fontWeight: 'bold', marginBottom: 6}}>
                   {item.herkeseAcikMi ? "🌍 Herkese Açık Kod" : "👑 Sadece Takipçilere Özel (VIP)"}
                </Text>

                <Text style={styles.kod}>
                  {item.kodu}
                  {item.urunKuponuMu && <Text style={{fontSize: 12, color: '#007AFF', fontWeight: 'normal'}}> (Ürüne Özel)</Text>}
                </Text>
                
                {item.urunKuponuMu && item.urunAdlari && item.urunAdlari.length > 0 && (
                  <Text style={{fontSize: 12, color: '#007AFF', marginBottom: 4, fontStyle: 'italic'}} numberOfLines={2}>
                    Geçerli: {item.urunAdlari.join(', ')}
                  </Text>
                )}
                
                <Text style={styles.detay}>İndirim: {item.indirimTipi === 'Yuzde' ? `%${item.indirimDegeri}` : `${item.indirimDegeri} TL`} {item.altLimit > 0 ? `| Alt Limit: ${item.altLimit} TL` : ''}</Text>
                <Text style={[styles.detay, { marginTop: 4, color: item.bitisTarihi ? '#FF9F00' : '#28A745', fontWeight: '600' }]}>
                  Son Kullanma: {item.bitisTarihi ? new Date(item.bitisTarihi).toLocaleDateString('tr-TR') : 'Süresiz / Limitsiz'}
                </Text>
              </View>

              {(!item.herkeseAcikMi && !item.urunKuponuMu) && (
                <TouchableOpacity 
                  style={{ marginRight: 15 }} 
                  onPress={() => takipcilereGonder(item.id, item.kodu)}
                  disabled={islemYapiliyor}
                >
                  <Ionicons name="people" size={26} color="#8E44AD" />
                  <Text style={{fontSize: 9, color: '#8E44AD', fontWeight: 'bold', textAlign: 'center'}}>Dağıt</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={{justifyContent: 'center'}} onPress={() => kuponSil(item.id, item.kodu)} disabled={islemYapiliyor}>
                <Ionicons name="trash" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* YENİ: Takipçiler Butonu (İkincil küçük FAB) */}
      <TouchableOpacity style={styles.fabSecondary} onPress={takipcileriGetir}>
        <Ionicons name="people" size={22} color="#FFF" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.fab} onPress={() => setModalGorunur(true)}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      {/* --- KUPON OLUŞTURMA MODALI --- */}
      <Modal visible={modalGorunur} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalKutu}>
            <Text style={styles.modalBaslik}>Yeni Mağaza Kuponu</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>
              <TextInput style={styles.input} placeholder="Kupon Kodu (Örn: YAZ20)" value={kodu} onChangeText={setKodu} autoCapitalize="characters" />
              <View style={{flexDirection: 'row', gap: 10, marginBottom: 10}}>
                  <TouchableOpacity style={[styles.tipBtn, indirimTipi === 'Tutar' && styles.tipAktif]} onPress={() => setIndirimTipi('Tutar')}><Text style={indirimTipi === 'Tutar' && {color: '#fff', fontWeight:'bold'}}>Net TL</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.tipBtn, indirimTipi === 'Yuzde' && styles.tipAktif]} onPress={() => setIndirimTipi('Yuzde')}><Text style={indirimTipi === 'Yuzde' && {color: '#fff', fontWeight:'bold'}}>Yüzde %</Text></TouchableOpacity>
              </View>
              <TextInput style={styles.input} placeholder="İndirim Değeri" value={indirimDegeri} onChangeText={setIndirimDegeri} keyboardType="numeric" />
              {kapsam === 'TumMagaza' && (
                 <TextInput style={styles.input} placeholder="Alt Limit (TL)" value={altLimit} onChangeText={setAltLimit} keyboardType="numeric" />
              )}
              <TextInput style={styles.input} placeholder="Geçerlilik (Gün)" value={gecerlilikGunu} onChangeText={setGecerlilikGunu} keyboardType="numeric" />
              
              <Text style={styles.altBaslik}>Kimler Kullanabilir?</Text>
              <View style={{flexDirection: 'row', gap: 10, marginBottom: 15}}>
                  <TouchableOpacity style={[styles.tipBtn, herkeseAcikMi && styles.kapsamAktif]} onPress={() => setHerkeseAcikMi(true)}>
                    <Text style={[herkeseAcikMi && {color: '#fff', fontWeight:'bold'}, {textAlign: 'center'}]}>Herkese Açık</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.tipBtn, !herkeseAcikMi && styles.vipAktif]} onPress={() => setHerkeseAcikMi(false)}>
                    <Text style={[!herkeseAcikMi && {color: '#fff', fontWeight:'bold'}, {textAlign: 'center'}]}>Sadece Takipçiler</Text>
                  </TouchableOpacity>
              </View>

              <Text style={styles.altBaslik}>Kupon Kapsamı</Text>
              <View style={{flexDirection: 'row', gap: 10, marginBottom: 15}}>
                  <TouchableOpacity style={[styles.tipBtn, kapsam === 'TumMagaza' && styles.kapsamAktif]} onPress={() => setKapsam('TumMagaza')}>
                    <Text style={[kapsam === 'TumMagaza' && {color: '#fff', fontWeight:'bold'}, {textAlign: 'center'}]}>Tüm Mağaza</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.tipBtn, kapsam === 'SeciliUrunler' && styles.kapsamAktif]} onPress={() => setKapsam('SeciliUrunler')}>
                    <Text style={[kapsam === 'SeciliUrunler' && {color: '#fff', fontWeight:'bold'}, {textAlign: 'center'}]}>Seçili Ürünler</Text>
                  </TouchableOpacity>
              </View>

              {kapsam === 'SeciliUrunler' && (
                <View style={styles.urunListeAlani}>
                  {urunlerYukleniyor ? (
                     <ActivityIndicator size="small" color="#FF9F00" style={{margin: 10}} />
                  ) : magazaUrunleri.length === 0 ? (
                     <Text style={{textAlign: 'center', color: '#666', padding: 10}}>Mağazanızda ürün bulunamadı.</Text>
                  ) : (
                    magazaUrunleri.map((urun) => (
                      <TouchableOpacity key={urun.id} style={styles.urunSatir} onPress={() => urunSeciminiDegistir(urun.id)}>
                        <Ionicons name={secilenUrunIds.includes(urun.id) ? "checkbox" : "square-outline"} size={24} color={secilenUrunIds.includes(urun.id) ? "#007AFF" : "#CCC"} />
                        <Text style={styles.urunAd} numberOfLines={1}>{urun.ad}</Text>
                        <Text style={styles.urunFiyat}>{urun.fiyat} TL</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </ScrollView>

            <View style={{flexDirection: 'row', gap: 10, marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee'}}>
              <TouchableOpacity style={[styles.btn, {backgroundColor: '#ccc'}]} onPress={() => setModalGorunur(false)}><Text style={{fontWeight: 'bold'}}>İptal</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btn, {backgroundColor: '#FF9F00'}]} onPress={kuponOlustur} disabled={islemYapiliyor}>
                {islemYapiliyor ? <ActivityIndicator color="#fff"/> : <Text style={{color: '#fff', fontWeight: 'bold'}}>Oluştur</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- YENİ: TAKİPÇİLER MODALI --- */}
      <Modal visible={takipcilerModalGorunur} animationType="fade" transparent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalKutu}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
               <Text style={styles.modalBaslik}>Takipçilerim ({takipciler.length})</Text>
               <TouchableOpacity onPress={() => setTakipcilerModalGorunur(false)}>
                 <Ionicons name="close" size={24} color="#333" />
               </TouchableOpacity>
            </View>

            {takipcilerYukleniyor ? (
               <ActivityIndicator size="large" color="#8E44AD" style={{margin: 30}} />
            ) : takipciler.length === 0 ? (
               <Text style={{textAlign: 'center', color: '#666', padding: 20}}>Henüz mağazanızı takip eden kimse yok.</Text>
            ) : (
               <FlatList
                 data={takipciler}
                 keyExtractor={(item) => item.id.toString()}
                 renderItem={({ item }) => (
                   <View style={styles.takipciSatir}>
                     <Ionicons name="person-circle" size={40} color="#CCC" />
                     <View style={{marginLeft: 12}}>
                        <Text style={{fontWeight: 'bold', fontSize: 15}}>{item.adSoyad}</Text>
                        <Text style={{color: '#666', fontSize: 13}}>{item.email}</Text>
                     </View>
                   </View>
                 )}
               />
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#FFF' },
  headerBaslik: { fontSize: 18, fontWeight: 'bold' },
  kart: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#FF9F00' },
  kod: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  detay: { fontSize: 13, color: '#666' },
  
  // Ana Ekle Butonu
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#FF9F00', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2 },
  
  // YENİ: Takipçiler Butonu
  fabSecondary: { position: 'absolute', bottom: 95, right: 25, backgroundColor: '#8E44AD', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2 },
  
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalKutu: { backgroundColor: '#FFF', borderRadius: 15, padding: 20, maxHeight: '90%' },
  modalBaslik: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  altBaslik: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10 },
  
  tipBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tipAktif: { backgroundColor: '#FF9F00', borderColor: '#FF9F00' },
  kapsamAktif: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  vipAktif: { backgroundColor: '#8E44AD', borderColor: '#8E44AD' },
  btn: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' },

  urunListeAlani: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 5, marginBottom: 10 },
  urunSatir: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  urunAd: { flex: 1, marginLeft: 10, fontSize: 14, color: '#333' },
  urunFiyat: { fontSize: 13, fontWeight: 'bold', color: '#666' },

  // YENİ: Takipçi Listesi Satır Stili
  takipciSatir: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F5' }
});