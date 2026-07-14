import { API_CONFIG } from '@/config/api';
import { SepetUrun } from '@/types/Sepet';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, LayoutAnimation, Platform, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Sepet() {
  const router = useRouter();
  const [sepet, setSepet] = useState<SepetUrun[]>([]);
  const [loading, setLoading] = useState(true);
  const [aramaAktif, setAramaAktif] = useState(false);
  const [aramaMetni, setAramaMetni] = useState('');

  useFocusEffect(
    useCallback(() => { sepetiGetir(); }, [])
  );

  const sepetiGetir = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) { setLoading(false); return; }
      const response = await axios.get(`${API_CONFIG.BASE_URL}/sepet`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSepet(response.data);
    } catch (error) {
      console.error("Sepet yükleme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const sepettenSil = async (id: number) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.delete(`${API_CONFIG.BASE_URL}/sepet/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSepet(prev => prev.filter(item => item.id !== id));
    } catch (error) { Alert.alert("Hata", "Silme işlemi başarısız."); }
  };

  const miktarGuncelle = async (item: SepetUrun, islem: 'artir' | 'azalt') => {
    const yeniMiktar = islem === 'artir' ? item.miktar + 1 : item.miktar - 1;
    if (yeniMiktar < 1) {
      Alert.alert("Ürünü Sil", "Bu ürünü sepetten çıkarmak istiyor musunuz?", [
        { text: "İptal", style: "cancel" },
        { text: "Sil", onPress: () => sepettenSil(item.id), style: "destructive" }
      ]);
      return;
    }
    setSepet(prev => prev.map(s => s.id === item.id ? { ...s, miktar: yeniMiktar } : s));
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(`${API_CONFIG.BASE_URL}/sepet/${item.id}`, { miktar: yeniMiktar }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) { sepetiGetir(); }
  };

  const handleSatinAl = async () => {
    if (sepet.length === 0) { Alert.alert('Hata', 'Sepetiniz boş!'); return; }
    const token = await AsyncStorage.getItem('userToken');
    if (!token) { router.push('/(auth)/giris' as any); return; }
    router.push({ pathname: '/odeme', params: { tutar: toplamTutar.toFixed(2) } });
  };

  const filtrelenmisSepet = sepet.filter(item => item.urunler?.ad?.toLowerCase().includes(aramaMetni.toLowerCase()));

  const toplamTutar = sepet.reduce((total, item) => {
    const fiyat = item.urunler?.indirimliFiyat ?? item.urunler?.fiyat ?? 0;
    return total + (fiyat * item.miktar);
  }, 0);

  if (loading) return <View style={styles.merkez}><ActivityIndicator size="large" color="#FFB800" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerSatiri}>
        <Text style={styles.sayfaBaslik}>Sepetim</Text>
        {sepet.length > 0 && (
          <TouchableOpacity onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setAramaAktif(!aramaAktif); }} style={styles.aramaIkonButon}>
            <Ionicons name={aramaAktif ? "close" : "search"} size={26} color="#333" />
          </TouchableOpacity>
        )}
      </View>

      {aramaAktif && (
        <View style={styles.aramaKutusu}>
          <Ionicons name="search" size={20} color="#888" style={{ marginRight: 10 }} />
          <TextInput style={styles.aramaInput} placeholder="Sepette ürün ara..." value={aramaMetni} onChangeText={setAramaMetni} autoFocus={true} />
        </View>
      )}

      {sepet.length === 0 ? (
        <View style={styles.merkez}>
          <Ionicons name="cart-outline" size={80} color="#ccc" />
          <Text style={styles.altMetin}>Sepetiniz şu anda boş.</Text>
          <TouchableOpacity style={styles.alisveriseBaslaButon} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.alisveriseBaslaYazi}>Alışverişe Başla</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={filtrelenmisSepet}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 15 }}
            renderItem={({ item }) => {
              const indirimVarmi = item.urunler?.indirimliFiyat && item.urunler.indirimliFiyat < item.urunler.fiyat;
              const guncelFiyat = (indirimVarmi ? item.urunler.indirimliFiyat : item.urunler?.fiyat) ?? 0;

              return (
                <View style={styles.kart}>
                  <Image source={{ uri: item.urunler?.resimUrl || 'https://via.placeholder.com/150' }} style={styles.resim} />
                  <View style={styles.bilgiAlani}>
                    <Text style={styles.urunAd} numberOfLines={2}>{item.urunler?.ad}</Text>
                    <View style={styles.fiyatSatiri}>
                      {indirimVarmi ? (
                        <>
                          <Text style={styles.eskiFiyat}>{item.urunler.fiyat.toFixed(2)} TL</Text>
                          <Text style={styles.guncelFiyat}>{guncelFiyat.toFixed(2)} TL</Text>
                        </>
                      ) : (
                        <Text style={styles.fiyat}>{guncelFiyat.toFixed(2)} TL</Text>
                      )}
                    </View>
                    <View style={styles.aksiyonSatiri}>
                      <View style={styles.miktarAyarlayici}>
                        <TouchableOpacity onPress={() => miktarGuncelle(item, 'azalt')} style={styles.miktarButon}><Ionicons name="remove" size={20} color="#333" /></TouchableOpacity>
                        <Text style={styles.miktarYazi}>{item.miktar}</Text>
                        <TouchableOpacity onPress={() => miktarGuncelle(item, 'artir')} style={styles.miktarButon}><Ionicons name="add" size={20} color="#333" /></TouchableOpacity>
                      </View>
                      <TouchableOpacity onPress={() => sepettenSil(item.id)} style={styles.silButon}><Ionicons name="trash" size={22} color="#ccc" /></TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }}
          />
          <View style={styles.altSabitAlan}>
            <View style={styles.toplamSatiri}>
              <Text style={styles.toplamEtiket}>Toplam</Text>
              <Text style={styles.toplamFiyat}>{toplamTutar.toFixed(2)} TL</Text>
            </View>
            <TouchableOpacity style={styles.odemeButon} onPress={handleSatinAl}><Text style={styles.odemeButonYazi}>Satın Al</Text></TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  headerSatiri: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  sayfaBaslik: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  aramaIkonButon: { padding: 8, backgroundColor: '#eee', borderRadius: 20 },
  aramaKutusu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F5', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 10, marginHorizontal: 20, marginBottom: 10 },
  aramaInput: { flex: 1, fontSize: 16, color: '#333' },
  kart: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, marginBottom: 15, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  resim: { width: 80, height: 100, borderRadius: 8, resizeMode: 'cover' },
  bilgiAlani: { flex: 1, marginLeft: 15, justifyContent: 'space-between' },
  urunAd: { fontSize: 15, fontWeight: '600', color: '#333' },
  fiyatSatiri: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  fiyat: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  guncelFiyat: { fontSize: 16, fontWeight: 'bold', color: '#ff4757' },
  eskiFiyat: { fontSize: 13, color: '#999', textDecorationLine: 'line-through' },
  aksiyonSatiri: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  miktarAyarlayici: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 20 },
  miktarButon: { paddingHorizontal: 12, paddingVertical: 6 },
  miktarYazi: { fontSize: 16, fontWeight: '600', paddingHorizontal: 8 },
  silButon: { padding: 5 },
  altSabitAlan: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderColor: '#eee', paddingBottom: 30 },
  toplamSatiri: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  toplamEtiket: { fontSize: 16, color: '#666', fontWeight: '500' },
  toplamFiyat: { fontSize: 22, fontWeight: 'bold', color: '#111' },
  odemeButon: { backgroundColor: '#FFB800', paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  odemeButonYazi: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  altMetin: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 15, marginBottom: 25 },
  alisveriseBaslaButon: { backgroundColor: '#FFB800', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10 },
  alisveriseBaslaYazi: { fontWeight: 'bold', fontSize: 16, color: '#fff' }
});