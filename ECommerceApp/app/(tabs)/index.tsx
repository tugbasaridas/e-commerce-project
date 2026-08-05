import BildirimZili from '@/components/BildirimZili';
import { useTheme } from '@/context/ThemeContext'; // 🌟 1. TEMA HOOK'U EKLENDİ
import { kategorileriGetir } from '@/services/KategoriService';
import { urunleriGetir } from '@/services/UrunService';
import { Kategori, Urun } from '@/types/Urun';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar'; // 🌟 Durum çubuğu için eklendi
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SiralamaTipi = 'fiyatArtan' | 'fiyatAzalan' | 'puanYuksek' | null;

export default function Anasayfa() {
  const router = useRouter();
  const { theme, colors, setTheme } = useTheme(); // 🌟 2. TEMA DEĞİŞKENLERİ
  
  const [tumUrunler, setTumUrunler] = useState<Urun[]>([]);
  const [gorunenUrunler, setGorunenUrunler] = useState<Urun[]>([]);
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  
  const [seciliAnaKategori, setSeciliAnaKategori] = useState<Kategori | null>(null);
  const [seciliAltKategoriId, setSeciliAltKategoriId] = useState<number | null>(null);

  const [aramaMetni, setAramaMetni] = useState('');
  const [siralama, setSiralama] = useState<SiralamaTipi>(null);
  const [sadeceIndirimli, setSadeceIndirimli] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true); 
      
      Promise.all([urunleriGetir(), kategorileriGetir()])
        .then(([urunData, kategoriData]) => {
          if (urunData) {
            setTumUrunler(urunData);
            filtreleriUygula(urunData, aramaMetni, seciliAltKategoriId, seciliAnaKategori?.id || null, siralama, sadeceIndirimli);
          }
          if (kategoriData) {
            setKategoriler(kategoriData);
          }
        })
        .catch((error) => {
          console.log("Veri Getirme Hatası:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }, [aramaMetni, seciliAltKategoriId, seciliAnaKategori, siralama, sadeceIndirimli]) 
  );

  const filtreleriUygula = (liste: Urun[], aranan: string, altKategoriId: number | null, anaKategoriId: number | null, seciliSiralama: SiralamaTipi, indirimliMi: boolean) => {
    let sonuc = [...liste]; 

    if (altKategoriId !== null) {
      sonuc = sonuc.filter(u => u.kategoriId === altKategoriId);
    } 
    else if (anaKategoriId !== null) {
      const secilenAna = kategoriler.find(k => k.id === anaKategoriId);
      const altIds = secilenAna?.altKategoriler?.map(ak => ak.id) || [];
      sonuc = sonuc.filter(u => u.kategoriId === anaKategoriId || altIds.includes(u.kategoriId));
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
    filtreleriUygula(tumUrunler, text, seciliAltKategoriId, seciliAnaKategori?.id || null, siralama, sadeceIndirimli);
  };

  const anaKategoriSec = (kat: Kategori | null) => {
    if (kat === null) {
      setSeciliAnaKategori(null);
      setSeciliAltKategoriId(null);
      filtreleriUygula(tumUrunler, aramaMetni, null, null, siralama, sadeceIndirimli);
    } else {
      if (seciliAnaKategori?.id === kat.id) {
        setSeciliAnaKategori(null);
        setSeciliAltKategoriId(null);
        filtreleriUygula(tumUrunler, aramaMetni, null, null, siralama, sadeceIndirimli);
      } else {
        setSeciliAnaKategori(kat);
        setSeciliAltKategoriId(null); 
        filtreleriUygula(tumUrunler, aramaMetni, null, kat.id, siralama, sadeceIndirimli);
      }
    }
  };

  const altKategoriSec = (altId: number) => {
    const yeniAltId = seciliAltKategoriId === altId ? null : altId;
    setSeciliAltKategoriId(yeniAltId);
    filtreleriUygula(tumUrunler, aramaMetni, yeniAltId, seciliAnaKategori?.id || null, siralama, sadeceIndirimli);
  };

  const siralamaSec = (tip: SiralamaTipi) => {
    const yeniSiralama = siralama === tip ? null : tip; 
    setSiralama(yeniSiralama);
    filtreleriUygula(tumUrunler, aramaMetni, seciliAltKategoriId, seciliAnaKategori?.id || null, yeniSiralama, sadeceIndirimli);
  };

  const indirimFiltresiSec = () => {
    const yeniDurum = !sadeceIndirimli;
    setSadeceIndirimli(yeniDurum);
    filtreleriUygula(tumUrunler, aramaMetni, seciliAltKategoriId, seciliAnaKategori?.id || null, siralama, yeniDurum);
  };

  if (loading && tumUrunler.length === 0) {
    return (
      <View style={[styles.merkez, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="orange" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.ustAlan}>
        {/* 🌟 BAŞLIK, TEMA BUTONU VE BİLDİRİM ZİLİ YAN YANA */}
        <View style={styles.baslikSatiri}>
            <Text style={[styles.hosgeldinYazi, { color: colors.text }]}>Keşfet</Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Tek Tuşla Tema Değiştirici */}
              <TouchableOpacity 
                onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                style={[styles.tekliTemaButon, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#FFF3E0', borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={theme === 'dark' ? 'moon' : 'sunny'} 
                  size={16} 
                  color={theme === 'dark' ? '#0A84FF' : '#FFB800'} 
                />
                <Text style={[styles.tekliTemaYazi, { color: theme === 'dark' ? '#0A84FF' : '#FFB800' }]}>
                  {theme === 'dark' ? 'Gece' : 'Gündüz'}
                </Text>
              </TouchableOpacity>

              <View style={{ marginLeft: 10 }}>
                <BildirimZili />
              </View>
            </View>
        </View>
        
        <View style={[styles.aramaKutusu, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textMuted} style={{ marginRight: 10 }} />
          <TextInput 
            placeholder="Ürün ara..." 
            placeholderTextColor={colors.textMuted}
            style={[styles.aramaInput, { color: colors.text }]}
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
            style={[styles.kategoriHap, { backgroundColor: colors.card, borderColor: colors.border }, seciliAnaKategori === null && styles.kategoriHapAktif]} 
            onPress={() => anaKategoriSec(null)}
          >
            <Text style={[styles.kategoriYazi, { color: colors.text }, seciliAnaKategori === null && styles.kategoriYaziAktif]}>Tümü</Text>
          </TouchableOpacity>

          {kategoriler.map((kat) => (
            <TouchableOpacity 
              key={kat.id} 
              style={[styles.kategoriHap, { backgroundColor: colors.card, borderColor: colors.border }, seciliAnaKategori?.id === kat.id && styles.kategoriHapAktif]} 
              onPress={() => anaKategoriSec(kat)}
            >
              <Text style={[styles.kategoriYazi, { color: colors.text }, seciliAnaKategori?.id === kat.id && styles.kategoriYaziAktif]}>
                {kat.ad}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {seciliAnaKategori && seciliAnaKategori.altKategoriler && seciliAnaKategori.altKategoriler.length > 0 && (
        <View style={styles.altKategoriAlani}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
            {seciliAnaKategori.altKategoriler.map((altKat) => (
              <TouchableOpacity 
                key={altKat.id} 
                style={[styles.altKategoriHap, seciliAltKategoriId === altKat.id && styles.altKategoriHapAktif]} 
                onPress={() => altKategoriSec(altKat.id)}
              >
                <Text style={[styles.altKategoriYazi, seciliAltKategoriId === altKat.id && styles.altKategoriYaziAktif]}>
                  {altKat.ad}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList 
        style={{ flex: 1 }}
        data={gorunenUrunler}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.listeSutunYapisi}
        contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={[styles.bosListeMetni, { color: colors.textMuted }]}>
            {sadeceIndirimli ? "Şu an kampanyada ürün bulunmuyor." : "Ürün bulunamadı."}
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.kart, { backgroundColor: colors.card, borderColor: colors.border }]} 
            activeOpacity={0.9}
            onPress={() => router.push(`/detay?id=${item.id}` as any)}
          >
            <View>
              {item.resimUrl ? (
                <Image source={{ uri: item.resimUrl }} style={styles.resim} />
              ) : (
                <View style={[styles.resim, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="image-outline" size={30} color={colors.textMuted} />
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
                <Text style={[styles.kategori, { color: colors.textMuted }]}>{item.kategori?.ad || "Genel"}</Text>
                <Text style={[styles.baslik, { color: colors.text }]} numberOfLines={2}>{item.ad}</Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginLeft: 3 }}>
                    {item.ortalamaPuan ? item.ortalamaPuan.toFixed(1) : "0.0"}
                  </Text>
                </View>

                {item.indirimliFiyat ? (
                  <View style={styles.kartFiyatSatiri}>
                    <Text style={styles.kartEskiFiyat}>{item.fiyat.toFixed(2)} TL</Text>
                    <Text style={styles.kartYeniFiyat}>{item.indirimliFiyat.toFixed(2)} TL</Text>
                  </View>
                ) : (
                  <Text style={[styles.fiyat, { color: colors.primary }]}>{item.fiyat ? item.fiyat.toFixed(2) : '0.00'} TL</Text>
                )}
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  ustAlan: { paddingHorizontal: 15, paddingTop: 10, paddingBottom: 15 },
  
  baslikSatiri: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  hosgeldinYazi: { fontSize: 26, fontWeight: 'bold' },
  
  // TEKLİ TEMA BUTONU STİLİ
  tekliTemaButon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  tekliTemaYazi: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },

  aramaKutusu: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    height: 45, 
    borderRadius: 12, 
    borderWidth: 1,
    elevation: 2
  },
  aramaInput: { flex: 1, fontSize: 15 },

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

  kategoriAlani: { marginBottom: 10 },
  kategoriHap: { 
    paddingHorizontal: 18, 
    paddingVertical: 8, 
    borderRadius: 20, 
    marginRight: 10,
    borderWidth: 1,
  },
  kategoriHapAktif: { backgroundColor: 'orange', borderColor: 'orange' },
  kategoriYazi: { fontSize: 13, fontWeight: '600' },
  kategoriYaziAktif: { color: '#fff' },

  altKategoriAlani: { marginBottom: 15, paddingLeft: 5 },
  altKategoriHap: { 
    paddingHorizontal: 14, 
    paddingVertical: 6, 
    backgroundColor: '#FFF3E0', 
    borderRadius: 16, 
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#FFE0B2'
  },
  altKategoriHapAktif: { backgroundColor: '#FB8C00', borderColor: '#FB8C00' },
  altKategoriYazi: { fontSize: 12, fontWeight: '600', color: '#E65100' },
  altKategoriYaziAktif: { color: '#fff' },

  listeSutunYapisi: { justifyContent: 'space-between' },
  kart: { 
    width: '48%', 
    marginBottom: 15, 
    borderRadius: 12, 
    overflow: 'hidden',
    borderWidth: 1,
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
  kategori: { fontSize: 10, textTransform: 'uppercase', marginBottom: 4 },
  baslik: { fontSize: 14, fontWeight: 'bold', marginBottom: 6, height: 38 },
  fiyat: { fontWeight: 'bold', fontSize: 15 },
  bosListeMetni: { textAlign: 'center', marginTop: 30, fontSize: 15 }
});