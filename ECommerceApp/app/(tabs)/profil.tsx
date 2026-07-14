import { API_CONFIG } from '@/config/api';
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
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userRole');
    setToken(null);
    setRole(null);
    setKullanici(null);
    router.replace('/(tabs)' as any);
  };

  if (loading) {
    return (
      <View style={styles.containerMerkez}>
        <ActivityIndicator size="large" color="#FFB800" />
        <Text style={{marginTop: 10, color: '#888'}}>Profil yükleniyor...</Text>
      </View>
    );
  }

  // --- 1. DURUM: GİRİŞ YAPMAMIŞSA (MİSAFİR) ---
  if (!token) {
    return (
      <SafeAreaView style={styles.containerMerkez}>
        <StatusBar style="dark" />
        <View style={styles.misafirIkonAlan}>
          <Ionicons name="person-outline" size={60} color="#FFB800" />
        </View>
        <Text style={styles.misafirBaslik}>Hesabınız Yok Mu?</Text>
        <Text style={styles.bilgiMetni}>Siparişlerinizi takip etmek ve sepetinizi yönetmek için hemen giriş yapın.</Text>
        <TouchableOpacity style={styles.girisButon} onPress={() => router.push('/(auth)/giris' as any)}>
          <Text style={styles.girisButonYazi}>Giriş Yap / Kayıt Ol</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- 2. DURUM: GİRİŞ YAPMIŞSA (KULLANICI) ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <Text style={styles.sayfaBasligi}>Profilim</Text>
      
      {/* PROFİL KARTI */}
      <View style={styles.profilKart}>
        <View style={styles.profilAvatar}>
          <Text style={styles.avatarHarf}>
            {kullanici?.adSoyad ? kullanici.adSoyad.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <View style={styles.profilDetay}>
          <Text style={styles.kullaniciBaslik}>
            {kullanici ? kullanici.adSoyad : 'Yükleniyor...'}
          </Text>
          
          <View style={styles.bilgiSatiri}>
            <Ionicons name="mail-outline" size={14} color="#888" />
            <Text style={styles.mailMetni}>{kullanici?.email || 'Bilgi Yok'}</Text>
          </View>

          <View style={[styles.rolRozet, role === 'Admin' ? styles.rolAdmin : styles.rolKullanici]}>
            <Ionicons name={role === 'Admin' ? "shield-checkmark" : "person"} size={12} color={role === 'Admin' ? "#fff" : "#FFB800"} />
            <Text style={[styles.rolRozetYazi, role === 'Admin' && {color: '#fff'}]}>
              {role === 'Admin' ? 'Yönetici' : 'Standart Üye'}
            </Text>
          </View>
        </View>
      </View>

      {/* MENÜ ALANI */}
      <View style={styles.menuAlani}>
        <Text style={styles.menuBaslik}>Hesap Ayarları</Text>

        <TouchableOpacity style={styles.menuButon} onPress={() => router.push('/(tabs)/siparislerim' as any)}>
          <View style={styles.menuSol}>
            <View style={[styles.menuIkonKutu, {backgroundColor: '#FFF3E0'}]}>
              <Ionicons name="cube-outline" size={20} color="#FFB800" />
            </View>
            <Text style={styles.menuYazi}>Siparişlerim</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButon} onPress={() => router.push('/favoriler' as any)}>
          <View style={styles.menuSol}>
            <View style={[styles.menuIkonKutu, {backgroundColor: '#E3F2FD'}]}>
              <Ionicons name="heart-outline" size={20} color="#1565C0" />
            </View>
            <Text style={styles.menuYazi}>Favorilerim</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        {/* YENİ EKLENEN: KAYITLI BİLGİLERİM */}
        <TouchableOpacity style={styles.menuButon} onPress={() => router.push('/kayitliBilgilerim' as any)}>
          <View style={styles.menuSol}>
            <View style={[styles.menuIkonKutu, {backgroundColor: '#EFEBE9'}]}>
              <Ionicons name="card-outline" size={20} color="#5D4037" />
            </View>
            <Text style={styles.menuYazi}>Kayıtlı Kart & Adreslerim</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButon} onPress={() => router.push('/destek' as any)}>
          <View style={styles.menuSol}>
            <View style={[styles.menuIkonKutu, {backgroundColor: '#F3E5F5'}]}>
              <Ionicons name="headset-outline" size={20} color="#7B1FA2" />
            </View>
            <Text style={styles.menuYazi}>Yardım ve Destek</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        {role === 'Admin' && (
          <TouchableOpacity style={styles.menuButon} onPress={() => router.push('/(admin)' as any)}>
            <View style={styles.menuSol}>
              <View style={[styles.menuIkonKutu, {backgroundColor: '#E8F5E9'}]}>
                <Ionicons name="settings-outline" size={20} color="#2E7D32" />
              </View>
              <Text style={styles.menuYazi}>Admin Paneli</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

      {/* ÇIKIŞ YAP BUTONU */}
      <TouchableOpacity style={styles.cikisButon} onPress={cikisYap}>
        <Ionicons name="log-out-outline" size={22} color="#FF4757" />
        <Text style={styles.cikisButonYazi}>Oturumu Kapat</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', paddingHorizontal: 20, paddingTop: 10 },
  containerMerkez: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#FAFAFA' },
  
  // Misafir Ekranı
  misafirIkonAlan: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  misafirBaslik: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  bilgiMetni: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  girisButon: { backgroundColor: '#FFB800', width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', elevation: 2 },
  girisButonYazi: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  // Profil Kullanıcı Ekranı
  sayfaBasligi: { fontSize: 26, fontWeight: 'bold', color: '#111', marginBottom: 20, marginTop: 10 },
  
  profilKart: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 16, 
    alignItems: 'center', 
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  profilAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' },
  avatarHarf: { fontSize: 24, fontWeight: 'bold', color: '#FFB800' },
  profilDetay: { marginLeft: 15, flex: 1 },
  kullaniciBaslik: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  
  bilgiSatiri: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  mailMetni: { fontSize: 13, color: '#666', marginLeft: 6 },
  
  rolRozet: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  rolAdmin: { backgroundColor: '#2E7D32' },
  rolKullanici: { backgroundColor: '#FFF3E0' },
  rolRozetYazi: { fontSize: 11, fontWeight: 'bold', color: '#FFB800', marginLeft: 4 },
  
  // Menü Alanı
  menuAlani: { flex: 1 },
  menuBaslik: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15, paddingLeft: 5 },
  menuButon: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F5F5F5'
  },
  menuSol: { flexDirection: 'row', alignItems: 'center' },
  menuIkonKutu: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuYazi: { fontSize: 15, fontWeight: '500', color: '#333' },
  
  // Çıkış Butonu
  cikisButon: { 
    flexDirection: 'row', 
    backgroundColor: '#FFF0F0', 
    padding: 16, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE0E0'
  },
  cikisButonYazi: { color: '#FF4757', fontSize: 16, fontWeight: 'bold', marginLeft: 8 }
});