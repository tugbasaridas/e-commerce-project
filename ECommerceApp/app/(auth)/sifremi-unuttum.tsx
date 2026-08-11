import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SifremiUnuttum() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const kodGonder = async () => {
    if (!email || !email.includes('@')) {
      return Alert.alert("Hata", "Lütfen geçerli bir e-posta adresi girin.");
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}/Kullanicilar/sifremi-unuttum`, { email: email.trim().toLowerCase() });
      Alert.alert("Başarılı", response.data.mesaj || "Sıfırlama kodu gönderildi. Lütfen konsolu kontrol edin.");
      
      // E-posta bilgisini sonraki sayfaya taşıyoruz
      router.push({ pathname: '/sifre-dogrulama' as any, params: { email: email.trim().toLowerCase() } });
    } catch (error: any) {
      Alert.alert("Hata", error.response?.data?.mesaj || "Bir hata oluştu.");
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
            <Ionicons name="mail-unread-outline" size={50} color="orange" />
          </View>
          <Text style={styles.baslik}>Şifrenizi mi Unuttunuz?</Text>
          <Text style={styles.altBaslik}>Hesabınıza bağlı e-posta adresinizi girin. Size şifrenizi sıfırlamanız için bir kod göndereceğiz.</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E-Posta Adresiniz"
                placeholderTextColor="#A1A1A1"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <TouchableOpacity style={styles.btn} onPress={kodGonder} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sıfırlama Kodu Gönder</Text>}
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