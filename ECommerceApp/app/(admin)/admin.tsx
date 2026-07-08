import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import api from '../../config/api';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ toplamUrun: 0, toplamKullanici: 0, bekleyenSiparisler: 0 });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
      useCallback(() => {
        fetchDashboardVerileri();
      }, [])
    );

  const fetchDashboardVerileri = async () => {
    try {
      const response = await api.get('/admin/dashboard'); 
      setStats(response.data);
    } catch (error) {
      console.error("Dashboard verisi çekilirken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- OTURUMU KAPATMA FONKSİYONU ---
  const oturumuKapat = async () => {
    try {
      // Verileri sil
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userRole');
      
      // router.replace ile tab'ların kök dizinine yönlendiriyoruz.
      router.replace('/' as any); 
      
    } catch (error) {
      console.error("Çıkış yapılırken hata:", error);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ÜST BANNER / BAŞLIK (ÇIKIŞ BUTONU BURAYA EKLENDİ) */}
      <View style={styles.headerBanner}>
        <View>
          <Text style={styles.welcomeText}>Hoş Geldiniz,</Text>
          <Text style={styles.headerTitle}>Yönetim Paneli</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#FF9F00" />
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>
          {/* Çıkış İkon Butonu */}
          <TouchableOpacity style={styles.logoutButton} onPress={oturumuKapat}>
            <Ionicons name="log-out-outline" size={24} color="#EF233C" />
          </TouchableOpacity>
        </View>
      </View>

      {/* İSTATİSTİK KARTLARI GRİD YAPISI */}
      <Text style={styles.sectionTitle}>Genel Bakış</Text>
      <View style={styles.statsGrid}>
        
        {/* KULLANICI KARTI */}
        <View style={[styles.card, { borderLeftColor: '#4EA8DE' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#E1F5FE' }]}>
              <Ionicons name="people" size={24} color="#4EA8DE" />
            </View>
          </View>
          <Text style={styles.cardValue}>{stats.toplamKullanici}</Text>
          <Text style={styles.cardLabel}>Toplam Kullanıcı</Text>
        </View>

        {/* ÜRÜN KARTI */}
        <View style={[styles.card, { borderLeftColor: '#70E000' }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="cube" size={24} color="#70E000" />
            </View>
          </View>
          <Text style={styles.cardValue}>{stats.toplamUrun}</Text>
          <Text style={styles.cardLabel}>Aktif Ürün</Text>
        </View>

      </View>

      {/* AKTİF SİPARİŞ KARTI */}
      <TouchableOpacity 
        style={[styles.longCard, { borderLeftColor: '#FF9F00' }]}
        activeOpacity={0.8}
        onPress={() => router.push('/admin-siparisler' as any)} // Siparişler ekranına yönlendirir
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.iconContainer, { backgroundColor: '#FFF4E5' }]}>
            <Ionicons name="cart" size={24} color="#FF9F00" />
          </View>
          <View style={{ marginLeft: 15 }}>
            <Text style={styles.longCardLabel}>Bekleyen Siparişler</Text>
            {/* Alt yazıyı güncelledik */}
            <Text style={styles.longCardSub}>Siparişleri yönetmek için dokunun</Text> 
          </View>
        </View>
        <Text style={[styles.cardValue, { color: '#FF9F00' }]}>{stats.bekleyenSiparisler || 0}</Text>
      </TouchableOpacity>

      {/* HIZLI İŞLEMLER / MENÜ */}
      <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
      <View style={styles.menuContainer}>
        
        {/* ÜRÜN YÖNETİMİ */}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/admin-urunler' as any)}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconBox, { backgroundColor: '#FFF4E5' }]}>
              <Ionicons name="settings" size={22} color="#FF9F00" />
            </View>
            <Text style={styles.menuItemText}>Ürün Yönetimi</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#BFBFBF" />
        </TouchableOpacity>

        {/* SİPARİŞ YÖNETİMİ */}
        <TouchableOpacity 
          style={[styles.menuItem, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5EA' }]}
          onPress={() => router.push('/admin-siparisler' as any)}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconBox, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="receipt" size={22} color="#28A745" />
            </View>
            <Text style={styles.menuItemText}>Sipariş Yönetimi</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#BFBFBF" />
        </TouchableOpacity>

        {/* DESTEK YÖNETİMİ */}
        <TouchableOpacity 
          style={[styles.menuItem, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5EA' }]}
          onPress={() => router.push('/(admin)/admindestek' as any)}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconBox, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="chatbubbles" size={22} color="#7B1FA2" />
            </View>
            <Text style={styles.menuItemText}>Destek Yönetimi</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#BFBFBF" />
        </TouchableOpacity>

        {/* KULLANICI YÖNETİMİ (YENİ EKLENDİ - SADECE LİSTELEME) */}
        <TouchableOpacity 
          style={[styles.menuItem, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5EA' }]}
          onPress={() => router.push('/admin-kullanicilar' as any)}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconBox, { backgroundColor: '#E1F5FE' }]}>
              <Ionicons name="people" size={22} color="#4EA8DE" />
            </View>
            <Text style={styles.menuItemText}>Kullanıcı Yönetimi</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#BFBFBF" />
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  headerBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 25,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 12,
  },
  adminBadgeText: {
    color: '#FF9F00',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#FFEBEA', 
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 15,
    marginTop: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: (width - 55) / 2,
    padding: 16,
    borderRadius: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 10,
  },
  cardValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  cardLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
    fontWeight: '500',
  },
  longCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderLeftWidth: 4,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  longCardLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  longCardSub: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconBox: {
    padding: 8,
    borderRadius: 8,
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  disabledMenu: {
    opacity: 0.6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
});