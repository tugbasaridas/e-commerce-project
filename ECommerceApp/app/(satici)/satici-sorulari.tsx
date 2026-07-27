import { API_CONFIG } from '@/config/api'; // API yolunu kendi projene göre ayarla
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SaticiSorulari() {
  const router = useRouter();
  const [sorular, setSorular] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Cevaplama Modalı State'leri
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
    if (cevapMetni.trim().length < 5) {
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
      sorulariGetir(); // Listeyi yenile ki soru "Cevaplandı" olarak yeşile dönsün

    } catch (error: any) {
      Alert.alert("Hata", error.response?.data?.mesaj || "Cevap gönderilemedi.");
    } finally {
      setGonderiliyor(false);
    }
  };

  const tarihFormatla = (tarihString: string) => {
    return new Date(tarihString).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const soruKartiCiz = ({ item }: { item: any }) => (
    <View style={styles.kart}>
      {/* Üst Kısım: Ürün Bilgisi */}
      <View style={styles.urunBilgiSatiri}>
        <Image source={{ uri: item.urunResmi || 'https://via.placeholder.com/50' }} style={styles.urunResim} />
        <View style={{ flex: 1 }}>
          <Text style={styles.urunAdi} numberOfLines={2}>{item.urunAdi}</Text>
          <Text style={styles.tarihYazi}>{tarihFormatla(item.soruTarihi)}</Text>
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
      <View style={styles.header}>
        <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Müşteri Soruları</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.merkez}><ActivityIndicator size="large" color="#4EA8DE" /></View>
      ) : (
        <FlatList
          data={sorular}
          keyExtractor={(item) => item.soruId.toString()}
          renderItem={soruKartiCiz}
          contentContainerStyle={styles.listeIci}
          ListEmptyComponent={
            <View style={styles.bosDurum}>
              <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
              <Text style={styles.bosDurumYazi}>Mağazanıza henüz bir soru sorulmamış.</Text>
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
                <Text style={styles.modalSoruMetni} numberOfLines={3}>"{seciliSoru.soruMetni}"</Text>
              </View>
            )}

            <TextInput
              style={styles.inputArea}
              placeholder="Müşteriye nazik ve açıklayıcı bir yanıt yazın..."
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  geriButon: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E' },
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listeIci: { padding: 15, paddingBottom: 30 },
  bosDurum: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  bosDurumYazi: { fontSize: 15, color: '#8E8E93', marginTop: 15 },
  
  kart: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  urunBilgiSatiri: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F2F2F7', paddingBottom: 12, marginBottom: 12 },
  urunResim: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#F2F2F7', marginRight: 10 },
  urunAdi: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', marginBottom: 4 },
  tarihYazi: { fontSize: 11, color: '#8E8E93' },
  durumRozet: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  durumYazi: { fontSize: 11, fontWeight: 'bold' },
  
  soruKutusu: { backgroundColor: '#F8F9FA', padding: 12, borderRadius: 10, marginBottom: 10 },
  soruBaslik: { fontSize: 12, fontWeight: 'bold', color: '#8E8E93', marginBottom: 4 },
  soruMetni: { fontSize: 14, color: '#1C1C1E', lineHeight: 20 },
  
  cevapKutusu: { backgroundColor: '#F0FDF4', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E8F5E9' },
  cevapBaslik: { fontSize: 12, fontWeight: 'bold', color: '#28A745', marginBottom: 4 },
  cevapMetni: { fontSize: 14, color: '#1C1C1E', lineHeight: 20 },
  
  cevaplaBtn: { flexDirection: 'row', backgroundColor: '#4EA8DE', padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  cevaplaBtnYazi: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  
  modalArkaPlan: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalKutu: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalBaslik: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E' },
  modalSoruOzet: { backgroundColor: '#F8F9FA', padding: 15, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#FF9F00', marginBottom: 20 },
  modalSoruMetni: { fontSize: 14, color: '#48484A', fontStyle: 'italic', lineHeight: 20 },
  inputArea: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, padding: 15, height: 120, textAlignVertical: 'top', fontSize: 15, marginBottom: 20 },
  gonderBtn: { backgroundColor: '#4EA8DE', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  gonderBtnYazi: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }
});