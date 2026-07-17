import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import api from '../../config/api';

interface Kategori {
  id: number;
  ad: string;
}

export default function AdminKategoriler() {
  const router = useRouter();
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [yeniKategoriAd, setYeniKategoriAd] = useState('');
  const [islemde, setIslemde] = useState(false);

  useFocusEffect(
    useCallback(() => {
      kategorileriGetir();
    }, [])
  );

  const kategorileriGetir = async () => {
    try {
      const response = await api.get('/kategoriler');
      setKategoriler(response.data);
    } catch (error) {
      Alert.alert("Hata", "Kategoriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const kategoriEkle = async () => {
    if (!yeniKategoriAd.trim()) {
      Alert.alert("Uyarı", "Lütfen bir kategori adı girin.");
      return;
    }
    
    setIslemde(true);
    try {
      await api.post('/kategoriler', { ad: yeniKategoriAd });
      setYeniKategoriAd('');
      kategorileriGetir();
    } catch (error: any) {
      Alert.alert("Hata", error.response?.data?.mesaj || error.response?.data?.Mesaj || "Kategori eklenemedi.");
    } finally {
      setIslemde(false);
    }
  };

  const kategoriSil = (id: number) => {
    Alert.alert("Sil", "Bu kategoriyi silmek istediğinize emin misiniz?", [
      { text: "Vazgeç", style: "cancel" },
      { 
        text: "Sil", 
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/kategoriler/${id}`);
            kategorileriGetir();
          } catch (error: any) {
            // ARTIK TAHMİN ETMİYORUZ: Direkt backend'den gelen mesajı alıyoruz.
            const mesaj = error.response?.data?.mesaj || error.response?.data?.Mesaj || "Kategori silinemedi.";
            Alert.alert("İşlem Başarısız", mesaj);
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.navigate('/(admin)/admin-islemler' as any)}>
          <Ionicons name="arrow-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kategori Yönetimi</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* YENİ EKLEME ALANI */}
      <View style={styles.ekleAlani}>
        <TextInput
          style={styles.input}
          placeholder="Yeni kategori adı..."
          placeholderTextColor="#A1A1A1"
          value={yeniKategoriAd}
          onChangeText={setYeniKategoriAd}
          autoCorrect={false}
          autoCapitalize="sentences"
        />
        <TouchableOpacity 
          style={[styles.ekleButon, islemde && { opacity: 0.7 }]} 
          onPress={kategoriEkle} 
          disabled={islemde}
        >
          {islemde ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ekleButonYazi}>Ekle</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* LİSTE */}
      {loading ? (
        <ActivityIndicator size="large" color="#FF9F00" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={kategoriler}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.liste}
          renderItem={({ item }) => (
            <View style={styles.kategoriKart}>
              <Text style={styles.kategoriAd}>{item.ad}</Text>
              <TouchableOpacity 
                style={styles.silButon} 
                onPress={() => kategoriSil(item.id)}
              >
                <Ionicons name="trash-outline" size={22} color="#EF233C" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.bosListe}>Henüz kategori eklenmemiş.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: 50, 
    paddingBottom: 20, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E' },
  geriButon: { padding: 4 },
  ekleAlani: { flexDirection: 'row', padding: 20, gap: 10, backgroundColor: '#fff' },
  input: { flex: 1, backgroundColor: '#F8F9FA', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA', fontSize: 15 },
  ekleButon: { backgroundColor: '#FF9F00', padding: 15, borderRadius: 12, justifyContent: 'center', minWidth: 80, alignItems: 'center' },
  ekleButonYazi: { color: '#fff', fontWeight: 'bold' },
  liste: { padding: 20 },
  kategoriKart: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 12, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#E5E5EA',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  kategoriAd: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  silButon: { padding: 5 },
  bosListe: { textAlign: 'center', color: '#8E8E93', marginTop: 50 }
});