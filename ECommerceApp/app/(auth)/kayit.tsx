import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Kayit() {
  const router = useRouter();
  const [ad, setAd] = useState('');
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [loading, setLoading] = useState(false);

  const kayitIslemi = async () => {
    // 1. Boş Alan Kontrolü
    if (!ad || !email || !sifre) {
      Alert.alert("Uyarı", "Lütfen tüm alanları doldurun.");
      return;
    }

    // 2. E-posta Formatı Kontrolü (Regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Geçersiz E-posta", "Lütfen geçerli bir e-posta adresi giriniz (Örn: ornek@gmail.com).");
      return;
    }

    setLoading(true);
    try {
      // Backend'deki kayıt endpoint'ine istek atıyoruz
      await axios.post(`${API_CONFIG.BASE_URL}/kullanicilar/kayit`, {
        adSoyad: ad, 
        email: email,
        sifre: sifre
      });

      setLoading(false);
      Alert.alert("Başarılı", "Hesabınız başarıyla oluşturuldu!", [
        { text: "Giriş Yap", onPress: () => router.replace('/giris') } 
      ]);
      
    } catch (error: any) {
      setLoading(false);
      
      // Backend'in tam olarak ne gönderdiğini terminale (VS Code) yazdıralım
      console.log("BACKEND'DEN GELEN HATA:", error.response?.data);

      let hataMesaji = "Kayıt işlemi sırasında bir hata oluştu.";
      const veri = error.response?.data;

      // .NET'in gönderebileceği tüm farklı hata senaryolarını kontrol ediyoruz
      if (veri) {
        if (typeof veri === 'string') {
          hataMesaji = veri; 
        } else if (veri.mesaj) {
          hataMesaji = veri.mesaj;
        } else if (veri.Mesaj) {
          hataMesaji = veri.Mesaj;
        } else if (veri.title) {
          hataMesaji = veri.title; 
        }
      }
      
      Alert.alert("Kayıt Hatası", hataMesaji);
    }
  };

  return (
    <View style={styles.container}>
    {/* SOL ÜST GERİ OK BUTONU */}
      <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
       <Ionicons name="arrow-back" size={28} color="#333" />
      </TouchableOpacity>
      <Text style={styles.baslik}>Yeni Hesap Oluştur</Text>
      <Text style={styles.altMetin}>Hemen kayıt olun ve alışverişe başlayın.</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Adınız Soyadınız" 
        value={ad}
        onChangeText={setAd}
      />

      <TextInput 
        style={styles.input} 
        placeholder="E-posta Adresiniz" 
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Şifreniz" 
        secureTextEntry
        value={sifre}
        onChangeText={setSifre}
      />

      <TouchableOpacity style={styles.buton} onPress={kayitIslemi} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.butonYazi}>Kayıt Ol</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/giris')} style={{ marginTop: 20 }}>
        <Text style={styles.yonlendirme}>Zaten hesabınız var mı? <Text style={{ fontWeight: 'bold', color: 'orange' }}>Giriş Yap</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20, justifyContent: 'center' },
  baslik: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  altMetin: { fontSize: 16, color: '#666', marginBottom: 30 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 10, marginBottom: 15, backgroundColor: '#f9f9f9' },
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