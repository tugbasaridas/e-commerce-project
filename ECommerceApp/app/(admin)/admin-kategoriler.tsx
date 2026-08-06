import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
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
  ustKategoriId?: number | null;
  altKategoriler?: Kategori[];
}

export default function AdminKategoriler() {
  const router = useRouter();
  const [kategoriler, setKategoriler] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [yeniKategoriAd, setYeniKategoriAd] = useState('');
  
  // YENİ: Hangi kategorinin altına ekleneceğini seçmek için (null ise Ana Kategori olur)
  const [secilenUstId, setSecilenUstId] = useState<number | null>(null);
  const [islemde, setIslemde] = useState(false);

  useFocusEffect(
    useCallback(() => {
      kategorileriGetir();
    }, [])
  );

  const kategorileriGetir = async () => {
    try {
      const response = await api.get('/kategori');
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
     
      await api.post('/kategori', { 
        ad: yeniKategoriAd.trim(),
        ustKategoriId: secilenUstId 
      });
      
      setYeniKategoriAd('');
      setSecilenUstId(null); 
      kategorileriGetir();
    } catch (error: any) {
      const mesaj = error.response?.data?.mesaj || error.response?.data?.Mesaj || "Kategori eklenemedi.";
      Alert.alert("Hata", mesaj);
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
            await api.delete(`/kategori/${id}`);
            kategorileriGetir();
          } catch (error: any) {
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
          placeholder={secilenUstId ? "Alt kategori adı..." : "Ana kategori adı..."}
          placeholderTextColor="#A1A1A1"
          value={yeniKategoriAd}
          onChangeText={setYeniKategoriAd}
          autoCorrect={false}
          autoCapitalize="sentences"
        />

        {/* Üst Kategori Seçim Alanı (Yatay Kaydırmalı ÇiplER) */}
        <View style={styles.ustSecimContainer}>
          <Text style={styles.ustSecimBaslik}>
            {secilenUstId ? `Seçilen Ana Kategori Altına Ekleniyor` : `Ana Kategori Olarak Eklenecek`}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <TouchableOpacity 
              style={[styles.chip, secilenUstId === null && styles.chipAktif]}
              onPress={() => setSecilenUstId(null)}
            >
              <Text style={[styles.chipYazi, secilenUstId === null && styles.chipYaziAktif]}>Ana Kategori (Yok)</Text>
            </TouchableOpacity>

            {kategoriler.map((kat) => (
              <TouchableOpacity 
                key={kat.id}
                style={[styles.chip, secilenUstId === kat.id && styles.chipAktif]}
                onPress={() => setSecilenUstId(kat.id)}
              >
                <Text style={[styles.chipYazi, secilenUstId === kat.id && styles.chipYaziAktif]}>{kat.ad}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

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
            <View>
              {/* Ana Kategori Kartı */}
              <View style={styles.kategoriKart}>
                <Text style={styles.kategoriAd}>📁 {item.ad}</Text>
                <TouchableOpacity 
                  style={styles.silButon} 
                  onPress={() => kategoriSil(item.id)}
                >
                  <Ionicons name="trash-outline" size={22} color="#EF233C" />
                </TouchableOpacity>
              </View>

              {/* Varsa Alt Kategorileri Listele */}
              {item.altKategoriler && item.altKategoriler.map((alt) => (
                <View key={alt.id} style={styles.altKategoriKart}>
                  <Text style={styles.altKategoriAd}>↳ 🏷️ {alt.ad}</Text>
                  <TouchableOpacity 
                    style={styles.silButon} 
                    onPress={() => kategoriSil(alt.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF233C" />
                  </TouchableOpacity>
                </View>
              ))}
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
  ekleAlani: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  input: { backgroundColor: '#F8F9FA', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA', fontSize: 15, marginBottom: 12 },
  ustSecimContainer: { marginBottom: 12 },
  ustSecimBaslik: { fontSize: 12, color: '#8E8E93', marginBottom: 6, fontWeight: '500' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#F2F2F7', borderWidth: 1, borderColor: '#E5E5EA' },
  chipAktif: { backgroundColor: '#FFF0E6', borderColor: '#FF9F00' },
  chipYazi: { fontSize: 13, color: '#3A3A3C' },
  chipYaziAktif: { color: '#FF9F00', fontWeight: 'bold' },
  ekleButon: { backgroundColor: '#FF9F00', padding: 15, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  ekleButonYazi: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  liste: { padding: 20 },
  kategoriKart: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 8, 
    borderWidth: 1, 
    borderColor: '#E5E5EA',
    elevation: 1
  },
  kategoriAd: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  altKategoriKart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
    padding: 12,
    borderRadius: 10,
    marginLeft: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EFEFF4'
  },
  altKategoriAd: { fontSize: 14, color: '#3A3A3C', fontWeight: '500' },
  silButon: { padding: 5 },
  bosListe: { textAlign: 'center', color: '#8E8E93', marginTop: 50 }
});