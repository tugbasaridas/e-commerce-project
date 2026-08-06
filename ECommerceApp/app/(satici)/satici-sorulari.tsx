import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type FiltreTipi = 'Tümü' | 'Bekliyor' | 'Cevaplandı';

export default function SaticiSorulari() {
  const router = useRouter();
  const [sorular, setSorular] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [aramaMetni, setAramaMetni] = useState('');
  const [seciliFiltre, setSeciliFiltre] = useState<FiltreTipi>('Tümü');

  const [modalGorunur, setModalGorunur] = useState(false);
  const [seciliSoru, setSeciliSoru] = useState<any>(null);
  const [cevapMetni, setCevapMetni] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  useEffect(() => {
    sorulariGetir();
  }, []);

  const sorulariGetir = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      const response = await axios.get(`${API_CONFIG.BASE_URL}/urunsoru/satici-sorulari`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSorular(response.data);
    } catch (error) {
      console.error("Sorular getirilirken hata:", error);
      Alert.alert("Hata", "Sorular yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const cevaplamaPenceresiniAc = (soru: any) => {
    setSeciliSoru(soru);
    setCevapMetni('');
    setModalGorunur(true);
  };

  const cevapGonder = async () => {
    if (cevapMetni.trim().length < 3) {
      Alert.alert("Uyarı", "Lütfen geçerli ve açıklayıcı bir cevap yazın.");
      return;
    }

    try {
      setGonderiliyor(true);
      const token = await AsyncStorage.getItem('userToken');
      
      await axios.post(
        `${API_CONFIG.BASE_URL}/urunsoru/cevapla/${seciliSoru.soruId}`,
        { cevapMetni: cevapMetni.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Başarılı", "Cevabınız müşteriye iletildi ve yayına alındı.");
      setModalGorunur(false);
      sorulariGetir(); 

    } catch (error: any) {
      Alert.alert("Hata", error.response?.data?.mesaj || "Cevap gönderilemedi.");
    } finally {
      setGonderiliyor(false);
    }
  };

  const tarihFormatla = (tarihString: string) => {
    return new Date(tarihString).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filtrelenmisSorular = useMemo(() => {
    return sorular.filter(soru => {
      if (seciliFiltre === 'Bekliyor' && soru.cevaplandiMi) return false;
      if (seciliFiltre === 'Cevaplandı' && !soru.cevaplandiMi) return false;

      const arananKucuk = aramaMetni.toLowerCase();
      const urunAdUyar = (soru.urunAdi || '').toLowerCase().includes(arananKucuk);
      const soruMetniUyar = (soru.soruMetni || '').toLowerCase().includes(arananKucuk);
      const musteriAdUyar = (soru.musteriAdi || '').toLowerCase().includes(arananKucuk);

      if (aramaMetni.trim() !== '' && !urunAdUyar && !soruMetniUyar && !musteriAdUyar) return false;

      return true;
    });
  }, [sorular, aramaMetni, seciliFiltre]);

  const soruKartiCiz = ({ item }: { item: any }) => (
    <View style={styles.kart}>
      {/* Üst Kısım: Müşteri Adı ve Tarih */}
      <View style={styles.musteriBilgiSatiri}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.musteriAvatar}>
            <Ionicons name="person" size={14} color="#FF9F00" />
          </View>
          <Text style={styles.musteriAdi}>{item.musteriAdi || "Müşteri"}</Text>
        </View>
        <Text style={styles.tarihYazi}>{tarihFormatla(item.soruTarihi)}</Text>
      </View>

      {/* Ürün Bilgisi Satırı */}
      <View style={styles.urunBilgiSatiri}>
        <Image source={{ uri: item.urunResmi || 'https://via.placeholder.com/50' }} style={styles.urunResim} />
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={styles.urunEtiket}>İlgili Ürün:</Text>
          <Text style={styles.urunAdi} numberOfLines={2}>{item.urunAdi}</Text>
        </View>
        <View style={[styles.durumRozet, { backgroundColor: item.cevaplandiMi ? '#E8F5E9' : '#FFF3E0' }]}>
          <Ionicons name={item.cevaplandiMi ? "checkmark-circle" : "time"} size={14} color={item.cevaplandiMi ? "#28A745" : "#FF9F00"} style={{ marginRight: 4 }} />
          <Text style={[styles.durumYazi, { color: item.cevaplandiMi ? "#28A745" : "#FF9F00" }]}>
            {item.cevaplandiMi ? "Cevaplandı" : "Bekliyor"}
          </Text>
        </View>
      </View>

      {/* Soru İçeriği */}
      <View style={styles.soruKutusu}>
        <Text style={styles.soruBaslik}>Müşteri Sorusu:</Text>
        <Text style={styles.soruMetni}>{item.soruMetni}</Text>
      </View>

      {/* Aksiyon veya Cevap İçeriği */}
      {item.cevaplandiMi ? (
        <View style={styles.cevapKutusu}>
          <Text style={styles.cevapBaslik}>Sizin Cevabınız:</Text>
          <Text style={styles.cevapMetni}>{item.cevapMetni}</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.cevaplaBtn} onPress={() => cevaplamaPenceresiniAc(item)}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.cevaplaBtnYazi}>Cevapla</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Müşteri Soruları</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* ARAMA ÇUBUĞU */}
      <View style={styles.aramaKutusuContainer}>
        <View style={styles.aramaKutusu}>
          <Ionicons name="search-outline" size={20} color="#8E8E93" />
          <TextInput
            style={styles.aramaInput}
            placeholder="Ürün adı, müşteri veya soru içeriğinde ara..."
            placeholderTextColor="#8E8E93"
            value={aramaMetni}
            onChangeText={setAramaMetni}
            autoCorrect={false}
          />
          {aramaMetni.length > 0 && (
            <TouchableOpacity onPress={() => setAramaMetni('')}>
              <Ionicons name="close-circle" size={18} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* FİLTRELEME SEKMELERİ */}
      <View style={styles.filtreKapsayici}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtreScroll}>
          {['Tümü', 'Bekliyor', 'Cevaplandı'].map((durum, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.filtreChip, seciliFiltre === durum && styles.aktifFiltreChip]}
              onPress={() => setSeciliFiltre(durum as FiltreTipi)}
            >
              <Text style={[styles.filtreChipYazi, seciliFiltre === durum && styles.aktifFiltreChipYazi]}>{durum}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* SORULAR LİSTESİ */}
      {loading ? (
        <View style={styles.merkez}><ActivityIndicator size="large" color="#FF9F00" /></View>
      ) : (
        <FlatList
          data={filtrelenmisSorular}
          keyExtractor={(item) => item.soruId.toString()}
          renderItem={soruKartiCiz}
          contentContainerStyle={styles.listeIci}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.bosDurum}>
              <Ionicons name={aramaMetni ? "search-outline" : "chatbubbles-outline"} size={60} color="#D1D1D6" />
              <Text style={styles.bosDurumYazi}>
                {aramaMetni || seciliFiltre !== 'Tümü' 
                  ? "Aradığınız kritere uygun soru bulunamadı." 
                  : "Mağazanıza henüz bir soru sorulmamış."}
              </Text>
            </View>
          }
        />
      )}

      {/* CEVAPLAMA MODALI */}
      <Modal visible={modalGorunur} transparent animationType="slide">
        <View style={styles.modalArkaPlan}>
          <View style={styles.modalKutu}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalBaslik}>Müşteriye Yanıt Ver</Text>
              <TouchableOpacity onPress={() => setModalGorunur(false)}>
                <Ionicons name="close" size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            {seciliSoru && (
              <View style={styles.modalSoruOzet}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#FF9F00', marginBottom: 2 }}>{seciliSoru.musteriAdi} sordu:</Text>
                <Text style={styles.modalSoruMetni} numberOfLines={3}>"{seciliSoru.soruMetni}"</Text>
              </View>
            )}

            <TextInput
              style={styles.inputArea}
              placeholder="Müşteriye nazik ve açıklayıcı bir yanıt yazın..."
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={5}
              value={cevapMetni}
              onChangeText={setCevapMetni}
            />

            <TouchableOpacity 
              style={[styles.gonderBtn, gonderiliyor && { backgroundColor: '#ccc' }]} 
              onPress={cevapGonder}
              disabled={gonderiliyor}
            >
              {gonderiliyor ? <ActivityIndicator color="#fff" /> : <Text style={styles.gonderBtnYazi}>Yanıtı Yayınla</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFFFFF' },
  geriButon: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E' },
  
  aramaKutusuContainer: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingBottom: 10 },
  aramaKutusu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 10, paddingHorizontal: 12, height: 48, borderWidth: 1, borderColor: '#E5E5EA' },
  aramaInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#1C1C1E' },
  filtreKapsayici: { backgroundColor: '#FFFFFF', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  filtreScroll: { paddingHorizontal: 15 },
  filtreChip: { backgroundColor: '#F2F2F7', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginHorizontal: 5, borderWidth: 1, borderColor: '#E5E5EA' },
  aktifFiltreChip: { backgroundColor: '#FF9F00', borderColor: '#FF9F00' },
  filtreChipYazi: { fontSize: 13, color: '#48484A', fontWeight: '600' },
  aktifFiltreChipYazi: { color: '#FFFFFF' },

  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listeIci: { padding: 15, paddingBottom: 50 },
  bosDurum: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 20 },
  bosDurumYazi: { fontSize: 15, color: '#8E8E93', marginTop: 15, textAlign: 'center' },
  
  kart: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#eee' },
  
  // Müşteri Bilgi Satırı
  musteriBilgiSatiri: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  musteriAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  musteriAdi: { fontSize: 13, fontWeight: 'bold', color: '#1C1C1E' },
  
  // Ürün Bilgi Satırı
  urunBilgiSatiri: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', padding: 8, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  urunResim: { width: 40, height: 40, borderRadius: 6, backgroundColor: '#E5E5EA', marginRight: 10 },
  urunEtiket: { fontSize: 10, color: '#8E8E93', textTransform: 'uppercase', fontWeight: '600' },
  urunAdi: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  
  tarihYazi: { fontSize: 11, color: '#8E8E93' },
  durumRozet: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'center' },
  durumYazi: { fontSize: 11, fontWeight: 'bold' },
  
  soruKutusu: { paddingHorizontal: 4, marginBottom: 10 },
  soruBaslik: { fontSize: 12, fontWeight: 'bold', color: '#8E8E93', marginBottom: 2 },
  soruMetni: { fontSize: 14, color: '#1C1C1E', lineHeight: 20 },
  
  cevapKutusu: { backgroundColor: '#F0FDF4', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E8F5E9', marginTop: 5 },
  cevapBaslik: { fontSize: 12, fontWeight: 'bold', color: '#28A745', marginBottom: 4 },
  cevapMetni: { fontSize: 14, color: '#1C1C1E', lineHeight: 20 },
  
  cevaplaBtn: { flexDirection: 'row', backgroundColor: '#FF9F00', padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  cevaplaBtnYazi: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  
  modalArkaPlan: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalKutu: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalBaslik: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E' },
  modalSoruOzet: { backgroundColor: '#F8F9FA', padding: 15, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#FF9F00', marginBottom: 20 },
  modalSoruMetni: { fontSize: 14, color: '#48484A', fontStyle: 'italic', lineHeight: 20 },
  inputArea: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, padding: 15, height: 120, textAlignVertical: 'top', fontSize: 15, marginBottom: 20 },
  gonderBtn: { backgroundColor: '#FF9F00', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  gonderBtnYazi: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }
});