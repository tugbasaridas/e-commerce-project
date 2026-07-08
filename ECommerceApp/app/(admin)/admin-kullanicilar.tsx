import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../config/api';

export default function AdminKullanicilar() {
  const router = useRouter();
  
  // Orijinal listeyi tuttuğumuz state
  const [kullanicilar, setKullanicilar] = useState<any[]>([]);
  // Ekranda gösterilecek filtrelenmiş listeyi tuttuğumuz state
  const [filtrelenmisKullanicilar, setFiltrelenmisKullanicilar] = useState<any[]>([]);
  
  const [aramaMetni, setAramaMetni] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    kullanicileriGetir();
  }, []);

  const kullanicileriGetir = async () => {
    try {
      const response = await api.get('/kullanicilar'); 
      setKullanicilar(response.data);
      setFiltrelenmisKullanicilar(response.data); // İlk açılışta herkesi göster
    } catch (error) {
      console.error("Kullanıcılar çekilirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  // Arama kutusuna yazı yazıldıkça tetiklenen fonksiyon
  const aramaYap = (text: string) => {
    setAramaMetni(text);
    
    if (text) {
      const kucukHarfMetin = text.toLowerCase();
      const filtrelenmisData = kullanicilar.filter(item => {
        const isimMatch = item.adSoyad ? item.adSoyad.toLowerCase().includes(kucukHarfMetin) : false;
        const emailMatch = item.email ? item.email.toLowerCase().includes(kucukHarfMetin) : false;
        
        return isimMatch || emailMatch; // İsimde VEYA emailde geçiyorsa göster
      });
      setFiltrelenmisKullanicilar(filtrelenmisData);
    } else {
      // Arama kutusu boşaldıysa tüm listeyi geri getir
      setFiltrelenmisKullanicilar(kullanicilar);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.userCard}>
      <View style={styles.userIconContainer}>
        <Ionicons name="person" size={24} color="#4EA8DE" />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.adSoyad || 'İsimsiz Kullanıcı'}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userDate}>
          Kayıt: {new Date(item.olusturulmaTarihi).toLocaleDateString('tr-TR')}
        </Text>
      </View>
      <View style={styles.roleBadge}>
        <Text style={styles.roleText}>{item.rol}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ÜST BİLGİ VE GERİ BUTONU */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kullanıcı Listesi</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* ARAMA ÇUBUĞU */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="İsim veya e-posta ile ara..."
          placeholderTextColor="#8E8E93"
          value={aramaMetni}
          onChangeText={aramaYap}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {/* Metin varsa çarpı butonunu göster, tıklanınca aramayı temizle */}
        {aramaMetni.length > 0 && (
          <TouchableOpacity onPress={() => aramaYap('')} style={styles.clearIcon}>
            <Ionicons name="close-circle" size={20} color="#BFBFBF" />
          </TouchableOpacity>
        )}
      </View>

      {/* LİSTE VEYA YÜKLENİYOR İKONU */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4EA8DE" />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }} // Listenin ekranı tam kaplamasını garantiler
          data={filtrelenmisKullanicilar} 
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {aramaMetni.length > 0 
                ? "Aradığınız kritere uygun kullanıcı bulunamadı." 
                : "Henüz sistemde kullanıcı bulunmuyor."}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20, // Başlığı bir tık daha belirgin yaptık
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 15,
    marginTop: 15,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, // Gölgeyi uyumlu hale getirdik
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
  },
  clearIcon: {
    padding: 5,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 5, 
    paddingBottom: 120, 
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 18, 
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  userIconContainer: {
    backgroundColor: '#E1F5FE',
    padding: 10,
    borderRadius: 50,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700', 
    color: '#1C1C1E',
  },
  userEmail: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
    fontWeight: '500',
  },
  userDate: {
    fontSize: 11,
    color: '#BFBFBF',
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20, 
  },
  roleText: {
    fontSize: 11,
    color: '#28A745',
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: '#8E8E93',
    marginTop: 40,
  }
});