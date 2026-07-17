import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert, Dimensions, FlatList,
  Image, LayoutAnimation, Modal, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity,
  UIManager, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const width = Dimensions.get('window').width;
const cardWidth = width / 2 - 25; 

export default function Favoriler() {
  const router = useRouter();
  const [favoriler, setFavoriler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aramaAktif, setAramaAktif] = useState(false);
  const [aramaMetni, setAramaMetni] = useState('');
  const [oylamaModalGorunur, setOylamaModalGorunur] = useState(false);
  const [oylanacakUrunId, setOylanacakUrunId] = useState<number | null>(null);
  const [secilenPuan, setSecilenPuan] = useState<number>(0);
  const [oyGonderiliyor, setOyGonderiliyor] = useState(false);

  useFocusEffect(
    useCallback(() => { favorileriGetir(); }, [])
  );

  const favorileriGetir = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) { setLoading(false); return; }
      const response = await axios.get(`${API_CONFIG.BASE_URL}/favoriler`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavoriler(response.data);
    } catch (error) {
      console.error("Favoriler getirilirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const favoridenCikar = async (urunId: number) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.delete(`${API_CONFIG.BASE_URL}/favoriler/${urunId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavoriler(prev => prev.filter(item => item.urunId !== urunId));
    } catch (error) { Alert.alert("Hata", "Ürün favorilerden çıkarılamadı."); }
  };

  const oyGonder = async () => {
    if (secilenPuan === 0) { Alert.alert("Uyarı", "Lütfen bir yıldız seçin."); return; }
    if (!oylanacakUrunId) return;
    setOyGonderiliyor(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(`${API_CONFIG.BASE_URL}/urunler/${oylanacakUrunId}/oyla?puan=${secilenPuan}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      Alert.alert("Teşekkürler!", "Değerlendirmeniz kaydedildi.");
      setOylamaModalGorunur(false);
      favorileriGetir();
    } catch (error: any) { Alert.alert("Uyarı", "Değerlendirme yapılamadı."); } 
    finally { setOyGonderiliyor(false); }
  };

  const urunKartiCiz = ({ item }: { item: any }) => {
    const indirimVarmi = item.fiyat < item.orijinalFiyat;
    const indirimOrani = indirimVarmi ? Math.round(((item.orijinalFiyat - item.fiyat) / item.orijinalFiyat) * 100) : 0;

    return (
      <TouchableOpacity style={styles.kart} activeOpacity={0.9} onPress={() => router.push(`/detay?id=${item.urunId}` as any)}>
        <TouchableOpacity style={styles.kalpButon} onPress={() => favoridenCikar(item.urunId)}>
          <Ionicons name="heart" size={20} color="#ff4757" />
        </TouchableOpacity>

        <Image source={{ uri: item.resimUrl }} style={styles.resim} resizeMode="contain" />
        
        {indirimVarmi && (
          <View style={styles.indirimRozeti}><Text style={styles.rozetiYazi}>%{indirimOrani}</Text></View>
        )}

        <View style={styles.bilgiAlani}>
          <Text style={styles.urunAdi} numberOfLines={1}>{item.ad}</Text>
          <View style={styles.fiyatSatiri}>
            {indirimVarmi ? (
              <>
                <Text style={styles.eskiFiyat}>{item.orijinalFiyat.toFixed(2)} TL</Text>
                <Text style={styles.guncelFiyat}>{item.fiyat.toFixed(2)} TL</Text>
              </>
            ) : (
              <Text style={styles.normalFiyat}>{item.fiyat.toFixed(2)} TL</Text>
            )}
          </View>
          <TouchableOpacity style={styles.yildizSatiri} onPress={() => { setOylanacakUrunId(item.urunId); setOylamaModalGorunur(true); }}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.yildizYazisi}>{item.ortalamaPuan?.toFixed(1) || "0.0"} ({item.oylamaSayisi || 0})</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    /* YENİ EKLENDİ: edges={['top', 'left', 'right']} kodu ile alttaki beyaz boşluk iptal edildi */
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.headerSatiri}>
        <Text style={styles.sayfaBaslik}>Favoriler</Text>
        <TouchableOpacity onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setAramaAktif(!aramaAktif); }} style={styles.aramaIkonButon}>
          <Ionicons name={aramaAktif ? "close" : "search"} size={26} color="#333" />
        </TouchableOpacity>
      </View>

      {aramaAktif && (
        <View style={styles.aramaKutusu}>
          <Ionicons name="search" size={20} color="#888" style={{ marginRight: 10 }} />
          <TextInput style={styles.aramaInput} placeholder="Favorilerde ara..." value={aramaMetni} onChangeText={setAramaMetni} autoFocus={true} />
        </View>
      )}

      <FlatList
        data={favoriler.filter(i => i.ad.toLowerCase().includes(aramaMetni.toLowerCase()))}
        renderItem={urunKartiCiz}
        keyExtractor={(item) => item.favoriId.toString()}
        numColumns={2}
        columnWrapperStyle={styles.listeSutunYapisi}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<View style={styles.bosDurum}><Ionicons name="heart-dislike-outline" size={80} color="#ccc" /><Text style={styles.bosMetin}>Ürün bulunamadı.</Text></View>}
        /* Alt kısımdaki ürünlerin çok yapışmaması için listeye minik bir iç boşluk ekledik */
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <Modal visible={oylamaModalGorunur} transparent={true} animationType="fade">
        <View style={styles.modalArkaPlan}>
          <View style={styles.modalKutu}>
            <TouchableOpacity style={styles.kapatIkonu} onPress={() => setOylamaModalGorunur(false)}><Ionicons name="close" size={24} color="#555" /></TouchableOpacity>
            <Text style={styles.modalBaslik}>Ürünü Değerlendir</Text>
            <View style={styles.yildizSecici}>
              {[1, 2, 3, 4, 5].map((puan) => (
                <TouchableOpacity key={puan} onPress={() => setSecilenPuan(puan)}><Ionicons name={puan <= secilenPuan ? "star" : "star-outline"} size={40} color="#FFD700" style={styles.secimYildizi} /></TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.modalGonderButon} onPress={oyGonder} disabled={oyGonderiliyor}><Text style={styles.modalGonderButonYazi}>Gönder</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
  headerSatiri: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sayfaBaslik: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  aramaIkonButon: { padding: 8, backgroundColor: '#f5f5f5', borderRadius: 20 },
  aramaKutusu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F5', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 10, marginBottom: 20 },
  aramaInput: { flex: 1, fontSize: 16, color: '#333' },
  listeSutunYapisi: { justifyContent: 'space-between' },
  kart: { width: cardWidth, backgroundColor: '#fff', borderRadius: 15, marginBottom: 20, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  kalpButon: { position: 'absolute', top: 10, right: 10, backgroundColor: '#fff', borderRadius: 15, padding: 5, zIndex: 10, elevation: 2 },
  resim: { width: '100%', height: 120, borderRadius: 10, marginTop: 15 },
  bilgiAlani: { marginTop: 10 },
  urunAdi: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 5 },
  fiyatSatiri: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  guncelFiyat: { fontSize: 16, fontWeight: 'bold', color: '#ff4757' },
  eskiFiyat: { fontSize: 12, color: '#999', textDecorationLine: 'line-through' },
  indirimRozeti: { position: 'absolute', top: 10, left: 10, backgroundColor: '#ff4757', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, zIndex: 1 },
  rozetiYazi: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  yildizSatiri: { flexDirection: 'row', alignItems: 'center' },
  yildizYazisi: { fontSize: 12, color: '#777', marginLeft: 4 },
  bosDurum: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  bosMetin: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 15 },
  modalArkaPlan: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalKutu: { width: '80%', backgroundColor: '#fff', borderRadius: 20, padding: 25, alignItems: 'center' },
  kapatIkonu: { position: 'absolute', top: 15, right: 15 },
  modalBaslik: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  yildizSecici: { flexDirection: 'row', marginBottom: 20 },
  secimYildizi: { marginHorizontal: 5 },
  modalGonderButon: { backgroundColor: '#FFD700', width: '100%', paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  modalGonderButonYazi: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  normalFiyat: { fontSize: 16, fontWeight: 'bold', color: '#333' },
});