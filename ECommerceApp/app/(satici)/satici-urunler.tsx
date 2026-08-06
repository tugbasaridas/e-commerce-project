import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SaticiUrunler() {
  const router = useRouter();
  const [urunler, setUrunler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');

  useFocusEffect(
    useCallback(() => {
      urunleriGetir();
    }, [])
  );

  const urunleriGetir = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.get(`${API_CONFIG.BASE_URL}/satici/urunlerim`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Ürün Yönetimi sayfasında TÜM ürünler görünmeli (Onay bekleyenler dahil)
      setUrunler(response.data);
      
    } catch (error) {
      console.log("Ürünler getirilemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const urunSil = (id: number, ad: string) => {
    Alert.alert("Ürünü Sil", `"${ad}" adlı ürünü mağazanızdan kalıcı olarak silmek istiyor musunuz?`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Evet, Sil",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.delete(`${API_CONFIG.BASE_URL}/satici/urun/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setUrunler(prev => prev.filter(urun => urun.id !== id));
            Alert.alert("Başarılı", "Ürün başarıyla silindi.");
          } catch (error) {
            Alert.alert("Hata", "Ürün silinirken bir sorun oluştu.");
          }
        }
      }
    ]);
  };

  const filtrelenmisUrunler = urunler.filter(urun => 
    urun.ad.toLowerCase().includes(aramaMetni.toLowerCase())
  );

  const renderUrun = ({ item }: { item: any }) => (
    <View style={styles.urunKart}>
      <Image 
        source={{ uri: item.resimUrl || 'https://via.placeholder.com/150?text=Resim+Yok' }} 
        style={styles.urunResim} 
        resizeMode="cover"
      />
      <View style={styles.urunBilgi}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={styles.urunAd} numberOfLines={2}>{item.ad}</Text>
        </View>
        
        {/* YAYINDA / ONAY BEKLİYOR ROZETİ */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          {item.adminOnayliMi ? (
            <View style={[styles.durumRozet, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="checkmark-circle" size={12} color="#2E7D32" />
              <Text style={[styles.durumRozetYazi, { color: '#2E7D32' }]}>Yayında</Text>
            </View>
          ) : (
            <View style={[styles.durumRozet, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="time" size={12} color="#EF6C00" />
              <Text style={[styles.durumRozetYazi, { color: '#EF6C00' }]}>Onay Bekliyor</Text>
            </View>
          )}
        </View>

        <Text style={styles.urunKategori}>{item.kategori?.ad || 'Kategori Belirtilmemiş'}</Text>
        
        <View style={styles.altBilgiSatiri}>
          <Text style={styles.urunFiyat}>{item.fiyat} ₺</Text>
          <View style={[styles.stokKutusu, item.stok === 0 ? styles.stokBitti : null]}>
            <Text style={[styles.urunStok, item.stok === 0 ? styles.stokBittiYazi : null]}>
              {item.stok === 0 ? 'Tükendi' : `Stok: ${item.stok}`}
            </Text>
          </View>
        </View>
      </View>

      {/* SADECE DÜZENLE VE SİL BUTONLARI (Görseldeki gibi alt alta) */}
      <View style={styles.butonKutusu}>
        <TouchableOpacity 
          style={[styles.aksiyonButon, { backgroundColor: '#F0F4FF', marginBottom: 8 }]}
          onPress={() => router.push({
            pathname: '/(satici)/satici-urun-duzenle',
            params: { 
              id: String(item.id),
              ad: item.ad, 
              aciklama: item.aciklama || '', 
              fiyat: String(item.fiyat), 
              stok: String(item.stok),
              kategoriId: String(item.kategoriId),
              resimUrl: item.resimUrl || ''
            }
          } as any)}
        >
          <Ionicons name="pencil" size={18} color="#007AFF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.aksiyonButon, { backgroundColor: '#FFF0F0' }]}
          onPress={() => urunSil(item.id, item.ad)}
        >
          <Ionicons name="trash" size={18} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.geriButon} onPress={() => router.replace('/(satici)/satici-anasayfa' as any)}>
          <Ionicons name="arrow-back" size={26} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ürün Yönetimi</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.listeKonteyner}>
        {/* Arama Çubuğu */}
        <View style={styles.aramaKutusu}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.aramaInput}
            placeholder="Ürün adı ile ara..."
            placeholderTextColor="#8E8E93"
            value={aramaMetni}
            onChangeText={setAramaMetni}
            autoCorrect={false}
          />
          {aramaMetni.length > 0 && (
            <TouchableOpacity onPress={() => setAramaMetni('')}>
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.listeBaslikKutusu}>
          <Text style={styles.listeBaslik}>Tüm Ürünleriniz ({filtrelenmisUrunler.length})</Text>
          <TouchableOpacity style={styles.ekleButon} onPress={() => router.push('/(satici)/satici-urun-ekle' as any)}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.ekleYazi}>Yeni Ekle</Text>
          </TouchableOpacity>
        </View>
        
        {loading ? <ActivityIndicator size="large" color="#FF9F00" style={{ marginTop: 50 }} /> : 
         filtrelenmisUrunler.length === 0 ? (
          <View style={styles.bosDurum}>
            <Ionicons name="cube-outline" size={60} color="#D1D1D6" />
            <Text style={styles.bosYazi}>{aramaMetni ? 'Aradığınız kriterde ürün bulunamadı.' : 'Mağazanızda henüz ürün bulunmuyor.'}</Text>
          </View>
        ) : (
          <FlatList
            data={filtrelenmisUrunler}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderUrun}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15, backgroundColor: '#fff' },
  geriButon: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  
  listeKonteyner: { flex: 1, backgroundColor: '#F8F9FA', paddingHorizontal: 20, paddingTop: 20 },
  
  aramaKutusu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, height: 46, marginBottom: 20, borderWidth: 1, borderColor: '#E5E5EA' },
  aramaInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#1C1C1E' },

  listeBaslikKutusu: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  listeBaslik: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },
  ekleButon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF9F00', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  ekleYazi: { color: '#fff', fontWeight: 'bold', marginLeft: 4, fontSize: 14 },
  
  urunKart: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E5EA', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  urunResim: { width: 75, height: 75, borderRadius: 10, backgroundColor: '#F2F2F7', marginRight: 12 },
  urunBilgi: { flex: 1, paddingRight: 10 },
  urunAd: { fontSize: 14, fontWeight: '700', color: '#1C1C1E', flex: 1 },
  
  durumRozet: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start', gap: 4 },
  durumRozetYazi: { fontSize: 10, fontWeight: '800' },

  urunKategori: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  altBilgiSatiri: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  urunFiyat: { fontSize: 16, color: '#FF9F00', fontWeight: 'bold' },
  
  stokKutusu: { backgroundColor: '#F2F2F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 10 },
  stokBitti: { backgroundColor: '#FFF0F0' },
  urunStok: { fontSize: 12, color: '#1C1C1E', fontWeight: '500' },
  stokBittiYazi: { color: '#FF3B30', fontWeight: '700' },
  
  butonKutusu: { justifyContent: 'space-between', paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: '#F2F2F7' },
  aksiyonButon: { padding: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  
  bosDurum: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  bosYazi: { color: '#8E8E93', fontSize: 15, marginTop: 12, fontWeight: '500', textAlign: 'center' }
});