import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminKupon() {
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

  // Kullanıcıya Kupon Tanımlama State'leri
  const [kullaniciModalGorunur, setKullaniciModalGorunur] = useState(false);
  const [kullanicilar, setKullanicilar] = useState<any[]>([]);
  const [filtrelenmisKullanicilar, setFiltrelenmisKullanicilar] = useState<any[]>([]); // YENİ: Filtrelenmiş liste
  const [kullaniciAramaMetni, setKullaniciAramaMetni] = useState(''); // YENİ: Arama metni
  const [kullanicilarYukleniyor, setKullanicilarYukleniyor] = useState(false);
  const [seciliKullanicilar, setSeciliKullanicilar] = useState<number[]>([]);
  const [seciliKupon, setSeciliKupon] = useState<any>(null);

  useEffect(() => { kuponlariGetir(); }, []);

  // YENİ: Kullanıcı arama filtresi mantığı
  useEffect(() => {
    if (kullaniciAramaMetni.trim() === '') {
      setFiltrelenmisKullanicilar(kullanicilar);
    } else {
      const aranan = kullaniciAramaMetni.toLowerCase();
      const sonuc = kullanicilar.filter(u => 
        (u.adSoyad && u.adSoyad.toLowerCase().includes(aranan)) || 
        (u.email && u.email.toLowerCase().includes(aranan))
      );
      setFiltrelenmisKullanicilar(sonuc);
    }
  }, [kullaniciAramaMetni, kullanicilar]);

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

  const kuponSil = async (id: number, kod: string) => {
    Alert.alert("Emin misiniz?", `'${kod}' kodlu genel sistem kuponu silinecek.`, [
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

  const kuponOlustur = async () => {
    if (!kodu || !indirimDegeri || !altLimit || !gecerlilikGunu) return Alert.alert("Uyarı", "Tüm alanları doldurun.");
    setIslemYapiliyor(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(`${API_CONFIG.BASE_URL}/kupon/yonetim/olustur`, {
        kodu, 
        indirimTipi, 
        indirimDegeri: parseFloat(indirimDegeri), 
        altLimit: parseFloat(altLimit), 
        gecerlilikGunu: parseInt(gecerlilikGunu),
        herkeseAcikMi 
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setModalGorunur(false);
      setKodu(''); setIndirimDegeri(''); setAltLimit(''); setGecerlilikGunu('30'); setIndirimTipi('Tutar'); setHerkeseAcikMi(true);
      kuponlariGetir();
    } catch (error: any) {
      Alert.alert("Hata", error.response?.data?.mesaj || "Kupon oluşturulamadı.");
    } finally { setIslemYapiliyor(false); }
  };

  const kullanicilariGetir = async () => {
    setKullanicilarYukleniyor(true);
    setKullaniciAramaMetni(''); // Modal açıldığında aramayı sıfırla
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/kullanicilar`, { headers: { Authorization: `Bearer ${token}` } });
      
      const sadeceMusteriler = response.data.filter((u: any) => u.rol === 'Kullanici');
      const liste = sadeceMusteriler.length > 0 ? sadeceMusteriler : response.data;
      
      setKullanicilar(liste);
      setFiltrelenmisKullanicilar(liste);
    } catch (error) {
      Alert.alert("Hata", "Kullanıcı listesi alınamadı.");
    } finally {
      setKullanicilarYukleniyor(false);
    }
  };

  const kullanicilaraKuponTanimla = async () => {
    setIslemYapiliyor(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(`${API_CONFIG.BASE_URL}/kupon/yonetim/tanimla`, {
        kuponId: seciliKupon.id,
        kullaniciIdleri: seciliKullanicilar
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      Alert.alert("Başarılı", "Kupon atamaları güncellendi.");
      setKullaniciModalGorunur(false);
      kuponlariGetir();
    } catch (error: any) {
      Alert.alert("Hata", error.response?.data?.mesaj || "Kupon tanımlanırken hata oluştu.");
    } finally {
      setIslemYapiliyor(false);
    }
  };

  const toggleKullanici = (id: number) => {
    if (seciliKullanicilar.includes(id)) {
      setSeciliKullanicilar(prev => prev.filter(kId => kId !== id)); 
    } else {
      setSeciliKullanicilar(prev => [...prev, id]); 
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} /></TouchableOpacity>
        <Text style={styles.headerBaslik}>Sistem Kuponları</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? <ActivityIndicator style={{marginTop: 50}} size="large" color="#007AFF" /> : (
        <FlatList
          data={kuponlar}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 15 }}
          renderItem={({ item }) => (
            <View style={styles.kart}>
              
              <View style={{flex: 1}}>
                <Text style={{fontSize: 11, color: item.herkeseAcikMi ? '#4CAF50' : '#8E44AD', fontWeight: 'bold', marginBottom: 4}}>
                  {item.herkeseAcikMi ? "🌍 Site Geneli (Herkese Açık)" : "🔒 Kişiye Özel (Gizli/Telafi)"}
                </Text>

                <Text style={styles.kod}>{item.kodu}</Text>
                <Text style={styles.detay}>Sistem Kuponu | İndirim: {item.indirimTipi === 'Yuzde' ? `%${item.indirimDegeri}` : `${item.indirimDegeri} TL`}</Text>
                
                <Text style={[styles.detay, { marginTop: 4, color: item.bitisTarihi ? '#FF9800' : '#28A745', fontWeight: '600' }]}>
                  Son Kullanma: {item.bitisTarihi ? new Date(item.bitisTarihi).toLocaleDateString('tr-TR') : 'Süresiz / Limitsiz'}
                </Text>

                {!item.herkeseAcikMi && item.tanimliKullanicilar && item.tanimliKullanicilar.length > 0 && (
                  <Text style={[styles.detay, { marginTop: 6, fontStyle: 'italic', color: '#007AFF' }]}>
                    👥 Tanımlı Kişiler: <Text style={{fontWeight: 'bold'}}>{item.tanimliKullanicilar.join(', ')}</Text>
                  </Text>
                )}
              </View>
              
              <View style={styles.aksiyonButonlarAlani}>
                <TouchableOpacity 
                  style={styles.ikonButon}
                  onPress={() => {
                    setSeciliKupon(item);
                    setSeciliKullanicilar(item.tanimliKullaniciIdleri || []);
                    setKullaniciModalGorunur(true);
                    kullanicilariGetir();
                  }}
                >
                  <Ionicons name="person-add" size={24} color={item.herkeseAcikMi ? "#CCC" : "#4CAF50"} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.ikonButon}
                  onPress={() => kuponSil(item.id, item.kodu)}
                >
                  <Ionicons name="trash" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>

            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalGorunur(true)}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      {/* 1. MODAL: Yeni Kupon Oluşturma Modalı */}
      <Modal visible={modalGorunur} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <View style={styles.modalKutu}>
            <Text style={styles.modalBaslik}>Yeni Sistem Kuponu</Text>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput style={styles.input} placeholder="Kupon Kodu (Örn: OZR50)" value={kodu} onChangeText={setKodu} autoCapitalize="characters" />
              
              <View style={{flexDirection: 'row', gap: 10, marginBottom: 10}}>
                  <TouchableOpacity style={[styles.tipBtn, indirimTipi === 'Tutar' && styles.tipAktif]} onPress={() => setIndirimTipi('Tutar')}><Text style={indirimTipi === 'Tutar' && {color: '#fff', fontWeight:'bold'}}>Net TL</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.tipBtn, indirimTipi === 'Yuzde' && styles.tipAktif]} onPress={() => setIndirimTipi('Yuzde')}><Text style={indirimTipi === 'Yuzde' && {color: '#fff', fontWeight:'bold'}}>Yüzde %</Text></TouchableOpacity>
              </View>
              
              <TextInput style={styles.input} placeholder="İndirim Değeri" value={indirimDegeri} onChangeText={setIndirimDegeri} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Alt Limit (TL)" value={altLimit} onChangeText={setAltLimit} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Geçerlilik (Gün)" value={gecerlilikGunu} onChangeText={setGecerlilikGunu} keyboardType="numeric" />
              
              <Text style={{fontWeight: 'bold', marginTop: 5, marginBottom: 8, color: '#333'}}>Kupon Görünürlüğü:</Text>
              <View style={{flexDirection: 'row', gap: 10, marginBottom: 15}}>
                  <TouchableOpacity style={[styles.tipBtn, herkeseAcikMi && styles.tipAktif]} onPress={() => setHerkeseAcikMi(true)}>
                    <Text style={[herkeseAcikMi && {color: '#fff', fontWeight:'bold'}, {textAlign: 'center'}]}>Herkese Açık (Site Geneli)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.tipBtn, !herkeseAcikMi && {backgroundColor: '#8E44AD', borderColor: '#8E44AD'}]} onPress={() => setHerkeseAcikMi(false)}>
                    <Text style={[!herkeseAcikMi && {color: '#fff', fontWeight:'bold'}, {textAlign: 'center'}]}>Kişiye Özel (Telafi / Gizli)</Text>
                  </TouchableOpacity>
              </View>

              <View style={{flexDirection: 'row', gap: 10, marginTop: 5}}>
                <TouchableOpacity style={[styles.btn, {backgroundColor: '#ccc'}]} onPress={() => setModalGorunur(false)}><Text style={{fontWeight: 'bold'}}>İptal</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.btn, {backgroundColor: '#007AFF'}]} onPress={kuponOlustur} disabled={islemYapiliyor}>
                  {islemYapiliyor ? <ActivityIndicator color="#fff"/> : <Text style={{color: '#fff', fontWeight: 'bold'}}>Oluştur</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 2. MODAL: Kullanıcılara Kupon Tanımlama / Geri Alma Modalı (Arama Özellikli) */}
      <Modal visible={kullaniciModalGorunur} animationType="slide" transparent={true}>
        <View style={styles.modalBg}>
          <View style={[styles.modalKutu, { flex: 0.85 }]}>
            <Text style={styles.modalBaslik}>{seciliKupon?.kodu} Tanımla / Kaldır</Text>
            <Text style={{marginBottom: 10, color: '#666', fontSize: 13}}>
              Kuponu eklemek veya geri almak istediğiniz kişileri arayın ve seçin.
            </Text>

            {/* YENİ: Kullanıcı Arama Çubuğu */}
            <View style={styles.aramaKutusu}>
              <Ionicons name="search" size={18} color="#8E8E93" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.aramaInput}
                placeholder="İsim veya e-posta ile ara..."
                placeholderTextColor="#8E8E93"
                value={kullaniciAramaMetni}
                onChangeText={setKullaniciAramaMetni}
              />
              {kullaniciAramaMetni.length > 0 && (
                <TouchableOpacity onPress={() => setKullaniciAramaMetni('')}>
                  <Ionicons name="close-circle" size={16} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </View>

            {kullanicilarYukleniyor ? (
               <ActivityIndicator size="large" color="#4CAF50" style={{ margin: 20 }} />
            ) : (
              <FlatList
                data={filtrelenmisKullanicilar}
                keyExtractor={(item) => item.id.toString()}
                initialNumToRender={20}
                maxToRenderPerBatch={20}
                windowSize={10}
                renderItem={({ item }) => {
                  const seciliMi = seciliKullanicilar.includes(item.id);
                  const isPasif = item.isDeleted === true; 

                  return (
                    <TouchableOpacity 
                      style={[styles.kullaniciSatiri, seciliMi && styles.kullaniciSatiriAktif, isPasif && { opacity: 0.5, backgroundColor: '#f0f0f0' }]} 
                      onPress={() => !isPasif && toggleKullanici(item.id)} 
                      activeOpacity={isPasif ? 1 : 0.7}
                    >
                      <View style={{flex: 1, marginRight: 10}}>
                        <Text style={[styles.kullaniciAd, isPasif && { color: '#999' }]} numberOfLines={1}>
                          {item.adSoyad || 'İsimsiz Kullanıcı'} 
                          {isPasif && <Text style={{color: '#FF3B30', fontSize: 11}}> (Pasif)</Text>}
                        </Text>
                        <Text style={styles.kullaniciMail} numberOfLines={1}>{item.email}</Text>
                      </View>
                      <Ionicons 
                        name={isPasif ? "close-circle" : (seciliMi ? "checkbox" : "square-outline")} 
                        size={24} 
                        color={isPasif ? "#FF3B30" : (seciliMi ? "#4CAF50" : "#ccc")} 
                      />
                    </TouchableOpacity>
                  )
                }}
              />
            )}

            <View style={{flexDirection: 'row', gap: 10, marginTop: 15}}>
              <TouchableOpacity style={[styles.btn, {backgroundColor: '#ccc'}]} onPress={() => setKullaniciModalGorunur(false)}>
                <Text style={{fontWeight:'bold'}}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btn, {backgroundColor: '#4CAF50'}]} 
                onPress={kullanicilaraKuponTanimla} 
                disabled={islemYapiliyor}
              >
                {islemYapiliyor ? <ActivityIndicator color="#fff"/> : <Text style={{color: '#fff', fontWeight: 'bold'}}>Güncelle</Text>}
              </TouchableOpacity>
            </View>
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
  kart: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center', borderLeftWidth: 4, borderLeftColor: '#007AFF' },
  kod: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  detay: { fontSize: 13, color: '#666' },
  aksiyonButonlarAlani: { flexDirection: 'row', gap: 15, alignItems: 'center', marginLeft: 10 },
  ikonButon: { padding: 6 },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#007AFF', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalKutu: { backgroundColor: '#FFF', borderRadius: 15, padding: 20, maxHeight: '90%' },
  modalBaslik: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 10 },
  tipBtn: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tipAktif: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  btn: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' },
  
  // ARAMA ÇUBUĞU STİLLERİ
  aramaKutusu: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA'
  },
  aramaInput: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1E',
  },

  kullaniciSatiri: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fafafa', borderRadius: 8, marginBottom: 5 },
  kullaniciSatiriAktif: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50', borderWidth: 1 },
  kullaniciAd: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  kullaniciMail: { fontSize: 11, color: '#666' }
});