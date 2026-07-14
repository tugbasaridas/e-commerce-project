import { API_CONFIG } from '@/config/api';
import { Urun } from '@/types/Urun';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Detay() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();
  const [urun, setUrun] = useState<Urun | null>(null);
  const [loading, setLoading] = useState(true);
  const [girisYapildiMi, setGirisYapildiMi] = useState(false);
  
  // Miktar ve Bildirimler
  const [miktar, setMiktar] = useState(1);
  const [toastGorunur, setToastGorunur] = useState(false);
  const [toastMesaj, setToastMesaj] = useState('');

  // Oylama Sistemi State'leri
  const [oylamaModalGorunur, setOylamaModalGorunur] = useState(false);
  const [secilenPuan, setSecilenPuan] = useState<number>(0); 
  const [oyGonderiliyor, setOyGonderiliyor] = useState(false);

  useEffect(() => {
    const girisKontrol = async () => {
      const token = await AsyncStorage.getItem('userToken');
      setGirisYapildiMi(!!token);
    };
    girisKontrol();

    axios.get(`${API_CONFIG.BASE_URL}/urunler/${id}`)
      .then((res) => {
        setUrun(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Detay yüklenemedi:", err);
        setLoading(false);
      });
  }, [id]);

  const basariliMesajGoster = (mesaj: string) => {
    setToastMesaj(mesaj);
    setToastGorunur(true);
    setTimeout(() => setToastGorunur(false), 3000);
  };

  const miktarArtir = () => setMiktar(prev => prev + 1);
  const miktarAzalt = () => setMiktar(prev => (prev > 1 ? prev - 1 : 1));

  const favoriButonunaBasildi = async () => {
    if (!girisYapildiMi) {
      Alert.alert("Giriş Gerekli", "Favorilere eklemek için giriş yapmalısınız.");
      return; 
    } 
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(`${API_CONFIG.BASE_URL}/favoriler`, { urunId: Number(id) }, { headers: { Authorization: `Bearer ${token}` } });
      basariliMesajGoster("Favorilere eklendi! ❤️");
    } catch (error: any) {
      error.response?.status === 400 ? basariliMesajGoster("Zaten favorilerinizde.") : Alert.alert("Hata", "Bir sorun oluştu.");
    }
  };

  const sepeteEkle = async () => {
    if (!girisYapildiMi) {
      Alert.alert("Giriş Gerekli", "Sepete eklemek için giriş yapmalısınız.");
      return;
    }
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(`${API_CONFIG.BASE_URL}/sepet`, { urunId: Number(id), miktar: miktar }, { headers: { Authorization: `Bearer ${token}` } });
      basariliMesajGoster(`${miktar} adet sepete eklendi!`);
      router.push('/(tabs)/sepet');
    } catch (error) {
      Alert.alert("Hata", "Sepete eklenirken bir sorun oluştu.");
    }
  };

  // OYLAMA İŞLEMİ BURADA ÇALIŞIR
  const oyGonder = async () => {
    if (secilenPuan === 0) {
      Alert.alert("Uyarı", "Lütfen bir puan seçin.");
      return;
    }
    setOyGonderiliyor(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      await axios.post(`${API_CONFIG.BASE_URL}/urunler/${id}/oyla?puan=${secilenPuan}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      
      Alert.alert("Başarılı", "Teşekkürler!");
      setOylamaModalGorunur(false);
      setSecilenPuan(0);
      
      // Güncel puanı göstermek için ürünü tekrar çek
      const guncelUrun = await axios.get(`${API_CONFIG.BASE_URL}/urunler/${id}`);
      setUrun(guncelUrun.data);
    } catch (error: any) {
      Alert.alert("Hata", error.response?.data?.mesaj || "Oylama kaydedilemedi.");
    } finally {
      setOyGonderiliyor(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 100 }} />;
  if (!urun) return <Text style={{ textAlign: 'center', marginTop: 50 }}>Ürün bulunamadı.</Text>;

  return (
    <ScrollView style={styles.container}>
      {toastGorunur && <View style={styles.toastKutusu}><Text style={styles.toastYazi}>{toastMesaj}</Text></View>}

      <View>
        <Image source={{ uri: urun.resimUrl }} style={styles.buyukResim} />
        <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}><Ionicons name="arrow-back" size={28} color="#000" /></TouchableOpacity>
        <TouchableOpacity style={styles.kalpButon} onPress={favoriButonunaBasildi}><Ionicons name="heart-outline" size={28} color="#ff4757" /></TouchableOpacity>
      </View>

      <View style={styles.detayBilgi}>
        <Text style={styles.kategori}>{urun.kategori?.ad || "Genel"}</Text>
        <Text style={styles.baslik}>{urun.ad}</Text>
        <Text style={styles.fiyat}>{urun.fiyat.toFixed(2)} TL</Text>
        
        <TouchableOpacity style={styles.degerlendirmeSatiri} onPress={() => girisYapildiMi ? setOylamaModalGorunur(true) : Alert.alert("Giriş Gerekli", "Puanlamak için giriş yapın.")}>
          <View style={styles.yildizGrup}><Ionicons name="star" size={18} color="#FFD700" /><Text style={styles.yildizPuanYazi}>{urun.ortalamaPuan?.toFixed(1) || "0.0"}</Text></View>
          <Text style={styles.oyVerLinkYazi}>({urun.oylamaSayisi || 0} Değerlendirme)</Text>
        </TouchableOpacity>

        <Text style={styles.aciklama}>{urun.aciklama}</Text>

        {girisYapildiMi && (
          <View style={styles.miktarAlani}>
            <TouchableOpacity style={styles.miktarBtn} onPress={miktarAzalt}><Ionicons name="remove" size={20} /></TouchableOpacity>
            <Text style={styles.miktarText}>{miktar}</Text>
            <TouchableOpacity style={styles.miktarBtn} onPress={miktarArtir}><Ionicons name="add" size={20} /></TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={[styles.buton, !girisYapildiMi && styles.butonPasif]} onPress={sepeteEkle}><Text style={styles.butonYazi}>Sepete Ekle</Text></TouchableOpacity>
      </View>

      {/* OYLAMA MODALI BURADA */}
      <Modal visible={oylamaModalGorunur} transparent={true} animationType="fade">
        <View style={styles.modalArkaPlan}>
          <View style={styles.modalKutu}>
            <Text style={styles.modalBaslik}>Ürünü Puanla</Text>
            <View style={styles.yildizSecici}>
              {[1, 2, 3, 4, 5].map((p) => (
                <TouchableOpacity key={p} onPress={() => setSecilenPuan(p)}>
                  <Ionicons name={p <= secilenPuan ? "star" : "star-outline"} size={40} color="#FFD700" />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.modalGonderButon} onPress={oyGonder} disabled={oyGonderiliyor}>
              {oyGonderiliyor ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalGonderButonYazi}>Gönder</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setOylamaModalGorunur(false)} style={{marginTop:15}}><Text>İptal</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  toastKutusu: { position: 'absolute', top: 50, left: 20, right: 20, backgroundColor: '#28A745', padding: 15, borderRadius: 10, zIndex: 999, alignItems: 'center' },
  toastYazi: { color: '#fff', fontWeight: 'bold' },
  buyukResim: { width: '100%', height: 400 },
  detayBilgi: { padding: 20 },
  kategori: { color: '#888', textTransform: 'uppercase', marginBottom: 5 },
  baslik: { fontSize: 28, fontWeight: 'bold' },
  fiyat: { fontSize: 24, color: 'orange', fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  degerlendirmeSatiri: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingVertical: 5 },
  yildizGrup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginRight: 10 },
  yildizPuanYazi: { fontSize: 14, fontWeight: 'bold', color: '#333', marginLeft: 5 },
  oyVerLinkYazi: { fontSize: 14, color: '#FFD700', fontWeight: '600', textDecorationLine: 'underline' },
  aciklama: { fontSize: 16, color: '#444', lineHeight: 24, marginBottom: 20 },
  miktarAlani: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, justifyContent: 'center' },
  miktarBtn: { padding: 15, backgroundColor: '#f0f0f0', borderRadius: 10 },
  miktarText: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 25 },
  buton: { backgroundColor: '#FFD700', padding: 20, borderRadius: 10, alignItems: 'center' },
  butonYazi: { fontWeight: 'bold', fontSize: 16 },
  geriButon: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(255,255,255,0.8)', padding: 8, borderRadius: 20 },
  kalpButon: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(255,255,255,0.8)', padding: 8, borderRadius: 20 },
  butonPasif: { backgroundColor: '#ccc', opacity: 0.5 },
  modalArkaPlan: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalKutu: { width: '85%', backgroundColor: '#fff', borderRadius: 24, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  kapatIkonu: { position: 'absolute', top: 15, right: 15, padding: 5 },
  modalBaslik: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 5 },
  yildizSecici: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', marginBottom: 25 },
  secimYildizi: { marginHorizontal: 6 },
  modalGonderButon: { backgroundColor: '#FFD700', width: '100%', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  modalGonderButonYazi: { color: '#000', fontSize: 16, fontWeight: 'bold' }
});