import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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
    if (cleaned.length >= 2) setSkt(`${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`);
    else setSkt(cleaned);
  };

  const odemeyiBaslat = async () => {
    if (!il || !ilce || acikAdres.length < 10 || telefon.length < 10) {
      Alert.alert('Hata', 'Lütfen adres bilgilerini eksiksiz girin.');
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
            <Ionicons name="card-outline" size={18} color={odemeYontemi === 'Kredi Kartı' ? '#FFF' : '#666'} />
            <Text style={[styles.tabYazi, odemeYontemi === 'Kredi Kartı' && styles.aktifTabYazi]}>Kredi Kartı</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabButon, odemeYontemi === 'Kapıda Ödeme' && styles.aktifTab]} onPress={() => setOdemeYontemi('Kapıda Ödeme')}>
            <Ionicons name="home-outline" size={18} color={odemeYontemi === 'Kapıda Ödeme' ? '#FFF' : '#666'} />
            <Text style={[styles.tabYazi, odemeYontemi === 'Kapıda Ödeme' && styles.aktifTabYazi]}>Kapıda Ödeme</Text>
          </TouchableOpacity>
        </View>

        {odemeYontemi === 'Kredi Kartı' && (
          <View>
            {kayitliKartlarList.length > 0 && (
              <View style={{ marginTop: 15 }}>
                <Text style={styles.secimBaslik}>Kayıtlı Kartlarım</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>{kayitliKartlarList.map((k, i) => (
                  <TouchableOpacity key={i} style={[styles.miniKart, kartNo === k.kartNo && styles.miniKartSecili]} onPress={() => { setKartNo(k.kartNo); setKartSahibi(k.kartSahibi); setSkt(k.skt); }}>
                    <Text style={styles.miniKartNo}>**** {k.kartNo.slice(-4)}</Text>
                  </TouchableOpacity>
                ))}</ScrollView>
              </View>
            )}
            <View style={styles.sanalKartContainer}>
                <View style={styles.sanalKart}>
                    <Text style={styles.kartNoYazi}>{kartNo || '•••• •••• •••• ••••'}</Text>
                </View>
            </View>
            <TextInput style={styles.input} placeholder="Kart Sahibi" value={kartSahibi} onChangeText={setKartSahibi} />
            <TextInput style={styles.input} placeholder="Kart No" keyboardType="number-pad" value={kartNo} onChangeText={handleKartNoChange} />
            <View style={styles.ikiliSatir}>
                <TextInput style={[styles.input, {flex: 1}]} placeholder="AA/YY" value={skt} onChangeText={handleSktChange} />
                <TextInput style={[styles.input, {flex: 1, marginLeft: 10}]} placeholder="CVV" secureTextEntry keyboardType="number-pad" value={cvv} onChangeText={setCvv} />
            </View>
          </View>
        )}

        <View style={styles.formContainer}>
            {kayitliAdreslerList.length > 0 && (
              <View style={{ marginBottom: 15 }}>
                <Text style={styles.secimBaslik}>Kayıtlı Adreslerim</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>{kayitliAdreslerList.map((a, i) => (
                  <TouchableOpacity key={i} style={[styles.miniAdres, acikAdres === a.acikAdres && styles.miniAdresSecili]} onPress={() => { setAdresBaslik(a.baslik); setIl(a.il); setIlce(a.ilce); setAcikAdres(a.acikAdres); setTelefon(a.telefon); }}>
                    <Text style={styles.miniAdresBaslik}>{a.baslik}</Text>
                  </TouchableOpacity>
                ))}</ScrollView>
              </View>
            )}
            <TextInput style={styles.input} placeholder="Adres Başlığı" value={adresBaslik} onChangeText={setAdresBaslik} />
            <TextInput style={styles.input} placeholder="Telefon" value={telefon} onChangeText={setTelefon} />
            <View style={styles.ikiliSatir}>
                <TextInput style={[styles.input, {flex: 1}]} placeholder="İl" value={il} onChangeText={setIl} />
                <TextInput style={[styles.input, {flex: 1, marginLeft: 10}]} placeholder="İlçe" value={ilce} onChangeText={setIlce} />
            </View>
            <TextInput style={styles.input} placeholder="Açık Adres" value={acikAdres} onChangeText={setAcikAdres} />
        </View>
        <TouchableOpacity style={styles.checkboxContainer} onPress={() => setBilgileriKaydet(!bilgileriKaydet)}>
            <View style={[styles.checkbox, bilgileriKaydet && styles.checkboxSecili]} />
            <Text>Bilgilerimi kaydet</Text>
        </TouchableOpacity>
      </ScrollView>
      <View style={styles.altSabitAlan}>
        <TouchableOpacity style={styles.odemeButon} onPress={odemeyiBaslat}><Text style={styles.odemeButonYazi}>Ödemeyi Tamamla</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff' },
  headerBaslik: { fontSize: 20, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', padding: 20 },
  tabButon: { flex: 1, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#eee', borderRadius: 10, margin: 5 },
  aktifTab: { backgroundColor: '#FFB800' },
  tabYazi: { fontWeight: '600' },
  aktifTabYazi: { color: '#000' },
  sanalKartContainer: { alignItems: 'center', marginVertical: 20 },
  sanalKart: { width: '90%', height: 180, backgroundColor: '#FF7597', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  kartNoYazi: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  formContainer: { paddingHorizontal: 20 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 15, marginBottom: 10 },
  ikiliSatir: { flexDirection: 'row' },
  secimBaslik: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  miniKart: { padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginRight: 10 },
  miniKartSecili: { borderColor: '#FFB800', backgroundColor: '#FFFDF5' },
  miniKartNo: { fontSize: 12 },
  miniAdres: { padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginRight: 10 },
  miniAdresSecili: { borderColor: '#FFB800', backgroundColor: '#FFFDF5' },
  miniAdresBaslik: { fontSize: 12 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  checkbox: { width: 20, height: 20, borderWidth: 2, borderColor: '#ccc', marginRight: 10 },
  checkboxSecili: { backgroundColor: '#FFB800' },
  altSabitAlan: { padding: 20, backgroundColor: '#fff' },
  odemeButon: { backgroundColor: '#FFB800', padding: 15, borderRadius: 12, alignItems: 'center' },
  odemeButonYazi: { fontWeight: 'bold' },
  toplamSatiri: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  toplamEtiket: { fontSize: 16 },
  toplamFiyat: { fontSize: 20, fontWeight: 'bold' }
});