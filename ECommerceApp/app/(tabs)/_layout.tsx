import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';

export default function TabLayout() {
  const { colors } = useTheme(); 
  const [girisYapildiMi, setGirisYapildiMi] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const tokenKontrol = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        setGirisYapildiMi(!!token);
      } catch (error) {
        setGirisYapildiMi(false);
      }
    };
    tokenKontrol();
  }, [pathname]);

  return (
    <Tabs 
      screenOptions={{ 
        tabBarActiveTintColor: colors.primary, 
        tabBarInactiveTintColor: colors.textMuted, 
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card, 
          borderTopColor: colors.border, 
        }
      }}
    >
      
      {/* 1. ANASAYFA (Her zaman görünür) */}
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Anasayfa', 
          tabBarIcon: ({color}) => <Ionicons name="home" size={24} color={color} /> 
        }} 
      />
      
      {/* 2. FAVORİLER (Sadece giriş yapıldığında aktif link) */}
      <Tabs.Screen 
        name="favoriler" 
        options={{ 
          title: 'Favoriler', 
          tabBarIcon: ({color}) => <Ionicons name="heart" size={24} color={color} />,
          href: girisYapildiMi ? '/(tabs)/favoriler' : null 
        }} 
      />
      
      {/* 3. SEPET (Sadece giriş yapıldığında aktif link) */}
      <Tabs.Screen 
        name="sepet" 
        options={{ 
          title: 'Sepet', 
          tabBarIcon: ({color}) => <Ionicons name="cart" size={24} color={color} />,
          href: girisYapildiMi ? '/(tabs)/sepet' : null 
        }} 
      />

      {/* 4. SİPARİŞLERİM (Navbar'dan tamamen gizlendi) */}
      <Tabs.Screen
        name="siparislerim"
        options={{
          title: 'Siparişlerim',
          tabBarIcon: ({ color }) => <Ionicons name="receipt-outline" size={24} color={color} />,
          href: null, // 🌟 Her durumda gizlendi
        }}
      />

      {/* 5. KUPONLARIM (Navbar'dan tamamen gizlendi) */}
      <Tabs.Screen
        name="kuponlarim"
        options={{
          title: 'Kuponlarım',
          tabBarIcon: ({ color }) => <Ionicons name="ticket-outline" size={24} color={color} />,
          href: null, // 🌟 Her durumda gizlendi
        }}
      />
      
      {/* 6. HESABIM / PROFİL (Her zaman görünür) */}
      <Tabs.Screen 
        name="profil"
        options={{
          title: 'Hesabım',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />

      {/* 7. BİLDİRİMLER (Navbar'dan tamamen gizlendi) */}
      <Tabs.Screen
        name="bildirimler"
        options={{
          href: null, 
        }}
      />
      
    </Tabs>
  );
}