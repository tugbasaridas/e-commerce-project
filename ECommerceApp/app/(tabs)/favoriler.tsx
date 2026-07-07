import { API_CONFIG } from '@/config/api';
import { FavoriUrun } from '@/types/Favori';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const width = Dimensions.get('window').width;
const cardWidth = width / 2 - 25; 


export default function Favoriler() {
  const router = useRouter();
  const [favoriler, setFavoriler] = useState<FavoriUrun[]>([]);
  const [loading, setLoading] = useState(true);

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
      Alert.alert("Hata", "Favori ürünleriniz yüklenemedi.");
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
      console.error("Favoriden çıkarma hatası:", error);
      Alert.alert("Hata", "Ürün favorilerden çıkarılamadı.");
    }
  };

  const urunKartiCiz = ({ item }: { item: FavoriUrun }) => (
    <TouchableOpacity 
      style={styles.kart} 
      activeOpacity={0.9}
      onPress={() => router.push(`/detay?id=${item.urunId}` as any)}
    >
      {/* KALP BUTONU (Kırmızı - Basılınca Favoriden Çıkarır) */}
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
        
        {/* Görseldeki Yıldız Tasarımı (Şimdilik sabit 0.0) */}
        <View style={styles.yildizSatiri}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.yildizYazisi}>0.0 (0)</Text>
        </View>
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
  yildizSatiri: { flexDirection: 'row', alignItems: 'center' },
  yildizYazisi: { fontSize: 12, color: '#777', marginLeft: 4 },
  bosDurum: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bosMetin: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 15 },
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});