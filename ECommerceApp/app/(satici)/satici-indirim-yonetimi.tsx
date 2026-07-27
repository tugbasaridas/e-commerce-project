import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SaticiIndirimYonetimi() {
  const router = useRouter();
  const [urunler, setUrunler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');

  // Hangi ürünün indirim formunun açık olduğunu tutan state
  const [seciliUrunId, setSeciliUrunId] = useState<number | null>(null);
  
  // Form stateleri
  const [islemde, setIslemde] = useState(false);
  const [yeniFiyat, setYeniFiyat] = useState('');
  const [kampanyaSuresi, setKampanyaSuresi] = useState('24');

  useFocusEffect(
    useCallback(() => {
      urunleriGetir();
    }, [])
  );

  const urunleriGetir = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.get(`${API_CONFIG.BASE_URL}/satici/urunlerim`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // SADECE ONAYLI VE AKTİF ÜRÜNLERİ FİLTRELE
      const onayliUrunler = response.data.filter((u: any) => u.adminOnayliMi === true && u.aktifMi === true);
      setUrunler(onayliUrunler);
      
    } catch (error) {
      console.log("Ürünler getirilemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  // İndirim kutusunu açma/kapama fonksiyonu
  const kutuAcKapat = (urun: any) => {
    if (seciliUrunId === urun.id) {
      setSeciliUrunId(null); // Zaten açıksa kapat
    } else {
      setSeciliUrunId(urun.id); // Tıklananı aç
      setYeniFiyat(''); // Formu sıfırla
      setKampanyaSuresi('24');
    }
  };

  const hizliYuzdeUygula = (urun: any, yuzde: number) => {
    const hesaplananFiyat = urun.fiyat - (urun.fiyat * yuzde) / 100;
    setYeniFiyat(hesaplananFiyat.toFixed(2).toString());
  };

  const indirimUygula = async (urun: any) => {
    if (!yeniFiyat || isNaN(Number(yeniFiyat)) || !kampanyaSuresi || isNaN(Number(kampanyaSuresi))) {
      Alert.alert("Hata", "Lütfen geçerli bir fiyat ve süre girin.");
      return;
    }

    if (Number(yeniFiyat) >= urun.fiyat) {
      Alert.alert("Hata", "İndirimli fiyat asıl fiyattan daha düşük olmalıdır!");
      return;
    }

    setIslemde(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(`${API_CONFIG.BASE_URL}/satici/urun/${urun.id}/indirim`, {
        yeniFiyat: Number(yeniFiyat),
        saat: Number(kampanyaSuresi)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert("Başarılı", `${kampanyaSuresi} saatlik kampanya başarıyla başlatıldı!`);
      urunleriGetir(); // Listeyi güncelle
      setSeciliUrunId(null); // Kutuyu kapat
    } catch (error: any) {
      Alert.alert("Hata", "İndirim uygulanırken bir hata oluştu.");
    } finally {
      setIslemde(false);
    }
  };

  const indirimiKaldir = async (urunId: number) => {
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
              const token = await AsyncStorage.getItem('userToken');
              await axios.delete(`${API_CONFIG.BASE_URL}/satici/urun/${urunId}/indirim`, {
                headers: { Authorization: `Bearer ${token}` }
              });

              Alert.alert("Başarılı", "İndirim kampanyası sonlandırıldı!");
              urunleriGetir();
              setSeciliUrunId(null);
            } catch (error: any) {
              Alert.alert("Hata", "İndirim sonlandırılamadı.");
            } finally {
              setIslemde(false);
            }
          }
        }
      ]
    );
  };

  const filtrelenmisUrunler = urunler.filter(urun => 
    urun.ad.toLowerCase().includes(aramaMetni.toLowerCase())
  );

  const renderUrun = ({ item }: { item: any }) => {
    const isExpanded = seciliUrunId === item.id;
    const indirimYuzdesi = item.indirimliFiyat 
      ? Math.round(((item.fiyat - item.indirimliFiyat) / item.fiyat) * 100) 
      : 0;

    const anlikIndirimMiktari = (yeniFiyat && !isNaN(Number(yeniFiyat))) 
      ? (item.fiyat - Number(yeniFiyat)).toFixed(2) 
      : "0.00";
      
    const anlikIndirimYuzdesi = (yeniFiyat && !isNaN(Number(yeniFiyat)) && Number(yeniFiyat) < item.fiyat)
      ? Math.round(((item.fiyat - Number(yeniFiyat)) / item.fiyat) * 100)
      : 0;

    return (
      <View style={[styles.urunKart, isExpanded && styles.urunKartExpanded]}>
        {/* KARTIN ÜST KISMI (Özet) */}
        <TouchableOpacity activeOpacity={0.9} style={styles.kartUst} onPress={() => kutuAcKapat(item)}>
          <Image 
            source={{ uri: item.resimUrl || 'https://via.placeholder.com/150?text=Resim+Yok' }} 
            style={styles.urunResim} 
          />
          <View style={styles.urunBilgi}>
            <Text style={styles.urunAd} numberOfLines={2}>{item.ad}</Text>
            
            {item.indirimliFiyat ? (
              <View style={styles.aktifIndirimKutusuMini}>
                <Ionicons name="sparkles" size={12} color="#34C759" />
                <Text style={styles.aktifIndirimYaziMini}>%{indirimYuzdesi} İndirimde</Text>
              </View>
            ) : (
               <Text style={styles.urunKategori}>{item.kategori?.ad || 'Kategorisiz'}</Text>
            )}

            <View style={styles.altBilgiSatiri}>
              <View>
                {item.indirimliFiyat && <Text style={styles.eskiFiyat}>{item.fiyat} ₺</Text>}
                <Text style={styles.urunFiyat}>{item.indirimliFiyat ? item.indirimliFiyat : item.fiyat} ₺</Text>
              </View>
              <View style={[styles.stokKutusu, item.stok === 0 ? styles.stokBitti : null]}>
                <Text style={[styles.urunStok, item.stok === 0 ? styles.stokBittiYazi : null]}>
                  {item.stok === 0 ? 'Tükendi' : `Stok: ${item.stok}`}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.iconKutusu}>
            <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={24} color="#8E8E93" />
          </View>
        </TouchableOpacity>

        {/* KARTIN ALT KISMI (Açılan Form Alanı) */}
        {isExpanded && (
          <View style={styles.formAlani}>
            <View style={styles.ayirici} />
            
            {!item.indirimliFiyat ? (
              <View>
                <Text style={styles.etiketYazi}>Hızlı Oran Seçin:</Text>
                <View style={styles.hizliSecimKutusu}>
                  <TouchableOpacity style={styles.hizliButon} onPress={() => hizliYuzdeUygula(item, 10)}><Text style={styles.hizliButonYazi}>%10</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.hizliButon} onPress={() => hizliYuzdeUygula(item, 20)}><Text style={styles.hizliButonYazi}>%20</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.hizliButon} onPress={() => hizliYuzdeUygula(item, 30)}><Text style={styles.hizliButonYazi}>%30</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.hizliButon} onPress={() => hizliYuzdeUygula(item, 50)}><Text style={styles.hizliButonYazi}>%50</Text></TouchableOpacity>
                </View>

                <Text style={styles.etiketYazi}>İndirimli Fiyat (TL):</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: 99.90"
                  keyboardType="numeric"
                  value={yeniFiyat}
                  onChangeText={setYeniFiyat}
                />

                {yeniFiyat && Number(yeniFiyat) > 0 && Number(yeniFiyat) < item.fiyat ? (
                  <View style={styles.indirimOzetiKutusu}>
                    <Ionicons name="trending-down" size={16} color="#FF3B30" />
                    <Text style={styles.indirimOzetiYazi}>
                      Müşteri <Text style={{ fontWeight: 'bold' }}>{anlikIndirimMiktari} TL</Text> kazançlı. (%{anlikIndirimYuzdesi})
                    </Text>
                  </View>
                ) : null}

                <Text style={styles.etiketYazi}>Kampanya Süresi:</Text>
                <View style={styles.hizliSecimKutusu}>
                  <TouchableOpacity style={[styles.hizliSüreButon, kampanyaSuresi === '12' && styles.aktifSüreButon]} onPress={() => setKampanyaSuresi('12')}><Text style={[styles.hizliButonYazi, kampanyaSuresi === '12' && styles.aktifSüreYazi]}>12 Saat</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.hizliSüreButon, kampanyaSuresi === '24' && styles.aktifSüreButon]} onPress={() => setKampanyaSuresi('24')}><Text style={[styles.hizliButonYazi, kampanyaSuresi === '24' && styles.aktifSüreYazi]}>24 Saat</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.hizliSüreButon, kampanyaSuresi === '48' && styles.aktifSüreButon]} onPress={() => setKampanyaSuresi('48')}><Text style={[styles.hizliButonYazi, kampanyaSuresi === '48' && styles.aktifSüreYazi]}>48 Saat</Text></TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.kaydetButon} onPress={() => indirimUygula(item)} disabled={islemde}>
                  {islemde ? <ActivityIndicator color="#FFF" /> : <Text style={styles.kaydetButonYazi}>Kampanyayı Başlat</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.zatenIndirimdeKutusu}>
                <Text style={styles.zatenIndirimdeYazi}>Bu ürün şu an indirimde. Yeni bir kampanya başlatmak için önce mevcut indirimi kaldırmalısınız.</Text>
                <TouchableOpacity style={styles.kaldirButon} onPress={() => indirimiKaldir(item.id)} disabled={islemde}>
                  {islemde ? <ActivityIndicator color="#FFF" /> : <Text style={styles.kaldirButonYazi}>Kampanyayı Bitir</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.geriButon} onPress={() => router.replace('/(satici)/satici-anasayfa' as any)}>
          <Ionicons name="arrow-back" size={26} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İndirim Yönetimi</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.listeKonteyner}>
        <View style={styles.aramaKutusu}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.aramaInput}
            placeholder="İndirim yapılacak ürünü ara..."
            placeholderTextColor="#8E8E93"
            value={aramaMetni}
            onChangeText={setAramaMetni}
            autoCorrect={false}
          />
          {aramaMetni.length > 0 && (
            <TouchableOpacity onPress={() => setAramaMetni('')}>
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.listeBaslikKutusu}>
          <Text style={styles.listeBaslik}>Yayındaki Ürünleriniz ({filtrelenmisUrunler.length})</Text>
        </View>
        
        {loading ? <ActivityIndicator size="large" color="#34C759" style={{ marginTop: 50 }} /> : 
         filtrelenmisUrunler.length === 0 ? (
          <View style={styles.bosDurum}>
            <Ionicons name="pricetag-outline" size={60} color="#D1D1D6" />
            <Text style={styles.bosYazi}>{aramaMetni ? 'Aramanıza uygun ürün bulunamadı.' : 'İndirim yapabileceğiniz ürün yok.'}</Text>
          </View>
        ) : (
          <FlatList
            data={filtrelenmisUrunler}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderUrun}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15, backgroundColor: '#fff' },
  geriButon: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  
  listeKonteyner: { flex: 1, backgroundColor: '#F8F9FA', paddingHorizontal: 20, paddingTop: 20 },
  aramaKutusu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, height: 46, marginBottom: 20, borderWidth: 1, borderColor: '#E5E5EA' },
  aramaInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#1C1C1E' },
  listeBaslikKutusu: { marginBottom: 15 },
  listeBaslik: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' },
  
  urunKart: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E5EA', overflow: 'hidden' },
  urunKartExpanded: { borderColor: '#34C759', shadowColor: '#34C759', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  
  kartUst: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  urunResim: { width: 70, height: 70, borderRadius: 10, backgroundColor: '#F2F2F7', marginRight: 12 },
  urunBilgi: { flex: 1, paddingRight: 10 },
  urunAd: { fontSize: 14, fontWeight: '700', color: '#1C1C1E', marginBottom: 4 },
  
  aktifIndirimKutusuMini: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  aktifIndirimYaziMini: { fontSize: 10, fontWeight: '700', color: '#2E7D32', marginLeft: 4 },
  
  urunKategori: { fontSize: 12, color: '#8E8E93' },
  altBilgiSatiri: { flexDirection: 'row', alignItems: 'center', marginTop: 8, justifyContent: 'space-between' },
  urunFiyat: { fontSize: 16, color: 'orange', fontWeight: 'bold' },
  eskiFiyat: { fontSize: 12, color: '#8E8E93', textDecorationLine: 'line-through', marginBottom: 2 },
  
  stokKutusu: { backgroundColor: '#F2F2F7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  stokBitti: { backgroundColor: '#FFF0F0' },
  urunStok: { fontSize: 12, color: '#1C1C1E', fontWeight: '500' },
  stokBittiYazi: { color: '#FF3B30', fontWeight: '700' },
  
  iconKutusu: { padding: 5, justifyContent: 'center', alignItems: 'center' },
  
  formAlani: { padding: 15, backgroundColor: '#FAFAFA' },
  ayirici: { height: 1, backgroundColor: '#E5E5EA', marginBottom: 15 },
  
  etiketYazi: { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginBottom: 8 },
  hizliSecimKutusu: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  hizliButon: { flex: 1, backgroundColor: '#E8F5E9', paddingVertical: 10, borderRadius: 8, marginHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: '#C8E6C9' },
  hizliButonYazi: { color: '#2E7D32', fontWeight: '700', fontSize: 13 },
  
  hizliSüreButon: { flex: 1, backgroundColor: '#FFFFFF', paddingVertical: 10, borderRadius: 8, marginHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: '#E5E5EA' },
  aktifSüreButon: { backgroundColor: '#FF9F00', borderColor: '#FF9F00' },
  aktifSüreYazi: { color: '#FFF' },

  indirimOzetiKutusu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F0', padding: 10, borderRadius: 8, marginBottom: 15 },
  indirimOzetiYazi: { fontSize: 12, color: '#FF3B30', marginLeft: 6, flex: 1 },

  input: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 15, backgroundColor: '#FFFFFF', color: '#1C1C1E' },
  kaydetButon: { backgroundColor: '#34C759', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 5 },
  kaydetButonYazi: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  
  zatenIndirimdeKutusu: { alignItems: 'center', paddingVertical: 10 },
  zatenIndirimdeYazi: { fontSize: 13, color: '#8E8E93', textAlign: 'center', marginBottom: 15 },
  kaldirButon: { backgroundColor: '#EF233C', paddingVertical: 14, borderRadius: 10, alignItems: 'center', width: '100%' },
  kaldirButonYazi: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },

  bosDurum: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  bosYazi: { color: '#8E8E93', fontSize: 15, marginTop: 12, fontWeight: '500', textAlign: 'center' }
});