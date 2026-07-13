import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Giris() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [loading, setLoading] = useState(false);
  
  // YENİ: Şifre gizleme/gösterme state'i
  const [sifreGizli, setSifreGizli] = useState(true);

  const girisIslemi = async () => {
    if (!email || !sifre) {
      Alert.alert("Uyarı", "Lütfen tüm alanları doldurun.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}/kullanicilar/giris`, {
        email: email,
        sifre: sifre
      });

      const token = response.data.token;
      const rol = response.data.rol;
      const kullaniciId = response.data.kullaniciId;

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userRole', rol);
      await AsyncStorage.setItem('userId', kullaniciId.toString());

      const gelenId = response.data.kullaniciId || response.data.userId || response.data.id;

      if (gelenId) {
        await AsyncStorage.setItem('userId', gelenId.toString());
      }

      setLoading(false);
      
      Alert.alert("Başarılı", "Giriş işlemi başarılı!", [
        { 
          text: "Tamam", 
          onPress: () => {
            if (rol === 'Admin') {
              router.replace('/admin' as any);
            } else {
              router.replace('/(tabs)' as any);
            }
          } 
        }
      ]);
      
    } catch (error) {
      setLoading(false);
      Alert.alert("Hata", "E-posta veya şifre hatalı.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color="#333" />
      </TouchableOpacity>

      <Text style={styles.baslik}>Hoş Geldiniz</Text>
      <Text style={styles.altMetin}>Alışverişe devam etmek için giriş yapın.</Text>

      <TextInput 
        style={styles.input} 
        placeholder="E-posta Adresiniz" 
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      
      {/* ŞİFRE KUTUSU (Göz İkonlu) */}
      <View style={styles.sifreAlani}>
        <TextInput 
          style={styles.sifreInput} 
          placeholder="Şifreniz" 
          secureTextEntry={sifreGizli} 
          value={sifre}
          onChangeText={setSifre}
        />
        <TouchableOpacity 
          style={styles.gozIkonu} 
          onPress={() => setSifreGizli(!sifreGizli)}
        >
          <Ionicons 
            name={sifreGizli ? "eye-off" : "eye"} 
            size={22} 
            color="#888" 
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.buton} onPress={girisIslemi} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.butonYazi}>Giriş Yap</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/kayit')} style={{ marginTop: 20 }}>
        <Text style={styles.yonlendirme}>Hesabınız yok mu? <Text style={{ fontWeight: 'bold', color: 'orange' }}>Kayıt Ol</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, justifyContent: 'center' },
  baslik: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  altMetin: { fontSize: 16, color: '#666', marginBottom: 30 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, marginBottom: 15, backgroundColor: '#f9f9f9' },
  
  // Yeni Şifre Alanı Stilleri
  sifreAlani: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 10, 
    backgroundColor: '#f9f9f9', 
    marginBottom: 15,
    paddingRight: 10 // İkon için sağdan boşluk
  },
  sifreInput: { 
    flex: 1, 
    padding: 15 
  },
  gozIkonu: { 
    padding: 5 
  },

  buton: { backgroundColor: 'orange', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  butonYazi: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  yonlendirme: { textAlign: 'center', color: '#666', fontSize: 16 },
  geriButon: {
    position: 'absolute',
    top: 50, 
    left: 20,
    zIndex: 10,
    padding: 10, 
  },
});