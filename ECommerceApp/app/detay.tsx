import { API_CONFIG } from '@/config/api';
import { Urun } from '@/types/Urun';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Detay() {
  const { id } = useLocalSearchParams(); 
  const router = useRouter();
  const [urun, setUrun] = useState<Urun | null>(null);
  const [loading, setLoading] = useState(true);
  const [girisYapildiMi, setGirisYapildiMi] = useState(false);

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
      // 1. Hafızadan token'ı al
      const token = await AsyncStorage.getItem('userToken');
      
      // 2. Backend'e POST isteği at (Header'da token, Body'de urunId gönderiyoruz)
      await axios.post(
        `${API_CONFIG.BASE_URL}/favoriler`, 
        { urunId: Number(id) }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 3. Başarılı olursa kullanıcıya bildir
      Alert.alert("Başarılı", "Ürün favorilerinize eklendi! ❤️");

    } catch (error: any) {
      // 4. Eğer backend "Bu ürün zaten var" (400) hatası fırlatırsa onu yakala
      if (error.response && error.response.status === 400) {
        Alert.alert("Bilgi", "Bu ürün zaten favorilerinizde.");
      } else {
        console.error("Favori ekleme hatası:", error);
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
      console.error("Sepet hata:", error);
      Alert.alert("Hata", "Sepete eklenirken bir sorun oluştu.");
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
        <Text style={styles.aciklama}>{urun.aciklama}</Text>
        
        <TouchableOpacity 
          style={[styles.buton, !girisYapildiMi && styles.butonPasif]} 
          disabled={!girisYapildiMi}
          onPress={sepeteEkle} 
        >
        <Text style={styles.butonYazi}>Sepete Ekle</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  buyukResim: { width: '100%', height: 400 },
  detayBilgi: { padding: 20 },
  kategori: { color: '#888', textTransform: 'uppercase', marginBottom: 5 },
  baslik: { fontSize: 28, fontWeight: 'bold' },
  fiyat: { fontSize: 24, color: 'orange', fontWeight: 'bold', marginVertical: 10 },
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
});