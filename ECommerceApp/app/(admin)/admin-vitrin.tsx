import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ImageBackground, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminVitrin() {
  const router = useRouter();
  const [bannerlar, setBannerlar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [islemde, setIslemde] = useState(false);

  // 🌟 YENİ: VİTRİN AFİŞLERİ İÇİN ARAMA ÇUBUĞU
  const [bannerAramaMetni, setBannerAramaMetni] = useState('');

  // 🌟 YENİ: SIRA GÜNCELLEME STATE'LERİ
  const [siraModalGozuksun, setSiraModalGozuksun] = useState(false);
  const [duzenlenecekBanner, setDuzenlenecekBanner] = useState<any>(null);
  const [guncelSira, setGuncelSira] = useState('');

  // 🌟 FORM STATE'LERİ
  const [modalGozuksun, setModalGozuksun] = useState(false);
  const [yeniBaslik, setYeniBaslik] = useState('');
  const [yeniResimUrl, setYeniResimUrl] = useState('');
  const [yeniYonlendirme, setYeniYonlendirme] = useState('Yok'); 
  const [yeniSiraNo, setYeniSiraNo] = useState('1');

  // 🌟 AKILLI SEÇİM İÇİN STATE'LER
  const [yeniHedefId, setYeniHedefId] = useState('');
  const [secilenHedefAd, setSecilenHedefAd] = useState('');
  const [secimModalGozuksun, setSecimModalGozuksun] = useState(false);
  
  // 🌟 LİSTE İÇİ ARAMA (Popup İçi)
  const [aramaAcik, setAramaAcik] = useState(false);
  const [aramaMetni, setAramaMetni] = useState('');
  
  const [magazalar, setMagazalar] = useState<any[]>([]);
  const [urunler, setUrunler] = useState<any[]>([]);
  const [kategoriler, setKategoriler] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      bannerlariGetir();
    }, [])
  );

  useEffect(() => {
    if (modalGozuksun) {
      secimListeleriniGetir();
    }
  }, [modalGozuksun]);

  const bannerlariGetir = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_CONFIG.BASE_URL}/vitrin/bannerlar`);
      setBannerlar(response.data);
    } catch (error) {
      console.error("Bannerlar getirilemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const secimListeleriniGetir = async () => {
    const token = await AsyncStorage.getItem('userToken');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const resMagaza = await axios.get(`${API_CONFIG.BASE_URL}/admin/magazalar`, { headers });
      setMagazalar(resMagaza.data);
    } catch (error) {}

    try {
      const resUrun = await axios.get(`${API_CONFIG.BASE_URL}/vitrin/indirimli-urunler`, { headers });
      setUrunler(resUrun.data);
    } catch (error) {}

    try {
      const resKategori = await axios.get(`${API_CONFIG.BASE_URL}/Kategori`);
      const kategorileriDuzlestir = (liste: any[], ustKategoriAdi = ""): any[] => {
        let duzListe: any[] = [];
        liste.forEach(kat => {
          const gercekAd = kat.ad || kat.kategoriAdi;
          const gercekId = kat.id || kat.kategoriId;
          const gorunenAd = ustKategoriAdi ? `${ustKategoriAdi} > ${gercekAd}` : gercekAd;
          duzListe.push({ id: gercekId, ad: gorunenAd });
          if (kat.altKategoriler && Array.isArray(kat.altKategoriler)) {
            duzListe = duzListe.concat(kategorileriDuzlestir(kat.altKategoriler, gorunenAd));
          } else if (kat.subCategories && Array.isArray(kat.subCategories)) { 
            duzListe = duzListe.concat(kategorileriDuzlestir(kat.subCategories, gorunenAd));
          }
        });
        return duzListe;
      };
      setKategoriler(kategorileriDuzlestir(resKategori.data));
    } catch (error) {}
  };

  const durumGuncelle = async (id: number, suAnkiDurum: boolean) => {
    try {
      setIslemde(true);
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(`${API_CONFIG.BASE_URL}/vitrin/banner-durum/${id}`, !suAnkiDurum, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      bannerlariGetir();
    } catch (error) {
      Alert.alert("Hata", "Durum güncellenirken bir sorun oluştu.");
    } finally {
      setIslemde(false);
    }
  };

  const afisSil = async (id: number) => {
    Alert.alert("Emin Misiniz?", "Bu afişi tamamen silmek istediğinize emin misiniz?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: async () => {
          try {
            setIslemde(true);
            const token = await AsyncStorage.getItem('userToken');
            await axios.delete(`${API_CONFIG.BASE_URL}/vitrin/banner-sil/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            bannerlariGetir();
          } catch (error) { Alert.alert("Hata", "Afiş silinemedi."); } 
          finally { setIslemde(false); }
        }
      }
    ]);
  };

  const yeniAfisKaydet = async () => {
    if (!yeniBaslik || !yeniResimUrl) {
      Alert.alert("Uyarı", "Lütfen başlık ve resim URL'si alanlarını doldurun.");
      return;
    }
    if (yeniYonlendirme !== 'Yok' && !yeniHedefId) {
      Alert.alert("Uyarı", "Lütfen yönlendirilecek hedefi listeden seçin.");
      return;
    }

    try {
      setIslemde(true);
      const token = await AsyncStorage.getItem('userToken');
      const payload = {
        baslik: yeniBaslik,
        resimUrl: yeniResimUrl,
        yonlendirmeTuru: yeniYonlendirme,
        hedefId: yeniHedefId ? parseInt(yeniHedefId) : null,
        siraNo: parseInt(yeniSiraNo) || 1,
        aktifMi: true 
      };

      await axios.post(`${API_CONFIG.BASE_URL}/vitrin/banner-ekle`, payload, { headers: { Authorization: `Bearer ${token}` } });
      Alert.alert("Başarılı", "Yeni vitrin afişi sisteme eklendi!");
      
      setYeniBaslik(''); setYeniResimUrl(''); setYeniHedefId(''); setSecilenHedefAd('');
      setYeniYonlendirme('Yok'); setYeniSiraNo('1'); setModalGozuksun(false);
      bannerlariGetir();
    } catch (error) { Alert.alert("Hata", "Afiş eklenirken bir sorun oluştu."); } 
    finally { setIslemde(false); }
  };

  // 🌟 YENİ: SIRA GÜNCELLEME İŞLEMİ
  const siraGuncelleKaydet = async () => {
    if (!guncelSira || !duzenlenecekBanner) return;

    try {
      setIslemde(true);
      const token = await AsyncStorage.getItem('userToken');
      // Backend'deki PUT apisine sadece yeni sıra numarasını yolluyoruz
      await axios.put(
        `${API_CONFIG.BASE_URL}/vitrin/banner-sira/${duzenlenecekBanner.id}`,
        Number(guncelSira),
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
      setSiraModalGozuksun(false);
      bannerlariGetir();
    } catch (error) {
      Alert.alert("Hata", "Afişin sırası güncellenemedi.");
    } finally {
      setIslemde(false);
    }
  };

  const filtrelenmisListeyiGetir = () => {
    let aktifListe = [];
    if (yeniYonlendirme === 'Magaza') aktifListe = magazalar;
    else if (yeniYonlendirme === 'Urun') aktifListe = urunler;
    else aktifListe = kategoriler;

    if (!aramaMetni) return aktifListe;
    const kucukHarfArama = aramaMetni.toLowerCase();
    
    return aktifListe.filter(item => {
      let ad = "";
      if(yeniYonlendirme === 'Magaza') ad = item.magazaAdi;
      else if(yeniYonlendirme === 'Urun') ad = item.ad;
      else ad = item.ad || item.kategoriAdi;
      return ad?.toLowerCase().includes(kucukHarfArama);
    });
  };

  // 🌟 YENİ: AFİŞLERDE ARAMA YAPMA (Büyük liste için)
  const ekrandakiBannerlar = bannerlar.filter(b => 
    b.baslik?.toLowerCase().includes(bannerAramaMetni.toLowerCase())
  );

  const renderBanner = ({ item }: { item: any }) => (
    <View style={styles.afisKart}>
      <ImageBackground source={{ uri: item.resimUrl }} style={styles.afisArkaplan} imageStyle={{ borderRadius: 16 }}>
        <View style={styles.afisKarartma}>
          
          <View style={styles.kartUstBolum}>
            <View style={[styles.durumRozet, { backgroundColor: item.aktifMi ? '#34C759' : '#8E8E93' }]}>
              <Text style={styles.durumYazi}>{item.aktifMi ? 'Yayında' : 'Pasif'}</Text>
            </View>
            
            <View style={styles.aksiyonKutusu}>
              {/* SIRA DÜZENLEME BUTONU */}
              <TouchableOpacity 
                style={styles.islemButon} 
                onPress={() => {
                  setDuzenlenecekBanner(item);
                  setGuncelSira(item.siraNo?.toString() || '1');
                  setSiraModalGozuksun(true);
                }} 
                disabled={islemde}
              >
                <Ionicons name="swap-vertical" size={20} color="#FF9F00" />
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.islemButon, { marginLeft: 8 }]} onPress={() => durumGuncelle(item.id, item.aktifMi)} disabled={islemde}>
                <Ionicons name={item.aktifMi ? "eye-off" : "eye"} size={20} color="#007AFF" />
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.islemButon, { marginLeft: 8 }]} onPress={() => afisSil(item.id)} disabled={islemde}>
                <Ionicons name="trash" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.kartAltBolum}>
            <Text style={styles.afisBaslik}>{item.baslik}</Text>
            <Text style={styles.afisHedef}>
              Sıra: {item.siraNo} | 🔗 {item.yonlendirmeTuru !== 'Yok' ? `${item.yonlendirmeTuru} (ID: ${item.hedefId})` : 'Yönlendirme Yok'}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerBaslik}>Vitrin Yönetimi</Text>
        <TouchableOpacity onPress={() => setModalGozuksun(true)}>
          <Ionicons name="add-circle" size={30} color="#673AB7" />
        </TouchableOpacity>
      </View>

      {/* 🌟 YENİ: AFİŞ LİSTESİ İÇİN ARAMA ÇUBUĞU */}
      <View style={styles.afisAramaKutusu}>
        <Ionicons name="search" size={20} color="#8E8E93" style={{ marginRight: 8 }} />
        <TextInput 
          style={styles.aramaInput}
          placeholder="Afiş başlığı ile ara..."
          placeholderTextColor="#8E8E93"
          value={bannerAramaMetni}
          onChangeText={setBannerAramaMetni}
        />
        {bannerAramaMetni.length > 0 && (
          <TouchableOpacity onPress={() => setBannerAramaMetni('')}>
            <Ionicons name="close-circle" size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#673AB7" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={ekrandakiBannerlar}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBanner}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.bosDurum}>
              <Ionicons name="images-outline" size={60} color="#D1D1D6" />
              <Text style={styles.bosYazi}>Afiş bulunamadı.</Text>
            </View>
          }
        />
      )}

      {/* 🌟 SIRA DÜZENLEME MODALI */}
      <Modal visible={siraModalGozuksun} animationType="fade" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalArkaPlan}>
          <View style={[styles.modalKutu, { maxHeight: 300 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalBaslik}>Sırayı Düzenle</Text>
              <TouchableOpacity onPress={() => setSiraModalGozuksun(false)}>
                <Ionicons name="close" size={26} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>Yeni Gösterim Sırası:</Text>
            <TextInput 
              style={styles.input} 
              value={guncelSira} 
              onChangeText={setGuncelSira} 
              keyboardType="numeric" 
              autoFocus
            />

            <TouchableOpacity style={styles.kaydetButon} onPress={siraGuncelleKaydet} disabled={islemde}>
              {islemde ? <ActivityIndicator color="#FFF" /> : <Text style={styles.kaydetButonYazi}>Sırayı Güncelle</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 🌟 ANA AFİŞ EKLEME MODALI */}
      <Modal visible={modalGozuksun} animationType="slide" transparent={true} onRequestClose={() => setModalGozuksun(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalArkaPlan}>
          <View style={styles.modalKutu}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalBaslik}>Yeni Afiş Ekle</Text>
              <TouchableOpacity onPress={() => setModalGozuksun(false)}>
                <Ionicons name="close" size={26} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.label}>Afiş Başlığı</Text>
              <TextInput style={styles.input} placeholder="Örn: Yaz İndirimleri Başladı!" value={yeniBaslik} onChangeText={setYeniBaslik} />

              <Text style={styles.label}>Resim URL (Link)</Text>
              <TextInput style={styles.input} placeholder="https://resim-linki.com/gorsel.jpg" value={yeniResimUrl} onChangeText={setYeniResimUrl} autoCapitalize="none" />

              <Text style={styles.label}>Tıklanınca Nereye Gitsin?</Text>
              <View style={styles.yonlendirmeKutusu}>
                {['Yok', 'Magaza', 'Kategori', 'Urun'].map((tur) => (
                  <TouchableOpacity 
                    key={tur} 
                    style={[styles.yonlendirmeButon, yeniYonlendirme === tur && styles.yonlendirmeButonAktif]}
                    onPress={() => {
                      setYeniYonlendirme(tur);
                      setYeniHedefId(''); 
                      setSecilenHedefAd('');
                    }}
                  >
                    <Text style={[styles.yonlendirmeButonYazi, yeniYonlendirme === tur && styles.yonlendirmeButonYaziAktif]}>
                      {tur === 'Yok' ? 'Hiçbir Yer' : tur === 'Magaza' ? 'Mağaza' : tur === 'Urun' ? 'Ürün' : 'Kategori'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {yeniYonlendirme !== 'Yok' && (
                <View style={{ marginTop: 15 }}>
                  <Text style={styles.label}>Hedef Seçin ({yeniYonlendirme})</Text>
                  <TouchableOpacity 
                    style={styles.akilliSecimKutusu} 
                    onPress={() => setSecimModalGozuksun(true)}
                  >
                    <Text style={{ color: secilenHedefAd ? '#1C1C1E' : '#8E8E93', flex: 1 }} numberOfLines={1}>
                      {secilenHedefAd ? secilenHedefAd : `Lütfen listeden bir ${yeniYonlendirme} seçin...`}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#8E8E93" />
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.label}>Gösterim Sırası</Text>
              <TextInput style={styles.input} placeholder="Örn: 1" value={yeniSiraNo} onChangeText={setYeniSiraNo} keyboardType="numeric" />

              <TouchableOpacity style={styles.kaydetButon} onPress={yeniAfisKaydet} disabled={islemde}>
                {islemde ? <ActivityIndicator color="#FFF" /> : <Text style={styles.kaydetButonYazi}>Afişi Kaydet ve Yayınla</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 🌟 LİSTEDEN HEDEF SEÇİM VE ARAMA EKRANI MODALI */}
      <Modal visible={secimModalGozuksun} animationType="fade" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalArkaPlan}>
          <View style={[styles.modalKutu, { height: '80%' }]}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalBaslik}>{yeniYonlendirme} Seçimi</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity 
                  style={{ marginRight: 15 }} 
                  onPress={() => {
                    setAramaAcik(!aramaAcik);
                    if (aramaAcik) setAramaMetni(''); 
                  }}
                >
                  <Ionicons name="search" size={24} color={aramaAcik ? "#673AB7" : "#8E8E93"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  setSecimModalGozuksun(false);
                  setAramaAcik(false);
                  setAramaMetni('');
                }}>
                  <Ionicons name="close" size={26} color="#8E8E93" />
                </TouchableOpacity>
              </View>
            </View>

            {aramaAcik && (
              <View style={styles.aramaKutusu}>
                <Ionicons name="search" size={20} color="#8E8E93" style={{ marginRight: 8 }} />
                <TextInput 
                  style={styles.aramaInput}
                  placeholder={`${yeniYonlendirme} ismine göre ara...`}
                  placeholderTextColor="#8E8E93"
                  value={aramaMetni}
                  onChangeText={setAramaMetni}
                  autoFocus
                />
                {aramaMetni.length > 0 && (
                  <TouchableOpacity onPress={() => setAramaMetni('')}>
                    <Ionicons name="close-circle" size={20} color="#8E8E93" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            <FlatList 
              data={filtrelenmisListeyiGetir()}
              keyExtractor={(item, index) => index.toString()}
              keyboardShouldPersistTaps="handled"
              renderItem={({item}) => {
                let ad = ""; let id = "";
                
                if(yeniYonlendirme === 'Magaza') { ad = item.magazaAdi; id = item.magazaId; }
                else if(yeniYonlendirme === 'Urun') { ad = item.ad; id = item.id; }
                else { ad = item.ad || item.kategoriAdi; id = item.id || item.kategoriId; }

                return (
                  <TouchableOpacity 
                    style={styles.listeItem} 
                    onPress={() => {
                      setYeniHedefId(id.toString());
                      setSecilenHedefAd(ad);
                      setSecimModalGozuksun(false);
                      setAramaAcik(false);
                      setAramaMetni('');
                    }}
                  >
                    <Text style={styles.listeItemYazi} numberOfLines={1}>
                      {ad} 
                      {yeniYonlendirme === 'Urun' && item.indirimliFiyat ? `  (🔥 ${item.indirimliFiyat} TL)` : ''}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="#D1D1D6" />
                  </TouchableOpacity>
                )
              }}
              ListEmptyComponent={<Text style={{textAlign: 'center', color: '#8E8E93', marginTop: 30}}>Aramanıza uygun sonuç bulunamadı.</Text>}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  geriButon: { padding: 4, marginLeft: -4 },
  headerBaslik: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E' },
  
  // YENİ: AFİŞ ARAMA KUTUSU
  afisAramaKutusu: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  afisKart: { height: 200, marginBottom: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  afisArkaplan: { flex: 1 },
  afisKarartma: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 16, padding: 15, justifyContent: 'space-between' },
  kartUstBolum: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  durumRozet: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  durumYazi: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  aksiyonKutusu: { flexDirection: 'row' },
  islemButon: { backgroundColor: 'rgba(255,255,255,0.9)', padding: 8, borderRadius: 8 },
  kartAltBolum: { width: '100%' },
  afisBaslik: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  afisHedef: { color: '#E5E5EA', fontSize: 13, fontWeight: '500' },
  
  bosDurum: { alignItems: 'center', marginTop: 100 },
  bosYazi: { color: '#8E8E93', fontSize: 16, marginTop: 15, fontWeight: '500' },

  modalArkaPlan: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalKutu: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 25, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalBaslik: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E' },
  label: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#F2F2F7', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, padding: 14, fontSize: 15, color: '#1C1C1E' },
  yonlendirmeKutusu: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  yonlendirmeButon: { backgroundColor: '#F2F2F7', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA' },
  yonlendirmeButonAktif: { backgroundColor: '#EDE7F6', borderColor: '#673AB7' },
  yonlendirmeButonYazi: { color: '#8E8E93', fontWeight: '600' },
  yonlendirmeButonYaziAktif: { color: '#673AB7' },
  
  akilliSecimKutusu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, padding: 14 },
  listeItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  listeItemYazi: { fontSize: 15, color: '#1C1C1E', flex: 1, paddingRight: 10 },

  aramaKutusu: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 15,
  },
  aramaInput: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
  },

  kaydetButon: { backgroundColor: '#673AB7', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 30, shadowColor: '#673AB7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4 },
  kaydetButonYazi: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});