import { API_CONFIG } from '@/config/api';
import { Urun } from '@/types/Urun';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

export const useDetay = (id: string | string[]) => {
  const router = useRouter();
  
  const [urun, setUrun] = useState<Urun | null>(null);
  const [loading, setLoading] = useState(true);
  const [girisYapildiMi, setGirisYapildiMi] = useState(false);
  
  const [miktar, setMiktar] = useState(1);
  const [toastGorunur, setToastGorunur] = useState(false);
  const [toastMesaj, setToastMesaj] = useState('');

  const [oylamaModalGorunur, setOylamaModalGorunur] = useState(false);
  const [secilenPuan, setSecilenPuan] = useState<number>(0); 
  // YENİ: Yorum metnini tutacak state
  const [yorumMetni, setYorumMetni] = useState(''); 
  const [oyGonderiliyor, setOyGonderiliyor] = useState(false);

  useEffect(() => {
    const girisKontrol = async () => {
      const token = await AsyncStorage.getItem('userToken');
      setGirisYapildiMi(!!token);
    };
    girisKontrol();

    axios.get(`${API_CONFIG.BASE_URL}/urunler/${id}`)
      .then((res) => {
        setUrun(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Detay yüklenemedi:", err);
        setLoading(false);
      });
  }, [id]);

  const basariliMesajGoster = (mesaj: string) => {
    setToastMesaj(mesaj);
    setToastGorunur(true);
    setTimeout(() => setToastGorunur(false), 3000);
  };

  const miktarArtir = () => setMiktar(prev => prev + 1);
  const miktarAzalt = () => setMiktar(prev => (prev > 1 ? prev - 1 : 1));

  const favoriButonunaBasildi = async () => {
    if (!girisYapildiMi) {
      Alert.alert("Giriş Gerekli", "Favorilere eklemek için giriş yapmalısınız.");
      return; 
    } 
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(`${API_CONFIG.BASE_URL}/favoriler`, { urunId: Number(id) }, { headers: { Authorization: `Bearer ${token}` } });
      basariliMesajGoster("Favorilere eklendi! ❤️");
    } catch (error: any) {
      error.response?.status === 400 ? basariliMesajGoster("Zaten favorilerinizde.") : Alert.alert("Hata", "Bir sorun oluştu.");
    }
  };

  const sepeteEkle = async () => {
    if (!girisYapildiMi) {
      Alert.alert("Giriş Gerekli", "Sepete eklemek için giriş yapmalısınız.");
      return;
    }
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(`${API_CONFIG.BASE_URL}/sepet`, { urunId: Number(id), miktar: miktar }, { headers: { Authorization: `Bearer ${token}` } });
      basariliMesajGoster(`${miktar} adet sepete eklendi!`);
      router.push('/(tabs)/sepet');
    } catch (error) {
      Alert.alert("Hata", "Sepete eklenirken bir sorun oluştu.");
    }
  };

  const oyGonder = async () => {
    if (secilenPuan === 0) {
      Alert.alert("Uyarı", "Lütfen bir puan seçin.");
      return;
    }
    setOyGonderiliyor(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // YENİ: Yorum metni ve puan params objesi ile daha güvenli gönderiliyor
      await axios.post(
        `${API_CONFIG.BASE_URL}/urunler/${id}/oyla`, 
        {}, 
        { 
          headers: { Authorization: `Bearer ${token}` },
          params: {
            puan: secilenPuan,
            yorum: yorumMetni ? yorumMetni : undefined
          }
        }
      );
      
      Alert.alert("Başarılı", "Değerlendirme ve yorumunuz kaydedildi! Teşekkürler.");
      
      setOylamaModalGorunur(false);
      setSecilenPuan(0);
      setYorumMetni(''); 
      
      const guncelUrun = await axios.get(`${API_CONFIG.BASE_URL}/urunler/${id}`);
      setUrun(guncelUrun.data);
    } catch (error: any) {
      Alert.alert("Hata", error.response?.data?.mesaj || "Oylama kaydedilemedi.");
    } finally {
      setOyGonderiliyor(false);
    }
  };

  return {
    urun, loading, girisYapildiMi, 
    miktar, miktarArtir, miktarAzalt,
    toastGorunur, toastMesaj,
    oylamaModalGorunur, setOylamaModalGorunur, 
    secilenPuan, setSecilenPuan, 
    yorumMetni, setYorumMetni, // Dışa aktarıldı
    oyGonderiliyor,
    favoriButonunaBasildi, sepeteEkle, oyGonder
  };
};