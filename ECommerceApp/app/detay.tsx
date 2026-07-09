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

  // Oylama Sitemi için Yeni State'ler
  const [oylamaModalGorunur, setOylamaModalGorunur] = useState(false);
  const [secilenPuan, setSecilenPuan] = useState<number>(0); 
  const [oyGonderiliyor, setOyGonderiliyor] = useState(false);

  useEffect(() => {
    // 1. Kullanıcının giriş yapıp yapmadığını kontrol et
    const girisKontrol = async () => {
      const token = await AsyncStorage.getItem('userToken');
      setGirisYapildiMi(!!token);
    };
    girisKontrol();

    // 2. API'den ürünü çek
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

  const favoriButonunaBasildi = async () => {
    if (!girisYapildiMi) {
      Alert.alert(
        "Giriş Gerekli",
        "Favorilere eklemek için giriş yapmalısınız.",
        [
          { text: "İptal", style: "cancel" },
          { text: "Giriş Yap", onPress: () => router.push('/(auth)/giris' as any) }
        ]
      );
      return; 
    } 

    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(
        `${API_CONFIG.BASE_URL}/favoriler`, 
        { urunId: Number(id) }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Başarılı", "Ürün favorilerinize eklendi! ❤️");
    } catch (error: any) {
      if (error.response && error.response.status === 400) {
        Alert.alert("Bilgi", "Bu ürün zaten favorilerinizde.");
      } else {
        Alert.alert("Hata", "Favorilere eklenirken bir sorun oluştu.");
      }
    }
  };

  const sepeteEkle = async () => {
    if (!girisYapildiMi) {
      Alert.alert("Giriş Gerekli", "Sepete eklemek için giriş yapmalısınız.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(
        `${API_CONFIG.BASE_URL}/sepet`,
        { urunId: Number(id), miktar: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Başarılı", "Ürün sepete eklendi!");
    } catch (error) {
      Alert.alert("Hata", "Sepete eklenirken bir sorun oluştu.");
    }
  };

  // Backend'deki "Sadece satın alanlar oylayabilir" endpoint'ine istek atan fonksiyon
  const oyGonder = async () => {
    if (secilenPuan === 0) {
      Alert.alert("Uyarı", "Lütfen göndermeden önce bir yıldız seçin.");
      return;
    }

    setOyGonderiliyor(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      await axios.post(
        `${API_CONFIG.BASE_URL}/urunler/${id}/oyla?puan=${secilenPuan}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Başarılı", "Değerlendirmeniz başarıyla iletildi! ⭐");
      setOylamaModalGorunur(false);
      setSecilenPuan(0); 
      
      // Oylama sonrası güncel puanı ekrana yansıtmak için ürünü tekrar çekiyoruz
      const guncelUrun = await axios.get(`${API_CONFIG.BASE_URL}/urunler/${id}`);
      setUrun(guncelUrun.data);

    } catch (error: any) {
      const hataMesaji = error.response?.data?.mesaj || "Değerlendirme kaydedilemedi.";
      Alert.alert("Değerlendirme Yapılamadı", hataMesaji);
    } finally {
      setOyGonderiliyor(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 100 }} />;
  if (!urun) return <Text style={{ textAlign: 'center', marginTop: 50 }}>Ürün bulunamadı.</Text>;

  return (
   <ScrollView style={styles.container}>
      <View>
        <Image source={{ uri: urun.resimUrl }} style={styles.buyukResim} />
        
        <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.kalpButon} onPress={favoriButonunaBasildi}>
          <Ionicons name="heart-outline" size={28} color="#ff4757" />
        </TouchableOpacity>
      </View>

      <View style={styles.detayBilgi}>
        <Text style={styles.kategori}>{urun.kategori?.ad || "Genel"}</Text>
        <Text style={styles.baslik}>{urun.ad}</Text>
        <Text style={styles.fiyat}>{urun.fiyat} TL</Text>
        
        {/* İŞTE DÜZELTİLEN DİNAMİK ALAN BURASI */}
        <TouchableOpacity 
          style={styles.degerlendirmeSatiri} 
          onPress={() => {
            if (!girisYapildiMi) {
              Alert.alert("Giriş Gerekli", "Ürünü oylamak için önce giriş yapmalısınız.");
              return;
            }
            setOylamaModalGorunur(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.yildizGrup}>
            <Ionicons name="star" size={18} color="#FFD700" />
            <Text style={styles.yildizPuanYazi}>
              {urun.ortalamaPuan ? urun.ortalamaPuan.toFixed(1) : "0.0"}
            </Text>
          </View>
          <Text style={styles.oyVerLinkYazi}>
            ({urun.oylamaSayisi || 0} Değerlendirme)
          </Text>
        </TouchableOpacity>

        <Text style={styles.aciklama}>{urun.aciklama}</Text>
        
        <TouchableOpacity 
          style={[styles.buton, !girisYapildiMi && styles.butonPasif]} 
          disabled={!girisYapildiMi}
          onPress={sepeteEkle} 
        >
          <Text style={styles.butonYazi}>Sepete Ekle</Text>
        </TouchableOpacity>
      </View>

      {/* DİNAMİK OYLAMA MODALI */}
      <Modal visible={oylamaModalGorunur} transparent={true} animationType="fade">
        <View style={styles.modalArkaPlan}>
          <View style={styles.modalKutu}>
            
            <TouchableOpacity style={styles.kapatIkonu} onPress={() => { setOylamaModalGorunur(false); setSecilenPuan(0); }}>
              <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>

            <Text style={styles.modalBaslik}>Ürünü Değerlendir</Text>
            <Text style={styles.modalAciklama}>Bu ürünü deneyimlediniz mi? Memnuniyetinizi yıldızlarla belirtin.</Text>

            {oyGonderiliyor ? (
              <ActivityIndicator size="large" color="#FFD700" style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.yildizSecici}>
                {[1, 2, 3, 4, 5].map((puan) => (
                  <TouchableOpacity key={puan} onPress={() => setSecilenPuan(puan)}>
                    <Ionicons 
                      name={puan <= secilenPuan ? "star" : "star-outline"} 
                      size={42} 
                      color="#FFD700" 
                      style={styles.secimYildizi} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.modalGonderButon} onPress={oyGonder} disabled={oyGonderiliyor}>
              <Text style={styles.modalGonderButonYazi}>Değerlendirmeyi Gönder</Text>
            </TouchableOpacity>
            
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  buyukResim: { width: '100%', height: 400 },
  detayBilgi: { padding: 20 },
  kategori: { color: '#888', textTransform: 'uppercase', marginBottom: 5 },
  baslik: { fontSize: 28, fontWeight: 'bold' },
  fiyat: { fontSize: 24, color: 'orange', fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  
  // Değerlendirme Satırı Stilleri
  degerlendirmeSatiri: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingVertical: 5 },
  yildizGrup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginRight: 10 },
  yildizPuanYazi: { fontSize: 14, fontWeight: 'bold', color: '#333', marginLeft: 5 },
  oyVerLinkYazi: { fontSize: 14, color: '#FFD700', fontWeight: '600', textDecorationLine: 'underline' },

  aciklama: { fontSize: 16, color: '#444', lineHeight: 24, marginBottom: 20 },
  buton: { backgroundColor: '#FFD700', padding: 20, borderRadius: 10, alignItems: 'center' },
  butonYazi: { fontWeight: 'bold', fontSize: 16 },
  geriButon: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 8,
    borderRadius: 20,
    zIndex: 10, 
  },
  kalpButon: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  butonPasif: { backgroundColor: '#ccc', opacity: 0.5 },

  // Oylama Modal Stilleri
  modalArkaPlan: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalKutu: { width: '85%', backgroundColor: '#fff', borderRadius: 24, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  kapatIkonu: { position: 'absolute', top: 15, right: 15, padding: 5 },
  modalBaslik: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 5 },
  modalAciklama: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  yildizSecici: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%', marginBottom: 25 },
  secimYildizi: { marginHorizontal: 6 },
  modalGonderButon: { backgroundColor: '#FFD700', width: '100%', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  modalGonderButonYazi: { color: '#000', fontSize: 16, fontWeight: 'bold' }
});