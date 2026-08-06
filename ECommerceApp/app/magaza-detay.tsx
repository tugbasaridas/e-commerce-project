import TakipEtButonu from '@/components/TakipButonu';
import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MagazaDetay() {
  const { magazaId } = useLocalSearchParams();
  const router = useRouter();
  const [magazaVeri, setMagazaVeri] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (magazaId) magazaBilgileriniGetir();
  }, [magazaId]);

  const magazaBilgileriniGetir = async () => {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/kupon/detay/${magazaId}`);
      setMagazaVeri(response.data);
    } catch (e) {
      console.log("Mağaza bilgisi alınamadı");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={styles.merkez}><ActivityIndicator size="large" color="#FF9F00" /></View>;

  // KRİTİK FİLTRE: "TAKIP" ile başlayan otomatik kuponları vitrinden gizliyoruz. 
  // (API'den dönen isme göre 'kodu' veya 'kuponKodu' alanına bakıyoruz)
  const vitrinKuponlari = magazaVeri?.kuponlar?.filter((k: any) => {
    const kod = k.kuponKodu || k.kodu || "";
    return !kod.toUpperCase().startsWith("TAKIP");
  }) || [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
        <Text style={styles.headerBaslik}>{magazaVeri?.magazaAdi || "Mağaza"}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 15 }}>
        {/* Mağaza Özet & Takip Butonu */}
        <View style={styles.magazaKarti}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.magazaAdiBuyuk}>{magazaVeri?.magazaAdi}</Text>
            <Text style={styles.magazaAciklama}>Resmi Mağaza ve Ürünleri</Text>
          </View>
          <TakipEtButonu magazaId={Number(magazaId)} />
        </View>

        {/* Mağazanın Aktif Kuponları (Vitrin) */}
        {vitrinKuponlari.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.bolumBaslik}>Mağaza Kuponları & İndirimleri 🎁</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {vitrinKuponlari.map((kupon: any, index: number) => (
                <View key={index} style={styles.kuponKutu}>
                  <Text style={styles.kuponIndirim}>
                    {kupon.indirimTipi === 'Yuzde' ? `%${kupon.indirimDegeri}` : `${kupon.indirimDegeri} TL`} İndirim
                  </Text>
                  {/* Backend'den gelen veriye göre kuponKodu veya kodu kullanıyoruz */}
                  <Text style={styles.kuponKod}>{kupon.kuponKodu || kupon.kodu}</Text>
                  <Text style={styles.kuponLimit}>Min. {kupon.altLimit} TL alışverişte</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Mağazanın Ürünleri */}
        <Text style={styles.bolumBaslik}>Mağazanın Ürünleri ({magazaVeri?.urunler?.length || 0})</Text>
        <View style={styles.urunGrid}>
          {magazaVeri?.urunler?.map((urun: any) => {
            const indirimVarmi = urun.indirimliFiyat && urun.indirimliFiyat < urun.fiyat;
            const guncelFiyat = (indirimVarmi ? urun.indirimliFiyat : urun.fiyat) ?? 0;

            return (
              <TouchableOpacity 
                key={urun.id} 
                style={styles.urunKarti} 
                onPress={() => router.push({ pathname: '/detay', params: { id: urun.id } })}
              >
                <Image source={{ uri: urun.resimUrl || 'https://via.placeholder.com/150' }} style={styles.urunResim} />
                <Text style={styles.urunAd} numberOfLines={2}>{urun.ad}</Text>
                
                <View style={styles.urunFiyatAlani}>
                  {indirimVarmi ? (
                    <View>
                      <Text style={styles.eskiFiyat}>{urun.fiyat.toFixed(2)} TL</Text>
                      <Text style={styles.yeniFiyat}>{guncelFiyat.toFixed(2)} TL</Text>
                    </View>
                  ) : (
                    <Text style={styles.normalFiyat}>{guncelFiyat.toFixed(2)} TL</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#FFF' },
  headerBaslik: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  magazaKarti: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 12, marginBottom: 20 },
  magazaAdiBuyuk: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  magazaAciklama: { fontSize: 13, color: '#666', marginTop: 4 },
  bolumBaslik: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  kuponKutu: { backgroundColor: '#FFF3E0', borderWidth: 1, borderColor: '#FFE0B2', padding: 12, borderRadius: 10, width: 160 },
  kuponIndirim: { fontSize: 16, fontWeight: '900', color: '#FF9F00' },
  kuponKod: { fontSize: 14, fontWeight: 'bold', color: '#333', marginTop: 4 },
  kuponLimit: { fontSize: 11, color: '#666', marginTop: 2 },
  urunGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  urunKarti: { width: '48%', backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 15, borderWidth: 1, borderColor: '#EEE' },
  urunResim: { width: '100%', height: 140, borderRadius: 8, resizeMode: 'cover', marginBottom: 8 },
  urunAd: { fontSize: 13, fontWeight: '600', color: '#333', height: 36 },
  urunFiyatAlani: { marginTop: 4 },
  normalFiyat: { fontSize: 15, fontWeight: 'bold', color: '#FF9F00' },
  yeniFiyat: { fontSize: 15, fontWeight: 'bold', color: '#FF4757' },
  eskiFiyat: { fontSize: 12, color: '#999', textDecorationLine: 'line-through' }
});