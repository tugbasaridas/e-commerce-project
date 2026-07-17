import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SanalKart from '../components/SanalKart';
import { useOdeme } from '../hooks/custom/useOdeme';

export default function OdemeEkrani() {
  const router = useRouter();
  const { tutar, dogrulandi } = useLocalSearchParams<{ tutar: string, dogrulandi: string }>();
  
  const {
    odemeYontemi, setOdemeYontemi,
    adresBaslik, setAdresBaslik, il, setIl, ilce, setIlce, acikAdres, setAcikAdres, telefon, handleTelefonChange,
    kartNo, handleKartNoChange, kartSahibi, setKartSahibi, skt, handleSktChange, cvv, setCvv,
    bilgileriKaydet, setBilgileriKaydet,
    isFlipped, setIsFlipped, odemeyiBaslat,
    kayitliAdreslerList, kayitliKartlarList, adresSec, kartSec
  } = useOdeme(dogrulandi);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} /></TouchableOpacity>
        <Text style={styles.headerBaslik}>Ödeme Bilgileri</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Ödeme Yöntemi Tabları */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tabButon, odemeYontemi === 'Kredi Kartı' && styles.aktifTab]} onPress={() => setOdemeYontemi('Kredi Kartı')}>
            <Ionicons name="card-outline" size={18} color={odemeYontemi === 'Kredi Kartı' ? '#000' : '#666'} />
            <Text style={[styles.tabYazi, odemeYontemi === 'Kredi Kartı' && styles.aktifTabYazi]}>Kredi Kartı</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabButon, odemeYontemi === 'Kapıda Ödeme' && styles.aktifTab]} onPress={() => setOdemeYontemi('Kapıda Ödeme')}>
            <Ionicons name="home-outline" size={18} color={odemeYontemi === 'Kapıda Ödeme' ? '#000' : '#666'} />
            <Text style={[styles.tabYazi, odemeYontemi === 'Kapıda Ödeme' && styles.aktifTabYazi]}>Kapıda Ödeme</Text>
          </TouchableOpacity>
        </View>

        {/* 1. KREDİ KARTI BÖLÜMÜ */}
        {odemeYontemi === 'Kredi Kartı' && (
          <View>
            <SanalKart 
              kartNo={kartNo} 
              kartSahibi={kartSahibi} 
              skt={skt} 
              cvv={cvv} 
              isFlipped={isFlipped} 
            />

            {kayitliKartlarList.length > 0 && (
              <View style={styles.hizliSecimContainer}>
                <Text style={styles.hizliSecimBaslik}>Kayıtlı Kartlarım (Dokun ve Doldur)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yatayListe}>
                  {kayitliKartlarList.map((kart) => (
                    <TouchableOpacity key={kart.id} style={styles.hizliKartChip} onPress={() => kartSec(kart)}>
                      <Ionicons name="card" size={16} color="#FF7597" />
                      <Text style={styles.hizliChipYazi}>
                        {kart.kartNo.replace(/.(?=.{4})/g, "*")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <TextInput style={styles.input} placeholder="Kart Sahibi" value={kartSahibi} onChangeText={setKartSahibi} onFocus={() => setIsFlipped(false)} />
            <TextInput style={styles.input} placeholder="Kart No" keyboardType="number-pad" value={kartNo} onChangeText={handleKartNoChange} onFocus={() => setIsFlipped(false)} />
            
            <View style={styles.ikiliSatir}>
                <TextInput style={[styles.input, {flex: 1}]} placeholder="AA/YY" value={skt} onChangeText={handleSktChange} keyboardType="number-pad" onFocus={() => setIsFlipped(false)} />
                <TextInput style={[styles.input, {flex: 1, marginLeft: 10}]} placeholder="CVV" keyboardType="number-pad" maxLength={3} value={cvv} onChangeText={setCvv} onFocus={() => setIsFlipped(true)} />
            </View>
          </View>
        )}

        {/* 2. ADRES BÖLÜMÜ */}
        <View style={styles.formContainer}>
            {kayitliAdreslerList.length > 0 && (
              <View style={styles.hizliSecimContainer}>
                <Text style={styles.hizliSecimBaslik}>Kayıtlı Adreslerim (Dokun ve Doldur)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yatayListe}>
                  {kayitliAdreslerList.map((adres) => (
                    <TouchableOpacity key={adres.id} style={styles.hizliAdresChip} onPress={() => adresSec(adres)}>
                      <Ionicons name="home" size={16} color="#FFB800" />
                      <Text style={styles.hizliChipYazi}>{adres.baslik}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <TextInput style={styles.input} placeholder="Adres Başlığı (Örn: Ev, İş)" value={adresBaslik} onChangeText={setAdresBaslik} onFocus={() => setIsFlipped(false)} />
            <TextInput style={styles.input} placeholder="Telefon (5XX XXX XX XX)" keyboardType="phone-pad" maxLength={16} value={telefon} onChangeText={handleTelefonChange} onFocus={() => setIsFlipped(false)} />
            
            <View style={styles.ikiliSatir}>
                <TextInput style={[styles.input, {flex: 1}]} placeholder="İl" value={il} onChangeText={setIl} onFocus={() => setIsFlipped(false)} />
                <TextInput style={[styles.input, {flex: 1, marginLeft: 10}]} placeholder="İlçe" value={ilce} onChangeText={setIlce} onFocus={() => setIsFlipped(false)} />
            </View>
            <TextInput style={styles.input} placeholder="Açık Adres" value={acikAdres} onChangeText={setAcikAdres} onFocus={() => setIsFlipped(false)} />
        </View>

        <TouchableOpacity style={styles.checkboxContainer} onPress={() => setBilgileriKaydet(!bilgileriKaydet)}>
          <View style={[styles.checkbox, bilgileriKaydet && styles.checkboxSecili]} />
          <Text>Bilgilerimi kaydet</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.altSabitAlan}>
        <TouchableOpacity style={styles.odemeButon} onPress={odemeyiBaslat}>
          <Text style={styles.odemeButonYazi}>Ödemeyi Tamamla ({tutar ? tutar : '0.00'} TL)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff' },
  headerBaslik: { fontSize: 20, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', marginBottom: 20 },
  tabButon: { flex: 1, padding: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: '#eee', borderRadius: 10, marginHorizontal: 5 },
  aktifTab: { backgroundColor: '#FFB800', borderColor: '#FFB800' },
  tabYazi: { fontWeight: '600', color: '#666' },
  aktifTabYazi: { color: '#000' },
  formContainer: { marginTop: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 15, marginBottom: 15 },
  ikiliSatir: { flexDirection: 'row' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: '#ccc', borderRadius: 6, marginRight: 10 },
  checkboxSecili: { backgroundColor: '#FFB800', borderColor: '#FFB800' },
  altSabitAlan: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
  odemeButon: { backgroundColor: '#FFB800', padding: 18, borderRadius: 12, alignItems: 'center' },
  odemeButonYazi: { fontWeight: 'bold', fontSize: 16, color: '#000' },
  hizliSecimContainer: { marginBottom: 15 },
  hizliSecimBaslik: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 8, paddingLeft: 2 },
  yatayListe: { paddingVertical: 5, gap: 10 },
  hizliKartChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5F7', borderWidth: 1, borderColor: '#FFCCD7', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, gap: 6 },
  hizliAdresChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFDF5', borderWidth: 1, borderColor: '#FFEAA7', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, gap: 6 },
  hizliChipYazi: { fontSize: 13, fontWeight: 'bold', color: '#333' }
});