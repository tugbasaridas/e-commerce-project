import { View, Text, StyleSheet } from 'react-native';
import { Urun } from '@/types/Urun'; 

export default function UrunKart({ urun }: { urun: Urun }) {
  // YENİ MANTIK: Asıl fiyat üzerinden indirim yüzdesini hesapla
  const indirimYuzdesi = urun.indirimliFiyat 
    ? Math.round(((urun.fiyat - urun.indirimliFiyat) / urun.fiyat) * 100) 
    : 0;

  return (
    <View style={styles.kart}>
      <View style={styles.ustSatir}>
        <Text style={styles.kategoriEtiket}>{urun.kategori?.ad || "Kategorisiz"}</Text>
        
        {/* Sadece indirimdeyse rozet çıkar */}
        {urun.indirimliFiyat && indirimYuzdesi > 0 && (
          <Text style={styles.indirimRozeti}>%{indirimYuzdesi} İndirim</Text>
        )}
      </View>
      
      <Text style={styles.baslik}>{urun.ad}</Text>
      <Text style={styles.aciklama} numberOfLines={2}>{urun.aciklama}</Text>
      
      <View style={styles.fiyatSatiri}>
        {urun.indirimliFiyat ? (
          <>
            {/* Asıl fiyatın üstünü çiziyoruz */}
            <Text style={styles.eskiFiyat}>{urun.fiyat.toFixed(2)} TL</Text>
            {/* Yeni kırmızı indirimli fiyat */}
            <Text style={styles.fiyat}>{urun.indirimliFiyat.toFixed(2)} TL</Text>
          </>
        ) : (
          <Text style={styles.fiyat}>{urun.fiyat.toFixed(2)} TL</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kart: { padding: 15, margin: 10, backgroundColor: '#fff', borderRadius: 12, elevation: 3 },
  kategoriEtiket: { fontSize: 10, color: '#888', textTransform: 'uppercase' },
  baslik: { fontSize: 18, fontWeight: 'bold' },
  aciklama: { fontSize: 14, color: '#555', marginVertical: 5 },
  fiyat: { fontSize: 16, fontWeight: 'bold', color: '#ff6347' }, // İndirimli veya normal fiyat rengi
  ustSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  indirimRozeti: { fontSize: 10, color: '#fff', backgroundColor: '#ff6347', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: 'bold', overflow: 'hidden' },
  fiyatSatiri: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eskiFiyat: { fontSize: 14, color: '#aaa', textDecorationLine: 'line-through' } // Asıl fiyatın çizili stili
});