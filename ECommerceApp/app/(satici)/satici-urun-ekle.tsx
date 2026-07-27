import api from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BildirimTipi {
  mesaj: string;
  tip: 'hata' | 'uyari' | 'basari';
}

export default function SaticiUrunEkle() {
  const router = useRouter();
  
  const [ad, setAd] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [fiyat, setFiyat] = useState('');
  const [stok, setStok] = useState('');
  const [resimUrl, setResimUrl] = useState('');
  
  const [seciliKategori, setSeciliKategori] = useState<number | null>(null);
  const [seciliKategoriAdi, setSeciliKategoriAdi] = useState<string>('');
  const [kategoriler, setKategoriler] = useState<any[]>([]);
  const [kategoriLoading, setKategoriLoading] = useState(true);

  // YENİ: Hangi ana kategorinin alt kırılımları açık? (ID tutuyoruz)
  const [acikKategoriler, setAcikKategoriler] = useState<{ [key: number]: boolean }>({});
  // YENİ: Arama filtresi
  const [aramaMetni, setAramaMetni] = useState('');

  const [loading, setLoading] = useState(false);
  const [bildirim, setBildirim] = useState<BildirimTipi | null>(null);

  useEffect(() => {
    const kategorileriGetir = async () => {
      try {
        const response = await api.get('/kategori');
        setKategoriler(response.data);
      } catch (error) {
        console.log("Kategoriler getirilemedi:", error);
        bildirimGoster("Kategoriler yüklenirken bir sorun oluştu.", 'hata');
      } finally {
        setKategoriLoading(false);
      }
    };

    kategorileriGetir();
  }, []);

  // Akordeon açma/kapama fonksiyonu
  const kategoriyiToggleEt = (id: number) => {
    setAcikKategoriler(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const bildirimGoster = (mesaj: string, tip: 'hata' | 'uyari' | 'basari') => {
    setBildirim({ mesaj, tip });
    if (tip !== 'basari') {
      setTimeout(() => setBildirim(null), 4000);
    }
  };

  const urunKaydet = async () => {
    if (!ad.trim() || !fiyat.trim() || !stok.trim() || !seciliKategori) {
      bildirimGoster("Lütfen ad, fiyat, stok ve kategori alanlarını doldurun.", 'uyari');
      return;
    }

    const fiyatNum = parseFloat(fiyat.replace(',', '.'));
    const stokNum = parseInt(stok, 10);

    if (isNaN(fiyatNum) || fiyatNum <= 0) {
      bildirimGoster("Lütfen geçerli bir fiyat girin.", 'hata');
      return;
    }

    if (isNaN(stokNum) || stokNum < 0) {
      bildirimGoster("Lütfen geçerli bir stok adedi girin.", 'hata');
      return;
    }

    setLoading(true);
    setBildirim(null);

    try {
      await api.post('/satici/urun', {
        ad: ad.trim(),
        aciklama: aciklama.trim(),
        fiyat: fiyatNum,
        stok: stokNum,
        kategoriId: seciliKategori,
        resimUrl: resimUrl.trim() || null 
      });

      setLoading(false);
      bildirimGoster("Ürün başarıyla eklendi, Admin onayından sonra vitrinde görünecektir.", 'basari');
      
      setTimeout(() => {
        router.replace('/(satici)/satici-anasayfa' as any);
      }, 2000);

    } catch (error: any) {
      setLoading(false);
      const hataMesaji = error.response?.data?.mesaj || error.response?.data?.Mesaj || error.response?.data || "Ürün eklenirken bir hata oluştu.";
      bildirimGoster(hataMesaji, 'hata');
    }
  };

  // Arama filtresine göre kategorileri süzme
  const filtrelenmisKategoriler = kategoriler.filter(ana => {
    if (!aramaMetni.trim()) return true;
    const arama = aramaMetni.toLowerCase();
    const anaUyumlu = ana.ad.toLowerCase().includes(arama);
    const altUyumlu = ana.altKategoriler?.some((alt: any) => alt.ad.toLowerCase().includes(arama));
    return anaUyumlu || altUyumlu;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {bildirim && (
          <View style={[styles.bildirimKutusu, styles[bildirim.tip]]}>
            <Ionicons 
              name={bildirim.tip === 'basari' ? 'checkmark-circle' : bildirim.tip === 'uyari' ? 'warning' : 'close-circle'} 
              size={22} 
              color={styles[`${bildirim.tip}Metin`].color} 
            />
            <Text style={[styles.bildirimMetni, styles[`${bildirim.tip}Metin`]]}>
              {bildirim.mesaj}
            </Text>
          </View>
        )}

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(satici)/satici-anasayfa' as any)} style={styles.geriButon}>
            <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yeni Ürün Ekle</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ürün Adı <Text style={styles.zorunlu}>*</Text></Text>
            <TextInput 
              style={styles.input} 
              placeholder="Örn: Kablosuz Kulaklık" 
              value={ad}
              onChangeText={setAd}
              placeholderTextColor="#A1A1A1"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Açıklama</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              placeholder="Ürününüzün özelliklerini detaylıca yazın..." 
              value={aciklama}
              onChangeText={setAciklama}
              placeholderTextColor="#A1A1A1"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Fiyat (₺) <Text style={styles.zorunlu}>*</Text></Text>
              <TextInput 
                style={styles.input} 
                placeholder="0.00" 
                value={fiyat}
                onChangeText={setFiyat}
                keyboardType="numeric"
                placeholderTextColor="#A1A1A1"
              />
            </View>
            <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
              <Text style={styles.label}>Stok Adedi <Text style={styles.zorunlu}>*</Text></Text>
              <TextInput 
                style={styles.input} 
                placeholder="0" 
                value={stok}
                onChangeText={setStok}
                keyboardType="number-pad"
                placeholderTextColor="#A1A1A1"
              />
            </View>
          </View>

          {/* AKILLI KATEGORİ SEÇİMİ (ARAMA ÇUBUĞU + AKORDEON AÇ/KAPA) */}
          <View style={styles.formGroup}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.label}>Kategori Seçimi <Text style={styles.zorunlu}>*</Text></Text>
              {seciliKategoriAdi ? (
                <Text style={styles.secilenKategoriBilgi} numberOfLines={1}>Seçilen: {seciliKategoriAdi}</Text>
              ) : null}
            </View>

            {/* Arama Çubuğu */}
            <View style={styles.aramaKutusu}>
              <Ionicons name="search" size={18} color="#8E8E93" style={{ marginRight: 8 }} />
              <TextInput 
                style={styles.aramaInput}
                placeholder="Binlerce kategori arasında ara..."
                placeholderTextColor="#A1A1A1"
                value={aramaMetni}
                onChangeText={setAramaMetni}
              />
              {aramaMetni ? (
                <TouchableOpacity onPress={() => setAramaMetni('')}>
                  <Ionicons name="close-circle" size={18} color="#8E8E93" />
                </TouchableOpacity>
              ) : null}
            </View>

            {kategoriLoading ? (
               <ActivityIndicator size="small" color="orange" style={{ alignSelf: 'flex-start', marginVertical: 10 }} />
            ) : (
              <View style={{ gap: 8, marginTop: 8 }}>
                {filtrelenmisKategoriler.length === 0 ? (
                  <Text style={styles.bosAramaText}>Aradığınız kriterlere uygun kategori bulunamadı.</Text>
                ) : (
                  filtrelenmisKategoriler.map((anaKat) => {
                    const isOpen = acikKategoriler[anaKat.id] || aramaMetni.trim().length > 0;
                    const hasSub = anaKat.altKategoriler && anaKat.altKategoriler.length > 0;

                    return (
                      <View key={anaKat.id} style={styles.anaKategoriGrup}>
                        
                        {/* ANA KATEGORİ SATIRI (Üstüne basınca altlar açılır/kapanır, sağdaki okla yönetilir) */}
                        <View style={styles.anaKategoriSatir}>
                          <TouchableOpacity 
                            style={styles.anaKategoriSol}
                            onPress={() => {
                              setSeciliKategori(anaKat.id);
                              setSeciliKategoriAdi(anaKat.ad);
                            }}
                          >
                            <Ionicons 
                              name={seciliKategori === anaKat.id ? "radio-button-on" : "radio-button-off"} 
                              size={18} 
                              color={seciliKategori === anaKat.id ? "orange" : "#8E8E93"} 
                              style={{ marginRight: 8 }}
                            />
                            <Text style={[styles.anaKategoriBaslik, seciliKategori === anaKat.id && { color: 'orange' }]}>
                              📁 {anaKat.ad}
                            </Text>
                          </TouchableOpacity>

                          {hasSub && (
                            <TouchableOpacity 
                              style={styles.acKapatButon} 
                              onPress={() => kategoriyiToggleEt(anaKat.id)}
                            >
                              <Text style={styles.altSayiBadge}>{anaKat.altKategoriler.length} alt kategori</Text>
                              <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color="#8E8E93" />
                            </TouchableOpacity>
                          )}
                        </View>
                        
                        {/* AÇILIR KAPANIR ALT KATEGORİLER (Akordeon) */}
                        {isOpen && hasSub && (
                          <View style={styles.altKategorilerContainer}>
                            {anaKat.altKategoriler.map((altKat: any) => (
                              <TouchableOpacity 
                                key={altKat.id}
                                style={[styles.kategoriChip, seciliKategori === altKat.id && styles.kategoriChipAktif]}
                                onPress={() => {
                                  setSeciliKategori(altKat.id);
                                  setSeciliKategoriAdi(`${anaKat.ad} > ${altKat.ad}`);
                                }}
                              >
                                <Ionicons 
                                  name={seciliKategori === altKat.id ? "radio-button-on" : "radio-button-off"} 
                                  size={15} 
                                  color={seciliKategori === altKat.id ? "orange" : "#8E8E93"} 
                                  style={{ marginRight: 6 }}
                                />
                                <Text style={[styles.kategoriYazi, seciliKategori === altKat.id && styles.kategoriYaziAktif]}>
                                  {altKat.ad}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Ürün Görseli (URL)</Text>
            <View style={styles.urlInputKutusu}>
              <Ionicons name="link-outline" size={20} color="#8E8E93" style={styles.urlIcon} />
              <TextInput 
                style={styles.urlInput} 
                placeholder="https://resim-linki.com/gorsel.jpg" 
                value={resimUrl}
                onChangeText={setResimUrl}
                keyboardType="url"
                autoCapitalize="none"
                placeholderTextColor="#A1A1A1"
              />
            </View>
            <Text style={styles.yardimciMetin}>Ürününüzün internet üzerindeki resim bağlantısını yapıştırın.</Text>
          </View>

          <TouchableOpacity style={styles.kaydetButon} onPress={urunKaydet} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.kaydetButonYazi}>Ürünü Kaydet</Text>
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 15, paddingBottom: 15, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  geriButon: { padding: 8, backgroundColor: '#F2F2F7', borderRadius: 12 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', marginBottom: 8 },
  zorunlu: { color: '#FF3B30' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E5EA', padding: 14, borderRadius: 12, fontSize: 15, color: '#1C1C1E' },
  textArea: { height: 100 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  
  aramaKutusu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, paddingHorizontal: 12, marginBottom: 12, height: 46 },
  aramaInput: { flex: 1, fontSize: 14, color: '#1C1C1E' },
  bosAramaText: { textAlign: 'center', color: '#8E8E93', paddingVertical: 20, fontStyle: 'italic' },

  anaKategoriGrup: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 14, padding: 12, marginBottom: 10 },
  anaKategoriSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  anaKategoriSol: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  anaKategoriBaslik: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  acKapatButon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  altSayiBadge: { fontSize: 11, color: '#636366', fontWeight: '500' },

  secilenKategoriBilgi: { fontSize: 12, fontWeight: '600', color: '#FF9F00', maxWidth: '50%' },
  
  altKategorilerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingLeft: 10, marginTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 10 },

  kategoriChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F8F9FA', borderWidth: 1, borderColor: '#E5E5EA' },
  kategoriChipAktif: { backgroundColor: '#FFF0E6', borderColor: 'orange' },
  kategoriYazi: { fontSize: 12, color: '#48484A', fontWeight: '500' },
  kategoriYaziAktif: { color: 'orange', fontWeight: 'bold' },

  urlInputKutusu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, paddingHorizontal: 14 },
  urlIcon: { marginRight: 8 },
  urlInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#1C1C1E' },
  yardimciMetin: { fontSize: 12, color: '#8E8E93', marginTop: 6, marginLeft: 4 },
  kaydetButon: { flexDirection: 'row', backgroundColor: 'orange', padding: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: 'orange', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  kaydetButonYazi: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  bildirimKutusu: { position: 'absolute', top: 20, left: 20, right: 20, zIndex: 999, flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 },
  bildirimMetni: { flex: 1, fontSize: 14, fontWeight: '600', marginLeft: 10 },
  hata: { backgroundColor: '#FFF5F5', borderColor: '#FEB2B2' },
  hataMetin: { color: '#C53030' },
  uyari: { backgroundColor: '#FFFAF0', borderColor: '#FEEBC8' },
  uyariMetin: { color: '#DD6B20' },
  basari: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  basariMetin: { color: '#166534' }
});