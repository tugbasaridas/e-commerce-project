import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BildirimZili() {
  const [okunmamisSayisi, setOkunmamisSayisi] = useState(0);
  const [girisYapildiMi, setGirisYapildiMi] = useState(false); // YENİ: Giriş kontrol durumu
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      bildirimSayisiniGetir();
    }, [])
  );

  const bildirimSayisiniGetir = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setGirisYapildiMi(false); // Token yoksa false yap
        return;
      }
      
      setGirisYapildiMi(true); // Token varsa true yap ve bildirimleri çek
      
      const response = await axios.get(`${API_CONFIG.BASE_URL}/bildirim/okunmamis-sayisi`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOkunmamisSayisi(response.data.okunmamisSayisi);
    } catch (error) {
      console.log("Bildirim sayısı çekilemedi", error);
    }
  };

  // YENİ EKLENDİ: Kullanıcı giriş yapmamışsa ekrana hiçbir şey çizme (Zili gizle)
  if (!girisYapildiMi) return null;

  return (
    <TouchableOpacity onPress={() => router.push('/bildirimler')} style={styles.zilButon} activeOpacity={0.7}>
      <Ionicons name="notifications-outline" size={28} color="#111" />
      
      {/* Eğer okunmamış bildirim varsa kırmızı bildirim baloncuğu çıksın */}
      {okunmamisSayisi > 0 && (
        <View style={styles.rozet}>
          <Text style={styles.rozetMetin}>
            {okunmamisSayisi > 99 ? '99+' : okunmamisSayisi}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  zilButon: {
    position: 'relative',
    padding: 8,
  },
  rozet: {
    position: 'absolute',
    right: 4,
    top: 4,
    backgroundColor: '#FF4757',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FAFAFA', 
    zIndex: 1,
  },
  rozetMetin: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  }
});