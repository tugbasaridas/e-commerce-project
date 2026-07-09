import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
  const { tutar } = useLocalSearchParams<{ tutar: string }>();

  // YENİ STATE'LER: Ödeme Yöntemi ve Teslimat Adresi
  const [odemeYontemi, setOdemeYontemi] = useState<'Kredi Kartı' | 'Kapıda Ödeme'>('Kredi Kartı');
  const [teslimatAdresi, setTeslimatAdresi] = useState('');

  const [kartNo, setKartNo] = useState('');
  const [kartSahibi, setKartSahibi] = useState('');
  const [skt, setSkt] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);

  const handleKartNoChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/.{1,4}/g);
    if (match) {
      setKartNo(match.join(' ').substring(0, 19));
    } else {
      setKartNo(cleaned);
    }
  };

  const handleSktChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      setSkt(`${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`);
    } else {
      setSkt(cleaned);
    }
  };

  const handleOdemeYap = async () => {
    // 1. ADRES ZORUNLULUĞU KONTROLÜ
    if (teslimatAdresi.trim().length < 10) {
      Alert.alert('Hata', 'Lütfen detaylı bir teslimat adresi girin (En az 10 karakter).');
      return;
    }

    // 2. KART SEÇİLİYSE BİLGİ KONTROLÜ
    if (odemeYontemi === 'Kredi Kartı') {
      if (kartNo.length < 19 || kartSahibi.trim().length < 3 || skt.length < 5 || cvv.length < 3) {
        Alert.alert('Hata', 'Lütfen tüm kart bilgilerini eksiksiz ve doğru doldurun.');
        return;
      }
    }

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Hata', 'Oturum süreniz dolmuş, lütfen tekrar giriş yapın.');
        router.push('/(auth)/giris' as any);
        return;
      }

      // SİPARİŞİ VE SEÇİMLERİ BACKEND'E GÖNDERME
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/siparisler/olustur`,
        {
          odemeYontemi: odemeYontemi,
          teslimatAdresi: teslimatAdresi
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert(
        'Sipariş Başarılı 🎉',
        response.data.Mesaj || 'Siparişiniz başarıyla alındı ve hazırlanıyor.',
        [
          {
            text: 'Siparişlerime Git',
            onPress: () => {
              router.replace('/(tabs)/siparislerim' as any);
            }
          }
        ]
      );
    } catch (error: any) {
      console.log('SİPARİŞ OLUŞTURMA HATASI:', error.response?.data);
      let hataMesaji = 'Sipariş oluşturulurken bir hata oluştu.';
      const veri = error.response?.data;

      if (veri) {
        if (typeof veri === 'string') hataMesaji = veri;
        else if (veri.mesaj || veri.Mesaj) hataMesaji = veri.mesaj || veri.Mesaj;
        else if (veri.title) hataMesaji = veri.title;
      }
      Alert.alert('İşlem Başarısız', hataMesaji);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.geriButon}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerBaslik}>Ödeme Bilgileri</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
          
          {/* YENİ: ÖDEME YÖNTEMİ SEKMELERİ */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabButon, odemeYontemi === 'Kredi Kartı' && styles.aktifTab]}
              onPress={() => setOdemeYontemi('Kredi Kartı')}
            >
              <Ionicons name="card-outline" size={18} color={odemeYontemi === 'Kredi Kartı' ? '#FFF' : '#666'} />
              <Text style={[styles.tabYazi, odemeYontemi === 'Kredi Kartı' && styles.aktifTabYazi]}>Kredi Kartı</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabButon, odemeYontemi === 'Kapıda Ödeme' && styles.aktifTab]}
              onPress={() => setOdemeYontemi('Kapıda Ödeme')}
            >
              <Ionicons name="home-outline" size={18} color={odemeYontemi === 'Kapıda Ödeme' ? '#FFF' : '#666'} />
              <Text style={[styles.tabYazi, odemeYontemi === 'Kapıda Ödeme' && styles.aktifTabYazi]}>Kapıda Ödeme</Text>
            </TouchableOpacity>
          </View>

          {/* SADECE KREDİ KARTI SEÇİLİYSE GÖRÜNEN KISIM */}
          {odemeYontemi === 'Kredi Kartı' && (
            <View>
              <View style={styles.sanalKartContainer}>
                <View style={styles.sanalKart}>
                  <View style={styles.kartUstSatir}>
                    <View style={styles.kartCip} />
                    <Ionicons name="wifi-outline" size={24} color="#FFF" style={{ transform: [{ rotate: '90deg' }] }} />
                  </View>

                  <Text style={styles.kartNoYazi}>
                    {kartNo || '•••• •••• •••• ••••'}
                  </Text>

                  <View style={styles.kartAltSatir}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={styles.kartEtiket}>KART SAHİBİ</Text>
                      <Text style={styles.kartDeger} numberOfLines={1}>
                        {kartSahibi ? kartSahibi.toUpperCase() : 'İSİM SOYİSİM'}
                      </Text>
                    </View>

                    <View style={{ marginRight: 20 }}>
                      <Text style={styles.kartEtiket}>SKT</Text>
                      <Text style={styles.kartDeger}>{skt || 'AA/YY'}</Text>
                    </View>

                    <View>
                      <Text style={styles.kartEtiket}>CVV</Text>
                      <Text style={styles.kartDeger}>{cvv || '•••'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.formContainer}>
                <Text style={styles.inputEtiket}>Kart Sahibi *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: Tuğba Sarıdaş"
                  placeholderTextColor="#aaa"
                  value={kartSahibi}
                  onChangeText={setKartSahibi}
                  autoCapitalize="characters"
                />

                <Text style={styles.inputEtiket}>Kart Numarası *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor="#aaa"
                  keyboardType="number-pad"
                  value={kartNo}
                  onChangeText={handleKartNoChange}
                  maxLength={19}
                />

                <View style={styles.ikiliSatir}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.inputEtiket}>Son Kullanma *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="AA/YY"
                      placeholderTextColor="#aaa"
                      keyboardType="number-pad"
                      value={skt}
                      onChangeText={handleSktChange}
                      maxLength={5}
                    />
                  </View>

                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.inputEtiket}>CVV *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="000"
                      placeholderTextColor="#aaa"
                      keyboardType="number-pad"
                      secureTextEntry
                      value={cvv}
                      onChangeText={(text) => setCvv(text.replace(/\D/g, '').substring(0, 3))}
                      maxLength={3}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* HER DURUMDA GÖRÜNEN ADRES ALANI */}
          <View style={[styles.formContainer, { marginTop: odemeYontemi === 'Kapıda Ödeme' ? 20 : 10 }]}>
            <Text style={styles.inputEtiket}>Teslimat Adresi *</Text>
            <TextInput
              style={[styles.input, { height: 90, paddingTop: 12 }]}
              placeholder="Mahalle, cadde, sokak, kapı no ve il/ilçe bilgilerini eksiksiz yazınız..."
              placeholderTextColor="#aaa"
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
              value={teslimatAdresi}
              onChangeText={setTeslimatAdresi}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.altSabitAlan}>
        <View style={styles.toplamSatiri}>
          <Text style={styles.toplamEtiket}>Ödenecek Tutar</Text>
          <Text style={styles.toplamFiyat}>
            {tutar ? parseFloat(tutar).toFixed(2) : '0.00'} TL
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.odemeButon, loading && { opacity: 0.7 }]}
          onPress={handleOdemeYap}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.odemeButonYazi}>
                {odemeYontemi === 'Kredi Kartı' ? 'Ödemeyi Güvenli Tamamla' : 'Siparişi Onayla'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee'
  },
  geriButon: { padding: 5 },
  headerBaslik: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  
  // YENİ: SEKME STİLLERİ
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 15, justifyContent: 'space-between' },
  tabButon: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#eee', paddingVertical: 12, borderRadius: 10, marginHorizontal: 5 },
  aktifTab: { backgroundColor: '#FFB800', borderColor: '#FFB800' },
  tabYazi: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#666' },
  aktifTabYazi: { color: '#FFF' },

  sanalKartContainer: { alignItems: 'center', marginVertical: 20, paddingHorizontal: 15 },
  sanalKart: {
    width: '100%',
    height: 200,
    backgroundColor: '#FF7597', 
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#FF7597', 
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6
  },
  kartUstSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kartCip: { width: 45, height: 32, backgroundColor: '#FFE3E8', borderRadius: 6, opacity: 0.9 }, 
  kartNoYazi: { color: '#FFF', fontSize: 21, fontWeight: '600', letterSpacing: 2, textAlign: 'center', marginVertical: 15 },
  kartAltSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  kartEtiket: { color: '#FFF', opacity: 0.7, fontSize: 10, fontWeight: '500', marginBottom: 4 },
  kartDeger: { color: '#FFF', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  
  formContainer: { paddingHorizontal: 20, marginTop: 10 },
  inputEtiket: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 8, marginTop: 15 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333'
  },
  ikiliSatir: { flexDirection: 'row', justifyContent: 'space-between' },
  altSabitAlan: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingBottom: Platform.OS === 'ios' ? 25 : 20
  },
  toplamSatiri: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  toplamEtiket: { fontSize: 16, color: '#666', fontWeight: '500' },
  toplamFiyat: { fontSize: 22, fontWeight: 'bold', color: '#111' },
  odemeButon: { backgroundColor: '#FFB800', paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  odemeButonYazi: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});