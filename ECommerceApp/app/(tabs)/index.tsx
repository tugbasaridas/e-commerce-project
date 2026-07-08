import { urunleriGetir } from '@/services/UrunService';
import { Kategori, Urun } from '@/types/Urun';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// YENİ EKLENEN: Sıralama tiplerini tanımlıyoruz
type SiralamaTipi = 'fiyatArtan' | 'fiyatAzalan' | 'puanYuksek' | null;

export default function Anasayfa() {
  const router = useRouter();
  
  const [tumUrunler, setTumUrunler] = useState<Urun[]>([]);
  const [gorunenUrunler, setGorunenUrunler] = useState<Urun[]>([]);
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [seciliKategori, setSeciliKategori] = useState<number | null>(null);
  const [aramaMetni, setAramaMetni] = useState('');
  
  // YENİ EKLENEN: Sıralama state'i
  const [siralama, setSiralama] = useState<SiralamaTipi>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true); 
      
      urunleriGetir()
        .then((data: Urun[]) => {
          if (!data) return;
          setTumUrunler(data);
          
          // GÜNCELLENEN KISIM: Veri geldiğinde mevcut arama, kategori VE sıralamayı uygula
          filtreleriUygula(data, aramaMetni, seciliKategori, siralama);

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
    }, [aramaMetni, seciliKategori, siralama]) // GÜNCELLEME: siralama eklendi
  );

  // GÜNCELLENEN ORTAK FİLTRELEME FONKSİYONU
  const filtreleriUygula = (liste: Urun[], aranan: string, kategoriId: number | null, seciliSiralama: SiralamaTipi) => {
    let sonuc = [...liste]; // Orijinal listeyi kopyala ki referans bozulmasın

    if (kategoriId !== null) {
      sonuc = sonuc.filter(u => u.kategoriId === kategoriId);
    }

    if (aranan) {
      sonuc = sonuc.filter(u => u.ad?.toLowerCase().includes(aranan.toLowerCase()));
    }

    // YENİ EKLENEN: Sıralama mantığı
    if (seciliSiralama === 'fiyatArtan') {
      sonuc.sort((a, b) => a.fiyat - b.fiyat);
    } else if (seciliSiralama === 'fiyatAzalan') {
      sonuc.sort((a, b) => b.fiyat - a.fiyat);
    } else if (seciliSiralama === 'puanYuksek') {
      sonuc.sort((a, b) => (b.ortalamaPuan || 0) - (a.ortalamaPuan || 0));
    }

    setGorunenUrunler(sonuc);
  };

  const aramaYap = (text: string) => {
    setAramaMetni(text);
    filtreleriUygula(tumUrunler, text, seciliKategori, siralama);
  };

  const kategoriSec = (id: number | null) => {
    const yeniKategori = seciliKategori === id ? null : id;
    setSeciliKategori(yeniKategori);
    filtreleriUygula(tumUrunler, aramaMetni, yeniKategori, siralama);
  };

  // YENİ EKLENEN: Sıralama seçme fonksiyonu
  const siralamaSec = (tip: SiralamaTipi) => {
    const yeniSiralama = siralama === tip ? null : tip; // Zaten seçiliyse iptal et
    setSiralama(yeniSiralama);
    filtreleriUygula(tumUrunler, aramaMetni, seciliKategori, yeniSiralama);
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

      {/* YENİ EKLENEN: SIRALAMA BUTONLARI (Kategorilerin Üstünde) */}
      <View style={styles.siralamaAlani}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
          
          <TouchableOpacity 
            style={[styles.siralamaHap, siralama === 'fiyatArtan' && styles.siralamaHapAktif]}
            onPress={() => siralamaSec('fiyatArtan')}
          >
            <Ionicons name="arrow-up" size={14} color={siralama === 'fiyatArtan' ? '#fff' : '#666'} />
            <Text style={[styles.siralamaYazi, siralama === 'fiyatArtan' && styles.siralamaYaziAktif]}>Ucuzdan</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.siralamaHap, siralama === 'fiyatAzalan' && styles.siralamaHapAktif]}
            onPress={() => siralamaSec('fiyatAzalan')}
          >
            <Ionicons name="arrow-down" size={14} color={siralama === 'fiyatAzalan' ? '#fff' : '#666'} />
            <Text style={[styles.siralamaYazi, siralama === 'fiyatAzalan' && styles.siralamaYaziAktif]}>Pahalıdan</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.siralamaHap, siralama === 'puanYuksek' && styles.siralamaHapAktif]}
            onPress={() => siralamaSec('puanYuksek')}
          >
            <Ionicons name="star" size={14} color={siralama === 'puanYuksek' ? '#FFD700' : '#666'} />
            <Text style={[styles.siralamaYazi, siralama === 'puanYuksek' && styles.siralamaYaziAktif]}>En Yüksek Puan</Text>
          </TouchableOpacity>

        </ScrollView>
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
                
                {/* YENİ: Kart üzerine küçük yıldız göstergesi */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={{ fontSize: 11, color: '#666', marginLeft: 3 }}>
                    {item.ortalamaPuan ? item.ortalamaPuan.toFixed(1) : "0.0"}
                  </Text>
                </View>

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

  // --- YENİ SIRALAMA BUTON STİLLERİ ---
  siralamaAlani: { marginBottom: 15 },
  siralamaHap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  siralamaHapAktif: { backgroundColor: '#333', borderColor: '#333' },
  siralamaYazi: { fontSize: 12, fontWeight: '600', color: '#666', marginLeft: 4 },
  siralamaYaziAktif: { color: '#fff' },
  // ------------------------------------

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