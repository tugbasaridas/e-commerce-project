import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DogrulamaEkrani() {
  const router = useRouter();
  const { kod, telefon } = useLocalSearchParams<{ kod: string, telefon: string }>();
  const [girilenKod, setGirilenKod] = useState('');

  const dogrula = () => {
    if (girilenKod === kod) {
      router.replace({
        pathname: '/odeme', 
        params: { dogrulandi: 'true' }
      });
    } else {
      Alert.alert("Hata", "Girdiğiniz kod hatalı!");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Ionicons name="shield-checkmark-outline" size={80} color="#FFB800" style={{ marginBottom: 20 }} />
      <Text style={styles.baslik}>SMS Doğrulama</Text>
      <Text style={styles.altMetin}>
        {telefon} numarasına gönderilen 6 haneli kodu giriniz.
      </Text>

      {/* BURASI: Kullanıcının girmesi gereken kodu arayüzde gösteriyoruz */}
      <View style={styles.kodKutusu}>
        <Text style={styles.kodEtiket}>Deneme Amaçlı Onay Kodu:</Text>
        <Text style={styles.kodDeger}>{kod}</Text>
      </View>

      <TextInput 
        style={styles.input} 
        keyboardType="number-pad" 
        maxLength={6} 
        value={girilenKod} 
        onChangeText={setGirilenKod}
        placeholder="000000"
        textAlign="center"
      />
      
      <TouchableOpacity style={styles.buton} onPress={dogrula}>
        <Text style={styles.butonYazi}>Onayla ve Öde</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 20 },
  baslik: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  altMetin: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  
  // Kod gösterme alanı stilleri
  kodKutusu: { backgroundColor: '#FFF9E6', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#FFE599', width: '80%' },
  kodEtiket: { fontSize: 12, color: '#997400', marginBottom: 5 },
  kodDeger: { fontSize: 22, fontWeight: 'bold', color: '#B8860B' },

  input: { width: '80%', borderWidth: 2, borderColor: '#FFB800', padding: 20, borderRadius: 15, fontSize: 24, letterSpacing: 10, marginBottom: 20 },
  buton: { backgroundColor: '#FFB800', padding: 15, width: '80%', borderRadius: 10, alignItems: 'center' },
  butonYazi: { fontWeight: 'bold', fontSize: 16 }
});