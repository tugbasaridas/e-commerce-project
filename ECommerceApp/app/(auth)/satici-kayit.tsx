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

export default function SaticiKayit() {
  const router = useRouter();
  
  // 1. Kullanıcı (Hesap) Bilgileri
  const [adSoyad, setAdSoyad] = useState('');
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [sifreGorunur, setSifreGorunur] = useState(false);

  // 2. Mağaza Bilgileri
  const [magazaAdi, setMagazaAdi] = useState('');
  const [vergiNo, setVergiNo] = useState('');
  const [iletisimTelefonu, setIletisimTelefonu] = useState('');
  
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

  const basvuruIslemi = async () => {
    // 1. Zorunlu alan kontrolü
    if (!adSoyad.trim() || !email.trim() || !sifre.trim() || !magazaAdi.trim()) {
      bildirimGoster("Lütfen zorunlu alanları doldurun.", 'uyari');
      return;
    }

    // 2. Ad Soyad Uzunluk Kontrolü
    if (adSoyad.trim().length < 3) {
      bildirimGoster("Ad Soyad en az 3 karakterden oluşmalıdır.", 'hata');
      return;
    }

    // 3. E-posta Format Kontrolü (Regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      bildirimGoster("Lütfen geçerli bir e-posta adresi giriniz (Örn: ornek@gmail.com).", 'hata');
      return;
    }

    // 4. Şifre Uzunluk Kontrolü
    if (sifre.length < 6) {
      bildirimGoster("Şifreniz en az 6 karakter uzunluğunda olmalıdır.", 'hata');
      return;
    }

    // 5. Güçlü Şifre Kontrolü (Büyük harf ve Rakam)
    const gucluSifreRegex = /^(?=.*[A-Z])(?=.*\d).+$/;
    if (!gucluSifreRegex.test(sifre)) {
      bildirimGoster("Şifreniz en az bir büyük harf ve bir rakam içermelidir.", 'hata');
      return;
    }

    setLoading(true);
    setBildirim(null); 
    
    try {
      await axios.post(`${API_CONFIG.BASE_URL}/satici/kayit`, {
        adSoyad: adSoyad.trim(),
        email: email.trim().toLowerCase(),
        sifre: sifre,
        magazaAdi: magazaAdi.trim(),
        vergiNo: vergiNo.trim() || null,
        iletisimTelefonu: iletisimTelefonu.trim() || null
      });

      setLoading(false);
      bildirimGoster("Mağaza başvurunuz alındı! Yöneticilerimiz onayladıktan sonra giriş yapabilirsiniz.", 'basari');
      
      // Başarılı olursa 3 saniye sonra Giriş ekranına yolla
      setTimeout(() => {
        router.replace('/giris');
      }, 3000);
      
    } catch (error: any) {
      setLoading(false);
      
      let hataMesaji = "Başvuru işlemi sırasında bir hata oluştu.";
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
        {/* BİLDİRİM BANNERI */}
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
            </View>
            
            {bildirim.tip !== 'basari' && (
              <TouchableOpacity onPress={() => setBildirim(null)}>
                <Ionicons name="close" size={18} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* GERİ BUTONU */}
        <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#1C1C1E" />
        </TouchableOpacity>

        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.ikonKutusu}>
            <Ionicons name="briefcase" size={45} color="orange" />
          </View>
          
          <Text style={styles.baslik}>Satıcı Olarak Katılın</Text>
          <Text style={styles.altMetin}>Pazaryerinde mağazanızı açın ve satışa başlayın.</Text>

          {/* HESAP BİLGİLERİ KISMI */}
          <Text style={styles.bolumBasligi}>1. Hesap Bilgileri</Text>
          
          <TextInput 
            style={styles.input} 
            placeholder="Adınız Soyadınız *" 
            value={adSoyad}
            onChangeText={setAdSoyad}
            autoCapitalize="words"
            placeholderTextColor="#A1A1A1"
          />

          <TextInput 
            style={styles.input} 
            placeholder="E-posta Adresiniz *" 
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#A1A1A1"
          />
          
          <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', paddingRight: 15 }]}>
            <TextInput 
              style={{ flex: 1, fontSize: 15, color: '#1C1C1E', padding: 0 }} 
              placeholder="Şifreniz *" 
              secureTextEntry={!sifreGorunur} 
              value={sifre}
              onChangeText={setSifre}
              placeholderTextColor="#A1A1A1"
            />
            <TouchableOpacity onPress={() => setSifreGorunur(!sifreGorunur)}>
              <Ionicons name={sifreGorunur ? "eye-off" : "eye"} size={22} color="#A1A1A1" />
            </TouchableOpacity>
          </View>

          {/* MAĞAZA BİLGİLERİ KISMI */}
          <Text style={[styles.bolumBasligi, { marginTop: 10 }]}>2. Mağaza Bilgileri</Text>

          <TextInput 
            style={styles.input} 
            placeholder="Mağaza Adı *" 
            value={magazaAdi}
            onChangeText={setMagazaAdi}
            autoCapitalize="words"
            placeholderTextColor="#A1A1A1"
          />

          <TextInput 
            style={styles.input} 
            placeholder="Vergi Numarası (Opsiyonel)" 
            keyboardType="number-pad"
            value={vergiNo}
            onChangeText={setVergiNo}
            maxLength={10}
            placeholderTextColor="#A1A1A1"
          />

          <TextInput 
            style={styles.input} 
            placeholder="İletişim Telefonu (Opsiyonel)" 
            keyboardType="phone-pad"
            value={iletisimTelefonu}
            onChangeText={setIletisimTelefonu}
            maxLength={11}
            placeholderTextColor="#A1A1A1"
          />

          <TouchableOpacity style={styles.buton} onPress={basvuruIslemi} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.butonYazi}>Başvuruyu Gönder</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/giris')} style={{ marginTop: 24, marginBottom: 40 }}>
            <Text style={styles.yonlendirme}>Zaten satıcı hesabınız var mı? <Text style={{ fontWeight: 'bold', color: 'orange' }}>Giriş Yap</Text></Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, padding: 24, paddingTop: 60, justifyContent: 'center' },
  ikonKutusu: { alignItems: 'center', marginBottom: 15 },
  baslik: { fontSize: 26, fontWeight: 'bold', marginBottom: 8, color: '#1C1C1E', textAlign: 'center' },
  altMetin: { fontSize: 15, color: '#666', marginBottom: 25, textAlign: 'center' },
  
  bolumBasligi: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 12, marginLeft: 4, opacity: 0.8 },
  
  input: { borderWidth: 1, borderColor: '#E5E5EA', padding: 15, borderRadius: 12, marginBottom: 16, backgroundColor: '#F9F9F9', fontSize: 15, color: '#1C1C1E' },
  
  buton: { backgroundColor: 'orange', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: 'orange', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  butonYazi: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  yonlendirme: { textAlign: 'center', color: '#666', fontSize: 15 },
  
  geriButon: { position: 'absolute', top: 20, left: 20, zIndex: 10, padding: 8, backgroundColor: '#F2F2F7', borderRadius: 20 },
  
  bildirimKutusu: { position: 'absolute', top: 20, left: 20, right: 20, zIndex: 999, flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5 },
  bildirimIcerik: { flex: 1, marginLeft: 10, marginRight: 6 },
  bildirimMetni: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  
  hata: { backgroundColor: '#FFF5F5', borderColor: '#FEB2B2' },
  hataMetin: { color: '#C53030' },
  uyari: { backgroundColor: '#FFFAF0', borderColor: '#FEEBC8' },
  uyariMetin: { color: '#DD6B20' },
  basari: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  basariMetin: { color: '#166534' }
});