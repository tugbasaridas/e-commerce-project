import { API_CONFIG } from '@/config/api';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BenzerUrunler({ urunId, kategoriId }: { urunId: number, kategoriId: number }) {
  const router = useRouter();
  const [benzerUrunler, setBenzerUrunler] = useState<any[]>([]);

  useEffect(() => {
    if (urunId && kategoriId) {
      axios.get(`${API_CONFIG.BASE_URL}/urun/${urunId}/benzer/${kategoriId}`)
        .then(res => setBenzerUrunler(res.data))
        .catch(err => console.log("Benzer ürünler çekilemedi", err));
    }
  }, [urunId, kategoriId]);

 if (benzerUrunler.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.baslik}>Bunlar da İlginizi Çekebilir</Text>
        <Text style={{ color: '#888', fontStyle: 'italic', marginTop: 10 }}>
          Şu an bu kategoride test edebileceğiniz başka bir ürün yok. Backend çalışıyor!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.baslik}>Bunlar da İlginizi Çekebilir</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={benzerUrunler}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.kart} 
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/detay', params: { id: String(item.id) } } as any)}
          >
            <Image source={{ uri: item.resimUrl }} style={styles.resim} />
            <Text style={styles.urunAd} numberOfLines={2}>{item.ad}</Text>
            <Text style={styles.fiyat}>{item.fiyat.toFixed(2)} TL</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 25, paddingHorizontal: 20, marginBottom: 10 },
  baslik: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 15 },
  kart: { width: 140, marginRight: 15, backgroundColor: '#FFF', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  resim: { width: '100%', height: 120, borderRadius: 8, marginBottom: 10, backgroundColor: '#F2F2F7' },
  urunAd: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6, height: 36 },
  fiyat: { fontSize: 14, fontWeight: 'bold', color: '#FF9F00' }
});