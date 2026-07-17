import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BildirimTipi {
  mesaj: string;
  tip: 'hata' | 'uyari' | 'basari';
}

export default function Kayit() {
  const router = useRouter();
  const [ad, setAd] = useState('');
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  
  const [sifreGorunur, setSifreGorunur] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [bildirim, setBildirim] = useState<BildirimTipi | null>(null);

  const bildirimGoster = (mesaj: string, tip: 'hata' | 'uyari' | 'basari') => {
    setBildirim({ mesaj, tip });
    
    if (tip !== 'basari') {
      setTimeout(() => {
        setBildirim(null);
      }, 4000);
    }
  };

  const kayitIslemi = async () => {
    if (!ad.trim() || !email.trim() || !sifre.trim()) {
      bildirimGoster("Lütfen tüm alanları doldurun.", 'uyari');
      return;
    }

    if (ad.trim().length < 3) {
      bildirimGoster("Ad Soyad en az 3 karakterden oluşmalıdır.", 'hata');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      bildirimGoster("Lütfen geçerli bir e-posta adresi giriniz (Örn: ornek@gmail.com).", 'hata');
      return;
    }

    if (sifre.length < 6) {
      bildirimGoster("Şifreniz en az 6 karakter uzunluğunda olmalıdır.", 'hata');
      return;
    }

    const gucluSifreRegex = /^(?=.*[A-Z])(?=.*\d).+$/;
    if (!gucluSifreRegex.test(sifre)) {
      bildirimGoster("Şifreniz en az bir büyük harf ve bir rakam içermelidir.", 'hata');
      return;
    }

    setLoading(true);
    setBildirim(null); 
    
    try {
      await axios.post(`${API_CONFIG.BASE_URL}/kullanicilar/kayit`, {
        adSoyad: ad.trim(),
        email: email.trim().toLowerCase(),
        sifre: sifre
      });

      setLoading(false);
      bildirimGoster("Hesabınız başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.", 'basari');
      
    } catch (error: any) {
      setLoading(false);
      console.log("BACKEND'DEN GELEN HATA:", error.response?.data);

      let hataMesaji = "Kayıt işlemi sırasında bir hata oluştu.";
      const veri = error.response?.data;

      if (veri) {
        if (typeof veri === 'string') hataMesaji = veri;
        else if (veri.mesaj) hataMesaji = veri.mesaj;
        else if (veri.Mesaj) hataMesaji = veri.Mesaj;
        else if (veri.title) hataMesaji = veri.title;
      }
      
      bildirimGoster(hataMesaji, 'hata');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* ESTETİK TOAST BİLDİRİM BANNERI */}
        {bildirim && (
          <View style={[styles.bildirimKutusu, styles[bildirim.tip]]}>
            <Ionicons 
              name={bildirim.tip === 'basari' ? 'checkmark-circle' : bildirim.tip === 'uyari' ? 'warning' : 'close-circle'} 
              size={22} 
              color={styles[`${bildirim.tip}Metin`].color} 
            />
            <View style={styles.bildirimIcerik}>
              <Text style={[styles.bildirimMetni, styles[`${bildirim.tip}Metin`]]}>
                {bildirim.mesaj}
              </Text>
              
              {bildirim.tip === 'basari' && (
                <TouchableOpacity style={styles.bildirimButon} onPress={() => router.replace('/giris')}>
                  <Text style={styles.bildirimButonYazi}>Giriş Yap</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFF" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              )}
            </View>
            
            {bildirim.tip !== 'basari' && (
              <TouchableOpacity onPress={() => setBildirim(null)}>
                <Ionicons name="close" size={18} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* SOL ÜST GERİ OK BUTONU */}
        <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#1C1C1E" />
        </TouchableOpacity>

        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.baslik}>Yeni Hesap Oluştur</Text>
          <Text style={styles.altMetin}>Hemen kayıt olun ve alışverişe başlayın.</Text>

          <TextInput 
            style={styles.input} 
            placeholder="Adınız Soyadınız" 
            value={ad}
            onChangeText={setAd}
            autoCapitalize="words"
            placeholderTextColor="#A1A1A1"
          />

          <TextInput 
            style={styles.input} 
            placeholder="E-posta Adresiniz" 
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#A1A1A1"
          />
          
          <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', paddingRight: 15 }]}>
            <TextInput 
              style={{ flex: 1, fontSize: 15, color: '#1C1C1E', padding: 0 }} 
              placeholder="Şifreniz" 
              secureTextEntry={!sifreGorunur} 
              value={sifre}
              onChangeText={setSifre}
              placeholderTextColor="#A1A1A1"
            />
            <TouchableOpacity onPress={() => setSifreGorunur(!sifreGorunur)}>
              <Ionicons name={sifreGorunur ? "eye-off" : "eye"} size={22} color="#A1A1A1" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.buton} onPress={kayitIslemi} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.butonYazi}>Kayıt Ol</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/giris')} style={{ marginTop: 24 }}>
            <Text style={styles.yonlendirme}>Zaten hesabınız var mı? <Text style={{ fontWeight: 'bold', color: 'orange' }}>Giriş Yap</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  baslik: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, color: '#1C1C1E' },
  altMetin: { fontSize: 16, color: '#666', marginBottom: 30 },
  input: { borderWidth: 1, borderColor: '#E5E5EA', padding: 15, borderRadius: 12, marginBottom: 16, backgroundColor: '#F9F9F9', fontSize: 15, color: '#1C1C1E' },
  buton: { backgroundColor: 'orange', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, shadowColor: 'orange', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  butonYazi: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  yonlendirme: { textAlign: 'center', color: '#666', fontSize: 15 },
  geriButon: { position: 'absolute', top: 20, left: 20, zIndex: 10, padding: 8, backgroundColor: '#F2F2F7', borderRadius: 20 },
  
  bildirimKutusu: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  bildirimIcerik: { flex: 1, marginLeft: 10, marginRight: 6 },
  bildirimMetni: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  
  hata: { backgroundColor: '#FFF5F5', borderColor: '#FEB2B2' },
  hataMetin: { color: '#C53030' },
  
  uyari: { backgroundColor: '#FFFAF0', borderColor: '#FEEBC8' },
  uyariMetin: { color: '#DD6B20' },
  
  basari: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  basariMetin: { color: '#166534' },

  bildirimButon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#166534',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: 'flex-start'
  },
  bildirimButonYazi: { color: '#FFF', fontSize: 12, fontWeight: 'bold' }
});