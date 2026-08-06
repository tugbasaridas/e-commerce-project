import { Stack } from 'expo-router';
import { ThemeProvider } from '@/context/ThemeContext'; // Eğer context klasörü farklı yerdeyse yolunu '../context/ThemeContext' olarak güncelleyebilirsin.

export default function RootLayout() {
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
        
        {/* Sekmelerin üstüne açılan normal sayfalar */}
        <Stack.Screen name="detay" options={{ headerShown: true, title: 'Ürün Detayı' }} />
        <Stack.Screen name="odeme" options={{ headerShown: true, title: 'Ödeme' }} />
        <Stack.Screen name="destek" options={{ headerShown: true, title: 'Destek' }} />
      </Stack>
    </ThemeProvider>
  );
}