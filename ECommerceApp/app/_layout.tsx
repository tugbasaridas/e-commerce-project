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
          if (isAdminGroup) {
            router.replace('/(auth)/giris');
          }
          if (isRoot) {
            router.replace('/(tabs)');
          }
        } else {
          // --- GİRİŞ YAPMIŞ KİŞİ ---
          if (role === 'Admin') {
            // Eğer Admin ise ve (tabs) veya (auth) kısmındaysa panele yolla
            if (!isAdminGroup && (segments[0] === '(tabs)' || inAuthGroup || isRoot)) {
              router.replace('/(admin)/admin');
            }
          } else {
            // Normal Kullanıcı ise ve Admin klasörüne girmeye çalışırsa (tabs)'a yolla
            if (isAdminGroup) {
              router.replace('/(tabs)');
            }
            // Müşteri root veya auth'daysa tabs'a yolla
            else if (inAuthGroup || isRoot) {
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