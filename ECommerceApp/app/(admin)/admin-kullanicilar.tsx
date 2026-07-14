import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../config/api';

export default function AdminKullanicilar() {
  const router = useRouter();
  
  const [kullanicilar, setKullanicilar] = useState<any[]>([]);
  const [filtrelenmisKullanicilar, setFiltrelenmisKullanicilar] = useState<any[]>([]);
  const [aramaMetni, setAramaMetni] = useState('');
  const [aktifSekme, setAktifSekme] = useState<'Tümü' | 'Aktif' | 'Pasif'>('Tümü');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    kullanicileriGetir();
  }, []);

  const kullanicileriGetir = async () => {
    try {
      const response = await api.get('/kullanicilar'); 
      setKullanicilar(response.data);
      filtreleUygula(aramaMetni, aktifSekme, response.data);
    } catch (error) {
      console.error("Kullanıcılar çekilirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  // Hem metin hem sekme durumuna göre dinamik filtreleme
  const filtreleUygula = (text: string, sekme: string, data: any[]) => {
    let sonuc = data;

    // Durum Filtresi
    if (sekme === 'Aktif') sonuc = sonuc.filter(k => !k.isDeleted);
    if (sekme === 'Pasif') sonuc = sonuc.filter(k => k.isDeleted);

    // Metin Filtresi
    if (text) {
      const aranan = text.toLowerCase();
      sonuc = sonuc.filter(k =>
        (k.adSoyad && k.adSoyad.toLowerCase().includes(aranan)) ||
        (k.email && k.email.toLowerCase().includes(aranan))
      );
    }

    setFiltrelenmisKullanicilar(sonuc);
  };

  const handleArama = (text: string) => {
    setAramaMetni(text);
    filtreleUygula(text, aktifSekme, kullanicilar);
  };

  const handleSekmeDegistir = (sekme: 'Tümü' | 'Aktif' | 'Pasif') => {
    setAktifSekme(sekme);
    filtreleUygula(aramaMetni, sekme, kullanicilar);
  };

  const kullaniciDurumDegistir = async (id: number, adSoyad: string, suAnkiDurum: boolean) => {
    const islemAdi = suAnkiDurum ? 'Aktifleştir' : 'Askıya Al';
    const mesaj = suAnkiDurum 
      ? `${adSoyad} adlı kullanıcının giriş engelini kaldırmak istiyor musunuz?`
      : `${adSoyad} adlı kullanıcıyı askıya almak istiyor musunuz?`;

    Alert.alert(`${islemAdi}`, mesaj, [
      { text: "Vazgeç", style: "cancel" },
      { 
        text: "Onayla", 
        style: suAnkiDurum ? "default" : "destructive",
        onPress: async () => {
          try {
            if (suAnkiDurum) {
              await api.put(`/admin/aktiflestir/${id}`);
            } else {
              await api.delete(`/admin/sil/${id}`);
            }
            
            // Listeyi güncelle ve filtreleri tekrar uygula
            const guncelListe = kullanicilar.map(k => k.id === id ? { ...k, isDeleted: !suAnkiDurum } : k);
            setKullanicilar(guncelListe);
            filtreleUygula(aramaMetni, aktifSekme, guncelListe);
            
            Alert.alert("Başarılı", `Kullanıcı başarıyla ${suAnkiDurum ? 'aktifleştirildi' : 'askıya alındı'}.`);
          } catch (error: any) {
            Alert.alert("Hata", "İşlem başarısız oldu.");
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.userCard, item.isDeleted && styles.pasifCard]}>
      <View style={[styles.userIconContainer, item.isDeleted && { backgroundColor: '#F0F0F0' }]}>
        <Ionicons name="person" size={24} color={item.isDeleted ? "#A0A0A0" : "#4EA8DE"} />
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, item.isDeleted && { color: '#8E8E93', textDecorationLine: 'line-through' }]}>
          {item.adSoyad || 'İsimsiz Kullanıcı'}
        </Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userDate}>Kayıt: {new Date(item.olusturulmaTarihi).toLocaleDateString('tr-TR')}</Text>
      </View>
      
      <View style={styles.rightActions}>
        <View style={[styles.roleBadge, item.isDeleted && { backgroundColor: '#F2F2F7' }]}>
          <Text style={[styles.roleText, item.isDeleted && { color: '#8E8E93' }]}>
            {item.isDeleted ? 'PASİF' : item.rol}
          </Text>
        </View>
        
        {/* EĞER KULLANICI ADMİNSE SİLME BUTONUNU GÖSTERME, KALKAN GÖSTER */}
        {item.rol === 'Admin' ? (
          <View style={{ padding: 8, opacity: 0.5 }}>
            <Ionicons name="shield-checkmark" size={20} color="#4EA8DE" />
          </View>
        ) : item.isDeleted ? (
          <TouchableOpacity style={styles.activateButton} onPress={() => kullaniciDurumDegistir(item.id, item.adSoyad, true)}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#28A745" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.deleteButton} onPress={() => kullaniciDurumDegistir(item.id, item.adSoyad, false)}>
            <Ionicons name="trash-outline" size={20} color="#FF4757" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kullanıcı Yönetimi</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="İsim veya e-posta ile ara..."
          value={aramaMetni}
          onChangeText={handleArama}
          autoCapitalize="none"
        />
      </View>

      {/* SEKMELER (TÜMÜ / AKTİF / PASİF) */}
      <View style={styles.tabContainer}>
        {['Tümü', 'Aktif', 'Pasif'].map((sekme) => (
          <TouchableOpacity 
            key={sekme}
            style={[styles.tabButton, aktifSekme === sekme && styles.activeTab]}
            onPress={() => handleSekmeDegistir(sekme as any)}
          >
            <Text style={[styles.tabText, aktifSekme === sekme && styles.activeTabText]}>{sekme}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#4EA8DE" /></View>
      ) : (
        <FlatList
          data={filtrelenmisKullanicilar} 
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>Kullanıcı bulunamadı.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E5E5EA' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  backButton: { padding: 5 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 20, marginTop: 15, borderRadius: 12, paddingHorizontal: 15, height: 50, elevation: 3 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginVertical: 15, gap: 10 },
  tabButton: { flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: '#E5E5EA', borderRadius: 8 },
  activeTab: { backgroundColor: '#1C1C1E' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
  activeTabText: { color: '#FFF' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 18, borderRadius: 16, marginBottom: 15, elevation: 2 },
  pasifCard: { opacity: 0.65, backgroundColor: '#F9F9F9' }, // Pasif durumu için silik stil
  userIconContainer: { backgroundColor: '#E1F5FE', padding: 10, borderRadius: 50, marginRight: 15 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '700' },
  userEmail: { fontSize: 13, color: '#8E8E93' },
  userDate: { fontSize: 11, color: '#BFBFBF', marginTop: 4 },
  rightActions: { alignItems: 'flex-end', justifyContent: 'center' },
  roleBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginBottom: 5 },
  roleText: { fontSize: 11, color: '#28A745', fontWeight: '700' },
  deleteButton: { padding: 8, backgroundColor: '#FFF0F0', borderRadius: 8 },
  activateButton: { padding: 8, backgroundColor: '#E8F5E9', borderRadius: 8 },
  emptyText: { textAlign: 'center', color: '#8E8E93', marginTop: 40 }
});