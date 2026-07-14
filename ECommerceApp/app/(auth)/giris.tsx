import { API_CONFIG } from '@/config/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface BildirimTipi {
  mesaj: string;
  tip: 'hata' | 'uyari' | 'basari';
}

export default function Giris() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [loading, setLoading] = useState(false);
  const [sifreGizli, setSifreGizli] = useState(true);
  
  // Estetik bildirim sistemi için state
  const [bildirim, setBildirim] = useState<BildirimTipi | null>(null);

  const bildirimGoster = (mesaj: string, tip: 'hata' | 'uyari' | 'basari') => {
    setBildirim({ mesaj, tip });
    
    // Bildirimi 4 saniye sonra otomatik kapat (başarı hariç, o zaten yönlendirecek)
    if (tip !== 'basari') {
      setTimeout(() => {
        setBildirim(null);
      }, 4000);
    }
  };

  const girisIslemi = async () => {
    if (!email.trim() || !sifre.trim()) {
      bildirimGoster("Lütfen e-posta ve şifrenizi girin.", 'uyari');
      return;
    }

    setLoading(true);
    setBildirim(null); // Varsa eski bildirimi temizle

    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}/kullanicilar/giris`, {
        email: email.trim().toLowerCase(), // Boşlukları silip küçük harfe çevirerek yolluyoruz
        sifre: sifre
      });

      const token = response.data.token;
      const rol = response.data.rol;
      
      // Backend bazen kullaniciId, bazen userId dönebilir, güvenli olanı seçelim
      const gelenId = response.data.kullaniciId || response.data.userId || response.data.id;

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userRole', rol);
      
      if (gelenId) {
        await AsyncStorage.setItem('userId', gelenId.toString());
      }

      setLoading(false);
      bildirimGoster("Giriş işlemi başarılı! Yönlendiriliyorsunuz...", 'basari');
      
      // Başarılı girişte çok kısa bir gecikme (yarım saniye) ile yönlendirme yapıyoruz ki yeşil bildirimi görebilsin
      setTimeout(() => {
        if (rol === 'Admin') {
          router.replace('/admin' as any);
        } else {
          router.replace('/(tabs)' as any);
        }
      }, 800);
      
    } catch (error: any) {
      setLoading(false);
      bildirimGoster(error.response?.data?.mesaj || error.response?.data?.Mesaj || "E-posta veya şifre hatalı.", 'hata');
    }
  };

  return (
    <View style={styles.container}>
      
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
          </View>
          
          {bildirim.tip !== 'basari' && (
            <TouchableOpacity onPress={() => setBildirim(null)}>
              <Ionicons name="close" size={18} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color="#1C1C1E" />
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
        placeholderTextColor="#A1A1A1"
      />
      
      {/* ŞİFRE KUTUSU (Göz İkonlu) */}
      <View style={styles.sifreAlani}>
        <TextInput 
          style={styles.sifreInput} 
          placeholder="Şifreniz" 
          secureTextEntry={sifreGizli} 
          value={sifre}
          onChangeText={setSifre}
          placeholderTextColor="#A1A1A1"
        />
        <TouchableOpacity 
          style={styles.gozIkonu} 
          onPress={() => setSifreGizli(!sifreGizli)}
        >
          <Ionicons 
            name={sifreGizli ? "eye-off" : "eye"} 
            size={22} 
            color="#8E8E93" 
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.buton} onPress={girisIslemi} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.butonYazi}>Giriş Yap</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/kayit')} style={{ marginTop: 24 }}>
        <Text style={styles.yonlendirme}>Hesabınız yok mu? <Text style={{ fontWeight: 'bold', color: 'orange' }}>Kayıt Ol</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center' },
  baslik: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, color: '#1C1C1E' },
  altMetin: { fontSize: 16, color: '#666', marginBottom: 30 },
  
  input: { borderWidth: 1, borderColor: '#E5E5EA', padding: 15, borderRadius: 12, marginBottom: 16, backgroundColor: '#F9F9F9', fontSize: 15, color: '#1C1C1E' },
  
  sifreAlani: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#E5E5EA', 
    borderRadius: 12, 
    backgroundColor: '#F9F9F9', 
    marginBottom: 16,
    paddingRight: 10 
  },
  sifreInput: { flex: 1, padding: 15, fontSize: 15, color: '#1C1C1E' },
  gozIkonu: { padding: 5 },

  buton: { backgroundColor: 'orange', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8, shadowColor: 'orange', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  butonYazi: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  yonlendirme: { textAlign: 'center', color: '#666', fontSize: 15 },
  geriButon: { position: 'absolute', top: 60, left: 20, zIndex: 10, padding: 8, backgroundColor: '#F2F2F7', borderRadius: 20 },

  // ESTETİK BİLDİRİM KUTUSU STİLLERİ
  bildirimKutusu: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center', 
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
  basariMetin: { color: '#166534' }
});