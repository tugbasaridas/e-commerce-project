import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SiparisDurumModal from '../../components/SiparisDurumModal';
import SiparisKart from '../../components/SiparisKart';

export default function SaticiSiparisler() {
  const router = useRouter();
  const [siparisler, setSiparisler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalGorunur, setModalGorunur] = useState(false);
  const [seciliSiparis, setSeciliSiparis] = useState<any | null>(null);
  const [seciliUrun, setSeciliUrun] = useState<any | null>(null);

  useFocusEffect(
    useCallback(() => {
      siparisleriGetir();
    }, [])
  );

  const siparisleriGetir = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/satici/siparislerim`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSiparisler(response.data);
    } catch (error) {
      console.error("Siparişler çekilemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const durumSec = async (yeniDurum: string, kargoFirma?: string, kargoTakipNo?: string) => {
    if (!seciliUrun) return;
    
    if (yeniDurum === 'Kargoya Verildi' && (!kargoFirma || !kargoTakipNo)) {
        Alert.alert("Uyarı", "Lütfen kargo firması ve takip numarasını doldurun.");
        return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      
      await axios.put(`${API_CONFIG.BASE_URL}/satici/siparis-detay/${seciliUrun.detayId}/durum`, 
        { 
          yeniDurum: yeniDurum,
          kargoFirma: kargoFirma || null,
          kargoTakipNo: kargoTakipNo || null
        }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      Alert.alert("Başarılı", "Ürün durumu başarıyla güncellendi.");
      setModalGorunur(false);
      siparisleriGetir(); 
    } catch (error) {
      Alert.alert("Hata", "Güncelleme işlemi başarısız oldu.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={26} color="#1C1C1E" /></TouchableOpacity>
        <Text style={styles.baslik}>Mağaza Siparişleri</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? <ActivityIndicator size="large" color="#FF9F00" style={{ marginTop: 50 }} /> : (
        <FlatList
          data={siparisler}
          keyExtractor={(item) => item.siparisId.toString()}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text style={styles.bosMetin}>Henüz mağazanıza ait sipariş yok.</Text>}
          renderItem={({ item }) => (
            <SiparisKart 
              item={item} 
              onGuncelle={(siparis, urun) => {
                setSeciliSiparis(siparis);
                setSeciliUrun(urun);
                setModalGorunur(true);
              }} 
              onKargoTakip={() => {}} 
            />
          )}
        />
      )}

      <SiparisDurumModal 
        visible={modalGorunur}
        siparis={seciliSiparis}
        seciliUrun={seciliUrun}
        onClose={() => setModalGorunur(false)}
        onDurumSec={durumSec}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', alignItems: 'center' },
  baslik: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  bosMetin: { textAlign: 'center', marginTop: 50, color: '#8E8E93', fontSize: 15 }
});