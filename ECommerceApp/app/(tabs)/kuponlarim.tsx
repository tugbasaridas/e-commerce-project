import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Kuponlarim() {
  const router = useRouter();
  const [kuponlar, setKuponlar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // YENİ: Geçmiş kuponların görünürlüğünü kontrol eden state
  const [gecmisGoster, setGecmisGoster] = useState(false);

  useFocusEffect(
    useCallback(() => {
      kuponlariGetir();
    }, [])
  );

  const kuponlariGetir = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/kupon/cuzdanim`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKuponlar(response.data);
    } catch (error) {
      console.log("Kuponlar çekilemedi", error);
      Alert.alert("Hata", "Kuponlarınız yüklenirken bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const koduKopyala = async (kod: string) => {
    await Clipboard.setStringAsync(kod);
    Alert.alert("Kopyalandı", `Kupon kodu (${kod}) panoya kopyalandı!`);
  };

  // KUPONLARI İKİYE AYIRIYORUZ (Aktif ve Pasif)
  const aktifKuponlar = kuponlar.filter(k => !k.kullanildiMi && !k.suresiDolduMu);
  const pasifKuponlar = kuponlar.filter(k => k.kullanildiMi || k.suresiDolduMu);

  // Ortak Kupon Çizim Fonksiyonu
  const renderKupon = ({ item }: { item: any }) => {
    const pasifMi = item.kullanildiMi || item.suresiDolduMu;
    const indirimMetni = item.indirimTipi === 'Yuzde' ? `%${item.indirimDegeri}` : `${item.indirimDegeri} TL`;

    const tarihGecerliMi = item.bitisTarihi && 
                           item.bitisTarihi !== "" && 
                           new Date(item.bitisTarihi).getFullYear() > 2000;

    return (
      <View style={[styles.kuponKart, pasifMi && styles.kuponKartPasif]}>
        
        {/* KARTIN SOL KISMI */}
        <View style={[styles.kartSol, pasifMi && styles.kartSolPasif]}>
          <Text style={styles.indirimMetni} adjustsFontSizeToFit numberOfLines={1}>{indirimMetni}</Text>
          <Text style={styles.indirimYazisi}>İNDİRİM</Text>
        </View>

        {/* KARTIN ORTASI */}
        <View style={styles.kesikCizgiAlani}>
          <View style={styles.yarimDaireUst} />
          <View style={styles.kesikCizgi} />
          <View style={styles.yarimDaireAlt} />
        </View>

        {/* KARTIN SAĞ KISMI */}
        <View style={styles.kartSag}>
          <View>
            <Text style={[styles.gecerliMagaza, pasifMi && styles.yaziPasif]} numberOfLines={1}>
              {item.gecerliMagaza}
              {item.urunKuponuMu && (
                <Text style={{fontSize: 12, color: pasifMi ? '#8E8E93' : '#007AFF', fontWeight: 'normal'}}> (Ürüne Özel)</Text>
              )}
            </Text>
            
            {item.urunKuponuMu && item.urunAdlari && item.urunAdlari.length > 0 && (
              <Text style={[styles.urunAdlariMetni, pasifMi && styles.yaziPasif]} numberOfLines={2}>
                Geçerli: {item.urunAdlari.join(', ')}
              </Text>
            )}

            <Text style={[styles.altLimit, pasifMi && styles.yaziPasif]} numberOfLines={1}>
              Min. {item.altLimit} TL alışverişte
            </Text>
          </View>
          
          <View style={styles.altSatir}>
            <Text style={[styles.bitisTarihi, pasifMi && styles.yaziPasif]}>
              Son: {tarihGecerliMi ? new Date(item.bitisTarihi).toLocaleDateString('tr-TR') : "Süresiz"}
            </Text>

            {pasifMi ? (
              <View style={styles.pasifDurumKutusu}>
                <Text style={styles.pasifDurumYazisi}>
                  {item.kullanildiMi ? "KULLANILDI" : "SÜRESİ DOLDU"}
                </Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.kodKopyalaButon} 
                onPress={() => koduKopyala(item.kuponKodu)}
              >
                <Text style={styles.kuponKodu}>{item.kuponKodu}</Text>
                <Ionicons name="copy-outline" size={14} color="#007AFF" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}
          </View>
        </View>

      </View>
    );
  };

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      
      {/* HEADER BÖLÜMÜ */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.geriBtn}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerBaslik}>Kuponlarım</Text>
        <View style={{ width: 34 }} />
      </View>

      {/* LİSTE BÖLÜMÜ */}
      <View style={styles.listeAlani}>
        {loading && kuponlar.length === 0 ? (
          <View style={styles.merkez}><ActivityIndicator size="large" color="#FF9F00" /></View>
        ) : (
          <FlatList
            data={aktifKuponlar} // Üstte Sadece Aktifleri Listele
            keyExtractor={(item, index) => `aktif-${index}`}
            contentContainerStyle={styles.listeIcerik}
            showsVerticalScrollIndicator={false}
            renderItem={renderKupon}
            
            // Eğer aktif kupon yoksa uyarı ver
            ListEmptyComponent={
              <View style={styles.bosListeKutusu}>
                <Ionicons name="ticket-outline" size={60} color="#D1D1D6" />
                <Text style={styles.bosListeBaslik}>Aktif Kuponun Yok</Text>
                <Text style={styles.bosListeAlt}>Şu an kullanabileceğin yeni bir indirim fırsatı bulunmuyor.</Text>
              </View>
            }

            // LİSTENİN EN ALTINA (FOOTER) GEÇMİŞ KUPONLAR SEKMESİNİ EKLE
            ListFooterComponent={
              pasifKuponlar.length > 0 ? (
                <View style={{ marginTop: aktifKuponlar.length > 0 ? 20 : 0 }}>
                  
                  {/* Aç/Kapa Butonu */}
                  <TouchableOpacity 
                    style={styles.gecmisToggleBtn} 
                    onPress={() => setGecmisGoster(!gecmisGoster)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.gecmisToggleYazi}>
                      Geçmiş / Kullanılan Kuponlar ({pasifKuponlar.length})
                    </Text>
                    <Ionicons 
                      name={gecmisGoster ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#48484A" 
                    />
                  </TouchableOpacity>

                  {/* Butona Basıldıysa Geçmiş Kuponları Alt Alta Listele */}
                  {gecmisGoster && (
                    <View style={{ marginTop: 15 }}>
                      {pasifKuponlar.map((item, index) => (
                        <View key={`pasif-${index}`}>
                          {renderKupon({ item })}
                        </View>
                      ))}
                    </View>
                  )}
                  
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  kapsayici: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  geriBtn: { padding: 5 },
  headerBaslik: { fontSize: 17, fontWeight: 'bold', color: '#1C1C1E' },
  merkez: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  listeAlani: { flex: 1 },
  listeIcerik: { padding: 15, paddingBottom: 100 }, 
  
  kuponKart: { 
    flexDirection: 'row', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    marginBottom: 16, 
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  kuponKartPasif: { opacity: 0.6 },
  
  kartSol: { 
    width: 90, 
    backgroundColor: '#FF4757', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 10,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  kartSolPasif: { backgroundColor: '#8E8E93' },
  indirimMetni: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', textAlign: 'center' },
  indirimYazisi: { fontSize: 9, fontWeight: 'bold', color: '#FFFFFF', marginTop: 4, letterSpacing: 1 },

  kesikCizgiAlani: { 
    width: 16, 
    backgroundColor: '#FFF', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  yarimDaireUst: { 
    width: 16, 
    height: 8, 
    backgroundColor: '#F2F2F7', 
    borderBottomLeftRadius: 8, 
    borderBottomRightRadius: 8 
  },
  kesikCizgi: { 
    flex: 1, 
    width: 1, 
    borderWidth: 1, 
    borderColor: '#E5E5EA', 
    borderStyle: 'dashed', 
    marginVertical: 4 
  },
  yarimDaireAlt: { 
    width: 16, 
    height: 8, 
    backgroundColor: '#F2F2F7', 
    borderTopLeftRadius: 8, 
    borderTopRightRadius: 8 
  },

  kartSag: { 
    flex: 1, 
    padding: 14, 
    justifyContent: 'space-between', 
  },
  gecerliMagaza: { fontSize: 15, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  urunAdlariMetni: { fontSize: 12, color: '#007AFF', marginBottom: 6, fontStyle: 'italic' },
  altLimit: { fontSize: 12, color: '#48484A', marginBottom: 8 },
  
  altSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  bitisTarihi: { fontSize: 11, color: '#8E8E93' },
  yaziPasif: { color: '#8E8E93' },
  
  kodKopyalaButon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5F1FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#CCE4FF' },
  kuponKodu: { fontSize: 12, fontWeight: 'bold', color: '#007AFF' },

  pasifDurumKutusu: { backgroundColor: '#F2F2F7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  pasifDurumYazisi: { fontSize: 10, fontWeight: 'bold', color: '#8E8E93' },

  bosListeKutusu: { alignItems: 'center', justifyContent: 'center', marginTop: 40, paddingHorizontal: 30, marginBottom: 20 },
  bosListeBaslik: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E', marginTop: 16, marginBottom: 8 },
  bosListeAlt: { fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 22 },

  // YENİ EKLENEN GEÇMİŞ KUPONLAR BUTONU STİLİ
  gecmisToggleBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderRadius: 10,
  },
  gecmisToggleYazi: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#48484A'
  }
});