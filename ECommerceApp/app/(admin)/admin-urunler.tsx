import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from '../../config/api';

interface Urun {
  id: number;
  ad: string;
  fiyat: number;
  indirimliFiyat?: number | null;
  resimUrl: string;
  kategori: { ad: string } | null;
}

export default function AdminUrunler() {
  const router = useRouter();
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [aramaMetni, setAramaMetni] = useState('');
  const [secilenKategori, setSecilenKategori] = useState('Tümü');
  
  // YENİ STATE: Sekme kontrolü için
  const [sadeceIndirimli, setSadeceIndirimli] = useState(false); 

  useFocusEffect(
    useCallback(() => {
      urunleriGetir();
    }, [])
  );

  const urunleriGetir = async () => {
    try {
      const response = await api.get('/urunler');
      setUrunler(response.data);
    } catch (error) {
      console.error("Ürünler çekilirken hata:", error);
      Alert.alert("Hata", "Ürünler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const urunSil = async (id: number, ad: string) => {
    Alert.alert(
      "Ürünü Sil",
      `"${ad}" adlı ürünü silmek istediğinize emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/urunler/${id}`);
              setUrunler(prev => prev.filter(urun => urun.id !== id));
            } catch (error) {
              Alert.alert("Hata", "Ürün silinirken bir sorun oluştu.");
            }
          }
        }
      ]
    );
  };

  const benzersizKategoriler = [
    'Tümü',
    ...Array.from(new Set(urunler.map(u => u.kategori?.ad).filter(Boolean)))
  ];

  // GÜNCELLENMİŞ FİLTRELEME: Sekme durumunu da kontrol ediyor
  const filtrelenmisUrunler = urunler.filter(urun => {
    const adUyumlu = urun.ad.toLowerCase().includes(aramaMetni.toLowerCase());
    const kategoriUyumlu = secilenKategori === 'Tümü' || urun.kategori?.ad === secilenKategori;
    const indirimUyumlu = sadeceIndirimli ? (urun.indirimliFiyat != null) : true;
    
    return adUyumlu && kategoriUyumlu && indirimUyumlu;
  });

  const renderUrun = ({ item }: { item: Urun }) => (
    <View style={styles.urunKart}>
      <Image 
        source={{ uri: item.resimUrl || 'https://via.placeholder.com/150' }} 
        style={styles.urunResim} 
      />
      <View style={styles.urunBilgi}>
        <Text style={styles.urunKategori}>{item.kategori?.ad || 'Kategorisiz'}</Text>
        <Text style={styles.urunAd} numberOfLines={1}>{item.ad}</Text>
        
        {item.indirimliFiyat ? (
          <View style={styles.indirimliFiyatContainer}>
            <Text style={styles.eskiFiyatMetni}>{item.fiyat.toFixed(2)} TL</Text>
            <Text style={styles.urunFiyat}>{item.indirimliFiyat.toFixed(2)} TL</Text>
          </View>
        ) : (
          <Text style={styles.urunFiyat}>{item.fiyat.toFixed(2)} TL</Text>
        )}
      </View>
      
      <View style={styles.aksiyonButonlari}>
        <TouchableOpacity 
          style={styles.ikonButon} 
          onPress={() => {
            router.push({
              pathname: '/admin-indirim-yonetimi',
              params: { id: item.id }
            });
          }}
        >
          <Ionicons 
            name={item.indirimliFiyat ? "pricetag" : "pricetag-outline"} 
            size={22} 
            color={item.indirimliFiyat ? "#EF233C" : "#34C759"} 
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.ikonButon} onPress={() => {
            router.push({ pathname: '/admin-urun-guncelle', params: { id: item.id } });
        }}>
          <Ionicons name="create-outline" size={22} color="#4EA8DE" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.ikonButon} onPress={() => urunSil(item.id, item.ad)}>
          <Ionicons name="trash-outline" size={22} color="#EF233C" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
   <View style={styles.container}>
     {/* HEADER: Ekle butonu artık burada! */}
     <View style={styles.header}>
       <TouchableOpacity style={styles.geriButon} onPress={() => router.replace('/admin' as any)}>
         <Ionicons name="arrow-back" size={26} color="#1C1C1E" />
       </TouchableOpacity>
       <Text style={styles.headerTitle}>Ürün Yönetimi</Text>
       <TouchableOpacity style={styles.headerEkleButon} onPress={() => router.push('/admin-urun-ekle')}>
         <Ionicons name="add-circle" size={32} color="#FF9F00" />
       </TouchableOpacity>
     </View>

     <View style={styles.ustFiltreAlani}>
       {/* Arama Kutusu */}
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

       {/* YENİ: İNDİRİM SEKMELERİ (Tüm Ürünler / İndirimdekiler) */}
       <View style={styles.sekmeKapsayici}>
         <TouchableOpacity 
           style={[styles.sekmeButon, !sadeceIndirimli && styles.sekmeButonAktif]}
           onPress={() => setSadeceIndirimli(false)}
         >
           <Text style={[styles.sekmeYazi, !sadeceIndirimli && styles.sekmeYaziAktif]}>Tüm Ürünler</Text>
         </TouchableOpacity>

         <TouchableOpacity 
           style={[styles.sekmeButon, sadeceIndirimli && styles.sekmeButonAktif]}
           onPress={() => setSadeceIndirimli(true)}
         >
           <Ionicons name="pricetag" size={14} color={sadeceIndirimli ? "#FFF" : "#FF4757"} style={{ marginRight: 4 }} />
           <Text style={[styles.sekmeYazi, sadeceIndirimli && styles.sekmeYaziAktif]}>İndirimdekiler</Text>
         </TouchableOpacity>
       </View>
     </View>

     {/* Kategori Filtreleri */}
     {!loading && urunler.length > 0 && (
       <View style={styles.kategoriKapsayici}>
         <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kategoriScroll}>
           {benzersizKategoriler.map((kat: any, index) => (
             <TouchableOpacity
               key={index}
               style={[styles.kategoriChip, secilenKategori === kat && styles.aktifKategoriChip]}
               onPress={() => setSecilenKategori(kat)}
             >
               <Text style={[styles.kategoriChipYazi, secilenKategori === kat && styles.aktifKategoriChipYazi]}>
                 {kat}
               </Text>
             </TouchableOpacity>
           ))}
         </ScrollView>
       </View>
     )}

     {/* Ürün Listesi */}
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
             {aramaMetni.length > 0 || secilenKategori !== 'Tümü' || sadeceIndirimli
               ? 'Aradığınız kriterlere uygun ürün bulunamadı.' 
               : 'Henüz hiç ürün eklenmemiş.'}
           </Text>
         }
       />
     )}
   </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, backgroundColor: '#FFFFFF' },
  geriButon: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  headerEkleButon: { padding: 2 }, // Yeni ekle butonu stili
  ustFiltreAlani: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingBottom: 15 },
  aramaKutusu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 10, paddingHorizontal: 12, height: 44, marginBottom: 15 }, // marginBottom eklendi
  aramaInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#1C1C1E' },
  
  // YENİ: Sekme Stilleri
  sekmeKapsayici: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 10, padding: 4 },
  sekmeButon: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8 },
  sekmeButonAktif: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  sekmeYazi: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  sekmeYaziAktif: { color: '#1C1C1E' },

  kategoriKapsayici: { backgroundColor: '#FFFFFF', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  kategoriScroll: { paddingHorizontal: 15 },
  kategoriChip: { backgroundColor: '#F2F2F7', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginHorizontal: 5, borderWidth: 1, borderColor: '#E5E5EA' },
  aktifKategoriChip: { backgroundColor: '#FF9F00', borderColor: '#FF9F00' },
  kategoriChipYazi: { fontSize: 13, color: '#48484A', fontWeight: '600' },
  aktifKategoriChipYazi: { color: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listeKapsayici: { padding: 20, paddingBottom: 40 }, // Alt boşluğu azalttık
  urunKart: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 5, elevation: 2 },
  urunResim: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#F0F0F0' },
  urunBilgi: { flex: 1, marginLeft: 15 },
  urunKategori: { fontSize: 11, color: '#8E8E93', fontWeight: '600', marginBottom: 2, textTransform: 'uppercase' },
  urunAd: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', marginBottom: 4 },
  urunFiyat: { fontSize: 14, fontWeight: '700', color: '#FF9F00' },
  aksiyonButonlari: { flexDirection: 'row', alignItems: 'center' },
  ikonButon: { padding: 8, marginLeft: 5, backgroundColor: '#F8F9FA', borderRadius: 8 },
  bosListeMetni: { textAlign: 'center', color: '#8E8E93', marginTop: 50, fontSize: 15 },
  indirimliFiyatContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eskiFiyatMetni: { fontSize: 12, color: '#8E8E93', textDecorationLine: 'line-through' },
});