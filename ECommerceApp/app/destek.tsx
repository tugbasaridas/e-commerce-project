import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DestekTalebi {
  id: number;
  konu: string;
  mesaj: string;
  adminCevabi: string | null;
  durum: string;
  olusturulmaTarihi: string;
}

export default function Destek() {
  const router = useRouter();
  const [aktifSekme, setAktifSekme] = useState<'yeni' | 'gecmis'>('yeni');

  // Yeni Mesaj State'leri
  const [konu, setKonu] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  // Geçmiş Mesajlar State'i
  const [gecmisTalepler, setGecmisTalepler] = useState<DestekTalebi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (aktifSekme === 'gecmis') {
        gecmisTalepleriGetir();
      }
    }, [aktifSekme])
  );

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

  const renderTalepKart = ({ item }: { item: DestekTalebi }) => {
    const cevaplandiMi = item.durum === 'Cevaplandı';

    return (
      <View style={styles.talepKarti}>
        <View style={styles.talepBaslikSatiri}>
          <Text style={styles.talepKonu}>{item.konu}</Text>
          <View style={[styles.durumRozet, cevaplandiMi ? styles.durumCevaplandi : styles.durumBekliyor]}>
            <Text style={[styles.durumYazi, cevaplandiMi ? styles.durumYaziCevaplandi : styles.durumYaziBekliyor]}>
              {item.durum}
            </Text>
          </View>
        </View>
        
        <View style={styles.mesajKutusu}>
          <Text style={styles.kullaniciMesaji}>{item.mesaj}</Text>
        </View>

        {cevaplandiMi && item.adminCevabi && (
          <View style={styles.cevapKutusu}>
            <View style={styles.cevapBaslikSatiri}>
              <Ionicons name="headset" size={16} color="#2E7D32" />
              <Text style={styles.cevapBaslik}>Müşteri Hizmetleri</Text>
            </View>
            <Text style={styles.adminCevabi}>{item.adminCevabi}</Text>
          </View>
        )}
        
        <Text style={styles.tarihYazi}>
          {new Date(item.olusturulmaTarihi).toLocaleDateString('tr-TR')}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Üst Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.baslik}>Destek Merkezi</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Sekmeler (Tabs) */}
      <View style={styles.sekmeAlani}>
        <TouchableOpacity 
          style={[styles.sekmeButon, aktifSekme === 'yeni' && styles.sekmeAktif]} 
          onPress={() => setAktifSekme('yeni')}
        >
          <Text style={[styles.sekmeYazi, aktifSekme === 'yeni' && styles.sekmeYaziAktif]}>Bize Yazın</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.sekmeButon, aktifSekme === 'gecmis' && styles.sekmeAktif]} 
          onPress={() => setAktifSekme('gecmis')}
        >
          <Text style={[styles.sekmeYazi, aktifSekme === 'gecmis' && styles.sekmeYaziAktif]}>Mesajlarım</Text>
        </TouchableOpacity>
      </View>

      {/* 1. SEKME: YENİ MESAJ FORMU */}
      {aktifSekme === 'yeni' && (
        <View style={styles.formAlani}>
          <Text style={styles.etiket}>Konu Başlığı</Text>
          <TextInput 
            style={styles.input}
            placeholder="Örn: Siparişim Eksik Geldi"
            value={konu}
            onChangeText={setKonu}
          />

          <Text style={styles.etiket}>Mesajınız</Text>
          <TextInput 
            style={[styles.input, styles.textArea]}
            placeholder="Size nasıl yardımcı olabiliriz? Lütfen detayları yazın..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={mesaj}
            onChangeText={setMesaj}
          />

          <TouchableOpacity 
            style={[styles.gonderButon, gonderiliyor && { opacity: 0.7 }]} 
            onPress={destekTalebiGonder}
            disabled={gonderiliyor}
          >
            {gonderiliyor ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.gonderButonYazi}>Mesajı Gönder</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* 2. SEKME: GEÇMİŞ MESAJLAR */}
      {aktifSekme === 'gecmis' && (
        <View style={styles.listeAlani}>
          {yukleniyor ? (
            <ActivityIndicator size="large" color="#FFB800" style={{ marginTop: 50 }} />
          ) : (
            <FlatList 
              data={gecmisTalepler}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.bosListe}>
                  <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
                  <Text style={styles.bosListeMetni}>Henüz bir destek talebiniz bulunmuyor.</Text>
                </View>
              }
              renderItem={renderTalepKart}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  geriButon: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  baslik: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  
  // Sekmeler
  sekmeAlani: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  sekmeButon: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  sekmeAktif: { borderBottomColor: '#FFB800' },
  sekmeYazi: { fontSize: 15, fontWeight: '600', color: '#888' },
  sekmeYaziAktif: { color: '#FFB800', fontWeight: 'bold' },

  // Form Alanı
  formAlani: { padding: 20 },
  etiket: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 15, fontSize: 15, color: '#333' },
  textArea: { height: 150 },
  gonderButon: { backgroundColor: '#FFB800', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 25 },
  gonderButonYazi: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Liste Alanı
  listeAlani: { flex: 1, paddingHorizontal: 15, paddingTop: 15 },
  bosListe: { alignItems: 'center', marginTop: 60 },
  bosListeMetni: { fontSize: 15, color: '#888', marginTop: 15, textAlign: 'center' },

  // Kart Tasarımı
  talepKarti: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#eee', elevation: 2 },
  talepBaslikSatiri: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  talepKonu: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10 },
  durumRozet: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  durumBekliyor: { backgroundColor: '#FFF3E0' },
  durumCevaplandi: { backgroundColor: '#E8F5E9' },
  durumYazi: { fontSize: 12, fontWeight: 'bold' },
  durumYaziBekliyor: { color: '#FFB800' },
  durumYaziCevaplandi: { color: '#2E7D32' },
  
  mesajKutusu: { backgroundColor: '#F8F9FA', padding: 12, borderRadius: 8, marginBottom: 10 },
  kullaniciMesaji: { fontSize: 14, color: '#555', lineHeight: 20 },
  
  cevapKutusu: { backgroundColor: '#E8F5E9', padding: 12, borderRadius: 8, marginTop: 5, borderLeftWidth: 4, borderLeftColor: '#2E7D32' },
  cevapBaslikSatiri: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cevapBaslik: { fontSize: 13, fontWeight: 'bold', color: '#2E7D32', marginLeft: 6 },
  adminCevabi: { fontSize: 14, color: '#333', lineHeight: 20 },
  
  tarihYazi: { fontSize: 11, color: '#999', textAlign: 'right', marginTop: 10 }
});