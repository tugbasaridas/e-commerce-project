import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, FlatList,
  Image, Modal, StyleSheet, Text,
  TouchableOpacity, View
} from 'react-native';

const width = Dimensions.get('window').width;
const cardWidth = width / 2 - 25; 

export default function Favoriler() {
  const router = useRouter();
  const [favoriler, setFavoriler] = useState<any[]>([]); // Any kullandık ki ortalamaPuan hatası vermesin
  const [loading, setLoading] = useState(true);

  // Oylama Modal State'leri
  const [oylamaModalGorunur, setOylamaModalGorunur] = useState(false);
  const [oylanacakUrunId, setOylanacakUrunId] = useState<number | null>(null);
  const [secilenPuan, setSecilenPuan] = useState<number>(0);
  const [oyGonderiliyor, setOyGonderiliyor] = useState(false);

  // Sayfa her görüntülendiğinde backend'den güncel favorileri çeker
  useFocusEffect(
    useCallback(() => {
      favorileriGetir();
    }, [])
  );

  const favorileriGetir = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.get(`${API_CONFIG.BASE_URL}/favoriler`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFavoriler(response.data);
    } catch (error) {
      console.error("Favoriler getirilirken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  // Kalp butonuna basılınca ürünü favorilerden siler
  const favoridenCikar = async (urunId: number) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      await axios.delete(`${API_CONFIG.BASE_URL}/favoriler/${urunId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Silme işlemi başarılıysa arayüzdeki listeden de anlık olarak kaldır
      setFavoriler(prev => prev.filter(item => item.urunId !== urunId));
    } catch (error) {
      Alert.alert("Hata", "Ürün favorilerden çıkarılamadı.");
    }
  };

  // 1. ADIM: Yıldız ikonuna basıldığında Modalı açar
  const oylamaPenceresiniAc = (urunId: number) => {
    setOylanacakUrunId(urunId);
    setOylamaModalGorunur(true);
    setSecilenPuan(0);
  };

  // 2. ADIM: Seçilen puanı backend'e gönderir
  const oyGonder = async () => {
    if (secilenPuan === 0) {
      Alert.alert("Uyarı", "Lütfen göndermeden önce bir yıldız seçin.");
      return;
    }
    if (!oylanacakUrunId) return;

    setOyGonderiliyor(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      await axios.post(
        `${API_CONFIG.BASE_URL}/urunler/${oylanacakUrunId}/oyla?puan=${secilenPuan}`,
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Teşekkürler!", "Değerlendirmeniz başarıyla kaydedildi.");
      setOylamaModalGorunur(false);
      setSecilenPuan(0);
      
      // Oylama başarılı olunca puanların güncellenmesi için listeyi yenile
      favorileriGetir();
      
    } catch (error: any) {
      const hataMesaji = error.response?.data?.mesaj || "Değerlendirme kaydedilemedi.";
      Alert.alert("Uyarı", hataMesaji);
    } finally {
      setOyGonderiliyor(false);
    }
  };

  const urunKartiCiz = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.kart} 
      activeOpacity={0.9}
      onPress={() => router.push(`/detay?id=${item.urunId}` as any)}
    >
      {/* KALP BUTONU */}
      <TouchableOpacity style={styles.kalpButon} onPress={() => favoridenCikar(item.urunId)}>
        <Ionicons name="heart" size={20} color="#ff4757" />
      </TouchableOpacity>

      {/* ÜRÜN RESMİ */}
      <Image source={{ uri: item.resimUrl }} style={styles.resim} resizeMode="contain" />

      {/* ALT BİLGİ ALANI */}
      <View style={styles.bilgiAlani}>
        <Text style={styles.urunAdi} numberOfLines={1}>{item.ad}</Text>
        
        <View style={styles.fiyatSatiri}>
          <Text style={styles.guncelFiyat}>{item.fiyat.toFixed(2)} TL</Text>
        </View>
        
        {/* TIKLANABİLİR YILDIZ SATIRI (DİNAMİK) */}
        <TouchableOpacity 
          style={styles.yildizSatiri} 
          onPress={() => oylamaPenceresiniAc(item.urunId)}
          activeOpacity={0.6}
        >
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.yildizYazisi}>
            {item.ortalamaPuan ? item.ortalamaPuan.toFixed(1) : "0.0"} ({item.oylamaSayisi || 0})
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.merkez}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sayfaBaslik}>Favoriler </Text>
      
      {favoriler.length === 0 ? (
        <View style={styles.bosDurum}>
          <Ionicons name="heart-dislike-outline" size={80} color="#ccc" />
          <Text style={styles.bosMetin}>Henüz hiçbir ürünü favorilerinize eklemediniz.</Text>
        </View>
      ) : (
        <FlatList
          data={favoriler}
          renderItem={urunKartiCiz}
          keyExtractor={(item) => item.favoriId.toString()}
          numColumns={2} 
          columnWrapperStyle={styles.listeSutunYapisi}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* OYLAMA MODALI (DİNAMİK) */}
      <Modal visible={oylamaModalGorunur} transparent={true} animationType="fade">
        <View style={styles.modalArkaPlan}>
          <View style={styles.modalKutu}>
            
            <TouchableOpacity style={styles.kapatIkonu} onPress={() => { setOylamaModalGorunur(false); setSecilenPuan(0); }}>
              <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>

            <Text style={styles.modalBaslik}>Ürünü Değerlendir</Text>
            <Text style={styles.modalAciklama}>Bu ürüne kaç yıldız vermek istersiniz?</Text>

            {oyGonderiliyor ? (
              <ActivityIndicator size="large" color="#FFD700" style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.yildizSecici}>
                {[1, 2, 3, 4, 5].map((puan) => (
                  <TouchableOpacity key={puan} onPress={() => setSecilenPuan(puan)}>
                    <Ionicons 
                      name={puan <= secilenPuan ? "star" : "star-outline"} 
                      size={40} 
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

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 60 },
  sayfaBaslik: { fontSize: 26, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  listeSutunYapisi: { justifyContent: 'space-between' },
  kart: { 
    width: cardWidth, 
    backgroundColor: '#fff', 
    borderRadius: 15, 
    marginBottom: 20, 
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3, 
  },
  kalpButon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 5,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  resim: { width: '100%', height: 120, borderRadius: 10, marginTop: 15 },
  bilgiAlani: { marginTop: 10 },
  urunAdi: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 5 },
  fiyatSatiri: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  guncelFiyat: { fontSize: 16, fontWeight: 'bold', color: '#ff6b6b' },
  
  yildizSatiri: { 
    flexDirection: 'row', 
    alignItems: 'center',
    paddingVertical: 5,
  },
  yildizYazisi: { fontSize: 12, color: '#777', marginLeft: 4 },
  
  bosDurum: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bosMetin: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 15 },
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Oylama Modal Stilleri
  modalArkaPlan: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalKutu: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  kapatIkonu: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
  },
  modalBaslik: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginTop: 5,
  },
  modalAciklama: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  yildizSecici: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  secimYildizi: {
    marginHorizontal: 5,
  },
  modalGonderButon: { 
    backgroundColor: '#FFD700', 
    width: '100%', 
    paddingVertical: 15, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  modalGonderButonYazi: { 
    color: '#000', 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});