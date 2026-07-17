import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import api from '../../config/api';

interface Urun {
  id: number;
  ad: string;
  resimUrl: string;
  stok: number | null; // Stok null gelebilir diye güncelledik
  fiyat: number;
  kategori: { ad: string } | null;
}

export default function AdminStokYonetimi() {
  const router = useRouter();
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [aramaMetni, setAramaMetni] = useState('');
  const [sadeceKritik, setSadeceKritik] = useState(false); 

  const [taslakStoklar, setTaslakStoklar] = useState<{ [key: number]: string }>({});
  const [islemdekiId, setIslemdekiId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      urunleriGetir();
    }, [])
  );

  const urunleriGetir = async () => {
    try {
      const response = await api.get('/urunler');
      setUrunler(response.data);
      
      const ilkStoklar: { [key: number]: string } = {};
      response.data.forEach((urun: Urun) => {
        // GÜVENLİK KALKANI: Stok null gelirse 0 kabul et ve öyle çevir
        ilkStoklar[urun.id] = (urun.stok || 0).toString();
      });
      setTaslakStoklar(ilkStoklar);
    } catch (error) {
      console.error("Stok verileri çekilirken hata:", error);
      Alert.alert("Hata", "Ürünler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const stokDegistir = (id: number, miktar: number) => {
    setTaslakStoklar(prev => {
      const mevcut = parseInt(prev[id] || '0', 10);
      const yeni = Math.max(0, mevcut + miktar); 
      return { ...prev, [id]: yeni.toString() };
    });
  };

  const inputDegistir = (id: number, deger: string) => {
    const temizDeger = deger.replace(/[^0-9]/g, '');
    setTaslakStoklar(prev => ({ ...prev, [id]: temizDeger }));
  };

  const stokKaydet = async (id: number) => {
    const yeniStokAdedi = parseInt(taslakStoklar[id] || '0', 10);
    
    setIslemdekiId(id);
    try {
      const response = await api.get(`/urunler/${id}`);
      const mevcutUrunDetay = response.data;

      const guncelUrunData = {
        ad: mevcutUrunDetay.ad,
        aciklama: mevcutUrunDetay.aciklama || "Açıklama girilmedi.",
        fiyat: mevcutUrunDetay.fiyat,
        stok: yeniStokAdedi,
        resimUrl: mevcutUrunDetay.resimUrl || "https://via.placeholder.com/150",
        kategoriId: mevcutUrunDetay.kategoriId
      };

      await api.put(`/urunler/${id}`, guncelUrunData);
      
      setUrunler(prev => 
        prev.map(urun => urun.id === id ? { ...urun, stok: yeniStokAdedi } : urun)
      );

      Alert.alert("Başarılı", "Stok başarıyla güncellendi!");
    } catch (error) {
      Alert.alert("Hata", "Stok güncellenemedi.");
    } finally {
      setIslemdekiId(null);
    }
  };

  const getStokDurumu = (stok: number) => {
    if (stok === 0) return { renk: '#EF233C', metin: 'Tükendi', bg: '#FFEBEA' };
    if (stok <= 5) return { renk: '#FF9F00', metin: 'Kritik Seviye', bg: '#FFF4E5' };
    return { renk: '#28A745', metin: 'Yeterli', bg: '#F0FDF4' };
  };

  const filtrelenmisUrunler = urunler.filter(urun => {
    const adUyumlu = urun.ad.toLowerCase().includes(aramaMetni.toLowerCase());
    // GÜVENLİK KALKANI: Filtreleme sırasında da null kontrolü
    const stokUyumlu = sadeceKritik ? (urun.stok || 0) <= 5 : true;
    return adUyumlu && stokUyumlu;
  });

  const renderUrun = ({ item }: { item: Urun }) => {
    // GÜVENLİK KALKANI: Render sırasında null gelirse 0 göster
    const mevcutStok = item.stok || 0; 
    const durum = getStokDurumu(mevcutStok);
    const guncelTaslak = taslakStoklar[item.id] || '0';
    const degistiMi = parseInt(guncelTaslak, 10) !== mevcutStok; 
    const yukleniyor = islemdekiId === item.id;

    return (
      <View style={styles.urunKart}>
        <View style={styles.kartUst}>
          <Image 
            source={{ uri: item.resimUrl || 'https://via.placeholder.com/150' }} 
            style={styles.urunResim} 
          />
          <View style={styles.urunBilgi}>
            <Text style={styles.urunKategori}>{item.kategori?.ad || 'Kategorisiz'}</Text>
            <Text style={styles.urunAd} numberOfLines={1}>{item.ad}</Text>
            <Text style={styles.urunFiyat}>{item.fiyat.toFixed(2)} TL</Text>
          </View>
          
          <View style={[styles.durumBadge, { backgroundColor: durum.bg }]}>
            <Text style={[styles.durumYazi, { color: durum.renk }]}>{durum.metin}</Text>
          </View>
        </View>

        <View style={styles.ayirici} />

        <View style={styles.kartAlt}>
          <View style={styles.mevcutStokAlani}>
            <Text style={styles.stokEtiket}>Mevcut:</Text>
            <Text style={[styles.stokSayi, { color: durum.renk }]}>{mevcutStok} Adet</Text>
          </View>

          <View style={styles.kontrolGrubu}>
            <TouchableOpacity 
              style={styles.sayacButon} 
              onPress={() => stokDegistir(item.id, -1)}
              disabled={yukleniyor}
            >
              <Ionicons name="remove" size={18} color="#1C1C1E" />
            </TouchableOpacity>

            <TextInput
              style={styles.stokInput}
              keyboardType="numeric"
              value={guncelTaslak}
              onChangeText={(text) => inputDegistir(item.id, text)}
              editable={!yukleniyor}
            />

            <TouchableOpacity 
              style={styles.sayacButon} 
              onPress={() => stokDegistir(item.id, 1)}
              disabled={yukleniyor}
            >
              <Ionicons name="add" size={18} color="#1C1C1E" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.hizliEkleButon} 
              onPress={() => stokDegistir(item.id, 5)}
              disabled={yukleniyor}
            >
              <Text style={styles.hizliEkleYazi}>+5</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.kaydetButon, 
                degistiMi && styles.kaydetButonAktif,
                !degistiMi && { opacity: 0.4 }
              ]} 
              onPress={() => stokKaydet(item.id)}
              disabled={!degistiMi || yukleniyor}
            >
              {yukleniyor ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="checkmark" size={20} color={degistiMi ? "#FFF" : "#8E8E93"} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.navigate('/(admin)/admin-islemler' as any)}>
          <Ionicons name="arrow-back" size={26} color="#333" />
          </TouchableOpacity>
        <Text style={styles.headerTitle}>Stok Yönetimi</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.ustFiltreAlani}>
        <View style={styles.aramaKutusu}>
          <Ionicons name="search-outline" size={20} color="#8E8E93" />
          <TextInput
            style={styles.aramaInput}
            placeholder="Ürün adı ile ara..."
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

        <View style={styles.sekmeKapsayici}>
          <TouchableOpacity 
            style={[styles.sekmeButon, !sadeceKritik && styles.sekmeButonAktif]}
            onPress={() => setSadeceKritik(false)}
          >
            <Text style={[styles.sekmeYazi, !sadeceKritik && styles.sekmeYaziAktif]}>Tüm Ürünler ({urunler.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.sekmeButon, sadeceKritik && styles.sekmeButonAktif]}
            onPress={() => setSadeceKritik(true)}
          >
            <Ionicons name="warning-outline" size={14} color={sadeceKritik ? "#FFF" : "#EF233C"} style={{ marginRight: 4 }} />
            <Text style={[styles.sekmeYazi, sadeceKritik && styles.sekmeYaziAktif]}>
              Kritik Stok ({urunler.filter(u => (u.stok || 0) <= 5).length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9F00" />
        </View>
      ) : (
        <FlatList
          data={filtrelenmisUrunler}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUrun}
          contentContainerStyle={styles.listeKapsayici}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.bosListeMetni}>
              {sadeceKritik ? 'Harika! Kritik seviyede ürününüz bulunmuyor.' : 'Aranan kriterlere uygun ürün bulunamadı.'}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  geriButon: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  ustFiltreAlani: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingBottom: 15 },
  aramaKutusu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 10, paddingHorizontal: 12, height: 44, marginBottom: 15 },
  aramaInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#1C1C1E' },
  sekmeKapsayici: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 10, padding: 4 },
  sekmeButon: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8 },
  sekmeButonAktif: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  sekmeYazi: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
  sekmeYaziAktif: { color: '#1C1C1E' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listeKapsayici: { padding: 20, paddingBottom: 40 },
  bosListeMetni: { textAlign: 'center', color: '#8E8E93', marginTop: 50, fontSize: 15 },

  urunKart: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 15, borderWidth: 1, borderColor: '#E5E5EA', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  kartUst: { flexDirection: 'row', alignItems: 'center' },
  urunResim: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#F0F0F0' },
  urunBilgi: { flex: 1, marginLeft: 12, paddingRight: 10 },
  urunKategori: { fontSize: 10, color: '#8E8E93', fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  urunAd: { fontSize: 14, fontWeight: '700', color: '#1C1C1E', marginBottom: 2 },
  urunFiyat: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
  durumBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  durumYazi: { fontSize: 11, fontWeight: '700' },
  ayirici: { height: 1, backgroundColor: '#F2F2F7', marginVertical: 12 },
  
  kartAlt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mevcutStokAlani: { flexDirection: 'column' },
  stokEtiket: { fontSize: 11, color: '#8E8E93', fontWeight: '600' },
  stokSayi: { fontSize: 15, fontWeight: '800', marginTop: 2 },
  kontrolGrubu: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sayacButon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E5EA' },
  stokInput: { width: 44, height: 32, borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, textAlign: 'center', fontSize: 14, fontWeight: '700', color: '#1C1C1E', backgroundColor: '#F8F9FA', padding: 0 },
  hizliEkleButon: { height: 32, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#E1F5FE', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#B3E5FC' },
  hizliEkleYazi: { color: '#0288D1', fontSize: 12, fontWeight: '700' },
  kaydetButon: { width: 36, height: 32, borderRadius: 8, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E5EA' },
  kaydetButonAktif: { backgroundColor: '#34C759', borderColor: '#34C759', shadowColor: '#34C759', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 2 }
});