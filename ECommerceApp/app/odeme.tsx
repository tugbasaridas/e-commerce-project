import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OdemeEkrani() {
  const router = useRouter();
  const { tutar, dogrulandi } = useLocalSearchParams<{ tutar: string, dogrulandi: string }>();

  const [kayitliAdreslerList, setKayitliAdreslerList] = useState<any[]>([]);
  const [kayitliKartlarList, setKayitliKartlarList] = useState<any[]>([]);
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
  const [loading, setLoading] = useState(false);
  const [bilgileriKaydet, setBilgileriKaydet] = useState(false);

  const spinValue = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);

  const flipCard = (toBack: boolean) => {
    if (isFlipped === toBack) return;
    Animated.timing(spinValue, {
      toValue: toBack ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
    setIsFlipped(toBack);
  };

  const frontInterpolate = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backInterpolate = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  
  const frontOpacity = spinValue.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [1, 1, 0, 0] });
  const backOpacity = spinValue.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [0, 0, 1, 1] });

  const frontAnimatedStyle = { 
    opacity: frontOpacity,
    transform: [{ perspective: 1000 }, { rotateY: frontInterpolate }] 
  };
  const backAnimatedStyle = { 
    opacity: backOpacity,
    transform: [{ perspective: 1000 }, { rotateY: backInterpolate }] 
  };

  useEffect(() => {
    const kayitliBilgileriGetir = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId') || 'ortak';
        const adresVeri = await AsyncStorage.getItem(`@kayitliAdresler_${userId}`);
        const kartVeri = await AsyncStorage.getItem(`@kayitliKartlar_${userId}`);

        if (adresVeri) {
          const adresler = JSON.parse(adresVeri);
          setKayitliAdreslerList(adresler);
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
          if (kartlar.length > 0) {
            const sonKart = kartlar[kartlar.length - 1];
            setKartNo(sonKart.kartNo || ''); setKartSahibi(sonKart.kartSahibi || ''); setSkt(sonKart.skt || '');
          }
        }
      } catch (error) { console.log("Bilgiler okunamadı."); }
    };
    kayitliBilgileriGetir();
  }, []);

  useEffect(() => { if (dogrulandi === 'true') handleOdemeYap(); }, [dogrulandi]);

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

  // YENİ EKLENEN: Akıllı Telefon Formatlayıcısı
  const handleTelefonChange = (text: string) => {
    // Eğer kullanıcı silme işlemi yapıyorsa müdahale etme ki takılmasın
    if (text.length < telefon.length) {
      setTelefon(text);
      return;
    }
    
    // Sadece rakamları al
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length === 0) {
      setTelefon('');
      return;
    }

    // "5" ile başlarsa otomatik "0" ekle
    if (cleaned[0] !== '0') {
      cleaned = '0' + cleaned;
    }

    // Maksimum 11 haneye sınırla (0555 123 45 67)
    if (cleaned.length > 11) {
      cleaned = cleaned.substring(0, 11);
    }

    // Telefon numarasını gruplara ayırarak formatla: (0555) 123 45 67
    let formatted = cleaned;
    if (cleaned.length > 3) {
      formatted = `(${cleaned.substring(0, 4)}) ${cleaned.substring(4)}`;
    }
    if (cleaned.length > 6) {
      formatted = `(${cleaned.substring(0, 4)}) ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`;
    }
    if (cleaned.length > 8) {
      formatted = `(${cleaned.substring(0, 4)}) ${cleaned.substring(4, 7)} ${cleaned.substring(7, 9)} ${cleaned.substring(9)}`;
    }

    setTelefon(formatted);
  };

  const odemeyiBaslat = async () => {
    // Telefon uzunluk kontrolü artık formatlı haline göre (15 karakter: (05XX) XXX XX XX)
    if (!il || !ilce || acikAdres.length < 10 || telefon.length < 15) {
      Alert.alert('Hata', 'Lütfen adres ve telefon bilgilerini eksiksiz girin.');
      return;
    }
    await AsyncStorage.setItem('@geciciSiparis', JSON.stringify({ adresBaslik, il, ilce, acikAdres, telefon, odemeYontemi, bilgileriKaydet, kartNo, kartSahibi, skt }));

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

  const handleOdemeYap = async () => {
    setLoading(true);
    try {
      const gecici = JSON.parse(await AsyncStorage.getItem('@geciciSiparis') || '{}');
      const userId = await AsyncStorage.getItem('userId') || 'ortak';

      if (gecici.bilgileriKaydet) {
        const adresler = JSON.parse(await AsyncStorage.getItem(`@kayitliAdresler_${userId}`) || '[]');
        if (!adresler.some((a: any) => a.acikAdres.trim().toLowerCase() === gecici.acikAdres.trim().toLowerCase())) {
          adresler.push({ id: Date.now().toString(), baslik: gecici.adresBaslik, il: gecici.il, ilce: gecici.ilce, acikAdres: gecici.acikAdres, telefon: gecici.telefon });
          await AsyncStorage.setItem(`@kayitliAdresler_${userId}`, JSON.stringify(adresler));
        }

        if (gecici.odemeYontemi === 'Kredi Kartı') {
          const kartlar = JSON.parse(await AsyncStorage.getItem(`@kayitliKartlar_${userId}`) || '[]');
          if (!kartlar.some((k: any) => k.kartNo === gecici.kartNo)) {
            kartlar.push({ id: Date.now().toString(), kartNo: gecici.kartNo, kartSahibi: gecici.kartSahibi, skt: gecici.skt });
            await AsyncStorage.setItem(`@kayitliKartlar_${userId}`, JSON.stringify(kartlar));
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
    } catch (e) { Alert.alert('Hata', 'Sipariş oluşturulamadı.'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} /></TouchableOpacity>
        <Text style={styles.headerBaslik}>Ödeme Bilgileri</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tabButon, odemeYontemi === 'Kredi Kartı' && styles.aktifTab]} onPress={() => setOdemeYontemi('Kredi Kartı')}>
            <Ionicons name="card-outline" size={18} color={odemeYontemi === 'Kredi Kartı' ? '#000' : '#666'} />
            <Text style={[styles.tabYazi, odemeYontemi === 'Kredi Kartı' && styles.aktifTabYazi]}>Kredi Kartı</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabButon, odemeYontemi === 'Kapıda Ödeme' && styles.aktifTab]} onPress={() => setOdemeYontemi('Kapıda Ödeme')}>
            <Ionicons name="home-outline" size={18} color={odemeYontemi === 'Kapıda Ödeme' ? '#000' : '#666'} />
            <Text style={[styles.tabYazi, odemeYontemi === 'Kapıda Ödeme' && styles.aktifTabYazi]}>Kapıda Ödeme</Text>
          </TouchableOpacity>
        </View>

        {odemeYontemi === 'Kredi Kartı' && (
          <View>
            <View style={styles.sanalKartContainer}>
              <View style={styles.kartWrapper}>
                
                <Animated.View style={[styles.sanalKart, styles.kartOnYuz, frontAnimatedStyle]}>
                  <View style={styles.kartUstBolum}>
                    <Ionicons name="hardware-chip" size={40} color="#FFD700" />
                    <Text style={styles.bankaIsmi}>MyBank</Text>
                  </View>
                  <Text style={styles.kartNoYazi}>{kartNo || '•••• •••• •••• ••••'}</Text>
                  <View style={styles.kartAltBolum}>
                    <View>
                      <Text style={styles.kartEtiket}>KART SAHİBİ</Text>
                      <Text style={styles.kartDetay}>{kartSahibi.toUpperCase() || 'AD SOYAD'}</Text>
                    </View>
                    <View>
                      <Text style={styles.kartEtiket}>SKT</Text>
                      <Text style={styles.kartDetay}>{skt || 'AA/YY'}</Text>
                    </View>
                  </View>
                </Animated.View>

                <Animated.View style={[styles.sanalKart, styles.kartArkaYuz, backAnimatedStyle]}>
                  <View style={styles.manyetikSerit} />
                  <View style={styles.cvvBolumu}>
                    <View style={styles.cvvBeyazAlan}><Text style={styles.cvvMetin}>{cvv || '•••'}</Text></View>
                    <Text style={styles.cvvEtiket}>CVV</Text>
                  </View>
                </Animated.View>
                
              </View>
            </View>

            <TextInput 
              style={styles.input} 
              placeholder="Kart Sahibi" 
              value={kartSahibi} 
              onChangeText={setKartSahibi} 
              onFocus={() => flipCard(false)} 
            />
            <TextInput 
              style={styles.input} 
              placeholder="Kart No" 
              keyboardType="number-pad" 
              value={kartNo} 
              onChangeText={handleKartNoChange} 
              onFocus={() => flipCard(false)} 
            />
            
            <View style={styles.ikiliSatir}>
                <TextInput 
                  style={[styles.input, {flex: 1}]} 
                  placeholder="AA/YY" 
                  value={skt} 
                  onChangeText={handleSktChange} 
                  keyboardType="number-pad" 
                  onFocus={() => flipCard(false)} 
                />
                <TextInput 
                  style={[styles.input, {flex: 1, marginLeft: 10}]} 
                  placeholder="CVV" 
                  secureTextEntry 
                  keyboardType="number-pad" 
                  maxLength={3} 
                  value={cvv} 
                  onChangeText={setCvv} 
                  onFocus={() => flipCard(true)} 
                />
            </View>
          </View>
        )}

        <View style={styles.formContainer}>
            <TextInput style={styles.input} placeholder="Adres Başlığı (Örn: Ev, İş)" value={adresBaslik} onChangeText={setAdresBaslik} onFocus={() => flipCard(false)} />
            
            {/* GÜNCELLENEN TELEFON INPUTU */}
            <TextInput 
              style={styles.input} 
              placeholder="Telefon (5XX XXX XX XX)" 
              keyboardType="phone-pad" // Klavyeyi telefon moduna geçirir
              maxLength={16} // Formatla beraber maksimum uzunluk
              value={telefon} 
              onChangeText={handleTelefonChange} 
              onFocus={() => flipCard(false)} 
            />

            <View style={styles.ikiliSatir}>
                <TextInput style={[styles.input, {flex: 1}]} placeholder="İl" value={il} onChangeText={setIl} onFocus={() => flipCard(false)} />
                <TextInput style={[styles.input, {flex: 1, marginLeft: 10}]} placeholder="İlçe" value={ilce} onChangeText={setIlce} onFocus={() => flipCard(false)} />
            </View>
            <TextInput style={styles.input} placeholder="Açık Adres" value={acikAdres} onChangeText={setAcikAdres} onFocus={() => flipCard(false)} />
        </View>

        <TouchableOpacity style={styles.checkboxContainer} onPress={() => setBilgileriKaydet(!bilgileriKaydet)}>
            <View style={[styles.checkbox, bilgileriKaydet && styles.checkboxSecili]} />
            <Text>Bilgilerimi kaydet</Text>
        </TouchableOpacity>

      </ScrollView>

      <View style={styles.altSabitAlan}>
        <TouchableOpacity style={styles.odemeButon} onPress={odemeyiBaslat}>
          <Text style={styles.odemeButonYazi}>Ödemeyi Tamamla ({tutar ? tutar : '0.00'} TL)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff' },
  headerBaslik: { fontSize: 20, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', marginBottom: 20 },
  tabButon: { flex: 1, padding: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: '#eee', borderRadius: 10, marginHorizontal: 5 },
  aktifTab: { backgroundColor: '#FFB800', borderColor: '#FFB800' },
  tabYazi: { fontWeight: '600', color: '#666' },
  aktifTabYazi: { color: '#000' },
  sanalKartContainer: { alignItems: 'center', marginVertical: 10, height: 200, justifyContent: 'center' },
  kartWrapper: { width: 330, height: 200 },
  sanalKart: { width: 330, height: 200, borderRadius: 16, padding: 20, justifyContent: 'space-between', position: 'absolute', top: 0, left: 0, backfaceVisibility: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },
  kartOnYuz: { backgroundColor: '#FF7597' },
  kartArkaYuz: { backgroundColor: '#FF7597' },
  kartUstBolum: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bankaIsmi: { color: '#FFF', fontSize: 18, fontStyle: 'italic', fontWeight: 'bold' },
  kartNoYazi: { color: '#FFF', fontSize: 22, letterSpacing: 2, textAlign: 'center', marginVertical: 15, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  kartAltBolum: { flexDirection: 'row', justifyContent: 'space-between' },
  kartEtiket: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 10, marginBottom: 2 },
  kartDetay: { color: '#FFF', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
  manyetikSerit: { backgroundColor: '#000', height: 40, width: '120%', position: 'absolute', top: 30, left: -10 },
  cvvBolumu: { marginTop: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 10 },
  cvvBeyazAlan: { backgroundColor: '#FFF', width: 60, height: 35, justifyContent: 'center', alignItems: 'center', borderRadius: 4 },
  cvvMetin: { fontSize: 16, fontStyle: 'italic', fontWeight: 'bold' },
  cvvEtiket: { color: '#FFF', fontSize: 12, marginLeft: 10 },
  formContainer: { marginTop: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 15, marginBottom: 15 },
  ikiliSatir: { flexDirection: 'row' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: '#ccc', borderRadius: 6, marginRight: 10 },
  checkboxSecili: { backgroundColor: '#FFB800', borderColor: '#FFB800' },
  altSabitAlan: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
  odemeButon: { backgroundColor: '#FFB800', padding: 18, borderRadius: 12, alignItems: 'center' },
  odemeButonYazi: { fontWeight: 'bold', fontSize: 16, color: '#000' }
});