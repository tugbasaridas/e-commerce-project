import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SaticiIadeler() {
  const router = useRouter();
  const [iadeler, setIadeler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [redSebebiInput, setRedSebebiInput] = useState('');
  const [secilenIadeId, setSecilenIadeId] = useState<number | null>(null);

  // 🌟 YENİ: Arama çubuğu için durum (state) değişkenleri
  const [aramaAcik, setAramaAcik] = useState(false);
  const [aramaMetni, setAramaMetni] = useState('');

  useEffect(() => {
    iadeleriYukle();
  }, []);

  const iadeleriYukle = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/satici/iadeler`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIadeler(response.data);
    } catch (error) {
      console.log("Satıcı iadeleri çekilemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const durumGuncelle = async (iadeId: number, islemTuru: string, redSebebi?: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(`${API_CONFIG.BASE_URL}/satici/iade-durum`, {
        IadeId: iadeId,
        Islem: islemTuru,
        RedSebebi: redSebebi || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert("Başarılı", `İşlem başarıyla gerçekleştirildi.`);
      setSecilenIadeId(null);
      setRedSebebiInput('');
      iadeleriYukle();
    } catch (error: any) {
      Alert.alert("Hata", error.response?.data?.Mesaj || error.response?.data || "İşlem başarısız.");
    }
  };

  // 🌟 YENİ: Arama metnine göre listeyi filtreleyen fonksiyon
  const filtrelenmisListeyiGetir = () => {
    if (!aramaMetni) return iadeler;

    const kucukHarfArama = aramaMetni.toLowerCase();
    
    return iadeler.filter(item => {
      const urun = item.urunAdi?.toLowerCase() || '';
      const musteri = item.musteriAdi?.toLowerCase() || '';
      const siparisNo = item.siparisId?.toString() || '';
      
      return urun.includes(kucukHarfArama) || 
             musteri.includes(kucukHarfArama) || 
             siparisNo.includes(kucukHarfArama);
    });
  };

  const getDurumStili = (durum: string) => {
    switch (durum) {
      case 'İade Kodu Oluşturuldu': return { bg: '#E3F2FD', text: '#2196F3', icon: 'barcode-outline' };
      case 'İncelemede': return { bg: '#FFF3E0', text: '#FF9800', icon: 'search-outline' };
      case 'Onaylandı': return { bg: '#E8F5E9', text: '#4CAF50', icon: 'checkmark-circle-outline' };
      case 'Reddedildi': return { bg: '#FFEBEE', text: '#F44336', icon: 'close-circle-outline' };
      default: return { bg: '#F5F5F5', text: '#9E9E9E', icon: 'help-circle-outline' };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.baslik}>Müşteri İade Talepleri</Text>
        
        {/* 🌟 YENİ: Gizli Arama Butonu */}
        <TouchableOpacity 
          style={styles.aramaIkon} 
          onPress={() => {
            setAramaAcik(!aramaAcik);
            if (aramaAcik) setAramaMetni(''); // Arama kapanıyorsa metni sıfırla
          }}
        >
          <Ionicons name="search" size={24} color={aramaAcik ? "#FF9F00" : "#111"} />
        </TouchableOpacity>
      </View>

      {/* 🌟 YENİ: Açılıp Kapanabilen Arama Çubuğu */}
      {aramaAcik && (
        <View style={styles.aramaKutusu}>
          <Ionicons name="search" size={20} color="#8E8E93" style={{ marginRight: 8 }} />
          <TextInput 
            style={styles.aramaInput}
            placeholder="Sipariş No, Ürün veya Müşteri Ara..."
            placeholderTextColor="#8E8E93"
            value={aramaMetni}
            onChangeText={setAramaMetni}
            autoFocus
          />
          {aramaMetni.length > 0 && (
            <TouchableOpacity onPress={() => setAramaMetni('')}>
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {loading ? (
        <View style={styles.merkez}>
          <ActivityIndicator size="large" color="#FF9F00" />
        </View>
      ) : (
        <FlatList
          data={filtrelenmisListeyiGetir()} // 🌟 LİSTE VERİSİ GÜNCELLENDİ
          keyExtractor={(item) => item.iadeId.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const durumStil = getDurumStili(item.durum);

            return (
              <View style={styles.kart}>
                {/* Kart Üst (Sipariş No ve Durum Rozeti) */}
                <View style={styles.kartUst}>
                  <View style={styles.siparisNoKutu}>
                    <Ionicons name="receipt-outline" size={16} color="#666" style={{ marginRight: 4 }} />
                    <Text style={styles.siparisNo}>Sipariş: #{item.siparisId}</Text>
                  </View>
                  <View style={[styles.durumRozeti, { backgroundColor: durumStil.bg }]}>
                    <Ionicons name={durumStil.icon as any} size={14} color={durumStil.text} style={{ marginRight: 4 }} />
                    <Text style={[styles.durumYazi, { color: durumStil.text }]}>{item.durum}</Text>
                  </View>
                </View>

                {/* Kart Orta (Ürün Görseli ve Detaylar) */}
                <View style={styles.kartOrta}>
                  <Image source={{ uri: item.resimUrl || 'https://via.placeholder.com/150' }} style={styles.resim} />
                  <View style={styles.urunBilgi}>
                    <Text style={styles.urunAd} numberOfLines={2}>{item.urunAdi}</Text>
                    <Text style={styles.musteri}><Ionicons name="person-outline" size={12} /> {item.musteriAdi}</Text>
                    <Text style={styles.tutar}>{item.iadeTutari.toFixed(2)} TL</Text>
                  </View>
                </View>

                {/* İade Sebebi Kutusu */}
                <View style={styles.sebepKutusu}>
                  <Text style={styles.sebepBaslik}><Ionicons name="chatbubble-ellipses-outline" size={14} /> İade Sebebi:</Text>
                  <Text style={styles.sebepMetin}>{item.iadeSebebi}</Text>
                </View>

                {/* Aksiyon Butonları (Duruma Göre Dinamik) */}
                {item.durum === 'İade Kodu Oluşturuldu' && (
                  <View style={styles.butonSatiri}>
                    <TouchableOpacity style={[styles.aksiyonButon, { backgroundColor: '#2196F3' }]} onPress={() => durumGuncelle(item.iadeId, 'TeslimAl')}>
                      <Ionicons name="cube-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.butonYazi}>Ürünü Teslim Al & İncele</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {item.durum === 'İncelemede' && (
                  <View style={styles.butonSatiri}>
                    <TouchableOpacity style={[styles.aksiyonButon, styles.onayButon]} onPress={() => durumGuncelle(item.iadeId, 'Onayla')}>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 4 }} />
                      <Text style={styles.butonYazi}>İadeyi Onayla</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.aksiyonButon, styles.redButon]} onPress={() => setSecilenIadeId(item.iadeId)}>
                      <Ionicons name="close-circle-outline" size={18} color="#fff" style={{ marginRight: 4 }} />
                      <Text style={styles.butonYazi}>Reddet</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Reddet Formu (Sadece ilgili iade için açılır) */}
                {secilenIadeId === item.iadeId && (
                  <View style={styles.redForm}>
                    <Text style={styles.redFormBaslik}>Neden reddediyorsunuz?</Text>
                    <TextInput 
                      style={styles.input} 
                      placeholder="Red sebebini buraya yazın..." 
                      placeholderTextColor="#999"
                      value={redSebebiInput} 
                      onChangeText={setRedSebebiInput} 
                      multiline
                    />
                    <TouchableOpacity style={styles.redGonderButon} onPress={() => durumGuncelle(item.iadeId, 'Reddet', redSebebiInput)}>
                      <Text style={styles.butonYazi}>Reddi Kesinleştir</Text>
                      <Ionicons name="send" size={16} color="#fff" style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.bosListe}>
              <Ionicons name="folder-open-outline" size={60} color="#D1D1D6" />
              <Text style={styles.bosListeBaslik}>{aramaAcik && aramaMetni ? "Sonuç Bulunamadı" : "İade Talebi Yok"}</Text>
              <Text style={styles.bosListeMetin}>
                {aramaAcik && aramaMetni 
                  ? "Aradığınız kriterlere uygun bir iade talebi eşleşmedi." 
                  : "Şu anda mağazanızda bekleyen veya işlem gören bir iade talebi bulunmuyor."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  geriButon: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  baslik: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  aramaIkon: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' }, // 🌟 YENİ
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // 🌟 YENİ: Arama Kutusu Stilleri
  aramaKutusu: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  aramaInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },

  kart: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 3, borderWidth: 1, borderColor: '#F0F0F0' },
  kartUst: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  siparisNoKutu: { flexDirection: 'row', alignItems: 'center' },
  siparisNo: { fontWeight: '700', color: '#444', fontSize: 14 },
  durumRozeti: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  durumYazi: { fontSize: 12, fontWeight: '700' },
  
  kartOrta: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  resim: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E5E5EA' },
  urunBilgi: { flex: 1, marginLeft: 14, justifyContent: 'center' },
  urunAd: { fontWeight: '600', fontSize: 14, color: '#222', marginBottom: 4 },
  musteri: { fontSize: 12, color: '#666', marginBottom: 6 },
  tutar: { fontWeight: '800', color: '#FF9F00', fontSize: 15 },
  
  sebepKutusu: { backgroundColor: '#F9F9F9', padding: 12, borderRadius: 10, marginBottom: 14, borderWidth: 1, borderColor: '#F0F0F0' },
  sebepBaslik: { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 4 },
  sebepMetin: { fontSize: 13, color: '#333', lineHeight: 18 },
  
  butonSatiri: { flexDirection: 'row', gap: 12, marginTop: 4 },
  aksiyonButon: { flex: 1, flexDirection: 'row', paddingVertical: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  onayButon: { backgroundColor: '#4CAF50' },
  redButon: { backgroundColor: '#EF233C' },
  butonYazi: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  redForm: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  redFormBaslik: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 8 },
  input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#E5E5EA', padding: 12, borderRadius: 10, marginBottom: 12, fontSize: 14, color: '#333', minHeight: 80, textAlignVertical: 'top' },
  redGonderButon: { flexDirection: 'row', backgroundColor: '#333', paddingVertical: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  
  bosListe: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 20 },
  bosListeBaslik: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 16, marginBottom: 8 },
  bosListeMetin: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 }
});