import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function YeniSifre() {
  const router = useRouter();
  const { email, kod } = useLocalSearchParams<{ email: string, kod: string }>();
  const [loading, setLoading] = useState(false);
  const [yeniSifre, setYeniSifre] = useState('');
  const [sifreTekrar, setSifreTekrar] = useState('');

  const sifreSifirla = async () => {
    if (!yeniSifre || !sifreTekrar) {
      return Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
    }
    if (yeniSifre !== sifreTekrar) {
      return Alert.alert("Hata", "Şifreler birbiriyle eşleşmiyor.");
    }
    if (yeniSifre.length < 6) {
      return Alert.alert("Hata", "Şifreniz en az 6 karakter olmalıdır.");
    }
    
    const guvenliSifreKurali = /^(?=.*[A-Z])(?=.*\d).+$/;
    if (!guvenliSifreKurali.test(yeniSifre)) {
      return Alert.alert("Hata", "Şifreniz daha güvenli olması için en az bir büyük harf ve bir rakam içermelidir.");
    }

    setLoading(true);
    try {
      await axios.post(`${API_CONFIG.BASE_URL}/Kullanicilar/sifre-sifirla`, {
        email: email,
        kod: kod,
        yeniSifre: yeniSifre
      });

      Alert.alert("Başarılı", "Şifreniz başarıyla yenilendi!", [
        { text: "Giriş Yap", onPress: () => router.replace('/giris' as any) } 
      ]);
    } catch (error: any) {
      Alert.alert("Hata", error.response?.data?.mesaj || "Şifre sıfırlanamadı. Kod hatalı veya süresi geçmiş olabilir.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.geriBtn}>
            <Ionicons name="arrow-back" size={28} color="#1C1C1E" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.icerik} showsVerticalScrollIndicator={false}>
          <View style={styles.ikonKutusu}>
            <Ionicons name="lock-closed-outline" size={50} color="orange" />
          </View>
          <Text style={styles.baslik}>Yeni Şifre Belirle</Text>
          <Text style={styles.altBaslik}>Güvenliğiniz için büyük harf ve rakam içeren güçlü bir şifre oluşturun.</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Yeni Şifre"
                placeholderTextColor="#A1A1A1"
                secureTextEntry={false} // Sunum için false bırakıldı, istersen true yapabilirsin
                value={yeniSifre}
                onChangeText={setYeniSifre}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Yeni Şifre (Tekrar)"
                placeholderTextColor="#A1A1A1"
                secureTextEntry={false}
                value={sifreTekrar}
                onChangeText={setSifreTekrar}
              />
            </View>

            <TouchableOpacity style={styles.btn} onPress={sifreSifirla} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Şifremi Yenile</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: 10 },
  geriBtn: { width: 40, height: 40, justifyContent: 'center' },
  icerik: { paddingHorizontal: 25, paddingTop: 20, paddingBottom: 50 },
  ikonKutusu: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 25 },
  baslik: { fontSize: 26, fontWeight: 'bold', color: '#1C1C1E', textAlign: 'center', marginBottom: 12 },
  altBaslik: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 35, paddingHorizontal: 10 },
  form: { width: '100%' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, paddingHorizontal: 15, height: 55, marginBottom: 15 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#1C1C1E' },
  btn: { backgroundColor: 'orange', borderRadius: 12, height: 55, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: 'orange', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }
});