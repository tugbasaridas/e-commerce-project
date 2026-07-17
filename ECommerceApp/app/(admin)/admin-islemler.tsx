import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function AdminIslemler() {
  const router = useRouter();

  const cikisYap = async () => {
    Alert.alert(
      "Çıkış Yap",
      "Yönetici hesabınızdan çıkış yapmak istediğinize emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        { 
          text: "Çıkış Yap", 
          style: "destructive",
          onPress: async () => {
            try {
              // Hafızadaki tüm kullanıcı bilgilerini temizle
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userRole');
              await AsyncStorage.removeItem('userId');
              await AsyncStorage.removeItem('adSoyad');
              
              // Giriş sayfasına yönlendir
              router.replace('/'); 
            } catch (error) {
              console.error("Çıkış yapılırken hata:", error);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* BAŞLIK ALANI VE ÜST BUTONLAR */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {/* Sol Üst: Geri Butonu */}
          <TouchableOpacity style={styles.geriButon} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="#1C1C1E" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Hızlı İşlemler</Text>
          
          {/* Sağ Üst: Çıkış Yap Butonu */}
          <TouchableOpacity style={styles.cikisButon} onPress={cikisYap}>
            <Ionicons name="log-out-outline" size={26} color="#EF233C" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Tüm mağaza operasyonlarını tek bir yerden yönetin.</Text>
      </View>

      <View style={styles.gridContainer}>
        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push('/admin-siparisler' as any)}>
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF4E5' }]}>
              <Ionicons name="cart" size={26} color="#FF9F00" />
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D1D6" />
          </View>
          <Text style={styles.cardTitle}>Siparişler</Text>
          <Text style={styles.cardDesc}>Bekleyen ve tamamlanan siparişleri yönet</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push('/admin-urunler' as any)}>
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: '#E1F5FE' }]}>
              <Ionicons name="cube" size={26} color="#4EA8DE" />
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D1D6" />
          </View>
          <Text style={styles.cardTitle}>Ürün Yönetimi</Text>
          <Text style={styles.cardDesc}>Mağazaya yeni ürün ekle, düzenle veya sil</Text>
        </TouchableOpacity>

        {/* DÜZELTİLDİ: Artık /admin-stok-yonetimi sayfasına gidiyor */}
        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push('/admin-stok-yonetimi' as any)}>
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: '#FFEBEA' }]}>
              <Ionicons name="warning" size={26} color="#EF233C" />
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D1D6" />
          </View>
          <Text style={styles.cardTitle}>Stok Yönetimi</Text>
          <Text style={styles.cardDesc}>Kritik seviyedeki stokları takip et ve güncelle</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push('/admindestek' as any)}>
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="chatbubbles" size={26} color="#28A745" />
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D1D6" />
          </View>
          <Text style={styles.cardTitle}>Müşteri Destek</Text>
          <Text style={styles.cardDesc}>Gelen soruları ve talepleri anında yanıtla</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push('/admin-kullanicilar' as any)}>
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="people" size={26} color="#9C27B0" />
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D1D6" />
          </View>
          <Text style={styles.cardTitle}>Kullanıcılar</Text>
          <Text style={styles.cardDesc}>Müşteri hesaplarını yönet, askıya al veya sil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push('/admin-kategoriler' as any)}>
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: '#FCE4EC' }]}>
              <Ionicons name="list" size={26} color="#E91E63" />
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D1D6" />
          </View>
          <Text style={styles.cardTitle}>Kategoriler</Text>
          <Text style={styles.cardDesc}>Mağaza kategorilerini oluştur ve düzenle</Text>
        </TouchableOpacity>
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  header: { 
    paddingHorizontal: 20, 
    paddingTop: 60, 
    paddingBottom: 20, 
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0' 
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  geriButon: {
    padding: 4,
    marginLeft: -4
  },
  cikisButon: {
    padding: 4,
    marginRight: -4
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#1C1C1E' 
  },
  headerSubtitle: { 
    fontSize: 14, 
    color: '#8E8E93'
  },
  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 20, 
    justifyContent: 'space-between' 
  },
  card: { 
    backgroundColor: '#FFFFFF', 
    width: (width - 55) / 2, 
    padding: 16, 
    borderRadius: 20, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: '#E5E5EA', 
    shadowColor: '#1C1C1E', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.04, 
    shadowRadius: 10, 
    elevation: 2 
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  iconBox: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#1C1C1E', 
    marginBottom: 6 
  },
  cardDesc: { 
    fontSize: 12, 
    color: '#8E8E93', 
    lineHeight: 18 
  }
});