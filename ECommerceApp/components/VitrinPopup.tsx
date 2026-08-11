import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
// Kutu genişliğini önceden belirliyoruz ki FlatList sayfalamayı (paging) tam oturtsun
const KUTU_GENISLIGI = width * 0.88; 

export default function VitrinPopup() {
  const router = useRouter();
  const [modalGozuksun, setModalGozuksun] = useState(false);
  
  // Artık tek bir banner değil, DİZİ (Array) tutuyoruz
  const [aktifBannerlar, setAktifBannerlar] = useState<any[]>([]);
  const [aktifIndeks, setAktifIndeks] = useState(0);

  useEffect(() => {
    aktifBanneriGetir();
  }, []);

  const aktifBanneriGetir = async () => {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/vitrin/bannerlar`);
      const bannerlar = response.data;

      // Tüm aktif bannerları al
      const yayindakiler = bannerlar.filter((b: any) => b.aktifMi);
      
      if (yayindakiler.length > 0) {
        setAktifBannerlar(yayindakiler); // Diziyi state'e at
        setModalGozuksun(true); 
      }
    } catch (error) {
      console.log("Vitrin banner yüklenemedi:", error);
    }
  };

  const bannerTiklandi = (secilenBanner: any) => {
    setModalGozuksun(false); 

    if (secilenBanner.yonlendirmeTuru === 'Urun' && secilenBanner.hedefId) {
      router.push(`/detay?id=${secilenBanner.hedefId}` as any);
    } 
    else if (secilenBanner.yonlendirmeTuru === 'Magaza' && secilenBanner.hedefId) {
      router.push(`/magaza-detay?magazaId=${secilenBanner.hedefId}` as any);
    } 
    else if (secilenBanner.yonlendirmeTuru === 'Kategori' && secilenBanner.hedefId) {
      // Kategori seçiliyse direkt Ana Sayfaya (Keşfet'e) atar ve kategoriId'yi parametre olarak gönderir
      router.push({ pathname: '/', params: { kategoriId: secilenBanner.hedefId } } as any);
    }
  };

  // Müşteri ekranı sağa/sola kaydırdığında noktaları güncelleyen fonksiyon
  const kaydirildiginda = (e: any) => {
    const xOfset = e.nativeEvent.contentOffset.x;
    const gecerliIndeks = Math.round(xOfset / KUTU_GENISLIGI);
    setAktifIndeks(gecerliIndeks);
  };

  if (aktifBannerlar.length === 0) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalGozuksun}
      onRequestClose={() => setModalGozuksun(false)}
    >
      <View style={styles.modalArkaPlan}>
        <View style={styles.modalKutu}>
          
          <TouchableOpacity 
            style={styles.kapatButon} 
            onPress={() => setModalGozuksun(false)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>

          {/* KAYDIRMALI ALAN (CAROUSEL) */}
          <FlatList
            data={aktifBannerlar}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={kaydirildiginda}
            renderItem={({ item }) => (
              <View style={{ width: KUTU_GENISLIGI }}>
                <TouchableOpacity activeOpacity={0.9} onPress={() => bannerTiklandi(item)}>
                  <Image 
                    source={{ uri: item.resimUrl }} 
                    style={styles.bannerResim} 
                    resizeMode="cover"
                  />
                </TouchableOpacity>

                <View style={styles.icerikAlani}>
                  <Text style={styles.baslik}>{item.baslik}</Text>
                  <Text style={styles.altBaslik}>
                    Alışverişe devam etmek için kampanyayı inceleyebilir veya çarpı butonuna basarak alışverişe dönebilirsin. 🚀
                  </Text>

                  {item.yonlendirmeTuru !== 'Yok' && (
                    <TouchableOpacity style={styles.detayButon} onPress={() => bannerTiklandi(item)}>
                      <Text style={styles.detayButonYazi}>Fırsatı İncele</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          />

          {/* NOKTALAR (Eğer 1'den fazla banner varsa göster) */}
          {aktifBannerlar.length > 1 && (
            <View style={styles.noktalarKutusu}>
              {aktifBannerlar.map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.nokta, 
                    aktifIndeks === index && styles.noktaAktif // Hangi sayfadaysak o noktanın rengini koyu yap
                  ]} 
                />
              ))}
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalArkaPlan: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)', 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalKutu: {
    width: KUTU_GENISLIGI,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    paddingBottom: 15, // Noktalar için biraz boşluk
  },
  kapatButon: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  bannerResim: {
    width: '100%',
    height: 210,
  },
  icerikAlani: {
    padding: 20,
    alignItems: 'center',
  },
  baslik: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  altBaslik: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 15,
  },
  detayButon: {
    backgroundColor: '#673AB7',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  detayButonYazi: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  noktalarKutusu: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  nokta: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 4,
  },
  noktaAktif: {
    width: 20, 
    backgroundColor: '#673AB7',
  }
});