import { API_CONFIG } from '@/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, LayoutAnimation } from 'react-native';

export interface DestekTalebi {
  id: number;
  konu: string;
  mesaj: string;
  adminCevabi: string | null;
  durum: string;
  olusturulmaTarihi: string;
}

export const useDestek = () => {
  const router = useRouter();
  const [aktifSekme, setAktifSekme] = useState<'yeni' | 'gecmis'>('yeni');

  // Yeni Mesaj State'leri
  const [konu, setKonu] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  // Geçmiş Mesajlar State'i
  const [gecmisTalepler, setGecmisTalepler] = useState<DestekTalebi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);

  // Arama Sistemi State'leri
  const [aramaAktif, setAramaAktif] = useState(false);
  const [aramaMetni, setAramaMetni] = useState('');

  const gecmisTalepleriGetir = async () => {
    setYukleniyor(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Uyarı', 'Mesajlarınızı görmek için giriş yapmalısınız.');
        router.push('/(auth)/giris' as any);
        return;
      }

      const response = await axios.get(`${API_CONFIG.BASE_URL}/destek/kullanici`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGecmisTalepler(response.data);
    } catch (error) {
      console.error('Destek talepleri yüklenemedi:', error);
    } finally {
      setYukleniyor(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (aktifSekme === 'gecmis') {
        gecmisTalepleriGetir();
      } else {
        // Yeni sekmesine geçildiğinde aramayı kapat
        setAramaAktif(false);
        setAramaMetni('');
      }
    }, [aktifSekme])
  );

  const destekTalebiGonder = async () => {
    if (!konu.trim() || !mesaj.trim()) {
      Alert.alert('Uyarı', 'Lütfen konu ve mesaj alanlarını doldurun.');
      return;
    }

    setGonderiliyor(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Uyarı', 'Mesaj göndermek için giriş yapmalısınız.');
        router.push('/(auth)/giris' as any);
        return;
      }

      await axios.post(`${API_CONFIG.BASE_URL}/destek`, { konu, mesaj }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('Başarılı', 'Mesajınız bize ulaştı. En kısa sürede yanıtlayacağız.');
      setKonu('');
      setMesaj('');
      setAktifSekme('gecmis'); // Gönderdikten sonra geçmiş mesajlara at

    } catch (error) {
      Alert.alert('Hata', 'Mesajınız gönderilirken bir sorun oluştu.');
    } finally {
      setGonderiliyor(false);
    }
  };

  const toggleArama = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAramaAktif(!aramaAktif);
    if (aramaAktif) setAramaMetni(''); // Kapatırken metni temizle
  };

  const filtrelenmisTalepler = gecmisTalepler.filter(item => {
    const kucukArama = aramaMetni.toLowerCase();
    const konuEslesiyorMu = item.konu.toLowerCase().includes(kucukArama);
    const mesajEslesiyorMu = item.mesaj.toLowerCase().includes(kucukArama);
    const cevapEslesiyorMu = item.adminCevabi ? item.adminCevabi.toLowerCase().includes(kucukArama) : false;
    
    return konuEslesiyorMu || mesajEslesiyorMu || cevapEslesiyorMu;
  });

  return {
    aktifSekme, setAktifSekme,
    konu, setKonu,
    mesaj, setMesaj,
    gonderiliyor,
    yukleniyor,
    gecmisTalepler,
    aramaAktif,
    aramaMetni, setAramaMetni,
    toggleArama,
    filtrelenmisTalepler,
    destekTalebiGonder
  };
};