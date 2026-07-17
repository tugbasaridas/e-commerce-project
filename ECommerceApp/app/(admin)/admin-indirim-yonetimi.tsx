import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from '../../config/api';

interface Urun {
  id: number;
  ad: string;
  fiyat: number;
  indirimliFiyat?: number | null;
  resimUrl: string;
  kategori: { ad: string } | null;
}

export default function AdminIndirimYonetimi() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [urun, setUrun] = useState<Urun | null>(null);
  const [loading, setLoading] = useState(true);
  const [islemde, setIslemde] = useState(false);
  const [yeniFiyat, setYeniFiyat] = useState('');
  const [kampanyaSüresi, setKampanyaSüresi] = useState('24'); // YENİ: Süre state'i

  useEffect(() => {
    urunDetayGetir();
  }, [id]);

  const urunDetayGetir = async () => {
    try {
      const response = await api.get(`/urunler/${id}`);
      setUrun(response.data);
    } catch (error) {
      Alert.alert("Hata", "Ürün bilgileri yüklenemedi.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const indirimUygula = async () => {
    if (!yeniFiyat || isNaN(Number(yeniFiyat)) || !kampanyaSüresi || isNaN(Number(kampanyaSüresi))) {
      Alert.alert("Hata", "Lütfen geçerli bir fiyat ve süre girin.");
      return;
    }

    if (Number(yeniFiyat) >= (urun?.fiyat || 0)) {
      Alert.alert("Hata", "İndirimli fiyat asıl fiyattan daha düşük olmalıdır!");
      return;
    }

    setIslemde(true);
    try {
      await api.post(`/admin/urunler/${id}/indirim-yap`, {
        yeniFiyat: Number(yeniFiyat),
        saat: Number(kampanyaSüresi) // Backend'e saat gönderiliyor
      });
      Alert.alert("Başarılı", `${kampanyaSüresi} saatlik kampanya başarıyla başlatıldı!`);
      urunDetayGetir();
      setYeniFiyat('');
    } catch (error: any) {
      Alert.alert("Hata", error.response?.data?.mesaj || "İndirim uygulanırken bir hata oluştu.");
    } finally {
      setIslemde(false);
    }
  };

  const indirimiKaldir = async () => {
    Alert.alert(
      "İndirimi Kaldır",
      "Bu üründeki indirimi sonlandırmak istiyor musunuz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Kampanyayı Bitir",
          style: "destructive",
          onPress: async () => {
            setIslemde(true);
            try {
              await api.post(`/admin/urunler/${id}/indirim-kaldir`);
              Alert.alert("Başarılı", "İndirim kampanyası sonlandırıldı!");
              urunDetayGetir();
            } catch (error) {
              Alert.alert("Hata", "İndirim sonlandırılamadı.");
            } finally {
              setIslemde(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.merkez}>
        <ActivityIndicator size="large" color="#FF9F00" />
      </View>
    );
  }

  if (!urun) return null;

  const indirimYuzdesi = urun.indirimliFiyat 
    ? Math.round(((urun.fiyat - urun.indirimliFiyat) / urun.fiyat) * 100) 
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kampanya Yönetimi</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.urunKutusu}>
        <Image source={{ uri: urun.resimUrl || 'https://via.placeholder.com/150' }} style={styles.urunResim} />
        <View style={styles.urunDetay}>
          <Text style={styles.urunKategori}>{urun.kategori?.ad || 'Kategorisiz'}</Text>
          <Text style={styles.urunAd}>{urun.ad}</Text>
          <Text style={styles.urunFiyat}>Liste Fiyatı: {urun.fiyat.toFixed(2)} TL</Text>
        </View>
      </View>

      {urun.indirimliFiyat ? (
        <View style={styles.aktifIndirimKutusu}>
          <Ionicons name="sparkles" size={24} color="#34C759" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.aktifIndirimBaslik}>Bu Ürün Şu An İndirimde!</Text>
            <Text style={styles.aktifIndirimDetay}>
              İndirimli Fiyat: <Text style={{ fontWeight: 'bold' }}>{urun.indirimliFiyat.toFixed(2)} TL</Text> (%{indirimYuzdesi} İndirim)
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.normalDurumKutusu}>
          <Ionicons name="alert-circle-outline" size={24} color="#8E8E93" style={{ marginRight: 10 }} />
          <Text style={styles.normalDurumMetni}>Bu üründe aktif bir indirim kampanyası bulunmuyor.</Text>
        </View>
      )}

      <View style={styles.aksiyonKapsayici}>
        {!urun.indirimliFiyat ? (
          <View>
            <Text style={styles.aksiyonBaslik}>Yeni Kampanya Başlat</Text>
            <TextInput
              style={styles.input}
              placeholder="İndirimli Fiyatı Girin"
              keyboardType="numeric"
              value={yeniFiyat}
              onChangeText={setYeniFiyat}
            />
            <TextInput
              style={styles.input}
              placeholder="Kampanya Süresi (Saat)"
              keyboardType="numeric"
              value={kampanyaSüresi}
              onChangeText={setKampanyaSüresi}
            />
            <TouchableOpacity style={styles.kaydetButon} onPress={indirimUygula} disabled={islemde}>
              {islemde ? <ActivityIndicator color="#FFF" /> : <Text style={styles.kaydetButonYazi}>Kampanyayı Başlat</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.aksiyonBaslik}>Kampanyayı Yönet</Text>
            <TouchableOpacity style={styles.kaldirButon} onPress={indirimiKaldir} disabled={islemde}>
              {islemde ? <ActivityIndicator color="#FFF" /> : <Text style={styles.kaldirButonYazi}>İndirimi Kaldır</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, backgroundColor: '#FFFFFF' },
  geriButon: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  urunKutusu: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 15, margin: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA' },
  urunResim: { width: 80, height: 80, borderRadius: 8 },
  urunDetay: { flex: 1, marginLeft: 15 },
  urunKategori: { fontSize: 11, color: '#8E8E93', textTransform: 'uppercase' },
  urunAd: { fontSize: 16, fontWeight: '700' },
  urunFiyat: { fontSize: 14, fontWeight: '600' },
  aktifIndirimKutusu: { flexDirection: 'row', backgroundColor: '#E8F5E9', padding: 15, marginHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: '#C8E6C9' },
  aktifIndirimBaslik: { fontSize: 15, fontWeight: '700', color: '#2E7D32' },
  aktifIndirimDetay: { fontSize: 13, color: '#4CAF50' },
  normalDurumKutusu: { flexDirection: 'row', backgroundColor: '#F2F2F7', padding: 15, marginHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA' },
  normalDurumMetni: { flex: 1, fontSize: 13, color: '#8E8E93' },
  aksiyonKapsayici: { backgroundColor: '#FFFFFF', padding: 20, margin: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA' },
  aksiyonBaslik: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 15, backgroundColor: '#F8F9FA' },
  kaydetButon: { backgroundColor: '#34C759', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  kaydetButonYazi: { color: '#FFF', fontWeight: 'bold' },
  kaldirButon: { backgroundColor: '#EF233C', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  kaldirButonYazi: { color: '#FFF', fontWeight: 'bold' }
});