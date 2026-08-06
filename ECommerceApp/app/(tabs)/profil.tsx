import { API_CONFIG } from '@/config/api';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface KullaniciBilgileri {
  adSoyad: string; 
  email: string;
}

export default function Profil() {
  const { theme, colors, setTheme } = useTheme(); 
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [kullanici, setKullanici] = useState<KullaniciBilgileri | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const veriGetir = async () => {
        setLoading(true);
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedRole = await AsyncStorage.getItem('userRole');
        
        setToken(storedToken);
        setRole(storedRole);

        if (storedToken) {
          try {
            const response = await axios.get(`${API_CONFIG.BASE_URL}/kullanicilar/profil`, {
              headers: { Authorization: `Bearer ${storedToken}` }
            });
            setKullanici(response.data);
          } catch (error) {
            console.error("Profil bilgileri getirilemedi:", error);
          }
        }
        setLoading(false);
      };
      
      veriGetir();
    }, [])
  );

  const cikisYap = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userRole');
      await AsyncStorage.removeItem('userId');
      
      setToken(null);
      setRole(null);
      setKullanici(null);
      
      router.replace('/(tabs)' as any);
    } catch (error) {
      console.log("Çıkış işlemi sırasında hata:", error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.containerMerkez, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FFB800" />
        <Text style={{marginTop: 10, color: colors.textMuted}}>Profil yükleniyor...</Text>
      </View>
    );
  }

  // --- 1. DURUM: GİRİŞ YAPMAMIŞSA (MİSAFİR) ---
  if (!token) {
    return (
      <SafeAreaView style={[styles.containerMerkez, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.misafirIkonAlan}>
          <Ionicons name="person-outline" size={60} color="#FFB800" />
        </View>
        <Text style={[styles.misafirBaslik, { color: colors.text }]}>Hesabınız Yok Mu?</Text>
        <Text style={[styles.bilgiMetni, { color: colors.textMuted }]}>Siparişlerinizi takip etmek ve sepetinizi yönetmek için hemen giriş yapın.</Text>
        <TouchableOpacity style={styles.girisButon} onPress={() => router.push('/(auth)/giris' as any)}>
          <Text style={styles.girisButonYazi}>Giriş Yap / Kayıt Ol</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- 2. DURUM: GİRİŞ YAPMIŞSA (KULLANICI) ---
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      <Text style={[styles.sayfaBasligi, { color: colors.text }]}>Profilim</Text>
      
      {/* PROFİL KARTI */}
      <View style={[styles.profilKart, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.profilAvatar}>
          <Text style={styles.avatarHarf}>
            {kullanici?.adSoyad ? kullanici.adSoyad.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        
        <View style={styles.profilDetay}>
          <Text style={[styles.kullaniciBaslik, { color: colors.text }]}>
            {kullanici ? kullanici.adSoyad : 'Yükleniyor...'}
          </Text>
          
          <View style={styles.bilgiSatiri}>
            <Ionicons name="mail-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.mailMetni, { color: colors.textMuted }]}>{kullanici?.email || 'Bilgi Yok'}</Text>
          </View>

          <View style={[styles.rolRozet, role === 'Admin' ? styles.rolAdmin : styles.rolKullanici]}>
            <Ionicons name={role === 'Admin' ? "shield-checkmark" : "person"} size={12} color={role === 'Admin' ? "#fff" : "#FFB800"} />
            <Text style={[styles.rolRozetYazi, role === 'Admin' && {color: '#fff'}]}>
              {role === 'Admin' ? 'Yönetici' : 'Standart Üye'}
            </Text>
          </View>
        </View>

        {/* ÇIKIŞ YAP BUTONU */}
        <TouchableOpacity style={[styles.kartIciCikisButon, { backgroundColor: theme === 'dark' ? '#3A1A1A' : '#FFF0F0', borderColor: theme === 'dark' ? '#5A2A2A' : '#FFE0E0' }]} onPress={cikisYap}>
          <Ionicons name="log-out-outline" size={24} color="#FF4757" />
        </TouchableOpacity>
      </View>

      {/* MENÜ ALANI */}
      <View style={styles.menuAlani}>
        
        {/* 🌟 BAŞLIK VE TEK TUŞLA TEMA DEĞİŞTİRİCİ (SAĞ TARAF) */}
        <View style={styles.menuHeaderSatiri}>
          <Text style={[styles.menuBaslik, { color: colors.text }]}>Hesap Ayarları</Text>
          
          <TouchableOpacity 
            onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={[styles.tekliTemaButon, { backgroundColor: theme === 'dark' ? '#2C2C2E' : '#FFF3E0', borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={theme === 'dark' ? 'moon' : 'sunny'} 
              size={18} 
              color={theme === 'dark' ? '#0A84FF' : '#FFB800'} 
            />
            <Text style={[styles.tekliTemaYazi, { color: theme === 'dark' ? '#0A84FF' : '#FFB800' }]}>
              {theme === 'dark' ? 'Gece' : 'Gündüz'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.menuButon, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/(tabs)/siparislerim' as any)}>
          <View style={styles.menuSol}>
            <View style={[styles.menuIkonKutu, {backgroundColor: '#FFF3E0'}]}>
              <Ionicons name="cube-outline" size={20} color="#FFB800" />
            </View>
            <Text style={[styles.menuYazi, { color: colors.text }]}>Siparişlerim</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuButon, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/(tabs)/kuponlarim' as any)}>
          <View style={styles.menuSol}>
            <View style={[styles.menuIkonKutu, {backgroundColor: '#FFF8E1'}]}>
              <Ionicons name="ticket-outline" size={20} color="#F57C00" />
            </View>
            <Text style={[styles.menuYazi, { color: colors.text }]}>Kuponlarım</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuButon, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/favoriler' as any)}>
          <View style={styles.menuSol}>
            <View style={[styles.menuIkonKutu, {backgroundColor: '#E3F2FD'}]}>
              <Ionicons name="heart-outline" size={20} color="#1565C0" />
            </View>
            <Text style={[styles.menuYazi, { color: colors.text }]}>Favorilerim</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuButon, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/kayitliBilgilerim' as any)}>
          <View style={styles.menuSol}>
            <View style={[styles.menuIkonKutu, {backgroundColor: '#EFEBE9'}]}>
              <Ionicons name="card-outline" size={20} color="#5D4037" />
            </View>
            <Text style={[styles.menuYazi, { color: colors.text }]}>Kayıtlı Kart & Adreslerim</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuButon, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/destek' as any)}>
          <View style={styles.menuSol}>
            <View style={[styles.menuIkonKutu, {backgroundColor: '#F3E5F5'}]}>
              <Ionicons name="headset-outline" size={20} color="#7B1FA2" />
            </View>
            <Text style={[styles.menuYazi, { color: colors.text }]}>Yardım ve Destek</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {role === 'Admin' && (
          <TouchableOpacity style={[styles.menuButon, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/(admin)' as any)}>
            <View style={styles.menuSol}>
              <View style={[styles.menuIkonKutu, {backgroundColor: '#E8F5E9'}]}>
                <Ionicons name="settings-outline" size={20} color="#2E7D32" />
              </View>
              <Text style={[styles.menuYazi, { color: colors.text }]}>Admin Paneli</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  containerMerkez: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  
  misafirIkonAlan: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  misafirBaslik: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  bilgiMetni: { fontSize: 15, textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  girisButon: { backgroundColor: '#FFB800', width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', elevation: 2 },
  girisButonYazi: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  sayfaBasligi: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, marginTop: 10 },
  
  profilKart: { 
    flexDirection: 'row', 
    padding: 20, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 25,
    borderWidth: 1,
  },
  profilAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' },
  avatarHarf: { fontSize: 24, fontWeight: 'bold', color: '#FFB800' },
  profilDetay: { marginLeft: 15, flex: 1 },
  kullaniciBaslik: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  
  bilgiSatiri: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  mailMetni: { fontSize: 13, marginLeft: 6 },
  
  rolRozet: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  rolAdmin: { backgroundColor: '#2E7D32' },
  rolKullanici: { backgroundColor: '#FFF3E0' },
  rolRozetYazi: { fontSize: 11, fontWeight: 'bold', color: '#FFB800', marginLeft: 4 },
  
  kartIciCikisButon: { padding: 10, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },

  menuAlani: { flex: 1 },
  
  menuHeaderSatiri: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15, 
    paddingLeft: 5 
  },
  menuBaslik: { fontSize: 16, fontWeight: 'bold' },
  
  // KÜÇÜK TEKLİ TEMA BUTONU STİLLERİ
  tekliTemaButon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tekliTemaYazi: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },

  menuButon: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 10,
    borderWidth: 1,
  },
  menuSol: { flexDirection: 'row', alignItems: 'center' },
  menuIkonKutu: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuYazi: { fontSize: 15, fontWeight: '500' }
});