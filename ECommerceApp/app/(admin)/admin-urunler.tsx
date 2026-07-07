import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import api from '../../config/api';

interface Urun {
  id: number;
  ad: string;
  fiyat: number;
  resimUrl: string;
  kategori: { ad: string } | null;
}

export default function AdminUrunler() {
  const router = useRouter();
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [loading, setLoading] = useState(true);

 useFocusEffect(
    useCallback(() => {
      urunleriGetir();
    }, [])
  );

  const urunleriGetir = async () => {
    try {
      const response = await api.get('/urunler');
      setUrunler(response.data);
    } catch (error) {
      console.error("Ürünler çekilirken hata:", error);
      Alert.alert("Hata", "Ürünler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const urunSil = async (id: number, ad: string) => {
    Alert.alert(
      "Ürünü Sil",
      `"${ad}" adlı ürünü silmek istediğinize emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/urunler/${id}`);
              setUrunler(prev => prev.filter(urun => urun.id !== id));
            } catch (error) {
              Alert.alert("Hata", "Ürün silinirken bir sorun oluştu.");
            }
          }
        }
      ]
    );
  };

  const renderUrun = ({ item }: { item: Urun }) => (
    <View style={styles.urunKart}>
      <Image 
        source={{ uri: item.resimUrl || 'https://via.placeholder.com/150' }} 
        style={styles.urunResim} 
      />
      <View style={styles.urunBilgi}>
        <Text style={styles.urunKategori}>{item.kategori?.ad || 'Kategorisiz'}</Text>
        <Text style={styles.urunAd} numberOfLines={1}>{item.ad}</Text>
        <Text style={styles.urunFiyat}>{item.fiyat.toFixed(2)} TL</Text>
      </View>
      
      <View style={styles.aksiyonButonlari}>
        <TouchableOpacity 
          style={styles.ikonButon} 
          onPress={() => {
            router.push({
              pathname: '/admin-urun-guncelle',
              params: { id: item.id }
            });
          }}
        >
          <Ionicons name="create-outline" size={22} color="#4EA8DE" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.ikonButon} onPress={() => urunSil(item.id, item.ad)}>
          <Ionicons name="trash-outline" size={22} color="#EF233C" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
   <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.geriButon} 
          onPress={() => router.replace('/admin' as any)}
        >
          <Ionicons name="arrow-back" size={26} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ürün Yönetimi</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9F00" />
        </View>
      ) : (
        <FlatList
          data={urunler}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUrun}
          contentContainerStyle={styles.listeKapsayici}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.bosListeMetni}>Henüz hiç ürün eklenmemiş.</Text>
          }
        />
      )}

      <TouchableOpacity style={styles.ekleButon}onPress={() => router.push('/admin-urun-ekle')}>
        <Ionicons name="add" size={24} color="#FFF" />
        <Text style={styles.ekleButonYazi}>Yeni Ürün Ekle</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  geriButon: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listeKapsayici: {
    padding: 20,
    paddingBottom: 100,
  },
  urunKart: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  urunResim: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  urunBilgi: {
    flex: 1,
    marginLeft: 15,
  },
  urunKategori: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  urunAd: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  urunFiyat: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF9F00',
  },
  aksiyonButonlari: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ikonButon: {
    padding: 8,
    marginLeft: 5,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  ekleButon: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#FF9F00',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: '#FF9F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  ekleButonYazi: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bosListeMetni: {
    textAlign: 'center',
    color: '#8E8E93',
    marginTop: 50,
    fontSize: 15,
  }
});