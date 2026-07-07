import { urunleriGetir } from '@/services/UrunService';
import { Kategori, Urun } from '@/types/Urun';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router'; // useFocusEffect eklendi
import React, { useCallback, useState } from 'react'; // useCallback eklendi (useEffect kaldırıldı)
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Anasayfa() {
  const router = useRouter();
  
  const [tumUrunler, setTumUrunler] = useState<Urun[]>([]);
  const [gorunenUrunler, setGorunenUrunler] = useState<Urun[]>([]);
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [seciliKategori, setSeciliKategori] = useState<number | null>(null);
  const [aramaMetni, setAramaMetni] = useState('');
  const [loading, setLoading] = useState(true);

  // DEĞİŞEN KISIM: useEffect yerine useFocusEffect kullanıldı
  useFocusEffect(
    useCallback(() => {
      // Arka planda veriler yenilenirken kısa bir yükleme animasyonu göstermek iyi bir UX sağlar
      setLoading(true); 
      
      urunleriGetir()
        .then((data: Urun[]) => {
          if (!data) return;
          setTumUrunler(data);
          
          // Eğer önceden seçili bir filtre veya arama varsa, veriler güncellenirken o filtreyi koruyoruz
          let sonuc = data;
          if (seciliKategori !== null) {
            sonuc = sonuc.filter(u => u.kategoriId === seciliKategori);
          }
          if (aramaMetni) {
            sonuc = sonuc.filter(u => u.ad?.toLowerCase().includes(aramaMetni.toLowerCase()));
          }
          setGorunenUrunler(sonuc);

          const cikanKategoriler: Kategori[] = [];
          
          data.forEach(urun => {
            if (urun?.kategori?.id) {
              const zatenVarMi = cikanKategoriler.some(k => k.id === urun.kategori.id);
              
              if (!zatenVarMi) {
                cikanKategoriler.push({
                  id: urun.kategori.id,
                  ad: urun.kategori.ad
                });
              }
            }
          });
          
          setKategoriler(cikanKategoriler);
        })
        .catch((error) => {
          console.log("Ürünleri Getirme Hatası:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }, [aramaMetni, seciliKategori]) // Arama ve kategori statelerini bağımlılık olarak ekledik
  );

  // Ortak Filtreleme Fonksiyonu (Arama ve Kategori Birlikte Çalışır)
  const filtreleriUygula = (aranan: string, kategoriId: number | null) => {
    let sonuc = tumUrunler;

    if (kategoriId !== null) {
      sonuc = sonuc.filter(u => u.kategoriId === kategoriId);
    }

    if (aranan) {
      sonuc = sonuc.filter(u => u.ad?.toLowerCase().includes(aranan.toLowerCase()));
    }

    setGorunenUrunler(sonuc);
  };

  const aramaYap = (text: string) => {
    setAramaMetni(text);
    filtreleriUygula(text, seciliKategori);
  };

  const kategoriSec = (id: number | null) => {
    const yeniKategori = seciliKategori === id ? null : id;
    setSeciliKategori(yeniKategori);
    filtreleriUygula(aramaMetni, yeniKategori);
  };

  if (loading && tumUrunler.length === 0) {
    return (
      <View style={styles.merkez}>
        <ActivityIndicator size="large" color="orange" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      
      {/* ÜST BÖLÜM: BAŞLIK VE ARAMA ÇUBUĞU */}
      <View style={styles.ustAlan}>
        <Text style={styles.hosgeldinYazi}>Keşfet</Text>
        
        <View style={styles.aramaKutusu}>
          <Ionicons name="search" size={20} color="#888" style={{ marginRight: 10 }} />
          <TextInput 
            placeholder="Ürün ara..." 
            style={styles.aramaInput}
            value={aramaMetni}
            onChangeText={aramaYap} 
          />
        </View>
      </View>

      {/* KATEGORİLER */}
      <View style={styles.kategoriAlani}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
          <TouchableOpacity 
            style={[styles.kategoriHap, seciliKategori === null && styles.kategoriHapAktif]} 
            onPress={() => kategoriSec(null)}
          >
            <Text style={[styles.kategoriYazi, seciliKategori === null && styles.kategoriYaziAktif]}>Tümü</Text>
          </TouchableOpacity>

          {kategoriler.map((kat) => (
            <TouchableOpacity 
              key={kat.id} 
              style={[styles.kategoriHap, seciliKategori === kat.id && styles.kategoriHapAktif]} 
              onPress={() => kategoriSec(kat.id)}
            >
              <Text style={[styles.kategoriYazi, seciliKategori === kat.id && styles.kategoriYaziAktif]}>
                {kat.ad}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ÜRÜN LİSTESİ */}
      <FlatList 
        data={gorunenUrunler}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.listeSutunYapisi}
        contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.bosListeMetni}>Ürün bulunamadı.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.kart} 
            activeOpacity={0.9}
            onPress={() => router.push(`/detay?id=${item.id}`)}
          >
            {item.resimUrl ? (
              <Image source={{ uri: item.resimUrl }} style={styles.resim} />
            ) : (
              <View style={[styles.resim, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="image-outline" size={30} color="#ccc" />
              </View>
            )}
            
            <View style={styles.bilgi}>
                <Text style={styles.kategori}>{item.kategori?.ad || "Genel"}</Text>
                <Text style={styles.baslik} numberOfLines={2}>{item.ad}</Text>
                {/* Güvenli fiyat formatlama: fiyat null gelirse hata vermez */}
                <Text style={styles.fiyat}>{item.fiyat ? item.fiyat.toFixed(2) : '0.00'} TL</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  ustAlan: { paddingHorizontal: 15, paddingTop: 10, paddingBottom: 15 },
  hosgeldinYazi: { fontSize: 26, fontWeight: 'bold', color: '#111', marginBottom: 15 },
  aramaKutusu: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    paddingHorizontal: 15, 
    height: 45, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#eee',
    elevation: 2
  },
  aramaInput: { flex: 1, fontSize: 15, color: '#333' },

  kategoriAlani: { marginBottom: 15 },
  kategoriHap: { 
    paddingHorizontal: 18, 
    paddingVertical: 8, 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  kategoriHapAktif: { backgroundColor: 'orange', borderColor: 'orange' },
  kategoriYazi: { fontSize: 13, fontWeight: '600', color: '#555' },
  kategoriYaziAktif: { color: '#fff' },

  listeSutunYapisi: { justifyContent: 'space-between' },
  kart: { 
    width: '48%', 
    backgroundColor: '#fff', 
    marginBottom: 15, 
    borderRadius: 12, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 1
  },
  resim: { width: '100%', height: 150, resizeMode: 'cover' },
  bilgi: { padding: 10 },
  kategori: { fontSize: 10, color: '#888', textTransform: 'uppercase', marginBottom: 4 },
  baslik: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 6, height: 38 },
  fiyat: { color: 'orange', fontWeight: 'bold', fontSize: 15 },
  bosListeMetni: { textAlign: 'center', marginTop: 30, color: '#888', fontSize: 15 }
});