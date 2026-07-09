import { API_CONFIG } from '@/config/api';
import { Siparis } from '@/types/Siparis';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Siparislerim() {
  const router = useRouter();
  const [siparisler, setSiparisler] = useState<Siparis[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLogged, setIsLogged] = useState(false);

  useFocusEffect(
    useCallback(() => {
      siparisleriGetir();
    }, [])
  );

  const siparisleriGetir = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setIsLogged(false);
        setLoading(false);
        return;
      }
      
      setIsLogged(true);
      const response = await axios.get(`${API_CONFIG.BASE_URL}/siparisler/gecmisim`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSiparisler(response.data);
    } catch (error) {
      console.error("Siparişler getirilemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const tarihFormatla = (tarihString: string) => {
    const tarih = new Date(tarihString);
    return tarih.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDurumStili = (durum: string) => {
    switch (durum) {
      case 'Hazırlanıyor':
        return { color: '#FFA500', bgColor: '#FFF3E0', icon: 'time-outline' };
      case 'Kargoya Verildi':
        return { color: '#1E90FF', bgColor: '#E6F2FF', icon: 'cube-outline' };
      case 'Tamamlandı':
        return { color: '#28A745', bgColor: '#E8F5E9', icon: 'checkmark-circle-outline' };
      default:
        return { color: '#6C757D', bgColor: '#F8F9FA', icon: 'information-circle-outline' };
    }
  };

  if (loading) {
    return (
      <View style={styles.merkez}>
        <ActivityIndicator size="large" color="#FFB800" />
      </View>
    );
  }

  if (!isLogged) {
    return (
      <View style={styles.merkez}>
        <Ionicons name="cube-outline" size={80} color="#ccc" />
        <Text style={styles.altMetin}>Siparişlerinizi görmek için giriş yapmalısınız.</Text>
        <TouchableOpacity style={styles.girisButon} onPress={() => router.push('/(auth)/giris' as any)}>
          <Text style={styles.girisButonYazi}>Giriş Yap</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const siparisKartiCiz = ({ item }: { item: Siparis }) => {
    const durumStil = getDurumStili(item.durum);

    return (
      <View style={styles.kart}>
        <View style={styles.kartUst}>
          <View>
            <Text style={styles.siparisNo}>Sipariş No: #{item.id}</Text>
            <Text style={styles.tarih}>{tarihFormatla(item.siparisTarihi)}</Text>
          </View>
          <View style={[styles.durumRozeti, { backgroundColor: durumStil.bgColor }]}>
            <Ionicons name={durumStil.icon as any} size={14} color={durumStil.color} style={{ marginRight: 4 }} />
            <Text style={[styles.durumYazi, { color: durumStil.color }]}>{item.durum}</Text>
          </View>
        </View>

        <View style={styles.urunlerAlani}>
          {item.urunler.map((urun, index) => (
            <View key={index} style={styles.urunSatiri}>
              {urun.resimUrl ? (
                <Image source={{ uri: urun.resimUrl }} style={styles.urunResim} />
              ) : (
                <View style={[styles.urunResim, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="image-outline" size={16} color="#ccc" />
                </View>
              )}
              <View style={styles.urunBilgi}>
                <Text style={styles.urunAd} numberOfLines={1}>{urun.ad}</Text>
                <Text style={styles.urunAdetFiyat}>
                  {urun.adet} adet x {urun.satinAlinanFiyat.toFixed(2)} TL
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* GÜNCELLENEN KISIM: Ödeme Yöntemi ve Adres eklendi */}
        <View style={styles.kartAlt}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toplamYazi}>Ödeme: {item.odemeYontemi}</Text>
            <Text style={styles.adresYazi} numberOfLines={1}>{item.teslimatAdresi}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.toplamYazi}>Toplam:</Text>
            <Text style={styles.toplamFiyat}>{item.toplamTutar.toFixed(2)} TL</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.sayfaBaslik}>Siparişlerim</Text>
      {siparisler.length === 0 ? (
        <View style={styles.bosDurum}>
          <Ionicons name="receipt-outline" size={80} color="#ccc" />
          <Text style={styles.bosMetin}>Henüz hiçbir siparişiniz bulunmamaktadır.</Text>
          <TouchableOpacity style={styles.alisveriseBaslaButon} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.alisveriseBaslaYazi}>Alışverişe Başla</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={siparisler}
          keyExtractor={(item) => item.id.toString()}
          renderItem={siparisKartiCiz}
          contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', paddingTop: 10 },
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  sayfaBaslik: { fontSize: 26, fontWeight: 'bold', color: '#333', marginBottom: 15, paddingHorizontal: 15 },
  altMetin: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 15, marginBottom: 25 },
  bosDurum: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  bosMetin: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 15, marginBottom: 25 },
  girisButon: { backgroundColor: 'orange', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10 },
  girisButonYazi: { fontWeight: 'bold', fontSize: 16, color: '#fff' },
  alisveriseBaslaButon: { backgroundColor: '#FFB800', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10 },
  alisveriseBaslaYazi: { fontWeight: 'bold', fontSize: 16, color: '#fff' },
  kart: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#eee', overflow: 'hidden' },
  kartUst: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  siparisNo: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  tarih: { fontSize: 12, color: '#888' },
  durumRozeti: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  durumYazi: { fontSize: 12, fontWeight: '600' },
  urunlerAlani: { padding: 15, paddingBottom: 5 },
  urunSatiri: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  urunResim: { width: 40, height: 40, borderRadius: 6, resizeMode: 'cover' },
  urunBilgi: { flex: 1, marginLeft: 12 },
  urunAd: { fontSize: 13, fontWeight: '500', color: '#444' },
  urunAdetFiyat: { fontSize: 12, color: '#777', marginTop: 2 },
  kartAlt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#FAFAFA', borderTopWidth: 1, borderTopColor: '#f5f5f5' },
  toplamYazi: { fontSize: 12, fontWeight: '600', color: '#555' },
  toplamFiyat: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  adresYazi: { fontSize: 11, color: '#888', marginTop: 3, fontStyle: 'italic' }
});