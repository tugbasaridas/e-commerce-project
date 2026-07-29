import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const getDurumRenkleri = (durum: string) => {
  switch (durum) {
    case 'Hazırlanıyor': return { bg: '#FFF4E5', text: '#FF9F00', icon: 'time-outline' };
    case 'Kargoya Verildi': return { bg: '#E1F5FE', text: '#4EA8DE', icon: 'cube-outline' };
    case 'Tamamlandı': return { bg: '#F0FDF4', text: '#28A745', icon: 'checkmark-circle-outline' };
    case 'İptal Edildi':
    case 'İptal': return { bg: '#FFEBEA', text: '#EF233C', icon: 'close-circle-outline' };
    default: return { bg: '#F8F9FA', text: '#8E8E93', icon: 'ellipse-outline' };
  }
};

interface SiparisKartProps {
  item: any;
  onGuncelle: (siparis: any, seciliUrun: any) => void; 
  onKargoTakip: (id: number) => void;
  isAdmin?: boolean; 
}

export default function SiparisKart({ item, onGuncelle, onKargoTakip, isAdmin = false }: SiparisKartProps) {
  const urunListesi = item.satilanUrunler || item.urunler || [];

  return (
    <View style={styles.kart}>
      <View style={styles.kartUst}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.siparisNo}>Sipariş #{item.id || item.siparisId}</Text>
          <View style={styles.kullaniciBilgiSatiri}>
            <Ionicons name="person" size={12} color="#8E8E93" />
            <Text style={styles.kullaniciYazi}>{item.kullaniciAdSoyad || item.musteriAd || 'İsimsiz Kullanıcı'}</Text>
          </View>
        </View>
        <View style={[styles.durumBadge, { backgroundColor: '#F2F2F7' }]}>
          <Text style={[styles.durumYazi, { color: '#1C1C1E' }]}>{item.durum}</Text>
        </View>
      </View>

      <View style={styles.ayiriciCizgi} />

      <View style={styles.urunlerKutusu}>
        {urunListesi.map((urun: any, index: number) => {
          const renkler = getDurumRenkleri(urun.durum || 'Hazırlanıyor');
          
          return (
            <View key={index} style={styles.urunSatiri}>
              <View style={{ flex: 1 }}>
                <Text style={styles.urunDetayYazi}>
                  <Text style={styles.urunAdet}>{urun.adet}x</Text> {urun.ad} 
                  <Text style={styles.urunFiyat}> ({(urun.birimFiyat * urun.adet).toFixed(2)} TL)</Text>
                </Text>
                <View style={[styles.kucukDurumBadge, { backgroundColor: renkler.bg }]}>
                  <Ionicons name={renkler.icon as any} size={12} color={renkler.text} style={{ marginRight: 4 }} />
                  <Text style={[styles.kucukDurumYazi, { color: renkler.text }]}>{urun.durum || 'Hazırlanıyor'}</Text>
                </View>
              </View>

              {urun.durum !== 'Tamamlandı' && urun.durum !== 'İptal' && urun.durum !== 'İptal Edildi' && (
                <TouchableOpacity 
                  style={[styles.btnGuncelle, isAdmin && { backgroundColor: '#FF3B30', shadowColor: '#FF3B30' }]} 
                  activeOpacity={0.8} 
                  onPress={() => onGuncelle(item, urun)}
                >
                  <Ionicons name={isAdmin ? "warning-outline" : "color-wand-outline"} size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.btnGuncelleYazi}>{isAdmin ? "Müdahale Et" : "Güncelle"}</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        })}
      </View>

      <View style={styles.kargoKutusu}>
        <View style={styles.kargoSatiri}>
          <Ionicons name="location-outline" size={14} color="#8E8E93" />
          <Text style={styles.kargoAdresYazi}>{item.teslimatAdresi || 'Adres bilgisi yok.'}</Text>
        </View>
        <View style={styles.kargoSatiri}>
          <Ionicons name="call-outline" size={14} color="#00529B" />
          <Text style={[styles.kargoOdemeYazi, { color: '#00529B' }]}>{item.telefon || item.iletisimTelfonu || 'Belirtilmemiş'}</Text>
        </View>
      </View>

      {!isAdmin && (
        <>
          <View style={styles.ayiriciCizgi} />
          <View style={styles.kartAlt}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fiyatBaslik}>Müşterinin Ödediği (Brüt):</Text>
              <Text style={styles.fiyatDegerBrut}>
                {urunListesi.reduce((toplam: number, u: any) => toplam + (u.birimFiyat * u.adet), 0).toFixed(2)} TL
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', flex: 1 }}>
              <Text style={styles.fiyatBaslik}>Sizin Kazancınız (Net):</Text>
              <Text style={styles.fiyatDegerNet}>{(item.saticiKazanci || 0).toFixed(2)} TL</Text>
            </View>
          </View>
        </>
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
  durumBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  durumYazi: { fontSize: 12, fontWeight: '700' },
  ayiriciCizgi: { height: 1, backgroundColor: '#F2F2F7', marginVertical: 12 },
  urunlerKutusu: { paddingLeft: 4, marginBottom: 8 },
  urunSatiri: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FAFAFC', padding: 10, borderRadius: 10, marginBottom: 8 },
  urunDetayYazi: { fontSize: 13, color: '#48484A', marginBottom: 6 },
  urunAdet: { fontWeight: '700', color: '#1C1C1E' },
  urunFiyat: { color: '#BFBFBF', fontSize: 12 },
  kucukDurumBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  kucukDurumYazi: { fontSize: 11, fontWeight: 'bold' },
  kargoKutusu: { backgroundColor: '#F8F9FA', padding: 10, borderRadius: 8, marginTop: 4 },
  kargoSatiri: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  kargoAdresYazi: { fontSize: 12, color: '#48484A', marginLeft: 6, flex: 1, lineHeight: 18 },
  kargoOdemeYazi: { fontSize: 12, color: '#1C1C1E', marginLeft: 6, fontWeight: '600' },
  kartAlt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  fiyatBaslik: { fontSize: 11, color: '#8E8E93', fontWeight: '500' },
  fiyatDegerBrut: { fontWeight: '700', color: '#8E8E93', fontSize: 14, marginTop: 2 },
  fiyatDegerNet: { fontWeight: '800', color: '#28A745', fontSize: 16, marginTop: 2 },
  btnGuncelle: { flexDirection: 'row', backgroundColor: '#4EA8DE', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', shadowColor: '#4EA8DE', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  btnGuncelleYazi: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
});