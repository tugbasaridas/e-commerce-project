import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments(); 

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const role = await AsyncStorage.getItem('userRole');

        const inAuthGroup = segments[0] === '(auth)';
        const isAdminGroup = segments[0] === '(admin)';
        const isSaticiGroup = segments[0] === '(satici)'; 
        const isRoot = (segments as string[]).length === 0; 

        if (!token) {
          // --- MİSAFİR (GUEST) DURUMU ---
          // Misafirler Admin veya Satıcı sayfalarına giremez, girişe at
          if (isAdminGroup || isSaticiGroup) {
            router.replace('/(auth)/giris' as any);
          } else if (isRoot) {
            router.replace('/(tabs)' as any);
          }
        } else {
          // --- GİRİŞ YAPMIŞ KİŞİ ---
          if (role === 'Admin') {
            // 1. ADMİN: Kendi klasöründe değilse (tabs, auth, satici vb) panele yolla
            if (!isAdminGroup) {
              router.replace('/(admin)/admin-islemler' as any); 
            }
          } 
          else if (role === 'Satici') {
            // 2. SATICI: Kendi klasöründe değilse, satıcı paneline yolla
            if (!isSaticiGroup) {
              router.replace('/(satici)/satici-anasayfa' as any);
            }
          } 
          else {
            // 3. NORMAL KULLANICI: 
            // Admin veya Satıcı klasörüne girmeye çalışırsa sekmelere (tabs) yolla
            if (isAdminGroup || isSaticiGroup) {
              router.replace('/(tabs)' as any);
            }
            // Müşteri root veya auth'daysa sekmelere (tabs) yolla
            else if (inAuthGroup || isRoot) {
              router.replace('/(tabs)' as any);
            }
          }
        }
      } catch (error) {
        console.error("Hafıza kontrol hatası:", error);
      } finally {
        setIsReady(true);
      }
    };

    checkAuth();
  }, [segments]); 

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#d35400" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(admin)" />
      {/* YENİ EKLENDİ: Sisteme satıcı sayfalarının var olduğunu tanıtıyoruz */}
      <Stack.Screen name="(satici)" />
    </Stack>
  );
}