import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const getDurumRenkleri = (durum: string) => {
  switch (durum) {
    case 'Hazırlanıyor': return { bg: '#FFF4E5', text: '#FF9F00', icon: 'time-outline' };
    case 'Kargoya Verildi': return { bg: '#E1F5FE', text: '#4EA8DE', icon: 'cube-outline' };
    case 'Tamamlandı': return { bg: '#F0FDF4', text: '#28A745', icon: 'checkmark-circle-outline' };
    case 'İptal': return { bg: '#FFEBEA', text: '#EF233C', icon: 'close-circle-outline' };
    default: return { bg: '#F8F9FA', text: '#8E8E93', icon: 'ellipse-outline' };
  }
};

interface SiparisKartProps {
  item: any;
  onGuncelle: (siparis: any) => void;
  onKargoTakip: (id: number) => void;
}

export default function SiparisKart({ item, onGuncelle, onKargoTakip }: SiparisKartProps) {
  const renkler = getDurumRenkleri(item.durum);

  return (
    <View style={styles.kart}>
      <View style={styles.kartUst}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.siparisNo}>Sipariş #{item.id}</Text>
          <View style={styles.kullaniciBilgiSatiri}>
            <Ionicons name="person" size={12} color="#8E8E93" />
            <Text style={styles.kullaniciYazi}>{item.kullaniciAdSoyad || 'İsimsiz Kullanıcı'}</Text>
          </View>
          <View style={styles.kullaniciBilgiSatiri}>
            <Ionicons name="mail" size={12} color="#8E8E93" />
            <Text style={styles.kullaniciEmailYazi}>{item.kullaniciEmail}</Text>
          </View>
        </View>
        <View style={[styles.durumBadge, { backgroundColor: renkler.bg }]}>
          <Ionicons name={renkler.icon as any} size={14} color={renkler.text} style={{ marginRight: 4 }} />
          <Text style={[styles.durumYazi, { color: renkler.text }]}>{item.durum}</Text>
        </View>
      </View>

      <View style={styles.ayiriciCizgi} />

      <View style={styles.urunlerKutusu}>
        {item.urunler && item.urunler.map((urun: any, index: number) => (
          <Text key={index} style={styles.urunDetayYazi}>
            <Text style={styles.urunAdet}>{urun.adet}x</Text> {urun.ad} 
            <Text style={styles.urunFiyat}> ({(urun.birimFiyat * urun.adet).toFixed(2)} TL)</Text>
          </Text>
        ))}
      </View>

      <View style={styles.kargoKutusu}>
        <View style={styles.kargoSatiri}>
          <Ionicons name="location-outline" size={14} color="#8E8E93" />
          <Text style={styles.kargoAdresYazi}>{item.teslimatAdresi || 'Adres bilgisi yok.'}</Text>
        </View>
        <View style={styles.kargoSatiri}>
          <Ionicons name="call-outline" size={14} color="#00529B" />
          <Text style={[styles.kargoOdemeYazi, { color: '#00529B' }]}>{item.telefon || 'Telefon belirtilmemiş'}</Text>
        </View>
        <View style={styles.kargoSatiri}>
          <Ionicons name="card-outline" size={14} color="#8E8E93" />
          <Text style={styles.kargoOdemeYazi}>{item.odemeYontemi || 'Belirtilmemiş'}</Text>
        </View>
      </View>

      <View style={styles.ayiriciCizgi} />

      <View style={styles.kartAlt}>
        <Text style={styles.fiyatAlan}>
          Toplam: <Text style={styles.fiyatDeger}>{item.toplamTutar.toFixed(2)} TL</Text>
        </Text>
        
        {/* Tamamlandı veya İptal durumunda güncelleme butonunu gizleyebiliriz veya pasif yapabiliriz */}
        {item.durum !== 'Tamamlandı' && item.durum !== 'İptal' && (
          <TouchableOpacity style={styles.btnGuncelle} activeOpacity={0.8} onPress={() => onGuncelle(item)}>
            <Ionicons name="color-wand-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.btnGuncelleYazi}>Güncelle</Text>
          </TouchableOpacity>
        )}
      </View>

      {item.durum === 'Kargoya Verildi' && (
        <TouchableOpacity style={styles.adminKargoBtn} onPress={() => onKargoTakip(item.id)} activeOpacity={0.7}>
          <Ionicons name="link-outline" size={18} color="#00529B" style={{ marginRight: 6 }} />
          <Text style={styles.adminKargoBtnYazi}>Kargo Takibini Gör</Text>
          <Ionicons name="chevron-forward" size={16} color="#00529B" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  kart: { backgroundColor: '#FFFFFF', padding: 18, marginBottom: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  kartUst: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  siparisNo: { fontWeight: '800', fontSize: 16, color: '#1C1C1E', marginBottom: 6 },
  kullaniciBilgiSatiri: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  kullaniciYazi: { fontSize: 13, color: '#1C1C1E', marginLeft: 4, fontWeight: '500' },
  kullaniciEmailYazi: { fontSize: 12, color: '#8E8E93', marginLeft: 4 },
  durumBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  durumYazi: { fontSize: 12, fontWeight: '700' },
  ayiriciCizgi: { height: 1, backgroundColor: '#F2F2F7', marginVertical: 12 },
  urunlerKutusu: { paddingLeft: 4, marginBottom: 8 },
  urunDetayYazi: { fontSize: 13, color: '#48484A', marginBottom: 6 },
  urunAdet: { fontWeight: '700', color: '#1C1C1E' },
  urunFiyat: { color: '#BFBFBF', fontSize: 12 },
  kargoKutusu: { backgroundColor: '#F8F9FA', padding: 10, borderRadius: 8, marginTop: 4 },
  kargoSatiri: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  kargoAdresYazi: { fontSize: 12, color: '#48484A', marginLeft: 6, flex: 1, lineHeight: 18 },
  kargoOdemeYazi: { fontSize: 12, color: '#1C1C1E', marginLeft: 6, fontWeight: '600' },
  kartAlt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  fiyatAlan: { fontSize: 13, color: '#8E8E93' },
  fiyatDeger: { fontWeight: '800', color: '#1C1C1E', fontSize: 18 },
  btnGuncelle: { flexDirection: 'row', backgroundColor: '#4EA8DE', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#4EA8DE', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  btnGuncelleYazi: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  adminKargoBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6F2FF', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginTop: 12 },
  adminKargoBtnYazi: { color: '#00529B', fontWeight: '700', fontSize: 13 }
});