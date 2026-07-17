import { API_CONFIG } from '@/config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

export const useOdeme = (dogrulandi?: string) => {
  const router = useRouter();
  
  const [odemeYontemi, setOdemeYontemi] = useState<'Kredi Kartı' | 'Kapıda Ödeme'>('Kredi Kartı');
  const [adresBaslik, setAdresBaslik] = useState('');
  const [il, setIl] = useState('');
  const [ilce, setIlce] = useState('');
  const [acikAdres, setAcikAdres] = useState('');
  const [telefon, setTelefon] = useState('');
  
  const [kartNo, setKartNo] = useState('');
  const [kartSahibi, setKartSahibi] = useState('');
  const [skt, setSkt] = useState('');
  const [cvv, setCvv] = useState('');
  const [bilgileriKaydet, setBilgileriKaydet] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sayfada listelemek için yeni eklenen stateler
  const [kayitliAdreslerList, setKayitliAdreslerList] = useState<any[]>([]);
  const [kayitliKartlarList, setKayitliKartlarList] = useState<any[]>([]);

  useEffect(() => {
    const kayitliBilgileriGetir = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId') || 'ortak';
        const adresVeri = await AsyncStorage.getItem(`@kayitliAdresler_${userId}`);
        const kartVeri = await AsyncStorage.getItem(`@kayitliKartlar_${userId}`);

        if (adresVeri) {
          const adresler = JSON.parse(adresVeri);
          setKayitliAdreslerList(adresler);
          // Varsayılan olarak en son adresi doldur
          if (adresler.length > 0) {
            const sonAdres = adresler[adresler.length - 1];
            setAdresBaslik(sonAdres.baslik || ''); setIl(sonAdres.il || '');
            setIlce(sonAdres.ilce || ''); setAcikAdres(sonAdres.acikAdres || '');
            setTelefon(sonAdres.telefon || '');
          }
        }
        if (kartVeri) {
          const kartlar = JSON.parse(kartVeri);
          setKayitliKartlarList(kartlar);
          // Varsayılan olarak en son kartı doldur
          if (kartlar.length > 0) {
            const sonKart = kartlar[kartlar.length - 1];
            setKartNo(sonKart.kartNo || ''); setKartSahibi(sonKart.kartSahibi || ''); setSkt(sonKart.skt || '');
          }
        }
      } catch (error) { console.log("Bilgiler okunamadı."); }
    };
    kayitliBilgileriGetir();
  }, []);

  useEffect(() => { 
    if (dogrulandi === 'true') handleOdemeYap(); 
  }, [dogrulandi]);

  // Seçim tıklandığında formu dolduracak yardımcı fonksiyonlar
  const adresSec = (adres: any) => {
    setAdresBaslik(adres.baslik || '');
    setIl(adres.il || '');
    setIlce(adres.ilce || '');
    setAcikAdres(adres.acikAdres || '');
    setTelefon(adres.telefon || '');
  };

  const kartSec = (kart: any) => {
    setKartNo(kart.kartNo || '');
    setKartSahibi(kart.kartSahibi || '');
    setSkt(kart.skt || '');
    setCvv(''); // Güvenlik gerekçesiyle CVV alanını boş bırakıyoruz
    setIsFlipped(false);
  };

  const handleKartNoChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/.{1,4}/g);
    setKartNo(match ? match.join(' ').substring(0, 19) : cleaned);
  };

  const handleSktChange = (text: string) => {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      let ay = parseInt(cleaned.substring(0, 2), 10);
      if (ay > 12) ay = 12;
      if (ay === 0) ay = 1;
      let ayString = ay < 10 ? `0${ay}` : `${ay}`;
      setSkt(`${ayString}/${cleaned.substring(2, 4)}`);
    } else {
      setSkt(cleaned);
    }
  };

  const handleTelefonChange = (text: string) => {
    if (text.length < telefon.length) { setTelefon(text); return; }
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length === 0) { setTelefon(''); return; }
    if (cleaned[0] !== '0') cleaned = '0' + cleaned;
    if (cleaned.length > 11) cleaned = cleaned.substring(0, 11);

    let formatted = cleaned;
    if (cleaned.length > 3) formatted = `(${cleaned.substring(0, 4)}) ${cleaned.substring(4)}`;
    if (cleaned.length > 6) formatted = `(${cleaned.substring(0, 4)}) ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
    if (cleaned.length > 8) formatted = `(${cleaned.substring(0, 4)}) ${cleaned.substring(4, 7)} ${cleaned.substring(7, 9)} ${cleaned.substring(9)}`;
    setTelefon(formatted);
  };

  const handleOdemeYap = async () => {
    setLoading(true);
    try {
      const gecici = JSON.parse(await AsyncStorage.getItem('@geciciSiparis') || '{}');
      const userId = await AsyncStorage.getItem('userId') || 'ortak';

      if (gecici.bilgileriKaydet) {
        // --- ADRES KAYDETME GÜVENLİK KALKANI (Crash Önleyici) ---
        const adresler = JSON.parse(await AsyncStorage.getItem(`@kayitliAdresler_${userId}`) || '[]');
        const geciciAcikAdres = (gecici.acikAdres || '').trim().toLowerCase();
        
        const adresVarMi = adresler.some(
          (a: any) => (a.acikAdres || '').trim().toLowerCase() === geciciAcikAdres
        );

        if (!adresVarMi && geciciAcikAdres.length > 0) {
          adresler.push({ 
            id: Date.now().toString(), 
            baslik: gecici.adresBaslik || 'Adres', 
            il: gecici.il, 
            ilce: gecici.ilce, 
            acikAdres: gecici.acikAdres, 
            telefon: gecici.telefon 
          });
          await AsyncStorage.setItem(`@kayitliAdresler_${userId}`, JSON.stringify(adresler));
          setKayitliAdreslerList(adresler); // Listeyi anlık güncelle
        }

        // --- KART KAYDETME GÜVENLİK KALKANI ---
        if (gecici.odemeYontemi === 'Kredi Kartı') {
          const kartlar = JSON.parse(await AsyncStorage.getItem(`@kayitliKartlar_${userId}`) || '[]');
          const kartVarMi = kartlar.some((k: any) => k.kartNo === gecici.kartNo);
          
          if (!kartVarMi && gecici.kartNo) {
            kartlar.push({ 
              id: Date.now().toString(), 
              kartNo: gecici.kartNo, 
              kartSahibi: gecici.kartSahibi, 
              skt: gecici.skt 
            });
            await AsyncStorage.setItem(`@kayitliKartlar_${userId}`, JSON.stringify(kartlar));
            setKayitliKartlarList(kartlar); // Listeyi anlık güncelle
          }
        }
      }

      await axios.post(`${API_CONFIG.BASE_URL}/siparisler/olustur`, {
        odemeYontemi: gecici.odemeYontemi,
        teslimatAdresi: `${gecici.adresBaslik} - ${gecici.acikAdres}, ${gecici.ilce}/${gecici.il}`,
        telefon: gecici.telefon
      }, { headers: { Authorization: `Bearer ${await AsyncStorage.getItem('userToken')}` } });

      await AsyncStorage.removeItem('@geciciSiparis');
      Alert.alert('Sipariş Başarılı 🎉', 'Siparişiniz alındı.', [{ text: 'Tamam', onPress: () => router.replace('/(tabs)/siparislerim' as any) }]);
    } catch (e: any) { 
      // === BURASI DEĞİŞTİ: BACKEND'DEN GELEN DİNAMİK STOK MESAJINI YAKALIYORUZ ===
      const hataMesaji = e.response?.data?.mesaj || e.response?.data?.Mesaj || "Sipariş oluşturulamadı. Lütfen tekrar deneyin.";
      Alert.alert('Sipariş Hatası', hataMesaji); 
    } finally { 
      setLoading(false); 
    }
  };

  const odemeyiBaslat = async () => {
    const temizTelefon = telefon.replace(/\D/g, '');
    const temizAdres = acikAdres.trim();

    if (!il || !ilce || temizAdres.length < 3 || temizTelefon.length < 10) {
      Alert.alert('Hata', 'Lütfen adres ve telefon bilgilerini eksiksiz girin.');
      return;
    }
    
    await AsyncStorage.setItem('@geciciSiparis', JSON.stringify({ 
      adresBaslik, il, ilce, acikAdres: temizAdres, telefon, odemeYontemi, bilgileriKaydet, kartNo, kartSahibi, skt 
    }));

    if (odemeYontemi === 'Kredi Kartı') {
      if (kartNo.length < 19 || !kartSahibi || !skt || !cvv) {
        Alert.alert('Hata', 'Lütfen kart bilgilerini eksiksiz girin.');
        return;
      }
      router.push({ pathname: '/dogrulama' as any, params: { kod: Math.floor(100000 + Math.random() * 900000).toString(), telefon } });
    } else {
      handleOdemeYap();
    }
  };

  return {
    odemeYontemi, setOdemeYontemi,
    adresBaslik, setAdresBaslik, il, setIl, ilce, setIlce, acikAdres, setAcikAdres, telefon, handleTelefonChange,
    kartNo, handleKartNoChange, kartSahibi, setKartSahibi, skt, handleSktChange, cvv, setCvv,
    bilgileriKaydet, setBilgileriKaydet,
    isFlipped, setIsFlipped,
    loading, odemeyiBaslat,
    kayitliAdreslerList, kayitliKartlarList, adresSec, kartSec 
  };
};