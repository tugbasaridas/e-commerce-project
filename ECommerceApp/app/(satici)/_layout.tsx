import { Stack } from 'expo-router';

export default function SaticiLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* (satici) klasöründeki tüm sayfalar burada otomatik barınır */}
    </Stack>
  );
}