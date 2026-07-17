import { urunleriGetir } from '@/services/UrunService';
import { Kategori, Urun } from '@/types/Urun';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SiralamaTipi = 'fiyatArtan' | 'fiyatAzalan' | 'puanYuksek' | null;

export default function Anasayfa() {
  const router = useRouter();
  
  const [tumUrunler, setTumUrunler] = useState<Urun[]>([]);
  const [gorunenUrunler, setGorunenUrunler] = useState<Urun[]>([]);
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [seciliKategori, setSeciliKategori] = useState<number | null>(null);
  const [aramaMetni, setAramaMetni] = useState('');
  
  const [siralama, setSiralama] = useState<SiralamaTipi>(null);
  const [sadeceIndirimli, setSadeceIndirimli] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true); 
      
      urunleriGetir()
        .then((data: Urun[]) => {
          if (!data) return;
          setTumUrunler(data);
          
          filtreleriUygula(data, aramaMetni, seciliKategori, siralama, sadeceIndirimli);

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
    }, [aramaMetni, seciliKategori, siralama, sadeceIndirimli]) 
  );

  const filtreleriUygula = (liste: Urun[], aranan: string, kategoriId: number | null, seciliSiralama: SiralamaTipi, indirimliMi: boolean) => {
    let sonuc = [...liste]; 

    if (kategoriId !== null) {
      sonuc = sonuc.filter(u => u.kategoriId === kategoriId);
    }

    if (aranan) {
      sonuc = sonuc.filter(u => u.ad?.toLowerCase().includes(aranan.toLowerCase()));
    }

    if (indirimliMi) {
      sonuc = sonuc.filter(u => u.indirimliFiyat != null && u.indirimliFiyat > 0);
    }

    if (seciliSiralama === 'fiyatArtan') {
      sonuc.sort((a, b) => (a.indirimliFiyat || a.fiyat) - (b.indirimliFiyat || b.fiyat));
    } else if (seciliSiralama === 'fiyatAzalan') {
      sonuc.sort((a, b) => (b.indirimliFiyat || b.fiyat) - (a.indirimliFiyat || a.fiyat));
    } else if (seciliSiralama === 'puanYuksek') {
      sonuc.sort((a, b) => (b.ortalamaPuan || 0) - (a.ortalamaPuan || 0));
    }

    setGorunenUrunler(sonuc);
  };

  const aramaYap = (text: string) => {
    setAramaMetni(text);
    filtreleriUygula(tumUrunler, text, seciliKategori, siralama, sadeceIndirimli);
  };

  const kategoriSec = (id: number | null) => {
    const yeniKategori = seciliKategori === id ? null : id;
    setSeciliKategori(yeniKategori);
    filtreleriUygula(tumUrunler, aramaMetni, yeniKategori, siralama, sadeceIndirimli);
  };

  const siralamaSec = (tip: SiralamaTipi) => {
    const yeniSiralama = siralama === tip ? null : tip; 
    setSiralama(yeniSiralama);
    filtreleriUygula(tumUrunler, aramaMetni, seciliKategori, yeniSiralama, sadeceIndirimli);
  };

  const indirimFiltresiSec = () => {
    const yeniDurum = !sadeceIndirimli;
    setSadeceIndirimli(yeniDurum);
    filtreleriUygula(tumUrunler, aramaMetni, seciliKategori, siralama, yeniDurum);
  };

  if (loading && tumUrunler.length === 0) {
    return (
      <View style={styles.merkez}>
        <ActivityIndicator size="large" color="orange" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
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

      <View style={styles.siralamaAlani}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
          
          <TouchableOpacity 
            style={[styles.indirimHap, sadeceIndirimli && styles.indirimHapAktif]}
            onPress={indirimFiltresiSec}
          >
            <Ionicons name="flame" size={16} color={sadeceIndirimli ? '#fff' : '#FF4757'} />
            <Text style={[styles.indirimYazi, sadeceIndirimli && styles.indirimYaziAktif]}>İndirimdekiler</Text>
          </TouchableOpacity>

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

      <FlatList 
        style={{ flex: 1 }}
        data={gorunenUrunler}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.listeSutunYapisi}
        contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.bosListeMetni}>
            {sadeceIndirimli ? "Şu an kampanyada ürün bulunmuyor." : "Ürün bulunamadı."}
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.kart} 
            activeOpacity={0.9}
            onPress={() => router.push(`/detay?id=${item.id}`)}
          >
            <View>
              {item.resimUrl ? (
                <Image source={{ uri: item.resimUrl }} style={styles.resim} />
              ) : (
                <View style={[styles.resim, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="image-outline" size={30} color="#ccc" />
                </View>
              )}
              
              {item.indirimliFiyat && (
                <View style={styles.kartIndirimRozeti}>
                  <Text style={styles.kartIndirimRozetiYazi}>
                    %{Math.round(((item.fiyat - item.indirimliFiyat) / item.fiyat) * 100)}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.bilgi}>
                <Text style={styles.kategori}>{item.kategori?.ad || "Genel"}</Text>
                <Text style={styles.baslik} numberOfLines={2}>{item.ad}</Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={{ fontSize: 11, color: '#666', marginLeft: 3 }}>
                    {item.ortalamaPuan ? item.ortalamaPuan.toFixed(1) : "0.0"}
                  </Text>
                </View>

                {item.indirimliFiyat ? (
                  <View style={styles.kartFiyatSatiri}>
                    <Text style={styles.kartEskiFiyat}>{item.fiyat.toFixed(2)} TL</Text>
                    <Text style={styles.kartYeniFiyat}>{item.indirimliFiyat.toFixed(2)} TL</Text>
                  </View>
                ) : (
                  <Text style={styles.fiyat}>{item.fiyat ? item.fiyat.toFixed(2) : '0.00'} TL</Text>
                )}
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

  siralamaAlani: { marginBottom: 15 },
  
  indirimHap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FFF0F0',
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#FFD1D1'
  },
  indirimHapAktif: { backgroundColor: '#FF4757', borderColor: '#FF4757' },
  indirimYazi: { fontSize: 12, fontWeight: 'bold', color: '#FF4757', marginLeft: 6 },
  indirimYaziAktif: { color: '#fff' },

  siralamaHap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  siralamaHapAktif: { backgroundColor: '#333', borderColor: '#333' },
  siralamaYazi: { fontSize: 12, fontWeight: '600', color: '#666', marginLeft: 4 },
  siralamaYaziAktif: { color: '#fff' },

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
  
  kartIndirimRozeti: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF4757',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    elevation: 2,
  },
  kartIndirimRozetiYazi: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  kartFiyatSatiri: { flexDirection: 'column', marginTop: 2 },
  kartEskiFiyat: { fontSize: 11, color: '#999', textDecorationLine: 'line-through' },
  kartYeniFiyat: { fontSize: 15, fontWeight: 'bold', color: '#FF4757' },

  bilgi: { padding: 10 },
  kategori: { fontSize: 10, color: '#888', textTransform: 'uppercase', marginBottom: 4 },
  baslik: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 6, height: 38 },
  fiyat: { color: 'orange', fontWeight: 'bold', fontSize: 15 },
  bosListeMetni: { textAlign: 'center', marginTop: 30, color: '#888', fontSize: 15 }
});