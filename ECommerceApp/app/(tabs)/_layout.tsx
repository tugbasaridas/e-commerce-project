import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';

export default function TabLayout() {
  const [girisYapildiMi, setGirisYapildiMi] = useState(true); // Yükleme sırasında sekmelerin kaybolmaması için varsayılan true

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
  }, []); // SADECE SAYFA İLK AÇILDIĞINDA ÇALIŞIR, SEGMENTS DİNLENMEZ!

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#FFD700', headerShown: false }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Anasayfa', 
          tabBarIcon: ({color}) => <Ionicons name="home" size={24} color={color} /> 
        }} 
      />
      
      <Tabs.Screen 
        name="favoriler" 
        options={{ 
          title: 'Favoriler', 
          tabBarIcon: ({color}) => <Ionicons name="heart" size={24} color={color} />,
          href: (girisYapildiMi ? '/(tabs)/favoriler' : null) as any 
        }} 
      />
      
      <Tabs.Screen 
        name="sepet" 
        options={{ 
          title: 'Sepet', 
          tabBarIcon: ({color}) => <Ionicons name="cart" size={24} color={color} />,
          href: (girisYapildiMi ? '/(tabs)/sepet' : null) as any 
        }} 
      />

      <Tabs.Screen
        name="siparislerim"
        options={{
          title: 'Siparişlerim',
          href: girisYapildiMi ? '/(tabs)/siparislerim' : null,
          tabBarIcon: ({ color }) => <Ionicons name="receipt-outline" size={24} color={color} />,
        }}
      />
      
      <Tabs.Screen 
        name="profil"
        options={{
          title: 'Hesabım',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}