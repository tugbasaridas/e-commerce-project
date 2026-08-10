import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function IadeTaleplerim() {
  const router = useRouter();
  const [iadeler, setIadeler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    iadeleriGetir();
  }, []);

  const iadeleriGetir = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/Siparisler/iadelerim`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIadeler(response.data);
    } catch (error) {
      console.error("İadeler yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDurumStili = (durum: string) => {
    switch (durum) {
      case 'Bekliyor': return { bg: '#FFF3E0', text: '#FF9800', ikon: 'time-outline' };
      case 'Onaylandı': return { bg: '#E8F5E9', text: '#4CAF50', ikon: 'checkmark-circle-outline' };
      case 'Reddedildi': return { bg: '#FFEBEE', text: '#F44336', ikon: 'close-circle-outline' };
      case 'İade Edildi': return { bg: '#E3F2FD', text: '#2196F3', ikon: 'wallet-outline' };
      default: return { bg: '#F5F5F5', text: '#9E9E9E', ikon: 'help-circle-outline' };
    }
  };

  const renderIadeKart = ({ item }: { item: any }) => {
    const durumStil = getDurumStili(item.durum);
    return (
      <View style={styles.iadeKart}>
        <View style={styles.kartUst}>
          <Text style={styles.siparisNo}>Sipariş: #{item.siparisId}</Text>
          <View style={[styles.durumBadge, { backgroundColor: durumStil.bg }]}>
            <Ionicons name={durumStil.ikon as any} size={14} color={durumStil.text} />
            <Text style={[styles.durumYazi, { color: durumStil.text }]}>{item.durum}</Text>
          </View>
        </View>

        <View style={styles.kartOrta}>
          <Image source={{ uri: item.resimUrl }} style={styles.urunResim} />
          <View style={styles.urunBilgi}>
            <Text style={styles.urunAdi} numberOfLines={2}>{item.urunAdi}</Text>
            <Text style={styles.magazaAdi}>{item.magazaAdi}</Text>
            <Text style={styles.iadeTutari}>{item.iadeTutari.toFixed(2)} TL</Text>
          </View>
        </View>

        <View style={styles.kartAlt}>
          <Text style={styles.sebepBaslik}>İade Sebebi:</Text>
          <Text style={styles.sebepMetin}>{item.iadeSebebi}</Text>
          {item.redSebebi && (
            <Text style={styles.redSebebi}>Red Sebebi: {item.redSebebi}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    // 🌟 SafeAreaView edges eklenerek üst çentik ve saat alanı korumaya alındı
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerBaslik}>İade Taleplerim</Text>
        <View style={{width: 24}} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF9F00" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={iadeler}
          renderItem={renderIadeKart}
          keyExtractor={(item) => item.iadeId.toString()}
          contentContainerStyle={{ padding: 15 }}
          ListEmptyComponent={
            <View style={styles.bosKutu}>
              <Text style={styles.bosMetin}>Henüz bir iade talebiniz yok.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  // 🌟 Header kısmına güvenli bir alt çizgi ve ferahlık eklendi
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  geriButon: { padding: 4 },
  headerBaslik: { fontSize: 18, fontWeight: 'bold' },
  iadeKart: { backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  kartUst: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  siparisNo: { fontWeight: 'bold' },
  durumBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  durumYazi: { fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  kartOrta: { flexDirection: 'row', marginVertical: 10 },
  urunResim: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#f0f0f0' },
  urunBilgi: { marginLeft: 15, flex: 1 },
  urunAdi: { fontWeight: '600' },
  magazaAdi: { fontSize: 12, color: '#888' },
  iadeTutari: { fontWeight: 'bold', color: '#FF9F00', marginTop: 5 },
  kartAlt: { backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8 },
  sebepBaslik: { fontSize: 11, fontWeight: 'bold', color: '#666' },
  sebepMetin: { fontSize: 13 },
  redSebebi: { color: 'red', fontSize: 12, marginTop: 5 },
  bosKutu: { alignItems: 'center', marginTop: 100 },
  bosMetin: { color: '#888' }
});