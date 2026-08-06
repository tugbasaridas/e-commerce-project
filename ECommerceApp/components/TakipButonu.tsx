import { API_CONFIG } from '@/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function TakipEtButonu({ magazaId }: { magazaId: number }) {
  const [takipEdiliyor, setTakipEdiliyor] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Sayfa açıldığında veritabanından bu mağazanın takip durumunu öğren
  useEffect(() => {
    if (magazaId) {
      takipDurumunuKontrolEt();
    }
  }, [magazaId]);

  const takipDurumunuKontrolEt = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_CONFIG.BASE_URL}/kupon/takip-durumu/${magazaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTakipEdiliyor(response.data.takipEdiliyor);
    } catch (error) {
      console.log("Takip durumu alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  const butonTiklandi = async () => {
    if (!magazaId) return;

    if (takipEdiliyor) {
      Alert.alert(
        "Takipten Çık",
        "Bu mağazayı takipten çıkarmak istiyor musunuz?",
        [
          { text: "Vazgeç", style: "cancel" },
          { text: "Evet", style: "destructive", onPress: () => takibiBirakSorgusu() }
        ]
      );
    } else {
      takipEtSorgusu();
    }
  };

  const takipEtSorgusu = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert("Uyarı", "Mağazayı takip etmek için giriş yapmalısınız.");
        return;
      }

      const response = await axios.post(`${API_CONFIG.BASE_URL}/kupon/takip-et/${magazaId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTakipEdiliyor(true);
      Alert.alert("Tebrikler! 🎉", response.data.mesaj || "Mağaza takip edildi ve kupon kazandınız!");
    } catch (error: any) {
      Alert.alert("Hata", error.response?.data?.mesaj || "İşlem başarısız oldu.");
    } finally {
      setLoading(false);
    }
  };

  const takibiBirakSorgusu = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      await axios.delete(`${API_CONFIG.BASE_URL}/kupon/takibi-birak/${magazaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTakipEdiliyor(false);
    } catch (error: any) {
      Alert.alert("Hata", error.response?.data?.mesaj || "Takipten çıkılamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.buton, takipEdiliyor ? styles.takipEdiliyor : styles.takipEt]} 
      onPress={butonTiklandi}
      activeOpacity={0.8}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={takipEdiliyor ? "#28A745" : "#FFF"} />
      ) : (
        <Text style={[styles.yazi, takipEdiliyor ? styles.takipEdiliyorYazi : styles.takipEtYazi]}>
          {takipEdiliyor ? "Takip Ediliyor ✓" : "+ Takip Et"}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buton: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', minWidth: 110 },
  takipEt: { backgroundColor: '#FF9F00', borderColor: '#FF9F00' },
  takipEdiliyor: { backgroundColor: '#E8F5E9', borderColor: '#28A745' },
  yazi: { fontSize: 13, fontWeight: 'bold' },
  takipEtYazi: { color: '#FFF' },
  takipEdiliyorYazi: { color: '#28A745' }
});