import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SiparisDurumCubuguProps {
  durum: string;
}

export default function SiparisDurumCubugu({ durum }: SiparisDurumCubuguProps) {
  // Sipariş iptal edilmişse, ilerleme çubuğu yerine kırmızı iptal kartı gösteririz
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
                  suAnkiAdimMi && styles.ikonCemberiSuAnki // Şu anki adımda hafif gölge veya vurgu eklenebilir
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

              {/* Aradaki Bağlantı Çizgisi (Son adım değilse çizgi çiz) */}
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
  container: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 15,
    // Hafif gölge efekti
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  cubukKapsayici: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  adimKutusu: {
    alignItems: 'center',
    width: 65, // Metinlerin alt alta düzgün durması için sabit genişlik
  },
  ikonCemberi: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 2,
  },
  ikonCemberiAktif: {
    backgroundColor: '#4CAF50', // Başarılı yeşili (Trendyol turuncusu da yapabilirsin: '#FF9F00')
  },
  ikonCemberiPasif: {
    backgroundColor: '#F0F0F0',
  },
  ikonCemberiSuAnki: {
    borderWidth: 3,
    borderColor: 'rgba(76, 175, 80, 0.3)', // Şu anki adımın etrafına hafif hale efekti
  },
  adimMetni: {
    fontSize: 11,
    color: '#A1A1A1',
    textAlign: 'center',
    fontWeight: '500'
  },
  adimMetniAktif: {
    color: '#333',
    fontWeight: 'bold'
  },
  baglantiCizgisi: {
    flex: 1,
    height: 3,
    marginTop: 15, // İkonun tam ortasından geçmesi için hizalama
    zIndex: 1,
    marginHorizontal: -15, // İkonların içine doğru girmesi için eksi margin
  },
  baglantiCizgisiAktif: {
    backgroundColor: '#4CAF50',
  },
  baglantiCizgisiPasif: {
    backgroundColor: '#F0F0F0',
  },

  // İPTAL DURUMU STİLLERİ
  iptalKutusu: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEB2B2',
    marginBottom: 15
  },
  iptalMetinKutusu: {
    marginLeft: 15,
    flex: 1
  },
  iptalBaslik: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C53030',
    marginBottom: 4
  },
  iptalAltMetin: {
    fontSize: 13,
    color: '#E53E3E'
  }
});