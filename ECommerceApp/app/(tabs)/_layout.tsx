import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';

export default function TabLayout() {
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
    <Tabs screenOptions={{ tabBarActiveTintColor: '#FFD700', headerShown: false }}>
      
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

      {/* 4. SİPARİŞLERİM (Sadece giriş yapıldığında aktif link) */}
      <Tabs.Screen
        name="siparislerim"
        options={{
          title: 'Siparişlerim',
          tabBarIcon: ({ color }) => <Ionicons name="receipt-outline" size={24} color={color} />,
          href: girisYapildiMi ? '/(tabs)/siparislerim' : null,
        }}
      />

      {/* 5. KUPONLARIM (Sadece giriş yapıldığında aktif link) */}
      <Tabs.Screen
        name="kuponlarim"
        options={{
          title: 'Kuponlarım',
          tabBarIcon: ({ color }) => <Ionicons name="ticket-outline" size={24} color={color} />,
          href: girisYapildiMi ? '/(tabs)/kuponlarim' : null,
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

      <Tabs.Screen
        name="bildirimler"
        options={{
          href: null, // Bu özellik sayesinde alt menüde ASLA görünmez
        }}
      />
      
    </Tabs>
  );
}