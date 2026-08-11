import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SiparisDurumCubuguProps {
  durum: string;
}

export default function SiparisDurumCubugu({ durum }: SiparisDurumCubuguProps) {
  // 1. Sipariş iptal edilmişse, kırmızı iptal kartı gösteririz
  if (durum === 'İptal Edildi' || durum === 'İptal') {
    return (
      <View style={styles.iptalKutusu}>
        <Ionicons name="close-circle" size={32} color="#EF233C" />
        <View style={styles.iptalMetinKutusu}>
          <Text style={styles.iptalBaslik}>Sipariş İptal Edildi</Text>
          <Text style={styles.iptalAltMetin}>Bu sipariş iptal edilmiş ve süreci durdurulmuştur.</Text>
        </View>
      </View>
    );
  }

  // 🌟 YENİ: 2. Sipariş İade Sürecindeyse Mavi İade Kartı Gösteririz
  if (durum === 'İade Bekliyor' || durum === 'İncelemede' || durum === 'İade Edildi' || durum === 'İade Sürecinde') {
    return (
      <View style={[styles.iptalKutusu, { backgroundColor: '#E3F2FD', borderColor: '#90CAF9' }]}>
        <Ionicons name="refresh-circle" size={32} color="#2196F3" />
        <View style={styles.iptalMetinKutusu}>
          <Text style={[styles.iptalBaslik, { color: '#1976D2' }]}>İade Süreci</Text>
          <Text style={[styles.iptalAltMetin, { color: '#1565C0' }]}>Durum: {durum}</Text>
        </View>
      </View>
    );
  }

  // Duruma göre hangi adımda olduğumuzu buluyoruz
  const adimIndeksi = () => {
    switch (durum) {
      case 'Onay Bekliyor':
      case 'Sipariş Alındı':
        return 0;
      case 'Hazırlanıyor':
        return 1;
      case 'Kargoya Verildi':
        return 2;
      case 'Tamamlandı':
      case 'Teslim Edildi':
        return 3;
      default:
        return 0; // Bilinmeyen bir durumsa ilk adımda görünsün
    }
  };

  const aktifAdim = adimIndeksi();

  const adimlar = [
    { baslik: 'Onaylandı', ikon: 'document-text' },
    { baslik: 'Hazırlanıyor', ikon: 'cube' },
    { baslik: 'Kargoda', ikon: 'car' },
    { baslik: 'Teslim Edildi', ikon: 'home' }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.cubukKapsayici}>
        {adimlar.map((adim, index) => {
          const tamamlandiMi = index <= aktifAdim;
          const suAnkiAdimMi = index === aktifAdim;
          const sonAdimMi = index === adimlar.length - 1;

          return (
            <React.Fragment key={index}>
              {/* Yuvarlak Adım İkonu */}
              <View style={styles.adimKutusu}>
                <View style={[
                  styles.ikonCemberi, 
                  tamamlandiMi ? styles.ikonCemberiAktif : styles.ikonCemberiPasif,
                  suAnkiAdimMi && styles.ikonCemberiSuAnki
                ]}>
                  <Ionicons 
                    name={tamamlandiMi ? "checkmark" : (adim.ikon as any)} 
                    size={18} 
                    color={tamamlandiMi ? "#fff" : "#A1A1A1"} 
                  />
                </View>
                <Text style={[styles.adimMetni, tamamlandiMi && styles.adimMetniAktif]}>
                  {adim.baslik}
                </Text>
              </View>

              {/* Aradaki Bağlantı Çizgisi */}
              {!sonAdimMi && (
                <View style={[
                  styles.baglantiCizgisi, 
                  index < aktifAdim ? styles.baglantiCizgisiAktif : styles.baglantiCizgisiPasif
                ]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', paddingVertical: 20, paddingHorizontal: 10, borderRadius: 12, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#F0F0F0' },
  cubukKapsayici: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  adimKutusu: { alignItems: 'center', width: 65 },
  ikonCemberi: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8, zIndex: 2 },
  ikonCemberiAktif: { backgroundColor: '#4CAF50' },
  ikonCemberiPasif: { backgroundColor: '#F0F0F0' },
  ikonCemberiSuAnki: { borderWidth: 3, borderColor: 'rgba(76, 175, 80, 0.3)' },
  adimMetni: { fontSize: 11, color: '#A1A1A1', textAlign: 'center', fontWeight: '500' },
  adimMetniAktif: { color: '#333', fontWeight: 'bold' },
  baglantiCizgisi: { flex: 1, height: 3, marginTop: 15, zIndex: 1, marginHorizontal: -15 },
  baglantiCizgisiAktif: { backgroundColor: '#4CAF50' },
  baglantiCizgisiPasif: { backgroundColor: '#F0F0F0' },
  iptalKutusu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5F5', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#FEB2B2', marginBottom: 15 },
  iptalMetinKutusu: { marginLeft: 15, flex: 1 },
  iptalBaslik: { fontSize: 16, fontWeight: 'bold', color: '#C53030', marginBottom: 4 },
  iptalAltMetin: { fontSize: 13, color: '#E53E3E' }
});