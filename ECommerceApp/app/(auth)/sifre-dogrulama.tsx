import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SifreDogrulama() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [kod, setKod] = useState('');

  const dogrulaVeDevamEt = () => {
    if (!kod || kod.length !== 6) {
      return Alert.alert("Hata", "Lütfen 6 haneli doğrulama kodunu eksiksiz girin.");
    }
    // E-posta ve Kodu son aşamaya taşıyoruz
    router.push({ pathname: '/yeni-sifre' as any, params: { email, kod } });
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
            <Ionicons name="keypad-outline" size={50} color="orange" />
          </View>
          <Text style={styles.baslik}>Kodu Doğrulayın</Text>
          <Text style={styles.altBaslik}><Text style={{fontWeight: 'bold', color: '#333'}}>{email}</Text> adresine gönderilen 6 haneli kodu girin.</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="6 Haneli Kod"
                placeholderTextColor="#A1A1A1"
                keyboardType="number-pad"
                maxLength={6}
                value={kod}
                onChangeText={setKod}
                autoFocus
              />
            </View>

            <TouchableOpacity style={styles.btn} onPress={dogrulaVeDevamEt}>
              <Text style={styles.btnText}>Doğrula ve İlerle</Text>
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
  input: { flex: 1, fontSize: 18, color: '#1C1C1E', letterSpacing: 5, textAlign: 'center' },
  btn: { backgroundColor: 'orange', borderRadius: 12, height: 55, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: 'orange', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }
});