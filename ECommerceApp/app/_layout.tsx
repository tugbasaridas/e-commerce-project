import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from '@/context/ThemeContext';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments(); 
  const navigationState = useRootNavigationState(); // 🌟 KRİTİK EKLENTİ: Navigasyon durumunu yakalar

  useEffect(() => {
    // 🌟 ÇÖZÜM: Harita (Navigation Tree) daha hazır değilse boşuna yönlendirme yapma, bekle!
    if (!navigationState?.key) return;

    const checkAuthAndRoute = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const role = await AsyncStorage.getItem('userRole');

        const currentSegment = segments[0];
        
        const inAdminGroup = currentSegment === '(admin)';
        const inSaticiGroup = currentSegment === '(satici)';
        
        // Ortak ve herkesin girebileceği sayfalar
        const ortakSayfalar = ['detay', 'odeme', 'destek', 'sifre-degistir'];
        const isOrtakSayfa = ortakSayfalar.includes(currentSegment);
        
        if (!token) {
          // Oturum yoksa yetkili klasörlere girişi yasakla
          if (inAdminGroup || inSaticiGroup) {
            router.replace('/(tabs)' as any);
          }
        } else {
          // Gidilen yer "Şifre Değiştir" gibi ortak bir sayfaysa elleme, serbest bırak!
          if (isOrtakSayfa) {
            return; 
          }

          // Oturum varsa ve yanlış klasördeyse, kendi paneline zorla
          if (role === 'Admin' && !inAdminGroup) {
            router.replace('/(admin)/admin' as any);
          } else if ((role === 'Satici' || role === 'Satıcı') && !inSaticiGroup) {
            router.replace('/(satici)/satici-anasayfa' as any);
          }
        }
      } catch (e) {
        console.error("Oturum kontrol hatası:", e);
      }
    };

    checkAuthAndRoute();
  }, [segments, navigationState?.key]); // 🌟 navigationState.key eklendi ki harita yüklenince tekrar tetiklensin

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Ana sekmelerimiz (Müşteri için) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Kimlik Doğrulama (Giriş/Kayıt) */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        
        {/* Admin ve Satıcı Panelleri */}
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="(satici)" options={{ headerShown: false }} />
        
        {/* Sekmelerin üstüne açılan ortak sayfalar */}
        <Stack.Screen name="detay" options={{ headerShown: true, title: 'Ürün Detayı' }} />
        <Stack.Screen name="odeme" options={{ headerShown: true, title: 'Ödeme' }} />
        <Stack.Screen name="destek" options={{ headerShown: true, title: 'Destek' }} />
        <Stack.Screen name="sifre-degistir" options={{ headerShown: true, title: 'Şifre Değiştir' }} />
      </Stack>
    </ThemeProvider>
  );
}