import { API_CONFIG } from '@/config/api';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BildirimZili() {
  const { colors } = useTheme();
  const [okunmamisSayisi, setOkunmamisSayisi] = useState(0);
  const [girisYapildiMi, setGirisYapildiMi] = useState(false);
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
        setGirisYapildiMi(false);
        return;
      }
      
      setGirisYapildiMi(true);
      
      const response = await axios.get(`${API_CONFIG.BASE_URL}/bildirim/okunmamis-sayisi`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOkunmamisSayisi(response.data.okunmamisSayisi || 0);
    } catch (error) {
      console.log("Bildirim sayısı çekilemedi", error);
    }
  };

  // Giriş yapılmadıysa zili gizle
  if (!girisYapildiMi) return null;

  return (
    <TouchableOpacity onPress={() => router.push('/bildirimler')} style={styles.zilButon} activeOpacity={0.7}>
      <Ionicons name="notifications-outline" size={26} color={colors.text} />
      
      {/* Okunmamış bildirim sayısı 0'dan büyükse kırmızı rozeti göster */}
      {okunmamisSayisi > 0 && (
        <View style={[styles.rozet, { borderColor: colors.background }]}>
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
    padding: 6,
  },
  rozet: {
    position: 'absolute',
    right: 2,
    top: 2,
    backgroundColor: '#FF4757',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    zIndex: 1,
  },
  rozetMetin: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 3,
  }
});