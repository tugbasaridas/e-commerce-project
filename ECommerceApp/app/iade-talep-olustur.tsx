import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function IadeTalepOlustur() {
  const router = useRouter();
  
  // Siparişlerim sayfasından gönderilecek verileri yakalıyoruz
  const { detayId, urunAd, resimUrl, fiyat, siparisId } = useLocalSearchParams<{
    detayId: string;
    urunAd: string;
    resimUrl: string;
    fiyat: string;
    siparisId: string;
  }>();

  const [iadeSebebi, setIadeSebebi] = useState('');
  const [seciliHizliSebep, setSeciliHizliSebep] = useState('');
  const [loading, setLoading] = useState(false);

  const hizliSebepler = [
    "Beden / Numara uymadı",
    "Ürün kusurlu / Hasarlı geldi",
    "Görseldeki gibi değil",
    "Yanlış ürün gönderilmiş",
    "Vazgeçtim / Beğenmedim",
    "Diğer"
  ];

  const hizliSebepSec = (sebep: string) => {
    setSeciliHizliSebep(sebep);
    // Eğer "Diğer" seçilirse metin kutusunu boş bırak, yoksa metin kutusuna sebebi yaz
    if (sebep === 'Diğer') {
      setIadeSebebi('');
    } else {
      setIadeSebebi(sebep);
    }
  };

  const iadeTalebiGonder = async () => {
    if (!iadeSebebi || iadeSebebi.trim().length < 5) {
      Alert.alert("Uyarı", "Lütfen iade sebebini açıklayın.");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      await axios.post(`${API_CONFIG.BASE_URL}/siparisler/iade-talep`, 
      {
        SiparisDetayId: parseInt(detayId),
        IadeSebebi: iadeSebebi.trim()
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert(
        "Talebiniz Alındı", 
        "İade talebiniz başarıyla satıcıya iletildi. Durumunu 'İade Taleplerim' sayfasından takip edebilirsiniz.",
        [{ text: "Tamam", onPress: () => router.replace('/iade-taleplerim' as any) }]
      );
    } catch (error: any) {
      const hata = error.response?.data?.mesaj || error.response?.data?.Mesaj || "İade talebi oluşturulamadı.";
      Alert.alert("Hata", hata);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerBaslik}>İade Talebi Oluştur</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.icerik} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.bilgiMetni}>
            <Text style={{fontWeight: 'bold'}}>#{siparisId}</Text> numaralı siparişinizdeki aşağıdaki ürün için iade talebi oluşturuyorsunuz.
          </Text>

          <View style={styles.urunKarti}>
            <Image source={{ uri: resimUrl || 'https://via.placeholder.com/150' }} style={styles.urunResim} />
            <View style={styles.urunBilgi}>
              <Text style={styles.urunAd} numberOfLines={2}>{urunAd}</Text>
              <Text style={styles.urunFiyat}>{parseFloat(fiyat).toFixed(2)} TL</Text>
            </View>
          </View>

          <View style={styles.formAlani}>
            <Text style={styles.formBaslik}>İade Sebebiniz Nedir?</Text>
            
            <View style={styles.hizliSebepKutusu}>
              {hizliSebepler.map((sebep, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.sebepButon, seciliHizliSebep === sebep && styles.sebepButonAktif]}
                  onPress={() => hizliSebepSec(sebep)}
                >
                  <Text style={[styles.sebepYazi, seciliHizliSebep === sebep && styles.sebepYaziAktif]}>
                    {sebep}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.formBaslik, {marginTop: 20}]}>Ek Açıklama (İsteğe Bağlı/Zorunlu)</Text>
            <TextInput 
              style={styles.textInput} 
              placeholder="İade sebebinizi detaylandırın..." 
              value={iadeSebebi} 
              onChangeText={(text) => {
                setIadeSebebi(text);
                if (seciliHizliSebep !== 'Diğer') setSeciliHizliSebep('Diğer');
              }} 
              multiline 
            />
          </View>

        </ScrollView>

        <View style={styles.altSabitAlan}>
          <TouchableOpacity style={styles.onayButon} onPress={iadeTalebiGonder} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text style={styles.onayButonYazi}>Talebi Gönder</Text>
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  geriButon: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerBaslik: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  icerik: { padding: 20, paddingBottom: 40 },
  
  bilgiMetni: { fontSize: 14, color: '#666', lineHeight: 22, marginBottom: 15 },
  
  urunKarti: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 25 },
  urunResim: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#f5f5f5' },
  urunBilgi: { flex: 1, paddingLeft: 15, justifyContent: 'center' },
  urunAd: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  urunFiyat: { fontSize: 16, fontWeight: 'bold', color: '#FF9F00' },

  formAlani: { backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#eee' },
  formBaslik: { fontSize: 15, fontWeight: 'bold', color: '#111', marginBottom: 15 },
  
  hizliSebepKutusu: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sebepButon: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  sebepButonAktif: { backgroundColor: '#FFF0F0', borderColor: '#E53935' },
  sebepYazi: { fontSize: 13, color: '#555', fontWeight: '500' },
  sebepYaziAktif: { color: '#E53935', fontWeight: 'bold' },

  textInput: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 15, height: 120, textAlignVertical: 'top', fontSize: 14, color: '#333' },
  
  altSabitAlan: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  onayButon: { backgroundColor: '#E53935', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  onayButonYazi: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});