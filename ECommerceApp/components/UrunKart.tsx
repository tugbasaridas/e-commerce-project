import { View, Text, StyleSheet } from 'react-native';
import {Urun} from '@/types/Urun'; 

// components/UrunKart.tsx
export default function UrunKart({ urun }: { urun: Urun }) {
  return (
    <View style={styles.kart}>
      {/* Backend'den gelen Kategori adını direkt kullanabilirsin */}
      <Text style={styles.kategoriEtiket}>{urun.kategori?.ad || "Kategorisiz"}</Text>
      
      <Text style={styles.baslik}>{urun.ad}</Text>
      <Text style={styles.aciklama}>{urun.aciklama}</Text>
      <Text style={styles.fiyat}>{urun.fiyat.toFixed(2)} TL</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  kart: { padding: 15, margin: 10, backgroundColor: '#fff', borderRadius: 12, elevation: 3 },
  kategoriEtiket: { fontSize: 10, color: '#888', textTransform: 'uppercase' },
  baslik: { fontSize: 18, fontWeight: 'bold' },
  aciklama: { fontSize: 14, color: '#555', marginVertical: 5 },
  fiyat: { fontSize: 16, fontWeight: 'bold', color: '#ff6347' }
});