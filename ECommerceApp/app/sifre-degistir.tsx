import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SifreDegistir() {
  const router = useRouter();
  
  const [eskiSifre, setEskiSifre] = useState('');
  const [yeniSifre, setYeniSifre] = useState('');
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('');
  const [loading, setLoading] = useState(false);

  const [eskiGizli, setEskiGizli] = useState(true);
  const [yeniGizli, setYeniGizli] = useState(true);

  const sifreKaydetApi = async () => {
    if (!eskiSifre || !yeniSifre || !yeniSifreTekrar) {
      Alert.alert("Eksik Bilgi 🥺", "Lütfen tüm alanları doldurur musun?");
      return;
    }
    if (yeniSifre !== yeniSifreTekrar) {
      Alert.alert("Uyuşmazlık 🧐", "Girdiğin yeni şifreler birbiriyle eşleşmiyor.");
      return;
    }
    if (yeniSifre.length < 6) {
      Alert.alert("Biraz Kısa Oldu 📏", "Yeni şifren en az 6 karakter olmalıdır.");
      return;
    }
    if (!/[A-Z]/.test(yeniSifre)) {
      Alert.alert("Daha Güvenli Olmalı 🛡️", "Güvenliğin için yeni şifrenin içinde en az 1 Büyük Harf olmalı.");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(`${API_CONFIG.BASE_URL}/kullanicilar/sifre-degistir`, 
        {
          EskiSifre: eskiSifre,
          YeniSifre: yeniSifre,
          YeniSifreTekrar: yeniSifreTekrar
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Harika! 🎉", "Şifren başarıyla ve güvenli bir şekilde güncellendi.", [
        { text: "Tamam", onPress: () => router.back() }
      ]);
   } catch (error: any) {
      let hataMesaji = "Şifre değiştirme işlemi başarısız oldu.";

      if (error.response?.data) {
        const data = error.response.data;
        hataMesaji = data.Mesaj || data.mesaj || (typeof data === 'string' ? data : "Bir hata oluştu.");
      }

      Alert.alert("Eyvah! 🥺", hataMesaji);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollIcerik}>
          
          {/* Tatlı Karşılama Alanı (Hero) */}
          <View style={styles.heroKutusu}>
            <View style={styles.heroIkonArkaplan}>
              <Ionicons name="lock-closed" size={44} color="#FF9F00" />
            </View>
            <Text style={styles.heroBaslik}>Şifreni Yenile 🔐</Text>
            <Text style={styles.heroAltMetin}>
              Hesabını güvende tutmak için şifreni dilediğin zaman güncelleyebilirsin. Sırrın bizimle güvende!
            </Text>
          </View>

          {/* Form Alanı */}
          <View style={styles.formKutusu}>
            
            {/* Eski Şifre */}
            <View style={styles.inputGrubu}>
              <Text style={styles.etiket}>Mevcut Şifren</Text>
              <View style={styles.inputSatiri}>
                <Ionicons name="keypad" size={20} color="#FF9F00" style={styles.inputIkon} />
                <TextInput
                  style={styles.input}
                  placeholder="Şu an kullandığın şifre"
                  placeholderTextColor="#A1A1A1"
                  secureTextEntry={eskiGizli}
                  value={eskiSifre}
                  onChangeText={setEskiSifre}
                />
                <TouchableOpacity onPress={() => setEskiGizli(!eskiGizli)} style={styles.gozIkon}>
                  <Ionicons name={eskiGizli ? "eye-off" : "eye"} size={22} color="#999" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Yeni Şifre */}
            <View style={styles.inputGrubu}>
              <Text style={styles.etiket}>Yeni Şifren</Text>
              <View style={styles.inputSatiri}>
                <Ionicons name="shield-checkmark" size={20} color="#FF9F00" style={styles.inputIkon} />
                <TextInput
                  style={styles.input}
                  placeholder="En az 6 karakter, 1 Büyük Harf"
                  placeholderTextColor="#A1A1A1"
                  secureTextEntry={yeniGizli}
                  value={yeniSifre}
                  onChangeText={setYeniSifre}
                />
                <TouchableOpacity onPress={() => setYeniGizli(!yeniGizli)} style={styles.gozIkon}>
                  <Ionicons name={yeniGizli ? "eye-off" : "eye"} size={22} color="#999" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Yeni Şifre Tekrar */}
            <View style={styles.inputGrubu}>
              <Text style={styles.etiket}>Yeni Şifren (Tekrar)</Text>
              <View style={styles.inputSatiri}>
                <Ionicons name="checkmark-done-circle" size={22} color="#FF9F00" style={styles.inputIkon} />
                <TextInput
                  style={styles.input}
                  placeholder="Yeni şifreni onayla"
                  placeholderTextColor="#A1A1A1"
                  secureTextEntry={yeniGizli}
                  value={yeniSifreTekrar}
                  onChangeText={setYeniSifreTekrar}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.kaydetButon, loading && styles.kaydetButonPasif]} 
              onPress={sifreKaydetApi}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.butonYazi}>Şifremi Güncelle</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollIcerik: { paddingHorizontal: 20, paddingBottom: 40 },
  
  heroKutusu: { alignItems: 'center', marginTop: 20, marginBottom: 25 },
  heroIkonArkaplan: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF4E5', justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#FF9F00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  heroBaslik: { fontSize: 22, fontWeight: '900', color: '#1C1C1E', marginBottom: 8 },
  heroAltMetin: { fontSize: 14, color: '#8E8E93', textAlign: 'center', paddingHorizontal: 20, lineHeight: 20 },
  
  formKutusu: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  
  inputGrubu: { marginBottom: 20 },
  etiket: { fontSize: 14, fontWeight: '700', color: '#3A3A3C', marginBottom: 8, marginLeft: 4 },
  
  inputSatiri: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 14, 
    paddingHorizontal: 14, 
    height: 58, 
    borderWidth: 1.5, 
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1
  },
  inputIkon: { marginRight: 3 },
  input: { flex: 1, fontSize: 15, color: '#1C1C1E', fontWeight: '500' },
  gozIkon: { padding: 8 },
  
  kaydetButon: { flexDirection: 'row', backgroundColor: '#FF9F00', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#FF9F00', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  kaydetButonPasif: { backgroundColor: '#FFD180', shadowOpacity: 0 },
  butonYazi: { color: '#FFFFFF', fontSize: 17, fontWeight: 'bold', letterSpacing: 0.5 }
});