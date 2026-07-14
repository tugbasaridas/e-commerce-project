import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
    if (!yeniFiyat || isNaN(Number(yeniFiyat))) {
      Alert.alert("Hata", "Lütfen geçerli bir indirimli fiyat girin.");
      return;
    }

    if (Number(yeniFiyat) >= (urun?.fiyat || 0)) {
      Alert.alert("Hata", "İndirimli fiyat asıl fiyattan daha düşük olmalıdır!");
      return;
    }

    setIslemde(true);
    try {
      await api.post(`/admin/urunler/${id}/indirim-yap`, {
        yeniFiyat: Number(yeniFiyat)
      });
      Alert.alert("Başarılı", "1 günlük indirim kampanyası başarıyla başlatıldı!");
      urunDetayGetir(); // Sayfayı güncelle
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
      "Bu üründeki indirimi sonlandırmak ve liste fiyatına geri dönmek istiyor musunuz?",
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kampanya Yönetimi</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Ürün Bilgi Kartı */}
      <View style={styles.urunKutusu}>
        <Image source={{ uri: urun.resimUrl || 'https://via.placeholder.com/150' }} style={styles.urunResim} />
        <View style={styles.urunDetay}>
          <Text style={styles.urunKategori}>{urun.kategori?.ad || 'Kategorisiz'}</Text>
          <Text style={styles.urunAd}>{urun.ad}</Text>
          <Text style={styles.urunFiyat}>Liste Fiyatı: {urun.fiyat.toFixed(2)} TL</Text>
        </View>
      </View>

      {/* Durum Panelleri */}
      {urun.indirimliFiyat ? (
        <View style={styles.aktifIndirimKutusu}>
          <Ionicons name="sparkles" size={24} color="#34C759" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.aktifIndirimBaslik}>Bu Ürün Şu An İndirimde!</Text>
            <Text style={styles.aktifIndirimDetay}>
              İndirimli Fiyat: <Text style={{ fontWeight: 'bold' }}>{urun.indirimliFiyat.toFixed(2)} TL</Text> (%{indirimYuzdesi} İndirim)
            </Text>
            <Text style={styles.süreBilgisi}>Kampanya süresi: 24 Saat (Otomatik Sona Erer)</Text>
          </View>
        </View>
      ) : (
        <View style={styles.normalDurumKutusu}>
          <Ionicons name="alert-circle-outline" size={24} color="#8E8E93" style={{ marginRight: 10 }} />
          <Text style={styles.normalDurumMetni}>Bu üründe aktif bir indirim kampanyası bulunmuyor.</Text>
        </View>
      )}

      {/* Aksiyon Alanı */}
      <View style={styles.aksiyonKapsayici}>
        {!urun.indirimliFiyat ? (
          <View>
            <Text style={styles.aksiyonBaslik}>Yeni Kampanya Başlat</Text>
            <Text style={styles.aksiyonAciklama}>
              Belirleyeceğiniz indirimli fiyat sisteme girildikten sonra kampanya otomatik olarak <Text style={{ fontWeight: 'bold' }}>24 saat (1 gün)</Text> boyunca aktif kalacaktır.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="İndirimli Fiyatı Girin (Örn: 120.50)"
              keyboardType="numeric"
              value={yeniFiyat}
              onChangeText={setYeniFiyat}
              editable={!islemde}
            />
            <TouchableOpacity style={styles.kaydetButon} onPress={indirimUygula} disabled={islemde}>
              {islemde ? <ActivityIndicator color="#FFF" /> : <Text style={styles.kaydetButonYazi}>Kampanyayı Başlat (1 Gün)</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.aksiyonBaslik}>Kampanyayı Yönet</Text>
            <Text style={styles.aksiyonAciklama}>
              Mevcut indirimi süresi dolmadan önce manuel olarak sonlandırabilir ve ürünü orijinal liste fiyatına geri döndürebilirsiniz.
            </Text>
            <TouchableOpacity style={styles.kaldirButon} onPress={indirimiKaldir} disabled={islemde}>
              {islemde ? <ActivityIndicator color="#FFF" /> : <Text style={styles.kaldirButonYazi}>İndirimi Kaldır ve Normale Dön</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  geriButon: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  urunKutusu: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 15, margin: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA', alignItems: 'center' },
  urunResim: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#F0F0F0' },
  urunDetay: { flex: 1, marginLeft: 15 },
  urunKategori: { fontSize: 11, color: '#8E8E93', fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  urunAd: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 6 },
  urunFiyat: { fontSize: 14, fontWeight: '600', color: '#48484A' },
  aktifIndirimKutusu: { flexDirection: 'row', backgroundColor: '#E8F5E9', padding: 15, marginHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: '#C8E6C9', alignItems: 'center' },
  aktifIndirimBaslik: { fontSize: 15, fontWeight: '700', color: '#2E7D32', marginBottom: 2 },
  aktifIndirimDetay: { fontSize: 13, color: '#4CAF50' },
  süreBilgisi: { fontSize: 11, color: '#388E3C', marginTop: 4, fontStyle: 'italic' },
  normalDurumKutusu: { flexDirection: 'row', backgroundColor: '#F2F2F7', padding: 15, marginHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA', alignItems: 'center' },
  normalDurumMetni: { flex: 1, fontSize: 13, color: '#8E8E93', fontWeight: '500' },
  aksiyonKapsayici: { backgroundColor: '#FFFFFF', padding: 20, margin: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA' },
  aksiyonBaslik: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 8 },
  aksiyonAciklama: { fontSize: 13, color: '#8E8E93', lineHeight: 18, marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20, backgroundColor: '#F8F9FA', color: '#1C1C1E' },
  kaydetButon: { backgroundColor: '#34C759', paddingVertical: 14, borderRadius: 10, alignItems: 'center', shadowColor: '#34C759', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  kaydetButonYazi: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  kaldirButon: { backgroundColor: '#EF233C', paddingVertical: 14, borderRadius: 10, alignItems: 'center', shadowColor: '#EF233C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  kaldirButonYazi: { color: '#FFF', fontSize: 15, fontWeight: 'bold' }
});