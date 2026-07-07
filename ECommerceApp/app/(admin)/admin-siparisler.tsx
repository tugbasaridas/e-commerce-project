import api, { API_CONFIG } from '@/config/api';
import { AdminSiparis } from '@/types/Siparis';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminSiparisler() {
  const router = useRouter();
  const [siparisler, setSiparisler] = useState<AdminSiparis[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      siparisleriGetir();
    }, [])
  );

  const siparisleriGetir = async () => {
    setLoading(true);
    try {

      const response = await api.get('/admin/siparisler'); 
      
      setSiparisler(response.data);
    } catch (error: any) {
      Alert.alert("Hata", "Siparişler yüklenemedi. Lütfen backend rotasını kontrol et.");
    } finally {
      setLoading(false);
    }
  };

  const durumGuncelle = (id: number, mevcutDurum: string) => {
    Alert.alert("Sipariş Durumu", "Yeni durumu seç:", [
      { text: "Hazırlanıyor", onPress: () => guncelleApi(id, "Hazırlanıyor") },
      { text: "Kargoya Verildi", onPress: () => guncelleApi(id, "Kargoya Verildi") },
      { text: "Tamamlandı", onPress: () => guncelleApi(id, "Tamamlandı") },
      { text: "İptal", style: "cancel" }
    ]);
  };

  const guncelleApi = async (id: number, yeniDurum: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(`${API_CONFIG.BASE_URL}/admin/siparisler/${id}/durum`, 
        { yeniDurum }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      siparisleriGetir(); 
    } catch (error) {
      Alert.alert("Hata", "Güncelleme başarısız.");
    }
  };

  if (loading) return <View style={styles.merkez}><ActivityIndicator size="large" color="orange" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} /></TouchableOpacity>
        <Text style={styles.baslik}>Sipariş Yönetimi</Text>
      </View>
      <FlatList
        data={siparisler}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.kart}>
            <Text style={styles.siparisNo}>Sipariş #{item.id}</Text>
            <Text>Durum: <Text style={{fontWeight:'bold'}}>{item.durum}</Text></Text>
            <Text>Tutar: {item.toplamTutar.toFixed(2)} TL</Text>
            <TouchableOpacity style={styles.btn} onPress={() => durumGuncelle(item.id, item.durum)}>
              <Text style={styles.btnYazi}>Durum Güncelle</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  baslik: { fontSize: 20, fontWeight: 'bold', marginLeft: 15 },
  kart: { backgroundColor: '#fff', padding: 15, margin: 15, borderRadius: 10, elevation: 2 },
  siparisNo: { fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  btn: { backgroundColor: '#333', padding: 10, borderRadius: 5, marginTop: 10, alignItems: 'center' },
  btnYazi: { color: '#fff' }
});