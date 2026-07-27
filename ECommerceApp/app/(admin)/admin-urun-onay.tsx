import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import api from '../../config/api';

export default function AdminUrunOnay() {
  const router = useRouter();
  const [urunler, setUrunler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBekleyenUrunler();
  }, []);

  const fetchBekleyenUrunler = async () => {
    try {
      setLoading(true);
      // Hazır api instance'ımız Token'ı otomatik ekliyor!
      const response = await api.get('/Admin/urunler/bekleyen');
      setUrunler(response.data);
    } catch (error: any) {
      console.error("API Hatası:", error);
      Alert.alert("Hata", error.response?.data?.message || "Bekleyen ürünler getirilemedi.");
    } finally {
      setLoading(false);
    }
  };

  const urunOnayla = async (id: number) => {
    try {
      const response = await api.put(`/Admin/urun/${id}/onayla`);
      Alert.alert("Başarılı", response.data || "Ürün başarıyla vitrine eklendi.");
      setUrunler(prev => prev.filter(u => u.id !== id)); 
    } catch (error: any) {
      Alert.alert("Hata", error.response?.data || "Ürün onaylanamadı.");
    }
  };

  const urunReddet = (id: number) => {
    Alert.alert(
      "Ürünü Reddet",
      "Bu ürünü reddetmek ve sistemden silmek istediğinize emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Evet, Reddet", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/Admin/urun/${id}/reddet`);
              setUrunler(prev => prev.filter(u => u.id !== id)); 
            } catch (error: any) {
              Alert.alert("Hata", error.response?.data || "Ürün reddedilemedi.");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.imagePlaceholder}>
          {item.resimUrl ? (
            <Image source={{ uri: item.resimUrl }} style={styles.image} />
          ) : (
            <Ionicons name="image-outline" size={32} color="#D1D1D6" />
          )}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.ad}</Text>
          <Text style={styles.storeName}>🏪 Mağaza: {item.magazaAdi}</Text>
          <Text style={styles.price}>{item.fiyat} ₺</Text>
          <Text style={styles.stock}>📦 Stok: {item.stok} adet</Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.rejectButton} onPress={() => urunReddet(item.id)}>
          <Ionicons name="close-circle-outline" size={20} color="#EF233C" />
          <Text style={styles.rejectButtonText}>Reddet</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.approveButton} onPress={() => urunOnayla(item.id)}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.approveButtonText}>Vitrine Ekle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Onay Bekleyen Ürünler</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00BCD4" />
          <Text style={styles.loadingText}>Ürünler yükleniyor...</Text>
        </View>
      ) : urunler.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="checkmark-done-circle-outline" size={60} color="#D1D1D6" />
          <Text style={styles.emptyText}>Harika! Onay bekleyen ürün kalmadı.</Text>
        </View>
      ) : (
        <FlatList
          data={urunler}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  geriButon: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, color: '#8E8E93' },
  emptyText: { marginTop: 16, fontSize: 16, color: '#8E8E93', textAlign: 'center' },
  listContainer: { padding: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E5EA', shadowColor: '#1C1C1E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', marginBottom: 16 },
  imagePlaceholder: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  cardInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  productName: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginBottom: 4 },
  storeName: { fontSize: 13, color: '#3F51B5', marginBottom: 4, fontWeight: '500' },
  price: { fontSize: 15, fontWeight: 'bold', color: '#00BCD4', marginBottom: 4 },
  stock: { fontSize: 13, color: '#8E8E93' },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  rejectButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: '#FFEBEA', marginRight: 8 },
  rejectButtonText: { color: '#EF233C', fontWeight: '600', marginLeft: 6 },
  approveButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: '#00BCD4', marginLeft: 8 },
  approveButtonText: { color: '#FFFFFF', fontWeight: '600', marginLeft: 6 }
});