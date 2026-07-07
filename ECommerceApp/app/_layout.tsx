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
        
        const isRoot = (segments as string[]).length === 0; 

        if (!token) {
          // --- MİSAFİR (GUEST) DURUMU ---
          // Misafirler sekmelerde (tabs) gezebilir!
          // Sadece yetkisi olmayan yere (admin) girmeye çalışırsa girişe yolla.
          if (isAdminGroup) {
            router.replace('/(auth)/giris');
          }
          // Uygulama ilk açıldığında anasayfaya (tabs) yönlendir
          if (isRoot) {
            router.replace('/(tabs)');
          }

        } else {
          // --- GİRİŞ YAPMIŞ KİŞİ DURUMU ---
          if (role === 'Admin') {
            // Admin, giriş sayfalarına dönerse veya uygulama yeni açıldıysa panele yolla
            if (inAuthGroup || isRoot) {
              router.replace('/admin');
            }
          } else {
            // Normal Kullanıcı, admin paneline veya giriş sayfalarına dönerse anasayfaya yolla
            if (isAdminGroup || inAuthGroup || isRoot) {
              router.replace('/(tabs)');
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
    </Stack>
  );
}