import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF9F00', 
        tabBarInactiveTintColor: '#BFBFBF', 
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          paddingBottom: 4, 
        }
      }}
    >
      
      <Tabs.Screen
        name="admin" 
        options={{
          title: 'Analiz',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pie-chart" size={size} color={color} />
          ),
        }}
      />

      
      <Tabs.Screen
        name="admin-islemler" 
        options={{
          title: 'İşlemler',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen name="admindestek" options={{ href: null }} />
      <Tabs.Screen name="admin-urunler" options={{ href: null }} />
      <Tabs.Screen name="admin-siparisler" options={{ href: null }} />
      <Tabs.Screen name="admin-kullanicilar" options={{ href: null }} />
      <Tabs.Screen name="admin-urun-ekle" options={{ href: null }} />
      <Tabs.Screen name="admin-urun-guncelle" options={{ href: null }} />
      <Tabs.Screen name="admin-indirim-yonetimi" options={{ href: null }} />
      <Tabs.Screen name="admin-stok-yonetimi" options={{ href: null }} />
      <Tabs.Screen name="admin-kategoriler" options={{ href: null }} />
      
    
    </Tabs>
  );
}