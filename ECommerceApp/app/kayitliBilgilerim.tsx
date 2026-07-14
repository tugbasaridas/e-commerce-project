import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function KayitliBilgilerim() {
  const router = useRouter();
  // Artık tek bir obje değil, dizi (array) tutuyoruz
  const [kayitliAdresler, setKayitliAdresler] = useState<any[]>([]);
  const [kayitliKartlar, setKayitliKartlar] = useState<any[]>([]);

  useEffect(() => {
    bilgileriGetir();
  }, []);

  const bilgileriGetir = async () => {
    const userId = await AsyncStorage.getItem('userId') || 'ortak';
    // Anahtarları çoğul (Adresler/Kartlar) yaptık
    const adresVeri = await AsyncStorage.getItem(`@kayitliAdresler_${userId}`);
    const kartVeri = await AsyncStorage.getItem(`@kayitliKartlar_${userId}`);

    if (adresVeri) setKayitliAdresler(JSON.parse(adresVeri));
    if (kartVeri) setKayitliKartlar(JSON.parse(kartVeri));
  };

  const bilgiyiSil = async (tur: 'adres' | 'kart', id: string) => {
    Alert.alert(
      "Emin misiniz?",
      `Kayıtlı ${tur === 'adres' ? 'adresinizi' : 'kartınızı'} silmek istediğinize emin misiniz?`,
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Sil", 
          style: 'destructive',
          onPress: async () => {
            const userId = await AsyncStorage.getItem('userId') || 'ortak';
            
            if (tur === 'adres') {
              const guncelAdresler = kayitliAdresler.filter(a => a.id !== id);
              await AsyncStorage.setItem(`@kayitliAdresler_${userId}`, JSON.stringify(guncelAdresler));
              setKayitliAdresler(guncelAdresler);
            } else {
              const guncelKartlar = kayitliKartlar.filter(k => k.id !== id);
              await AsyncStorage.setItem(`@kayitliKartlar_${userId}`, JSON.stringify(guncelKartlar));
              setKayitliKartlar(guncelKartlar);
            }
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.baslik}>Kayıtlı Bilgilerim</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* KAYITLI KARTLAR BÖLÜMÜ */}
        <Text style={styles.bolumBaslik}>Kayıtlı Kredi Kartlarım ({kayitliKartlar.length})</Text>
        {kayitliKartlar.length > 0 ? (
          kayitliKartlar.map((kart, index) => (
            <View key={kart.id || index} style={styles.sanalKartContainer}>
              <View style={styles.sanalKart}>
                <TouchableOpacity style={styles.silIkon} onPress={() => bilgiyiSil('kart', kart.id)}>
                  <Ionicons name="trash-outline" size={20} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.kartUstSatir}>
                  <View style={styles.kartCip} />
                  <Ionicons name="wifi-outline" size={24} color="#FFF" style={{ transform: [{ rotate: '90deg' }] }} />
                </View>
                <Text style={styles.kartNoYazi}>{kart.kartNo}</Text>
                <View style={styles.kartAltSatir}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.kartEtiket}>KART SAHİBİ</Text>
                    <Text style={styles.kartDeger} numberOfLines={1}>{kart.kartSahibi.toUpperCase()}</Text>
                  </View>
                  <View style={{ marginRight: 20 }}>
                    <Text style={styles.kartEtiket}>SKT</Text>
                    <Text style={styles.kartDeger}>{kart.skt}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.bosKutu}>
            <Ionicons name="card-outline" size={40} color="#ccc" />
            <Text style={styles.bosKutuYazi}>Henüz kaydedilmiş bir kartınız bulunmuyor.</Text>
          </View>
        )}

        {/* KAYITLI ADRESLER BÖLÜMÜ */}
        <Text style={[styles.bolumBaslik, { marginTop: 30 }]}>Kayıtlı Teslimat Adreslerim ({kayitliAdresler.length})</Text>
        {kayitliAdresler.length > 0 ? (
          kayitliAdresler.map((adres, index) => (
            <View key={adres.id || index} style={styles.adresKutu}>
               <TouchableOpacity style={styles.silIkonAdres} onPress={() => bilgiyiSil('adres', adres.id)}>
                  <Ionicons name="trash-outline" size={20} color="#FF4757" />
                </TouchableOpacity>
              <View style={styles.adresSatir}>
                <Ionicons name="home" size={20} color="#FFB800" />
                <Text style={styles.adresBaslik}>{adres.baslik}</Text>
              </View>
              <View style={styles.adresDetay}>
                <Text style={styles.adresMetin}>{adres.acikAdres}</Text>
                <Text style={styles.adresMetin}>{adres.ilce} / {adres.il}</Text>
                <Text style={[styles.adresMetin, { fontWeight: 'bold', color: '#333', marginTop: 10 }]}>
                  <Ionicons name="call-outline" size={14} color="#666" /> {adres.telefon}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.bosKutu}>
            <Ionicons name="location-outline" size={40} color="#ccc" />
            <Text style={styles.bosKutuYazi}>Henüz kaydedilmiş bir adresiniz bulunmuyor.</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  geriButon: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  baslik: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  bolumBaslik: { fontSize: 16, fontWeight: 'bold', color: '#555', marginBottom: 15, paddingLeft: 5 },
  
  sanalKartContainer: { alignItems: 'center', marginBottom: 15 },
  sanalKart: { width: '100%', height: 200, backgroundColor: '#FF7597', borderRadius: 16, padding: 20, justifyContent: 'space-between', shadowColor: '#FF7597', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  kartUstSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kartCip: { width: 45, height: 32, backgroundColor: '#FFE3E8', borderRadius: 6, opacity: 0.9 },
  kartNoYazi: { color: '#FFF', fontSize: 21, fontWeight: '600', letterSpacing: 2, textAlign: 'center', marginVertical: 15 },
  kartAltSatir: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  kartEtiket: { color: '#FFF', opacity: 0.7, fontSize: 10, fontWeight: '500', marginBottom: 4 },
  kartDeger: { color: '#FFF', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  silIkon: { position: 'absolute', top: 15, right: 15, zIndex: 1, padding: 5 },

  adresKutu: { backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#eee', marginBottom: 15 },
  adresSatir: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  adresBaslik: { fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 8 },
  adresDetay: { paddingLeft: 28 },
  adresMetin: { fontSize: 14, color: '#666', lineHeight: 22 },
  silIkonAdres: { position: 'absolute', top: 15, right: 15, zIndex: 1, padding: 5 },

  bosKutu: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 30, borderRadius: 16, borderWidth: 1, borderColor: '#eee', borderStyle: 'dashed' },
  bosKutuYazi: { color: '#888', marginTop: 10, fontSize: 14 }
});